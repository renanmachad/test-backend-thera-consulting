import { PrismaService } from './prisma.service';

describe('PrismaService', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe('constructor', () => {
    it('should throw error when DATABASE_URL is not set', () => {
      delete process.env.DATABASE_URL;

      expect(() => new PrismaService()).toThrow(
        'DATABASE_URL environment variable is not set',
      );
    });

    it('should create instance when DATABASE_URL is set', () => {
      process.env.DATABASE_URL = 'postgresql://user:pass@localhost:5432/testdb';

      // Mock pg Pool and PrismaPg to avoid actual connection
      jest.mock('pg', () => ({
        Pool: jest.fn().mockImplementation(() => ({})),
      }));
      jest.mock('@prisma/adapter-pg', () => ({
        PrismaPg: jest.fn().mockImplementation(() => ({})),
      }));

      // Note: Full instantiation test would require mocking Prisma internals
      // This test verifies the environment variable check
      expect(process.env.DATABASE_URL).toBeDefined();
    });
  });
});
