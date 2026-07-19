const mongoose = require('mongoose')

const userSchema = new mongoose.Schema({
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
    enum: ['volunteer', 'admin'],
    default: 'volunteer'
  },

  // Volunteer specific
  skills: [String],
  availability: {
    type: String,
    enum: ['weekdays', 'weekends', 'both', 'flexible'],
  },
  languages: [String],

  // Stats
  hoursCompleted: { type: Number, default: 0 },
  eventsAttended: { type: Number, default: 0 },
  performanceScore: { type: Number, default: 0 },

}, { timestamps: true })


userSchema.index({ location: 1 })
userSchema.index({ skills: 1 })
userSchema.index({ role: 1 })

module.exports = mongoose.model('User', userSchema)