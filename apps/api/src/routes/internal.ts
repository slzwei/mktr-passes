import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { UpdateService } from '../services/update.service';

const prisma = new PrismaClient();

const incrementParamsSchema = z.object({
  serialNumber: z.string().min(1),
});

export async function internalRoutes(fastify: FastifyInstance) {
  // POST /internal/passes/:serialNumber/increment
  fastify.post('/internal/passes/:serialNumber/increment', {
    schema: {
      params: incrementParamsSchema,
    },
  }, async (request, reply) => {
    try {
      const { serialNumber } = request.params as any;

      // Find pass
      const pass = await prisma.pass.findUnique({
        where: { serialNumber },
        include: {
          template: true,
        },
      });

      if (!pass) {
        return reply.status(404).send({
          code: 'PASS_NOT_FOUND',
          message: 'Pass not found',
        });
      }

      // Increment stamp count in variablesJson
      const variables = pass.variablesJson as any;
      if (typeof variables === 'object' && variables !== null) {
        if (typeof variables.stampCount === 'number') {
          variables.stampCount += 1;
        } else {
          variables.stampCount = 1;
        }

        // Update pass with new variables
        await prisma.pass.update({
          where: { id: pass.id },
          data: {
            variablesJson: variables,
          },
        });

        // Bump update tag and enqueue pushes
        const newTag = await UpdateService.bumpPassUpdateTag(pass.id);
        await UpdateService.enqueuePassPushes(pass.id);

        return reply.status(200).send({
          success: true,
          serialNumber,
          newUpdateTag: newTag,
          stampCount: variables.stampCount,
        });
      } else {
        return reply.status(400).send({
          code: 'INVALID_VARIABLES',
          message: 'Pass variables are not in expected format',
        });
      }
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({
        code: 'INTERNAL_ERROR',
        message: 'Internal server error',
      });
    }
  });

  // GET /internal/outbox/status
  fastify.get('/internal/outbox/status', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const pending = await prisma.updateOutbox.count({
        where: { status: 'pending' },
      });

      const sent = await prisma.updateOutbox.count({
        where: { status: 'sent' },
      });

      const failed = await prisma.updateOutbox.count({
        where: { status: 'failed' },
      });

      return reply.status(200).send({
        pending,
        sent,
        failed,
        total: pending + sent + failed,
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({
        code: 'INTERNAL_ERROR',
        message: 'Internal server error',
      });
    }
  });

  // POST /internal/outbox/process
  fastify.post('/internal/outbox/process', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { outboxWorker } = await import('../workers/outbox');
      await outboxWorker.processOnce();

      return reply.status(200).send({
        success: true,
        message: 'Outbox processed once',
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({
        code: 'INTERNAL_ERROR',
        message: 'Internal server error',
      });
    }
  });
}
