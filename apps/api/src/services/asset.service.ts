import { promises as fs } from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import sharp from 'sharp';
import { v4 as uuidv4 } from 'uuid';
import { prisma } from '@wallet-platform/db';
import { config } from '../config';
import { AssetInfo } from '@wallet-platform/core';

export class AssetService {
  /**
   * Upload and process an image asset
   */
  async uploadAsset(
    file: Buffer,
    originalName: string,
    role?: string
  ): Promise<AssetInfo> {
    // Calculate SHA-256 hash for deduplication
    const sha256 = crypto.createHash('sha256').update(file).digest('hex');
    
    // Check if asset already exists
    const existingAsset = await prisma.asset.findUnique({
      where: { sha256 }
    });
    
    if (existingAsset) {
      return {
        id: existingAsset.id,
        role: existingAsset.role,
        originalName: existingAsset.originalName,
        width: existingAsset.width,
        height: existingAsset.height,
        sha256: existingAsset.sha256,
        path: existingAsset.path,
        createdAt: existingAsset.createdAt,
      };
    }

    // Get image metadata
    const metadata = await sharp(file).metadata();
    if (!metadata.width || !metadata.height) {
      throw new Error('Could not determine image dimensions');
    }

    // Validate image format
    if (metadata.format !== 'png') {
      throw new Error('Only PNG images are supported');
    }

    // Validate dimensions if role is specified
    if (role) {
      await this.validateImageDimensions(metadata.width, metadata.height, role);
    }

    // Generate unique filename
    const id = uuidv4();
    const extension = path.extname(originalName);
    const filename = `${id}${extension}`;
    const filePath = path.join(config.storageDir, filename);

    // Ensure storage directory exists
    await fs.mkdir(config.storageDir, { recursive: true });

    // Write file
    await fs.writeFile(filePath, file);

    // Save to database
    const asset = await prisma.asset.create({
      data: {
        id,
        role: role || 'unknown',
        originalName,
        width: metadata.width,
        height: metadata.height,
        sha256,
        path: filePath,
      }
    });

    return {
      id: asset.id,
      role: asset.role,
      originalName: asset.originalName,
      width: asset.width,
      height: asset.height,
      sha256: asset.sha256,
      path: asset.path,
      createdAt: asset.createdAt,
    };
  }

  /**
   * Get asset by ID
   */
  async getAsset(id: string): Promise<AssetInfo | null> {
    const asset = await prisma.asset.findUnique({
      where: { id }
    });

    if (!asset) {
      return null;
    }

    return {
      id: asset.id,
      role: asset.role,
      originalName: asset.originalName,
      width: asset.width,
      height: asset.height,
      sha256: asset.sha256,
      path: asset.path,
      createdAt: asset.createdAt,
    };
  }

  /**
   * Get asset file buffer
   */
  async getAssetBuffer(id: string): Promise<Buffer | null> {
    const asset = await this.getAsset(id);
    if (!asset) {
      return null;
    }

    try {
      return await fs.readFile(asset.path);
    } catch (error) {
      console.error(`Failed to read asset file: ${asset.path}`, error);
      return null;
    }
  }

  /**
   * Validate image dimensions for a specific role
   */
  private async validateImageDimensions(
    width: number,
    height: number,
    role: string
  ): Promise<void> {
    const requiredSizes: Record<string, { w: number; h: number }> = {
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

    const requiredSize = requiredSizes[role];
    if (requiredSize) {
      if (width !== requiredSize.w || height !== requiredSize.h) {
        throw new Error(
          `${role} must be exactly ${requiredSize.w}x${requiredSize.h} pixels, got ${width}x${height}`
        );
      }
    }
  }

  /**
   * Delete asset by ID
   */
  async deleteAsset(id: string): Promise<void> {
    const asset = await prisma.asset.findUnique({
      where: { id }
    });

    if (!asset) {
      throw new Error('Asset not found');
    }

    // Delete file
    try {
      await fs.unlink(asset.path);
    } catch (error) {
      console.warn(`Failed to delete asset file: ${asset.path}`, error);
    }

    // Delete from database
    await prisma.asset.delete({
      where: { id }
    });
  }
}
