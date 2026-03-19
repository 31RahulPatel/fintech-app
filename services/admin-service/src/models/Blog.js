const mongoose = require('mongoose');

const blogSchema = new mongoose.Schema({
  title: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  content: { type: String, required: true },
  excerpt: { type: String },
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  category: { type: String, required: true },
  tags: [String],
  featuredImage: { type: String },
  status: { type: String, enum: ['draft', 'published', 'archived', 'flagged'], default: 'draft' },
  statusReason: { type: String },
  statusUpdatedAt: { type: Date },
  views: { type: Number, default: 0 },
  likes: { type: Number, default: 0 },
  commentsCount: { type: Number, default: 0 },
  isFeatured: { type: Boolean, default: false },
  publishedAt: { type: Date }
}, { timestamps: true });

blogSchema.index({ title: 'text', content: 'text' });
blogSchema.index({ category: 1 });
blogSchema.index({ status: 1 });
blogSchema.index({ author: 1 });

module.exports = mongoose.model('Blog', blogSchema);
