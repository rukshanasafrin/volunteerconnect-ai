const express = require('express')
const router = express.Router()
const {
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
} = require('../controllers/eventController')
const { protect } = require('../middleware/authMiddleware')
const { validateEvent, validateObjectId } = require('../middleware/validate')

// Public
router.get('/', getAllEvents)
router.get('/volunteer/my-events', protect, getMyEvents)
router.get('/org/my-events', protect, getOrgEvents)
router.get('/:id', validateObjectId('id'), getEventById)

// Volunteer
router.post('/:id/register', validateObjectId('id'), protect, registerForEvent)
router.post('/:id/feedback', validateObjectId('id'), protect, submitFeedback)

// Organization
router.post('/', validateEvent, protect, createEvent)
router.put('/:id', validateObjectId('id'), validateEvent, protect, updateEvent)
router.put('/:id/volunteer-status', validateObjectId('id'), protect, updateVolunteerStatus)
router.delete('/:id', validateObjectId('id'), protect, deleteEvent)

module.exports = router