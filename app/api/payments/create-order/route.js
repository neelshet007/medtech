import { NextResponse } from "next/server";
import Razorpay from "razorpay";
import { auth } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import { Order } from "@/models/Order";
import { Product } from "@/models/Product";

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

export async function POST(request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Authentication required." }, { status: 401 });
    }

    const body = await request.json();
    const items = Array.isArray(body.items) ? body.items : [];
    const prescriptionUrl = body.prescriptionUrl || null;

    if (items.length === 0) {
      return NextResponse.json({ message: "Cart items are required." }, { status: 400 });
    }

    await connectToDatabase();

    const productIds = items.map((item) => item.product?._id).filter(Boolean);
    const products = await Product.find({ _id: { $in: productIds } });
    const productMap = new Map(products.map((product) => [product._id.toString(), product]));

    const normalizedItems = [];
    let totalAmount = 0;

    for (const item of items) {
      const productId = item.product?._id;
      const quantity = Number(item.quantity);
      const product = productMap.get(productId);

      if (!product || !Number.isInteger(quantity) || quantity < 1) {
        return NextResponse.json({ message: "Invalid order item supplied." }, { status: 400 });
      }

      if (product.stock < quantity) {
        return NextResponse.json(
          { message: `${product.name} does not have enough stock for this order.` },
          { status: 409 }
        );
      }

      normalizedItems.push({
        product: product._id,
        quantity,
        price: product.price,
      });
      totalAmount += product.price * quantity;
    }

    // Critical security control:
    // order totals are recalculated from database products, not trusted from the client.
    const order = await Order.create({
      user: session.user.id,
      items: normalizedItems,
      totalAmount,
      paymentStatus: "Pending",
      orderStatus: "Processing",
      prescriptionUrl,
      deliveryTimeline: [{ status: "Processing", description: "Order placed successfully" }],
    });

    const razorpayOrder = await razorpay.orders.create({
      amount: totalAmount * 100,
      currency: "INR",
      receipt: `receipt_${order._id.toString()}`,
      payment_capture: 1,
    });

    order.razorpayOrderId = razorpayOrder.id;
    await order.save();

    return NextResponse.json(
      { success: true, orderId: order._id, razorpayOrder, totalAmount },
      { status: 201 }
    );
  } catch (error) {
    console.error("Razorpay Create Order Error:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}
