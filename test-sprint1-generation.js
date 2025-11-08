/**
 * Test Sprint 1 Generation
 * 
 * Quick test to verify all Sprint 1 features generate correctly
 */

import { generateFromSchema } from './packages/gen/dist/index.js';
import fs from 'fs/promises';
import path from 'path';

const testSchema = `
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

model User {
  id        Int      @id @default(autoincrement())
  email     String   @unique
  name      String?
  deletedAt DateTime?  // Soft-delete test
  posts     Post[]
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model Post {
  id        Int      @id @default(autoincrement())
  title     String
  content   String?
  published Boolean  @default(false)
  authorId  Int      // Required FK - should auto-include
  author    User     @relation(fields: [authorId], references: [id])
  deletedAt DateTime?  // Soft-delete test
  createdAt DateTime @default(now())
}
`;

async function runTest() {
  console.log('🧪 Testing Sprint 1 Generation...\n');
  
  const outputDir = path.join(process.cwd(), 'generated', 'sprint1-test');
  
  try {
    // Clean output
    await fs.rm(outputDir, { recursive: true, force: true });
    
    // Generate
    console.log('📦 Generating code from schema...');
    await generateFromSchema({
      schemaText: testSchema,
      output: outputDir,
      standalone: true,
      projectName: 'sprint1-test',
      framework: 'express'
    });
    
    console.log('\n✅ Generation complete!\n');
    
    // Verify Sprint 1 features
    console.log('🔍 Verifying Sprint 1 features:\n');
    
    const checks = [
      { name: 'Platform config', path: 'src/platform/config.ts' },
      { name: 'Platform logger', path: 'src/platform/logger.ts' },
      { name: 'Platform error handler', path: 'src/platform/error.ts' },
      { name: 'Platform security', path: 'src/platform/security.ts' },
      { name: 'Platform health', path: 'src/platform/health.ts' },
      { name: 'Server file', path: 'src/server.ts' },
      { name: 'Environment example', path: '.env.example' },
      { name: 'Environment development', path: '.env.development' },
      { name: 'Environment test', path: '.env.test' },
      { name: 'ESLint config', path: 'eslint.config.js' },
      { name: 'Prettier config', path: '.prettierrc' },
      { name: 'Vitest config', path: 'vitest.config.ts' },
      { name: 'Package.json', path: 'package.json' },
    ];
    
    for (const check of checks) {
      const filePath = path.join(outputDir, check.path);
      try {
        await fs.access(filePath);
        console.log(`  ✅ ${check.name}`);
      } catch {
        console.log(`  ❌ ${check.name} - MISSING`);
      }
    }
    
    console.log('\n📊 Checking generated service for Sprint 1 features:\n');
    
    // Check User service for soft-delete filtering
    const userServicePath = path.join(outputDir, 'src/services/user.service.ts');
    const userService = await fs.readFile(userServicePath, 'utf-8');
    
    const features = [
      { name: 'Soft-delete filtering', pattern: /deletedAt.*null/ },
      { name: 'Auto-includes support', pattern: /include.*\?\?/ },
      { name: 'asyncHandler import', pattern: /asyncHandler/ },
    ];
    
    for (const feature of features) {
      if (feature.pattern.test(userService)) {
        console.log(`  ✅ ${feature.name} - PRESENT`);
      } else {
        console.log(`  ⚠️  ${feature.name} - NOT FOUND`);
      }
    }
    
    console.log('\n📋 Checking controller for Sprint 1 features:\n');
    
    // Check User controller for asyncHandler
    const userControllerPath = path.join(outputDir, 'src/controllers/user.controller.ts');
    const userController = await fs.readFile(userControllerPath, 'utf-8');
    
    const controllerFeatures = [
      { name: 'asyncHandler wrapper', pattern: /asyncHandler\(async/ },
      { name: 'ValidationError', pattern: /new ValidationError/ },
      { name: 'NotFoundError', pattern: /new NotFoundError/ },
      { name: 'safeParse validation', pattern: /\.safeParse\(/ },
      { name: 'Location header', pattern: /\.location\(/ },
    ];
    
    for (const feature of controllerFeatures) {
      if (feature.pattern.test(userController)) {
        console.log(`  ✅ ${feature.name} - PRESENT`);
      } else {
        console.log(`  ⚠️  ${feature.name} - NOT FOUND`);
      }
    }
    
    console.log('\n✅ Sprint 1 test complete!\n');
    console.log(`📁 Generated code at: ${outputDir}\n`);
    
  } catch (error) {
    console.error('\n❌ Generation failed:');
    console.error(error);
    process.exit(1);
  }
}

runTest();

