import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';

/**
 * API route that handles file uploads and saves them to the local filesystem
 * This is for development only - production would use cloud storage
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
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
      // Ensure the directory exists
      await mkdir(uploadsDir, { recursive: true });
      
      // Convert the file to an ArrayBuffer
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      
      // Write the file to disk
      await writeFile(filePath, buffer);
      
      // Return the public URL path
      return NextResponse.json({ 
        success: true, 
        fileUrl: `/uploads/${filename}`,
        fileName: file.name,
        fileSize: file.size,
      });
    } catch (error) {
      console.error('Error saving file:', error);
      return NextResponse.json({ 
        error: 'Failed to save file',
        details: (error as Error).message
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ 
      error: 'Failed to process upload',
      details: (error as Error).message
    }, { status: 500 });
  }
} 