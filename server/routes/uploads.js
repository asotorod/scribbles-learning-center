const express = require('express');
const multer = require('multer');
const { body } = require('express-validator');
const { verifyToken, requireRole } = require('../middleware/auth');
const uploadController = require('../controllers/uploadController');
const { ALLOWED_IMAGE_TYPES, MAX_FILE_SIZE } = require('../services/uploadService');

const router = express.Router();

// Multer config: store files in memory (buffer) for S3 upload
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_FILE_SIZE,
  },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_IMAGE_TYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Invalid file type. Allowed: ${ALLOWED_IMAGE_TYPES.join(', ')}`), false);
    }
  },
});

// Multer error handler middleware
const handleMulterError = (err, _req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        error: `File too large. Maximum size is ${MAX_FILE_SIZE / (1024 * 1024)}MB`,
      });
    }
    return res.status(400).json({
      success: false,
      error: err.message,
    });
  }
  if (err) {
    return res.status(400).json({
      success: false,
      error: err.message,
    });
  }
  next();
};

// POST /api/v1/uploads/image - Upload a single image (admin only)
router.post(
  '/image',
  verifyToken,
  requireRole('super_admin', 'admin'),
  upload.single('file'),
  handleMulterError,
  uploadController.uploadImage
);

// DELETE /api/v1/uploads - Delete an uploaded file (admin only)
router.delete(
  '/',
  verifyToken,
  requireRole('super_admin', 'admin'),
  [
    body('url')
      .notEmpty()
      .withMessage('URL is required')
      .isURL()
      .withMessage('Must be a valid URL'),
  ],
  uploadController.deleteImage
);

// ============================================
// TEST / DIAGNOSTIC ENDPOINTS (no auth)
// ============================================

// GET /health - Verify S3 credentials and bucket access
router.get('/health', uploadController.s3Health);

// POST /test - Upload a file to S3 test/ folder and return the URL
router.post(
  '/test',
  upload.single('file'),
  handleMulterError,
  uploadController.testUpload
);

module.exports = router;
