const bcrypt = require('bcrypt');
const db = require('../config/database');
const {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken
} = require('../middleware/auth');

const SALT_ROUNDS = 10;

/**
 * Register a new user (admin use only)
 * POST /api/v1/auth/register
 */
const register = async (req, res) => {
  try {
    const { email, password, firstName, lastName, role, phone } = req.body;

    // Check if user already exists
    const existingUser = await db.query(
      'SELECT id FROM users WHERE email = $1',
      [email.toLowerCase()]
    );

    if (existingUser.rows.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Email already registered'
      });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    // Create user
    const result = await db.query(
      `INSERT INTO users (email, password_hash, role, first_name, last_name, phone)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, email, role, first_name, last_name, phone, created_at`,
      [email.toLowerCase(), passwordHash, role || 'parent', firstName, lastName, phone]
    );

    const user = result.rows[0];

    res.status(201).json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          firstName: user.first_name,
          lastName: user.last_name,
          phone: user.phone,
          createdAt: user.created_at
        }
      }
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to register user'
    });
  }
};

/**
 * Login user
 * POST /api/v1/auth/login
 */
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user by email
    const result = await db.query(
      `SELECT id, email, password_hash, role, first_name, last_name, phone, is_active
       FROM users WHERE email = $1`,
      [email.toLowerCase()]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password'
      });
    }

    const user = result.rows[0];

    // Check if account is active
    if (!user.is_active) {
      return res.status(401).json({
        success: false,
        error: 'Account is deactivated'
      });
    }

    // Verify password
    const validPassword = await bcrypt.compare(password, user.password_hash);

    if (!validPassword) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password'
      });
    }

    // Generate tokens
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    // Calculate refresh token expiry (7 days)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    // Store refresh token in database
    await db.query(
      `INSERT INTO refresh_tokens (user_id, token, expires_at)
       VALUES ($1, $2, $3)`,
      [user.id, refreshToken, expiresAt]
    );

    // Update last login
    await db.query(
      'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1',
      [user.id]
    );

    res.json({
      success: true,
      data: {
        accessToken,
        refreshToken,
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          firstName: user.first_name,
          lastName: user.last_name,
          phone: user.phone
        }
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      error: 'Login failed'
    });
  }
};

/**
 * Refresh access token
 * POST /api/v1/auth/refresh
 */
const refresh = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        error: 'Refresh token required'
      });
    }

    // Verify refresh token JWT
    let decoded;
    try {
      decoded = verifyRefreshToken(refreshToken);
    } catch (error) {
      return res.status(401).json({
        success: false,
        error: 'Invalid or expired refresh token'
      });
    }

    // Check if refresh token exists in database and is not expired
    const tokenResult = await db.query(
      `SELECT rt.id, rt.user_id, u.email, u.role, u.first_name, u.last_name, u.is_active
       FROM refresh_tokens rt
       JOIN users u ON rt.user_id = u.id
       WHERE rt.token = $1 AND rt.expires_at > CURRENT_TIMESTAMP`,
      [refreshToken]
    );

    if (tokenResult.rows.length === 0) {
      return res.status(401).json({
        success: false,
        error: 'Invalid or expired refresh token'
      });
    }

    const tokenData = tokenResult.rows[0];

    // Check if user is still active
    if (!tokenData.is_active) {
      return res.status(401).json({
        success: false,
        error: 'Account is deactivated'
      });
    }

    // Delete old refresh token
    await db.query('DELETE FROM refresh_tokens WHERE id = $1', [tokenData.id]);

    // Generate new token pair
    const user = {
      id: tokenData.user_id,
      email: tokenData.email,
      role: tokenData.role
    };

    const newAccessToken = generateAccessToken(user);
    const newRefreshToken = generateRefreshToken(user);

    // Calculate new refresh token expiry
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    // Store new refresh token
    await db.query(
      `INSERT INTO refresh_tokens (user_id, token, expires_at)
       VALUES ($1, $2, $3)`,
      [user.id, newRefreshToken, expiresAt]
    );

    res.json({
      success: true,
      data: {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
        user: {
          id: tokenData.user_id,
          email: tokenData.email,
          role: tokenData.role,
          firstName: tokenData.first_name,
          lastName: tokenData.last_name
        }
      }
    });
  } catch (error) {
    console.error('Refresh error:', error);
    res.status(500).json({
      success: false,
      error: 'Token refresh failed'
    });
  }
};

/**
 * Logout user (invalidate refresh token)
 * POST /api/v1/auth/logout
 */
const logout = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (refreshToken) {
      // Delete the refresh token from database
      await db.query('DELETE FROM refresh_tokens WHERE token = $1', [refreshToken]);
    }

    res.json({
      success: true,
      data: { message: 'Logged out successfully' }
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      error: 'Logout failed'
    });
  }
};

/**
 * Get current user info
 * GET /api/v1/auth/me
 */
const me = async (req, res) => {
  try {
    // req.user is set by verifyToken middleware
    const result = await db.query(
      `SELECT id, email, role, first_name, last_name, phone, created_at, last_login
       FROM users WHERE id = $1`,
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    const user = result.rows[0];

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          firstName: user.first_name,
          lastName: user.last_name,
          phone: user.phone,
          createdAt: user.created_at,
          lastLogin: user.last_login
        }
      }
    });
  } catch (error) {
    console.error('Me error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get user info'
    });
  }
};

module.exports = {
  register,
  login,
  refresh,
  logout,
  me
};
