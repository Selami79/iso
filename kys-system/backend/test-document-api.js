const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const app = express();
const prisma = new PrismaClient();
const PORT = 3003;

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'KYS Document Test API',
    timestamp: new Date().toISOString()
  });
});

// Get categories
app.get('/api/v1/categories', async (req, res) => {
  try {
    const categories = await prisma.documentCategory.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' }
    });
    res.json({ success: true, data: categories });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Create document
app.post('/api/v1/documents', async (req, res) => {
  try {
    const {
      documentCode,
      title,
      categoryId,
      documentType,
      accessLevel,
      keywords
    } = req.body;

    console.log('Creating document with data:', req.body);

    const document = await prisma.document.create({
      data: {
        documentCode,
        title,
        categoryId: parseInt(categoryId),
        documentType: documentType || 'procedure',
        accessLevel: accessLevel || 'internal',
        keywords,
        createdByUserId: 1, // Admin user
        status: 'draft'
      },
      include: {
        category: true,
        createdBy: {
          select: { id: true, username: true, fullName: true }
        }
      }
    });

    res.status(201).json({
      success: true,
      data: document,
      message: 'Doküman başarıyla oluşturuldu'
    });
  } catch (error) {
    console.error('Create document error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get documents
app.get('/api/v1/documents', async (req, res) => {
  try {
    const documents = await prisma.document.findMany({
      include: {
        category: true,
        createdBy: {
          select: { id: true, username: true, fullName: true }
        },
        currentRevision: true
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({
      success: true,
      data: documents,
      count: documents.length
    });
  } catch (error) {
    console.error('Get documents error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get single document
app.get('/api/v1/documents/:id', async (req, res) => {
  try {
    const document = await prisma.document.findUnique({
      where: { id: parseInt(req.params.id) },
      include: {
        category: true,
        createdBy: {
          select: { id: true, username: true, fullName: true }
        },
        currentRevision: true,
        revisions: {
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!document) {
      return res.status(404).json({
        success: false,
        error: 'Doküman bulunamadı'
      });
    }

    res.json({
      success: true,
      data: document
    });
  } catch (error) {
    console.error('Get document error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Create revision
app.post('/api/v1/documents/:documentId/revisions', async (req, res) => {
  try {
    const { documentId } = req.params;
    const {
      revisionNumber,
      contentType,
      contentText,
      changeDescription
    } = req.body;

    console.log('Creating revision for document:', documentId, req.body);

    const revision = await prisma.documentRevision.create({
      data: {
        documentId: parseInt(documentId),
        revisionNumber: revisionNumber || '1.0',
        contentType: contentType || 'text',
        contentText,
        changeDescription,
        preparedByUserId: 1,
        preparationDate: new Date()
      }
    });

    // Update document with current revision if this is the first one
    const document = await prisma.document.findUnique({
      where: { id: parseInt(documentId) }
    });

    if (!document.currentRevisionId) {
      await prisma.document.update({
        where: { id: parseInt(documentId) },
        data: { currentRevisionId: revision.id }
      });
    }

    res.status(201).json({
      success: true,
      data: revision,
      message: 'Revizyon başarıyla oluşturuldu'
    });
  } catch (error) {
    console.error('Create revision error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

app.listen(PORT, () => {
  console.log(`📄 KYS Document Test API running on port ${PORT}`);
  console.log(`🏥 Health: http://localhost:${PORT}/health`);
  console.log(`📑 Endpoints:`);
  console.log(`   GET    /api/v1/categories`);
  console.log(`   POST   /api/v1/documents`);
  console.log(`   GET    /api/v1/documents`);
  console.log(`   GET    /api/v1/documents/:id`);
  console.log(`   POST   /api/v1/documents/:documentId/revisions`);
});

process.on('SIGTERM', async () => {
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGINT', async () => {
  await prisma.$disconnect();
  process.exit(0);
});