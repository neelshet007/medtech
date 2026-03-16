import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import { createTimelineEntry } from "@/lib/order-status";
import { Order } from "@/models/Order";

export async function PATCH(request, context) {
  try {
    const session = await auth();
    if (!session?.user?.role || session.user.role !== "admin") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    // Await params as required by Next.js App Router for dynamic route parameters
    const params = await context.params;
    const { id } = params;

    const body = await request.json();
    const { orderStatus, trackingId, description } = body;

    if (!orderStatus) {
      return NextResponse.json({ message: "Order status is required" }, { status: 400 });
    }

    await connectToDatabase();

    const order = await Order.findById(id);
    if (!order) {
      return NextResponse.json({ message: "Order not found" }, { status: 404 });
    }

    order.orderStatus = orderStatus;
    order.trackingId = trackingId || order.trackingId;
    order.deliveryTimeline.push(createTimelineEntry(orderStatus, description));

    await order.save();

    return NextResponse.json({ success: true, message: "Order updated successfully", order }, { status: 200 });
  } catch (error) {
    console.error("Admin Order Update Error:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}
