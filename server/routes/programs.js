const express = require('express');
const { body, param, query } = require('express-validator');
const { verifyToken, requireRole } = require('../middleware/auth');
const contentController = require('../controllers/contentController');

const router = express.Router();

// GET /api/v1/programs - List programs (public)
router.get('/', [
  query('active')
    .optional()
    .isIn(['true', 'false'])
    .withMessage('Active must be true or false')
], contentController.getPrograms);

// PUT /api/v1/programs/:id - Update program (admin)
router.put('/:id',
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
    body('slug')
      .optional()
      .isString()
      .trim()
      .isLength({ max: 100 })
      .withMessage('Slug must not exceed 100 characters'),
    body('ageRange')
      .optional()
      .isString()
      .trim()
      .isLength({ max: 50 })
      .withMessage('Age range must not exceed 50 characters'),
    body('description')
      .optional()
      .isString()
      .trim(),
    body('features')
      .optional()
      .isObject()
      .withMessage('Features must be an object'),
    body('imageUrl')
      .optional()
      .isURL()
      .withMessage('Image URL must be a valid URL')
      .isLength({ max: 500 })
      .withMessage('Image URL must not exceed 500 characters'),
    body('color')
      .optional()
      .isString()
      .trim()
      .isLength({ max: 10 })
      .withMessage('Color must not exceed 10 characters'),
    body('capacity')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Capacity must be a positive integer'),
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
