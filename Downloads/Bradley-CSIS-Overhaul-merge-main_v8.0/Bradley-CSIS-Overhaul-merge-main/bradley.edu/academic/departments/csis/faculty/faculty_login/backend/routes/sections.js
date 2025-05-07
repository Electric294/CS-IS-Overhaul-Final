const express = require('express');
const router = express.Router();
const Section = require('../models/Section');
const Permission = require('../models/Permission');
const User = require('../models/User');

// 🔐 Middleware to authenticate JWT and set req.user
const jwt = require('jsonwebtoken');
function authenticate(req, res, next) {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ error: 'Missing token' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(403).json({ error: 'Invalid token' });
  }
}

// 🔐 Admin-only middleware
function isAdmin(req, res, next) {
  if (req.user?.role === 'admin') return next();
  return res.status(403).json({ error: 'Admins only' });
}

// 📄 GET all sections (admin only)
router.get('/', authenticate, isAdmin, async (req, res) => {
  try {
    const sections = await Section.find();
    res.json(sections);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// ✅ GET editable sections for a user
router.get('/editable', async (req, res) => {
  try {
    const userId = req.query.userId;
    const user = await User.findById(userId);

    if (user?.role === 'admin') {
      const sections = await Section.find();
      return res.json(sections);
    }

    const permissions = await Permission.find({ userId, canEdit: true });
    const sectionIds = permissions.map(p => p.sectionId);
    const sections = await Section.find({ _id: { $in: sectionIds } });

    res.json(sections);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// ✍️ POST create a section
router.post('/', authenticate, async (req, res) => {
  try {
    const { title, content, pageId } = req.body;

    if (!title || !content) {
      return res.status(400).json({ error: 'Title and content are required.' });
    }

    const userId = req.user.id;
    const user = await User.findById(userId);

    const section = new Section({ title, content, pageId });
    await section.save();

    if (user.role !== 'admin') {
      await Permission.create({ userId, sectionId: section._id, canEdit: true });
    }

    res.status(201).json(section);
  } catch (err) {
    console.error('Section creation error:', err);
    res.status(400).json({ error: 'Failed to create section' });
  }
});


// 📝 PUT update a section
router.put('/:id', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);
    const sectionId = req.params.id;

    if (user.role !== 'admin') {
      const permission = await Permission.findOne({ userId, sectionId, canEdit: true });
      if (!permission) return res.status(403).json({ error: 'No permission to edit' });
    }

    const updated = await Section.findByIdAndUpdate(sectionId, req.body, { new: true });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: 'Update failed' });
  }
});

// ❌ DELETE section
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);

    if (user.role !== 'admin') {
      const permission = await Permission.findOne({ userId, sectionId: req.params.id, canEdit: true });
      if (!permission) return res.status(403).json({ error: 'No permission to delete' });
    }

    await Section.findByIdAndDelete(req.params.id);
    await Permission.deleteMany({ sectionId: req.params.id });
    res.json({ message: 'Section deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Delete failed' });
  }
});

module.exports = router;
