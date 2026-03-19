const mongoose = require('mongoose');

const watchlistSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    unique: true
  },
  stocks: [{
    type: String,
    uppercase: true
  }]
}, {
  timestamps: true
});

watchlistSchema.index({ userId: 1 });

module.exports = mongoose.model('Watchlist', watchlistSchema);
