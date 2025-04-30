import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(req: NextRequest) {
  // Initialize Supabase client
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return NextResponse.json(
      { error: 'Supabase environment variables are not set' },
      { status: 500 }
    );
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  let bucketInfo = null;
  let bucketError = null;
  let createResult = null;
  let createError = null;

  // Check if bucket exists
  try {
    const { data, error } = await supabase
      .storage
      .getBucket('meal-images');

    if (error) {
      bucketError = error.message;
      // Try to create the bucket if it doesn't exist
      if (error.message.includes('does not exist')) {
        try {
          const { data: createdData, error: createdError } = await supabase.storage.createBucket('meal-images', {
            public: true,
            fileSizeLimit: 10485760, // 10MB
          });
          
          if (createdError) {
            createError = createdError.message;
          } else {
            createResult = createdData;
          }
        } catch (err: any) {
          createError = err.message || 'Unknown error creating bucket';
        }
      }
    } else {
      bucketInfo = data;
    }
  } catch (err: any) {
    bucketError = err.message || 'Unknown error';
  }

  return NextResponse.json({
    url: process.env.NEXT_PUBLIC_SUPABASE_URL,
    bucket: {
      info: bucketInfo,
      error: bucketError,
    },
    create: {
      result: createResult,
      error: createError,
    }
  });
} 