import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import { createTimelineEntry, validateOrderTransition } from "@/lib/order-status";
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

    const transition = validateOrderTransition(order.orderStatus, orderStatus);
    if (transition.error) {
      return NextResponse.json({ message: transition.error }, { status: 400 });
    }

    order.trackingId = trackingId || order.trackingId;

    for (const nextStatus of transition.data) {
      order.deliveryTimeline.push(createTimelineEntry(nextStatus, description));
      order.orderStatus = nextStatus;
    }

    if (order.orderStatus === "Completed" && order.paymentMethod === "COD") {
      // COD revenue is recognized only after the delivery flow is complete.
      order.paymentStatus = "Completed";
    }

    await order.save();

    return NextResponse.json({ success: true, message: "Order updated successfully", order }, { status: 200 });
  } catch (error) {
    console.error("Admin Order Update Error:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}
