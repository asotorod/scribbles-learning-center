const express = require('express');
const { body, validationResult } = require('express-validator');
const { verifyToken, requireRole } = require('../middleware/auth');
const authController = require('../controllers/authController');

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

// Validation rules
const registerValidation = [
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
    .withMessage('First name is required'),
  body('lastName')
    .trim()
    .notEmpty()
    .withMessage('Last name is required'),
  body('role')
    .optional()
    .isIn(['super_admin', 'admin', 'staff', 'parent'])
    .withMessage('Invalid role'),
  body('phone')
    .optional()
    .trim()
];

const loginValidation = [
  body('email')
    .isEmail()
    .withMessage('Valid email is required')
    .normalizeEmail(),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
];

const refreshValidation = [
  body('refreshToken')
    .notEmpty()
    .withMessage('Refresh token is required')
];

/**
 * @route   POST /api/v1/auth/register
 * @desc    Register a new user (admin only)
 * @access  Protected (super_admin, admin)
 */
router.post(
  '/register',
  verifyToken,
  requireRole('super_admin', 'admin'),
  registerValidation,
  handleValidationErrors,
  authController.register
);

/**
 * @route   POST /api/v1/auth/login
 * @desc    Login user and return tokens
 * @access  Public
 */
router.post(
  '/login',
  loginValidation,
  handleValidationErrors,
  authController.login
);

/**
 * @route   POST /api/v1/auth/refresh
 * @desc    Refresh access token using refresh token
 * @access  Public
 */
router.post(
  '/refresh',
  refreshValidation,
  handleValidationErrors,
  authController.refresh
);

/**
 * @route   POST /api/v1/auth/logout
 * @desc    Logout user and invalidate refresh token
 * @access  Public
 */
router.post('/logout', authController.logout);

/**
 * @route   GET /api/v1/auth/me
 * @desc    Get current authenticated user
 * @access  Protected
 */
router.get('/me', verifyToken, authController.me);

/**
 * @route   GET /api/v1/auth/verify
 * @desc    Verify if token is valid
 * @access  Protected
 */
router.get('/verify', verifyToken, (req, res) => {
  res.json({
    success: true,
    data: {
      valid: true,
      user: req.user
    }
  });
});

module.exports = router;
