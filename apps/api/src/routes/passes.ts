import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { PassDataSchema } from '@wallet-platform/core';
import { PassService } from '../services/pass.service';
import { AssetService } from '../services/asset.service';

const validatePassSchema = z.object({
  templateId: z.string(),
  variables: z.record(z.any()),
  colors: z.object({
    backgroundColor: z.string().optional(),
    foregroundColor: z.string().optional(),
    labelColor: z.string().optional(),
  }).optional(),
  barcode: z.object({
    format: z.string(),
    message: z.string(),
    messageEncoding: z.string().optional(),
    altText: z.string().optional(),
  }).optional(),
  images: z.record(z.string()),
});

const createPassSchema = PassDataSchema;

export async function passRoutes(fastify: FastifyInstance) {
  const assetService = new AssetService();
  const passService = new PassService(assetService);

  // Validate pass data
  fastify.post('/api/passes/validate', async (request, reply) => {
    try {
      const data = validatePassSchema.parse(request.body);
      
      const validation = await passService.validatePassData(data.templateId, data);
      
      return {
        ok: validation.valid,
        errors: validation.errors,
      };
    } catch (error: any) {
      fastify.log.error(error);
      return reply.status(400).send({ 
        error: 'Validation failed', 
        message: error.message 
      });
    }
  });

  // Create pass
  fastify.post('/api/passes', async (request, reply) => {
    try {
      const data = createPassSchema.parse(request.body);
      
      const result = await passService.createPass(data.templateId, data);
      
      return {
        id: result.id,
        downloadUrl: result.downloadUrl,
      };
    } catch (error: any) {
      fastify.log.error(error);
      return reply.status(400).send({ 
        error: 'Pass creation failed', 
        message: error.message 
      });
    }
  });

  // Download pass
  fastify.get('/api/passes/:id/download', async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      
      const buffer = await passService.getPassBuffer(id);
      
      if (!buffer) {
        return reply.status(404).send({ error: 'Pass not found' });
      }

      // Set appropriate headers for .pkpass file
      reply.type('application/vnd.apple.pkpass');
      reply.header('Content-Disposition', `attachment; filename="${id}.pkpass"`);
      
      return reply.send(buffer);
    } catch (error: any) {
      fastify.log.error(error);
      return reply.status(500).send({ 
        error: 'Download failed', 
        message: error.message 
      });
    }
  });

  // Get pass info
  fastify.get('/api/passes/:id', async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      
      const pass = await passService.getPass(id);
      
      if (!pass) {
        return reply.status(404).send({ error: 'Pass not found' });
      }

      return {
        id: pass.id,
        templateId: pass.templateId,
        variables: pass.variablesJson,
        colors: pass.colorsJson,
        barcode: pass.barcodeJson,
        createdAt: pass.createdAt,
        updatedAt: pass.updatedAt,
        assets: pass.passAssets.map(pa => ({
          role: pa.role,
          asset: {
            id: pa.asset.id,
            originalName: pa.asset.originalName,
            width: pa.asset.width,
            height: pa.asset.height,
          }
        })),
      };
    } catch (error: any) {
      fastify.log.error(error);
      return reply.status(500).send({ 
        error: 'Failed to get pass', 
        message: error.message 
      });
    }
  });
}
