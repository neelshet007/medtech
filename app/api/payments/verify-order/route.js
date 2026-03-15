import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { Order } from "@/models/Order";
import crypto from "crypto";

export async function POST(request) {
  try {
    const body = await request.json();
    const { 
      razorpay_order_id, 
      razorpay_payment_id, 
      razorpay_signature,
      internal_order_id 
    } = body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json({ message: "Invalid payment details" }, { status: 400 });
    }

    // 1. Verify Signature internally
    // Secret key is securely hidden in ENV and not exposed to the client
    const secret = process.env.RAZORPAY_KEY_SECRET;
    
    // HMAC SHA256 Encryption
    const generatedSignature = crypto
      .createHmac("sha256", secret)
      .update(razorpay_order_id + "|" + razorpay_payment_id)
      .digest("hex");

    const isSignatureValid = generatedSignature === razorpay_signature;

    await connectToDatabase();

    if (isSignatureValid) {
      // 2. Signature matches! Update order status to Completed
      const order = await Order.findByIdAndUpdate(
        internal_order_id,
        {
          paymentStatus: "Completed",
          razorpayPaymentId: razorpay_payment_id,
          razorpaySignature: razorpay_signature,
        },
        { new: true }
      ).populate("user", "name email");

      // Optional PHASE 7 logic: Trigger n8n Webhook
      if (process.env.N8N_WEBHOOK_URL) {
        try {
          // Trigger async, we don't await blocking response to keep checkout fast
          fetch(process.env.N8N_WEBHOOK_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              orderId: order._id,
              amount: order.totalAmount,
              customer: order.user,
              event: "order_paid"
            })
          }).catch(err => console.error("Webhook failed:", err));
        } catch(e) {}
      }

      return NextResponse.json({ success: true, message: "Payment verified successfully" }, { status: 200 });
    } else {
      // 3. Signature mismatch = Fraud attempt or failed payment
      await Order.findByIdAndUpdate(internal_order_id, {
        paymentStatus: "Failed",
      });

      return NextResponse.json({ success: false, message: "Payment verification failed" }, { status: 400 });
    }
  } catch (error) {
    console.error("Razorpay Verify Error:", error);
    return NextResponse.json(
      { message: "Internal Server Error", error: error.message },
      { status: 500 }
    );
  }
}
