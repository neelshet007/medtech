import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth"; // Assuming standard next-auth authOptions export

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

    // Convert file to base64 or buffer for the webhook
    const buffer = Buffer.from(await file.arrayBuffer());
    const base64File = buffer.toString("base64");

    const webhookUrl = process.env.N8N_PRESCRIPTION_WEBHOOK_URL;

    if (!webhookUrl) {
      console.warn("N8N_PRESCRIPTION_WEBHOOK_URL not set. Simulating AI success for local dev.");
      
      // Simulate n8n response for testing if no webhook is set
      return NextResponse.json({
        success: true,
        data: {
          medicines: [
             { name: "Paracetamol", dosage: "500mg", frequency: "twice daily", duration: "5 days" }
          ],
          rawText: "Sample extracted text",
          extractedAt: new Date().toISOString()
        }
      });
    }

    // Send to n8n Webhook
    const n8nResponse = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        fileName: file.name,
        fileType: file.type,
        fileData: base64File,
        userId: session.user.id,
        userEmail: session.user.email
      }),
    });

    if (!n8nResponse.ok) {
      throw new Error(`n8n webhook failed with status: ${n8nResponse.status}`);
    }

    // Expect n8n to process and return structured JSON
    // e.g., { medicines: [...], notes: "..." }
    const responseData = await n8nResponse.json();

    return NextResponse.json({
      success: true,
      data: responseData,
    });

  } catch (error) {
    console.error("Prescription parsing error:", error);
    return NextResponse.json({ success: false, message: "Failed to parse prescription" }, { status: 500 });
  }
}
