const mongoose = require('mongoose');

const bookmarkSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    unique: true
  },
  newsIds: [{
    type: String
  }]
}, {
  timestamps: true
});

bookmarkSchema.index({ userId: 1 });

module.exports = mongoose.model('Bookmark', bookmarkSchema);
