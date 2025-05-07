const mongoose = require('mongoose');
const Permissoin = require('../models/Permission');
const express = require('express');
const router = express.Router();
const Section = require('../models/Section'); // Adjust path as needed
const auth = require('../middleware/auth');
const { authenticate, isAdmin } = require('../middleware/authMiddleware');

// Get all sections

router.get('/', authenticate, async (req, res) => {
  try {
    console.log('Decoded user in route:', req.user);

    // Step 1: Get the user's permissions
    const userPermissions = await Permission.find({ userId: req.user.id, canEdit: true });
    console.log('Permissions:', userPermissions);

    // Step 2: Extract the section IDs that the user has permission to edit
    const sectionIds = userPermissions
      .map(permission => permission.sectionId)
      .filter(id => !id);//remove null/undefined

    console.log('Section IDs to search for:', sectionIds);

    // Step 3: Fetch the sections the user has permission to edit
    const sections = await Section.find({ _id: { $in: sectionIds } });
    console.log('Found sections:', sections);

    // Step 4: Return the sections
    res.json(sections);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch sections' });
  }
});

// Create a new section
router.post('/', auth, async (req, res) => {
  try {
    const { title, content, pageId } = req.body;

    if (!title || !content || !pageId) {
      return res.status(400).json({ error: 'Title, content, and pageId are required' });
    }

    const newSection = new Section({ title, content, pageId });
    await newSection.save();

    res.status(201).json(newSection);
  } catch (err) {
    console.error('Error creating section:', err);
    res.status(500).json({ error: 'Failed to create section' });
  }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const sectionId = req.params.id;
    const section = await Section.findByIdAndDelete(sectionId);
    if (!section) {
      return res.status(404).json({ error: 'Section not found' });
    }
    res.json({ message: 'Section deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete section' });
  }
});



router.put('/:id', authenticate, async (req, res) => {
  try {
    const { title, content } = req.body;
    const sectionId = req.params.id;
    const userId = req.user.id; // from JWT token

    console.log(`🔧 PUT /${sectionId} by user ${userId}`);

    const section = await Section.findById(sectionId);
    if (!section) {
      console.log('❌ Section not found');
      return res.status(404).json({ error: 'Section not found' });
    }

    const isAdmin = req.user.role === 'admin';
    let hasPermission = false;

    if (!isAdmin) {
      const permission = await Permission.findOne({
        sectionId: mongoose.Types.ObjectId(sectionId),
        userId: mongoose.Types.ObjectId(userId),
      });

      console.log("🔎 Permission lookup:", permission);

      if (permission && permission.canEdit === true) {
        hasPermission = true;
      }
    }

    if (!isAdmin && !hasPermission) {
      console.log('🚫 User is not admin and lacks edit permission');
      return res.status(403).json({ error: 'You do not have permission to edit this section' });
    }

    // Apply the edits
    section.title = title;
    section.content = content;
    const updated = await section.save();

    console.log('✅ Section updated');
    res.json(updated);
  } catch (err) {
    console.error('🔥 Error in PUT /:id', err);
    res.status(500).json({ error: 'Failed to update section' });
  }
});

// GET /api/content/editable
router.get('/editable', authenticate, async (req, res) => {
  try {
    const userId = req.user.userId;
    console.log("🔐 Authenticated userId:", userId);

    const permissions = await Permission.find({ userId, canEdit: true });
    console.log("🧾 Permissions found:", permissions);

    const sectionIds = permissions.map(p => p.sectionId);
    if (sectionIds.length === 0) {
      return res.json([]); // No editable sections
    }

    console.log("🔍 Fetching sections for IDs:", sectionIds);
    const sections = await Section.find({ _id: { $in: sectionIds } });
    console.log("📄 Sections returned:", sections);

    res.json(sections);
  } catch (err) {
    console.error('❌ Error in /editable route:', err);
    res.status(500).json({ error: 'Server error' });
  }
});



module.exports = router;
