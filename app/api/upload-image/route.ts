import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { createDynamicResponse, apiResponse } from '@/lib/api-route-helper';

// Explicitly mark this route as dynamic to prevent build errors
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const revalidate = 0;

// Define the upload directory
const uploadDir = path.join(process.cwd(), 'public/uploads');

// Create the directory if it doesn't exist
async function ensureUploadDir() {
  try {
    await mkdir(uploadDir, { recursive: true });
  } catch (error) {
    console.error('Error creating upload directory:', error);
  }
}

// Wrap the POST handler with createDynamicResponse
export const POST = createDynamicResponse(async (request: NextRequest) => {
  try {
    // Get cookies for debugging
    const allCookies = request.cookies.getAll();
    console.log('All cookies in upload endpoint:', allCookies.map(c => ({ name: c.name, value: c.value.substring(0, 10) + '...' })));
    
    // Check for authentication using our local auth solution
    const useLocalAuth = request.cookies.get('use-local-auth')?.value === 'true';
    const localAuthUser = request.cookies.get('local-auth-user')?.value;
    
    // Only check authentication if we're in production
    const isProduction = process.env.NEXT_PUBLIC_APP_ENV === 'production';
    const authBypass = process.env.NEXT_PUBLIC_AUTH_BYPASS === 'true';
    
    // Skip authentication in dev or when auth bypass is enabled
    if (isProduction && !authBypass && !useLocalAuth && !localAuthUser) {
      console.log('Authentication required but not found in upload-image');
      return apiResponse(
        { success: false, error: 'Authentication required' },
        401
      );
    }

    // Ensure the upload directory exists
    await ensureUploadDir();

    // Get form data (with the uploaded file)
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return apiResponse(
        { error: 'No file was provided' },
        400
      );
    }

    // Check file type
    if (!file.type.startsWith('image/')) {
      return apiResponse(
        { error: 'File must be an image' },
        400
      );
    }

    // Check file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return apiResponse(
        { error: 'File size exceeds 10MB limit.' },
        400
      );
    }

    // Generate a unique filename to prevent overwriting
    const fileExtension = file.name.split('.').pop();
    const filename = `${uuidv4()}.${fileExtension}`;
    const filePath = path.join(uploadDir, filename);

    // Convert the file to a Buffer and save it
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64 = buffer.toString('base64');
    const mimeType = file.type;
    const dataUrl = `data:${mimeType};base64,${base64}`;

    // Generate a unique ID for the image
    const imageId = uuidv4();

    console.log('Image uploaded successfully with ID:', imageId);

    // Return success response
    return apiResponse({
      success: true,
      imageUrl: dataUrl,
      imageId,
      timestamp: Date.now() // Add timestamp for cache-busting
    });
  } catch (error) {
    console.error('Error handling file upload:', error);
    return apiResponse(
      { error: 'Failed to process image upload' },
      500
    );
  }
}); 