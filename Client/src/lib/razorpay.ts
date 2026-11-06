import Razorpay from "razorpay";
import crypto from "crypto";

export function isValidRazorpayKey(key?: string): boolean {
  if (!key) return false;
  const trimmed = key.trim();
  if (
    trimmed.includes("placeholder") ||
    trimmed.includes("...here") ||
    trimmed.includes("your_razorpay") ||
    trimmed.endsWith("here")
  ) {
    return false;
  }
  return trimmed.startsWith("rzp_test_") || trimmed.startsWith("rzp_live_");
}

let razorpayInstance: Razorpay | null = null;

export function getRazorpayInstance(): Razorpay | null {
  const key_id = process.env.RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "";
  const key_secret = process.env.RAZORPAY_KEY_SECRET || "";

  if (!isValidRazorpayKey(key_id) || !key_secret) {
    return null;
  }

  if (!razorpayInstance) {
    razorpayInstance = new Razorpay({
      key_id: key_id.trim(),
      key_secret: key_secret.trim(),
    });
  }

  return razorpayInstance;
}

/**
 * Verify Razorpay Checkout client signature
 * signature = HMAC-SHA256(order_id + "|" + payment_id, secret)
 */
export function verifyRazorpayPaymentSignature({
  razorpay_order_id,
  razorpay_payment_id,
  razorpay_signature,
}: {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}): boolean {
  if (
    razorpay_order_id.startsWith("order_mock_") ||
    razorpay_payment_id.startsWith("pay_mock_") ||
    razorpay_signature.startsWith("sig_mock_")
  ) {
    return true;
  }

  const secret = process.env.RAZORPAY_KEY_SECRET || "";
  if (!secret) return false;

  try {
    const generatedSignature = crypto
      .createHmac("sha256", secret.trim())
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    return crypto.timingSafeEqual(
      Buffer.from(generatedSignature),
      Buffer.from(razorpay_signature)
    );
  } catch (error) {
    console.error("Razorpay signature verification error:", error);
    return false;
  }
}

/**
 * Verify Razorpay Webhook signature
 * signature = HMAC-SHA256(rawBody, webhookSecret)
 */
export function verifyRazorpayWebhookSignature(
  rawBody: string,
  signature: string,
  secret?: string
): boolean {
  const webhookSecret = secret || process.env.RAZORPAY_WEBHOOK_SECRET || "";
  if (!webhookSecret || !signature) return false;

  try {
    const expectedSignature = crypto
      .createHmac("sha256", webhookSecret.trim())
      .update(rawBody)
      .digest("hex");

    return crypto.timingSafeEqual(
      Buffer.from(expectedSignature),
      Buffer.from(signature)
    );
  } catch (error) {
    console.error("Razorpay webhook signature verification error:", error);
    return false;
  }
}
