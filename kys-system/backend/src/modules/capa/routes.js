const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const capaController = require('./controller');
const capaValidation = require('./validation');
const { validateRequest } = require('../../middleware/validation');
const { authenticateToken } = require('../../middleware/auth');

const router = express.Router();

// Ensure upload directory exists
const uploadDir = path.join(__dirname, '../../../../uploads/capa');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer configuration for CAPA documents
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'capa-document-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  // Allow common document formats
  const allowedMimes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain',
    'image/jpeg',
    'image/png',
    'image/gif'
  ];

  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Desteklenmeyen dosya formatı'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

// Apply authentication middleware to all routes
router.use(authenticateToken);

// CAPA Record Routes
router.get('/statistics', capaController.getCapaStatistics);
router.get('/sources', capaController.getNonconformitySources);

router.get('/', 
  validateRequest(capaValidation.listCapas), 
  capaController.getAllCapas
);

router.get('/:id', 
  validateRequest(capaValidation.getCapaById), 
  capaController.getCapaById
);

router.post('/', 
  validateRequest(capaValidation.createCapa), 
  capaController.createCapa
);

router.put('/:id', 
  validateRequest(capaValidation.updateCapa), 
  capaController.updateCapa
);

router.post('/:id/verify', 
  validateRequest(capaValidation.verifyEffectiveness), 
  capaController.verifyEffectiveness
);

router.post('/:id/close', 
  validateRequest(capaValidation.closeCapa), 
  capaController.closeCapa
);

// CAPA Action Item Routes
router.post('/action-items', 
  validateRequest(capaValidation.createActionItem), 
  capaController.createActionItem
);

router.put('/action-items/:id', 
  validateRequest(capaValidation.updateActionItem), 
  capaController.updateActionItem
);

// CAPA Document Routes
router.post('/documents', 
  upload.single('document'),
  validateRequest(capaValidation.uploadDocument),
  capaController.uploadDocument
);

// Download CAPA document
router.get('/documents/:id/download', async (req, res) => {
  try {
    const { id } = req.params;
    
    const document = await prisma.capaDocument.findUnique({
      where: { id: parseInt(id) }
    });

    if (!document) {
      return res.status(404).json({
        success: false,
        error: 'Doküman bulunamadı'
      });
    }

    // Check if file exists
    if (!fs.existsSync(document.filePath)) {
      return res.status(404).json({
        success: false,
        error: 'Dosya bulunamadı'
      });
    }

    // Set appropriate headers
    res.setHeader('Content-Disposition', `attachment; filename="${document.documentName}"`);
    res.setHeader('Content-Type', 'application/octet-stream');

    // Stream the file
    const fileStream = fs.createReadStream(document.filePath);
    fileStream.pipe(res);
  } catch (error) {
    console.error('Download CAPA document error:', error);
    res.status(500).json({
      success: false,
      error: 'Doküman indirilemedi'
    });
  }
});

// View CAPA document
router.get('/documents/:id/view', async (req, res) => {
  try {
    const { id } = req.params;
    
    const document = await prisma.capaDocument.findUnique({
      where: { id: parseInt(id) }
    });

    if (!document) {
      return res.status(404).json({
        success: false,
        error: 'Doküman bulunamadı'
      });
    }

    // Check if file exists
    if (!fs.existsSync(document.filePath)) {
      return res.status(404).json({
        success: false,
        error: 'Dosya bulunamadı'
      });
    }

    // Determine content type based on file extension
    const ext = path.extname(document.filePath).toLowerCase();
    let contentType = 'application/octet-stream';
    
    const mimeTypes = {
      '.pdf': 'application/pdf',
      '.txt': 'text/plain',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif'
    };
    
    if (mimeTypes[ext]) {
      contentType = mimeTypes[ext];
    }

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', 'inline');

    const fileStream = fs.createReadStream(document.filePath);
    fileStream.pipe(res);
  } catch (error) {
    console.error('View CAPA document error:', error);
    res.status(500).json({
      success: false,
      error: 'Doküman görüntülenemedi'
    });
  }
});

// Error handling middleware for multer
router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        error: 'Dosya boyutu çok büyük (maksimum 10MB)'
      });
    }
  }
  
  if (error.message === 'Desteklenmeyen dosya formatı') {
    return res.status(400).json({
      success: false,
      error: error.message
    });
  }
  
  next(error);
});

module.exports = router;