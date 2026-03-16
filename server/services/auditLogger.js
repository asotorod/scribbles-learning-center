const db = require('../config/database');

/**
 * Log an action to the audit_log table
 * @param {string|null} userId - UUID of the user performing the action
 * @param {string} action - Action type (e.g., LOGIN_SUCCESS, LOGIN_FAILED)
 * @param {string} resource - Resource being acted upon
 * @param {object} details - Additional details (stored as JSONB)
 * @param {object} req - Express request object (for IP and user-agent)
 */
const logAction = async (userId, action, resource, details = {}, req = null) => {
  try {
    const ipAddress = req
      ? req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.ip
      : null;
    const userAgent = req ? req.headers['user-agent'] : null;

    await db.query(
      `INSERT INTO audit_log (user_id, action, resource, ip_address, user_agent, details)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [userId, action, resource, ipAddress, userAgent, JSON.stringify(details)]
    );
  } catch (error) {
    console.error('Audit log error:', error.message);
  }
};

// Action constants
const ACTIONS = {
  LOGIN_SUCCESS: 'LOGIN_SUCCESS',
  LOGIN_FAILED: 'LOGIN_FAILED',
  LOGOUT: 'LOGOUT',
  PASSWORD_CHANGE: 'PASSWORD_CHANGE',
  CHILD_CREATE: 'CHILD_CREATE',
  CHILD_UPDATE: 'CHILD_UPDATE',
  CHILD_DELETE: 'CHILD_DELETE',
  PARENT_CREATE: 'PARENT_CREATE',
  PARENT_UPDATE: 'PARENT_UPDATE',
  PARENT_DELETE: 'PARENT_DELETE',
  EMPLOYEE_CREATE: 'EMPLOYEE_CREATE',
  EMPLOYEE_UPDATE: 'EMPLOYEE_UPDATE',
  EMPLOYEE_DELETE: 'EMPLOYEE_DELETE',
  CONTENT_UPDATE: 'CONTENT_UPDATE',
  ATTENDANCE_MODIFY: 'ATTENDANCE_MODIFY',
  ADMIN_ADJUSTMENT: 'ADMIN_ADJUSTMENT',
};

module.exports = { logAction, ACTIONS };
