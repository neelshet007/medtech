import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectToDatabase } from '@/lib/db';

export async function GET() {
  try {
    // 1. Check DB Connection
    await connectToDatabase();
    const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
    
    // 2. Aggregate Health Status
    const isHealthy = dbStatus === 'connected';

    if (isHealthy) {
      return NextResponse.json(
        { status: 'ok', database: dbStatus, timestamp: new Date().toISOString() },
        { status: 200 }
      );
    } else {
      return NextResponse.json(
        { status: 'error', database: dbStatus, timestamp: new Date().toISOString() },
        { status: 503 }
      );
    }
  } catch (error) {
    return NextResponse.json(
      { status: 'error', message: error.message, timestamp: new Date().toISOString() },
      { status: 500 }
    );
  }
}
