const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  blogId: { type: mongoose.Schema.Types.ObjectId, ref: 'Blog', required: true },
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  content: { type: String, required: true },
  parentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Comment' },
  status: { type: String, enum: ['approved', 'pending', 'spam', 'deleted'], default: 'approved' },
  statusReason: { type: String },
  statusUpdatedAt: { type: Date },
  likes: { type: Number, default: 0 }
}, { timestamps: true });

commentSchema.index({ blogId: 1 });
commentSchema.index({ author: 1 });
commentSchema.index({ status: 1 });

module.exports = mongoose.model('Comment', commentSchema);
