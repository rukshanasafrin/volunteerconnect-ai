const mongoose = require('mongoose')

const organizationSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true
  },
  phone: {
    type: String,
    required: true
  },
  location: {
    type: String,
    required: true
  },
  role: {
    type: String,
    default: 'org'
  },

  // Organization specific
  orgName: { type: String, required: true },
  orgType: {
    type: String,
    enum: ['ngo', 'college', 'corporate', 'government', 'community', 'other'],
    required: true
  },
  website: { type: String, default: '' },
  description: { type: String, required: true },

  // Verification
  isVerified: { type: Boolean, default: false },
  verifiedAt: { type: Date },

}, { timestamps: true })

organizationSchema.index({ isVerified: 1 })
organizationSchema.index({ location: 1 })

module.exports = mongoose.model('Organization', organizationSchema)