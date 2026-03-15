import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import { Order } from "@/models/Order";

export async function GET(request) {
  try {
    const session = await auth();
    if (session?.user?.role !== "admin") {
      return NextResponse.json({ success: false, message: "Admin access required." }, { status: 403 });
    }

    await connectToDatabase();
    
    // Using .populate to fetch User names & emails with the order
    // and populating the product details to render what was bought
    const orders = await Order.find()
      .populate("user", "name email")
      .populate("items.product", "name")
      .sort({ createdAt: -1 });

    return NextResponse.json({ success: true, orders }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
