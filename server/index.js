const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const db = require('./config/database');
const authRoutes = require('./routes/auth');
const contentRoutes = require('./routes/content');
const inquiryRoutes = require('./routes/inquiries');
const childrenRoutes = require('./routes/children');
const parentsRoutes = require('./routes/parents');
const portalRoutes = require('./routes/portal');
const kioskRoutes = require('./routes/kiosk');
const attendanceRoutes = require('./routes/attendance');
const employeesRoutes = require('./routes/employees');
const timeclockRoutes = require('./routes/timeclock');
const hrRoutes = require('./routes/hr');
const galleryRoutes = require('./routes/gallery');
const testimonialsRoutes = require('./routes/testimonials');
const programsRoutes = require('./routes/programs');
const contactRoutes = require('./routes/contact');

const app = express();

// Middleware
const allowedOrigins = [
  process.env.CLIENT_URL,
  'https://scribbles-learning.com',
  'https://www.scribbles-learning.com',
  'https://scribbles-learning-center.vercel.app',
  'http://localhost:3000',
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true
}));
app.use(express.json());

// API Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/content', contentRoutes);
app.use('/api/v1/inquiries', inquiryRoutes);
app.use('/api/v1/children', childrenRoutes);
app.use('/api/v1/parents', parentsRoutes);
app.use('/api/v1/portal', portalRoutes);
app.use('/api/v1/kiosk', kioskRoutes);
app.use('/api/v1/attendance', attendanceRoutes);
app.use('/api/v1/employees', employeesRoutes);
app.use('/api/v1/timeclock', timeclockRoutes);
app.use('/api/v1/hr', hrRoutes);
app.use('/api/v1/gallery', galleryRoutes);
app.use('/api/v1/testimonials', testimonialsRoutes);
app.use('/api/v1/programs', programsRoutes);
app.use('/api/v1/contact', contactRoutes);

// Legacy routes (for backwards compatibility)
app.use('/api/auth', authRoutes);
app.use('/api/content', contentRoutes);
app.use('/api/inquiries', inquiryRoutes);

// Health check with database connectivity
app.get('/api/health', async (req, res) => {
  try {
    await db.query('SELECT 1');
    res.json({ status: 'ok', database: 'connected', timestamp: new Date().toISOString() });
  } catch (err) {
    res.status(500).json({ status: 'error', database: 'disconnected', timestamp: new Date().toISOString() });
  }
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;
