const Event = require('../models/Event')
const Organization = require('../models/Organization')
const User = require('../models/User')

// -------- CREATE EVENT (Org) --------
const createEvent = async (req, res) => {
  try {
    const { title, description, category, skillsRequired, location, date, duration, volunteersNeeded } = req.body

    const org = await Organization.findById(req.user.id)
    if (!org) return res.status(404).json({ message: 'Organization not found' })

    const event = await Event.create({
      title,
      description,
      category,
      skillsRequired: skillsRequired ? skillsRequired.split(',').map(s => s.trim()) : [],
      location,
      date,
      duration,
      volunteersNeeded,
      organization: org._id,
      orgName: org.orgName,
    })

    res.status(201).json({ message: 'Event created successfully', event })
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message })
  }
}

// -------- GET ALL EVENTS (Public) --------
const getAllEvents = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1
    const limit = parseInt(req.query.limit) || 10
    const skip = (page - 1) * limit
    const search = req.query.search || ''
    const category = req.query.category || ''

    const query = {
      status: 'upcoming',
      ...(search && { title: { $regex: search, $options: 'i' } }),
      ...(category && { category }),
    }

    const total = await Event.countDocuments(query)
    const events = await Event.find(query)
      .sort({ date: 1 })
      .skip(skip)
      .limit(limit)

    res.json({ events, total, page, pages: Math.ceil(total / limit) })
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message })
  }
}

// -------- GET ORG EVENTS --------
const getOrgEvents = async (req, res) => {
  try {
    const events = await Event.find({ organization: req.user.id }).sort({ createdAt: -1 })
    res.json(events)
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message })
  }
}

// -------- GET SINGLE EVENT --------
const getEventById = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id)
    if (!event) return res.status(404).json({ message: 'Event not found' })
    res.json(event)
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message })
  }
}

// -------- REGISTER FOR EVENT (Volunteer) --------
const registerForEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id)
    if (!event) return res.status(404).json({ message: 'Event not found' })

    // Check if already registered
    const alreadyRegistered = event.registeredVolunteers.find(
      r => r.volunteer.toString() === req.user.id
    )
    if (alreadyRegistered) {
      return res.status(400).json({ message: 'Already registered for this event' })
    }

    // Check if event is full
    if (event.registeredVolunteers.length >= event.volunteersNeeded) {
      return res.status(400).json({ message: 'Event is full' })
    }

    const volunteer = await User.findById(req.user.id)

    event.registeredVolunteers.push({
      volunteer: volunteer._id,
      name: volunteer.name,
      email: volunteer.email,
      phone: volunteer.phone,
      skills: volunteer.skills,
      status: 'applied'
    })

    await event.save()
    res.json({ message: 'Successfully registered for event' })
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message })
  }
}

// -------- GET VOLUNTEER'S REGISTERED EVENTS --------
const getMyEvents = async (req, res) => {
  try {
    const events = await Event.find({
      'registeredVolunteers.volunteer': req.user.id
    }).sort({ date: 1 })

    const myEvents = events.map(event => {
      const registration = event.registeredVolunteers.find(
        r => r.volunteer.toString() === req.user.id
      )
      return {
        _id: event._id,
        title: event.title,
        orgName: event.orgName,
        location: event.location,
        date: event.date,
        category: event.category,
        status: event.status,
        registrationStatus: registration?.status,
      }
    })

    res.json(myEvents)
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message })
  }
}

// -------- UPDATE VOLUNTEER STATUS (Org) --------
const updateVolunteerStatus = async (req, res) => {
  try {
    const { volunteerId, status } = req.body
    const event = await Event.findById(req.params.id)
    if (!event) return res.status(404).json({ message: 'Event not found' })

    const volunteer = event.registeredVolunteers.find(
      r => r.volunteer.toString() === volunteerId
    )
    if (!volunteer) return res.status(404).json({ message: 'Volunteer not found in event' })

    volunteer.status = status
    await event.save()

    res.json({ message: `Volunteer ${status} successfully` })
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message })
  }
}

// -------- DELETE EVENT (Org) --------
const deleteEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id)
    if (!event) return res.status(404).json({ message: 'Event not found' })
    if (event.organization.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' })
    }
    await event.deleteOne()
    res.json({ message: 'Event deleted successfully' })
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message })
  }
}

// -------- SUBMIT FEEDBACK (Volunteer) --------
const submitFeedback = async (req, res) => {
  try {
    const { comment, rating } = req.body

    if (!comment || comment.trim().length < 5) {
      return res.status(400).json({ message: 'Feedback comment must be at least 5 characters' })
    }
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Rating must be between 1 and 5' })
    }

    const event = await Event.findById(req.params.id)
    if (!event) return res.status(404).json({ message: 'Event not found' })

    // Check volunteer was registered for this event
    const registration = event.registeredVolunteers.find(
      r => r.volunteer.toString() === req.user.id
    )
    if (!registration) {
      return res.status(403).json({ message: 'You must be registered for this event to submit feedback' })
    }

    // Check duplicate feedback
    const alreadySubmitted = event.feedback.find(
      f => f.volunteer.toString() === req.user.id
    )
    if (alreadySubmitted) {
      return res.status(400).json({ message: 'You have already submitted feedback for this event' })
    }

    // Run sentiment analysis
    const { analyzeSentiment } = require('../services/sentimentService')
    const sentimentResult = await analyzeSentiment(comment)

    event.feedback.push({
      volunteer: req.user.id,
      comment,
      rating: Number(rating),
      sentiment: sentimentResult.sentiment,
      sentimentScore: sentimentResult.score,
      sentimentKeywords: sentimentResult.keywords,
      sentimentSummary: sentimentResult.summary,
    })

    await event.save()

    // Update volunteer performance score
    const { calculatePerformanceScore } = require('./aiController')
    await calculatePerformanceScore(req.user.id)

    res.json({
      message: 'Feedback submitted successfully',
      sentiment: sentimentResult
    })
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message })
  }
}

// -------- UPDATE EVENT (Org) --------
const updateEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id)
    if (!event) return res.status(404).json({ message: 'Event not found' })
    if (event.organization.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to edit this event' })
    }
    const { title, description, category, skillsRequired, location, date, duration, volunteersNeeded } = req.body
    if (title) event.title = title
    if (description) event.description = description
    if (category) event.category = category
    if (skillsRequired) event.skillsRequired = skillsRequired.split(',').map(s => s.trim()).filter(Boolean)
    if (location) event.location = location
    if (date) event.date = date
    if (duration) event.duration = duration
    if (volunteersNeeded) event.volunteersNeeded = volunteersNeeded
    await event.save()
    res.json({ message: 'Event updated successfully', event })
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message })
  }
}

module.exports = {
  createEvent,
  getAllEvents,
  getOrgEvents,
  getEventById,
  registerForEvent,
  getMyEvents,
  updateVolunteerStatus,
  deleteEvent,
  updateEvent,
  submitFeedback,
}