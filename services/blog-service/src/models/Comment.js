const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  blogId: {
    type: String,
    required: true
  },
  userId: {
    type: String,
    required: true
  },
  content: {
    type: String,
    required: true
  },
  likes: {
    type: Number,
    default: 0
  },
  replies: [{
    userId: String,
    content: String,
    createdAt: { type: Date, default: Date.now }
  }]
}, {
  timestamps: true
});

commentSchema.index({ blogId: 1, createdAt: -1 });

module.exports = mongoose.model('Comment', commentSchema);
