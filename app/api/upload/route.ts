import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';

/**
 * API route that handles file uploads and saves them to the local filesystem
 * This is for development only - production would use cloud storage
 */
export async function POST(request: NextRequest) {
  console.log("[api/upload] Received upload request");
  
  try {
    // Track timing for debugging
    const startTime = Date.now();
    
    // Log request content type
    const contentType = request.headers.get('content-type') || '';
    console.log("[api/upload] Request content type:", contentType);
    
    // Parse the FormData
    const formData = await request.formData();
    const keys = Array.from(formData.keys());
    console.log("[api/upload] FormData parsed, keys:", keys);
    
    // Get the file from FormData
    const file = formData.get('file') as File;
    
    if (!file) {
      console.error("[api/upload] No file found in request");
      return NextResponse.json({ 
        error: 'No file provided in the request',
        receivedKeys: keys 
      }, { status: 400 });
    }
    
    // Log file details
    console.log("[api/upload] File received:", {
      name: file.name,
      type: file.type,
      size: `${(file.size / 1024).toFixed(2)} KB`
    });
    
    // Verify file is an image
    if (!file.type.startsWith('image/')) {
      console.error("[api/upload] File is not an image:", file.type);
      return NextResponse.json({ 
        error: 'File is not an image',
        type: file.type 
      }, { status: 400 });
    }
    
    // Create a unique filename
    const uniqueId = uuidv4();
    const fileExtension = file.name.split('.').pop() || 'jpg';
    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.]/g, '-');
    const filename = `${uniqueId}-${sanitizedFileName}`;
    
    // Define the upload directory
    const uploadsDir = join(process.cwd(), 'public', 'uploads');
    const filePath = join(uploadsDir, filename);
    
    try {
      // Ensure the uploads directory exists
      if (!fs.existsSync(uploadsDir)) {
        console.log(`[api/upload] Creating uploads directory: ${uploadsDir}`);
        await mkdir(uploadsDir, { recursive: true });
      } else {
        console.log(`[api/upload] Upload directory exists: ${uploadsDir}`);
      }
      
      // Convert the file to an ArrayBuffer
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      
      console.log(`[api/upload] Saving file to: ${filePath}`);
      console.log(`[api/upload] Buffer size: ${buffer.length} bytes`);
      
      // Write the file to disk
      await writeFile(filePath, buffer);
      
      // Verify file was written
      const fileExists = fs.existsSync(filePath);
      const fileStats = fileExists ? fs.statSync(filePath) : null;
      
      console.log(`[api/upload] File written successfully:`, {
        path: filePath,
        exists: fileExists,
        size: fileStats ? `${(fileStats.size / 1024).toFixed(2)} KB` : 'unknown'
      });
      
      // Calculate processing time
      const processingTime = Date.now() - startTime;
      
      // Construct the public URL path
      const fileUrl = `/uploads/${filename}`;
      
      // Return the public URL path
      return NextResponse.json({ 
        success: true, 
        fileUrl,
        fileName: file.name,
        fileSize: file.size,
        filePath,
        processingTime: `${processingTime}ms`
      });
    } catch (error) {
      console.error('[api/upload] Error saving file:', error);
      return NextResponse.json({ 
        error: 'Failed to save file',
        details: (error as Error).message,
        path: filePath
      }, { status: 500 });
    }
  } catch (error) {
    console.error('[api/upload] Upload error:', error);
    return NextResponse.json({ 
      error: 'Failed to process upload',
      details: (error as Error).message
    }, { status: 500 });
  }
} 