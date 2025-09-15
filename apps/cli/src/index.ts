#!/usr/bin/env node

import { Command } from 'commander';
import { promises as fs } from 'fs';
import * as path from 'path';
import { z } from 'zod';
import { getTemplate, evaluateExpression, ApplePassJson } from '@wallet-platform/core';
import { buildPkPass, validatePkPass } from '@wallet-platform/pkpass';

const program = new Command();

program
  .name('wallet-cli')
  .description('CLI tool for Apple Wallet pass generation')
  .version('1.0.0');

program
  .command('make-sample')
  .description('Generate a sample .pkpass file')
  .requiredOption('-t, --template <templateId>', 'Template ID (stamp_card_v1, coupon_v1, membership_v1)')
  .option('-v, --vars <file>', 'Variables JSON file')
  .option('-i, --images <dir>', 'Images directory')
  .option('-o, --out <file>', 'Output .pkpass file path')
  .option('--dev', 'Use development mode (dummy certificates)')
  .option('--deterministic', 'Use deterministic serial numbers for reproducible builds')
  .action(async (options) => {
    try {
      await makeSample(options);
    } catch (error: any) {
      console.error('Error:', error.message);
      process.exit(1);
    }
  });

program
  .command('validate')
  .description('Validate a .pkpass file')
  .requiredOption('-f, --file <path>', '.pkpass file to validate')
  .action(async (options) => {
    try {
      await validatePass(options);
    } catch (error: any) {
      console.error('Error:', error.message);
      process.exit(1);
    }
  });

async function makeSample(options: any) {
  const templateId = options.template;
  const varsFile = options.vars;
  const imagesDir = options.images;
  const outputFile = options.out || `./dist/sample-${templateId}.pkpass`;
  const devMode = options.dev || process.env.DEV_SIGNING_MODE === 'mock';

  // Resolve paths relative to project root (two levels up from apps/cli)
  const projectRoot = path.resolve(__dirname, '../../..');
  const resolvedVarsFile = varsFile ? path.resolve(projectRoot, varsFile) : varsFile;
  const resolvedImagesDir = imagesDir ? path.resolve(projectRoot, imagesDir) : imagesDir;
  const resolvedOutputFile = path.resolve(projectRoot, outputFile);

  console.log(`Generating sample pass for template: ${templateId}`);

  // Get template
  const template = getTemplate(templateId);
  if (!template) {
    throw new Error(`Template not found: ${templateId}`);
  }
  
  console.log('Template fields:', template.fields?.length || 0);
  console.log('Template variables:', Object.keys(template.variables || {}));

  // Load variables
  let variables: Record<string, any> = {};
  if (resolvedVarsFile) {
    const varsContent = await fs.readFile(resolvedVarsFile, 'utf8');
    variables = JSON.parse(varsContent);
  } else {
    // Generate sample variables
    variables = generateSampleVariables(template);
  }

  // Load images
  const images: Record<string, Buffer> = {};
  if (resolvedImagesDir) {
    try {
      await loadImages(resolvedImagesDir, images);
      // If no images were loaded, generate sample images
      if (Object.keys(images).length === 0) {
        console.log('No images found in directory, generating sample images...');
        await generateSampleImages(template, images);
      }
    } catch (error) {
      console.log('Error loading images, generating sample images...');
      await generateSampleImages(template, images);
    }
  } else {
    // Generate sample images
    await generateSampleImages(template, images);
  }

  // Generate pass.json
  const passJson = generatePassJson(template, variables, options.deterministic);

  // Load certificates
  const certificates = await loadCertificates(devMode);

  // Ensure output directory exists
  await fs.mkdir(path.dirname(resolvedOutputFile), { recursive: true });

  // Build .pkpass
  const result = await buildPkPass({
    passJson,
    images,
    signing: certificates,
    outputPath: resolvedOutputFile,
  });

  console.log(`✅ Generated .pkpass file: ${result.file}`);
  console.log(`   Size: ${result.size} bytes`);
  console.log(`   Files: ${Object.keys(result.manifestHashes).length}`);
  
  if (devMode) {
    console.log('⚠️  Development mode: This pass will not work on real devices');
  }
}

async function validatePass(options: any) {
  const filePath = options.file;
  
  console.log(`Validating .pkpass file: ${filePath}`);
  
  const result = await validatePkPass(filePath);
  
  if (result.valid) {
    console.log('✅ .pkpass file is valid');
  } else {
    console.log('❌ .pkpass file is invalid:');
    result.errors.forEach(error => console.log(`   - ${error}`));
  }
}

function generateSampleVariables(template: any): Record<string, any> {
  const variables: Record<string, any> = {};
  
  for (const [key, varDef] of Object.entries(template.variables)) {
    const def = varDef as any;
    switch (def.type) {
      case 'string':
        variables[key] = `Sample ${key}`;
        break;
      case 'number':
        variables[key] = key.includes('Count') ? 3 : 8;
        break;
      case 'date':
        const futureDate = new Date();
        futureDate.setMonth(futureDate.getMonth() + 6);
        variables[key] = futureDate.toISOString().split('T')[0];
        break;
      case 'enum':
        variables[key] = def.options?.[0] || 'Sample';
        break;
      default:
        variables[key] = `Sample ${key}`;
    }
  }
  
  return variables;
}

async function loadImages(imagesDir: string, images: Record<string, Buffer>) {
  const files = await fs.readdir(imagesDir);
  
  for (const file of files) {
    if (file.endsWith('.png')) {
      const role = path.basename(file, '.png');
      const filePath = path.join(imagesDir, file);
      const buffer = await fs.readFile(filePath);
      images[role] = buffer;
    }
  }
}

async function generateSampleImages(template: any, images: Record<string, Buffer>) {
  const sharp = require('sharp');
  
  for (const imageSpec of template.images) {
    const { w, h } = imageSpec.recommendedSize;
    
    // Generate a simple colored rectangle
    const buffer = await sharp({
      create: {
        width: w,
        height: h,
        channels: 4,
        background: { r: 100, g: 100, b: 100, alpha: 1 }
      }
    })
    .png()
    .toBuffer();
    
    images[imageSpec.role] = buffer;
    
    // Also generate @2x version for required images
    if (imageSpec.role === 'icon') {
      const icon2xBuffer = await sharp({
        create: {
          width: w * 2,
          height: h * 2,
          channels: 4,
          background: { r: 100, g: 100, b: 100, alpha: 1 }
        }
      })
      .png()
      .toBuffer();
      
      images['icon@2x'] = icon2xBuffer;
    }
  }
}

function generatePassJson(template: any, variables: Record<string, any>, deterministic: boolean = false): ApplePassJson {
  const { v4: uuidv4 } = require('uuid');
  const serialNumber = deterministic ? 'deterministic-serial-12345' : uuidv4();
  
  // In deterministic mode, also fix timestamps
  const now = deterministic ? new Date('2024-01-01T00:00:00Z') : new Date();
  
  // Build fields
  const fields: any = {};
  
  for (const field of template.fields) {
    const value = evaluateExpression(field.valueExpr, variables);
    
    if (!fields[field.slot]) {
      fields[field.slot] = [];
    }
    
    fields[field.slot].push({
      key: field.key,
      label: field.label,
      value,
    });
  }
  
  console.log('Generated fields:', fields);

  // Build barcode if present
  let barcode: any = undefined;
  if (template.barcode) {
    barcode = {
      format: template.barcode.format,
      message: evaluateExpression(template.barcode.messageExpr, variables),
      messageEncoding: template.barcode.messageEncoding,
      altText: template.barcode.altTextExpr ? 
        evaluateExpression(template.barcode.altTextExpr, variables) : undefined,
    };
  }

  // Build colors
  const colors = template.defaultColors || {
    backgroundColor: 'rgb(60,65,80)',
    foregroundColor: 'rgb(255,255,255)',
    labelColor: 'rgb(255,255,255)',
  };

  // Use environment variables for CI mode, fallback to defaults
  const passTypeIdentifier = process.env.PASS_TYPE_IDENTIFIER || 'pass.com.example.wallet';
  const teamIdentifier = process.env.PASS_TEAM_IDENTIFIER || '1234567890';
  const organizationName = process.env.PASS_ORG_NAME || 'Sample Organization';

  return {
    formatVersion: 1,
    passTypeIdentifier,
    teamIdentifier,
    organizationName,
    serialNumber,
    description: `Sample ${template.name} - Generated by Wallet Platform CLI`,
    ...colors,
    generic: {
      primaryFields: fields.primary || [],
      secondaryFields: fields.secondary || [],
      auxiliaryFields: fields.auxiliary || [],
      backFields: fields.back || [],
    },
    barcode,
  };
}

async function loadCertificates(devMode: boolean): Promise<{
  passTypeIdCert: Buffer;
  passTypeIdPassword: string;
  wwdrCert: Buffer;
}> {
  // Check for CI mode via environment variable
  const isCiMode = process.env.DEV_SIGNING_MODE === 'mock' || devMode;
  
  if (isCiMode) {
    // Generate dummy certificates for development/CI mode
    console.log('⚠️  Using dummy certificates for development/CI mode');
    return generateDummyCertificates();
  }

  // Load real certificates from environment
  const passCertPath = process.env.APPLE_PASS_CERT_P12 || './infra/certs/pass.p12';
  const passCertPassword = process.env.APPLE_PASS_CERT_PASSWORD || 'changeme';
  const wwdrCertPath = process.env.APPLE_WWDR_CERT_PEM || './infra/certs/AppleWWDRCAG3.pem';

  try {
    const passTypeIdCert = await fs.readFile(passCertPath);
    const wwdrCert = await fs.readFile(wwdrCertPath);
    
    return {
      passTypeIdCert,
      passTypeIdPassword: passCertPassword,
      wwdrCert,
    };
  } catch (error) {
    throw new Error(`Failed to load certificates: ${error}. Use --dev for development mode.`);
  }
}

function generateDummyCertificates(): {
  passTypeIdCert: Buffer;
  passTypeIdPassword: string;
  wwdrCert: Buffer;
} {
  // For development, we'll create a simple pass without signing
  // In a real implementation, you'd generate self-signed certificates
  const dummyCert = Buffer.from('DUMMY_CERTIFICATE');
  
  return {
    passTypeIdCert: dummyCert,
    passTypeIdPassword: 'dummy',
    wwdrCert: dummyCert,
  };
}

program.parse();
