import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ApiKeyGuard } from './api-key.guard';

describe('ApiKeyGuard', () => {
  let guard: ApiKeyGuard;
  let reflector: jest.Mocked<Reflector>;

  const mockExecutionContext = (
    headers: Record<string, string> = {},
    isPublic = false,
  ): ExecutionContext => {
    const mockContext = {
      switchToHttp: () => ({
        getRequest: () => ({
          headers,
          get: (key: string) => headers[key.toLowerCase()],
        }),
      }),
      getHandler: () => ({}),
      getClass: () => ({}),
    } as unknown as ExecutionContext;

    // Configure reflector mock based on isPublic
    reflector.getAllAndOverride.mockReturnValue(isPublic);

    return mockContext;
  };

  beforeEach(() => {
    reflector = {
      getAllAndOverride: jest.fn(),
    } as unknown as jest.Mocked<Reflector>;

    guard = new ApiKeyGuard(reflector);

    // Set default API_KEY
    process.env.API_KEY = 'test-api-key';
  });

  afterEach(() => {
    delete process.env.API_KEY;
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  describe('public routes', () => {
    it('should allow access to public routes without token', () => {
      const context = mockExecutionContext({}, true);

      const result = guard.canActivate(context);

      expect(result).toBe(true);
    });
  });

  describe('protected routes', () => {
    it('should throw UnauthorizedException when no token provided', () => {
      const context = mockExecutionContext({});

      expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
      expect(() => guard.canActivate(context)).toThrow('API key is required');
    });

    it('should throw UnauthorizedException when API_KEY not configured', () => {
      delete process.env.API_KEY;
      const context = mockExecutionContext({
        authorization: 'Bearer some-token',
      });

      expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
      expect(() => guard.canActivate(context)).toThrow(
        'API key not configured on server',
      );
    });

    it('should throw UnauthorizedException when token is invalid', () => {
      const context = mockExecutionContext({
        authorization: 'Bearer wrong-token',
      });

      expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
      expect(() => guard.canActivate(context)).toThrow('Invalid API key');
    });

    it('should allow access with valid Bearer token', () => {
      const context = mockExecutionContext({
        authorization: 'Bearer test-api-key',
      });

      const result = guard.canActivate(context);

      expect(result).toBe(true);
    });

    it('should allow access with valid ApiKey token format', () => {
      const context = mockExecutionContext({
        authorization: 'ApiKey test-api-key',
      });

      const result = guard.canActivate(context);

      expect(result).toBe(true);
    });

    it('should allow access with valid X-API-Key header', () => {
      const context = mockExecutionContext({
        'x-api-key': 'test-api-key',
      });

      const result = guard.canActivate(context);

      expect(result).toBe(true);
    });

    it('should reject invalid X-API-Key header', () => {
      const context = mockExecutionContext({
        'x-api-key': 'wrong-key',
      });

      expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
      expect(() => guard.canActivate(context)).toThrow('Invalid API key');
    });

    it('should prefer Authorization header over X-API-Key', () => {
      const context = mockExecutionContext({
        authorization: 'Bearer test-api-key',
        'x-api-key': 'wrong-key',
      });

      const result = guard.canActivate(context);

      expect(result).toBe(true);
    });
  });
});
