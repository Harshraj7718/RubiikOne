// Payment providers. With RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET set, real Razorpay Checkout is used
// and every payment is verified by its HMAC signature. Without them the store runs in a clearly
// labelled test mode so the full pre-order flow can be exercised without charging anyone.
import { createHmac, timingSafeEqual } from "node:crypto";

const KEY_ID = process.env.RAZORPAY_KEY_ID;
const KEY_SECRET = process.env.RAZORPAY_KEY_SECRET;
export const PAYMENT_MODE = KEY_ID && KEY_SECRET ? "razorpay" : "test";

/** Starts a payment for an order; returns what the browser needs to collect it. */
export async function startPayment(order) {
  // order.amount is the full amount to charge in rupees, GST included.
  if (PAYMENT_MODE === "test") return { provider: "test", amount: order.amount };

  const res = await fetch("https://api.razorpay.com/v1/orders", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Basic ${Buffer.from(`${KEY_ID}:${KEY_SECRET}`).toString("base64")}`,
    },
    body: JSON.stringify({ amount: order.amount * 100, currency: "INR", receipt: order.id, notes: { orderId: order.id } }),
  });
  if (!res.ok) throw Object.assign(new Error("The payment gateway is unavailable. Please try again shortly."), { status: 502 });
  const rzp = await res.json();
  return { provider: "razorpay", keyId: KEY_ID, providerOrderId: rzp.id, amount: rzp.amount, currency: rzp.currency };
}

/** Confirms a completed payment. Returns the payment reference, or throws. */
export function verifyPayment(order, body) {
  if (PAYMENT_MODE === "test") {
    if (!body?.test) throw Object.assign(new Error("Payment details are missing."), { status: 400 });
    return { provider: "test", reference: `TEST-${order.id}` };
  }
  const { razorpay_order_id: rzpOrderId, razorpay_payment_id: paymentId, razorpay_signature: signature } = body ?? {};
  if (!rzpOrderId || !paymentId || !signature || rzpOrderId !== order.payment?.providerOrderId) {
    throw Object.assign(new Error("Payment details don't match this order."), { status: 400 });
  }
  const expected = createHmac("sha256", KEY_SECRET).update(`${rzpOrderId}|${paymentId}`).digest();
  const given = Buffer.from(String(signature), "hex");
  if (given.length !== expected.length || !timingSafeEqual(given, expected)) {
    throw Object.assign(new Error("We couldn't verify this payment."), { status: 400 });
  }
  return { provider: "razorpay", reference: paymentId };
}
