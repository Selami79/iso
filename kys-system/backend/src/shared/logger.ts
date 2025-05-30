import winston from 'winston';
import { config } from '@/config/config';

// Custom format for Turkish locale
const turkishFormat = winston.format.combine(
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss',
  }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.prettyPrint()
);

// Console format for development
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({
    format: 'HH:mm:ss',
  }),
  winston.format.printf(({ level, message, timestamp, ...meta }) => {
    let metaStr = '';
    if (Object.keys(meta).length > 0) {
      metaStr = `\n${JSON.stringify(meta, null, 2)}`;
    }
    return `${timestamp} [${level}]: ${message}${metaStr}`;
  })
);

// Create logger instance
export const logger = winston.createLogger({
  level: config.logging.level,
  format: turkishFormat,
  defaultMeta: {
    service: 'kys-api',
    environment: config.env,
  },
  transports: [
    // File transport for all logs
    new winston.transports.File({
      filename: config.logging.file,
      maxsize: 20971520, // 20MB
      maxFiles: 5,
      tailable: true,
    }),
    
    // Separate file for errors
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      maxsize: 20971520, // 20MB
      maxFiles: 5,
      tailable: true,
    }),
  ],
  
  exceptionHandlers: [
    new winston.transports.File({
      filename: 'logs/exceptions.log',
      maxsize: 20971520, // 20MB
      maxFiles: 5,
    }),
  ],
  
  rejectionHandlers: [
    new winston.transports.File({
      filename: 'logs/rejections.log',
      maxsize: 20971520, // 20MB
      maxFiles: 5,
    }),
  ],
});

// Add console transport for non-production environments
if (config.env !== 'production') {
  logger.add(
    new winston.transports.Console({
      format: consoleFormat,
    })
  );
}

// Create child loggers for different modules
export const createModuleLogger = (moduleName: string) => {
  return logger.child({ module: moduleName });
};

// Specific loggers for different types of operations
export const auditLogger = createModuleLogger('audit');
export const securityLogger = createModuleLogger('security');
export const performanceLogger = createModuleLogger('performance');
export const integrationLogger = createModuleLogger('integration');

// Helper functions for structured logging
export const logUserAction = (
  userId: number,
  action: string,
  resource: string,
  details?: any
) => {
  auditLogger.info('User action performed', {
    userId,
    action,
    resource,
    details,
    timestamp: new Date().toISOString(),
  });
};

export const logSecurityEvent = (
  event: string,
  severity: 'low' | 'medium' | 'high' | 'critical',
  details: any
) => {
  securityLogger.warn('Security event detected', {
    event,
    severity,
    details,
    timestamp: new Date().toISOString(),
  });
};

export const logPerformanceMetric = (
  operation: string,
  duration: number,
  details?: any
) => {
  performanceLogger.info('Performance metric recorded', {
    operation,
    duration,
    details,
    timestamp: new Date().toISOString(),
  });
};

export const logIntegrationEvent = (
  service: string,
  operation: string,
  success: boolean,
  details?: any
) => {
  integrationLogger.info('Integration event', {
    service,
    operation,
    success,
    details,
    timestamp: new Date().toISOString(),
  });
};

// Error logging helper
export const logError = (
  error: Error,
  context?: {
    userId?: number;
    operation?: string;
    data?: any;
  }
) => {
  logger.error('Application error', {
    error: {
      name: error.name,
      message: error.message,
      stack: error.stack,
    },
    context,
    timestamp: new Date().toISOString(),
  });
};

// Database operation logging
export const logDatabaseOperation = (
  operation: string,
  table: string,
  duration: number,
  success: boolean,
  error?: string
) => {
  const level = success ? 'info' : 'error';
  logger.log(level, 'Database operation', {
    operation,
    table,
    duration,
    success,
    error,
    timestamp: new Date().toISOString(),
  });
};

// API request logging
export const logApiRequest = (
  method: string,
  url: string,
  statusCode: number,
  duration: number,
  userId?: number
) => {
  logger.info('API request', {
    method,
    url,
    statusCode,
    duration,
    userId,
    timestamp: new Date().toISOString(),
  });
};

export default logger;