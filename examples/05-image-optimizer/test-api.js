#!/usr/bin/env node

/**
 * Test script for Image Optimizer API
 * 
 * This script demonstrates all major features:
 * - Uploading images
 * - Converting formats (PNG ↔ JPG)
 * - Optimizing images
 * - Batch processing
 * - Using presets
 */

const fs = require('fs');
const path = require('path');

const API_URL = process.env.API_URL || 'http://localhost:3000';
const API_KEY = process.env.API_KEY || 'test-api-key-12345';

// Helper function for API calls
async function apiCall(endpoint, options = {}) {
  const url = `${API_URL}${endpoint}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      'X-API-Key': API_KEY,
      ...options.headers
    }
  });
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`API Error: ${response.status} - ${error}`);
  }
  
  return response.json();
}

// Test 1: Upload an image
async function testUpload() {
  console.log('\n📤 Test 1: Upload Image');
  console.log('========================');
  
  // Create a test image (or use existing one)
  const testImagePath = process.argv[2] || './test-image.png';
  
  if (!fs.existsSync(testImagePath)) {
    console.log('⚠️  No test image found. Please provide a path:');
    console.log('   node test-api.js /path/to/image.png');
    return null;
  }
  
  const formData = new FormData();
  const fileBlob = new Blob([fs.readFileSync(testImagePath)]);
  formData.append('file', fileBlob, path.basename(testImagePath));
  formData.append('tags', JSON.stringify(['test', 'demo']));
  
  const result = await apiCall('/api/images', {
    method: 'POST',
    body: formData
  });
  
  console.log('✅ Upload successful!');
  console.log(`   ID: ${result.id}`);
  console.log(`   Format: ${result.originalFormat}`);
  console.log(`   Size: ${(result.originalSize / 1024).toFixed(2)} KB`);
  console.log(`   Dimensions: ${result.originalWidth}x${result.originalHeight}`);
  
  return result;
}

// Test 2: Convert PNG to JPG
async function testConvertToJPG(imageId) {
  console.log('\n🔄 Test 2: Convert to JPG');
  console.log('========================');
  
  const result = await apiCall(`/api/images/${imageId}/convert`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      outputFormat: 'JPG',
      quality: 90,
      optimize: true
    })
  });
  
  console.log('✅ Conversion started!');
  console.log(`   Job ID: ${result.jobId}`);
  console.log(`   Status: ${result.status}`);
  
  // Wait for completion
  await waitForJob(result.jobId);
  
  return result.jobId;
}

// Test 3: Convert back to PNG
async function testConvertToPNG(imageId) {
  console.log('\n🔄 Test 3: Convert to PNG');
  console.log('========================');
  
  const result = await apiCall(`/api/images/${imageId}/convert`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      outputFormat: 'PNG',
      stripMetadata: true
    })
  });
  
  console.log('✅ Conversion started!');
  console.log(`   Job ID: ${result.jobId}`);
  
  await waitForJob(result.jobId);
  
  return result.jobId;
}

// Test 4: Optimize image
async function testOptimize(imageId) {
  console.log('\n⚡ Test 4: Optimize Image');
  console.log('========================');
  
  const result = await apiCall(`/api/images/${imageId}/optimize`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      level: 'HIGH',
      stripMetadata: true,
      quality: 85
    })
  });
  
  console.log('✅ Optimization started!');
  console.log(`   Job ID: ${result.jobId}`);
  
  const job = await waitForJob(result.jobId);
  
  if (job.status === 'COMPLETED') {
    const saved = job.inputSize - job.outputSize;
    const percent = ((saved / job.inputSize) * 100).toFixed(1);
    
    console.log(`   Saved: ${(saved / 1024).toFixed(2)} KB (${percent}%)`);
    console.log(`   Time: ${job.processingTime}ms`);
  }
  
  return result.jobId;
}

// Test 5: Convert to modern formats (WebP, AVIF)
async function testModernFormats(imageId) {
  console.log('\n🆕 Test 5: Convert to Modern Formats');
  console.log('====================================');
  
  // Convert to WebP
  console.log('Converting to WebP...');
  const webp = await apiCall(`/api/images/${imageId}/convert`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      outputFormat: 'WEBP',
      quality: 85
    })
  });
  
  await waitForJob(webp.jobId);
  
  // Convert to AVIF
  console.log('Converting to AVIF...');
  const avif = await apiCall(`/api/images/${imageId}/convert`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      outputFormat: 'AVIF',
      quality: 85
    })
  });
  
  await waitForJob(avif.jobId);
  
  console.log('✅ Modern format conversions complete!');
}

// Test 6: Create and use preset
async function testPreset(imageId) {
  console.log('\n🎨 Test 6: Presets');
  console.log('==================');
  
  // Create preset
  const preset = await apiCall('/api/presets', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'web-thumbnail',
      description: 'Square thumbnail for web',
      operation: 'CONVERT_OPTIMIZE',
      outputFormat: 'WEBP',
      width: 300,
      height: 300,
      quality: 85,
      maintainAspect: false,
      isPublic: true
    })
  });
  
  console.log(`✅ Preset created: ${preset.name}`);
  
  // Use preset
  const result = await apiCall(`/api/images/${imageId}/convert-preset/${preset.id}`, {
    method: 'POST'
  });
  
  console.log(`✅ Applied preset to image`);
  
  await waitForJob(result.jobId);
}

// Test 7: Batch operations
async function testBatch(imageIds) {
  console.log('\n📦 Test 7: Batch Processing');
  console.log('===========================');
  
  if (imageIds.length < 2) {
    console.log('⚠️  Need at least 2 images for batch test');
    return;
  }
  
  const result = await apiCall('/api/batch/convert', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      imageIds: imageIds.slice(0, 2),
      outputFormat: 'WEBP',
      quality: 85,
      optimize: true
    })
  });
  
  console.log(`✅ Batch job started: ${result.batchId}`);
  console.log(`   Total images: ${result.totalImages}`);
  
  // Monitor progress
  let batch;
  do {
    await new Promise(resolve => setTimeout(resolve, 1000));
    batch = await apiCall(`/api/batch/${result.batchId}`);
    
    const progress = ((batch.processedImages / batch.totalImages) * 100).toFixed(0);
    process.stdout.write(`\r   Progress: ${progress}%`);
  } while (batch.status === 'PROCESSING');
  
  console.log('\n✅ Batch complete!');
  
  if (batch.totalSaved) {
    console.log(`   Total saved: ${(batch.totalSaved / 1024).toFixed(2)} KB`);
    console.log(`   Average time: ${batch.averageTime}ms per image`);
  }
}

// Test 8: Get stats
async function testStats() {
  console.log('\n📊 Test 8: Statistics');
  console.log('====================');
  
  const stats = await apiCall('/api/stats');
  
  console.log(`✅ Total images: ${stats.totalImages}`);
  console.log(`   Total conversions: ${stats.totalConversions}`);
  console.log(`   Space saved: ${(stats.totalSpaceSaved / 1024 / 1024).toFixed(2)} MB`);
  console.log(`   Avg compression: ${stats.averageCompressionRatio?.toFixed(1)}%`);
  
  if (stats.formatDistribution) {
    console.log('   Format distribution:');
    Object.entries(stats.formatDistribution).forEach(([format, percent]) => {
      console.log(`     ${format}: ${percent}%`);
    });
  }
}

// Helper: Wait for job completion
async function waitForJob(jobId, maxWait = 30000) {
  const startTime = Date.now();
  
  while (Date.now() - startTime < maxWait) {
    const job = await apiCall(`/api/jobs/${jobId}`);
    
    if (job.status === 'COMPLETED') {
      return job;
    }
    
    if (job.status === 'FAILED') {
      throw new Error(`Job failed: ${job.errorMessage}`);
    }
    
    process.stdout.write(`\r   Progress: ${job.progress}%`);
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  throw new Error('Job timeout');
}

// Run all tests
async function runTests() {
  console.log('🧪 Image Optimizer API Test Suite');
  console.log('==================================');
  console.log(`API URL: ${API_URL}`);
  
  try {
    // Test 1: Upload
    const image = await testUpload();
    if (!image) return;
    
    const imageIds = [image.id];
    
    // Test 2-3: Format conversions
    await testConvertToJPG(image.id);
    await testConvertToPNG(image.id);
    
    // Test 4: Optimization
    await testOptimize(image.id);
    
    // Test 5: Modern formats
    await testModernFormats(image.id);
    
    // Test 6: Presets
    await testPreset(image.id);
    
    // Upload another image for batch test
    const image2 = await testUpload();
    if (image2) imageIds.push(image2.id);
    
    // Test 7: Batch processing
    await testBatch(imageIds);
    
    // Test 8: Stats
    await testStats();
    
    console.log('\n\n✅ All tests passed! 🎉');
    console.log('\nYour Image Optimizer API is working perfectly!');
    
  } catch (error) {
    console.error('\n\n❌ Test failed:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  runTests();
}

module.exports = { runTests, apiCall };

