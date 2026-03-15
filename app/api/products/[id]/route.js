import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { Product } from "@/models/Product";
import { validateProductPayload } from "@/lib/validation";

export async function PATCH(request, { params }) {
  try {
    const body = await request.json();
    const validated = validateProductPayload(body);

    if (validated.error) {
      return NextResponse.json({ success: false, message: validated.error }, { status: 400 });
    }

    await connectToDatabase();

    const product = await Product.findByIdAndUpdate(params.id, validated.data, {
      new: true,
      runValidators: true,
    });

    if (!product) {
      return NextResponse.json({ success: false, message: "Product not found." }, { status: 404 });
    }

    return NextResponse.json({ success: true, product }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function DELETE(_request, { params }) {
  try {
    await connectToDatabase();

    const product = await Product.findByIdAndDelete(params.id);
    if (!product) {
      return NextResponse.json({ success: false, message: "Product not found." }, { status: 404 });
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
