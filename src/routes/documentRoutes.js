const express = require('express');
const multer = require('multer');
const documentController = require('../controllers/documentController');
const authMiddleware = require('../middlewares/authAdmin');
const { uploadLimiter } = require('../middlewares/rateLimiter');

const router = express.Router();

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Tipo de arquivo não permitido.'), false);
    }
  },
});

// Document routes
router.get('/api/documents', authMiddleware, documentController.getDocuments);
router.post(
  '/api/documents/upload',
  uploadLimiter,
  authMiddleware,
  upload.single('file'),
  documentController.uploadDocument
);
router.get('/api/documents/:id/download', authMiddleware, documentController.downloadDocument);
router.delete('/api/documents/:id', authMiddleware, documentController.deleteDocument);

// Error handler for multer
router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ status: 'error', message: 'Arquivo muito grande (máx. 10MB).' });
    }
  }
  if (error.message === 'Tipo de arquivo não permitido.') {
    return res.status(400).json({ status: 'error', message: error.message });
  }
  next(error);
});

module.exports = router;


