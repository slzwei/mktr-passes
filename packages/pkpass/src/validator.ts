import { ApplePassJson, ApplePassJsonSchema } from '@wallet-platform/core';
import { REQUIRED_IMAGE_SIZES, RECOMMENDED_IMAGE_SIZES, ImageValidationResult } from './types';
import sharp from 'sharp';

/**
 * Validates a pass.json structure according to Apple's requirements
 */
export function validatePassJson(passJson: ApplePassJson): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  try {
    ApplePassJsonSchema.parse(passJson);
  } catch (error: any) {
    errors.push(`Invalid pass.json structure: ${error.message}`);
    return { valid: false, errors };
  }

  // Additional Apple-specific validations
  if (passJson.formatVersion !== 1) {
    errors.push('formatVersion must be 1');
  }

  if (!passJson.passTypeIdentifier || !passJson.passTypeIdentifier.startsWith('pass.')) {
    errors.push('passTypeIdentifier must start with "pass."');
  }

  if (!passJson.teamIdentifier || passJson.teamIdentifier.length !== 10) {
    errors.push('teamIdentifier must be exactly 10 characters');
  }

  if (!passJson.serialNumber || passJson.serialNumber.length === 0) {
    errors.push('serialNumber is required');
  }

  if (!passJson.description || passJson.description.length === 0) {
    errors.push('description is required');
  }

  // Validate generic pass structure
  if (!passJson.generic) {
    errors.push('generic pass structure is required');
  } else {
    const hasFields = 
      (passJson.generic.primaryFields && passJson.generic.primaryFields.length > 0) ||
      (passJson.generic.secondaryFields && passJson.generic.secondaryFields.length > 0) ||
      (passJson.generic.auxiliaryFields && passJson.generic.auxiliaryFields.length > 0) ||
      (passJson.generic.backFields && passJson.generic.backFields.length > 0);

    if (!hasFields) {
      errors.push('At least one field (primary, secondary, auxiliary, or back) is required');
    }
  }

  // Validate barcode if present
  if (passJson.barcode) {
    const validFormats = ['PKBarcodeFormatQR', 'PKBarcodeFormatCode128', 'PKBarcodeFormatPDF417', 'PKBarcodeFormatAztec'];
    if (!validFormats.includes(passJson.barcode.format)) {
      errors.push(`Invalid barcode format: ${passJson.barcode.format}`);
    }

    if (!passJson.barcode.message || passJson.barcode.message.length === 0) {
      errors.push('Barcode message is required');
    }
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Validates image dimensions and requirements
 */
export async function validateImage(
  imageBuffer: Buffer,
  role: string,
  isRetina: boolean = false
): Promise<ImageValidationResult> {
  const errors: string[] = [];
  const warnings: string[] = [];

  try {
    const metadata = await sharp(imageBuffer).metadata();
    
    if (!metadata.width || !metadata.height) {
      errors.push(`Could not determine image dimensions for ${role}`);
      return { valid: false, errors, warnings };
    }

    const imageKey = isRetina ? `${role}@2x` : role;
    const requiredSize = REQUIRED_IMAGE_SIZES[imageKey];
    const recommendedSize = RECOMMENDED_IMAGE_SIZES[imageKey];

    if (requiredSize) {
      if (metadata.width !== requiredSize.w || metadata.height !== requiredSize.h) {
        errors.push(`${role} must be exactly ${requiredSize.w}x${requiredSize.h} pixels, got ${metadata.width}x${metadata.height}`);
      }
    }

    if (recommendedSize) {
      const widthDiff = Math.abs(metadata.width - recommendedSize.w);
      const heightDiff = Math.abs(metadata.height - recommendedSize.h);
      
      if (widthDiff > recommendedSize.tolerance || heightDiff > recommendedSize.tolerance) {
        warnings.push(`${role} recommended size is ${recommendedSize.w}x${recommendedSize.h} pixels (±${recommendedSize.tolerance}), got ${metadata.width}x${metadata.height}`);
      }
    }

    // Check if image is PNG
    if (metadata.format !== 'png') {
      errors.push(`${role} must be a PNG image, got ${metadata.format}`);
    }

    return { valid: errors.length === 0, errors, warnings };
  } catch (error: any) {
    errors.push(`Error processing ${role}: ${error.message}`);
    return { valid: false, errors, warnings };
  }
}

/**
 * Validates all required images are present
 */
export function validateRequiredImages(images: Record<string, Buffer>): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // icon and icon@2x are always required
  if (!images.icon) {
    errors.push('icon image is required');
  }
  
  if (!images['icon@2x']) {
    errors.push('icon@2x image is required');
  }

  return { valid: errors.length === 0, errors };
}
