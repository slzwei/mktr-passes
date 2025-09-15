import { vi } from 'vitest';

// Mock environment variables
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
process.env.APNS_MODE = 'mock';
process.env.APNS_TEAM_ID = 'TEST_TEAM_ID';
process.env.APNS_KEY_ID = 'TEST_KEY_ID';
process.env.APNS_TOPIC = 'pass.com.test.wallet';
process.env.APNS_ENV = 'sandbox';

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  log: vi.fn(),
  debug: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
};
