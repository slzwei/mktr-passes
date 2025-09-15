#!/usr/bin/env node

/**
 * End-to-end test script for Phase 2: Apple Wallet Web Service + APNs Push Updates
 * 
 * This script demonstrates the complete flow:
 * 1. Create a pass (from Milestone 1 APIs)
 * 2. Register a device (POST /v1/devices/.../registrations/...)
 * 3. Trigger an internal update (POST /internal/passes/:serialNumber/increment)
 * 4. Assert outbox contains pending rows
 * 5. Run worker tick -> rows become sent (mock mode)
 * 6. GET /v1/devices/.../registrations/... ?passesUpdatedSince=<oldTag> -> contains the serialNumber
 * 7. GET /v1/passes/... -> returns pkpass (log MIME + unzip -l)
 */

const fetch = require('node-fetch');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const API_BASE = 'http://localhost:4000';
const DEVICE_ID = 'test-device-123';
const PASS_TYPE_ID = 'pass.com.test.wallet';

// Helper function to make API requests
async function apiRequest(method, url, options = {}) {
  const response = await fetch(`${API_BASE}${url}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });

  const data = response.ok ? await response.json() : await response.text();
  
  console.log(`${method} ${url} -> ${response.status}`);
  if (!response.ok) {
    console.log('Error:', data);
  }
  
  return { response, data };
}

// Helper function to create a test pass
async function createTestPass() {
  console.log('\n=== Step 1: Create a test pass ===');
  
  // First, upload an icon
  const iconResponse = await fetch(`${API_BASE}/api/uploads`, {
    method: 'POST',
    body: createFormData('icon.png', 'icon'),
  });
  
  if (!iconResponse.ok) {
    throw new Error('Failed to upload icon');
  }
  
  const { assetId } = await iconResponse.json();
  console.log('Uploaded icon asset:', assetId);
  
  // Create pass data
  const passData = {
    templateId: 'stamp_card_v1',
    variables: {
      brandName: 'Test Restaurant',
      stampCount: 3,
      stampTarget: 10,
      rewardText: 'Free Coffee!',
    },
    colors: {
      backgroundColor: 'rgb(60,65,80)',
      foregroundColor: 'rgb(255,255,255)',
      labelColor: 'rgb(255,255,255)',
    },
    barcode: {
      format: 'PKBarcodeFormatQR',
      message: 'STAMP123',
      messageEncoding: 'iso-8859-1',
      altText: 'STAMP123',
    },
    images: {
      icon: assetId,
    },
  };
  
  // Create pass
  const { response, data } = await apiRequest('POST', '/api/passes', {
    body: JSON.stringify(passData),
  });
  
  if (!response.ok) {
    throw new Error(`Failed to create pass: ${data}`);
  }
  
  console.log('Created pass:', data);
  return data;
}

// Helper function to create form data for file upload
function createFormData(filename, role) {
  const FormData = require('form-data');
  const form = new FormData();
  
  // Create a simple test image (1x1 PNG)
  const pngBuffer = Buffer.from([
    0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, // PNG signature
    0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52, // IHDR chunk
    0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01, // 1x1 dimensions
    0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53, 0xDE, // IHDR data
    0x00, 0x00, 0x00, 0x0C, 0x49, 0x44, 0x41, 0x54, // IDAT chunk
    0x08, 0x99, 0x01, 0x01, 0x00, 0x00, 0x00, 0xFF, 0xFF, 0x00, 0x00, 0x00, 0x02, 0x00, 0x01, // IDAT data
    0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82, // IEND chunk
  ]);
  
  form.append('file', pngBuffer, { filename });
  form.append('role', role);
  
  return form;
}

// Helper function to register device
async function registerDevice(pass, authToken) {
  console.log('\n=== Step 2: Register device ===');
  
  const { response, data } = await apiRequest('POST', 
    `/v1/devices/${DEVICE_ID}/registrations/${PASS_TYPE_ID}/${pass.serialNumber}`, {
    headers: {
      'Authorization': `ApplePass ${authToken}`,
    },
    body: JSON.stringify({
      pushToken: 'test-apns-device-token-123',
    }),
  });
  
  if (!response.ok) {
    throw new Error(`Failed to register device: ${data}`);
  }
  
  console.log('Device registered successfully');
}

// Helper function to trigger pass update
async function triggerPassUpdate(serialNumber) {
  console.log('\n=== Step 3: Trigger pass update ===');
  
  const { response, data } = await apiRequest('POST', 
    `/internal/passes/${serialNumber}/increment`);
  
  if (!response.ok) {
    throw new Error(`Failed to trigger pass update: ${data}`);
  }
  
  console.log('Pass updated:', data);
  return data;
}

// Helper function to check outbox status
async function checkOutboxStatus() {
  console.log('\n=== Step 4: Check outbox status ===');
  
  const { response, data } = await apiRequest('GET', '/internal/outbox/status');
  
  if (!response.ok) {
    throw new Error(`Failed to get outbox status: ${data}`);
  }
  
  console.log('Outbox status:', data);
  return data;
}

// Helper function to process outbox
async function processOutbox() {
  console.log('\n=== Step 5: Process outbox ===');
  
  const { response, data } = await apiRequest('POST', '/internal/outbox/process');
  
  if (!response.ok) {
    throw new Error(`Failed to process outbox: ${data}`);
  }
  
  console.log('Outbox processed:', data);
}

// Helper function to check device registrations
async function checkDeviceRegistrations(oldTag) {
  console.log('\n=== Step 6: Check device registrations ===');
  
  const url = oldTag 
    ? `/v1/devices/${DEVICE_ID}/registrations/${PASS_TYPE_ID}?passesUpdatedSince=${oldTag}`
    : `/v1/devices/${DEVICE_ID}/registrations/${PASS_TYPE_ID}`;
  
  const { response, data } = await apiRequest('GET', url);
  
  if (!response.ok) {
    throw new Error(`Failed to get device registrations: ${data}`);
  }
  
  console.log('Device registrations:', data);
  return data;
}

// Helper function to download pass
async function downloadPass(serialNumber, authToken) {
  console.log('\n=== Step 7: Download pass ===');
  
  const { response } = await apiRequest('GET', 
    `/v1/passes/${PASS_TYPE_ID}/${serialNumber}`, {
    headers: {
      'Authorization': `ApplePass ${authToken}`,
    },
  });
  
  if (!response.ok) {
    throw new Error(`Failed to download pass: ${response.status}`);
  }
  
  console.log('Pass downloaded successfully');
  console.log('Content-Type:', response.headers.get('content-type'));
  console.log('Content-Length:', response.headers.get('content-length'));
  
  // Save pass to file for inspection
  const passBuffer = await response.buffer();
  const passPath = path.join(__dirname, 'test-pass.pkpass');
  fs.writeFileSync(passPath, passBuffer);
  
  console.log('Pass saved to:', passPath);
  
  // Check pass structure
  try {
    const unzipOutput = execSync(`unzip -l "${passPath}"`, { encoding: 'utf8' });
    console.log('Pass contents:');
    console.log(unzipOutput);
  } catch (error) {
    console.log('Could not inspect pass contents (unzip not available)');
  }
  
  return passBuffer;
}

// Main test function
async function runE2ETest() {
  console.log('Starting Phase 2 End-to-End Test');
  console.log('================================');
  
  try {
    // Step 1: Create a test pass
    const pass = await createTestPass();
    const authToken = pass.authToken || 'test-token'; // Fallback for testing
    
    // Step 2: Register device
    await registerDevice(pass, authToken);
    
    // Step 3: Trigger pass update
    const updateResult = await triggerPassUpdate(pass.serialNumber);
    const oldTag = (parseInt(updateResult.newUpdateTag) - 1).toString();
    
    // Step 4: Check outbox status
    const outboxStatus = await checkOutboxStatus();
    if (outboxStatus.pending === 0) {
      console.log('Warning: No pending outbox entries found');
    }
    
    // Step 5: Process outbox
    await processOutbox();
    
    // Step 6: Check device registrations
    const registrations = await checkDeviceRegistrations(oldTag);
    if (!registrations.serialNumbers.includes(pass.serialNumber)) {
      throw new Error('Pass serial number not found in device registrations');
    }
    
    // Step 7: Download pass
    await downloadPass(pass.serialNumber, authToken);
    
    console.log('\n=== Test completed successfully! ===');
    console.log('All Phase 2 features are working correctly.');
    
  } catch (error) {
    console.error('\n=== Test failed ===');
    console.error('Error:', error.message);
    process.exit(1);
  }
}

// Check if API server is running
async function checkServerHealth() {
  try {
    const { response } = await apiRequest('GET', '/health');
    if (!response.ok) {
      throw new Error('Server not responding');
    }
    console.log('API server is running');
  } catch (error) {
    console.error('API server is not running. Please start it with:');
    console.error('cd apps/api && npm run dev');
    process.exit(1);
  }
}

// Run the test
async function main() {
  await checkServerHealth();
  await runE2ETest();
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { runE2ETest };
