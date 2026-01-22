const express = require('express');
const { body, param, query } = require('express-validator');
const { verifyToken, requireRole } = require('../middleware/auth');
const employeesController = require('../controllers/employeesController');

const router = express.Router();

// All routes require admin authentication
router.use(verifyToken);
router.use(requireRole('super_admin', 'admin'));

// GET /api/v1/employees - List all employees
router.get('/', [
  query('search')
    .optional()
    .isString()
    .trim(),
  query('department')
    .optional()
    .isString()
    .trim(),
  query('status')
    .optional()
    .isIn(['active', 'inactive', 'all'])
    .withMessage('Status must be active, inactive, or all'),
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100')
], employeesController.getAll);

// POST /api/v1/employees - Create employee
router.post('/', [
  body('email')
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Must be a valid email')
    .normalizeEmail(),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters'),
  body('firstName')
    .notEmpty()
    .withMessage('First name is required')
    .isString()
    .trim()
    .isLength({ max: 100 })
    .withMessage('First name must not exceed 100 characters'),
  body('lastName')
    .notEmpty()
    .withMessage('Last name is required')
    .isString()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Last name must not exceed 100 characters'),
  body('phone')
    .optional()
    .isString()
    .trim(),
  body('role')
    .optional()
    .isIn(['staff', 'admin'])
    .withMessage('Role must be staff or admin'),
  body('position')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Position must not exceed 100 characters'),
  body('department')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Department must not exceed 100 characters'),
  body('hireDate')
    .optional()
    .isISO8601()
    .withMessage('Hire date must be in ISO8601 format'),
  body('pinCode')
    .optional()
    .isString()
    .isLength({ min: 4, max: 6 })
    .withMessage('PIN must be 4-6 characters'),
  body('emergencyContactName')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Emergency contact name must not exceed 200 characters'),
  body('emergencyContactPhone')
    .optional()
    .isString()
    .trim(),
  body('notes')
    .optional()
    .isString()
    .trim()
], employeesController.create);

// GET /api/v1/employees/:id - Get employee with certifications
router.get('/:id', [
  param('id')
    .isUUID()
    .withMessage('Employee ID must be a valid UUID')
], employeesController.getById);

// PUT /api/v1/employees/:id - Update employee
router.put('/:id', [
  param('id')
    .isUUID()
    .withMessage('Employee ID must be a valid UUID'),
  body('email')
    .optional()
    .isEmail()
    .withMessage('Must be a valid email')
    .normalizeEmail(),
  body('firstName')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 100 })
    .withMessage('First name must not exceed 100 characters'),
  body('lastName')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Last name must not exceed 100 characters'),
  body('phone')
    .optional()
    .isString()
    .trim(),
  body('role')
    .optional()
    .isIn(['staff', 'admin'])
    .withMessage('Role must be staff or admin'),
  body('position')
    .optional()
    .isString()
    .trim(),
  body('department')
    .optional()
    .isString()
    .trim(),
  body('hireDate')
    .optional()
    .isISO8601()
    .withMessage('Hire date must be in ISO8601 format'),
  body('emergencyContactName')
    .optional()
    .isString()
    .trim(),
  body('emergencyContactPhone')
    .optional()
    .isString()
    .trim(),
  body('hourlyRate')
    .optional()
    .isDecimal()
    .withMessage('Hourly rate must be a decimal number'),
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean')
], employeesController.update);

// DELETE /api/v1/employees/:id - Soft delete
router.delete('/:id', [
  param('id')
    .isUUID()
    .withMessage('Employee ID must be a valid UUID')
], employeesController.remove);

// PUT /api/v1/employees/:id/pin - Set/update PIN code
router.put('/:id/pin', [
  param('id')
    .isUUID()
    .withMessage('Employee ID must be a valid UUID'),
  body('pinCode')
    .optional({ nullable: true })
    .isString()
    .isLength({ min: 4, max: 6 })
    .withMessage('PIN must be 4-6 characters')
], employeesController.updatePin);

// ==================== CERTIFICATIONS ====================

// GET /api/v1/employees/:id/certifications - List certifications
router.get('/:id/certifications', [
  param('id')
    .isUUID()
    .withMessage('Employee ID must be a valid UUID')
], employeesController.getCertifications);

// POST /api/v1/employees/:id/certifications - Add certification
router.post('/:id/certifications', [
  param('id')
    .isUUID()
    .withMessage('Employee ID must be a valid UUID'),
  body('name')
    .notEmpty()
    .withMessage('Certification name is required')
    .isString()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Name must not exceed 200 characters'),
  body('issuedDate')
    .optional()
    .isISO8601()
    .withMessage('Issued date must be in ISO8601 format'),
  body('expiryDate')
    .optional()
    .isISO8601()
    .withMessage('Expiry date must be in ISO8601 format'),
  body('documentUrl')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Document URL must not exceed 500 characters')
], employeesController.addCertification);

// PUT /api/v1/employees/:id/certifications/:certId - Update certification
router.put('/:id/certifications/:certId', [
  param('id')
    .isUUID()
    .withMessage('Employee ID must be a valid UUID'),
  param('certId')
    .isUUID()
    .withMessage('Certification ID must be a valid UUID'),
  body('name')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Name must not exceed 200 characters'),
  body('issuedDate')
    .optional()
    .isISO8601()
    .withMessage('Issued date must be in ISO8601 format'),
  body('expiryDate')
    .optional()
    .isISO8601()
    .withMessage('Expiry date must be in ISO8601 format'),
  body('documentUrl')
    .optional()
    .isString()
    .trim()
], employeesController.updateCertification);

// DELETE /api/v1/employees/:id/certifications/:certId - Delete certification
router.delete('/:id/certifications/:certId', [
  param('id')
    .isUUID()
    .withMessage('Employee ID must be a valid UUID'),
  param('certId')
    .isUUID()
    .withMessage('Certification ID must be a valid UUID')
], employeesController.deleteCertification);

module.exports = router;
