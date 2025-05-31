const { z } = require('zod');

// CAPA Record validation schemas
const capaValidation = {
  // Create new CAPA record
  createCapa: z.object({
    body: z.object({
      capaNumber: z.string().min(1, 'CAPA numarası gereklidir').max(50),
      capaType: z.enum(['CORRECTIVE', 'PREVENTIVE'], {
        errorMap: () => ({ message: 'CAPA türü Düzeltici veya Önleyici olmalıdır' })
      }),
      title: z.string().min(1, 'Başlık gereklidir').max(255),
      description: z.string().min(10, 'Açıklama en az 10 karakter olmalıdır'),
      sourceId: z.number().int().positive('Geçerli bir kaynak ID gereklidir'),
      sourceReference: z.string().max(100).optional(),
      detectedDate: z.string().datetime('Geçerli bir tespit tarihi gereklidir'),
      targetCompletionDate: z.string().datetime('Geçerli bir hedef tamamlanma tarihi gereklidir'),
      detectedByUserId: z.number().int().positive('Tespit eden kullanıcı ID gereklidir'),
      responsibleUserId: z.number().int().positive('Sorumlu kullanıcı ID gereklidir'),
      priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).default('MEDIUM'),
      rootCauseAnalysis: z.string().optional(),
      proposedActions: z.string().optional(),
      costEstimate: z.number().min(0).optional(),
      recurrencePrevention: z.string().optional()
    })
  }),

  // Update CAPA record
  updateCapa: z.object({
    params: z.object({
      id: z.string().transform(val => parseInt(val))
    }),
    body: z.object({
      title: z.string().min(1).max(255).optional(),
      description: z.string().min(10).optional(),
      targetCompletionDate: z.string().datetime().optional(),
      actualCompletionDate: z.string().datetime().optional(),
      responsibleUserId: z.number().int().positive().optional(),
      priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).optional(),
      status: z.enum(['OPEN', 'IN_PROGRESS', 'PENDING_VERIFICATION', 'CLOSED', 'CANCELLED']).optional(),
      rootCauseAnalysis: z.string().optional(),
      proposedActions: z.string().optional(),
      costEstimate: z.number().min(0).optional(),
      actualCost: z.number().min(0).optional(),
      recurrencePrevention: z.string().optional(),
      lessonsLearned: z.string().optional(),
      effectivenessVerified: z.boolean().optional(),
      verificationComments: z.string().optional(),
      verifiedByUserId: z.number().int().positive().optional(),
      effectivenessCheckDate: z.string().datetime().optional()
    })
  }),

  // Get CAPA by ID
  getCapaById: z.object({
    params: z.object({
      id: z.string().transform(val => parseInt(val))
    })
  }),

  // CAPA Action Item validation schemas
  createActionItem: z.object({
    body: z.object({
      capaId: z.number().int().positive('Geçerli bir CAPA ID gereklidir'),
      actionDescription: z.string().min(1, 'Faaliyet açıklaması gereklidir'),
      assignedToUserId: z.number().int().positive('Atanan kullanıcı ID gereklidir'),
      dueDate: z.string().datetime('Geçerli bir son tarih gereklidir'),
      status: z.enum(['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']).default('PENDING')
    })
  }),

  updateActionItem: z.object({
    params: z.object({
      id: z.string().transform(val => parseInt(val))
    }),
    body: z.object({
      actionDescription: z.string().min(1).optional(),
      assignedToUserId: z.number().int().positive().optional(),
      dueDate: z.string().datetime().optional(),
      completionDate: z.string().datetime().optional(),
      status: z.enum(['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']).optional(),
      completionNotes: z.string().optional()
    })
  }),

  // CAPA Document validation schemas
  uploadDocument: z.object({
    body: z.object({
      capaId: z.number().int().positive('Geçerli bir CAPA ID gereklidir'),
      documentType: z.string().min(1, 'Doküman türü gereklidir').max(100),
      documentName: z.string().min(1, 'Doküman adı gereklidir').max(255)
    })
  }),

  // Query parameters for listing CAPAs
  listCapas: z.object({
    query: z.object({
      page: z.string().transform(val => parseInt(val) || 1),
      limit: z.string().transform(val => Math.min(parseInt(val) || 10, 100)),
      status: z.enum(['OPEN', 'IN_PROGRESS', 'PENDING_VERIFICATION', 'CLOSED', 'CANCELLED']).optional(),
      capaType: z.enum(['CORRECTIVE', 'PREVENTIVE']).optional(),
      priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).optional(),
      responsibleUserId: z.string().transform(val => parseInt(val)).optional(),
      sourceId: z.string().transform(val => parseInt(val)).optional(),
      dateFrom: z.string().datetime().optional(),
      dateTo: z.string().datetime().optional(),
      search: z.string().optional()
    })
  }),

  // Verification schemas
  verifyEffectiveness: z.object({
    params: z.object({
      id: z.string().transform(val => parseInt(val))
    }),
    body: z.object({
      effectivenessVerified: z.boolean(),
      verificationComments: z.string().min(1, 'Doğrulama yorumu gereklidir'),
      effectivenessCheckDate: z.string().datetime('Geçerli bir doğrulama tarihi gereklidir')
    })
  }),

  // Close CAPA
  closeCapa: z.object({
    params: z.object({
      id: z.string().transform(val => parseInt(val))
    }),
    body: z.object({
      lessonsLearned: z.string().optional(),
      actualCost: z.number().min(0).optional()
    })
  })
};

module.exports = capaValidation;