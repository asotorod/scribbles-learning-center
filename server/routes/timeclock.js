const express = require('express');
const router = express.Router();
const { verifyToken, requireRole } = require('../middleware/auth');
const timeclockController = require('../controllers/timeclockController');

// All routes require admin authentication
router.use(verifyToken);
router.use(requireRole('super_admin', 'admin'));

// GET /api/v1/timeclock/today - Today's punches
router.get('/today', timeclockController.getToday);

// GET /api/v1/timeclock/daily-report - Daily employee report
router.get('/daily-report', timeclockController.getDailyReport);

// GET /api/v1/timeclock/report - Weekly/pay period report
router.get('/report', timeclockController.getReport);

// GET /api/v1/timeclock/employee/:id - Employee time records
router.get('/employee/:id', timeclockController.getEmployeeRecords);

// POST /api/v1/timeclock/add-punch - Admin adds a missing punch
router.post('/add-punch', timeclockController.addPunch);

// PUT /api/v1/timeclock/:id - Edit time entry
router.put('/:id', timeclockController.editTimeEntry);

// DELETE /api/v1/timeclock/:id - Delete time entry
router.delete('/:id', timeclockController.deleteTimeEntry);

module.exports = router;
