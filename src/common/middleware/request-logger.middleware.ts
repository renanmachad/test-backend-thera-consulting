import { Injectable, Logger, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

/**
 * Campos sensíveis que devem ser mascarados nos logs
 */
const SENSITIVE_FIELDS = [
  'password',
  'senha',
  'token',
  'authorization',
  'api_key',
  'apikey',
  'secret',
  'credit_card',
  'cvv',
  'cpf',
  'cnpj',
];

/**
 * Headers que não devem ser logados
 */
const EXCLUDED_HEADERS = ['authorization', 'cookie', 'x-api-key'];

@Injectable()
export class RequestLoggerMiddleware implements NestMiddleware {
  private readonly logger = new Logger('HTTP');

  use(req: Request, res: Response, next: NextFunction): void {
    const startTime = Date.now();
    const { method, originalUrl } = req;
    const clientIp = this.getClientIp(req);
    const userAgent = req.get('user-agent') || 'unknown';
    const requestId = this.generateRequestId();

    // Adiciona request ID ao header para rastreamento
    res.setHeader('X-Request-Id', requestId);

    // Log da requisição de entrada
    this.logRequest(requestId, method, originalUrl, req, userAgent, clientIp);

    // Captura a resposta
    res.on('finish', () => {
      const duration = Date.now() - startTime;
      const { statusCode } = res;

      this.logResponse(
        requestId,
        method,
        originalUrl,
        statusCode,
        duration,
        userAgent,
        clientIp,
      );
    });

    next();
  }

  /**
   * Gera um ID único para a requisição
   */
  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  /**
   * Loga os detalhes da requisição de entrada
   */
  private logRequest(
    requestId: string,
    method: string,
    url: string,
    req: Request,
    userAgent: string,
    ip: string,
  ): void {
    const sanitizedHeaders = this.sanitizeHeaders(req.headers);
    const sanitizedBody = this.sanitizeBody(req.body);
    const sanitizedQuery = this.sanitizeBody(req.query);

    const logData = {
      requestId,
      type: 'REQUEST',
      method,
      url,
      ip,
      userAgent,
      headers: sanitizedHeaders,
      query: Object.keys(sanitizedQuery).length > 0 ? sanitizedQuery : undefined,
      body: Object.keys(sanitizedBody).length > 0 ? sanitizedBody : undefined,
    };

    this.logger.log(`→ ${method} ${url} [${requestId}]`);
    this.logger.debug(JSON.stringify(logData, null, 2));
  }

  /**
   * Loga os detalhes da resposta
   */
  private logResponse(
    requestId: string,
    method: string,
    url: string,
    statusCode: number,
    duration: number,
    userAgent: string,
    ip: string,
  ): void {
    const logLevel = this.getLogLevelByStatus(statusCode);
    const logData = {
      requestId,
      type: 'RESPONSE',
      method,
      url,
      statusCode,
      duration: `${duration}ms`,
      ip,
      userAgent,
    };

    const message = `← ${method} ${url} ${statusCode} - ${duration}ms [${requestId}]`;

    switch (logLevel) {
      case 'error':
        this.logger.error(message);
        this.logger.error(JSON.stringify(logData, null, 2));
        break;
      case 'warn':
        this.logger.warn(message);
        break;
      default:
        this.logger.log(message);
    }
  }

  /**
   * Determina o nível de log baseado no status code
   */
  private getLogLevelByStatus(statusCode: number): 'log' | 'warn' | 'error' {
    if (statusCode >= 500) return 'error';
    if (statusCode >= 400) return 'warn';
    return 'log';
  }

  /**
   * Sanitiza os headers removendo informações sensíveis
   */
  private sanitizeHeaders(
    headers: Record<string, unknown>,
  ): Record<string, unknown> {
    const sanitized: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(headers)) {
      const lowerKey = key.toLowerCase();
      if (EXCLUDED_HEADERS.includes(lowerKey)) {
        sanitized[key] = '[REDACTED]';
      } else {
        sanitized[key] = value;
      }
    }

    return sanitized;
  }

  /**
   * Sanitiza o body/query mascarando campos sensíveis
   */
  private sanitizeBody(body: unknown): Record<string, unknown> {
    if (!body || typeof body !== 'object') {
      return {};
    }

    return this.deepSanitize(body as Record<string, unknown>);
  }

  /**
   * Sanitiza recursivamente objetos aninhados
   */
  private deepSanitize(obj: Record<string, unknown>): Record<string, unknown> {
    const sanitized: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(obj)) {
      const lowerKey = key.toLowerCase();

      if (SENSITIVE_FIELDS.some((field) => lowerKey.includes(field))) {
        sanitized[key] = '[REDACTED]';
      } else if (Array.isArray(value)) {
        sanitized[key] = value.map((item) =>
          typeof item === 'object' && item !== null
            ? this.deepSanitize(item as Record<string, unknown>)
            : item,
        );
      } else if (typeof value === 'object' && value !== null) {
        sanitized[key] = this.deepSanitize(value as Record<string, unknown>);
      } else {
        sanitized[key] = value;
      }
    }

    return sanitized;
  }

  /**
   * Obtém o IP real do cliente (considerando proxies)
   */
  private getClientIp(req: Request): string {
    const forwardedFor = req.get('x-forwarded-for');
    if (forwardedFor) {
      return forwardedFor.split(',')[0].trim();
    }
    const realIp = req.get('x-real-ip');
    if (realIp) {
      return realIp;
    }
    return req.ip || req.socket?.remoteAddress || 'unknown';
  }
}
