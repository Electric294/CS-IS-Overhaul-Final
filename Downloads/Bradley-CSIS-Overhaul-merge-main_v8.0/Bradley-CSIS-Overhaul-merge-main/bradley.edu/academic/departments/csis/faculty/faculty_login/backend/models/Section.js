const mongoose = require('mongoose');

const sectionSchema = new mongoose.Schema({
  title: { type: String, required: true },
  content: { type: String, required: true },
  pageId: { type: mongoose.Schema.Types.ObjectId, ref: 'Page', required: true }
});

module.exports = mongoose.model('Section', sectionSchema);
