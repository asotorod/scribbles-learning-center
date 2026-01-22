const express = require('express');
const { body, validationResult } = require('express-validator');
const kioskController = require('../controllers/kioskController');

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

// ============================================
// VALIDATION RULES
// ============================================

const pinValidation = [
  body('pin')
    .notEmpty()
    .withMessage('PIN is required')
    .isLength({ min: 4, max: 10 })
    .withMessage('PIN must be 4-10 digits')
    .matches(/^\d+$/)
    .withMessage('PIN must contain only digits')
];

const parentChildrenValidation = [
  body('parentId')
    .isUUID()
    .withMessage('Invalid parent ID'),
  body('pin')
    .notEmpty()
    .withMessage('PIN is required')
];

const checkInOutValidation = [
  body('parentId')
    .isUUID()
    .withMessage('Invalid parent ID'),
  body('childIds')
    .isArray({ min: 1 })
    .withMessage('At least one child must be selected'),
  body('childIds.*')
    .isUUID()
    .withMessage('Invalid child ID'),
  body('pin')
    .notEmpty()
    .withMessage('PIN is required')
];

const employeeClockValidation = [
  body('employeeId')
    .isUUID()
    .withMessage('Invalid employee ID'),
  body('pin')
    .notEmpty()
    .withMessage('PIN is required')
];

// ============================================
// PIN VERIFICATION
// ============================================

/**
 * @route   POST /api/v1/kiosk/verify-pin
 * @desc    Verify PIN and return parent or employee info
 * @access  Public (kiosk)
 */
router.post(
  '/verify-pin',
  pinValidation,
  handleValidationErrors,
  kioskController.verifyPin
);

// ============================================
// PARENT CHECK-IN/OUT
// ============================================

/**
 * @route   POST /api/v1/kiosk/parent/children
 * @desc    Get parent's children for check-in selection
 * @access  Public (requires valid PIN)
 */
router.post(
  '/parent/children',
  parentChildrenValidation,
  handleValidationErrors,
  kioskController.getParentChildren
);

/**
 * @route   POST /api/v1/kiosk/checkin
 * @desc    Check in child(ren)
 * @access  Public (requires valid PIN)
 */
router.post(
  '/checkin',
  checkInOutValidation,
  handleValidationErrors,
  kioskController.checkIn
);

/**
 * @route   POST /api/v1/kiosk/checkout
 * @desc    Check out child(ren)
 * @access  Public (requires valid PIN)
 */
router.post(
  '/checkout',
  checkInOutValidation,
  handleValidationErrors,
  kioskController.checkOut
);

// ============================================
// EMPLOYEE TIME CLOCK
// ============================================

/**
 * @route   POST /api/v1/kiosk/employee/clockin
 * @desc    Employee clock in
 * @access  Public (requires valid PIN)
 */
router.post(
  '/employee/clockin',
  employeeClockValidation,
  handleValidationErrors,
  kioskController.employeeClockIn
);

/**
 * @route   POST /api/v1/kiosk/employee/clockout
 * @desc    Employee clock out
 * @access  Public (requires valid PIN)
 */
router.post(
  '/employee/clockout',
  employeeClockValidation,
  handleValidationErrors,
  kioskController.employeeClockOut
);

/**
 * @route   POST /api/v1/kiosk/employee/status
 * @desc    Get employee's current clock status
 * @access  Public (requires valid PIN)
 */
router.post(
  '/employee/status',
  employeeClockValidation,
  handleValidationErrors,
  kioskController.getEmployeeStatus
);

module.exports = router;
