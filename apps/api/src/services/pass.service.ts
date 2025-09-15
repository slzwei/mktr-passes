import { promises as fs } from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { prisma } from '@wallet-platform/db';
import { config } from '../config';
import { PassData, ApplePassJson, Template, evaluateExpression } from '@wallet-platform/core';
import { buildPkPass, PkPassBuildOptions } from '@wallet-platform/pkpass';
import { AssetService } from './asset.service';

export class PassService {
  constructor(private assetService: AssetService) {}

  /**
   * Validate pass data against template
   */
  async validatePassData(templateId: string, passData: PassData): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = [];

    // Get template
    const template = await this.getTemplate(templateId);
    if (!template) {
      errors.push('Template not found');
      return { valid: false, errors };
    }

    // Validate required variables
    for (const [varName, varDef] of Object.entries(template.variables)) {
      if (varDef.required && passData.variables[varName] === undefined) {
        errors.push(`Required variable '${varName}' is missing`);
      }
    }

    // Validate images
    for (const imageSpec of template.images) {
      if (imageSpec.required && !passData.images[imageSpec.role]) {
        errors.push(`Required image '${imageSpec.role}' is missing`);
      }
    }

    // Validate barcode if present
    if (template.barcode && passData.barcode) {
      if (!passData.barcode.message || passData.barcode.message.length === 0) {
        errors.push('Barcode message is required');
      }
    }

    return { valid: errors.length === 0, errors };
  }

  /**
   * Create a pass from template and data
   */
  async createPass(templateId: string, passData: PassData): Promise<{ id: string; downloadUrl: string }> {
    // Validate pass data
    const validation = await this.validatePassData(templateId, passData);
    if (!validation.valid) {
      throw new Error(`Invalid pass data: ${validation.errors.join(', ')}`);
    }

    // Get template
    const template = await this.getTemplate(templateId);
    if (!template) {
      throw new Error('Template not found');
    }

    // Generate pass.json
    const passJson = await this.generatePassJson(template, passData);

    // Get image buffers
    const imageBuffers: Record<string, Buffer> = {};
    for (const [role, assetId] of Object.entries(passData.images)) {
      const buffer = await this.assetService.getAssetBuffer(assetId);
      if (!buffer) {
        throw new Error(`Failed to load image for role: ${role}`);
      }
      imageBuffers[role] = buffer;
    }

    // Load certificates
    const certificates = await this.loadCertificates();

    // Build .pkpass file
    const passId = uuidv4();
    const outputPath = path.join(config.pkpassOutputDir, `${passId}.pkpass`);

    const buildOptions: PkPassBuildOptions = {
      passJson,
      images: imageBuffers,
      signing: certificates,
      outputPath,
    };

    const result = await buildPkPass(buildOptions);

    // Generate auth token for web service
    const authToken = uuidv4();

    // Save pass to database
    const pass = await prisma.pass.create({
      data: {
        id: passId,
        serialNumber: passJson.serialNumber,
        templateId,
        variablesJson: passData.variables,
        colorsJson: passData.colors || {},
        barcodeJson: passData.barcode || undefined,
        authToken,
        pkpassPath: result.file,
      }
    });

    // Create pass-asset associations
    for (const [role, assetId] of Object.entries(passData.images)) {
      await prisma.passAsset.create({
        data: {
          passId: pass.id,
          assetId,
          role,
        }
      });
    }

    const downloadUrl = `/api/passes/${passId}/download`;
    return { id: passId, downloadUrl };
  }

  /**
   * Get pass by ID
   */
  async getPass(id: string) {
    return await prisma.pass.findUnique({
      where: { id },
      include: {
        template: true,
        passAssets: {
          include: {
            asset: true
          }
        }
      }
    });
  }

  /**
   * Get pass .pkpass file buffer
   */
  async getPassBuffer(id: string): Promise<Buffer | null> {
    const pass = await prisma.pass.findUnique({
      where: { id }
    });

    if (!pass || !pass.pkpassPath) {
      return null;
    }

    try {
      return await fs.readFile(pass.pkpassPath);
    } catch (error) {
      console.error(`Failed to read pass file: ${pass.pkpassPath}`, error);
      return null;
    }
  }

  /**
   * Rebuild pass .pkpass file from current data
   */
  async rebuildPass(id: string): Promise<{ success: boolean; filePath?: string; error?: string }> {
    try {
      const pass = await this.getPass(id);
      if (!pass) {
        return { success: false, error: 'Pass not found' };
      }

      // Get template
      const template = await this.getTemplate(pass.templateId);
      if (!template) {
        return { success: false, error: 'Template not found' };
      }

      // Convert database data to PassData format
      const passData: PassData = {
        templateId: pass.templateId,
        variables: pass.variablesJson as any,
        colors: pass.colorsJson as any,
        barcode: pass.barcodeJson as any,
        images: {},
      };

      // Get image assets
      for (const passAsset of pass.passAssets) {
        const buffer = await this.assetService.getAssetBuffer(passAsset.assetId);
        if (buffer) {
          passData.images[passAsset.role] = passAsset.assetId;
        }
      }

      // Generate new pass.json
      const passJson = await this.generatePassJson(template, passData);

      // Get image buffers
      const imageBuffers: Record<string, Buffer> = {};
      for (const [role, assetId] of Object.entries(passData.images)) {
        const buffer = await this.assetService.getAssetBuffer(assetId);
        if (!buffer) {
          return { success: false, error: `Failed to load image for role: ${role}` };
        }
        imageBuffers[role] = buffer;
      }

      // Load certificates
      const certificates = await this.loadCertificates();

      // Build .pkpass file
      const outputPath = path.join(config.pkpassOutputDir, `${pass.id}_${(pass as any).lastUpdateTag || '0'}.pkpass`);

      const buildOptions: PkPassBuildOptions = {
        passJson,
        images: imageBuffers,
        signing: certificates,
        outputPath,
      };

      const result = await buildPkPass(buildOptions);

      // Update pass with new file path
      await prisma.pass.update({
        where: { id },
        data: {
          pkpassPath: result.file,
        },
      });

      return { success: true, filePath: result.file };
    } catch (error) {
      console.error('Failed to rebuild pass:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Get template by ID
   */
  private async getTemplate(templateId: string): Promise<Template | null> {
    // For now, return built-in templates
    // In the future, this would query the database
    const { getAllTemplates, getTemplate } = await import('@wallet-platform/core');
    return getTemplate(templateId) || null;
  }

  /**
   * Generate pass.json from template and data
   */
  private async generatePassJson(template: Template, passData: PassData): Promise<ApplePassJson> {
    const serialNumber = uuidv4();
    
    // Build fields
    const fields: any = {};
    
    for (const field of template.fields) {
      const value = evaluateExpression(field.valueExpr, passData.variables);
      
      if (!fields[field.slot]) {
        fields[field.slot] = [];
      }
      
      fields[field.slot].push({
        key: field.key,
        label: field.label,
        value,
      });
    }

    // Build barcode if present
    let barcode: any = undefined;
    if (template.barcode && passData.barcode) {
      barcode = {
        format: passData.barcode.format,
        message: passData.barcode.message,
        messageEncoding: passData.barcode.messageEncoding,
        altText: passData.barcode.altText,
      };
    }

    // Build colors
    const colors = {
      backgroundColor: passData.colors?.backgroundColor || template.defaultColors?.backgroundColor || 'rgb(60,65,80)',
      foregroundColor: passData.colors?.foregroundColor || template.defaultColors?.foregroundColor || 'rgb(255,255,255)',
      labelColor: passData.colors?.labelColor || template.defaultColors?.labelColor || 'rgb(255,255,255)',
    };

    return {
      formatVersion: 1,
      passTypeIdentifier: config.passTypeIdentifier,
      teamIdentifier: config.passTeamIdentifier,
      organizationName: config.passOrgName,
      serialNumber,
      description: `Generated by Wallet Platform - ${template.name}`,
      ...colors,
      generic: fields,
      barcode,
    };
  }

  /**
   * Load Apple Wallet certificates
   */
  private async loadCertificates(): Promise<{ passTypeIdCert: Buffer; passTypeIdPassword: string; wwdrCert: Buffer }> {
    try {
      const passTypeIdCert = await fs.readFile(config.applePassCertP12);
      const wwdrCert = await fs.readFile(config.appleWwdrCertPem);
      
      return {
        passTypeIdCert,
        passTypeIdPassword: config.applePassCertPassword,
        wwdrCert,
      };
    } catch (error) {
      throw new Error(`Failed to load certificates: ${error}`);
    }
  }
}
