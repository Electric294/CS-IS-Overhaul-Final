const mongoose = require('mongoose');

const permissionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  sectionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Section', required: true },
  canEdit: { type: Boolean, default: false }
});

module.exports = mongoose.model('Permission', permissionSchema);
