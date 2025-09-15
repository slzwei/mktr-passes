#!/usr/bin/env node

/**
 * Test image validation with incorrect image size
 */

const { buildPkPass } = require('./packages/pkpass/dist/builder');
const sharp = require('sharp');

async function testImageValidation() {
  console.log('🧪 Testing image validation with incorrect size...');
  
  try {
    // Create an image with incorrect dimensions (icon should be 29x29, we'll make it 30x30)
    const incorrectIcon = await sharp({
      create: {
        width: 30,  // Should be 29
        height: 30, // Should be 29
        channels: 4,
        background: { r: 100, g: 100, b: 100, alpha: 1 }
      }
    }).png().toBuffer();
    
    const correctIcon2x = await sharp({
      create: {
        width: 58,
        height: 58,
        channels: 4,
        background: { r: 100, g: 100, b: 100, alpha: 1 }
      }
    }).png().toBuffer();
    
    const passJson = {
      formatVersion: 1,
      passTypeIdentifier: 'pass.com.example.wallet',
      teamIdentifier: '1234567890',
      organizationName: 'Test Organization',
      serialNumber: 'test-123',
      description: 'Test pass for validation',
      backgroundColor: 'rgb(60,65,80)',
      foregroundColor: 'rgb(255,255,255)',
      labelColor: 'rgb(255,255,255)',
      generic: {
        primaryFields: [{
          key: 'test',
          label: 'Test',
          value: 'Test Value'
        }],
        secondaryFields: [],
        auxiliaryFields: [],
        backFields: []
      }
    };
    
    const images = {
      icon: incorrectIcon,
      'icon@2x': correctIcon2x
    };
    
    const signing = {
      passTypeIdCert: Buffer.from('DUMMY_CERTIFICATE'),
      passTypeIdPassword: 'dummy',
      wwdrCert: Buffer.from('DUMMY_CERTIFICATE')
    };
    
    console.log('📏 Attempting to build with incorrect icon size (30x30 instead of 29x29)...');
    
    await buildPkPass({
      passJson,
      images,
      signing,
      outputPath: './test-invalid-size.pkpass'
    });
    
    console.log('❌ FAILED: Build should have failed with incorrect image size');
    return false;
    
  } catch (error) {
    console.log('✅ SUCCESS: Build correctly failed with error:');
    console.log(`   ${error.message}`);
    
    // Check if the error message contains the expected validation message
    if (error.message.includes('must be exactly 29x29 pixels')) {
      console.log('✅ Error message correctly identifies the size issue');
      return true;
    } else {
      console.log('❌ Error message does not match expected validation message');
      return false;
    }
  }
}

// Run the test
testImageValidation()
  .then(success => {
    if (success) {
      console.log('\n🎉 Image validation test PASSED');
      process.exit(0);
    } else {
      console.log('\n💥 Image validation test FAILED');
      process.exit(1);
    }
  })
  .catch(error => {
    console.log(`\n💥 Image validation test ERROR: ${error.message}`);
    process.exit(1);
  });
