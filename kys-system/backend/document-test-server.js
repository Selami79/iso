const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

// Import document routes
const documentRoutes = require('./src/modules/documents/routes');

const app = express();
const prisma = new PrismaClient();
const PORT = 3002;

// Middleware
app.use(cors());
app.use(express.json());

// Mock authentication middleware (for testing)
app.use((req, res, next) => {
  // Mock user - in production this would come from JWT token
  req.user = { id: 1, username: 'admin', isSystemAdmin: true };
  next();
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'KYS Document Management API',
    timestamp: new Date().toISOString()
  });
});

// Mount document routes
app.use('/api/v1', documentRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    error: 'Sunucu hatası oluştu'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`📄 KYS Document Management Server running on port ${PORT}`);
  console.log(`🏥 Health: http://localhost:${PORT}/health`);
  console.log(`\n📑 Document Endpoints:`);
  console.log(`   GET    http://localhost:${PORT}/api/v1/categories`);
  console.log(`   POST   http://localhost:${PORT}/api/v1/categories`);
  console.log(`   GET    http://localhost:${PORT}/api/v1/documents`);
  console.log(`   GET    http://localhost:${PORT}/api/v1/documents/:id`);
  console.log(`   POST   http://localhost:${PORT}/api/v1/documents`);
  console.log(`   PUT    http://localhost:${PORT}/api/v1/documents/:id`);
  console.log(`   POST   http://localhost:${PORT}/api/v1/documents/:documentId/revisions`);
  console.log(`   POST   http://localhost:${PORT}/api/v1/revisions/:revisionId/approve`);
  console.log(`   GET    http://localhost:${PORT}/api/v1/revisions/:revisionId/download`);
  console.log(`   GET    http://localhost:${PORT}/api/v1/documents/:documentId/access-logs`);
});

// Cleanup on exit
process.on('SIGTERM', async () => {
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGINT', async () => {
  await prisma.$disconnect();
  process.exit(0);
});