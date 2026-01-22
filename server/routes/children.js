const express = require('express');
const { body, param, query, validationResult } = require('express-validator');
const { verifyToken, requireRole } = require('../middleware/auth');
const childrenController = require('../controllers/childrenController');

const router = express.Router();

// Validation middleware
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: errors.array().map(err => ({
        field: err.path,
        message: err.msg
      }))
    });
  }
  next();
};

// All routes require admin authentication
router.use(verifyToken);
router.use(requireRole('super_admin', 'admin'));

// Validation rules
const createValidation = [
  body('firstName')
    .trim()
    .notEmpty()
    .withMessage('First name is required')
    .isLength({ max: 100 })
    .withMessage('First name must be less than 100 characters'),
  body('lastName')
    .trim()
    .notEmpty()
    .withMessage('Last name is required')
    .isLength({ max: 100 })
    .withMessage('Last name must be less than 100 characters'),
  body('dateOfBirth')
    .notEmpty()
    .withMessage('Date of birth is required')
    .isISO8601()
    .withMessage('Invalid date format'),
  body('programId')
    .optional()
    .isUUID()
    .withMessage('Invalid program ID'),
  body('photoUrl')
    .optional()
    .isURL()
    .withMessage('Invalid photo URL'),
  body('allergies')
    .optional()
    .trim(),
  body('medicalNotes')
    .optional()
    .trim(),
  body('emergencyContactName')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Emergency contact name must be less than 200 characters'),
  body('emergencyContactPhone')
    .optional()
    .trim()
    .isLength({ max: 20 })
    .withMessage('Phone must be less than 20 characters'),
  body('enrollmentDate')
    .optional()
    .isISO8601()
    .withMessage('Invalid enrollment date format')
];

const updateValidation = [
  param('id')
    .isUUID()
    .withMessage('Invalid child ID'),
  body('firstName')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('First name cannot be empty')
    .isLength({ max: 100 }),
  body('lastName')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Last name cannot be empty')
    .isLength({ max: 100 }),
  body('dateOfBirth')
    .optional()
    .isISO8601()
    .withMessage('Invalid date format'),
  body('programId')
    .optional()
    .isUUID()
    .withMessage('Invalid program ID'),
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean')
];

const idValidation = [
  param('id')
    .isUUID()
    .withMessage('Invalid child ID')
];

/**
 * @route   GET /api/v1/children
 * @desc    List all children with optional filters
 * @access  Protected (admin)
 * @query   search, program_id, is_active
 */
router.get('/', childrenController.getAll);

/**
 * @route   POST /api/v1/children
 * @desc    Create new child
 * @access  Protected (admin)
 */
router.post(
  '/',
  createValidation,
  handleValidationErrors,
  childrenController.create
);

/**
 * @route   GET /api/v1/children/:id
 * @desc    Get single child with parents and attendance
 * @access  Protected (admin)
 */
router.get(
  '/:id',
  idValidation,
  handleValidationErrors,
  childrenController.getById
);

/**
 * @route   PUT /api/v1/children/:id
 * @desc    Update child
 * @access  Protected (admin)
 */
router.put(
  '/:id',
  updateValidation,
  handleValidationErrors,
  childrenController.update
);

/**
 * @route   DELETE /api/v1/children/:id
 * @desc    Soft delete child (deactivate)
 * @access  Protected (admin)
 */
router.delete(
  '/:id',
  idValidation,
  handleValidationErrors,
  childrenController.remove
);

module.exports = router;
