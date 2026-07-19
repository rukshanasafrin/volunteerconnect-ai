const express = require('express')
const router = express.Router()
const {
  getEventRecommendations,
  getVolunteerRecommendations,
  getVolunteerPerformance,
  markEventComplete,
  getEventSentimentReport, 
} = require('../controllers/aiController')
const { protect } = require('../middleware/authMiddleware')

// Get recommended volunteers for an event (Org uses this)
router.get('/recommend/event/:eventId', protect, getEventRecommendations)

// Get recommended events for a volunteer (Volunteer uses this)
router.get('/recommend/volunteer', protect, getVolunteerRecommendations)

//Performance Score
router.get('/performance',protect,getVolunteerPerformance)
router.put('/events/:eventId/complete', protect, markEventComplete)
router.get('/sentiment/event/:eventId', protect, getEventSentimentReport) 

module.exports = router