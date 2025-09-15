import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { config } from '../config';
import { PassService } from '../services/pass.service';
import { AssetService } from '../services/asset.service';

const prisma = new PrismaClient();
const assetService = new AssetService();
const passService = new PassService(assetService);

// Validation schemas
const deviceRegistrationSchema = z.object({
  pushToken: z.string().min(1),
});

const deviceRegistrationParamsSchema = z.object({
  deviceLibraryIdentifier: z.string().min(1),
  passTypeIdentifier: z.string().min(1),
  serialNumber: z.string().min(1),
});

const deviceUnregistrationParamsSchema = z.object({
  deviceLibraryIdentifier: z.string().min(1),
  passTypeIdentifier: z.string().min(1),
  serialNumber: z.string().min(1),
});

const deviceRegistrationsQuerySchema = z.object({
  passesUpdatedSince: z.string().optional(),
});

const passDownloadParamsSchema = z.object({
  passTypeIdentifier: z.string().min(1),
  serialNumber: z.string().min(1),
});

const logSchema = z.object({
  logs: z.array(z.string()),
});

// Auth middleware
async function authenticatePass(request: FastifyRequest, reply: FastifyReply) {
  const authHeader = request.headers.authorization;
  
  if (!authHeader) {
    return reply.status(401).send({
      code: 'UNAUTHORIZED',
      message: 'Authorization header required',
    });
  }

  const [scheme, token] = authHeader.split(' ');
  
  if (scheme !== config.passWebAuthScheme) {
    return reply.status(401).send({
      code: 'UNAUTHORIZED',
      message: `Invalid authorization scheme. Expected: ${config.passWebAuthScheme}`,
    });
  }

  if (!token) {
    return reply.status(401).send({
      code: 'UNAUTHORIZED',
      message: 'Authorization token required',
    });
  }

  // Store token for use in route handlers
  (request as any).authToken = token;
}

// Helper to find pass by serial number and verify auth token
async function findPassBySerial(serialNumber: string, authToken: string) {
  const pass = await prisma.pass.findUnique({
    where: { serialNumber },
    include: {
      template: true,
    },
  });

  if (!pass) {
    return null;
  }

  if (pass.authToken !== authToken) {
    return null;
  }

  return pass;
}

export async function passkitRoutes(fastify: FastifyInstance) {
  // Register rate limiting for PassKit endpoints
  await fastify.register(require('@fastify/rate-limit'), {
    max: 10, // Lower limit for device registration
    timeWindow: '1 minute',
    errorResponseBuilder: (request: any, context: any) => {
      return {
        code: 'RATE_LIMIT_EXCEEDED',
        message: `Device registration rate limit exceeded, retry in ${Math.round(context.after / 1000)} seconds`,
        retryAfter: Math.round(context.after / 1000),
      };
    },
  });
  // POST /v1/devices/:deviceLibraryIdentifier/registrations/:passTypeIdentifier/:serialNumber
  fastify.post('/v1/devices/:deviceLibraryIdentifier/registrations/:passTypeIdentifier/:serialNumber', {
    preHandler: authenticatePass,
    schema: {
      params: deviceRegistrationParamsSchema,
      body: deviceRegistrationSchema,
    },
  }, async (request, reply) => {
    try {
      const { deviceLibraryIdentifier, passTypeIdentifier, serialNumber } = request.params as any;
      const { pushToken } = request.body as any;
      const authToken = (request as any).authToken;

      // Find and verify pass
      const pass = await findPassBySerial(serialNumber, authToken);
      if (!pass) {
        return reply.status(404).send({
          code: 'PASS_NOT_FOUND',
          message: 'Pass not found or invalid authorization token',
        });
      }

      // Verify pass type identifier matches
      if ((pass.template.schemaJson as any)?.passTypeIdentifier !== passTypeIdentifier) {
        return reply.status(400).send({
          code: 'INVALID_PASS_TYPE',
          message: 'Pass type identifier does not match',
        });
      }

      // Upsert device
      const device = await prisma.device.upsert({
        where: { deviceLibraryIdentifier },
        update: { pushToken },
        create: {
          deviceLibraryIdentifier,
          pushToken,
        },
      });

      // Upsert pass registration
      await prisma.passRegistration.upsert({
        where: {
          passId_deviceId: {
            passId: pass.id,
            deviceId: device.id,
          },
        },
        update: {},
        create: {
          passId: pass.id,
          deviceId: device.id,
          passTypeIdentifier,
        },
      });

      return reply.status(201).send({});
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({
        code: 'INTERNAL_ERROR',
        message: 'Internal server error',
      });
    }
  });

  // DELETE /v1/devices/:deviceLibraryIdentifier/registrations/:passTypeIdentifier/:serialNumber
  fastify.delete('/v1/devices/:deviceLibraryIdentifier/registrations/:passTypeIdentifier/:serialNumber', {
    preHandler: authenticatePass,
    schema: {
      params: deviceUnregistrationParamsSchema,
    },
  }, async (request, reply) => {
    try {
      const { deviceLibraryIdentifier, passTypeIdentifier, serialNumber } = request.params as any;
      const authToken = (request as any).authToken;

      // Find and verify pass
      const pass = await findPassBySerial(serialNumber, authToken);
      if (!pass) {
        return reply.status(404).send({
          code: 'PASS_NOT_FOUND',
          message: 'Pass not found or invalid authorization token',
        });
      }

      // Find device
      const device = await prisma.device.findUnique({
        where: { deviceLibraryIdentifier },
      });

      if (!device) {
        return reply.status(404).send({
          code: 'DEVICE_NOT_FOUND',
          message: 'Device not found',
        });
      }

      // Remove pass registration
      await prisma.passRegistration.deleteMany({
        where: {
          passId: pass.id,
          deviceId: device.id,
          passTypeIdentifier,
        },
      });

      return reply.status(200).send({});
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({
        code: 'INTERNAL_ERROR',
        message: 'Internal server error',
      });
    }
  });

  // GET /v1/devices/:deviceLibraryIdentifier/registrations/:passTypeIdentifier
  fastify.get('/v1/devices/:deviceLibraryIdentifier/registrations/:passTypeIdentifier', {
    schema: {
      params: z.object({
        deviceLibraryIdentifier: z.string().min(1),
        passTypeIdentifier: z.string().min(1),
      }),
      querystring: deviceRegistrationsQuerySchema,
    },
  }, async (request, reply) => {
    try {
      const { deviceLibraryIdentifier, passTypeIdentifier } = request.params as any;
      const { passesUpdatedSince } = request.query as any;

      // Find device
      const device = await prisma.device.findUnique({
        where: { deviceLibraryIdentifier },
        include: {
          registrations: {
            where: { passTypeIdentifier },
            include: {
              pass: true,
            },
          },
        },
      });

      if (!device) {
        return reply.status(404).send({
          code: 'DEVICE_NOT_FOUND',
          message: 'Device not found',
        });
      }

      let passes = device.registrations.map((reg: any) => reg.pass);

      // Filter by passesUpdatedSince if provided
      if (passesUpdatedSince) {
        passes = passes.filter((pass: any) => pass.lastUpdateTag > passesUpdatedSince);
      }

      // Calculate server tag (max lastUpdateTag)
      const serverTag = passes.length > 0 
        ? Math.max(...passes.map((p: any) => parseInt(p.lastUpdateTag) || 0)).toString()
        : '0';

      const serialNumbers = passes.map((pass: any) => pass.serialNumber);

      return reply.status(200).send({
        lastUpdated: serverTag,
        serialNumbers,
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({
        code: 'INTERNAL_ERROR',
        message: 'Internal server error',
      });
    }
  });

  // GET /v1/passes/:passTypeIdentifier/:serialNumber
  fastify.get('/v1/passes/:passTypeIdentifier/:serialNumber', {
    preHandler: authenticatePass,
    schema: {
      params: passDownloadParamsSchema,
    },
  }, async (request, reply) => {
    try {
      const { passTypeIdentifier, serialNumber } = request.params as any;
      const authToken = (request as any).authToken;

      // Find and verify pass
      const pass = await findPassBySerial(serialNumber, authToken);
      if (!pass) {
        return reply.status(404).send({
          code: 'PASS_NOT_FOUND',
          message: 'Pass not found or invalid authorization token',
        });
      }

      // Verify pass type identifier matches
      if ((pass.template.schemaJson as any)?.passTypeIdentifier !== passTypeIdentifier) {
        return reply.status(400).send({
          code: 'INVALID_PASS_TYPE',
          message: 'Pass type identifier does not match',
        });
      }

      // Rebuild .pkpass file to ensure it's up to date
      const rebuildResult = await passService.rebuildPass(pass.id);
      if (!rebuildResult.success) {
        return reply.status(500).send({
          code: 'REBUILD_FAILED',
          message: rebuildResult.error || 'Failed to rebuild pass',
        });
      }

      // Get the .pkpass file buffer
      const buffer = await passService.getPassBuffer(pass.id);
      if (!buffer) {
        return reply.status(500).send({
          code: 'FILE_NOT_FOUND',
          message: 'Pass file not found',
        });
      }

      // Set appropriate headers
      reply.header('Content-Type', 'application/vnd.apple.pkpass');
      reply.header('Content-Disposition', `attachment; filename="${serialNumber}.pkpass"`);
      reply.header('Content-Length', buffer.length.toString());

      return reply.send(buffer);
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({
        code: 'INTERNAL_ERROR',
        message: 'Internal server error',
      });
    }
  });

  // POST /v1/log
  fastify.post('/v1/log', {
    schema: {
      body: logSchema,
    },
  }, async (request, reply) => {
    try {
      const { logs } = request.body as any;

      // Log device logs
      fastify.log.info({
        type: 'device_logs',
        logs,
        timestamp: new Date().toISOString(),
      });

      return reply.status(200).send({});
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({
        code: 'INTERNAL_ERROR',
        message: 'Internal server error',
      });
    }
  });
}
