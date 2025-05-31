const { PrismaClient } = require('@prisma/client');
const path = require('path');
const fs = require('fs').promises;

const prisma = new PrismaClient();

const capaController = {
  // Get all CAPA records with filtering and pagination
  async getAllCapas(req, res) {
    try {
      const {
        page,
        limit,
        status,
        capaType,
        priority,
        responsibleUserId,
        sourceId,
        dateFrom,
        dateTo,
        search
      } = req.query;

      const skip = (page - 1) * limit;
      
      // Build where clause
      const where = {};
      
      if (status) where.status = status;
      if (capaType) where.capaType = capaType;
      if (priority) where.priority = priority;
      if (responsibleUserId) where.responsibleUserId = responsibleUserId;
      if (sourceId) where.sourceId = sourceId;
      
      if (dateFrom || dateTo) {
        where.detectedDate = {};
        if (dateFrom) where.detectedDate.gte = new Date(dateFrom);
        if (dateTo) where.detectedDate.lte = new Date(dateTo);
      }
      
      if (search) {
        where.OR = [
          { capaNumber: { contains: search, mode: 'insensitive' } },
          { title: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } }
        ];
      }

      const [capas, total] = await Promise.all([
        prisma.capaRecord.findMany({
          where,
          skip,
          take: limit,
          include: {
            detectedByUser: { select: { id: true, firstName: true, lastName: true } },
            responsibleUser: { select: { id: true, firstName: true, lastName: true } },
            verifiedByUser: { select: { id: true, firstName: true, lastName: true } },
            source: true,
            actionItems: {
              include: {
                assignedToUser: { select: { id: true, firstName: true, lastName: true } }
              },
              orderBy: { createdAt: 'desc' }
            },
            documents: {
              include: {
                uploadedByUser: { select: { id: true, firstName: true, lastName: true } }
              },
              orderBy: { uploadedAt: 'desc' }
            }
          },
          orderBy: { createdAt: 'desc' }
        }),
        prisma.capaRecord.count({ where })
      ]);

      res.json({
        success: true,
        data: {
          capas,
          pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit)
          }
        }
      });
    } catch (error) {
      console.error('Get CAPAs error:', error);
      res.status(500).json({
        success: false,
        error: 'CAPA kayıtları getirilemedi'
      });
    }
  },

  // Get CAPA by ID
  async getCapaById(req, res) {
    try {
      const { id } = req.params;

      const capa = await prisma.capaRecord.findUnique({
        where: { id },
        include: {
          detectedByUser: { select: { id: true, firstName: true, lastName: true, email: true } },
          responsibleUser: { select: { id: true, firstName: true, lastName: true, email: true } },
          verifiedByUser: { select: { id: true, firstName: true, lastName: true, email: true } },
          source: true,
          actionItems: {
            include: {
              assignedToUser: { select: { id: true, firstName: true, lastName: true, email: true } }
            },
            orderBy: { createdAt: 'asc' }
          },
          documents: {
            include: {
              uploadedByUser: { select: { id: true, firstName: true, lastName: true } }
            },
            orderBy: { uploadedAt: 'desc' }
          }
        }
      });

      if (!capa) {
        return res.status(404).json({
          success: false,
          error: 'CAPA kaydı bulunamadı'
        });
      }

      res.json({
        success: true,
        data: capa
      });
    } catch (error) {
      console.error('Get CAPA by ID error:', error);
      res.status(500).json({
        success: false,
        error: 'CAPA kaydı getirilemedi'
      });
    }
  },

  // Create new CAPA record
  async createCapa(req, res) {
    try {
      const {
        capaNumber,
        capaType,
        title,
        description,
        sourceId,
        sourceReference,
        detectedDate,
        targetCompletionDate,
        detectedByUserId,
        responsibleUserId,
        priority,
        rootCauseAnalysis,
        proposedActions,
        costEstimate,
        recurrencePrevention
      } = req.body;

      // Check if CAPA number already exists
      const existingCapa = await prisma.capaRecord.findUnique({
        where: { capaNumber }
      });

      if (existingCapa) {
        return res.status(400).json({
          success: false,
          error: 'Bu CAPA numarası zaten kullanılmaktadır'
        });
      }

      const capa = await prisma.capaRecord.create({
        data: {
          capaNumber,
          capaType,
          title,
          description,
          sourceId,
          sourceReference,
          detectedDate: new Date(detectedDate),
          targetCompletionDate: new Date(targetCompletionDate),
          detectedByUserId,
          responsibleUserId,
          priority,
          rootCauseAnalysis,
          proposedActions,
          costEstimate,
          recurrencePrevention,
          status: 'OPEN'
        },
        include: {
          detectedByUser: { select: { id: true, firstName: true, lastName: true } },
          responsibleUser: { select: { id: true, firstName: true, lastName: true } },
          source: true
        }
      });

      res.status(201).json({
        success: true,
        message: 'CAPA kaydı başarıyla oluşturuldu',
        data: capa
      });
    } catch (error) {
      console.error('Create CAPA error:', error);
      res.status(500).json({
        success: false,
        error: 'CAPA kaydı oluşturulamadı'
      });
    }
  },

  // Update CAPA record
  async updateCapa(req, res) {
    try {
      const { id } = req.params;
      const updateData = { ...req.body };

      // Convert date fields
      if (updateData.targetCompletionDate) {
        updateData.targetCompletionDate = new Date(updateData.targetCompletionDate);
      }
      if (updateData.actualCompletionDate) {
        updateData.actualCompletionDate = new Date(updateData.actualCompletionDate);
      }
      if (updateData.effectivenessCheckDate) {
        updateData.effectivenessCheckDate = new Date(updateData.effectivenessCheckDate);
      }

      const capa = await prisma.capaRecord.update({
        where: { id },
        data: {
          ...updateData,
          updatedAt: new Date()
        },
        include: {
          detectedByUser: { select: { id: true, firstName: true, lastName: true } },
          responsibleUser: { select: { id: true, firstName: true, lastName: true } },
          verifiedByUser: { select: { id: true, firstName: true, lastName: true } },
          source: true
        }
      });

      res.json({
        success: true,
        message: 'CAPA kaydı başarıyla güncellendi',
        data: capa
      });
    } catch (error) {
      console.error('Update CAPA error:', error);
      if (error.code === 'P2025') {
        return res.status(404).json({
          success: false,
          error: 'CAPA kaydı bulunamadı'
        });
      }
      res.status(500).json({
        success: false,
        error: 'CAPA kaydı güncellenemedi'
      });
    }
  },

  // Verify CAPA effectiveness
  async verifyEffectiveness(req, res) {
    try {
      const { id } = req.params;
      const { effectivenessVerified, verificationComments, effectivenessCheckDate } = req.body;
      const verifiedByUserId = req.user.id;

      const capa = await prisma.capaRecord.update({
        where: { id },
        data: {
          effectivenessVerified,
          verificationComments,
          effectivenessCheckDate: new Date(effectivenessCheckDate),
          verifiedByUserId,
          status: effectivenessVerified ? 'PENDING_VERIFICATION' : 'IN_PROGRESS',
          updatedAt: new Date()
        },
        include: {
          verifiedByUser: { select: { id: true, firstName: true, lastName: true } }
        }
      });

      res.json({
        success: true,
        message: 'CAPA etkinlik doğrulaması başarıyla kaydedildi',
        data: capa
      });
    } catch (error) {
      console.error('Verify CAPA effectiveness error:', error);
      if (error.code === 'P2025') {
        return res.status(404).json({
          success: false,
          error: 'CAPA kaydı bulunamadı'
        });
      }
      res.status(500).json({
        success: false,
        error: 'CAPA etkinlik doğrulaması kaydedilemedi'
      });
    }
  },

  // Close CAPA record
  async closeCapa(req, res) {
    try {
      const { id } = req.params;
      const { lessonsLearned, actualCost } = req.body;

      // Check if all action items are completed
      const incompleteActions = await prisma.capaActionItem.count({
        where: {
          capaId: id,
          status: { notIn: ['COMPLETED', 'CANCELLED'] }
        }
      });

      if (incompleteActions > 0) {
        return res.status(400).json({
          success: false,
          error: 'Tüm faaliyet maddeleri tamamlanmadan CAPA kapatılamaz'
        });
      }

      const capa = await prisma.capaRecord.update({
        where: { id },
        data: {
          status: 'CLOSED',
          actualCompletionDate: new Date(),
          lessonsLearned,
          actualCost,
          updatedAt: new Date()
        }
      });

      res.json({
        success: true,
        message: 'CAPA kaydı başarıyla kapatıldı',
        data: capa
      });
    } catch (error) {
      console.error('Close CAPA error:', error);
      if (error.code === 'P2025') {
        return res.status(404).json({
          success: false,
          error: 'CAPA kaydı bulunamadı'
        });
      }
      res.status(500).json({
        success: false,
        error: 'CAPA kaydı kapatılamadı'
      });
    }
  },

  // CAPA Action Items Controllers
  async createActionItem(req, res) {
    try {
      const { capaId, actionDescription, assignedToUserId, dueDate, status } = req.body;

      const actionItem = await prisma.capaActionItem.create({
        data: {
          capaId,
          actionDescription,
          assignedToUserId,
          dueDate: new Date(dueDate),
          status
        },
        include: {
          assignedToUser: { select: { id: true, firstName: true, lastName: true } }
        }
      });

      res.status(201).json({
        success: true,
        message: 'Faaliyet maddesi başarıyla oluşturuldu',
        data: actionItem
      });
    } catch (error) {
      console.error('Create action item error:', error);
      res.status(500).json({
        success: false,
        error: 'Faaliyet maddesi oluşturulamadı'
      });
    }
  },

  async updateActionItem(req, res) {
    try {
      const { id } = req.params;
      const updateData = { ...req.body };

      if (updateData.dueDate) {
        updateData.dueDate = new Date(updateData.dueDate);
      }
      if (updateData.completionDate) {
        updateData.completionDate = new Date(updateData.completionDate);
      }

      const actionItem = await prisma.capaActionItem.update({
        where: { id },
        data: {
          ...updateData,
          updatedAt: new Date()
        },
        include: {
          assignedToUser: { select: { id: true, firstName: true, lastName: true } }
        }
      });

      res.json({
        success: true,
        message: 'Faaliyet maddesi başarıyla güncellendi',
        data: actionItem
      });
    } catch (error) {
      console.error('Update action item error:', error);
      if (error.code === 'P2025') {
        return res.status(404).json({
          success: false,
          error: 'Faaliyet maddesi bulunamadı'
        });
      }
      res.status(500).json({
        success: false,
        error: 'Faaliyet maddesi güncellenemedi'
      });
    }
  },

  // Upload document to CAPA
  async uploadDocument(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: 'Dosya yüklenmedi'
        });
      }

      const { capaId, documentType, documentName } = req.body;
      const uploadedByUserId = req.user.id;

      const document = await prisma.capaDocument.create({
        data: {
          capaId: parseInt(capaId),
          documentType,
          documentName,
          filePath: req.file.path,
          uploadedByUserId,
          uploadedAt: new Date()
        },
        include: {
          uploadedByUser: { select: { id: true, firstName: true, lastName: true } }
        }
      });

      res.status(201).json({
        success: true,
        message: 'Doküman başarıyla yüklendi',
        data: document
      });
    } catch (error) {
      console.error('Upload CAPA document error:', error);
      res.status(500).json({
        success: false,
        error: 'Doküman yüklenemedi'
      });
    }
  },

  // Get CAPA statistics
  async getCapaStatistics(req, res) {
    try {
      const [
        totalCapas,
        openCapas,
        inProgressCapas,
        closedCapas,
        overdueCapas,
        correctiveActions,
        preventiveActions
      ] = await Promise.all([
        prisma.capaRecord.count(),
        prisma.capaRecord.count({ where: { status: 'OPEN' } }),
        prisma.capaRecord.count({ where: { status: 'IN_PROGRESS' } }),
        prisma.capaRecord.count({ where: { status: 'CLOSED' } }),
        prisma.capaRecord.count({
          where: {
            targetCompletionDate: { lt: new Date() },
            status: { notIn: ['CLOSED', 'CANCELLED'] }
          }
        }),
        prisma.capaRecord.count({ where: { capaType: 'CORRECTIVE' } }),
        prisma.capaRecord.count({ where: { capaType: 'PREVENTIVE' } })
      ]);

      res.json({
        success: true,
        data: {
          totalCapas,
          openCapas,
          inProgressCapas,
          closedCapas,
          overdueCapas,
          correctiveActions,
          preventiveActions,
          completionRate: totalCapas > 0 ? ((closedCapas / totalCapas) * 100).toFixed(2) : 0
        }
      });
    } catch (error) {
      console.error('Get CAPA statistics error:', error);
      res.status(500).json({
        success: false,
        error: 'CAPA istatistikleri getirilemedi'
      });
    }
  },

  // Get nonconformity sources
  async getNonconformitySources(req, res) {
    try {
      const sources = await prisma.nonconformitySource.findMany({
        where: { isActive: true },
        orderBy: { sourceName: 'asc' }
      });

      res.json({
        success: true,
        data: sources
      });
    } catch (error) {
      console.error('Get nonconformity sources error:', error);
      res.status(500).json({
        success: false,
        error: 'Uygunsuzluk kaynakları getirilemedi'
      });
    }
  }
};

module.exports = capaController;