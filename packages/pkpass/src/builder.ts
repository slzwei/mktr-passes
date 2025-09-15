import { promises as fs } from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import * as os from 'os';
import { ApplePassJson } from '@wallet-platform/core';
import { PkPassBuildOptions, PkPassBuildResult, REQUIRED_IMAGE_SIZES } from './types';
import { validatePassJson, validateRequiredImages, validateImage } from './validator';
import { createDetachedSignature, createDetachedSignatureForge } from './signer';

/**
 * Builds a .pkpass file from the provided options
 */
export async function buildPkPass(options: PkPassBuildOptions): Promise<PkPassBuildResult> {
  // Validate pass.json
  const passValidation = validatePassJson(options.passJson);
  if (!passValidation.valid) {
    throw new Error(`Invalid pass.json: ${passValidation.errors.join(', ')}`);
  }

  // Validate required images
  const imageValidation = validateRequiredImages(options.images);
  if (!imageValidation.valid) {
    throw new Error(`Missing required images: ${imageValidation.errors.join(', ')}`);
  }

  // Validate all images
  for (const [role, imageBuffer] of Object.entries(options.images)) {
    const isRetina = role.includes('@2x');
    const baseRole = role.replace('@2x', '');
    
    const validation = await validateImage(imageBuffer, baseRole, isRetina);
    if (!validation.valid) {
      throw new Error(`Invalid ${role} image: ${validation.errors.join(', ')}`);
    }
    
    if (validation.warnings.length > 0) {
      console.warn(`Warning for ${role}: ${validation.warnings.join(', ')}`);
    }
  }

  // Create temporary directory for building
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'pkpass-build-'));
  
  try {
    // Write pass.json
    const passJsonPath = path.join(tempDir, 'pass.json');
    await fs.writeFile(passJsonPath, JSON.stringify(options.passJson, null, 2), 'utf8');

    // Write images
    const manifestHashes: Record<string, string> = {};
    
    for (const [role, imageBuffer] of Object.entries(options.images)) {
      const imagePath = path.join(tempDir, `${role}.png`);
      await fs.writeFile(imagePath, imageBuffer);
      
      // Calculate SHA-1 hash for manifest
      const hash = crypto.createHash('sha1').update(imageBuffer).digest('hex');
      manifestHashes[`${role}.png`] = hash;
    }

    // Calculate SHA-1 hash for pass.json
    const passJsonHash = crypto.createHash('sha1').update(JSON.stringify(options.passJson, null, 2)).digest('hex');
    manifestHashes['pass.json'] = passJsonHash;

    // Create manifest.json
    const manifestPath = path.join(tempDir, 'manifest.json');
    await fs.writeFile(manifestPath, JSON.stringify(manifestHashes, null, 2), 'utf8');

    // Calculate SHA-1 hash for manifest.json
    const manifestHash = crypto.createHash('sha1').update(JSON.stringify(manifestHashes, null, 2)).digest('hex');
    manifestHashes['manifest.json'] = manifestHash;

    // Check if using dummy certificates
    const isDummyCert = options.signing.passTypeIdCert.toString('utf8') === 'DUMMY_CERTIFICATE';
    
    let signature: Buffer;
    
    if (isDummyCert) {
      // For development mode, create a dummy signature
      signature = Buffer.from('DUMMY_SIGNATURE');
    } else {
      // Create PKCS#7 detached signature
      const manifestBuffer = await fs.readFile(manifestPath);
      
      try {
        // Try OpenSSL first (preferred for spec fidelity)
        signature = await createDetachedSignature(manifestBuffer, options.signing);
      } catch (error) {
        console.warn('OpenSSL signing failed, falling back to node-forge:', error);
        // Fallback to node-forge
        signature = createDetachedSignatureForge(manifestBuffer, options.signing);
      }
    }

    // Write signature
    const signaturePath = path.join(tempDir, 'signature');
    await fs.writeFile(signaturePath, signature);

    // Create ZIP file
    const { exec } = require('child_process');
    const { promisify } = require('util');
    const execAsync = promisify(exec);

    // Ensure output directory exists
    await fs.mkdir(path.dirname(options.outputPath), { recursive: true });

    // Create ZIP using system zip command
    const absoluteOutputPath = path.resolve(options.outputPath);
    const zipCommand = `cd "${tempDir}" && zip -r "${absoluteOutputPath}" .`;
    
    await execAsync(zipCommand);

    // Get file size
    const stats = await fs.stat(options.outputPath);
    const size = stats.size;

    return {
      file: options.outputPath,
      size,
      manifestHashes
    };
  } finally {
    // Clean up temp directory
    await fs.rm(tempDir, { recursive: true, force: true });
  }
}

/**
 * Validates a .pkpass file structure
 */
export async function validatePkPass(filePath: string): Promise<{ valid: boolean; errors: string[] }> {
  const errors: string[] = [];

  try {
    // Check if file exists
    await fs.access(filePath);
    
    // Check if it's a valid ZIP file
    const { exec } = require('child_process');
    const { promisify } = require('util');
    const execAsync = promisify(exec);

    try {
      await execAsync(`unzip -t "${filePath}"`);
    } catch (error) {
      errors.push('File is not a valid ZIP archive');
      return { valid: false, errors };
    }

    // List contents
    const { stdout } = await execAsync(`unzip -l "${filePath}"`);
    const files = stdout.split('\n')
      .filter((line: string) => line.trim() && !line.includes('Archive:') && !line.includes('Length') && !line.includes('----') && !line.includes('files'))
      .map((line: string) => line.trim().split(/\s+/).pop())
      .filter(Boolean);

    // Check required files
    const requiredFiles = ['pass.json', 'manifest.json', 'signature', 'icon.png', 'icon@2x.png'];
    for (const requiredFile of requiredFiles) {
      if (!files.includes(requiredFile)) {
        errors.push(`Missing required file: ${requiredFile}`);
      }
    }

    // Check for unexpected files
    const allowedFiles = ['pass.json', 'manifest.json', 'signature', 'icon.png', 'icon@2x.png', 'logo.png', 'logo@2x.png', 'strip.png', 'strip@2x.png', 'background.png', 'background@2x.png', 'thumbnail.png', 'thumbnail@2x.png'];
    for (const file of files) {
      if (!allowedFiles.includes(file)) {
        errors.push(`Unexpected file: ${file}`);
      }
    }

    return { valid: errors.length === 0, errors };
  } catch (error: any) {
    errors.push(`Error validating .pkpass file: ${error.message}`);
    return { valid: false, errors };
  }
}
