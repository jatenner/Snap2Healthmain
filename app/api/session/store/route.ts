import { NextRequest, NextResponse } from 'next/server';
import { storeInSession } from '../../../../src/lib/session';

export async function POST(request: NextRequest) {
  try {
    console.log("Session store API called");
    
    // Parse the request body
    const { key, value } = await request.json();
    
    if (!key || value === undefined) {
      console.error("Missing key or value in request");
      return NextResponse.json(
        { error: "Missing key or value" },
        { status: 400 }
      );
    }
    
    console.log(`Storing data for key: ${key}`);
    
    // Store the data in session
    await storeInSession(key, value);
    
    console.log(`Successfully stored data for key: ${key}`);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error storing in session:", error);
    return NextResponse.json(
      { error: "Failed to store in session" },
      { status: 500 }
    );
  }
} 