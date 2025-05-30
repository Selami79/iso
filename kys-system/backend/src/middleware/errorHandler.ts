import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';
import { logger, logError } from '@/shared/logger';
import { config } from '@/config/config';

export interface ApiError extends Error {
  statusCode?: number;
  code?: string;
  details?: any;
}

export class AppError extends Error implements ApiError {
  public statusCode: number;
  public code: string;
  public details?: any;
  public isOperational: boolean;

  constructor(
    message: string,
    statusCode: number = 500,
    code: string = 'INTERNAL_ERROR',
    details?: any
  ) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.isOperational = true;
    
    Error.captureStackTrace(this, this.constructor);
  }
}

// Predefined error classes
export class ValidationError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 400, 'VALIDATION_ERROR', details);
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string = 'Kaynak') {
    super(`${resource} bulunamadı`, 404, 'NOT_FOUND');
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Kimlik doğrulama gerekli') {
    super(message, 401, 'UNAUTHORIZED');
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = 'Bu işlem için yetkiniz yok') {
    super(message, 403, 'FORBIDDEN');
  }
}

export class ConflictError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 409, 'CONFLICT', details);
  }
}

export class RateLimitError extends AppError {
  constructor() {
    super('Çok fazla istek gönderildi. Lütfen daha sonra tekrar deneyin.', 429, 'RATE_LIMIT_EXCEEDED');
  }
}

// Error handler middleware
export const errorHandler = (
  error: Error | ApiError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  let statusCode = 500;
  let code = 'INTERNAL_ERROR';
  let message = 'Bir hata oluştu';
  let details: any = null;

  // Handle known error types
  if (error instanceof AppError) {
    statusCode = error.statusCode;
    code = error.code;
    message = error.message;
    details = error.details;
  } else if (error instanceof ZodError) {
    // Validation errors from Zod
    statusCode = 400;
    code = 'VALIDATION_ERROR';
    message = 'Giriş verilerinde hata';
    details = error.errors.map(err => ({
      field: err.path.join('.'),
      message: getZodErrorMessage(err),
      code: err.code,
    }));
  } else if (error instanceof Prisma.PrismaClientKnownRequestError) {
    // Prisma database errors
    const prismaError = handlePrismaError(error);
    statusCode = prismaError.statusCode;
    code = prismaError.code;
    message = prismaError.message;
    details = prismaError.details;
  } else if (error instanceof Prisma.PrismaClientValidationError) {
    statusCode = 400;
    code = 'DATABASE_VALIDATION_ERROR';
    message = 'Veritabanı doğrulama hatası';
  } else if (error instanceof Prisma.PrismaClientInitializationError) {
    statusCode = 500;
    code = 'DATABASE_CONNECTION_ERROR';
    message = 'Veritabanı bağlantı hatası';
  }

  // Log error
  logError(error, {
    userId: (req as any).user?.id,
    operation: `${req.method} ${req.originalUrl}`,
    data: {
      body: req.body,
      params: req.params,
      query: req.query,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
    },
  });

  // Send error response
  const errorResponse: any = {
    error: message,
    code,
    timestamp: new Date().toISOString(),
  };

  if (details) {
    errorResponse.details = details;
  }

  if (config.env === 'development') {
    errorResponse.stack = error.stack;
    errorResponse.originalError = error.message;
  }

  res.status(statusCode).json(errorResponse);
};

// Handle Prisma errors
function handlePrismaError(error: Prisma.PrismaClientKnownRequestError) {
  switch (error.code) {
    case 'P2000':
      return {
        statusCode: 400,
        code: 'INVALID_DATA',
        message: 'Girilen veri geçersiz',
        details: { field: error.meta?.target },
      };
    
    case 'P2001':
      return {
        statusCode: 404,
        code: 'RECORD_NOT_FOUND',
        message: 'Kayıt bulunamadı',
        details: { model: error.meta?.model_name },
      };
    
    case 'P2002':
      return {
        statusCode: 409,
        code: 'UNIQUE_CONSTRAINT_VIOLATION',
        message: 'Bu değer zaten kullanılıyor',
        details: { 
          fields: error.meta?.target,
          constraint: error.meta?.constraint 
        },
      };
    
    case 'P2003':
      return {
        statusCode: 400,
        code: 'FOREIGN_KEY_CONSTRAINT',
        message: 'İlişkili kayıt bulunamadı',
        details: { field: error.meta?.field_name },
      };
    
    case 'P2004':
      return {
        statusCode: 400,
        code: 'CONSTRAINT_VIOLATION',
        message: 'Veritabanı kısıtı ihlali',
        details: { constraint: error.meta?.constraint },
      };
    
    case 'P2014':
      return {
        statusCode: 400,
        code: 'INVALID_RELATION',
        message: 'Geçersiz ilişki',
        details: { relation: error.meta?.relation_name },
      };
    
    case 'P2025':
      return {
        statusCode: 404,
        code: 'RECORD_NOT_FOUND',
        message: 'Kayıt bulunamadı veya güncellenecek/silinecek kayıt yok',
        details: { operation: error.meta?.cause },
      };
    
    default:
      return {
        statusCode: 500,
        code: 'DATABASE_ERROR',
        message: 'Veritabanı hatası',
        details: config.env === 'development' ? { prismaCode: error.code } : null,
      };
  }
}

// Get user-friendly Zod error messages in Turkish
function getZodErrorMessage(error: any): string {
  switch (error.code) {
    case 'invalid_type':
      return `Beklenen tip: ${error.expected}, alınan: ${error.received}`;
    case 'invalid_string':
      if (error.validation === 'email') return 'Geçerli bir e-posta adresi giriniz';
      if (error.validation === 'url') return 'Geçerli bir URL giriniz';
      if (error.validation === 'uuid') return 'Geçerli bir UUID giriniz';
      return 'Geçersiz metin formatı';
    case 'too_small':
      if (error.type === 'string') return `En az ${error.minimum} karakter olmalı`;
      if (error.type === 'number') return `En az ${error.minimum} olmalı`;
      if (error.type === 'array') return `En az ${error.minimum} öğe olmalı`;
      return 'Çok küçük değer';
    case 'too_big':
      if (error.type === 'string') return `En fazla ${error.maximum} karakter olmalı`;
      if (error.type === 'number') return `En fazla ${error.maximum} olmalı`;
      if (error.type === 'array') return `En fazla ${error.maximum} öğe olmalı`;
      return 'Çok büyük değer';
    case 'invalid_enum_value':
      return `Geçerli değerler: ${error.options.join(', ')}`;
    case 'unrecognized_keys':
      return `Bilinmeyen alan(lar): ${error.keys.join(', ')}`;
    case 'invalid_date':
      return 'Geçerli bir tarih giriniz';
    case 'custom':
      return error.message || 'Özel doğrulama hatası';
    default:
      return error.message || 'Doğrulama hatası';
  }
}

// Async error wrapper
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// 404 handler
export const notFoundHandler = (req: Request, res: Response, next: NextFunction) => {
  const error = new NotFoundError(`Endpoint bulunamadı: ${req.originalUrl}`);
  next(error);
};