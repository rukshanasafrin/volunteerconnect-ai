const mongoose = require('mongoose')

const eventSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  category: {
    type: String,
    enum: ['education', 'environment', 'health', 'community', 'disaster relief', 'animal welfare', 'other'],
    required: true
  },
  skillsRequired: [String],
  location: {
    type: String,
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  duration: {
    type: String,
    required: true
  },
  volunteersNeeded: {
    type: Number,
    required: true
  },
  organization: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: true
  },
  orgName: {
    type: String,
    required: true
  },
  registeredVolunteers: [
    {
      volunteer: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      name: String,
      email: String,
      phone: String,
      skills: [String],
      status: {
        type: String,
        enum: ['applied', 'approved', 'rejected'],
        default: 'applied'
      },
      registeredAt: { type: Date, default: Date.now },
      hoursContributed : { type: Number, default : 0},
      punctualityScore : { type : Number, default: 5}
    }
  ],
  status: {
    type: String,
    enum: ['upcoming', 'ongoing', 'completed', 'cancelled'],
    default: 'upcoming'
  },
  feedback: [
  {
    volunteer: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    comment: String,
    rating: { type: Number, min: 1, max: 5 },
    sentiment: { type: String, enum: ['Positive', 'Negative', 'Neutral'], default: 'Neutral' },
    sentimentScore: { type: Number, default: 50 },
    sentimentKeywords: [String],
    sentimentSummary: String,
    submittedAt: { type: Date, default: Date.now }
  }
]
}, { timestamps: true })

eventSchema.index({ status: 1 })
eventSchema.index({ date: 1 })
eventSchema.index({ organization: 1 })
eventSchema.index({ category: 1 })

module.exports = mongoose.model('Event', eventSchema)