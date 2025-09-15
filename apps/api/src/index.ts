import Fastify from 'fastify';
import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';
import { config } from './config';
import { uploadRoutes } from './routes/upload';
import { templateRoutes } from './routes/templates';
import { passRoutes } from './routes/passes';
import { passkitRoutes } from './passkit/routes';
import { internalRoutes } from './routes/internal';
import { outboxWorker } from './workers/outbox';

const fastify = Fastify({
  logger: {
    level: config.nodeEnv === 'development' ? 'info' : 'warn',
  },
});

async function start() {
  try {
    // Register CORS
    await fastify.register(cors, {
      origin: true, // Allow all origins in development
      credentials: true,
    });

    // Register rate limiting
    await fastify.register(rateLimit, {
      max: 100, // Maximum number of requests
      timeWindow: '1 minute', // Time window
      errorResponseBuilder: (request, context) => {
        return {
          code: 'RATE_LIMIT_EXCEEDED',
          message: `Rate limit exceeded, retry in ${Math.round(Number(context.after) / 1000)} seconds`,
          retryAfter: Math.round(Number(context.after) / 1000),
        };
      },
    });

    // Register routes
    await fastify.register(uploadRoutes);
    await fastify.register(templateRoutes);
    await fastify.register(passRoutes);
    await fastify.register(passkitRoutes);
    await fastify.register(internalRoutes);

    // Health check
    fastify.get('/health', async (request, reply) => {
      try {
        // Check database connectivity
        const { PrismaClient } = await import('@prisma/client');
        const prisma = new PrismaClient();
        await prisma.$queryRaw`SELECT 1`;
        await prisma.$disconnect();
        
        return { 
          ok: true, 
          db: 'up',
          version: process.env.npm_package_version || '1.0.0',
          timestamp: new Date().toISOString(),
          uptime: process.uptime()
        };
      } catch (error) {
        reply.status(503);
        return { 
          ok: false, 
          db: 'down',
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString()
        };
      }
    });

    // Start outbox worker
    outboxWorker.start();

    // Start server
    const address = await fastify.listen({ 
      port: config.port, 
      host: '0.0.0.0' 
    });
    
    console.log(`Server listening at ${address}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
}

start();
