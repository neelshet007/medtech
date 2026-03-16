import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import { Doctor } from "@/models/Doctor";

export async function GET() {
  try {
    await connectToDatabase();
    const doctors = await Doctor.find().sort({ name: 1 }).lean();
    return NextResponse.json({ success: true, doctors }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const session = await auth();
    if (session?.user?.role !== "admin") {
      return NextResponse.json({ success: false, message: "Admin access required." }, { status: 403 });
    }

    const body = await request.json();
    await connectToDatabase();

    const doctor = await Doctor.create({
      name: String(body.name || "").trim(),
      specialization: String(body.specialization || "").trim(),
      availableTimings: Array.isArray(body.availableTimings) ? body.availableTimings.filter(Boolean) : [],
      consultationFee: Number(body.consultationFee || 0),
    });

    return NextResponse.json({ success: true, doctor }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
