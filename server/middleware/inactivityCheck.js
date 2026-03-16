const db = require('../config/database');

const ADMIN_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes

/**
 * Middleware that checks admin inactivity and updates last_activity.
 * Must be used AFTER verifyToken.
 */
const checkInactivity = async (req, res, next) => {
  if (!req.user) return next();

  try {
    const isAdmin = ['super_admin', 'admin'].includes(req.user.role);

    if (isAdmin) {
      const result = await db.query(
        'SELECT last_activity FROM users WHERE id = $1',
        [req.user.id]
      );
      const lastActivity = result.rows[0]?.last_activity;

      if (lastActivity) {
        const elapsed = Date.now() - new Date(lastActivity).getTime();
        if (elapsed > ADMIN_TIMEOUT_MS) {
          return res.status(401).json({
            success: false,
            error: 'Session expired due to inactivity. Please log in again.',
            code: 'INACTIVITY_TIMEOUT',
          });
        }
      }
    }

    // Update last_activity for all authenticated users
    await db.query(
      'UPDATE users SET last_activity = CURRENT_TIMESTAMP WHERE id = $1',
      [req.user.id]
    );
  } catch (error) {
    console.error('Inactivity check error:', error.message);
  }

  next();
};

module.exports = { checkInactivity };
