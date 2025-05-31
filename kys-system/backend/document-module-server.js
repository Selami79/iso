const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const app = express();
const prisma = new PrismaClient();
const PORT = 3004;

// Create uploads directory if not exists
const uploadsDir = path.join(__dirname, 'uploads', 'documents');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: function (req, file, cb) {
    const allowedExtensions = /pdf|doc|docx|xls|xlsx|txt|png|jpg|jpeg/;
    const allowedMimeTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain',
      'image/png',
      'image/jpeg',
      'image/jpg'
    ];
    
    const extname = allowedExtensions.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedMimeTypes.includes(file.mimetype);
    
    console.log('File upload check:', {
      filename: file.originalname,
      mimetype: file.mimetype,
      extname: extname,
      mimetypeValid: mimetype
    });
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      console.error('File rejected:', file.originalname, 'MIME:', file.mimetype);
      cb(new Error('Desteklenmeyen dosya tipi!'));
    }
  }
});

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'KYS Document Module API',
    timestamp: new Date().toISOString()
  });
});

// ========== DOCUMENT CATEGORIES ==========

// Get all categories
app.get('/api/v1/document-categories', async (req, res) => {
  try {
    const categories = await prisma.documentCategory.findMany({
      where: { isActive: true },
      include: {
        parentCategory: true,
        childCategories: true,
        _count: {
          select: { documents: true }
        }
      },
      orderBy: { sortOrder: 'asc' }
    });

    res.json({
      success: true,
      data: categories
    });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Create category
app.post('/api/v1/document-categories', async (req, res) => {
  try {
    const { categoryName, description, parentCategoryId, sortOrder } = req.body;

    const category = await prisma.documentCategory.create({
      data: {
        categoryName,
        description,
        parentCategoryId,
        sortOrder: sortOrder || 0
      }
    });

    res.status(201).json({
      success: true,
      data: category,
      message: 'Kategori başarıyla oluşturuldu'
    });
  } catch (error) {
    console.error('Create category error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ========== DOCUMENTS ==========

// Get document stats - MUST BE BEFORE /:id route
app.get('/api/v1/documents/stats', async (req, res) => {
  try {
    const [totalDocuments, categoryCounts, typeCounts, pendingReviews] = await Promise.all([
      prisma.document.count({ where: { is_active: true } }),
      prisma.document.groupBy({
        by: ['categoryId'],
        where: { is_active: true },
        _count: true
      }),
      prisma.document.groupBy({
        by: ['documentType'],
        where: { is_active: true },
        _count: true
      }),
      prisma.document.count({
        where: {
          is_active: true,
          nextReviewDate: {
            lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
          }
        }
      })
    ]);

    res.json({
      success: true,
      data: {
        totalDocuments,
        categoryCounts,
        typeCounts,
        pendingReviews
      }
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get next document code - MUST BE BEFORE /:id route
app.get('/api/v1/documents/next-code/:type', async (req, res) => {
  try {
    const { type } = req.params;
    
    // Document type prefix mapping
    const prefixMap = {
      'PROSEDÜR': 'P',
      'TALİMAT': 'T',
      'FORM': 'F',
      'LİSTE': 'L',
      'PLAN': 'PL',
      'POLİTİKA': 'PO',
      'ŞARTNAME': 'S',
      'KILAVUZ': 'K'
    };
    
    const prefix = prefixMap[type] || 'D'; // Default 'D' for Document
    
    // Find the highest number for this type
    const lastDoc = await prisma.document.findFirst({
      where: {
        documentCode: {
          startsWith: `${prefix}-`
        }
      },
      orderBy: {
        documentCode: 'desc'
      }
    });
    
    let nextNumber = 1;
    if (lastDoc) {
      const lastNumber = parseInt(lastDoc.documentCode.split('-')[1]);
      nextNumber = lastNumber + 1;
    }
    
    const nextCode = `${prefix}-${nextNumber.toString().padStart(3, '0')}`;
    
    res.json({
      success: true,
      data: {
        nextCode,
        prefix,
        number: nextNumber
      }
    });
  } catch (error) {
    console.error('Get next code error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get all documents
app.get('/api/v1/documents', async (req, res) => {
  try {
    const { 
      categoryId, 
      documentType,
      search,
      page = 1,
      limit = 20 
    } = req.query;

    const where = { is_active: true };
    
    if (categoryId) where.categoryId = parseInt(categoryId);
    if (documentType) where.documentType = documentType;
    if (search) {
      where.OR = [
        { documentCode: { contains: search, mode: 'insensitive' } },
        { document_name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ];
    }

    const skip = (page - 1) * limit;

    const [documents, total] = await Promise.all([
      prisma.document.findMany({
        where,
        include: {
          category: true,
          users_documents_owner_user_idTousers: {
            select: { id: true, username: true, fullName: true }
          },
          users_documents_responsible_user_idTousers: {
            select: { id: true, username: true, fullName: true }
          },
          currentRevision: {
            select: { 
              id: true, 
              revisionNumber: true, 
              revision_date: true,
              approvalStatus: true
            }
          },
          _count: {
            select: { revisions: true }
          }
        },
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' }
      }),
      prisma.document.count({ where })
    ]);

    res.json({
      success: true,
      data: documents.map(doc => ({
        id: doc.id,
        documentCode: doc.documentCode,
        documentName: doc.document_name,
        categoryId: doc.categoryId,
        categoryName: doc.category?.categoryName,
        documentType: doc.documentType,
        currentVersion: doc.current_version,
        currentRevision: doc.currentRevision,
        owner: doc.users_documents_owner_user_idTousers,
        responsible: doc.users_documents_responsible_user_idTousers,
        description: doc.description,
        reviewFrequencyMonths: doc.reviewFrequencyMonths,
        nextReviewDate: doc.nextReviewDate,
        isControlled: doc.isControlled,
        accessLevel: doc.accessLevel,
        tags: doc.tags,
        revisionCount: doc._count.revisions,
        createdAt: doc.createdAt,
        updatedAt: doc.updatedAt
      })),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit)
      }
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
    const { id } = req.params;
    
    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({
        success: false,
        error: 'Geçersiz doküman ID'
      });
    }

    const document = await prisma.document.findUnique({
      where: { id: parseInt(id) },
      include: {
        category: true,
        users_documents_owner_user_idTousers: {
          select: { id: true, username: true, fullName: true }
        },
        users_documents_responsible_user_idTousers: {
          select: { id: true, username: true, fullName: true }
        },
        currentRevision: {
          include: {
            users_document_revisions_created_by_user_idTousers: {
              select: { id: true, username: true, fullName: true }
            },
            approvedBy: {
              select: { id: true, username: true, fullName: true }
            }
          }
        },
        revisions: {
          orderBy: { createdAt: 'desc' },
          include: {
            users_document_revisions_created_by_user_idTousers: {
              select: { id: true, username: true, fullName: true }
            },
            approvedBy: {
              select: { id: true, username: true, fullName: true }
            }
          }
        }
      }
    });

    if (!document) {
      return res.status(404).json({
        success: false,
        error: 'Doküman bulunamadı'
      });
    }

    // Log access
    await prisma.documentAccessLog.create({
      data: {
        documentId: document.id,
        revisionId: document.currentRevisionId,
        userId: 2, // Admin user ID
        action: 'view',
        ipAddress: req.ip,
        userAgent: req.get('user-agent')
      }
    });

    // Convert BigInt fields to strings
    const formatRevision = (rev) => ({
      ...rev,
      fileSize: rev.fileSize ? rev.fileSize.toString() : null
    });

    res.json({
      success: true,
      data: {
        id: document.id,
        documentCode: document.documentCode,
        documentName: document.document_name,
        category: document.category,
        documentType: document.documentType,
        currentVersion: document.current_version,
        currentRevision: document.currentRevision ? formatRevision(document.currentRevision) : null,
        owner: document.users_documents_owner_user_idTousers,
        responsible: document.users_documents_responsible_user_idTousers,
        description: document.description,
        reviewFrequencyMonths: document.reviewFrequencyMonths,
        nextReviewDate: document.nextReviewDate,
        isActive: document.is_active,
        isControlled: document.isControlled,
        accessLevel: document.accessLevel,
        tags: document.tags,
        revisions: document.revisions ? document.revisions.map(formatRevision) : [],
        createdAt: document.createdAt,
        updatedAt: document.updatedAt
      }
    });
  } catch (error) {
    console.error('Get document error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// View document file - MUST BE BEFORE /:id route
app.get('/api/v1/documents/:documentId/view', async (req, res) => {
  try {
    const { documentId } = req.params;
    
    const document = await prisma.document.findUnique({
      where: { id: parseInt(documentId) },
      include: {
        currentRevision: true
      }
    });
    
    if (!document) {
      return res.status(404).json({
        success: false,
        error: 'Doküman bulunamadı'
      });
    }
    
    if (!document.currentRevision || !document.currentRevision.filePath) {
      return res.status(404).json({
        success: false,
        error: 'Doküman dosyası bulunamadı'
      });
    }
    
    const filePath = path.join(__dirname, document.currentRevision.filePath);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        error: 'Dosya sistemde bulunamadı'
      });
    }
    
    // Log view access
    await prisma.documentAccessLog.create({
      data: {
        documentId: document.id,
        revisionId: document.currentRevisionId,
        userId: 2, // Admin user ID
        action: 'view',
        ipAddress: req.ip,
        userAgent: req.get('user-agent')
      }
    });
    
    // Set appropriate content type
    const fileExt = path.extname(filePath).toLowerCase();
    const contentTypes = {
      '.pdf': 'application/pdf',
      '.doc': 'application/msword',
      '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      '.txt': 'text/plain; charset=utf-8',
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg'
    };
    
    const contentType = contentTypes[fileExt] || 'application/octet-stream';
    
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `inline; filename="${document.documentCode}_v${document.current_version}${fileExt}"`);
    
    // Stream the file
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
  } catch (error) {
    console.error('View document error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Download document file - MUST BE BEFORE /:id route
app.get('/api/v1/documents/:documentId/download', async (req, res) => {
  try {
    const { documentId } = req.params;
    
    const document = await prisma.document.findUnique({
      where: { id: parseInt(documentId) },
      include: {
        currentRevision: true
      }
    });
    
    if (!document) {
      return res.status(404).json({
        success: false,
        error: 'Doküman bulunamadı'
      });
    }
    
    if (!document.currentRevision || !document.currentRevision.filePath) {
      return res.status(404).json({
        success: false,
        error: 'Doküman dosyası bulunamadı'
      });
    }
    
    const filePath = path.join(__dirname, document.currentRevision.filePath);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        error: 'Dosya sistemde bulunamadı'
      });
    }
    
    // Log download access
    await prisma.documentAccessLog.create({
      data: {
        documentId: document.id,
        revisionId: document.currentRevisionId,
        userId: 2, // Admin user ID
        action: 'download',
        ipAddress: req.ip,
        userAgent: req.get('user-agent')
      }
    });
    
    res.download(filePath, `${document.documentCode}_v${document.current_version}.${document.currentRevision.file_type?.toLowerCase() || 'pdf'}`);
  } catch (error) {
    console.error('Download document error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get next document code - MUST BE BEFORE /:id route
app.get('/api/v1/documents/next-code/:type', async (req, res) => {
  try {
    const { type } = req.params;
    
    // Document type prefix mapping
    const prefixMap = {
      'PROSEDÜR': 'P',
      'TALİMAT': 'T',
      'FORM': 'F',
      'LİSTE': 'L',
      'PLAN': 'PL',
      'POLİTİKA': 'PO',
      'ŞARTNAME': 'S',
      'KILAVUZ': 'K'
    };
    
    const prefix = prefixMap[type] || 'D'; // Default 'D' for Document
    
    // Find the highest number for this type
    const lastDoc = await prisma.document.findFirst({
      where: {
        documentCode: {
          startsWith: `${prefix}-`
        }
      },
      orderBy: {
        documentCode: 'desc'
      }
    });
    
    let nextNumber = 1;
    if (lastDoc) {
      const lastNumber = parseInt(lastDoc.documentCode.split('-')[1]);
      nextNumber = lastNumber + 1;
    }
    
    const nextCode = `${prefix}-${nextNumber.toString().padStart(3, '0')}`;
    
    res.json({
      success: true,
      data: {
        nextCode,
        prefix,
        number: nextNumber
      }
    });
  } catch (error) {
    console.error('Get next code error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Create document
app.post('/api/v1/documents', async (req, res) => {
  try {
    const {
      documentName,
      categoryId,
      documentType,
      description,
      accessLevel,
      tags,
      reviewFrequencyMonths,
      responsibleUserId
    } = req.body;

    // Generate document code automatically
    const prefixMap = {
      'PROSEDÜR': 'P',
      'TALİMAT': 'T',
      'FORM': 'F',
      'LİSTE': 'L',
      'PLAN': 'PL',
      'POLİTİKA': 'PO',
      'ŞARTNAME': 'S',
      'KILAVUZ': 'K'
    };
    
    const prefix = prefixMap[documentType] || 'D';
    
    // Find the highest number for this type
    const lastDoc = await prisma.document.findFirst({
      where: {
        documentCode: {
          startsWith: `${prefix}-`
        }
      },
      orderBy: {
        documentCode: 'desc'
      }
    });
    
    let nextNumber = 1;
    if (lastDoc) {
      const lastNumber = parseInt(lastDoc.documentCode.split('-')[1]);
      nextNumber = lastNumber + 1;
    }
    
    const documentCode = `${prefix}-${nextNumber.toString().padStart(3, '0')}`;

    const document = await prisma.document.create({
      data: {
        documentCode,
        document_name: documentName,
        categoryId: parseInt(categoryId),
        documentType: documentType || 'PROSEDÜR',
        description,
        owner_user_id: 2, // Admin user ID
        responsible_user_id: responsibleUserId || null,
        reviewFrequencyMonths: reviewFrequencyMonths || 12,
        accessLevel: accessLevel || 'INTERNAL',
        tags,
        is_active: true,
        isControlled: true,
        current_version: '1.0'
      },
      include: {
        category: true,
        users_documents_owner_user_idTousers: {
          select: { id: true, username: true, fullName: true }
        }
      }
    });

    res.status(201).json({
      success: true,
      data: {
        id: document.id,
        documentCode: document.documentCode,
        documentName: document.document_name,
        category: document.category,
        documentType: document.documentType,
        owner: document.users_documents_owner_user_idTousers,
        createdAt: document.createdAt
      },
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

// Update document
app.put('/api/v1/documents/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      documentName,
      categoryId,
      documentType,
      description,
      accessLevel,
      tags,
      reviewFrequencyMonths,
      responsibleUserId
    } = req.body;

    const updateData = {};
    if (documentName !== undefined) updateData.document_name = documentName;
    if (categoryId !== undefined) updateData.categoryId = parseInt(categoryId);
    if (documentType !== undefined) updateData.documentType = documentType;
    if (description !== undefined) updateData.description = description;
    if (accessLevel !== undefined) updateData.accessLevel = accessLevel;
    if (tags !== undefined) updateData.tags = tags;
    if (reviewFrequencyMonths !== undefined) updateData.reviewFrequencyMonths = reviewFrequencyMonths;
    if (responsibleUserId !== undefined) updateData.responsible_user_id = responsibleUserId;

    const document = await prisma.document.update({
      where: { id: parseInt(id) },
      data: updateData,
      include: {
        category: true,
        users_documents_owner_user_idTousers: {
          select: { id: true, username: true, fullName: true }
        },
        users_documents_responsible_user_idTousers: {
          select: { id: true, username: true, fullName: true }
        }
      }
    });

    res.json({
      success: true,
      data: {
        id: document.id,
        documentCode: document.documentCode,
        documentName: document.document_name,
        category: document.category,
        documentType: document.documentType,
        owner: document.users_documents_owner_user_idTousers,
        responsible: document.users_documents_responsible_user_idTousers,
        updatedAt: document.updatedAt
      },
      message: 'Doküman başarıyla güncellendi'
    });
  } catch (error) {
    console.error('Update document error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ========== DOCUMENT REVISIONS ==========

// Create revision with file upload
app.post('/api/v1/documents/:documentId/revisions', upload.single('documentFile'), async (req, res) => {
  try {
    const { documentId } = req.params;
    const {
      revisionNumber,
      revisionReason,
      changesSummary,
      isMajorRevision
    } = req.body;

    let filePath = null;
    let fileSize = null;
    let fileType = null;

    if (req.file) {
      filePath = `/uploads/documents/${req.file.filename}`;
      fileSize = req.file.size;
      fileType = path.extname(req.file.originalname).substring(1).toUpperCase();
    }

    const revision = await prisma.documentRevision.create({
      data: {
        documentId: parseInt(documentId),
        revisionNumber: revisionNumber || '1.1',
        revision_date: new Date(),
        revision_reason: revisionReason || 'Revizyon oluşturuldu',
        changes_summary: changesSummary || null,
        filePath: filePath,
        fileSize: fileSize,
        file_type: fileType,
        created_by_user_id: 2, // Admin user ID
        approvalStatus: 'DRAFT',
        is_major_revision: isMajorRevision === 'true' || isMajorRevision === true
      },
      include: {
        users_document_revisions_created_by_user_idTousers: {
          select: { id: true, username: true, fullName: true }
        }
      }
    });

    res.status(201).json({
      success: true,
      data: {
        id: revision.id,
        documentId: revision.documentId,
        revisionNumber: revision.revisionNumber,
        revisionDate: revision.revision_date,
        revisionReason: revision.revision_reason,
        changesSummary: revision.changes_summary,
        filePath: revision.filePath,
        fileSize: revision.fileSize ? Number(revision.fileSize) : null,
        fileType: revision.file_type,
        createdBy: revision.users_document_revisions_created_by_user_idTousers,
        approvalStatus: revision.approvalStatus,
        isMajorRevision: revision.is_major_revision,
        createdAt: revision.createdAt
      },
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

// Approve revision
app.post('/api/v1/revisions/:revisionId/approve', async (req, res) => {
  try {
    const { revisionId } = req.params;
    const { comments } = req.body;

    const result = await prisma.$transaction(async (tx) => {
      // Update revision
      const revision = await tx.documentRevision.update({
        where: { id: parseInt(revisionId) },
        data: {
          approvalStatus: 'APPROVED',
          approvedByUserId: 2, // Admin user ID
          approved_at: new Date()
        }
      });

      // Update document
      await tx.document.update({
        where: { id: revision.documentId },
        data: {
          currentRevisionId: revision.id,
          current_version: revision.revisionNumber,
          nextReviewDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // 1 year
        }
      });

      return revision;
    });

    res.json({
      success: true,
      data: {
        id: result.id,
        documentId: result.documentId,
        revisionNumber: result.revisionNumber,
        approvalStatus: result.approvalStatus,
        approvedByUserId: result.approvedByUserId,
        approved_at: result.approved_at
      },
      message: 'Revizyon başarıyla onaylandı'
    });
  } catch (error) {
    console.error('Approve revision error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get access logs
app.get('/api/v1/documents/:documentId/access-logs', async (req, res) => {
  try {
    const { documentId } = req.params;

    const logs = await prisma.documentAccessLog.findMany({
      where: { documentId: parseInt(documentId) },
      include: {
        user: {
          select: { id: true, username: true, fullName: true }
        },
        revision: {
          select: { id: true, revisionNumber: true }
        }
      },
      orderBy: { accessedAt: 'desc' },
      take: 100
    });

    res.json({
      success: true,
      data: logs
    });
  } catch (error) {
    console.error('Get access logs error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});



app.listen(PORT, () => {
  console.log(`📄 KYS Document Module API running on port ${PORT}`);
  console.log(`🏥 Health: http://localhost:${PORT}/health`);
  console.log(`\n📑 Endpoints:`);
  console.log(`   GET    /api/v1/document-categories`);
  console.log(`   POST   /api/v1/document-categories`);
  console.log(`   GET    /api/v1/documents`);
  console.log(`   GET    /api/v1/documents/:id`);
  console.log(`   POST   /api/v1/documents`);
  console.log(`   PUT    /api/v1/documents/:id`);
  console.log(`   POST   /api/v1/documents/:documentId/revisions`);
  console.log(`   POST   /api/v1/revisions/:revisionId/approve`);
  console.log(`   GET    /api/v1/documents/:documentId/access-logs`);
  console.log(`   GET    /api/v1/documents/stats`);
});

process.on('SIGTERM', async () => {
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGINT', async () => {
  await prisma.$disconnect();
  process.exit(0);
});