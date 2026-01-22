const express = require('express');
const { body, query, param } = require('express-validator');
const { verifyToken, requireRole } = require('../middleware/auth');
const attendanceController = require('../controllers/attendanceController');

const router = express.Router();

// All routes require admin authentication
router.use(verifyToken);
router.use(requireRole('super_admin', 'admin'));

// GET /api/v1/attendance/today - Today's overview dashboard
router.get('/today', attendanceController.getTodayOverview);

// GET /api/v1/attendance/checkins - Filterable check-in log
router.get('/checkins', [
  query('date')
    .optional()
    .isISO8601()
    .withMessage('Date must be in ISO8601 format'),
  query('programId')
    .optional()
    .isUUID()
    .withMessage('Program ID must be a valid UUID'),
  query('status')
    .optional()
    .isIn(['checked_in', 'checked_out', 'all'])
    .withMessage('Status must be checked_in, checked_out, or all'),
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100')
], attendanceController.getCheckins);

// GET /api/v1/attendance/absences - Filterable absences list
router.get('/absences', [
  query('status')
    .optional()
    .isIn(['pending', 'acknowledged', 'cancelled', 'all'])
    .withMessage('Status must be pending, acknowledged, cancelled, or all'),
  query('startDate')
    .optional()
    .isISO8601()
    .withMessage('Start date must be in ISO8601 format'),
  query('endDate')
    .optional()
    .isISO8601()
    .withMessage('End date must be in ISO8601 format'),
  query('childId')
    .optional()
    .isUUID()
    .withMessage('Child ID must be a valid UUID'),
  query('reasonId')
    .optional()
    .isUUID()
    .withMessage('Reason ID must be a valid UUID'),
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100')
], attendanceController.getAbsences);

// GET /api/v1/attendance/absences/:id - Single absence details
router.get('/absences/:id', [
  param('id')
    .isUUID()
    .withMessage('Absence ID must be a valid UUID')
], attendanceController.getAbsenceById);

// PUT /api/v1/attendance/absences/:id/acknowledge - Acknowledge absence
router.put('/absences/:id/acknowledge', [
  param('id')
    .isUUID()
    .withMessage('Absence ID must be a valid UUID'),
  body('notes')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Notes must not exceed 500 characters')
], attendanceController.acknowledgeAbsence);

// POST /api/v1/attendance/manual-checkin - Manual check-in by admin
router.post('/manual-checkin', [
  body('childId')
    .notEmpty()
    .withMessage('Child ID is required')
    .isUUID()
    .withMessage('Child ID must be a valid UUID'),
  body('notes')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Notes must not exceed 500 characters')
], attendanceController.manualCheckIn);

// POST /api/v1/attendance/manual-checkout - Manual check-out by admin
router.post('/manual-checkout', [
  body('childId')
    .notEmpty()
    .withMessage('Child ID is required')
    .isUUID()
    .withMessage('Child ID must be a valid UUID'),
  body('notes')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Notes must not exceed 500 characters')
], attendanceController.manualCheckOut);

module.exports = router;
