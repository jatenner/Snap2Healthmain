import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    console.log('[test-upload] Received POST request');
    
    // Parse the form data
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const goal = formData.get('goal') as string || 'Test Goal';
    
    console.log('[test-upload] Form data parsed:', {
      hasFile: !!file,
      fileName: file?.name,
      fileSize: file?.size,
      goal
    });
    
    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file provided' },
        { status: 400 }
      );
    }
    
    // Simple test response
    return NextResponse.json({
      success: true,
      message: 'File upload test successful',
      fileInfo: {
        name: file.name,
        size: file.size,
        type: file.type
      },
      goal,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('[test-upload] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Test upload failed', details: String(error) },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    success: true,
    message: 'Test upload endpoint is working',
    timestamp: new Date().toISOString()
  });
} 