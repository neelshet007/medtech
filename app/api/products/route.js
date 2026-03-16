import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import { buildExpiryBuckets } from "@/lib/inventory";
import { Product } from "@/models/Product";
import { validateProductPayload } from "@/lib/validation";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const search = searchParams.get("search");

    await connectToDatabase();

    let query = {};

    // Filter by category if provided
    if (category && category !== "All") {
      query.category = category;
    }

    // Search by text index if search term is provided
    if (search) {
      query.$text = { $search: search };
    }

    const products = await Product.find(query).sort({ createdAt: -1 }).lean();

    const enrichedProducts = products.map((product) => {
      const expiryBuckets = buildExpiryBuckets(product.batches || []);
      return {
        ...product,
        nearExpiryCount: expiryBuckets.nearExpiry.length,
        expiredBatchCount: expiryBuckets.expired.length,
      };
    });

    return NextResponse.json({ success: true, products: enrichedProducts }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

// Admin only: create product
export async function POST(request) {
  try {
    const session = await auth();
    if (session?.user?.role !== "admin") {
      return NextResponse.json({ success: false, message: "Admin access required." }, { status: 403 });
    }

    const body = await request.json();
    const validated = validateProductPayload(body);

    if (validated.error) {
      return NextResponse.json({ success: false, message: validated.error }, { status: 400 });
    }

    await connectToDatabase();

    const product = await Product.create(validated.data);

    return NextResponse.json({ success: true, product }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
