const express = require('express');
const { body, param, query } = require('express-validator');
const { verifyToken, requireRole } = require('../middleware/auth');
const contentController = require('../controllers/contentController');

const router = express.Router();

// POST /api/v1/contact - Submit contact form (public)
router.post('/', [
  body('name')
    .notEmpty()
    .withMessage('Name is required')
    .isString()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Name must not exceed 200 characters'),
  body('email')
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Email must be a valid email address')
    .normalizeEmail()
    .isLength({ max: 255 })
    .withMessage('Email must not exceed 255 characters'),
  body('phone')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 20 })
    .withMessage('Phone must not exceed 20 characters'),
  body('subject')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Subject must not exceed 200 characters'),
  body('message')
    .notEmpty()
    .withMessage('Message is required')
    .isString()
    .trim()
], contentController.submitContact);

// GET /api/v1/contact - List inquiries (admin)
router.get('/',
  verifyToken,
  requireRole('super_admin', 'admin'),
  [
    query('status')
      .optional()
      .isIn(['read', 'unread'])
      .withMessage('Status must be read or unread'),
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100')
  ],
  contentController.getContactInquiries
);

// PUT /api/v1/contact/:id/read - Mark as read (admin)
router.put('/:id/read',
  verifyToken,
  requireRole('super_admin', 'admin'),
  [
    param('id')
      .isUUID()
      .withMessage('Inquiry ID must be a valid UUID'),
    body('isRead')
      .optional()
      .isBoolean()
      .withMessage('isRead must be a boolean')
  ],
  contentController.markInquiryRead
);

module.exports = router;
