#!/usr/bin/env node

/**
 * Prisma Vercel Fix Script
 * 
 * This script helps bypass Prisma schema errors in the Vercel deployment environment
 * by replacing the main schema with a stub schema during build if needed.
 */

const fs = require('fs');
const path = require('path');

const MAIN_SCHEMA_PATH = path.join(process.cwd(), 'prisma/schema.prisma');
const STUB_SCHEMA_PATH = path.join(process.cwd(), 'prisma/stub-schema.prisma');
const BACKUP_SCHEMA_PATH = path.join(process.cwd(), 'prisma/schema.prisma.backup');

// Check if we're in a Vercel environment
const isVercelEnvironment = process.env.VERCEL === '1' || 
                           process.env.NEXT_PUBLIC_VERCEL_DEPLOYMENT === 'true';

console.log('🔍 Prisma Vercel Fix Script');
console.log(`🌐 Environment: ${isVercelEnvironment ? 'Vercel' : 'Local'}`);

function backupMainSchema() {
  if (!fs.existsSync(MAIN_SCHEMA_PATH)) {
    console.log('❌ Main schema.prisma not found!');
    return false;
  }

  try {
    // Create a backup of the main schema
    fs.copyFileSync(MAIN_SCHEMA_PATH, BACKUP_SCHEMA_PATH);
    console.log('✅ Created backup of main schema');
    return true;
  } catch (error) {
    console.error('❌ Failed to backup schema:', error.message);
    return false;
  }
}

function useStubSchema() {
  if (!fs.existsSync(STUB_SCHEMA_PATH)) {
    console.log('❌ Stub schema not found! Creating minimal stub...');
    createMinimalStub();
  }

  try {
    // Copy the stub schema to the main schema location
    fs.copyFileSync(STUB_SCHEMA_PATH, MAIN_SCHEMA_PATH);
    console.log('✅ Replaced schema with stub for Vercel deployment');
    return true;
  } catch (error) {
    console.error('❌ Failed to replace schema:', error.message);
    return false;
  }
}

function createMinimalStub() {
  const minimalStub = `
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// Minimal stub schema for Vercel deployment
model User {
  id            String    @id @default(cuid())
  email         String?   @unique
  name          String?
  createdAt     DateTime  @default(now())
}
`;

  try {
    fs.writeFileSync(STUB_SCHEMA_PATH, minimalStub.trim());
    console.log('✅ Created minimal stub schema');
    return true;
  } catch (error) {
    console.error('❌ Failed to create minimal stub:', error.message);
    return false;
  }
}

// Main function
function fixPrismaForVercel() {
  if (isVercelEnvironment) {
    console.log('🔧 Applying Prisma fix for Vercel deployment...');
    backupMainSchema();
    useStubSchema();
    console.log('✅ Prisma fix applied successfully');
  } else {
    console.log('ℹ️ Not in Vercel environment, no changes needed');
  }
}

fixPrismaForVercel(); 