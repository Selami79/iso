import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { logApiRequest, logger } from '@/shared/logger';

// Extend Request to include request ID
declare global {
  namespace Express {
    interface Request {
      requestId?: string;
      startTime?: number;
    }
  }
}

export const requestLogger = (req: Request, res: Response, next: NextFunction): void => {
  // Generate unique request ID
  req.requestId = uuidv4();
  req.startTime = Date.now();

  // Add request ID to response headers
  res.setHeader('X-Request-ID', req.requestId);

  // Log request start
  logger.info('Request started', {
    requestId: req.requestId,
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    contentType: req.get('Content-Type'),
    contentLength: req.get('Content-Length'),
  });

  // Capture original res.end to log when request completes
  const originalEnd = res.end;
  res.end = function(chunk?: any, encoding?: BufferEncoding): any {
    const duration = Date.now() - (req.startTime || 0);
    
    // Log API request completion
    logApiRequest(
      req.method,
      req.originalUrl,
      res.statusCode,
      duration,
      (req as any).user?.id
    );

    // Log additional details for errors or slow requests
    if (res.statusCode >= 400 || duration > 5000) {
      logger.warn('Request completed with issues', {
        requestId: req.requestId,
        method: req.method,
        url: req.originalUrl,
        statusCode: res.statusCode,
        duration,
        userId: (req as any).user?.id,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        slow: duration > 5000,
        error: res.statusCode >= 400,
      });
    }

    return originalEnd.call(this, chunk, encoding);
  };

  next();
};