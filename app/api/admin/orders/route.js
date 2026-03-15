import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { Order } from "@/models/Order";
import { getServerSession } from "next-auth"; // Optional if we strictly use middleware, but good defense

export async function GET(request) {
  try {
    await connectToDatabase();
    
    // Using .populate to fetch User names & emails with the order
    // and populating the product details to render what was bought
    const orders = await Order.find()
      .populate("user", "name email")
      .populate("items.product", "name")
      .sort({ createdAt: -1 });

    return NextResponse.json({ success: true, orders }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
