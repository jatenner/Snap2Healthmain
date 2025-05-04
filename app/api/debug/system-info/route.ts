import { NextResponse } from 'next/server';
import { readFileSync } from 'fs';
import path from 'path';
import os from 'os';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    // Get Next.js version from package.json
    let nextVersion = 'Unknown';
    try {
      const packageJsonPath = path.join(process.cwd(), 'package.json');
      const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'));
      nextVersion = packageJson.dependencies.next || 'Not found';
    } catch (error) {
      console.error('Error reading package.json:', error);
    }

    // Basic system information
    const info = {
      nextVersion,
      nodeVersion: process.version,
      platform: `${os.platform()} (${os.release()})`,
      cpuArch: os.arch(),
      cpuCores: os.cpus().length,
      totalMemory: `${Math.round(os.totalmem() / (1024 * 1024 * 1024))} GB`,
      freeMemory: `${Math.round(os.freemem() / (1024 * 1024 * 1024))} GB`,
      uptime: `${Math.floor(os.uptime() / 3600)} hours, ${Math.floor((os.uptime() % 3600) / 60)} minutes`,
      environment: process.env.NODE_ENV || 'Unknown',
      serverTime: new Date().toISOString(),
      
      // Add Next.js specific information if available
      buildId: process.env.BUILD_ID || 'Development',
      
      // Add Vercel-specific environment variables if they exist
      vercelEnv: process.env.VERCEL_ENV || 'Not Vercel',
      vercelRegion: process.env.VERCEL_REGION || 'N/A',
      
      // Cache-related headers that will be used in the response
      cacheControl: 'no-store, no-cache, must-revalidate',
    };

    // Send the response with appropriate cache headers
    return NextResponse.json(info, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
        'CDN-Cache-Control': 'no-store, no-cache, max-age=0',
        'Surrogate-Control': 'no-store',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });
  } catch (error) {
    console.error('Error generating system info:', error);
    return NextResponse.json({ error: 'Failed to generate system info' }, { status: 500 });
  }
} 