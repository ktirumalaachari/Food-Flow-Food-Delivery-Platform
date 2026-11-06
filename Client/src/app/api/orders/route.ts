import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getOrdersCollection, getCartCollection, getSettingsCollection, getCouponsCollection } from "@/lib/db";
import { getRazorpayInstance, isValidRazorpayKey } from "@/lib/razorpay";
import { sendOrderConfirmationEmail } from "@/lib/email";

export async function POST(req: NextRequest) {
  try {
    // 1. Session Authentication via Better Auth
    let sessionUser: { id?: string; email?: string; name?: string } | null = null;

    try {
      const session = await auth.api.getSession({
        headers: req.headers,
      });
      if (session?.user) {
        sessionUser = session.user;
      }
    } catch (err) {
      console.warn("Better Auth session check fallback:", err);
    }

    // Fallback to x-user-id header if needed
    const userIdHeader = req.headers.get("x-user-id");
    const userEmailHeader = req.headers.get("x-user-email");

    const userId = sessionUser?.id || userIdHeader;
    const userEmail = sessionUser?.email || userEmailHeader;
    const userName = sessionUser?.name || "Customer";

    if (!userId || !userEmail) {
      return NextResponse.json(
        { success: false, message: "Unauthorized. Please log in." },
        { status: 401 }
      );
    }

    // 2. Request Payload & Validation
    const body = await req.json();
    const { items, deliveryAddress, paymentMethod, subtotal, deliveryFee, discount, couponCode, totalAmount } = body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { success: false, message: "Cart is empty. Please add items to checkout." },
        { status: 400 }
      );
    }

    if (!deliveryAddress || !deliveryAddress.streetAddress || !deliveryAddress.fullName) {
      return NextResponse.json(
        { success: false, message: "Valid delivery address is required." },
        { status: 400 }
      );
    }

    if (!paymentMethod || (paymentMethod !== "COD" && paymentMethod !== "RAZORPAY" && paymentMethod !== "STRIPE")) {
      return NextResponse.json(
        { success: false, message: "Invalid payment method. Choose COD or RAZORPAY." },
        { status: 400 }
      );
    }
    const normalizedPaymentMethod = (paymentMethod === "STRIPE" ? "RAZORPAY" : paymentMethod) as "COD" | "RAZORPAY";

    // 3. Create Order Document & Financial Settlement Calculations
    const ordersCol = await getOrdersCollection();
    const cartCol = await getCartCollection();
    const settingsCol = await getSettingsCollection();
    const couponsCol = await getCouponsCollection();

    // Fetch active platform settings
    const settings = await settingsCol.findOne({ key: "global_settings" });
    const vatPercentage = Number(settings?.vatPercentage ?? 5);
    const restaurantCommissionPercentage = Number(settings?.restaurantCommissionPercentage ?? 15);
    const riderCommissionPercentage = Number(settings?.riderCommissionPercentage ?? 100);

    const numSubtotal = Number(subtotal) || 0;
    const numDeliveryFee = Number(deliveryFee) || 0;
    const numDiscount = Number(discount) || 0;
    const formattedCouponCode = couponCode ? String(couponCode).trim().toUpperCase() : null;

    // Check first-order coupon restriction if coupon applied
    let isFirstOrderDiscount = false;
    if (formattedCouponCode) {
      const couponDoc = await couponsCol.findOne({ code: formattedCouponCode });
      if (couponDoc?.isFirstOrderOnly) {
        isFirstOrderDiscount = true;
        const priorOrder = await ordersCol.findOne({
          userId,
          orderStatus: { $ne: "Cancelled" },
        });
        if (priorOrder) {
          return NextResponse.json(
            {
              success: false,
              message: "This welcome coupon is valid exclusively for your first successful order!",
            },
            { status: 400 }
          );
        }
      }
    }

    // Financial split & settlement calculations
    const vatAmount = Math.round(numSubtotal * (vatPercentage / 100) * 100) / 100;
    const adminGrossCommission = Math.round(numSubtotal * (restaurantCommissionPercentage / 100) * 100) / 100;
    // Coupon discount is subtracted strictly from Admin Commission
    const adminNetProfit = Math.round((adminGrossCommission - numDiscount) * 100) / 100;
    // Restaurant payout is Subtotal - Gross Commission (100% earnings protected)
    const restaurantPayout = Math.round((numSubtotal - adminGrossCommission) * 100) / 100;
    // Rider payout
    const riderPayout = Math.round((numDeliveryFee * (riderCommissionPercentage / 100)) * 100) / 100;
    const taxFundVat = vatAmount;

    const calculatedTotal = numSubtotal + vatAmount + numDeliveryFee - numDiscount;
    const finalTotalAmount = totalAmount ? Number(totalAmount) : Math.max(0, calculatedTotal);

    const timestamp = Date.now();
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const orderId = `FF-${timestamp.toString().slice(-6)}-${randomSuffix}`;

    const orderDoc: any = {
      orderId,
      userId,
      userEmail,
      userName,
      items,
      deliveryAddress,
      subtotal: numSubtotal,
      vatPercentage,
      vatAmount,
      deliveryFee: numDeliveryFee,
      couponCode: formattedCouponCode,
      discount: numDiscount,
      isFirstOrderDiscount,
      totalAmount: finalTotalAmount,
      restaurantCommissionPercentage,
      adminGrossCommission,
      adminNetProfit,
      restaurantPayout,
      riderPayout,
      taxFundVat,
      paymentMethod: normalizedPaymentMethod,
      paymentStatus: "Pending",
      orderStatus: "Placed",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const insertResult = await ordersCol.insertOne(orderDoc);
    const mongoId = insertResult.insertedId.toString();

    // 4. Handle Payment Method Flows
    if (normalizedPaymentMethod === "COD") {
      // Clear Cart on COD success
      await cartCol.deleteOne({ userId });

      // Trigger instant Order Confirmation Email
      sendOrderConfirmationEmail({ ...orderDoc, _id: mongoId } as any)
        .then(() => ordersCol.updateOne({ _id: insertResult.insertedId }, { $set: { confirmationEmailSent: true } }))
        .catch((e) => console.warn("Background order confirmation email trigger error:", e));

      return NextResponse.json({
        success: true,
        message: "Order placed successfully with Cash on Delivery!",
        orderId,
        mongoId,
        redirectUrl: `/order-tracking/${orderId}`,
        data: { ...orderDoc, _id: mongoId, confirmationEmailSent: true },
      });
    }


    if (normalizedPaymentMethod === "RAZORPAY") {
      const razorpayInstance = getRazorpayInstance();
      const isMockKey =
        (process.env.RAZORPAY_KEY_ID || "").toLowerCase().includes("mock") ||
        (process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "").toLowerCase().includes("mock");

      if (razorpayInstance && !isMockKey) {
        try {
          const rzpOrder = await razorpayInstance.orders.create({
            amount: Math.round(finalTotalAmount * 100), // Razorpay amount in paise (1 INR = 100 paise)
            currency: "INR",
            receipt: orderId,
            notes: {
              orderId,
              mongoId,
              userId,
              userEmail,
            },
          });

          // Store razorpayOrderId on saved MongoDB order document
          await ordersCol.updateOne(
            { _id: insertResult.insertedId },
            { $set: { razorpayOrderId: rzpOrder.id, updatedAt: new Date().toISOString() } }
          );

          return NextResponse.json({
            success: true,
            message: "Razorpay order initiated successfully.",
            orderId,
            mongoId,
            razorpayOrder: {
              id: rzpOrder.id,
              amount: rzpOrder.amount,
              currency: rzpOrder.currency,
              keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID || "",
            },
            data: { ...orderDoc, _id: mongoId, razorpayOrderId: rzpOrder.id },
          });
        } catch (rzpErr: any) {
          console.warn("Razorpay API call failed, evaluating sandbox fallback:", rzpErr);
          if (process.env.NODE_ENV !== "production") {
            const mockOrderId = `order_mock_${Date.now()}`;
            await ordersCol.updateOne(
              { _id: insertResult.insertedId },
              { $set: { razorpayOrderId: mockOrderId, updatedAt: new Date().toISOString() } }
            );

            return NextResponse.json({
              success: true,
              message: "Razorpay sandbox test order initialized.",
              orderId,
              mongoId,
              razorpayOrder: {
                id: mockOrderId,
                amount: Math.round(finalTotalAmount * 100),
                currency: "INR",
                keyId: "rzp_test_mock_sandbox",
              },
              data: { ...orderDoc, _id: mongoId, razorpayOrderId: mockOrderId },
            });
          }

          return NextResponse.json(
            {
              success: false,
              message:
                rzpErr.message ||
                "Failed to initialize Razorpay checkout. Please verify your RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in .env.",
            },
            { status: 400 }
          );
        }
      } else {
        // Dev sandbox mode for seamless local testing
        const mockOrderId = `order_mock_${Date.now()}`;
        await ordersCol.updateOne(
          { _id: insertResult.insertedId },
          { $set: { razorpayOrderId: mockOrderId, updatedAt: new Date().toISOString() } }
        );

        return NextResponse.json({
          success: true,
          message: "Razorpay test order initialized (sandbox mode).",
          orderId,
          mongoId,
          razorpayOrder: {
            id: mockOrderId,
            amount: Math.round(finalTotalAmount * 100),
            currency: "INR",
            keyId: "rzp_test_mock_sandbox",
          },
          data: { ...orderDoc, _id: mongoId, razorpayOrderId: mockOrderId },
        });
      }
    }

    return NextResponse.json(
      { success: false, message: "Invalid request payload." },
      { status: 400 }
    );
  } catch (error: any) {
    console.error("Error creating order:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to process order." },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    let userId = searchParams.get("userId") || req.headers.get("x-user-id");

    if (!userId) {
      try {
        const session = await auth.api.getSession({
          headers: req.headers,
        });
        if (session?.user?.id) {
          userId = session.user.id;
        }
      } catch (err) {
        console.warn("Session check fallback in GET /api/orders:", err);
      }
    }

    if (!userId) {
      return NextResponse.json({
        success: true,
        data: [],
      });
    }

    const ordersCol = await getOrdersCollection();
    const orders = await ordersCol
      .find({ userId, isDeleted: { $ne: true } })
      .sort({ createdAt: -1 })
      .toArray();

    return NextResponse.json({
      success: true,
      data: orders,
    });
  } catch (error: any) {
    console.error("Error fetching orders:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to fetch orders." },
      { status: 500 }
    );
  }
}
