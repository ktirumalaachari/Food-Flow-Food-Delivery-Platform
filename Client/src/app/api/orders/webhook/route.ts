import { NextRequest, NextResponse } from "next/server";
import { getOrdersCollection, getCartCollection } from "@/lib/db";
import { verifyRazorpayWebhookSignature } from "@/lib/razorpay";
import { sendOrderConfirmationEmail } from "@/lib/email";

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get("x-razorpay-signature");

    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || "";

    // If webhook secret is configured, verify HMAC SHA-256 signature
    if (webhookSecret && signature) {
      const isValid = verifyRazorpayWebhookSignature(rawBody, signature, webhookSecret);
      if (!isValid) {
        console.error("Razorpay Webhook signature verification failed.");
        return NextResponse.json(
          { success: false, message: "Invalid Razorpay webhook signature." },
          { status: 400 }
        );
      }
    }

    let payload: any;
    try {
      payload = JSON.parse(rawBody);
    } catch {
      return NextResponse.json(
        { success: false, message: "Invalid JSON payload." },
        { status: 400 }
      );
    }

    const event = payload?.event;
    console.log(`📡 Received Razorpay Webhook Event: ${event}`);

    // Handle payment capture / order paid events
    if (event === "order.paid" || event === "payment.captured") {
      const paymentEntity = payload?.payload?.payment?.entity;
      const orderEntity = payload?.payload?.order?.entity;

      const razorpayOrderId = paymentEntity?.order_id || orderEntity?.id;
      const razorpayPaymentId = paymentEntity?.id;
      const orderId =
        orderEntity?.receipt ||
        paymentEntity?.notes?.orderId ||
        orderEntity?.notes?.orderId;
      const userId = paymentEntity?.notes?.userId || orderEntity?.notes?.userId;

      const ordersCol = await getOrdersCollection();
      const cartCol = await getCartCollection();

      const queryConditions: any[] = [];
      if (orderId) queryConditions.push({ orderId });
      if (razorpayOrderId) queryConditions.push({ razorpayOrderId });

      if (queryConditions.length > 0) {
        const order = await ordersCol.findOne({ $or: queryConditions });

        if (order) {
          const now = new Date().toISOString();
          // Update MongoDB order status: paymentStatus = Paid, orderStatus = Confirmed
          await ordersCol.updateOne(
            { _id: order._id },
            {
              $set: {
                paymentStatus: "Paid",
                orderStatus: "Confirmed",
                razorpayPaymentId: razorpayPaymentId || order.razorpayPaymentId,
                updatedAt: now,
              },
            }
          );

          if (order.confirmationEmailSent !== true) {
            sendOrderConfirmationEmail({
              ...order,
              paymentStatus: "Paid",
              orderStatus: "Confirmed",
              razorpayPaymentId: razorpayPaymentId || order.razorpayPaymentId,
            } as any)
              .then(() =>
                ordersCol.updateOne({ _id: order._id }, { $set: { confirmationEmailSent: true } })
              )
              .catch((e) => console.warn("Razorpay webhook email send error:", e));
          }

          // Clear cart in MongoDB
          const effectiveUserId = userId || order.userId;
          if (effectiveUserId) {
            await cartCol.deleteOne({ userId: effectiveUserId }).catch(() => {});
          }

          console.log(`✅ Order ${order.orderId} updated to Paid & Confirmed via Razorpay Webhook.`);
        }
      }
    }

    return NextResponse.json({ status: "ok", received: true });
  } catch (error: any) {
    console.error("Razorpay Webhook processing error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Razorpay webhook handler error." },
      { status: 500 }
    );
  }
}
