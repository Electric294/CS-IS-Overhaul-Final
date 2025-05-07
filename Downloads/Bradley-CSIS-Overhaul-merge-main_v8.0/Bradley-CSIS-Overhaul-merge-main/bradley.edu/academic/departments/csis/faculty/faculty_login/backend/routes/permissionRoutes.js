const express = require('express');
const router = express.Router();
const Permission = require('../models/Permission'); // Adjust path as needed
const auth = require('../middleware/authMiddleware');

// Assign permission
router.post('/', auth.authenticate, async (req, res) => {
  const { userId, sectionId, canEdit } = req.body;

  try {
    const permission = await Permission.findOneAndUpdate(
      { userId, sectionId },
      { canEdit },
      { upsert: true, new: true }
    );
    res.json({ message: 'Permission assigned successfully', permission });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to assign permission' });
  }
});

module.exports = router;
