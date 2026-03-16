import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import { Cart } from "@/models/Cart";
import { Product } from "@/models/Product";

async function readCart(userId) {
  return Cart.findOne({ user: userId }).populate("items.product").lean();
}

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, message: "Authentication required." }, { status: 401 });
    }

    await connectToDatabase();
    const cart = await readCart(session.user.id);

    return NextResponse.json({ success: true, cart: cart?.items || [] }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, message: "Authentication required." }, { status: 401 });
    }

    const body = await request.json();
    const productId = String(body.productId || "");
    const quantity = Number(body.quantity);

    if (!productId || !Number.isInteger(quantity) || quantity < 0) {
      return NextResponse.json({ success: false, message: "Valid productId and quantity are required." }, { status: 400 });
    }

    await connectToDatabase();

    const product = await Product.findById(productId).lean();
    if (!product) {
      return NextResponse.json({ success: false, message: "Product not found." }, { status: 404 });
    }

    const cart = (await Cart.findOne({ user: session.user.id })) || new Cart({ user: session.user.id, items: [] });
    const existingIndex = cart.items.findIndex((item) => item.product.toString() === productId);

    if (quantity === 0) {
      if (existingIndex >= 0) {
        cart.items.splice(existingIndex, 1);
      }
    } else if (existingIndex >= 0) {
      cart.items[existingIndex].quantity = quantity;
    } else {
      cart.items.push({ product: productId, quantity });
    }

    await cart.save();
    const refreshed = await readCart(session.user.id);

    return NextResponse.json({ success: true, cart: refreshed?.items || [] }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, message: "Authentication required." }, { status: 401 });
    }

    await connectToDatabase();
    await Cart.findOneAndUpdate({ user: session.user.id }, { items: [] }, { upsert: true });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
