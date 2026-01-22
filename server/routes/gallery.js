const express = require('express');
const { body, param, query } = require('express-validator');
const { verifyToken, requireRole } = require('../middleware/auth');
const contentController = require('../controllers/contentController');

const router = express.Router();

// GET /api/v1/gallery - List images (public, filterable by category)
router.get('/', [
  query('category')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Category must not exceed 100 characters'),
  query('active')
    .optional()
    .isIn(['true', 'false'])
    .withMessage('Active must be true or false')
], contentController.getGalleryImages);

// POST /api/v1/gallery - Add image (admin)
router.post('/',
  verifyToken,
  requireRole('super_admin', 'admin'),
  [
    body('imageUrl')
      .notEmpty()
      .withMessage('Image URL is required')
      .isURL()
      .withMessage('Image URL must be a valid URL')
      .isLength({ max: 500 })
      .withMessage('Image URL must not exceed 500 characters'),
    body('thumbnailUrl')
      .optional()
      .isURL()
      .withMessage('Thumbnail URL must be a valid URL')
      .isLength({ max: 500 })
      .withMessage('Thumbnail URL must not exceed 500 characters'),
    body('captionEn')
      .optional()
      .isString()
      .trim()
      .isLength({ max: 500 })
      .withMessage('English caption must not exceed 500 characters'),
    body('captionEs')
      .optional()
      .isString()
      .trim()
      .isLength({ max: 500 })
      .withMessage('Spanish caption must not exceed 500 characters'),
    body('category')
      .optional()
      .isString()
      .trim()
      .isLength({ max: 100 })
      .withMessage('Category must not exceed 100 characters'),
    body('sortOrder')
      .optional()
      .isInt({ min: 0 })
      .withMessage('Sort order must be a non-negative integer')
  ],
  contentController.addGalleryImage
);

// PUT /api/v1/gallery/reorder - Update sort order (admin)
router.put('/reorder',
  verifyToken,
  requireRole('super_admin', 'admin'),
  [
    body('images')
      .isArray()
      .withMessage('Images must be an array'),
    body('images.*.id')
      .isUUID()
      .withMessage('Each image ID must be a valid UUID'),
    body('images.*.sortOrder')
      .isInt({ min: 0 })
      .withMessage('Each sort order must be a non-negative integer')
  ],
  contentController.reorderGalleryImages
);

// PUT /api/v1/gallery/:id - Update image (admin)
router.put('/:id',
  verifyToken,
  requireRole('super_admin', 'admin'),
  [
    param('id')
      .isUUID()
      .withMessage('Image ID must be a valid UUID'),
    body('imageUrl')
      .optional()
      .isURL()
      .withMessage('Image URL must be a valid URL')
      .isLength({ max: 500 })
      .withMessage('Image URL must not exceed 500 characters'),
    body('thumbnailUrl')
      .optional()
      .isURL()
      .withMessage('Thumbnail URL must be a valid URL')
      .isLength({ max: 500 })
      .withMessage('Thumbnail URL must not exceed 500 characters'),
    body('captionEn')
      .optional()
      .isString()
      .trim()
      .isLength({ max: 500 })
      .withMessage('English caption must not exceed 500 characters'),
    body('captionEs')
      .optional()
      .isString()
      .trim()
      .isLength({ max: 500 })
      .withMessage('Spanish caption must not exceed 500 characters'),
    body('category')
      .optional()
      .isString()
      .trim()
      .isLength({ max: 100 })
      .withMessage('Category must not exceed 100 characters'),
    body('sortOrder')
      .optional()
      .isInt({ min: 0 })
      .withMessage('Sort order must be a non-negative integer'),
    body('isActive')
      .optional()
      .isBoolean()
      .withMessage('isActive must be a boolean')
  ],
  contentController.updateGalleryImage
);

// DELETE /api/v1/gallery/:id - Delete image (admin)
router.delete('/:id',
  verifyToken,
  requireRole('super_admin', 'admin'),
  [
    param('id')
      .isUUID()
      .withMessage('Image ID must be a valid UUID')
  ],
  contentController.deleteGalleryImage
);

module.exports = router;
