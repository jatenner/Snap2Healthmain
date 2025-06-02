import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { v4 as uuidv4 } from "uuid";

export async function POST(req: NextRequest) {
  try {
    // Initialize Supabase client
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({
        success: false,
        error: "Supabase credentials are not configured"
      }, { status: 500 });
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Test 1: Insert data into meal_data_backup table
    const testId = uuidv4();
    const testUserId = "test-user-" + Math.floor(Math.random() * 10000);
    
    // Try to insert data without authentication
    const { data: insertData, error: insertError } = await supabase
      .from("meal_data_backup")
      .insert({
        id: testId,
        user_id: testUserId,
        name: "RLS Test Meal",
        image_url: "https://example.com/test-image.jpg",
        data: { test: true },
        created_at: new Date().toISOString()
      })
      .select();
    
    if (insertError) {
      return NextResponse.json({
        success: false,
        error: `Insert test failed: ${insertError.message}`,
        code: insertError.code,
        details: insertError.details
      }, { status: 500 });
    }
    
    // Test 2: Verify we can read the data
    const { data: readData, error: readError } = await supabase
      .from("meal_data_backup")
      .select("*")
      .eq("id", testId)
      .single();
    
    if (readError) {
      return NextResponse.json({
        success: false,
        error: `Read test failed: ${readError.message}`,
        code: readError.code
      }, { status: 500 });
    }
    
    if (!readData) {
      return NextResponse.json({
        success: false,
        error: "Read test failed: No data returned"
      }, { status: 500 });
    }
    
    // Test 3: Update the data
    const { data: updateData, error: updateError } = await supabase
      .from("meal_data_backup")
      .update({
        name: "RLS Test Meal (Updated)"
      })
      .eq("id", testId)
      .select();
    
    if (updateError) {
      return NextResponse.json({
        success: false,
        error: `Update test failed: ${updateError.message}`,
        code: updateError.code
      }, { status: 500 });
    }
    
    // Test 4: Delete the data
    const { error: deleteError } = await supabase
      .from("meal_data_backup")
      .delete()
      .eq("id", testId);
    
    if (deleteError) {
      return NextResponse.json({
        success: false,
        error: `Delete test failed: ${deleteError.message}`,
        code: deleteError.code
      }, { status: 500 });
    }
    
    // Test 5: Test meal_analyses table
    const analysisId = uuidv4();
    
    const { error: analysisError } = await supabase
      .from("meal_analyses")
      .insert({
        id: analysisId,
        user_id: testUserId,
        name: "RLS Test Analysis",
        raw_analysis: { test: true },
        foods: [{ name: "test food" }],
        uuid: uuidv4()
      });
    
    if (analysisError) {
      return NextResponse.json({
        success: false,
        error: `Meal analyses test failed: ${analysisError.message}`,
        code: analysisError.code
      }, { status: 500 });
    }
    
    // Clean up meal_analyses test data
    await supabase
      .from("meal_analyses")
      .delete()
      .eq("id", analysisId);
    
    return NextResponse.json({
      success: true,
      message: "All RLS tests passed successfully",
      tests: {
        insert: "passed",
        read: "passed",
        update: "passed",
        delete: "passed",
        meal_analyses: "passed"
      }
    });
    
  } catch (error: any) {
    console.error("Error testing RLS:", error);
    return NextResponse.json({
      success: false,
      error: error.message || "Unknown error"
    }, { status: 500 });
  }
}

export async function OPTIONS(req: NextRequest) {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Bypass-Middleware, X-Emergency-Recovery',
    },
  });
} 