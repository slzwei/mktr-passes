import { FastifyInstance } from 'fastify';
import { getAllTemplates, getTemplate } from '@wallet-platform/core';

export async function templateRoutes(fastify: FastifyInstance) {
  // Get all templates
  fastify.get('/api/templates', async (request, reply) => {
    try {
      const templates = getAllTemplates();
      
      // Return simplified template info
      const templateList = templates.map(template => ({
        id: template.id,
        name: template.name,
        style: template.style,
        images: template.images.map(img => ({
          role: img.role,
          required: img.required,
          recommendedSize: img.recommendedSize,
        })),
        variables: Object.entries(template.variables).map(([key, value]) => ({
          key,
          type: value.type,
          description: value.description,
          required: value.required,
          options: value.options,
        })),
        hasBarcode: !!template.barcode,
        defaultColors: template.defaultColors,
      }));

      return { templates: templateList };
    } catch (error: any) {
      fastify.log.error(error);
      return reply.status(500).send({ 
        error: 'Failed to get templates', 
        message: error.message 
      });
    }
  });

  // Get specific template
  fastify.get('/api/templates/:id', async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const template = getTemplate(id);
      
      if (!template) {
        return reply.status(404).send({ error: 'Template not found' });
      }

      return { template };
    } catch (error: any) {
      fastify.log.error(error);
      return reply.status(500).send({ 
        error: 'Failed to get template', 
        message: error.message 
      });
    }
  });
}
