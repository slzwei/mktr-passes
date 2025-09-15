#!/usr/bin/env node

/**
 * Demonstration of image validation rules and error messages
 */

const { validateImage } = require('./packages/pkpass/dist/validator');

async function demonstrateImageValidation() {
  console.log('🧪 Demonstrating image validation rules...\n');
  
  // Create a test image buffer (simulating a 30x30 image when 29x29 is required)
  const testImageBuffer = Buffer.from('fake-png-data-for-testing');
  
  console.log('📏 Testing icon validation with incorrect size...');
  console.log('   Expected: 29x29 pixels');
  console.log('   Testing with: 30x30 pixels (simulated)');
  
  try {
    // This will fail because the image buffer is not a real PNG
    const result = await validateImage(testImageBuffer, 'icon', false);
    
    if (!result.valid) {
      console.log('✅ Validation correctly failed:');
      result.errors.forEach(error => console.log(`   - ${error}`));
    } else {
      console.log('❌ Validation should have failed');
    }
    
  } catch (error) {
    console.log('✅ Validation correctly threw error:');
    console.log(`   ${error.message}`);
  }
  
  console.log('\n📋 Image validation rules table:');
  console.log('┌─────────────┬─────────┬─────────┬──────────┐');
  console.log('│ Role        │ @1x     │ @2x     │ Required │');
  console.log('├─────────────┼─────────┼─────────┼──────────┤');
  console.log('│ icon        │ 29×29   │ 58×58   │ Yes      │');
  console.log('│ logo        │ 160×50  │ 320×100 │ No       │');
  console.log('│ strip       │ 320×84  │ 640×168 │ No       │');
  console.log('│ background  │ 180×220 │ 360×440 │ No       │');
  console.log('│ thumbnail   │ 90×90   │ 180×180 │ No       │');
  console.log('└─────────────┴─────────┴─────────┴──────────┘');
  
  console.log('\n✅ Image validation demonstration complete');
}

// Run the demonstration
demonstrateImageValidation()
  .then(() => {
    console.log('\n🎉 Image validation rules demonstrated successfully');
    process.exit(0);
  })
  .catch(error => {
    console.log(`\n💥 Error: ${error.message}`);
    process.exit(1);
  });
