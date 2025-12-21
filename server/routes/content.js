const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const data = require('../data/content.json');

const router = express.Router();

// In-memory storage for demo
let contentData = JSON.parse(JSON.stringify(data));

// Get all content (public)
router.get('/', (req, res) => {
  res.json(contentData);
});

// Get specific section
router.get('/:section', (req, res) => {
  const { section } = req.params;
  if (contentData[section]) {
    res.json(contentData[section]);
  } else {
    res.status(404).json({ error: 'Section not found' });
  }
});

// Update content (protected)
router.put('/:section', authenticateToken, (req, res) => {
  const { section } = req.params;
  const updates = req.body;

  if (!contentData[section]) {
    return res.status(404).json({ error: 'Section not found' });
  }

  contentData[section] = { ...contentData[section], ...updates };
  res.json({ message: 'Content updated', data: contentData[section] });
});

// Update specific item in array
router.put('/:section/:id', authenticateToken, (req, res) => {
  const { section, id } = req.params;
  const updates = req.body;

  if (!contentData[section] || !Array.isArray(contentData[section])) {
    return res.status(404).json({ error: 'Section not found or not an array' });
  }

  const index = contentData[section].findIndex(item => item.id === parseInt(id));
  if (index === -1) {
    return res.status(404).json({ error: 'Item not found' });
  }

  contentData[section][index] = { ...contentData[section][index], ...updates };
  res.json({ message: 'Item updated', data: contentData[section][index] });
});

// Add new item
router.post('/:section', authenticateToken, (req, res) => {
  const { section } = req.params;
  const newItem = req.body;

  if (!contentData[section] || !Array.isArray(contentData[section])) {
    return res.status(404).json({ error: 'Section not found or not an array' });
  }

  const newId = Math.max(...contentData[section].map(item => item.id), 0) + 1;
  const itemWithId = { ...newItem, id: newId };
  contentData[section].push(itemWithId);

  res.status(201).json({ message: 'Item added', data: itemWithId });
});

// Delete item
router.delete('/:section/:id', authenticateToken, (req, res) => {
  const { section, id } = req.params;

  if (!contentData[section] || !Array.isArray(contentData[section])) {
    return res.status(404).json({ error: 'Section not found or not an array' });
  }

  const index = contentData[section].findIndex(item => item.id === parseInt(id));
  if (index === -1) {
    return res.status(404).json({ error: 'Item not found' });
  }

  contentData[section].splice(index, 1);
  res.json({ message: 'Item deleted' });
});

module.exports = router;
