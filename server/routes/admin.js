const express = require('express');
const { query, validationResult } = require('express-validator');
const { verifyToken, requireRole } = require('../middleware/auth');
const db = require('../config/database');

const router = express.Router();

router.use(verifyToken);

/**
 * @route   GET /api/v1/admin/audit-log
 * @desc    Get paginated audit log (super_admin only)
 * @access  Protected (super_admin)
 */
router.get(
  '/audit-log',
  requireRole('super_admin'),
  [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('action').optional().isString(),
    query('user_id').optional().isUUID(),
    query('startDate').optional().isISO8601(),
    query('endDate').optional().isISO8601(),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, error: 'Invalid query parameters' });
      }

      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 50;
      const offset = (page - 1) * limit;
      const { action, user_id, startDate, endDate } = req.query;

      let where = [];
      let params = [];
      let paramIdx = 1;

      if (action) {
        where.push(`al.action = $${paramIdx++}`);
        params.push(action);
      }
      if (user_id) {
        where.push(`al.user_id = $${paramIdx++}`);
        params.push(user_id);
      }
      if (startDate) {
        where.push(`al.created_at >= $${paramIdx++}`);
        params.push(startDate);
      }
      if (endDate) {
        where.push(`al.created_at <= $${paramIdx++}`);
        params.push(endDate);
      }

      const whereClause = where.length > 0 ? 'WHERE ' + where.join(' AND ') : '';

      const countResult = await db.query(
        `SELECT COUNT(*) FROM audit_log al ${whereClause}`,
        params
      );
      const total = parseInt(countResult.rows[0].count);

      const result = await db.query(
        `SELECT al.id, al.user_id, al.action, al.resource, al.ip_address, al.details, al.created_at,
                u.email as user_email, u.first_name, u.last_name
         FROM audit_log al
         LEFT JOIN users u ON al.user_id = u.id
         ${whereClause}
         ORDER BY al.created_at DESC
         LIMIT $${paramIdx++} OFFSET $${paramIdx++}`,
        [...params, limit, offset]
      );

      res.json({
        success: true,
        data: {
          logs: result.rows,
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
          },
        },
      });
    } catch (error) {
      console.error('Audit log error:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch audit log' });
    }
  }
);

/**
 * @route   PUT /api/v1/admin/change-password
 * @desc    Change admin's password
 * @access  Protected (super_admin, admin)
 */
router.put(
  '/change-password',
  requireRole('super_admin', 'admin'),
  async (req, res) => {
    try {
      const bcrypt = require('bcrypt');
      const { validatePasswordComplexity } = require('../controllers/authController');
      const { logAction, ACTIONS } = require('../services/auditLogger');
      const { current_password, new_password } = req.body;

      if (!current_password || !new_password) {
        return res.status(400).json({ success: false, error: 'Current password and new password are required' });
      }

      const complexityError = validatePasswordComplexity(new_password);
      if (complexityError) {
        return res.status(400).json({ success: false, error: complexityError });
      }

      const userResult = await db.query('SELECT password_hash FROM users WHERE id = $1', [req.user.id]);
      if (userResult.rows.length === 0) {
        return res.status(404).json({ success: false, error: 'User not found' });
      }

      const isMatch = await bcrypt.compare(current_password, userResult.rows[0].password_hash);
      if (!isMatch) {
        return res.status(400).json({ success: false, error: 'Current password is incorrect' });
      }

      const hashedPassword = await bcrypt.hash(new_password, 12);
      await db.query(
        'UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP, last_password_change = CURRENT_TIMESTAMP WHERE id = $2',
        [hashedPassword, req.user.id]
      );

      await logAction(req.user.id, ACTIONS.PASSWORD_CHANGE, 'users', {}, req);

      res.json({ success: true, data: { message: 'Password changed successfully' } });
    } catch (error) {
      console.error('Admin change password error:', error);
      res.status(500).json({ success: false, error: 'Failed to change password' });
    }
  }
);

module.exports = router;
