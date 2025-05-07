const mongoose = require('mongoose');

const pageSchema = new mongoose.Schema({
  title: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  sections: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Section' }]
});

module.exports = mongoose.model('Page', pageSchema);
