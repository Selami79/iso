import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import 'express-async-errors';

import { config } from '@/config/config';
import { logger } from '@/shared/logger';
import { errorHandler } from '@/middleware/errorHandler';
import { requestLogger } from '@/middleware/requestLogger';
import { authMiddleware } from '@/middleware/auth';

// Import route modules
import authRoutes from '@/modules/auth/routes';

// Import CommonJS modules for CAPA
const capaRoutes = require('./modules/capa/routes');

const app = express();

// Trust proxy for accurate IP addresses
app.set('trust proxy', 1);

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  crossOriginEmbedderPolicy: false,
}));

// CORS configuration
app.use(cors({
  origin: config.cors.origin,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.max,
  message: {
    error: 'Çok fazla istek gönderildi. Lütfen daha sonra tekrar deneyin.',
    code: 'RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Compression
app.use(compression());

// Request logging
app.use(morgan(config.env === 'production' ? 'combined' : 'dev'));
app.use(requestLogger);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: config.env,
    version: process.env.npm_package_version || '1.0.0',
  });
});

// API documentation
if (config.swagger.enabled) {
  const swaggerUi = require('swagger-ui-express');
  const swaggerSpecs = require('@/config/swagger');
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpecs));
}

// API routes
const apiRouter = express.Router();

// Public routes (no authentication required)
apiRouter.use('/auth', authRoutes);

// Protected routes (authentication required)
apiRouter.use('/capa', capaRoutes);

// Other modules will be added as they are implemented
// apiRouter.use('/users', authMiddleware, userRoutes);
// apiRouter.use('/documents', authMiddleware, documentRoutes);

app.use(config.api.prefix, apiRouter);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Endpoint bulunamadı',
    code: 'ENDPOINT_NOT_FOUND',
    path: req.originalUrl,
    method: req.method,
  });
});

// Global error handler
app.use(errorHandler);

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM signal received. Closing HTTP server.');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT signal received. Closing HTTP server.');
  process.exit(0);
});

const server = app.listen(config.server.port, () => {
  logger.info(`🚀 KYS Server started on port ${config.server.port}`);
  logger.info(`📖 API Documentation: http://localhost:${config.server.port}/api-docs`);
  logger.info(`🏥 Health Check: http://localhost:${config.server.port}/health`);
  logger.info(`🌍 Environment: ${config.env}`);
});

export { app, server };