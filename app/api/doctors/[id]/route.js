import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import { Doctor } from "@/models/Doctor";

export async function PATCH(request, { params }) {
  try {
    const session = await auth();
    if (session?.user?.role !== "admin") {
      return NextResponse.json({ success: false, message: "Admin access required." }, { status: 403 });
    }

    const body = await request.json();
    await connectToDatabase();

    const doctor = await Doctor.findByIdAndUpdate(
      params.id,
      {
        name: String(body.name || "").trim(),
        specialization: String(body.specialization || "").trim(),
        availableTimings: Array.isArray(body.availableTimings) ? body.availableTimings.filter(Boolean) : [],
        consultationFee: Number(body.consultationFee || 0),
      },
      { new: true, runValidators: true }
    );

    return NextResponse.json({ success: true, doctor }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
