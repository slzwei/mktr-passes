import { describe, it, expect, beforeEach, vi } from 'vitest';
import { APNsService, APNsPayload } from '../services/apns';
import { config } from '../config';

// Mock the config
vi.mock('../config', () => ({
  config: {
    apnsMode: 'mock',
    apnsTeamId: 'TEST_TEAM_ID',
    apnsKeyId: 'TEST_KEY_ID',
    apnsAuthKeyP8: './test/AuthKey.p8',
    apnsTopic: 'pass.com.test.wallet',
    apnsEnv: 'sandbox',
  },
}));

// Mock fetch
global.fetch = vi.fn();

// Mock fs
vi.mock('fs', () => ({
  readFileSync: vi.fn(() => 'mock-private-key'),
}));

// Mock jose
vi.mock('jose', () => ({
  SignJWT: vi.fn(() => ({
    setProtectedHeader: vi.fn().mockReturnThis(),
    setIssuedAt: vi.fn().mockReturnThis(),
    setExpirationTime: vi.fn().mockReturnThis(),
    sign: vi.fn().mockResolvedValue('mock-jwt-token'),
  })),
  importPKCS8: vi.fn().mockResolvedValue('mock-key'),
}));

describe('APNsService', () => {
  const mockPayload: APNsPayload = {
    type: 'apns',
    deviceToken: 'test-device-token',
    topic: 'pass.com.test.wallet',
    env: 'sandbox',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('isConfigured', () => {
    it('should return true for mock mode', () => {
      expect(APNsService.isConfigured()).toBe(true);
    });

    it('should return false for invalid mode', () => {
      vi.mocked(config).apnsMode = 'invalid';
      expect(APNsService.isConfigured()).toBe(false);
    });
  });

  describe('sendPush', () => {
    it('should send push in mock mode', async () => {
      vi.mocked(config).apnsMode = 'mock';

      const result = await APNsService.sendPush(mockPayload);

      expect(result.success).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should send push in token mode', async () => {
      vi.mocked(config).apnsMode = 'token';
      vi.mocked(global.fetch).mockResolvedValue({
        status: 200,
        text: () => Promise.resolve(''),
      } as Response);

      const result = await APNsService.sendPush(mockPayload);

      expect(result.success).toBe(true);
      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.sandbox.push.apple.com:443/3/device/test-device-token',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Authorization': 'Bearer mock-jwt-token',
            'apns-topic': 'pass.com.test.wallet',
            'apns-push-type': 'background',
            'apns-priority': '5',
            'apns-expiration': '0',
          }),
          body: '{}',
        })
      );
    });

    it('should handle APNs errors in token mode', async () => {
      vi.mocked(config).apnsMode = 'token';
      vi.mocked(global.fetch).mockResolvedValue({
        status: 400,
        text: () => Promise.resolve('BadDeviceToken'),
      } as Response);

      const result = await APNsService.sendPush(mockPayload);

      expect(result.success).toBe(false);
      expect(result.error).toContain('APNs error 400: BadDeviceToken');
    });

    it('should handle network errors in token mode', async () => {
      vi.mocked(config).apnsMode = 'token';
      vi.mocked(global.fetch).mockRejectedValue(new Error('Network error'));

      const result = await APNsService.sendPush(mockPayload);

      expect(result.success).toBe(false);
      expect(result.error).toContain('APNs request failed: Network error');
    });

    it('should return error for cert mode (not implemented)', async () => {
      vi.mocked(config).apnsMode = 'cert';

      const result = await APNsService.sendPush(mockPayload);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Certificate-based APNs not yet implemented');
    });

    it('should return error for unknown mode', async () => {
      vi.mocked(config).apnsMode = 'unknown';

      const result = await APNsService.sendPush(mockPayload);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Unknown APNs mode: unknown');
    });
  });

  describe('JWT token generation', () => {
    it('should generate JWT with correct claims', async () => {
      vi.mocked(config).apnsMode = 'token';
      vi.mocked(global.fetch).mockResolvedValue({
        status: 200,
        text: () => Promise.resolve(''),
      } as Response);

      await APNsService.sendPush(mockPayload);

      // Verify JWT was generated with correct parameters
      const { SignJWT } = await import('jose');
      expect(SignJWT).toHaveBeenCalledWith({
        iss: 'TEST_TEAM_ID',
        iat: expect.any(Number),
      });
    });
  });

  describe('URL generation', () => {
    it('should use sandbox URL for sandbox environment', async () => {
      vi.mocked(config).apnsMode = 'token';
      vi.mocked(config).apnsEnv = 'sandbox';
      vi.mocked(global.fetch).mockResolvedValue({
        status: 200,
        text: () => Promise.resolve(''),
      } as Response);

      await APNsService.sendPush(mockPayload);

      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.sandbox.push.apple.com:443/3/device/test-device-token',
        expect.any(Object)
      );
    });

    it('should use production URL for production environment', async () => {
      vi.mocked(config).apnsMode = 'token';
      vi.mocked(config).apnsEnv = 'production';
      vi.mocked(global.fetch).mockResolvedValue({
        status: 200,
        text: () => Promise.resolve(''),
      } as Response);

      await APNsService.sendPush({
        ...mockPayload,
        env: 'production',
      });

      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.push.apple.com:443/3/device/test-device-token',
        expect.any(Object)
      );
    });
  });
});