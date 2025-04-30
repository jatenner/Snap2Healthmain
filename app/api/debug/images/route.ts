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

  // Get meals with image URLs
  let mealsError = null;
  let meals = null;

  try {
    const { data: mealsData, error } = await supabase
      .from('meals')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      mealsError = error.message;
    } else {
      // Process image URLs
      meals = {
        count: mealsData.length,
        records: mealsData.map(meal => {
          // Check if URL is valid
          let isValidUrl = false;
          try {
            if (meal.image_url) {
              new URL(meal.image_url);
              isValidUrl = true;
            }
          } catch (e) {
            // URL is not valid, but it might be a relative path
            isValidUrl = false;
          }

          return {
            ...meal,
            url_valid: isValidUrl
          };
        })
      };
    }
  } catch (err: any) {
    mealsError = err.message || 'Unknown error fetching meals';
  }

  // Get storage bucket info
  let bucketError = null;
  let bucketInfo = null;
  let files = null;
  let filesError = null;

  try {
    const { data: bucket, error } = await supabase
      .storage
      .getBucket('meal-images');

    if (error) {
      bucketError = error.message;
    } else {
      bucketInfo = bucket;

      // List files in the bucket
      try {
        const { data: fileList, error: listError } = await supabase
          .storage
          .from('meal-images')
          .list();

        if (listError) {
          filesError = listError.message;
        } else {
          files = fileList;
        }
      } catch (err: any) {
        filesError = err.message || 'Unknown error listing files';
      }
    }
  } catch (err: any) {
    bucketError = err.message || 'Unknown error fetching bucket info';
  }

  // Get Next.js config
  let domains = [];
  try {
    // Parse domain from Supabase URL
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (supabaseUrl) {
      const url = new URL(supabaseUrl);
      domains.push(url.hostname);
    }
  } catch (err) {
    // Ignore errors
  }

  // Return all information
  return NextResponse.json({
    meals: meals ? {
      ...meals,
      error: mealsError
    } : { error: mealsError },
    storage: {
      bucket: bucketInfo,
      files,
      bucketError,
      filesError
    },
    nextConfig: {
      domains,
      urlFormat: process.env.NEXT_PUBLIC_SUPABASE_URL 
        ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/meal-images/[filename]` 
        : 'Not available'
    }
  });
} 