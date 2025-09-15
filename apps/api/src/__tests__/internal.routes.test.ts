import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import Fastify from 'fastify';

// Mock Prisma client
const mockPrisma = {
  pass: {
    findUnique: vi.fn(),
    update: vi.fn(),
  },
  updateOutbox: {
    count: vi.fn(),
  },
} as any;

// Mock the Prisma client
vi.mock('@prisma/client', () => ({
  PrismaClient: vi.fn(() => mockPrisma),
}));

// Mock UpdateService
vi.mock('../services/update.service', () => ({
  UpdateService: {
    bumpPassUpdateTag: vi.fn(),
    enqueuePassPushes: vi.fn(),
  },
}));

// Mock outbox worker
vi.mock('../workers/outbox', () => ({
  outboxWorker: {
    processOnce: vi.fn(),
  },
}));

// Import after mocking
import { internalRoutes } from '../routes/internal';

describe('Internal Routes', () => {
  let app: any;

  beforeEach(async () => {
    app = Fastify();
    await app.register(internalRoutes);
    await app.ready();
    vi.clearAllMocks();
  });

  afterEach(async () => {
    await app.close();
  });

  describe('POST /internal/passes/:serialNumber/increment', () => {
    it('should increment stamp count successfully', async () => {
      const mockPass = {
        id: 'pass123',
        serialNumber: 'serial456',
        variablesJson: { stampCount: 4 },
        template: { id: 'template123' },
      };

      mockPrisma.pass.findUnique.mockResolvedValue(mockPass);
      mockPrisma.pass.update.mockResolvedValue({});

      const { UpdateService } = await import('../services/update.service');
      vi.mocked(UpdateService.bumpPassUpdateTag).mockResolvedValue('123');
      vi.mocked(UpdateService.enqueuePassPushes).mockResolvedValue();

      const response = await app.inject({
        method: 'POST',
        url: '/internal/passes/serial456/increment',
      });

      expect(response.statusCode).toBe(200);
      const data = response.json();
      expect(data.success).toBe(true);
      expect(data.serialNumber).toBe('serial456');
      expect(data.newUpdateTag).toBe('123');
      expect(data.stampCount).toBe(5);

      expect(UpdateService.bumpPassUpdateTag).toHaveBeenCalledWith('pass123');
      expect(UpdateService.enqueuePassPushes).toHaveBeenCalledWith('pass123');
    });

    it('should handle pass with no existing stamp count', async () => {
      const mockPass = {
        id: 'pass123',
        serialNumber: 'serial456',
        variablesJson: {},
        template: { id: 'template123' },
      };

      mockPrisma.pass.findUnique.mockResolvedValue(mockPass);
      mockPrisma.pass.update.mockResolvedValue({});

      const { UpdateService } = await import('../services/update.service');
      vi.mocked(UpdateService.bumpPassUpdateTag).mockResolvedValue('123');
      vi.mocked(UpdateService.enqueuePassPushes).mockResolvedValue();

      const response = await app.inject({
        method: 'POST',
        url: '/internal/passes/serial456/increment',
      });

      expect(response.statusCode).toBe(200);
      const data = response.json();
      expect(data.stampCount).toBe(1);
    });

    it('should return 404 for pass not found', async () => {
      mockPrisma.pass.findUnique.mockResolvedValue(null);

      const response = await app.inject({
        method: 'POST',
        url: '/internal/passes/nonexistent/increment',
      });

      expect(response.statusCode).toBe(404);
      expect(response.json()).toEqual({
        code: 'PASS_NOT_FOUND',
        message: 'Pass not found',
      });
    });

    it('should return 400 for invalid variables format', async () => {
      const mockPass = {
        id: 'pass123',
        serialNumber: 'serial456',
        variablesJson: 'invalid-json',
        template: { id: 'template123' },
      };

      mockPrisma.pass.findUnique.mockResolvedValue(mockPass);

      const response = await app.inject({
        method: 'POST',
        url: '/internal/passes/serial456/increment',
      });

      expect(response.statusCode).toBe(400);
      expect(response.json()).toEqual({
        code: 'INVALID_VARIABLES',
        message: 'Pass variables are not in expected format',
      });
    });
  });

  describe('GET /internal/outbox/status', () => {
    it('should return outbox status', async () => {
      mockPrisma.updateOutbox.count
        .mockResolvedValueOnce(5)  // pending
        .mockResolvedValueOnce(100) // sent
        .mockResolvedValueOnce(2);  // failed

      const response = await app.inject({
        method: 'GET',
        url: '/internal/outbox/status',
      });

      expect(response.statusCode).toBe(200);
      expect(response.json()).toEqual({
        pending: 5,
        sent: 100,
        failed: 2,
        total: 107,
      });

      expect(mockPrisma.updateOutbox.count).toHaveBeenCalledWith({
        where: { status: 'pending' },
      });
      expect(mockPrisma.updateOutbox.count).toHaveBeenCalledWith({
        where: { status: 'sent' },
      });
      expect(mockPrisma.updateOutbox.count).toHaveBeenCalledWith({
        where: { status: 'failed' },
      });
    });
  });

  describe('POST /internal/outbox/process', () => {
    it('should process outbox once', async () => {
      const { outboxWorker } = await import('../workers/outbox');
      vi.mocked(outboxWorker.processOnce).mockResolvedValue();

      const response = await app.inject({
        method: 'POST',
        url: '/internal/outbox/process',
      });

      expect(response.statusCode).toBe(200);
      expect(response.json()).toEqual({
        success: true,
        message: 'Outbox processed once',
      });

      expect(outboxWorker.processOnce).toHaveBeenCalled();
    });
  });
});
