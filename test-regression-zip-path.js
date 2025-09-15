#!/usr/bin/env node

/**
 * Regression test for ZIP path resolution bug fix
 * Tests building from a temp cwd with a relative output path
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

async function testZipPathFix() {
  console.log('🧪 Testing ZIP path resolution fix...');
  
  // Create a temporary working directory
  const tempCwd = fs.mkdtempSync(path.join(os.tmpdir(), 'zip-path-test-'));
  const originalCwd = process.cwd();
  
  try {
    // Change to temp directory
    process.chdir(tempCwd);
    console.log(`📁 Changed to temp directory: ${tempCwd}`);
    
    // Create a relative output path
    const relativeOutputPath = './test-output/sample-pass.pkpass';
    console.log(`📄 Using relative output path: ${relativeOutputPath}`);
    
    // Run CLI command from temp directory
    const cliPath = path.join(originalCwd, 'apps/cli/dist/index.js');
    const command = `node "${cliPath}" make-sample -t stamp_card_v1 --dev -o "${relativeOutputPath}"`;
    
    console.log(`🚀 Running: ${command}`);
    const output = execSync(command, { 
      encoding: 'utf8',
      cwd: tempCwd,
      stdio: 'pipe'
    });
    
    console.log('✅ CLI output:');
    console.log(output);
    
    // Check if file was created at the correct absolute path
    const expectedPath = path.resolve(tempCwd, relativeOutputPath);
    console.log(`🔍 Expected file at: ${expectedPath}`);
    
    if (fs.existsSync(expectedPath)) {
      const stats = fs.statSync(expectedPath);
      console.log(`✅ SUCCESS: File created at correct path`);
      console.log(`   Size: ${stats.size} bytes`);
      console.log(`   Path: ${expectedPath}`);
      
      // Verify it's a valid ZIP file
      try {
        execSync(`unzip -t "${expectedPath}"`, { stdio: 'pipe' });
        console.log(`✅ File is a valid ZIP archive`);
      } catch (error) {
        console.log(`❌ File is not a valid ZIP archive`);
        throw error;
      }
      
      return true;
    } else {
      console.log(`❌ FAILED: File not found at expected path`);
      return false;
    }
    
  } catch (error) {
    console.log(`❌ FAILED: ${error.message}`);
    return false;
  } finally {
    // Restore original working directory
    process.chdir(originalCwd);
    
    // Clean up temp directory
    try {
      fs.rmSync(tempCwd, { recursive: true, force: true });
      console.log(`🧹 Cleaned up temp directory: ${tempCwd}`);
    } catch (cleanupError) {
      console.log(`⚠️  Warning: Could not clean up temp directory: ${cleanupError.message}`);
    }
  }
}

// Run the test
testZipPathFix()
  .then(success => {
    if (success) {
      console.log('\n🎉 Regression test PASSED - ZIP path fix is working correctly');
      process.exit(0);
    } else {
      console.log('\n💥 Regression test FAILED - ZIP path fix is not working');
      process.exit(1);
    }
  })
  .catch(error => {
    console.log(`\n💥 Regression test ERROR: ${error.message}`);
    process.exit(1);
  });
