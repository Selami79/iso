const documentValidation = {
  // Validate category creation
  validateCategory(req, res, next) {
    const { categoryName } = req.body;
    const errors = [];

    if (!categoryName || categoryName.trim().length === 0) {
      errors.push('Kategori adı zorunludur');
    } else if (categoryName.length > 150) {
      errors.push('Kategori adı 150 karakterden uzun olamaz');
    }

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        errors
      });
    }

    next();
  },

  // Validate document creation
  validateDocument(req, res, next) {
    const { documentCode, title, categoryId } = req.body;
    const errors = [];

    if (!documentCode || documentCode.trim().length === 0) {
      errors.push('Doküman kodu zorunludur');
    } else if (documentCode.length > 50) {
      errors.push('Doküman kodu 50 karakterden uzun olamaz');
    }

    if (!title || title.trim().length === 0) {
      errors.push('Doküman başlığı zorunludur');
    } else if (title.length > 255) {
      errors.push('Doküman başlığı 255 karakterden uzun olamaz');
    }

    if (!categoryId || isNaN(categoryId)) {
      errors.push('Geçerli bir kategori seçilmelidir');
    }

    // Validate document type if provided
    const validDocumentTypes = ['policy', 'procedure', 'work_instruction', 'form', 'record', 'external'];
    if (req.body.documentType && !validDocumentTypes.includes(req.body.documentType)) {
      errors.push('Geçersiz doküman tipi');
    }

    // Validate access level if provided
    const validAccessLevels = ['public', 'internal', 'restricted', 'confidential'];
    if (req.body.accessLevel && !validAccessLevels.includes(req.body.accessLevel)) {
      errors.push('Geçersiz erişim seviyesi');
    }

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        errors
      });
    }

    next();
  },

  // Validate document update
  validateDocumentUpdate(req, res, next) {
    const errors = [];

    // If title is provided, validate it
    if (req.body.title !== undefined) {
      if (req.body.title.trim().length === 0) {
        errors.push('Doküman başlığı boş olamaz');
      } else if (req.body.title.length > 255) {
        errors.push('Doküman başlığı 255 karakterden uzun olamaz');
      }
    }

    // If categoryId is provided, validate it
    if (req.body.categoryId !== undefined && isNaN(req.body.categoryId)) {
      errors.push('Geçerli bir kategori seçilmelidir');
    }

    // Validate document type if provided
    const validDocumentTypes = ['policy', 'procedure', 'work_instruction', 'form', 'record', 'external'];
    if (req.body.documentType && !validDocumentTypes.includes(req.body.documentType)) {
      errors.push('Geçersiz doküman tipi');
    }

    // Validate access level if provided
    const validAccessLevels = ['public', 'internal', 'restricted', 'confidential'];
    if (req.body.accessLevel && !validAccessLevels.includes(req.body.accessLevel)) {
      errors.push('Geçersiz erişim seviyesi');
    }

    // Validate status if provided
    const validStatuses = ['draft', 'pending_approval', 'approved', 'published', 'archived', 'obsolete'];
    if (req.body.status && !validStatuses.includes(req.body.status)) {
      errors.push('Geçersiz doküman durumu');
    }

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        errors
      });
    }

    next();
  },

  // Validate revision creation
  validateRevision(req, res, next) {
    const { revisionNumber, changeDescription } = req.body;
    const errors = [];

    if (!revisionNumber || revisionNumber.trim().length === 0) {
      errors.push('Revizyon numarası zorunludur');
    } else if (revisionNumber.length > 20) {
      errors.push('Revizyon numarası 20 karakterden uzun olamaz');
    }

    if (!changeDescription || changeDescription.trim().length === 0) {
      errors.push('Değişiklik açıklaması zorunludur');
    }

    // Validate content type if provided
    const validContentTypes = ['text', 'file', 'url'];
    if (req.body.contentType && !validContentTypes.includes(req.body.contentType)) {
      errors.push('Geçersiz içerik tipi');
    }

    // If content type is text, content text is required
    if (req.body.contentType === 'text' && (!req.body.contentText || req.body.contentText.trim().length === 0)) {
      errors.push('Metin içeriği zorunludur');
    }

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        errors
      });
    }

    next();
  },

  // Validate approval
  validateApproval(req, res, next) {
    // Approval comments are optional but if provided, validate length
    if (req.body.approvalComments && req.body.approvalComments.length > 1000) {
      return res.status(400).json({
        success: false,
        errors: ['Onay yorumu 1000 karakterden uzun olamaz']
      });
    }

    next();
  }
};

module.exports = documentValidation;