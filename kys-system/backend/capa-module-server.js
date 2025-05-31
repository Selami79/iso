const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const app = express();
const prisma = new PrismaClient();
const PORT = 3005;

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'KYS CAPA Module API',
    timestamp: new Date().toISOString()
  });
});

// ========== NONCONFORMITY SOURCES ==========

// Get all nonconformity sources
app.get('/api/v1/nonconformity-sources', async (req, res) => {
  try {
    const sources = await prisma.nonconformitySources.findMany({
      where: { is_active: true },
      orderBy: { source_name: 'asc' }
    });

    res.json({
      success: true,
      data: sources
    });
  } catch (error) {
    console.error('Get sources error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ========== CAPA RECORDS ==========

// Get CAPA statistics
app.get('/api/v1/capa/stats', async (req, res) => {
  try {
    const [total, byStatus, byType, overdue] = await Promise.all([
      prisma.capaRecords.count(),
      prisma.capaRecords.groupBy({
        by: ['status'],
        _count: true
      }),
      prisma.capaRecords.groupBy({
        by: ['capa_type'],
        _count: true
      }),
      prisma.capaRecords.count({
        where: {
          status: { notIn: ['CLOSED', 'CANCELLED'] },
          target_completion_date: {
            lt: new Date()
          }
        }
      })
    ]);

    res.json({
      success: true,
      data: {
        total,
        byStatus,
        byType,
        overdue
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

// Get next CAPA number
app.get('/api/v1/capa/next-number', async (req, res) => {
  try {
    const year = new Date().getFullYear();
    const prefix = `CAPA-${year}`;
    
    const lastCapa = await prisma.capaRecords.findFirst({
      where: {
        capa_number: {
          startsWith: prefix
        }
      },
      orderBy: {
        capa_number: 'desc'
      }
    });
    
    let nextNumber = 1;
    if (lastCapa) {
      const lastNumber = parseInt(lastCapa.capa_number.split('-')[2]);
      nextNumber = lastNumber + 1;
    }
    
    const nextCapaNumber = `${prefix}-${nextNumber.toString().padStart(3, '0')}`;
    
    res.json({
      success: true,
      data: {
        nextNumber: nextCapaNumber,
        year,
        sequence: nextNumber
      }
    });
  } catch (error) {
    console.error('Get next number error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get all CAPA records
app.get('/api/v1/capa', async (req, res) => {
  try {
    const { 
      status, 
      capa_type,
      priority,
      search,
      page = 1,
      limit = 20 
    } = req.query;

    const where = {};
    
    if (status) where.status = status;
    if (capa_type) where.capa_type = capa_type;
    if (priority) where.priority = priority;
    if (search) {
      where.OR = [
        { capa_number: { contains: search, mode: 'insensitive' } },
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ];
    }

    const skip = (page - 1) * limit;

    const [records, total] = await Promise.all([
      prisma.capaRecords.findMany({
        where,
        include: {
          users_capa_records_detected_by_user_idTousers: {
            select: { id: true, username: true, fullName: true }
          },
          users_capa_records_responsible_user_idTousers: {
            select: { id: true, username: true, fullName: true }
          },
          departments: {
            select: { id: true, departmentName: true }
          },
          nonconformity_sources: {
            select: { id: true, source_name: true }
          },
          _count: {
            select: { 
              capa_action_items: true,
              capa_documents: true 
            }
          }
        },
        skip,
        take: parseInt(limit),
        orderBy: { created_at: 'desc' }
      }),
      prisma.capaRecords.count({ where })
    ]);

    res.json({
      success: true,
      data: records.map(record => ({
        id: record.id,
        capaNumber: record.capa_number,
        capaType: record.capa_type,
        title: record.title,
        description: record.description,
        sourceId: record.source_id,
        sourceName: record.nonconformity_sources?.source_name,
        sourceReference: record.source_reference,
        detectedDate: record.detected_date,
        detectedBy: record.users_capa_records_detected_by_user_idTousers,
        responsibleUser: record.users_capa_records_responsible_user_idTousers,
        department: record.departments,
        priority: record.priority,
        status: record.status,
        targetCompletionDate: record.target_completion_date,
        actualCompletionDate: record.actual_completion_date,
        effectivenessCheckDate: record.effectiveness_check_date,
        effectivenessVerified: record.effectiveness_verified,
        actionItemCount: record._count.capa_action_items,
        documentCount: record._count.capa_documents,
        createdAt: record.created_at
      })),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get CAPA records error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get single CAPA record
app.get('/api/v1/capa/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const record = await prisma.capaRecords.findUnique({
      where: { id: parseInt(id) },
      include: {
        users_capa_records_detected_by_user_idTousers: {
          select: { id: true, username: true, fullName: true }
        },
        users_capa_records_responsible_user_idTousers: {
          select: { id: true, username: true, fullName: true }
        },
        users_capa_records_verified_by_user_idTousers: {
          select: { id: true, username: true, fullName: true }
        },
        departments: {
          select: { id: true, departmentName: true }
        },
        nonconformity_sources: {
          select: { id: true, source_name: true }
        },
        capa_action_items: {
          include: {
            users: {
              select: { id: true, username: true, fullName: true }
            }
          },
          orderBy: { due_date: 'asc' }
        },
        capa_documents: {
          include: {
            users: {
              select: { id: true, username: true, fullName: true }
            }
          },
          orderBy: { uploaded_at: 'desc' }
        }
      }
    });

    if (!record) {
      return res.status(404).json({
        success: false,
        error: 'CAPA kaydı bulunamadı'
      });
    }

    res.json({
      success: true,
      data: {
        id: record.id,
        capaNumber: record.capa_number,
        capaType: record.capa_type,
        title: record.title,
        description: record.description,
        sourceId: record.source_id,
        sourceName: record.nonconformity_sources?.source_name,
        sourceReference: record.source_reference,
        detectedDate: record.detected_date,
        detectedBy: record.users_capa_records_detected_by_user_idTousers,
        responsibleUser: record.users_capa_records_responsible_user_idTousers,
        verifiedBy: record.users_capa_records_verified_by_user_idTousers,
        department: record.departments,
        priority: record.priority,
        status: record.status,
        rootCauseAnalysis: record.root_cause_analysis,
        proposedActions: record.proposed_actions,
        targetCompletionDate: record.target_completion_date,
        actualCompletionDate: record.actual_completion_date,
        effectivenessCheckDate: record.effectiveness_check_date,
        effectivenessVerified: record.effectiveness_verified,
        verificationComments: record.verification_comments,
        costEstimate: record.cost_estimate ? Number(record.cost_estimate) : null,
        actualCost: record.actual_cost ? Number(record.actual_cost) : null,
        recurrencePrevention: record.recurrence_prevention,
        lessonsLearned: record.lessons_learned,
        actionItems: record.capa_action_items.map(item => ({
          id: item.id,
          actionDescription: item.action_description,
          assignedTo: item.users,
          dueDate: item.due_date,
          completionDate: item.completion_date,
          status: item.status,
          completionNotes: item.completion_notes
        })),
        documents: record.capa_documents.map(doc => ({
          id: doc.id,
          documentType: doc.document_type,
          documentName: doc.document_name,
          filePath: doc.file_path,
          uploadedBy: doc.users,
          uploadedAt: doc.uploaded_at
        })),
        createdAt: record.created_at,
        updatedAt: record.updated_at
      }
    });
  } catch (error) {
    console.error('Get CAPA record error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Create CAPA record
app.post('/api/v1/capa', async (req, res) => {
  try {
    const {
      capaType,
      title,
      description,
      sourceId,
      sourceReference,
      detectedDate,
      responsibleUserId,
      departmentId,
      priority,
      rootCauseAnalysis,
      proposedActions,
      targetCompletionDate
    } = req.body;

    // Generate CAPA number
    const year = new Date().getFullYear();
    const prefix = `CAPA-${year}`;
    
    const lastCapa = await prisma.capaRecords.findFirst({
      where: {
        capa_number: {
          startsWith: prefix
        }
      },
      orderBy: {
        capa_number: 'desc'
      }
    });
    
    let nextNumber = 1;
    if (lastCapa) {
      const lastNumber = parseInt(lastCapa.capa_number.split('-')[2]);
      nextNumber = lastNumber + 1;
    }
    
    const capaNumber = `${prefix}-${nextNumber.toString().padStart(3, '0')}`;

    const record = await prisma.capaRecords.create({
      data: {
        capa_number: capaNumber,
        capa_type: capaType,
        title,
        description,
        source_id: sourceId || null,
        source_reference: sourceReference || null,
        detected_date: new Date(detectedDate),
        detected_by_user_id: 2, // Admin user ID
        responsible_user_id: responsibleUserId || 2,
        department_id: departmentId || null,
        priority: priority || 'MEDIUM',
        status: 'OPEN',
        root_cause_analysis: rootCauseAnalysis || null,
        proposed_actions: proposedActions || null,
        target_completion_date: targetCompletionDate ? new Date(targetCompletionDate) : null
      },
      include: {
        users_capa_records_detected_by_user_idTousers: {
          select: { id: true, username: true, fullName: true }
        },
        users_capa_records_responsible_user_idTousers: {
          select: { id: true, username: true, fullName: true }
        }
      }
    });

    res.status(201).json({
      success: true,
      data: {
        id: record.id,
        capaNumber: record.capa_number,
        capaType: record.capa_type,
        title: record.title,
        status: record.status,
        detectedBy: record.users_capa_records_detected_by_user_idTousers,
        responsibleUser: record.users_capa_records_responsible_user_idTousers,
        createdAt: record.created_at
      },
      message: 'CAPA kaydı başarıyla oluşturuldu'
    });
  } catch (error) {
    console.error('Create CAPA error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Update CAPA record
app.put('/api/v1/capa/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };

    // Convert date fields
    if (updateData.targetCompletionDate) {
      updateData.target_completion_date = new Date(updateData.targetCompletionDate);
      delete updateData.targetCompletionDate;
    }
    if (updateData.actualCompletionDate) {
      updateData.actual_completion_date = new Date(updateData.actualCompletionDate);
      delete updateData.actualCompletionDate;
    }
    if (updateData.effectivenessCheckDate) {
      updateData.effectiveness_check_date = new Date(updateData.effectivenessCheckDate);
      delete updateData.effectivenessCheckDate;
    }

    // Convert field names
    const fieldMapping = {
      capaType: 'capa_type',
      sourceId: 'source_id',
      sourceReference: 'source_reference',
      responsibleUserId: 'responsible_user_id',
      departmentId: 'department_id',
      rootCauseAnalysis: 'root_cause_analysis',
      proposedActions: 'proposed_actions',
      effectivenessVerified: 'effectiveness_verified',
      verificationComments: 'verification_comments',
      costEstimate: 'cost_estimate',
      actualCost: 'actual_cost',
      recurrencePrevention: 'recurrence_prevention',
      lessonsLearned: 'lessons_learned'
    };

    Object.keys(fieldMapping).forEach(key => {
      if (updateData[key] !== undefined) {
        updateData[fieldMapping[key]] = updateData[key];
        delete updateData[key];
      }
    });

    const record = await prisma.capaRecords.update({
      where: { id: parseInt(id) },
      data: updateData
    });

    res.json({
      success: true,
      data: record,
      message: 'CAPA kaydı başarıyla güncellendi'
    });
  } catch (error) {
    console.error('Update CAPA error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ========== CAPA ACTION ITEMS ==========

// Create action item
app.post('/api/v1/capa/:capaId/actions', async (req, res) => {
  try {
    const { capaId } = req.params;
    const {
      actionDescription,
      assignedToUserId,
      dueDate
    } = req.body;

    const actionItem = await prisma.capaActionItems.create({
      data: {
        capa_id: parseInt(capaId),
        action_description: actionDescription,
        assigned_to_user_id: assignedToUserId || 2,
        due_date: new Date(dueDate),
        status: 'PENDING'
      },
      include: {
        users: {
          select: { id: true, username: true, fullName: true }
        }
      }
    });

    res.status(201).json({
      success: true,
      data: {
        id: actionItem.id,
        actionDescription: actionItem.action_description,
        assignedTo: actionItem.users,
        dueDate: actionItem.due_date,
        status: actionItem.status
      },
      message: 'Faaliyet maddesi başarıyla oluşturuldu'
    });
  } catch (error) {
    console.error('Create action item error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Update action item
app.put('/api/v1/capa/actions/:actionId', async (req, res) => {
  try {
    const { actionId } = req.params;
    const {
      status,
      completionDate,
      completionNotes
    } = req.body;

    const updateData = {};
    if (status) updateData.status = status;
    if (completionDate) updateData.completion_date = new Date(completionDate);
    if (completionNotes !== undefined) updateData.completion_notes = completionNotes;

    const actionItem = await prisma.capaActionItems.update({
      where: { id: parseInt(actionId) },
      data: updateData
    });

    res.json({
      success: true,
      data: actionItem,
      message: 'Faaliyet maddesi başarıyla güncellendi'
    });
  } catch (error) {
    console.error('Update action item error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Verify effectiveness
app.post('/api/v1/capa/:capaId/verify', async (req, res) => {
  try {
    const { capaId } = req.params;
    const {
      effectivenessVerified,
      verificationComments
    } = req.body;

    const record = await prisma.capaRecords.update({
      where: { id: parseInt(capaId) },
      data: {
        effectiveness_verified: effectivenessVerified,
        verified_by_user_id: 2, // Admin user ID
        verification_comments: verificationComments,
        effectiveness_check_date: new Date(),
        status: effectivenessVerified ? 'CLOSED' : 'OPEN'
      }
    });

    res.json({
      success: true,
      data: {
        id: record.id,
        capaNumber: record.capa_number,
        effectivenessVerified: record.effectiveness_verified,
        status: record.status
      },
      message: effectivenessVerified ? 
        'CAPA etkinliği doğrulandı ve kapatıldı' : 
        'CAPA etkinliği doğrulanamadı, kayıt tekrar açıldı'
    });
  } catch (error) {
    console.error('Verify effectiveness error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

app.listen(PORT, () => {
  console.log(`📋 KYS CAPA Module API running on port ${PORT}`);
  console.log(`🏥 Health: http://localhost:${PORT}/health`);
  console.log(`\n📑 Endpoints:`);
  console.log(`   GET    /api/v1/nonconformity-sources`);
  console.log(`   GET    /api/v1/capa/stats`);
  console.log(`   GET    /api/v1/capa`);
  console.log(`   GET    /api/v1/capa/:id`);
  console.log(`   POST   /api/v1/capa`);
  console.log(`   PUT    /api/v1/capa/:id`);
  console.log(`   POST   /api/v1/capa/:capaId/actions`);
  console.log(`   PUT    /api/v1/capa/actions/:actionId`);
  console.log(`   POST   /api/v1/capa/:capaId/verify`);
});

process.on('SIGTERM', async () => {
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGINT', async () => {
  await prisma.$disconnect();
  process.exit(0);
});