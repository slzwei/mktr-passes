import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock Prisma client
const mockPrisma = {
  pass: {
    findUnique: vi.fn(),
    update: vi.fn(),
  },
  updateOutbox: {
    createMany: vi.fn(),
    findMany: vi.fn(),
    update: vi.fn(),
    updateMany: vi.fn(),
  },
} as any;

// Mock the Prisma client
vi.mock('@prisma/client', () => ({
  PrismaClient: vi.fn(() => mockPrisma),
}));

// Import after mocking
import { UpdateService } from '../services/update.service';

describe('UpdateService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('bumpPassUpdateTag', () => {
    it('should increment update tag from 0 to 1', async () => {
      mockPrisma.pass.findUnique.mockResolvedValue({
        lastUpdateTag: '0',
      });
      mockPrisma.pass.update.mockResolvedValue({});

      const result = await UpdateService.bumpPassUpdateTag('pass123');

      expect(result).toBe('1');
      expect(mockPrisma.pass.findUnique).toHaveBeenCalledWith({
        where: { id: 'pass123' },
        select: { lastUpdateTag: true },
      });
      expect(mockPrisma.pass.update).toHaveBeenCalledWith({
        where: { id: 'pass123' },
        data: {
          lastUpdateTag: '1',
          lastUpdatedAt: expect.any(Date),
        },
      });
    });

    it('should increment update tag from 123 to 124', async () => {
      mockPrisma.pass.findUnique.mockResolvedValue({
        lastUpdateTag: '123',
      });
      mockPrisma.pass.update.mockResolvedValue({});

      const result = await UpdateService.bumpPassUpdateTag('pass123');

      expect(result).toBe('124');
      expect(mockPrisma.pass.update).toHaveBeenCalledWith({
        where: { id: 'pass123' },
        data: {
          lastUpdateTag: '124',
          lastUpdatedAt: expect.any(Date),
        },
      });
    });

    it('should handle non-numeric tags by defaulting to 0', async () => {
      mockPrisma.pass.findUnique.mockResolvedValue({
        lastUpdateTag: 'invalid',
      });
      mockPrisma.pass.update.mockResolvedValue({});

      const result = await UpdateService.bumpPassUpdateTag('pass123');

      expect(result).toBe('1');
      expect(mockPrisma.pass.update).toHaveBeenCalledWith({
        where: { id: 'pass123' },
        data: {
          lastUpdateTag: '1',
          lastUpdatedAt: expect.any(Date),
        },
      });
    });

    it('should throw error if pass not found', async () => {
      mockPrisma.pass.findUnique.mockResolvedValue(null);

      await expect(UpdateService.bumpPassUpdateTag('nonexistent')).rejects.toThrow(
        'Pass with id nonexistent not found'
      );
    });
  });

  describe('enqueuePassPushes', () => {
    it('should create outbox entries for all registered devices', async () => {
      const mockPass = {
        id: 'pass123',
        registrations: [
          {
            device: { pushToken: 'token1' },
          },
          {
            device: { pushToken: 'token2' },
          },
        ],
      };

      mockPrisma.pass.findUnique.mockResolvedValue(mockPass);
      mockPrisma.updateOutbox.createMany.mockResolvedValue({});

      await UpdateService.enqueuePassPushes('pass123');

      expect(mockPrisma.pass.findUnique).toHaveBeenCalledWith({
        where: { id: 'pass123' },
        include: {
          registrations: {
            include: {
              device: true,
            },
          },
        },
      });

      expect(mockPrisma.updateOutbox.createMany).toHaveBeenCalledWith({
        data: [
          {
            passId: 'pass123',
            payload: {
              type: 'apns',
              deviceToken: 'token1',
              topic: process.env.APNS_TOPIC || 'pass.your.bundle.id',
              env: process.env.APNS_ENV || 'sandbox',
            },
            status: 'pending',
            attempts: 0,
          },
          {
            passId: 'pass123',
            payload: {
              type: 'apns',
              deviceToken: 'token2',
              topic: process.env.APNS_TOPIC || 'pass.your.bundle.id',
              env: process.env.APNS_ENV || 'sandbox',
            },
            status: 'pending',
            attempts: 0,
          },
        ],
      });
    });

    it('should handle pass with no registrations', async () => {
      const mockPass = {
        id: 'pass123',
        registrations: [],
      };

      mockPrisma.pass.findUnique.mockResolvedValue(mockPass);

      await UpdateService.enqueuePassPushes('pass123');

      expect(mockPrisma.updateOutbox.createMany).not.toHaveBeenCalled();
    });

    it('should throw error if pass not found', async () => {
      mockPrisma.pass.findUnique.mockResolvedValue(null);

      await expect(UpdateService.enqueuePassPushes('nonexistent')).rejects.toThrow(
        'Pass with id nonexistent not found'
      );
    });
  });

  describe('getPendingOutboxEntries', () => {
    it('should return pending entries ordered by creation time', async () => {
      const mockEntries = [
        { id: 'entry1', status: 'pending' },
        { id: 'entry2', status: 'pending' },
      ];

      mockPrisma.updateOutbox.findMany.mockResolvedValue(mockEntries);

      const result = await UpdateService.getPendingOutboxEntries(5);

      expect(result).toEqual(mockEntries);
      expect(mockPrisma.updateOutbox.findMany).toHaveBeenCalledWith({
        where: { status: 'pending' },
        orderBy: { createdAt: 'asc' },
        take: 5,
      });
    });
  });

  describe('markOutboxSent', () => {
    it('should mark entry as sent', async () => {
      mockPrisma.updateOutbox.update.mockResolvedValue({});

      await UpdateService.markOutboxSent('entry123');

      expect(mockPrisma.updateOutbox.update).toHaveBeenCalledWith({
        where: { id: 'entry123' },
        data: {
          status: 'sent',
          updatedAt: expect.any(Date),
        },
      });
    });
  });

  describe('markOutboxFailed', () => {
    it('should mark entry as failed with error message', async () => {
      mockPrisma.updateOutbox.update.mockResolvedValue({});

      await UpdateService.markOutboxFailed('entry123', 'Network error');

      expect(mockPrisma.updateOutbox.update).toHaveBeenCalledWith({
        where: { id: 'entry123' },
        data: {
          status: 'failed',
          lastError: 'Network error',
          attempts: { increment: 1 },
          updatedAt: expect.any(Date),
        },
      });
    });
  });

  describe('resetFailedEntriesForRetry', () => {
    it('should reset failed entries for retry', async () => {
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      mockPrisma.updateOutbox.updateMany.mockResolvedValue({});

      await UpdateService.resetFailedEntriesForRetry();

      expect(mockPrisma.updateOutbox.updateMany).toHaveBeenCalledWith({
        where: {
          status: 'failed',
          attempts: { lt: 3 },
          updatedAt: { lt: oneHourAgo },
        },
        data: {
          status: 'pending',
          lastError: null,
        },
      });
    });
  });
});