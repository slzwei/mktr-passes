import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { AssetService } from '../services/asset.service';

const uploadSchema = z.object({
  role: z.enum(['icon', 'logo', 'strip', 'background', 'thumbnail']).optional(),
});

export async function uploadRoutes(fastify: FastifyInstance) {
  const assetService = new AssetService();

  // Register multipart support
  await fastify.register(require('@fastify/multipart'));

  fastify.post('/api/uploads', async (request, reply) => {
    try {
      const data = await (request as any).file();
      
      if (!data) {
        return reply.status(400).send({ error: 'No file uploaded' });
      }

      // Parse query parameters
      const query = uploadSchema.parse(request.query);
      
      // Convert stream to buffer
      const buffer = await data.toBuffer();
      
      // Upload asset
      const asset = await assetService.uploadAsset(
        buffer,
        data.filename,
        query.role
      );

      return {
        id: asset.id,
        sha256: asset.sha256,
        width: asset.width,
        height: asset.height,
        role: asset.role,
        originalName: asset.originalName,
      };
    } catch (error: any) {
      fastify.log.error(error);
      return reply.status(400).send({ 
        error: 'Upload failed', 
        message: error.message 
      });
    }
  });
}
