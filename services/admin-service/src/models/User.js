const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String },
  cognitoId: { type: String },
  role: { type: String, enum: ['user', 'admin', 'superadmin'], default: 'user' },
  status: { type: String, enum: ['active', 'inactive', 'suspended'], default: 'active' },
  statusReason: { type: String },
  statusUpdatedAt: { type: Date },
  profile: {
    firstName: { type: String },
    lastName: { type: String },
    phone: { type: String },
    avatar: { type: String },
    dateOfBirth: { type: Date },
    gender: { type: String, enum: ['male', 'female', 'other'] },
    address: {
      street: String,
      city: String,
      state: String,
      country: String,
      pincode: String
    }
  },
  subscription: {
    plan: { type: String, enum: ['free', 'premium'], default: 'free' },
    billingCycle: { type: String, enum: ['monthly', 'yearly'] },
    validFrom: { type: Date },
    validTo: { type: Date },
    features: [String],
    updatedAt: { type: Date }
  },
  preferences: {
    theme: { type: String, default: 'light' },
    currency: { type: String, default: 'INR' },
    language: { type: String, default: 'en' },
    notifications: {
      email: { type: Boolean, default: true },
      push: { type: Boolean, default: true },
      sms: { type: Boolean, default: false }
    }
  },
  lastLogin: { type: Date },
  loginCount: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
