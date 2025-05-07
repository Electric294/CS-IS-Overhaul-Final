// backend/routes/adminRoutes.js

const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Section = require('../models/Section');
const Permission = require('../models/Permission');
const auth = require('../middleware/auth');

// GET all users (admin only)
router.get('/users', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }
    const users = await User.find({}, '_id username');
    res.json(users);
  } catch (err) {
    console.error('Error fetching users:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET all sections (admin only)
router.get('/sections', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }
    const sections = await Section.find({}, '_id title');
    res.json(sections);
  } catch (err) {
    console.error('Error fetching sections:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST to assign permission to user
router.post('/permissions', auth, async (req, res) => {
  const { userId, sectionId, canEdit } = req.body;
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    let permission = await Permission.findOne({ userId, sectionId });
    if (permission) {
      permission.canEdit = canEdit;
      await permission.save();
    } else {
      permission = new Permission({ userId, sectionId, canEdit });
      await permission.save();
    }

    res.json({ message: 'Permission updated successfully' });
  } catch (err) {
    console.error('Error assigning permission:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
