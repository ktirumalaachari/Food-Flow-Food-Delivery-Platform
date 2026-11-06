import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getOrdersCollection, getCartCollection } from "@/lib/db";
import { verifyRazorpayPaymentSignature, getRazorpayInstance } from "@/lib/razorpay";
import { sendOrderConfirmationEmail } from "@/lib/email";

export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: req.headers,
    });

    const body = await req.json();
    const { orderId, razorpay_order_id, razorpay_payment_id, razorpay_signature } = body;

    if (!orderId || !razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json(
        { success: false, message: "Missing required Razorpay verification parameters." },
        { status: 400 }
      );
    }

    // Verify HMAC-SHA256 signature
    const isValid = verifyRazorpayPaymentSignature({
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    });

    if (!isValid) {
      return NextResponse.json(
        { success: false, message: "Invalid Razorpay payment signature. Payment verification failed." },
        { status: 400 }
      );
    }

    const ordersCol = await getOrdersCollection();
    const cartCol = await getCartCollection();

    // Find order by orderId or razorpayOrderId
    const order = await ordersCol.findOne({
      $or: [{ orderId }, { razorpayOrderId: razorpay_order_id }],
    });

    if (!order) {
      return NextResponse.json(
        { success: false, message: "Order record not found." },
        { status: 404 }
      );
    }

    // Update order status in MongoDB
    const now = new Date().toISOString();
    await ordersCol.updateOne(
      { _id: order._id },
      {
        $set: {
          paymentStatus: "Paid",
          orderStatus: "Confirmed",
          razorpayPaymentId: razorpay_payment_id,
          razorpaySignature: razorpay_signature,
          updatedAt: now,
        },
      }
    );

    // Clear user cart
    if (order.userId) {
      try {
        await cartCol.deleteOne({ userId: order.userId });
      } catch (cartErr) {
        console.warn("Failed to clear cart after Razorpay verification:", cartErr);
      }
    }

    // Trigger instant Order Confirmation Email with PDF invoice
    const updatedOrder = {
      ...order,
      paymentStatus: "Paid",
      orderStatus: "Confirmed",
      razorpayPaymentId: razorpay_payment_id,
      updatedAt: now,
    };

    sendOrderConfirmationEmail(updatedOrder as any)
      .then(() =>
        ordersCol.updateOne({ _id: order._id }, { $set: { confirmationEmailSent: true } })
      )
      .catch((e) => console.warn("Razorpay confirmation email trigger error:", e));

    return NextResponse.json({
      success: true,
      message: "Razorpay payment verified and order confirmed successfully!",
      orderId: order.orderId,
      paymentId: razorpay_payment_id,
      data: updatedOrder,
    });
  } catch (error: any) {
    console.error("Error verifying Razorpay payment:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to verify Razorpay payment." },
      { status: 500 }
    );
  }
}
