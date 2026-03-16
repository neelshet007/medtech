import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import { LabService } from "@/models/LabService";

export async function GET() {
  try {
    await connectToDatabase();
    const services = await LabService.find().sort({ name: 1 }).lean();
    return NextResponse.json({ success: true, services }, { status: 200 });
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

    const service = await LabService.create({
      name: String(body.name || "").trim(),
      description: String(body.description || "").trim(),
      price: Number(body.price || 0),
    });

    return NextResponse.json({ success: true, service }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
