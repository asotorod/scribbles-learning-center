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

/**
 * @route   POST /api/v1/portal/change-password
 * @desc    Change parent's password
 * @access  Protected (parent only)
 */
router.post('/change-password', portalController.changePassword);

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
// NOTIFICATION ROUTES
// ============================================

const notificationIdValidation = [
  param('id')
    .isUUID()
    .withMessage('Invalid notification ID')
];

/**
 * @route   GET /api/v1/portal/notifications/unread-count
 * @desc    Get count of unread notifications
 * @access  Protected (parent only)
 */
router.get('/notifications/unread-count', portalController.getUnreadCount);

/**
 * @route   GET /api/v1/portal/notifications
 * @desc    List parent's notifications (paginated)
 * @access  Protected (parent only)
 * @query   page, limit
 */
router.get('/notifications', portalController.getNotifications);

/**
 * @route   PUT /api/v1/portal/notifications/:id/read
 * @desc    Mark a notification as read
 * @access  Protected (parent only)
 */
router.put(
  '/notifications/:id/read',
  notificationIdValidation,
  handleValidationErrors,
  portalController.markNotificationRead
);

// ============================================
// AUTHORIZED PICKUPS (per child)
// ============================================

const childIdParamValidation = [
  param('childId')
    .isUUID()
    .withMessage('Invalid child ID')
];

const pickupIdValidation = [
  param('pickupId')
    .isUUID()
    .withMessage('Invalid pickup ID')
];

const contactIdValidation = [
  param('contactId')
    .isUUID()
    .withMessage('Invalid contact ID')
];

const pickupBodyValidation = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ max: 200 })
    .withMessage('Name must be less than 200 characters'),
  body('phone')
    .trim()
    .notEmpty()
    .withMessage('Phone is required')
    .isLength({ max: 20 })
    .withMessage('Phone must be less than 20 characters'),
  body('relationship')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Relationship must be less than 100 characters'),
];

const contactBodyValidation = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ max: 200 })
    .withMessage('Name must be less than 200 characters'),
  body('phone')
    .trim()
    .notEmpty()
    .withMessage('Phone is required')
    .isLength({ max: 20 })
    .withMessage('Phone must be less than 20 characters'),
  body('relationship')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Relationship must be less than 100 characters'),
  body('is_primary')
    .optional()
    .isBoolean()
    .withMessage('is_primary must be a boolean'),
];

router.get(
  '/my-children/:childId/authorized-pickups',
  childIdParamValidation,
  handleValidationErrors,
  portalController.getAuthorizedPickups
);

router.post(
  '/my-children/:childId/authorized-pickups',
  [...childIdParamValidation, ...pickupBodyValidation],
  handleValidationErrors,
  portalController.createAuthorizedPickup
);

router.put(
  '/my-children/:childId/authorized-pickups/:pickupId',
  [...childIdParamValidation, ...pickupIdValidation],
  handleValidationErrors,
  portalController.updateAuthorizedPickup
);

router.delete(
  '/my-children/:childId/authorized-pickups/:pickupId',
  [...childIdParamValidation, ...pickupIdValidation],
  handleValidationErrors,
  portalController.deleteAuthorizedPickup
);

// ============================================
// EMERGENCY CONTACTS (per child, multi-entry)
// ============================================

router.get(
  '/my-children/:childId/emergency-contacts',
  childIdParamValidation,
  handleValidationErrors,
  portalController.getEmergencyContacts
);

router.post(
  '/my-children/:childId/emergency-contacts',
  [...childIdParamValidation, ...contactBodyValidation],
  handleValidationErrors,
  portalController.createEmergencyContact
);

router.put(
  '/my-children/:childId/emergency-contacts/:contactId',
  [...childIdParamValidation, ...contactIdValidation],
  handleValidationErrors,
  portalController.updateEmergencyContactEntry
);

router.delete(
  '/my-children/:childId/emergency-contacts/:contactId',
  [...childIdParamValidation, ...contactIdValidation],
  handleValidationErrors,
  portalController.deleteEmergencyContact
);

// ============================================
// DIRECT MESSAGE ROUTES
// ============================================

const messagesController = require('../controllers/messagesController');

const messageIdValidation = [
  param('id')
    .isUUID()
    .withMessage('Invalid message ID')
];

/**
 * @route   GET /api/v1/portal/messages/unread-count
 * @desc    Get count of unread direct messages
 * @access  Protected (parent only)
 */
router.get('/messages/unread-count', messagesController.getUnreadMessageCount);

/**
 * @route   GET /api/v1/portal/messages
 * @desc    List parent's direct messages (paginated)
 * @access  Protected (parent only)
 * @query   page, limit
 */
router.get('/messages', messagesController.getInbox);

/**
 * @route   PUT /api/v1/portal/messages/:id/read
 * @desc    Mark a direct message as read
 * @access  Protected (parent only)
 */
router.put(
  '/messages/:id/read',
  messageIdValidation,
  handleValidationErrors,
  messagesController.markAsRead
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
