import dotenv from 'dotenv';
import { z } from 'zod';

// Load environment variables
dotenv.config();

// Environment validation schema
const envSchema = z.object({
  // Environment
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().transform(Number).default('3000'),
  
  // Database
  DATABASE_URL: z.string().min(1, 'Database URL is required'),
  
  // JWT
  JWT_SECRET: z.string().min(32, 'JWT secret must be at least 32 characters'),
  JWT_REFRESH_SECRET: z.string().min(32, 'JWT refresh secret must be at least 32 characters'),
  JWT_EXPIRES_IN: z.string().default('1h'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),
  
  // Redis
  REDIS_URL: z.string().optional(),
  REDIS_HOST: z.string().default('localhost'),
  REDIS_PORT: z.string().transform(Number).default('6379'),
  REDIS_PASSWORD: z.string().optional(),
  REDIS_DB: z.string().transform(Number).default('0'),
  
  // Email
  MAIL_HOST: z.string().optional(),
  MAIL_PORT: z.string().transform(Number).default('587'),
  MAIL_SECURE: z.string().transform(val => val === 'true').default('false'),
  MAIL_USER: z.string().optional(),
  MAIL_PASSWORD: z.string().optional(),
  MAIL_FROM: z.string().optional(),
  MAIL_FROM_NAME: z.string().default('KYS Quality Management System'),
  
  // File Upload
  UPLOAD_DIR: z.string().default('uploads'),
  MAX_FILE_SIZE: z.string().transform(Number).default('52428800'), // 50MB
  ALLOWED_FILE_TYPES: z.string().default('pdf,doc,docx,xls,xlsx,jpg,jpeg,png,gif'),
  
  // Security
  BCRYPT_ROUNDS: z.string().transform(Number).default('12'),
  RATE_LIMIT_WINDOW_MS: z.string().transform(Number).default('900000'), // 15 minutes
  RATE_LIMIT_MAX_REQUESTS: z.string().transform(Number).default('100'),
  CORS_ORIGIN: z.string().default('http://localhost:3001'),
  SESSION_SECRET: z.string().min(32, 'Session secret must be at least 32 characters'),
  
  // Logging
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
  LOG_FILE: z.string().default('logs/app.log'),
  LOG_MAX_SIZE: z.string().default('20m'),
  LOG_MAX_FILES: z.string().default('14d'),
  
  // Features
  ENABLE_EMAIL_NOTIFICATIONS: z.string().transform(val => val === 'true').default('true'),
  ENABLE_SMS_NOTIFICATIONS: z.string().transform(val => val === 'true').default('false'),
  NOTIFICATION_BATCH_SIZE: z.string().transform(Number).default('50'),
  ENABLE_CACHE: z.string().transform(val => val === 'true').default('true'),
  CACHE_TTL: z.string().transform(Number).default('3600'),
  ENABLE_COMPRESSION: z.string().transform(val => val === 'true').default('true'),
  
  // Backup
  BACKUP_ENABLED: z.string().transform(val => val === 'true').default('true'),
  BACKUP_SCHEDULE: z.string().default('0 2 * * *'),
  BACKUP_RETENTION_DAYS: z.string().transform(Number).default('30'),
  BACKUP_LOCATION: z.string().default('backups'),
  
  // Audit
  AUDIT_LOG_RETENTION_DAYS: z.string().transform(Number).default('2555'), // 7 years
  ENABLE_DETAILED_LOGGING: z.string().transform(val => val === 'true').default('true'),
  
  // External Services
  ELASTIC_SEARCH_URL: z.string().optional(),
  MONITORING_ENDPOINT: z.string().optional(),
  
  // Company Information
  COMPANY_NAME: z.string().default('Your Company Name'),
  COMPANY_ADDRESS: z.string().default('Your Company Address'),
  COMPANY_PHONE: z.string().default('+90 XXX XXX XX XX'),
  COMPANY_EMAIL: z.string().default('info@yourcompany.com'),
  COMPANY_WEBSITE: z.string().default('https://www.yourcompany.com'),
  COMPANY_LOGO_URL: z.string().optional(),
  
  // QMS Configuration
  DEFAULT_DOCUMENT_RETENTION_YEARS: z.string().transform(Number).default('7'),
  DEFAULT_REVIEW_FREQUENCY_MONTHS: z.string().transform(Number).default('12'),
  AUTO_ASSIGN_DOCUMENT_CODES: z.string().transform(val => val === 'true').default('true'),
  DOCUMENT_CODE_PREFIX: z.string().default('DOC'),
  CAPA_CODE_PREFIX: z.string().default('CAPA'),
  AUDIT_CODE_PREFIX: z.string().default('AUD'),
  
  // Localization
  DEFAULT_LANGUAGE: z.string().default('tr'),
  DEFAULT_TIMEZONE: z.string().default('Europe/Istanbul'),
  SUPPORTED_LANGUAGES: z.string().default('tr,en'),
  DATE_FORMAT: z.string().default('DD/MM/YYYY'),
  TIME_FORMAT: z.string().default('HH:mm'),
  
  // Development
  DEBUG: z.string().transform(val => val === 'true').default('false'),
  ENABLE_SWAGGER: z.string().transform(val => val === 'true').default('true'),
  SWAGGER_PATH: z.string().default('/api-docs'),
});

// Validate environment variables
const env = envSchema.parse(process.env);

export const config = {
  env: env.NODE_ENV,
  
  server: {
    port: env.PORT,
    host: '0.0.0.0',
  },
  
  api: {
    prefix: '/api/v1',
    version: 'v1',
  },
  
  database: {
    url: env.DATABASE_URL,
  },
  
  jwt: {
    secret: env.JWT_SECRET,
    refreshSecret: env.JWT_REFRESH_SECRET,
    expiresIn: env.JWT_EXPIRES_IN,
    refreshExpiresIn: env.JWT_REFRESH_EXPIRES_IN,
  },
  
  redis: {
    url: env.REDIS_URL,
    host: env.REDIS_HOST,
    port: env.REDIS_PORT,
    password: env.REDIS_PASSWORD,
    db: env.REDIS_DB,
  },
  
  email: {
    host: env.MAIL_HOST,
    port: env.MAIL_PORT,
    secure: env.MAIL_SECURE,
    user: env.MAIL_USER,
    password: env.MAIL_PASSWORD,
    from: env.MAIL_FROM,
    fromName: env.MAIL_FROM_NAME,
  },
  
  upload: {
    dir: env.UPLOAD_DIR,
    maxFileSize: env.MAX_FILE_SIZE,
    allowedTypes: env.ALLOWED_FILE_TYPES.split(','),
  },
  
  security: {
    bcryptRounds: env.BCRYPT_ROUNDS,
    sessionSecret: env.SESSION_SECRET,
  },
  
  rateLimit: {
    windowMs: env.RATE_LIMIT_WINDOW_MS,
    max: env.RATE_LIMIT_MAX_REQUESTS,
  },
  
  cors: {
    origin: env.CORS_ORIGIN.split(','),
  },
  
  logging: {
    level: env.LOG_LEVEL,
    file: env.LOG_FILE,
    maxSize: env.LOG_MAX_SIZE,
    maxFiles: env.LOG_MAX_FILES,
  },
  
  features: {
    emailNotifications: env.ENABLE_EMAIL_NOTIFICATIONS,
    smsNotifications: env.ENABLE_SMS_NOTIFICATIONS,
    notificationBatchSize: env.NOTIFICATION_BATCH_SIZE,
    cache: env.ENABLE_CACHE,
    cacheTtl: env.CACHE_TTL,
    compression: env.ENABLE_COMPRESSION,
  },
  
  backup: {
    enabled: env.BACKUP_ENABLED,
    schedule: env.BACKUP_SCHEDULE,
    retentionDays: env.BACKUP_RETENTION_DAYS,
    location: env.BACKUP_LOCATION,
  },
  
  audit: {
    retentionDays: env.AUDIT_LOG_RETENTION_DAYS,
    detailedLogging: env.ENABLE_DETAILED_LOGGING,
  },
  
  external: {
    elasticSearchUrl: env.ELASTIC_SEARCH_URL,
    monitoringEndpoint: env.MONITORING_ENDPOINT,
  },
  
  company: {
    name: env.COMPANY_NAME,
    address: env.COMPANY_ADDRESS,
    phone: env.COMPANY_PHONE,
    email: env.COMPANY_EMAIL,
    website: env.COMPANY_WEBSITE,
    logoUrl: env.COMPANY_LOGO_URL,
  },
  
  qms: {
    defaultDocumentRetentionYears: env.DEFAULT_DOCUMENT_RETENTION_YEARS,
    defaultReviewFrequencyMonths: env.DEFAULT_REVIEW_FREQUENCY_MONTHS,
    autoAssignDocumentCodes: env.AUTO_ASSIGN_DOCUMENT_CODES,
    documentCodePrefix: env.DOCUMENT_CODE_PREFIX,
    capaCodePrefix: env.CAPA_CODE_PREFIX,
    auditCodePrefix: env.AUDIT_CODE_PREFIX,
  },
  
  localization: {
    defaultLanguage: env.DEFAULT_LANGUAGE,
    defaultTimezone: env.DEFAULT_TIMEZONE,
    supportedLanguages: env.SUPPORTED_LANGUAGES.split(','),
    dateFormat: env.DATE_FORMAT,
    timeFormat: env.TIME_FORMAT,
  },
  
  development: {
    debug: env.DEBUG,
  },
  
  swagger: {
    enabled: env.ENABLE_SWAGGER,
    path: env.SWAGGER_PATH,
  },
} as const;

// Type for configuration
export type Config = typeof config;