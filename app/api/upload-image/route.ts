import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

// Force this route to be dynamic
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  console.log('[upload-image] Received upload request');
  
  try {
    // Parse the form data
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }
    
    console.log(`[upload-image] Processing file: ${file.name} (${file.size} bytes, ${file.type})`);
    
    // Check file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'File must be an image' }, { status: 400 });
    }
    
    // Generate a unique ID for the file
    const fileId = uuidv4();
    const fileExt = file.name.split('.').pop();
    const fileName = `${fileId}.${fileExt}`;
    
    // Upload to Supabase Storage if available
    try {
      const supabase = createRouteHandlerClient({ cookies });
      
      // Convert file to array buffer
      const arrayBuffer = await file.arrayBuffer();
      const fileBuffer = Buffer.from(arrayBuffer);
      
      // Upload to Supabase Storage
      const { data, error } = await supabase
        .storage
        .from('uploads')
        .upload(`public/${fileName}`, fileBuffer, {
          cacheControl: '3600',
          contentType: file.type,
          upsert: false
        });
        
      if (error) {
        console.error('[upload-image] Supabase upload error:', error);
        // Fall back to data URL approach
        return createDataUrlResponse(file);
      }
      
      // Get public URL for the uploaded file
      const { data: publicUrlData } = supabase
        .storage
        .from('uploads')
        .getPublicUrl(`public/${fileName}`);
        
      console.log('[upload-image] File uploaded to Supabase:', publicUrlData.publicUrl);
      
      // Return the public URL
      return NextResponse.json({ 
        success: true, 
        imageUrl: publicUrlData.publicUrl,
        supabaseStorage: true
      });
    } catch (supabaseError) {
      console.error('[upload-image] Error using Supabase storage:', supabaseError);
      // Fall back to data URL approach
      return createDataUrlResponse(file);
    }
  } catch (error) {
    console.error('[upload-image] Error processing upload:', error);
    return NextResponse.json({ error: 'Failed to process upload' }, { status: 500 });
  }
}

// Helper to create a response with a data URL when Supabase storage fails
async function createDataUrlResponse(file: File) {
  try {
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    // Create a data URL from the buffer
    const dataUrl = `data:${file.type};base64,${buffer.toString('base64')}`;
    
    console.log('[upload-image] Created data URL fallback');
    
    // Return the data URL
    return NextResponse.json({ 
      success: true, 
      imageUrl: dataUrl,
      supabaseStorage: false
    });
  } catch (error) {
    console.error('[upload-image] Error creating data URL:', error);
    return NextResponse.json({ error: 'Failed to process image' }, { status: 500 });
  }
} 