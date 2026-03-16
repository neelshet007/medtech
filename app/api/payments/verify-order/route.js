import crypto from "crypto";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import { Order } from "@/models/Order";
import { Product } from "@/models/Product";

export async function POST(request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Authentication required." }, { status: 401 });
    }

    const body = await request.json();
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, internal_order_id } = body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !internal_order_id) {
      return NextResponse.json({ message: "Invalid payment details." }, { status: 400 });
    }

    const generatedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    await connectToDatabase();

    const order = await Order.findById(internal_order_id);
    if (!order) {
      return NextResponse.json({ message: "Order not found." }, { status: 404 });
    }

    if (order.user.toString() !== session.user.id) {
      return NextResponse.json({ message: "Forbidden." }, { status: 403 });
    }

    if (generatedSignature !== razorpay_signature) {
      await Order.findByIdAndUpdate(internal_order_id, { paymentStatus: "Failed" });
      return NextResponse.json({ success: false, message: "Payment verification failed." }, { status: 400 });
    }

    if (order.paymentStatus !== "Completed") {
      // Stock changes happen after payment verification and only on the server.
      for (const item of order.items) {
        const updatedProduct = await Product.findOneAndUpdate(
          { _id: item.product, stock: { $gte: item.quantity } },
          { $inc: { stock: -item.quantity } },
          { new: true }
        );

        if (!updatedProduct) {
          await Order.findByIdAndUpdate(internal_order_id, {
            paymentStatus: "Failed",
            orderStatus: "Cancelled",
          });

          return NextResponse.json(
            { success: false, message: "Inventory changed before the order was finalized." },
            { status: 409 }
          );
        }
      }
    }

    const updatedOrder = await Order.findByIdAndUpdate(
      internal_order_id,
      {
        paymentStatus: "Completed",
        razorpayPaymentId: razorpay_payment_id,
        razorpaySignature: razorpay_signature,
      },
      { new: true }
    ).populate("user", "name email");

    // Fire admin notification webhook
    if (process.env.N8N_WEBHOOK_URL) {
      fetch(process.env.N8N_WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: updatedOrder._id,
          amount: updatedOrder.totalAmount,
          customer: updatedOrder.user,
          event: "order_paid",
        }),
      }).catch((err) => console.error("Admin webhook failed:", err));
    }

    // Fire customer confirmation webhook
    if (process.env.N8N_CUSTOMER_WEBHOOK_URL) {
      fetch(process.env.N8N_CUSTOMER_WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: updatedOrder._id,
          amount: updatedOrder.totalAmount,
          customerName: updatedOrder.user?.name || "Customer",
          customerPhone: updatedOrder.user?.phone || "",
          event: "order_paid",
        }),
      }).catch((err) => console.error("Customer webhook failed:", err));
    }

    return NextResponse.json({ success: true, message: "Payment verified successfully." }, { status: 200 });
  } catch (error) {
    console.error("Razorpay Verify Error:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}
