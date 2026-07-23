const express = require('express')
const router = express.Router()
const {
  getEventRecommendations,
  getVolunteerRecommendations,
  getVolunteerPerformance,
  markEventComplete,
  getEventSentimentReport, 
  buildDreamTeam,
  getSkillGapAdvisor,
  getImpactStory,
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

// Dream Team Builder: best combination of volunteers for an event (Org uses this)
router.get('/dream-team/:eventId', protect, buildDreamTeam)

// Skill Gap Growth Advisor: which skill should this volunteer learn next (Volunteer uses this)
router.get('/skill-gap', protect, getSkillGapAdvisor)

// Impact Story Generator: Spotify-Wrapped-style monthly summary (Volunteer uses this)
router.get('/impact-story', protect, getImpactStory)

module.exports = router