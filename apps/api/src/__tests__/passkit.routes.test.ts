import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import Fastify from 'fastify';

// Mock Prisma client
const mockPrisma = {
  pass: {
    findUnique: vi.fn(),
  },
  device: {
    upsert: vi.fn(),
    findUnique: vi.fn(),
  },
  passRegistration: {
    upsert: vi.fn(),
    deleteMany: vi.fn(),
    findMany: vi.fn(),
  },
} as any;

// Mock the Prisma client
vi.mock('@prisma/client', () => ({
  PrismaClient: vi.fn(() => mockPrisma),
}));

// Mock services
vi.mock('../services/pass.service', () => ({
  PassService: vi.fn().mockImplementation(() => ({
    rebuildPass: vi.fn().mockResolvedValue({ success: true, filePath: '/path/to/pass.pkpass' }),
    getPassBuffer: vi.fn().mockResolvedValue(Buffer.from('mock-pkpass-data')),
  })),
}));

vi.mock('../services/asset.service', () => ({
  AssetService: vi.fn(),
}));

// Import after mocking
import { passkitRoutes } from '../passkit/routes';

describe('PassKit Routes', () => {
  let app: any;

  beforeEach(async () => {
    app = Fastify();
    await app.register(passkitRoutes);
    await app.ready();
    vi.clearAllMocks();
  });

  afterEach(async () => {
    await app.close();
  });

  describe('POST /v1/devices/:deviceLibraryIdentifier/registrations/:passTypeIdentifier/:serialNumber', () => {
    it('should register device successfully', async () => {
      const mockPass = {
        id: 'pass123',
        authToken: 'test-token',
        template: {
          schemaJson: {
            passTypeIdentifier: 'pass.com.test.wallet',
          },
        },
      };

      mockPrisma.pass.findUnique.mockResolvedValue(mockPass);
      mockPrisma.device.upsert.mockResolvedValue({ id: 'device123' });
      mockPrisma.passRegistration.upsert.mockResolvedValue({});

      const response = await app.inject({
        method: 'POST',
        url: '/v1/devices/device123/registrations/pass.com.test.wallet/serial456',
        headers: {
          'Authorization': 'ApplePass test-token',
          'Content-Type': 'application/json',
        },
        payload: {
          pushToken: 'apns-device-token',
        },
      });

      expect(response.statusCode).toBe(201);
      expect(response.json()).toEqual({});
    });

    it('should return 401 for missing authorization header', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/v1/devices/device123/registrations/pass.com.test.wallet/serial456',
        headers: {
          'Content-Type': 'application/json',
        },
        payload: {
          pushToken: 'apns-device-token',
        },
      });

      expect(response.statusCode).toBe(401);
      expect(response.json()).toEqual({
        code: 'UNAUTHORIZED',
        message: 'Authorization header required',
      });
    });

    it('should return 401 for invalid authorization scheme', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/v1/devices/device123/registrations/pass.com.test.wallet/serial456',
        headers: {
          'Authorization': 'Bearer invalid-token',
          'Content-Type': 'application/json',
        },
        payload: {
          pushToken: 'apns-device-token',
        },
      });

      expect(response.statusCode).toBe(401);
      expect(response.json()).toEqual({
        code: 'UNAUTHORIZED',
        message: 'Invalid authorization scheme. Expected: ApplePass',
      });
    });

    it('should return 404 for pass not found', async () => {
      mockPrisma.pass.findUnique.mockResolvedValue(null);

      const response = await app.inject({
        method: 'POST',
        url: '/v1/devices/device123/registrations/pass.com.test.wallet/serial456',
        headers: {
          'Authorization': 'ApplePass test-token',
          'Content-Type': 'application/json',
        },
        payload: {
          pushToken: 'apns-device-token',
        },
      });

      expect(response.statusCode).toBe(404);
      expect(response.json()).toEqual({
        code: 'PASS_NOT_FOUND',
        message: 'Pass not found or invalid authorization token',
      });
    });

    it('should return 400 for invalid pass type identifier', async () => {
      const mockPass = {
        id: 'pass123',
        authToken: 'test-token',
        template: {
          schemaJson: {
            passTypeIdentifier: 'pass.com.other.wallet',
          },
        },
      };

      mockPrisma.pass.findUnique.mockResolvedValue(mockPass);

      const response = await app.inject({
        method: 'POST',
        url: '/v1/devices/device123/registrations/pass.com.test.wallet/serial456',
        headers: {
          'Authorization': 'ApplePass test-token',
          'Content-Type': 'application/json',
        },
        payload: {
          pushToken: 'apns-device-token',
        },
      });

      expect(response.statusCode).toBe(400);
      expect(response.json()).toEqual({
        code: 'INVALID_PASS_TYPE',
        message: 'Pass type identifier does not match',
      });
    });
  });

  describe('DELETE /v1/devices/:deviceLibraryIdentifier/registrations/:passTypeIdentifier/:serialNumber', () => {
    it('should unregister device successfully', async () => {
      const mockPass = {
        id: 'pass123',
        authToken: 'test-token',
        template: {
          schemaJson: {
            passTypeIdentifier: 'pass.com.test.wallet',
          },
        },
      };

      mockPrisma.pass.findUnique.mockResolvedValue(mockPass);
      mockPrisma.device.findUnique.mockResolvedValue({ id: 'device123' });
      mockPrisma.passRegistration.deleteMany.mockResolvedValue({});

      const response = await app.inject({
        method: 'DELETE',
        url: '/v1/devices/device123/registrations/pass.com.test.wallet/serial456',
        headers: {
          'Authorization': 'ApplePass test-token',
        },
      });

      expect(response.statusCode).toBe(200);
      expect(response.json()).toEqual({});
    });

    it('should return 404 for device not found', async () => {
      const mockPass = {
        id: 'pass123',
        authToken: 'test-token',
        template: {
          schemaJson: {
            passTypeIdentifier: 'pass.com.test.wallet',
          },
        },
      };

      mockPrisma.pass.findUnique.mockResolvedValue(mockPass);
      mockPrisma.device.findUnique.mockResolvedValue(null);

      const response = await app.inject({
        method: 'DELETE',
        url: '/v1/devices/device123/registrations/pass.com.test.wallet/serial456',
        headers: {
          'Authorization': 'ApplePass test-token',
        },
      });

      expect(response.statusCode).toBe(404);
      expect(response.json()).toEqual({
        code: 'DEVICE_NOT_FOUND',
        message: 'Device not found',
      });
    });
  });

  describe('GET /v1/devices/:deviceLibraryIdentifier/registrations/:passTypeIdentifier', () => {
    it('should return device registrations', async () => {
      const mockDevice = {
        id: 'device123',
        registrations: [
          {
            pass: { serialNumber: 'serial1', lastUpdateTag: '100' },
          },
          {
            pass: { serialNumber: 'serial2', lastUpdateTag: '200' },
          },
        ],
      };

      mockPrisma.device.findUnique.mockResolvedValue(mockDevice);

      const response = await app.inject({
        method: 'GET',
        url: '/v1/devices/device123/registrations/pass.com.test.wallet',
      });

      expect(response.statusCode).toBe(200);
      const data = response.json();
      expect(data.lastUpdated).toBe('200');
      expect(data.serialNumbers).toEqual(['serial1', 'serial2']);
    });

    it('should filter by passesUpdatedSince', async () => {
      const mockDevice = {
        id: 'device123',
        registrations: [
          {
            pass: { serialNumber: 'serial1', lastUpdateTag: '100' },
          },
          {
            pass: { serialNumber: 'serial2', lastUpdateTag: '200' },
          },
        ],
      };

      mockPrisma.device.findUnique.mockResolvedValue(mockDevice);

      const response = await app.inject({
        method: 'GET',
        url: '/v1/devices/device123/registrations/pass.com.test.wallet?passesUpdatedSince=150',
      });

      expect(response.statusCode).toBe(200);
      const data = response.json();
      expect(data.lastUpdated).toBe('200');
      expect(data.serialNumbers).toEqual(['serial2']);
    });

    it('should return 404 for device not found', async () => {
      mockPrisma.device.findUnique.mockResolvedValue(null);

      const response = await app.inject({
        method: 'GET',
        url: '/v1/devices/device123/registrations/pass.com.test.wallet',
      });

      expect(response.statusCode).toBe(404);
      expect(response.json()).toEqual({
        code: 'DEVICE_NOT_FOUND',
        message: 'Device not found',
      });
    });
  });

  describe('GET /v1/passes/:passTypeIdentifier/:serialNumber', () => {
    it('should download pass successfully', async () => {
      const mockPass = {
        id: 'pass123',
        authToken: 'test-token',
        template: {
          schemaJson: {
            passTypeIdentifier: 'pass.com.test.wallet',
          },
        },
      };

      mockPrisma.pass.findUnique.mockResolvedValue(mockPass);

      const response = await app.inject({
        method: 'GET',
        url: '/v1/passes/pass.com.test.wallet/serial456',
        headers: {
          'Authorization': 'ApplePass test-token',
        },
      });

      expect(response.statusCode).toBe(200);
      expect(response.headers['content-type']).toBe('application/vnd.apple.pkpass');
      expect(response.headers['content-disposition']).toBe('attachment; filename="serial456.pkpass"');
      expect(response.payload).toBe('mock-pkpass-data');
    });

    it('should return 401 for invalid authorization', async () => {
      mockPrisma.pass.findUnique.mockResolvedValue(null);

      const response = await app.inject({
        method: 'GET',
        url: '/v1/passes/pass.com.test.wallet/serial456',
        headers: {
          'Authorization': 'ApplePass invalid-token',
        },
      });

      expect(response.statusCode).toBe(404);
      expect(response.json()).toEqual({
        code: 'PASS_NOT_FOUND',
        message: 'Pass not found or invalid authorization token',
      });
    });
  });

  describe('POST /v1/log', () => {
    it('should accept device logs', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/v1/log',
        headers: {
          'Content-Type': 'application/json',
        },
        payload: {
          logs: ['Device error: pass validation failed'],
        },
      });

      expect(response.statusCode).toBe(200);
      expect(response.json()).toEqual({});
    });
  });
});
