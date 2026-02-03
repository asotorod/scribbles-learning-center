const express = require('express');
const multer = require('multer');
const { body, param, query, validationResult } = require('express-validator');
const { verifyToken, requireRole } = require('../middleware/auth');
const portalController = require('../controllers/portalController');
const { ALLOWED_IMAGE_TYPES, MAX_FILE_SIZE } = require('../services/uploadService');

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

// All routes require parent authentication
router.use(verifyToken);
router.use(requireRole('parent'));

// ============================================
// VALIDATION RULES
// ============================================

const childIdValidation = [
  param('id')
    .isUUID()
    .withMessage('Invalid child ID')
];

const absenceIdValidation = [
  param('id')
    .isUUID()
    .withMessage('Invalid absence ID')
];

const createAbsenceValidation = [
  body('childId')
    .isUUID()
    .withMessage('Invalid child ID'),
  body('startDate')
    .notEmpty()
    .withMessage('Start date is required')
    .isISO8601()
    .withMessage('Invalid start date format'),
  body('endDate')
    .optional()
    .isISO8601()
    .withMessage('Invalid end date format')
    .custom((value, { req }) => {
      if (value && new Date(value) < new Date(req.body.startDate)) {
        throw new Error('End date cannot be before start date');
      }
      return true;
    }),
  body('reasonId')
    .isUUID()
    .withMessage('Invalid reason ID'),
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Notes must be less than 1000 characters'),
  body('expectedReturnDate')
    .optional()
    .isISO8601()
    .withMessage('Invalid expected return date format')
];

const updateAbsenceValidation = [
  param('id')
    .isUUID()
    .withMessage('Invalid absence ID'),
  body('startDate')
    .optional()
    .isISO8601()
    .withMessage('Invalid start date format'),
  body('endDate')
    .optional()
    .isISO8601()
    .withMessage('Invalid end date format'),
  body('reasonId')
    .optional()
    .isUUID()
    .withMessage('Invalid reason ID'),
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Notes must be less than 1000 characters'),
  body('expectedReturnDate')
    .optional()
    .isISO8601()
    .withMessage('Invalid expected return date format')
];

// ============================================
// PROFILE ROUTES
// ============================================

router.get('/profile', portalController.getProfile);
router.put('/profile', portalController.updateProfile);
router.put(
  '/my-children/:id/emergency-contact',
  childIdValidation,
  handleValidationErrors,
  portalController.updateEmergencyContact
);

// ============================================
// DASHBOARD & CHILDREN ROUTES
// ============================================

/**
 * @route   GET /api/v1/portal/dashboard
 * @desc    Get parent's dashboard with children and status
 * @access  Protected (parent only)
 */
router.get('/dashboard', portalController.getDashboard);

/**
 * @route   GET /api/v1/portal/my-children
 * @desc    List parent's linked children
 * @access  Protected (parent only)
 */
router.get('/my-children', portalController.getMyChildren);

/**
 * @route   GET /api/v1/portal/my-children/:id
 * @desc    Get single child details with attendance history
 * @access  Protected (parent only, own children)
 */
router.get(
  '/my-children/:id',
  childIdValidation,
  handleValidationErrors,
  portalController.getMyChild
);

// ============================================
// ABSENCE ROUTES
// ============================================

/**
 * @route   GET /api/v1/portal/absence-reasons
 * @desc    Get absence reasons for dropdown
 * @access  Protected (parent only)
 */
router.get('/absence-reasons', portalController.getAbsenceReasons);

/**
 * @route   GET /api/v1/portal/absences
 * @desc    List parent's reported absences
 * @access  Protected (parent only)
 * @query   child_id, status, upcoming
 */
router.get('/absences', portalController.getAbsences);

/**
 * @route   POST /api/v1/portal/absences
 * @desc    Report a new absence
 * @access  Protected (parent only)
 */
router.post(
  '/absences',
  createAbsenceValidation,
  handleValidationErrors,
  portalController.createAbsence
);

/**
 * @route   GET /api/v1/portal/absences/:id
 * @desc    Get single absence details
 * @access  Protected (parent only, own absences)
 */
router.get(
  '/absences/:id',
  absenceIdValidation,
  handleValidationErrors,
  portalController.getAbsence
);

/**
 * @route   PUT /api/v1/portal/absences/:id
 * @desc    Edit upcoming absence
 * @access  Protected (parent only, own absences, future dates only)
 */
router.put(
  '/absences/:id',
  updateAbsenceValidation,
  handleValidationErrors,
  portalController.updateAbsence
);

/**
 * @route   DELETE /api/v1/portal/absences/:id
 * @desc    Cancel upcoming absence
 * @access  Protected (parent only, own absences, future dates only)
 */
router.delete(
  '/absences/:id',
  absenceIdValidation,
  handleValidationErrors,
  portalController.cancelAbsence
);

// ============================================
// CHILD PHOTO UPLOAD
// ============================================

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_IMAGE_TYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Invalid file type. Allowed: ${ALLOWED_IMAGE_TYPES.join(', ')}`), false);
    }
  },
});

const handleMulterError = (err, _req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        error: `File too large. Maximum size is ${MAX_FILE_SIZE / (1024 * 1024)}MB`,
      });
    }
    return res.status(400).json({ success: false, error: err.message });
  }
  if (err) {
    return res.status(400).json({ success: false, error: err.message });
  }
  next();
};

/**
 * @route   POST /api/v1/portal/my-children/:id/photo
 * @desc    Upload or replace child profile photo
 * @access  Protected (parent only, own children)
 */
router.post(
  '/my-children/:id/photo',
  childIdValidation,
  handleValidationErrors,
  upload.single('file'),
  handleMulterError,
  portalController.uploadChildPhoto
);

module.exports = router;
