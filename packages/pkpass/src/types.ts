import { ApplePassJson } from '@wallet-platform/core';

export interface PkPassBuildOptions {
  passJson: ApplePassJson;
  images: Record<string, Buffer>; // role -> image buffer
  signing: {
    passTypeIdCert: Buffer; // P12 certificate
    passTypeIdPassword: string;
    wwdrCert: Buffer; // Apple WWDR certificate
  };
  outputPath: string;
}

export interface PkPassBuildResult {
  file: string;
  size: number;
  manifestHashes: Record<string, string>;
}

export interface ImageValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

// Apple's required image dimensions
export const REQUIRED_IMAGE_SIZES: Record<string, { w: number; h: number }> = {
  icon: { w: 29, h: 29 },
  'icon@2x': { w: 58, h: 58 },
  logo: { w: 160, h: 50 },
  'logo@2x': { w: 320, h: 100 },
  strip: { w: 320, h: 84 },
  'strip@2x': { w: 640, h: 168 },
  background: { w: 180, h: 220 },
  'background@2x': { w: 360, h: 440 },
  thumbnail: { w: 90, h: 90 },
  'thumbnail@2x': { w: 180, h: 180 },
};

// Apple's recommended image dimensions (with tolerance)
export const RECOMMENDED_IMAGE_SIZES: Record<string, { w: number; h: number; tolerance: number }> = {
  icon: { w: 29, h: 29, tolerance: 0 },
  'icon@2x': { w: 58, h: 58, tolerance: 0 },
  logo: { w: 160, h: 50, tolerance: 10 },
  'logo@2x': { w: 320, h: 100, tolerance: 20 },
  strip: { w: 320, h: 84, tolerance: 10 },
  'strip@2x': { w: 640, h: 168, tolerance: 20 },
  background: { w: 180, h: 220, tolerance: 10 },
  'background@2x': { w: 360, h: 440, tolerance: 20 },
  thumbnail: { w: 90, h: 90, tolerance: 5 },
  'thumbnail@2x': { w: 180, h: 180, tolerance: 10 },
};
