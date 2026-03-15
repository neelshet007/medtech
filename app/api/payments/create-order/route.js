import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { Order } from "@/models/Order";
import Razorpay from "razorpay";
import { getServerSession } from "next-auth";

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

export async function POST(request) {
  try {
    const session = await getServerSession(); // In app router, we might need auth options if fully implemented.
    // For tutorial, we assume session is handled or passed via headers
    
    const body = await request.json();
    const { items, totalAmount, userId } = body;

    if (!items || !totalAmount || !userId) {
      return NextResponse.json({ message: "Incomplete order details" }, { status: 400 });
    }

    await connectToDatabase();

    // 1. Create Order internally in MongoDB
    const newOrder = await Order.create({
      user: userId,
      items: items.map((item) => ({
        product: item.product._id,
        quantity: item.quantity,
        price: item.price,
      })),
      totalAmount,
      paymentStatus: "Pending",
      orderStatus: "Processing",
    });

    // 2. Initialize Razorpay Order
    // Razorpay amount is counted in subunits (Paise in INR -> ₹1 = 100 paise)
    const options = {
      amount: totalAmount * 100, 
      currency: "INR",
      receipt: `receipt_${newOrder._id.toString()}`,
      payment_capture: 1, // Automatically capture payment
    };

    const razorpayOrder = await razorpay.orders.create(options);

    // 3. Update internal order with Razorpay Order ID for verification tracking
    newOrder.razorpayOrderId = razorpayOrder.id;
    await newOrder.save();

    return NextResponse.json(
      { success: true, orderId: newOrder._id, razorpayOrder },
      { status: 201 }
    );
  } catch (error) {
    console.error("Razorpay Create Order Error:", error);
    return NextResponse.json(
      { message: "Internal Server Error", error: error.message },
      { status: 500 }
    );
  }
}
