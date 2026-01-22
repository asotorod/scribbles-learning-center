const express = require('express');
const { body, param, query } = require('express-validator');
const { verifyToken, requireRole } = require('../middleware/auth');
const contentController = require('../controllers/contentController');

const router = express.Router();

// GET /api/v1/testimonials - List testimonials (public, featured first)
router.get('/', [
  query('active')
    .optional()
    .isIn(['true', 'false'])
    .withMessage('Active must be true or false'),
  query('featured')
    .optional()
    .isIn(['true', 'false'])
    .withMessage('Featured must be true or false')
], contentController.getTestimonials);

// POST /api/v1/testimonials - Add testimonial (admin)
router.post('/',
  verifyToken,
  requireRole('super_admin', 'admin'),
  [
    body('quoteEn')
      .notEmpty()
      .withMessage('English quote is required')
      .isString()
      .trim(),
    body('quoteEs')
      .optional()
      .isString()
      .trim(),
    body('authorName')
      .optional()
      .isString()
      .trim()
      .isLength({ max: 200 })
      .withMessage('Author name must not exceed 200 characters'),
    body('authorRole')
      .optional()
      .isString()
      .trim()
      .isLength({ max: 100 })
      .withMessage('Author role must not exceed 100 characters'),
    body('rating')
      .optional()
      .isInt({ min: 1, max: 5 })
      .withMessage('Rating must be between 1 and 5'),
    body('photoUrl')
      .optional()
      .isURL()
      .withMessage('Photo URL must be a valid URL')
      .isLength({ max: 500 })
      .withMessage('Photo URL must not exceed 500 characters'),
    body('isFeatured')
      .optional()
      .isBoolean()
      .withMessage('isFeatured must be a boolean'),
    body('sortOrder')
      .optional()
      .isInt({ min: 0 })
      .withMessage('Sort order must be a non-negative integer')
  ],
  contentController.addTestimonial
);

// PUT /api/v1/testimonials/:id - Update testimonial (admin)
router.put('/:id',
  verifyToken,
  requireRole('super_admin', 'admin'),
  [
    param('id')
      .isUUID()
      .withMessage('Testimonial ID must be a valid UUID'),
    body('quoteEn')
      .optional()
      .isString()
      .trim(),
    body('quoteEs')
      .optional()
      .isString()
      .trim(),
    body('authorName')
      .optional()
      .isString()
      .trim()
      .isLength({ max: 200 })
      .withMessage('Author name must not exceed 200 characters'),
    body('authorRole')
      .optional()
      .isString()
      .trim()
      .isLength({ max: 100 })
      .withMessage('Author role must not exceed 100 characters'),
    body('rating')
      .optional()
      .isInt({ min: 1, max: 5 })
      .withMessage('Rating must be between 1 and 5'),
    body('photoUrl')
      .optional()
      .isURL()
      .withMessage('Photo URL must be a valid URL')
      .isLength({ max: 500 })
      .withMessage('Photo URL must not exceed 500 characters'),
    body('isFeatured')
      .optional()
      .isBoolean()
      .withMessage('isFeatured must be a boolean'),
    body('sortOrder')
      .optional()
      .isInt({ min: 0 })
      .withMessage('Sort order must be a non-negative integer'),
    body('isActive')
      .optional()
      .isBoolean()
      .withMessage('isActive must be a boolean')
  ],
  contentController.updateTestimonial
);

// DELETE /api/v1/testimonials/:id - Delete testimonial (admin)
router.delete('/:id',
  verifyToken,
  requireRole('super_admin', 'admin'),
  [
    param('id')
      .isUUID()
      .withMessage('Testimonial ID must be a valid UUID')
  ],
  contentController.deleteTestimonial
);

module.exports = router;
