const mongoose = require('mongoose')

const certificateSchema = new mongoose.Schema({
  certificateId: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  volunteer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  volunteerName: { type: String, required: true },
  event: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: true,
  },
  eventTitle: { type: String, required: true },
  orgName: { type: String, required: true },
  eventDate: { type: Date, required: true },
  hoursCertified: { type: Number, default: 0 },
  issuedAt: { type: Date, default: Date.now },
}, { timestamps: true })

// One certificate per volunteer per event
certificateSchema.index({ volunteer: 1, event: 1 }, { unique: true })

module.exports = mongoose.model('Certificate', certificateSchema)