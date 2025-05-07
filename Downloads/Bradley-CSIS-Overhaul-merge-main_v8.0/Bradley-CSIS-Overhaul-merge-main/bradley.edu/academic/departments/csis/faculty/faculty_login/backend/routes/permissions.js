const express = require('express');
const router = express.Router();
const Permission = require('../models/Permission');
const jwt = require('jsonwebtoken');

// 🔐 Middleware
function authenticate(req, res, next) {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ error: 'Missing token' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ error: 'Invalid token' });
  }
}

function isAdmin(req, res, next) {
  if (req.user?.role === 'admin') return next();
  return res.status(403).json({ error: 'Admins only' });
}

// ✍️ Assign edit permission to a user
router.post('/', authenticate, isAdmin, async (req, res) => {
  const { userId, sectionId, canEdit } = req.body;

  try {
    const existing = await Permission.findOne({ userId, sectionId });
    if (existing) {
      existing.canEdit = canEdit;
      await existing.save();
      return res.json({ message: 'Permission updated' });
    }

    const permission = new Permission({ userId, sectionId, canEdit });
    await permission.save();
    res.status(201).json({ message: 'Permission granted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to assign permission' });
  }
});

module.exports = router;
