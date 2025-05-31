const { PrismaClient } = require('@prisma/client');
const path = require('path');
const fs = require('fs').promises;
const crypto = require('crypto');

const prisma = new PrismaClient();

const documentController = {
  // Get all document categories
  async getCategories(req, res) {
    try {
      const categories = await prisma.documentCategory.findMany({
        where: { isActive: true },
        include: {
          parentCategory: true,
          childCategories: true
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
        error: 'Kategoriler getirilemedi'
      });
    }
  },

  // Create new document category
  async createCategory(req, res) {
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
        error: 'Kategori oluşturulamadı'
      });
    }
  },

  // Get all documents with filters
  async getDocuments(req, res) {
    try {
      const { 
        categoryId, 
        status, 
        documentType, 
        search,
        page = 1,
        limit = 20 
      } = req.query;

      const where = {};
      
      if (categoryId) where.categoryId = parseInt(categoryId);
      if (status) where.status = status;
      if (documentType) where.documentType = documentType;
      if (search) {
        where.OR = [
          { documentCode: { contains: search, mode: 'insensitive' } },
          { title: { contains: search, mode: 'insensitive' } },
          { keywords: { contains: search, mode: 'insensitive' } }
        ];
      }

      const skip = (page - 1) * limit;

      const [documents, total] = await Promise.all([
        prisma.document.findMany({
          where,
          include: {
            category: true,
            createdBy: {
              select: { id: true, username: true, fullName: true }
            },
            currentRevision: {
              select: { 
                id: true, 
                revisionNumber: true, 
                approvalStatus: true,
                preparationDate: true
              }
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
        data: documents,
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
        error: 'Dokümanlar getirilemedi'
      });
    }
  },

  // Get single document by ID
  async getDocument(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user?.id || 1; // Mock user ID for testing

      const document = await prisma.document.findUnique({
        where: { id: parseInt(id) },
        include: {
          category: true,
          createdBy: {
            select: { id: true, username: true, fullName: true }
          },
          currentRevision: {
            include: {
              preparedBy: {
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
              preparedBy: {
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
          userId,
          action: 'view',
          ipAddress: req.ip,
          userAgent: req.get('user-agent')
        }
      });

      res.json({
        success: true,
        data: document
      });
    } catch (error) {
      console.error('Get document error:', error);
      res.status(500).json({
        success: false,
        error: 'Doküman getirilemedi'
      });
    }
  },

  // Create new document
  async createDocument(req, res) {
    try {
      const {
        documentCode,
        title,
        categoryId,
        documentType,
        accessLevel,
        keywords,
        reviewFrequencyMonths,
        revisionData
      } = req.body;

      const userId = req.user?.id || 1; // Mock user ID for testing

      const result = await prisma.$transaction(async (tx) => {
        // Create document
        const document = await tx.document.create({
          data: {
            documentCode,
            title,
            categoryId: parseInt(categoryId),
            documentType: documentType || 'procedure',
            accessLevel: accessLevel || 'internal',
            keywords,
            reviewFrequencyMonths: reviewFrequencyMonths || 12,
            createdByUserId: userId,
            status: 'draft'
          }
        });

        // Create initial revision if provided
        if (revisionData) {
          const revision = await tx.documentRevision.create({
            data: {
              documentId: document.id,
              revisionNumber: '1.0',
              contentType: revisionData.contentType || 'text',
              contentText: revisionData.contentText,
              changeDescription: 'İlk versiyon',
              preparedByUserId: userId,
              preparationDate: new Date()
            }
          });

          // Update document with current revision
          await tx.document.update({
            where: { id: document.id },
            data: { currentRevisionId: revision.id }
          });
        }

        return document;
      });

      res.status(201).json({
        success: true,
        data: result,
        message: 'Doküman başarıyla oluşturuldu'
      });
    } catch (error) {
      console.error('Create document error:', error);
      res.status(500).json({
        success: false,
        error: 'Doküman oluşturulamadı'
      });
    }
  },

  // Update document
  async updateDocument(req, res) {
    try {
      const { id } = req.params;
      const {
        title,
        categoryId,
        documentType,
        accessLevel,
        keywords,
        reviewFrequencyMonths,
        status
      } = req.body;

      const document = await prisma.document.update({
        where: { id: parseInt(id) },
        data: {
          title,
          categoryId: categoryId ? parseInt(categoryId) : undefined,
          documentType,
          accessLevel,
          keywords,
          reviewFrequencyMonths,
          status
        },
        include: {
          category: true,
          currentRevision: true
        }
      });

      res.json({
        success: true,
        data: document,
        message: 'Doküman başarıyla güncellendi'
      });
    } catch (error) {
      console.error('Update document error:', error);
      res.status(500).json({
        success: false,
        error: 'Doküman güncellenemedi'
      });
    }
  },

  // Create new revision
  async createRevision(req, res) {
    try {
      const { documentId } = req.params;
      const {
        revisionNumber,
        contentType,
        contentText,
        changeDescription
      } = req.body;

      const userId = req.user?.id || 1; // Mock user ID for testing

      const revision = await prisma.documentRevision.create({
        data: {
          documentId: parseInt(documentId),
          revisionNumber,
          contentType: contentType || 'text',
          contentText,
          changeDescription,
          preparedByUserId: userId,
          preparationDate: new Date()
        },
        include: {
          preparedBy: {
            select: { id: true, username: true, fullName: true }
          }
        }
      });

      res.status(201).json({
        success: true,
        data: revision,
        message: 'Revizyon başarıyla oluşturuldu'
      });
    } catch (error) {
      console.error('Create revision error:', error);
      res.status(500).json({
        success: false,
        error: 'Revizyon oluşturulamadı'
      });
    }
  },

  // Approve revision
  async approveRevision(req, res) {
    try {
      const { revisionId } = req.params;
      const { approvalComments } = req.body;
      const userId = req.user?.id || 1; // Mock user ID for testing

      const result = await prisma.$transaction(async (tx) => {
        // Update revision approval status
        const revision = await tx.documentRevision.update({
          where: { id: parseInt(revisionId) },
          data: {
            approvalStatus: 'approved',
            approvedByUserId: userId,
            approvalDate: new Date(),
            approvalComments,
            isActiveRevision: true
          }
        });

        // Deactivate other revisions
        await tx.documentRevision.updateMany({
          where: {
            documentId: revision.documentId,
            id: { not: revision.id }
          },
          data: { isActiveRevision: false }
        });

        // Update document
        await tx.document.update({
          where: { id: revision.documentId },
          data: {
            currentRevisionId: revision.id,
            status: 'published',
            publicationDate: new Date(),
            nextReviewDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // 1 year
          }
        });

        return revision;
      });

      res.json({
        success: true,
        data: result,
        message: 'Revizyon başarıyla onaylandı'
      });
    } catch (error) {
      console.error('Approve revision error:', error);
      res.status(500).json({
        success: false,
        error: 'Revizyon onaylanamadı'
      });
    }
  },

  // Download document
  async downloadDocument(req, res) {
    try {
      const { revisionId } = req.params;
      const userId = req.user?.id || 1; // Mock user ID for testing

      const revision = await prisma.documentRevision.findUnique({
        where: { id: parseInt(revisionId) },
        include: {
          document: true
        }
      });

      if (!revision) {
        return res.status(404).json({
          success: false,
          error: 'Revizyon bulunamadı'
        });
      }

      // Log access
      await prisma.documentAccessLog.create({
        data: {
          documentId: revision.documentId,
          revisionId: revision.id,
          userId,
          action: 'download',
          ipAddress: req.ip,
          userAgent: req.get('user-agent')
        }
      });

      // Increment download count
      await prisma.documentRevision.update({
        where: { id: revision.id },
        data: { downloadCount: { increment: 1 } }
      });

      // For text content, create a simple text file
      if (revision.contentType === 'text') {
        res.setHeader('Content-Type', 'text/plain; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="${revision.document.documentCode}_v${revision.revisionNumber}.txt"`);
        res.send(revision.contentText);
      } else {
        // For file content, this would handle file download
        res.status(501).json({
          success: false,
          error: 'Dosya indirme henüz implemente edilmedi'
        });
      }
    } catch (error) {
      console.error('Download document error:', error);
      res.status(500).json({
        success: false,
        error: 'Doküman indirilemedi'
      });
    }
  },

  // Get document access logs
  async getAccessLogs(req, res) {
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
        error: 'Erişim kayıtları getirilemedi'
      });
    }
  }
};

module.exports = documentController;