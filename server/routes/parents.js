const express = require('express');
const { body, param, validationResult } = require('express-validator');
const { verifyToken, requireRole } = require('../middleware/auth');
const parentsController = require('../controllers/parentsController');

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
  body('email')
    .isEmail()
    .withMessage('Valid email is required')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters'),
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
  body('phone')
    .optional()
    .trim()
    .isLength({ max: 20 })
    .withMessage('Phone must be less than 20 characters'),
  body('address')
    .optional()
    .trim(),
  body('employer')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Employer must be less than 200 characters'),
  body('workPhone')
    .optional()
    .trim()
    .isLength({ max: 20 })
    .withMessage('Work phone must be less than 20 characters'),
  body('pinCode')
    .optional()
    .trim()
    .isLength({ min: 4, max: 10 })
    .withMessage('PIN must be 4-10 characters')
    .matches(/^\d+$/)
    .withMessage('PIN must contain only digits')
];

const updateValidation = [
  param('id')
    .isUUID()
    .withMessage('Invalid parent ID'),
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
  body('phone')
    .optional()
    .trim()
    .isLength({ max: 20 }),
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean')
];

const idValidation = [
  param('id')
    .isUUID()
    .withMessage('Invalid parent ID')
];

const linkChildValidation = [
  param('id')
    .isUUID()
    .withMessage('Invalid parent ID'),
  body('childId')
    .isUUID()
    .withMessage('Invalid child ID'),
  body('relationship')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Relationship must be less than 50 characters'),
  body('isPrimaryContact')
    .optional()
    .isBoolean()
    .withMessage('isPrimaryContact must be a boolean'),
  body('isAuthorizedPickup')
    .optional()
    .isBoolean()
    .withMessage('isAuthorizedPickup must be a boolean')
];

const unlinkChildValidation = [
  param('id')
    .isUUID()
    .withMessage('Invalid parent ID'),
  body('childId')
    .isUUID()
    .withMessage('Invalid child ID')
];

const pinValidation = [
  param('id')
    .isUUID()
    .withMessage('Invalid parent ID'),
  body('pinCode')
    .optional({ nullable: true })
    .custom((value) => {
      if (value === null || value === '') return true;
      if (!/^\d{4,10}$/.test(value)) {
        throw new Error('PIN must be 4-10 digits');
      }
      return true;
    })
];

/**
 * @route   GET /api/v1/parents
 * @desc    List all parents with optional search
 * @access  Protected (admin)
 * @query   search, is_active
 */
router.get('/', parentsController.getAll);

/**
 * @route   POST /api/v1/parents
 * @desc    Create new parent (creates user account)
 * @access  Protected (admin)
 */
router.post(
  '/',
  createValidation,
  handleValidationErrors,
  parentsController.create
);

/**
 * @route   GET /api/v1/parents/:id
 * @desc    Get single parent with linked children
 * @access  Protected (admin)
 */
router.get(
  '/:id',
  idValidation,
  handleValidationErrors,
  parentsController.getById
);

/**
 * @route   PUT /api/v1/parents/:id
 * @desc    Update parent
 * @access  Protected (admin)
 */
router.put(
  '/:id',
  updateValidation,
  handleValidationErrors,
  parentsController.update
);

/**
 * @route   DELETE /api/v1/parents/:id
 * @desc    Soft delete parent (deactivate)
 * @access  Protected (admin)
 */
router.delete(
  '/:id',
  idValidation,
  handleValidationErrors,
  parentsController.remove
);

/**
 * @route   POST /api/v1/parents/:id/link-child
 * @desc    Link parent to child
 * @access  Protected (admin)
 */
router.post(
  '/:id/link-child',
  linkChildValidation,
  handleValidationErrors,
  parentsController.linkChild
);

/**
 * @route   DELETE /api/v1/parents/:id/unlink-child
 * @desc    Unlink parent from child
 * @access  Protected (admin)
 */
router.delete(
  '/:id/unlink-child',
  unlinkChildValidation,
  handleValidationErrors,
  parentsController.unlinkChild
);

/**
 * @route   PUT /api/v1/parents/:id/pin
 * @desc    Set/update PIN code
 * @access  Protected (admin)
 */
router.put(
  '/:id/pin',
  pinValidation,
  handleValidationErrors,
  parentsController.updatePin
);

module.exports = router;
