import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import { Product } from "@/models/Product";

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

    // Convert file to base64 for n8n proxy (if needed)
    const buffer = Buffer.from(await file.arrayBuffer());
    const base64File = buffer.toString("base64");

    const webhookUrl = process.env.N8N_PRESCRIPTION_WEBHOOK_URL || process.env.NEXT_PUBLIC_N8N_PRESCRIPTION_WEBHOOK_URL;
    
    let parsedData = {
      parsedMedicines: [],
      matchedProducts: []
    };

    if (webhookUrl) {
      // Send to n8n Webhook
      const n8nResponse = await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileName: file.name,
          fileType: file.type,
          fileData: base64File,
          userId: session.user.id,
        }),
      });

      if (n8nResponse.ok) {
        parsedData = await n8nResponse.json();
      }
    } else {
      // simulate/mock logic for local dev if n8n is not reachable
      console.warn("N8N_PRESCRIPTION_WEBHOOK_URL not set. Running local mock & DB match.");
      
      const mockMedicines = [
        { name: "Paracetamol", dosage: "500mg", frequency: "twice daily" },
        { name: "Amoxicillin", dosage: "250mg", frequency: "thrice daily" }
      ];

      await connectToDatabase();
      const productMatches = await Product.find({
        name: { $regex: mockMedicines[0].name, $options: "i" },
        stock: { $gt: 0 }
      }).limit(5).lean();

      parsedData = {
        success: true,
        parsedMedicines: mockMedicines,
        matchedProducts: productMatches
      };
    }

    return NextResponse.json({
      success: true,
      ...parsedData
    });

  } catch (error) {
    console.error("Prescription parsing error:", error);
    return NextResponse.json({ success: false, message: "Failed to parse prescription" }, { status: 500 });
  }
}

