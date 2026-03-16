import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import { LabBooking } from "@/models/LabBooking";
import { LabService } from "@/models/LabService";

export async function GET() {
  try {
    const session = await auth();
    await connectToDatabase();

    const query = session?.user?.role === "admin" ? {} : { user: session?.user?.id };
    const bookings = await LabBooking.find(query)
      .populate("user", "name email")
      .populate("service", "name price")
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({ success: true, bookings }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, message: "Authentication required." }, { status: 401 });
    }

    const body = await request.json();
    await connectToDatabase();

    const service = await LabService.findById(body.serviceId).lean();
    if (!service) {
      return NextResponse.json({ success: false, message: "Lab service not found." }, { status: 404 });
    }

    const booking = await LabBooking.create({
      user: session.user.id,
      service: body.serviceId,
      bookingDate: new Date(body.bookingDate),
      prescriptionUrl: String(body.prescriptionUrl || "").trim(),
    });

    return NextResponse.json({ success: true, booking }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
