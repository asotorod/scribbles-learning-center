const express = require('express');
const { body, param, query } = require('express-validator');
const { verifyToken, requireRole } = require('../middleware/auth');
const contentController = require('../controllers/contentController');

const router = express.Router();

// ==================== SITE CONTENT ====================

// GET /api/v1/content - List all content (admin only)
router.get('/',
  verifyToken,
  requireRole('super_admin', 'admin'),
  [
    query('page')
      .optional()
      .isString()
      .trim()
      .isLength({ max: 100 })
      .withMessage('Page must not exceed 100 characters')
  ],
  contentController.getAllContent
);

// GET /api/v1/content/:page - Get content for specific page (public)
router.get('/:page', [
  param('page')
    .isString()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Page must not exceed 100 characters')
], contentController.getPageContent);

// PUT /api/v1/content/:page/:section/:key - Update content (admin)
router.put('/:page/:section/:key',
  verifyToken,
  requireRole('super_admin', 'admin'),
  [
    param('page')
      .isString()
      .trim()
      .isLength({ max: 100 })
      .withMessage('Page must not exceed 100 characters'),
    param('section')
      .isString()
      .trim()
      .isLength({ max: 100 })
      .withMessage('Section must not exceed 100 characters'),
    param('key')
      .isString()
      .trim()
      .isLength({ max: 100 })
      .withMessage('Key must not exceed 100 characters'),
    body('en')
      .optional()
      .isString()
      .withMessage('English content must be a string'),
    body('es')
      .optional()
      .isString()
      .withMessage('Spanish content must be a string'),
    body('type')
      .optional()
      .isIn(['text', 'html', 'image', 'json'])
      .withMessage('Type must be text, html, image, or json')
  ],
  contentController.updateContent
);

// ==================== PROGRAMS ====================

// GET /api/v1/programs - List programs (public)
router.get('/programs/list', [
  query('active')
    .optional()
    .isIn(['true', 'false'])
    .withMessage('Active must be true or false')
], contentController.getPrograms);

// PUT /api/v1/programs/:id - Update program (admin)
router.put('/programs/:id',
  verifyToken,
  requireRole('super_admin', 'admin'),
  [
    param('id')
      .isUUID()
      .withMessage('Program ID must be a valid UUID'),
    body('name')
      .optional()
      .isString()
      .trim()
      .isLength({ max: 100 })
      .withMessage('Name must not exceed 100 characters'),
    body('description')
      .optional()
      .isString()
      .trim(),
    body('ageRange')
      .optional()
      .isString()
      .trim()
      .isLength({ max: 50 })
      .withMessage('Age range must not exceed 50 characters'),
    body('schedule')
      .optional()
      .isString()
      .trim()
      .isLength({ max: 100 })
      .withMessage('Schedule must not exceed 100 characters'),
    body('capacity')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Capacity must be a positive integer'),
    body('monthlyRate')
      .optional()
      .isDecimal()
      .withMessage('Monthly rate must be a decimal number'),
    body('color')
      .optional()
      .isString()
      .trim()
      .isLength({ max: 20 })
      .withMessage('Color must not exceed 20 characters'),
    body('icon')
      .optional()
      .isString()
      .trim()
      .isLength({ max: 50 })
      .withMessage('Icon must not exceed 50 characters'),
    body('sortOrder')
      .optional()
      .isInt({ min: 0 })
      .withMessage('Sort order must be a non-negative integer'),
    body('isActive')
      .optional()
      .isBoolean()
      .withMessage('isActive must be a boolean')
  ],
  contentController.updateProgram
);

module.exports = router;
