const express = require('express');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// In-memory storage for demo
let inquiries = [
  {
    id: 1,
    parentName: 'Sarah Johnson',
    email: 'sarah.j@email.com',
    phone: '(201) 555-0123',
    childName: 'Emma',
    childAge: '2 years',
    program: 'toddler',
    message: 'We are moving to Edgewater next month and looking for quality daycare for our daughter. Would love to schedule a tour!',
    status: 'new',
    createdAt: '2024-12-15T10:30:00Z',
    replies: []
  },
  {
    id: 2,
    parentName: 'Michael Chen',
    email: 'mchen@email.com',
    phone: '(201) 555-0456',
    childName: 'Lucas',
    childAge: '6 months',
    program: 'infant',
    message: 'Interested in your infant program. Do you have any availability starting January?',
    status: 'replied',
    createdAt: '2024-12-10T14:15:00Z',
    replies: [
      {
        id: 1,
        message: 'Thank you for your interest! We currently have 2 spots available in our infant program starting January. Would you like to schedule a tour?',
        sentAt: '2024-12-11T09:00:00Z',
        sentBy: 'Admin'
      }
    ]
  }
];

// Get all inquiries (protected)
router.get('/', authenticateToken, (req, res) => {
  const sortedInquiries = [...inquiries].sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
  );
  res.json(sortedInquiries);
});

// Get single inquiry (protected)
router.get('/:id', authenticateToken, (req, res) => {
  const inquiry = inquiries.find(i => i.id === parseInt(req.params.id));
  if (!inquiry) {
    return res.status(404).json({ error: 'Inquiry not found' });
  }
  res.json(inquiry);
});

// Submit new inquiry (public)
router.post('/', (req, res) => {
  const { parentName, email, phone, childName, childAge, program, message } = req.body;

  // Validation
  if (!parentName || !email || !phone || !message) {
    return res.status(400).json({ error: 'Required fields missing' });
  }

  const newInquiry = {
    id: inquiries.length + 1,
    parentName,
    email,
    phone,
    childName: childName || '',
    childAge: childAge || '',
    program: program || 'general',
    message,
    status: 'new',
    createdAt: new Date().toISOString(),
    replies: []
  };

  inquiries.push(newInquiry);
  res.status(201).json({ message: 'Inquiry submitted successfully', id: newInquiry.id });
});

// Reply to inquiry (protected)
router.post('/:id/reply', authenticateToken, (req, res) => {
  const { message } = req.body;
  const inquiry = inquiries.find(i => i.id === parseInt(req.params.id));

  if (!inquiry) {
    return res.status(404).json({ error: 'Inquiry not found' });
  }

  if (!message) {
    return res.status(400).json({ error: 'Reply message is required' });
  }

  const reply = {
    id: inquiry.replies.length + 1,
    message,
    sentAt: new Date().toISOString(),
    sentBy: req.user.email
  };

  inquiry.replies.push(reply);
  inquiry.status = 'replied';

  res.json({ message: 'Reply sent successfully', reply });
});

// Update inquiry status (protected)
router.patch('/:id/status', authenticateToken, (req, res) => {
  const { status } = req.body;
  const inquiry = inquiries.find(i => i.id === parseInt(req.params.id));

  if (!inquiry) {
    return res.status(404).json({ error: 'Inquiry not found' });
  }

  const validStatuses = ['new', 'read', 'replied', 'archived'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }

  inquiry.status = status;
  res.json({ message: 'Status updated', inquiry });
});

// Delete inquiry (protected)
router.delete('/:id', authenticateToken, (req, res) => {
  const index = inquiries.findIndex(i => i.id === parseInt(req.params.id));

  if (index === -1) {
    return res.status(404).json({ error: 'Inquiry not found' });
  }

  inquiries.splice(index, 1);
  res.json({ message: 'Inquiry deleted' });
});

module.exports = router;
