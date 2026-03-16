import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getAdminAnalytics } from "@/lib/dashboard-data";

export async function GET() {
  try {
    const session = await auth();

    if (session?.user?.role !== "admin") {
      return NextResponse.json({ success: false, message: "Admin access required." }, { status: 403 });
    }

    const analytics = await getAdminAnalytics();
    return NextResponse.json({ success: true, ...analytics });
  } catch (error) {
    console.error("Admin analytics error:", error);
    return NextResponse.json({ success: false, message: "Failed to load analytics." }, { status: 500 });
  }
}
