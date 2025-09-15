import Fastify from 'fastify';
import { config } from './config';
import { outboxWorker } from './workers/outbox';

const fastify = Fastify({
  logger: {
    level: config.nodeEnv === 'development' ? 'info' : 'warn',
  },
});

async function startWorker() {
  try {
    // Health check endpoint for worker
    fastify.get('/healthz', async (request, reply) => {
      try {
        const workerStatus = outboxWorker.getHealthStatus();
        
        return {
          ok: true,
          worker: workerStatus,
          timestamp: new Date().toISOString(),
          uptime: process.uptime()
        };
      } catch (error) {
        reply.status(503);
        return {
          ok: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString()
        };
      }
    });

    // Start the worker
    outboxWorker.start();
    console.log('Worker ready - processing outbox entries');

    // Start health check server
    const address = await fastify.listen({ 
      port: 3001, 
      host: '0.0.0.0' 
    });
    
    console.log(`Worker health check server listening at ${address}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('Received SIGINT, shutting down worker gracefully...');
  outboxWorker.stop();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('Received SIGTERM, shutting down worker gracefully...');
  outboxWorker.stop();
  process.exit(0);
});

startWorker();
