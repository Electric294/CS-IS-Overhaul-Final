const express = require('express');
const fs = require('fs');
const path = require('path');
const router = express.Router();
const Section = require('../models/Section');
//const Content = require('../models/Content'); // Assuming Content model exists
const auth = require('../middleware/auth');

const BASE_DIR = path.resolve(__dirname, '../../'); // Adjust based on actual location
console.log('BASE_DIR:', BASE_DIR); // Debug log to check the resolved base directory

// Utility function to check if file is whitelisted in DB
async function isFileAllowed(fileName) {
  const section = await Section.findOne({ fileName });
  return !!section;
}

// GET file content
router.get('/:fileName', auth, async (req, res) => {
  const fileName = req.params.fileName;
  const filePath = path.join(BASE_DIR, fileName);

  if (!filePath.startsWith(BASE_DIR)) return res.status(403).send('Access denied.');

  console.log(`Attempting to read file: ${filePath}`); // Debug log to check the file path

  try {
    const allowed = await isFileAllowed(fileName);
    if (!allowed) return res.status(403).send('File not allowed.');

    if (!fs.existsSync(filePath)) {
      return res.status(404).send('File does not exist.');
    }

    fs.readFile(filePath, 'utf8', (err, data) => {
      if (err) return res.status(500).send('Failed to read file.');
      res.send(data);
    });
  } catch (error) {
    console.error(error);
    res.status(500).send('Server error.');
  }
});

// Get content by section _id (replacing pageId with _id)
router.get('/section/:sectionId', async (req, res) => {
  try {
    const section = await Section.findById(req.params.sectionId); // Fetch by MongoDB _id

    if (!section) {
      return res.status(404).json({ error: 'Section not found' });
    }

    res.json(section);
  } catch (err) {
    console.error('Error fetching section by _id:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT to update file content
router.put('/:fileName', auth, async (req, res) => {
  const fileName = req.params.fileName;
  const filePath = path.join(BASE_DIR, fileName);

  if (!filePath.startsWith(BASE_DIR)) return res.status(403).send('Access denied.');

  console.log(`Attempting to write to file: ${filePath}`); // Debug log to check the file path

  try {
    const allowed = await isFileAllowed(fileName);
    if (!allowed) return res.status(403).send('File not allowed.');

    if (!fs.existsSync(filePath)) {
      return res.status(404).send('File does not exist.');
    }

    fs.writeFile(filePath, req.body.content, 'utf8', (err) => {
      if (err) return res.status(500).send('Failed to write file.');
      res.send({ message: 'File updated successfully.' });
    });
  } catch (error) {
    console.error(error);
    res.status(500).send('Server error.');
  }
});

module.exports = router;
