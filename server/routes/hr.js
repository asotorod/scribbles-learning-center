const express = require('express');
const { body, param, query } = require('express-validator');
const { verifyToken, requireRole } = require('../middleware/auth');
const hrController = require('../controllers/hrController');

const router = express.Router();

// All routes require admin authentication
router.use(verifyToken);
router.use(requireRole('super_admin', 'admin'));

// ==================== JOB POSTINGS ====================

// GET /api/v1/hr/jobs - List job postings
router.get('/jobs', [
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
], hrController.getJobs);

// POST /api/v1/hr/jobs - Create job posting
router.post('/jobs', [
  body('title')
    .notEmpty()
    .withMessage('Title is required')
    .isString()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Title must not exceed 200 characters'),
  body('employmentType')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Employment type must not exceed 50 characters'),
  body('description')
    .optional()
    .isString()
    .trim(),
  body('requirements')
    .optional()
    .isString()
    .trim(),
  body('salaryRange')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Salary range must not exceed 100 characters'),
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean')
], hrController.createJob);

// PUT /api/v1/hr/jobs/:id - Update job posting
router.put('/jobs/:id', [
  param('id')
    .isUUID()
    .withMessage('Job ID must be a valid UUID'),
  body('title')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Title must not exceed 200 characters'),
  body('employmentType')
    .optional()
    .isString()
    .trim(),
  body('description')
    .optional()
    .isString()
    .trim(),
  body('requirements')
    .optional()
    .isString()
    .trim(),
  body('salaryRange')
    .optional()
    .isString()
    .trim(),
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean')
], hrController.updateJob);

// DELETE /api/v1/hr/jobs/:id - Delete job posting
router.delete('/jobs/:id', [
  param('id')
    .isUUID()
    .withMessage('Job ID must be a valid UUID')
], hrController.deleteJob);

// ==================== APPLICATIONS ====================

// GET /api/v1/hr/applications - List applications
router.get('/applications', [
  query('jobId')
    .optional()
    .isUUID()
    .withMessage('Job ID must be a valid UUID'),
  query('status')
    .optional()
    .isIn(['new', 'reviewing', 'interviewed', 'hired', 'rejected'])
    .withMessage('Status must be new, reviewing, interviewed, hired, or rejected'),
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100')
], hrController.getApplications);

// GET /api/v1/hr/applications/:id - Single application
router.get('/applications/:id', [
  param('id')
    .isUUID()
    .withMessage('Application ID must be a valid UUID')
], hrController.getApplicationById);

// PUT /api/v1/hr/applications/:id - Update status
router.put('/applications/:id', [
  param('id')
    .isUUID()
    .withMessage('Application ID must be a valid UUID'),
  body('status')
    .optional()
    .isIn(['new', 'reviewing', 'interviewed', 'hired', 'rejected'])
    .withMessage('Status must be new, reviewing, interviewed, hired, or rejected'),
  body('notes')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Notes must not exceed 1000 characters')
], hrController.updateApplication);

module.exports = router;
