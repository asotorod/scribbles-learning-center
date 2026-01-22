const express = require('express');
const { body, param, query } = require('express-validator');
const { verifyToken, requireRole } = require('../middleware/auth');
const timeclockController = require('../controllers/timeclockController');

const router = express.Router();

// All routes require admin authentication
router.use(verifyToken);
router.use(requireRole('super_admin', 'admin'));

// GET /api/v1/timeclock/today - Today's punches for all employees
router.get('/today', timeclockController.getToday);

// GET /api/v1/timeclock/report - Weekly/pay period report
router.get('/report', [
  query('startDate')
    .optional()
    .isISO8601()
    .withMessage('Start date must be in ISO8601 format'),
  query('endDate')
    .optional()
    .isISO8601()
    .withMessage('End date must be in ISO8601 format'),
  query('department')
    .optional()
    .isString()
    .trim()
], timeclockController.getReport);

// GET /api/v1/timeclock/employee/:id - Employee's time records
router.get('/employee/:id', [
  param('id')
    .isUUID()
    .withMessage('Employee ID must be a valid UUID'),
  query('startDate')
    .optional()
    .isISO8601()
    .withMessage('Start date must be in ISO8601 format'),
  query('endDate')
    .optional()
    .isISO8601()
    .withMessage('End date must be in ISO8601 format'),
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100')
], timeclockController.getEmployeeRecords);

// PUT /api/v1/timeclock/:id - Edit time entry (admin correction)
router.put('/:id', [
  param('id')
    .isUUID()
    .withMessage('Time record ID must be a valid UUID'),
  body('clockIn')
    .optional()
    .isISO8601()
    .withMessage('Clock in time must be in ISO8601 format'),
  body('clockOut')
    .optional()
    .isISO8601()
    .withMessage('Clock out time must be in ISO8601 format'),
  body('notes')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Notes must not exceed 500 characters')
], timeclockController.editTimeEntry);

module.exports = router;
