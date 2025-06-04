import { NextResponse } from 'next/server';
import * as fs from 'fs';
import * as path from 'path';

// Ensure dynamic runtime to prevent caching
export const dynamic = 'force-dynamic';

/**
 * POST handler for fixing OpenAI API key format
 */
export async function POST() {
  try {
    console.log('Attempting to fix OpenAI API key format');
    
    // Path to .env.local file
    const envFilePath = path.join(process.cwd(), '.env.local');
    
    // Check if the file exists
    if (!fs.existsSync(envFilePath)) {
      return NextResponse.json(
        { error: '.env.local file not found' },
        { status: 404 }
      );
    }
    
    // Read the file
    let envContent = fs.readFileSync(envFilePath, 'utf8');
    
    // Look for OPENAI_API_KEY
    const keyRegex = /^OPENAI_API_KEY=(.+)$/m;
    const match = keyRegex.exec(envContent);
    
    if (!match) {
      return NextResponse.json(
        { error: 'OPENAI_API_KEY not found in .env.local file' },
        { status: 404 }
      );
    }
    
    const currentKey = match[1]!; // Non-null assertion since we know match exists
    
    // Check if it's a project-based key (starts with sk-proj-)
    if (!currentKey.startsWith('sk-proj-')) {
      return NextResponse.json({
        success: true,
        message: 'API key is already in the correct format',
        action: 'none',
        currentFormat: currentKey.startsWith('sk-') ? 'standard' : 'unknown'
      });
    }
    
    // Make a backup of the file
    const backupPath = `${envFilePath}.bak`;
    fs.copyFileSync(envFilePath, backupPath);
    
    // Extract the key part and create a standard key
    const keyPart = currentKey.substring('sk-proj-'.length);
    const newKey = `sk-${keyPart}`;
    
    // Replace the key in the file
    const updatedContent = envContent.replace(
      keyRegex,
      `OPENAI_API_KEY=${newKey}`
    );
    
    // Write the updated content back to the file
    fs.writeFileSync(envFilePath, updatedContent, 'utf8');
    
    return NextResponse.json({
      success: true,
      message: 'API key format has been updated',
      action: 'updated',
      previousFormat: 'project',
      currentFormat: 'standard'
    });
  } catch (error) {
    console.error('Error fixing OpenAI API key:', error);
    
    return NextResponse.json(
      {
        error: 'Error fixing OpenAI API key',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
} 