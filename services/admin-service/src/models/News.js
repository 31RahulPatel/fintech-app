const mongoose = require('mongoose');

const newsSchema = new mongoose.Schema({
  title: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  content: { type: String, required: true },
  summary: { type: String },
  category: { 
    type: String, 
    enum: ['india', 'global', 'market', 'global_market', 'economy', 'stocks', 'crypto', 'commodities'],
    required: true 
  },
  source: { type: String },
  sourceUrl: { type: String },
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  imageUrl: { type: String },
  tags: [String],
  status: { type: String, enum: ['draft', 'published', 'archived'], default: 'published' },
  views: { type: Number, default: 0 },
  isFeatured: { type: Boolean, default: false },
  isTrending: { type: Boolean, default: false },
  publishedAt: { type: Date, default: Date.now }
}, { timestamps: true });

newsSchema.index({ title: 'text', content: 'text' });
newsSchema.index({ category: 1 });
newsSchema.index({ status: 1 });
newsSchema.index({ publishedAt: -1 });

module.exports = mongoose.model('News', newsSchema);
