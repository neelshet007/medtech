import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { Product } from "@/models/Product";

// This endpoint is called internally by n8n after it parses a prescription via AI.
// It receives a list of medicine names, fuzzy-matches them to products in the DB,
// and returns the matching product objects so the client can add them to the cart.

export async function POST(request) {
  try {
    // Lightweight secret check so only n8n can call this endpoint
    const secret = request.headers.get("x-n8n-secret");
    if (process.env.N8N_INTERNAL_SECRET && secret !== process.env.N8N_INTERNAL_SECRET) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const medicines = Array.isArray(body.medicines) ? body.medicines : [];

    if (medicines.length === 0) {
      return NextResponse.json({ success: true, matchedProducts: [] });
    }

    await connectToDatabase();

    // Build a case-insensitive OR query for every medicine name from the AI response
    const nameQueries = medicines.map((med) => ({
      name: { $regex: med.name || med, $options: "i" },
    }));

    const matchedProducts = await Product.find({
      $or: nameQueries,
      stock: { $gt: 0 }, // only return in-stock items
    })
      .select("_id name price imageUrl requiresPrescription stock")
      .limit(20)
      .lean();

    return NextResponse.json({
      success: true,
      matchedProducts,
      parsedMedicines: medicines, // echo back for the client to display
    });
  } catch (error) {
    console.error("Prescription Product Match Error:", error);
    return NextResponse.json({ success: false, message: "Internal Server Error" }, { status: 500 });
  }
}
