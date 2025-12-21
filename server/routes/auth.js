const express = require('express');
const jwt = require('jsonwebtoken');
const { JWT_SECRET, authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Demo admin credentials
const DEMO_ADMIN = {
  id: 1,
  email: 'admin@scribbleslearning.com',
  name: 'Admin User',
  role: 'admin'
};

const DEMO_PASSWORD = 'scribbles2024';

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (email !== DEMO_ADMIN.email || password !== DEMO_PASSWORD) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = jwt.sign(
      { id: DEMO_ADMIN.id, email: DEMO_ADMIN.email, role: DEMO_ADMIN.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: {
        id: DEMO_ADMIN.id,
        email: DEMO_ADMIN.email,
        name: DEMO_ADMIN.name,
        role: DEMO_ADMIN.role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Verify token
router.get('/verify', authenticateToken, (req, res) => {
  res.json({ valid: true, user: req.user });
});

// Get current user
router.get('/me', authenticateToken, (req, res) => {
  res.json({
    id: DEMO_ADMIN.id,
    email: DEMO_ADMIN.email,
    name: DEMO_ADMIN.name,
    role: DEMO_ADMIN.role
  });
});

module.exports = router;
