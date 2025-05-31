const express = require('express');
const documentController = require('./controller');
const documentValidation = require('./validation');

const router = express.Router();

// Category routes
router.get('/categories', documentController.getCategories);
router.post('/categories', documentValidation.validateCategory, documentController.createCategory);

// Document routes
router.get('/documents', documentController.getDocuments);
router.get('/documents/:id', documentController.getDocument);
router.post('/documents', documentValidation.validateDocument, documentController.createDocument);
router.put('/documents/:id', documentValidation.validateDocumentUpdate, documentController.updateDocument);

// Revision routes
router.post('/documents/:documentId/revisions', documentValidation.validateRevision, documentController.createRevision);
router.post('/revisions/:revisionId/approve', documentValidation.validateApproval, documentController.approveRevision);
router.get('/revisions/:revisionId/download', documentController.downloadDocument);

// Access logs
router.get('/documents/:documentId/access-logs', documentController.getAccessLogs);

module.exports = router;