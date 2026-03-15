import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";

export async function GET() {
  try {
    // Test the database connection
    await connectToDatabase();
    
    return NextResponse.json({
      success: true,
      message: "API is working and MongoDB is connected!"
    }, { status: 200 });
  } catch (error) {
    console.error("Test API Error:", error);
    return NextResponse.json({
      success: false,
      message: "API is working but MongoDB connection failed.",
      error: error.message
    }, { status: 500 });
  }
}
