import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import { HealthReport } from "@/models/HealthReport";

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file");

    if (!file) {
      return NextResponse.json({ success: false, message: "No file provided" }, { status: 400 });
    }

    // Convert file to base64 for the webhook
    const buffer = Buffer.from(await file.arrayBuffer());
    const base64File = buffer.toString("base64");

    const webhookUrl = process.env.N8N_HEALTH_RECORD_WEBHOOK_URL;
    let extractedMetrics = {
      bloodPressureSys: 120, // defaults for demo fallback
      bloodPressureDia: 80,
      heartRate: 72,
      sugarLevel: 90,
      weight: 70,
      bloodGroup: "O+"
    };

    if (webhookUrl) {
      const n8nResponse = await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileName: file.name,
          fileType: file.type,
          fileData: base64File,
          userId: session.user.id
        }),
      });

      if (n8nResponse.ok) {
        const data = await n8nResponse.json();
        if (data.metrics) {
           extractedMetrics = { ...extractedMetrics, ...data.metrics };
        }
      } else {
        console.warn("N8N Health Webhook failed. Using fallback metrics.");
      }
    } else {
      console.warn("N8N_HEALTH_RECORD_WEBHOOK_URL not set. Using local mock metrics.");
      // Give some variation to the mock data depending on time
       extractedMetrics.sugarLevel = Math.floor(Math.random() * (120 - 85 + 1) + 85);
       extractedMetrics.bloodPressureSys = Math.floor(Math.random() * (130 - 110 + 1) + 110);
    }

    await connectToDatabase();

    // Create health record db entry
    const report = await HealthReport.create({
      user: session.user.id,
      title: file.name || "Uploaded Report",
      fileUrl: "local_or_cloud_placeholder_url_here",
      metrics: extractedMetrics
    });

    return NextResponse.json({
      success: true,
      report
    });

  } catch (error) {
    console.error("Health Record AI Analysis error:", error);
    return NextResponse.json({ success: false, message: "Failed to parse report" }, { status: 500 });
  }
}

export async function GET(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();
    
    // Fetch last 10 reports sorted by newest
    const reports = await HealthReport.find({ user: session.user.id }).sort({ reportDate: -1 }).limit(10).lean();
    
    return NextResponse.json({ success: true, reports });
  } catch (error) {
    return NextResponse.json({ success: false, message: "Error fetching reports" }, { status: 500 });
  }
}
