import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import { Appointment } from "@/models/Appointment";
import { Doctor } from "@/models/Doctor";

export async function GET() {
  try {
    const session = await auth();
    await connectToDatabase();

    const query = session?.user?.role === "admin" ? {} : { user: session?.user?.id };
    const appointments = await Appointment.find(query)
      .populate("user", "name email")
      .populate("doctor", "name specialization consultationFee")
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({ success: true, appointments }, { status: 200 });
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

    const doctor = await Doctor.findById(body.doctorId).lean();
    if (!doctor) {
      return NextResponse.json({ success: false, message: "Doctor not found." }, { status: 404 });
    }

    const appointment = await Appointment.create({
      user: session.user.id,
      doctor: body.doctorId,
      timeSlot: String(body.timeSlot || "").trim(),
    });

    return NextResponse.json({ success: true, appointment }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
