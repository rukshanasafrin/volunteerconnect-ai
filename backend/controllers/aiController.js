const User = require('../models/User')
const Event = require('../models/Event')

// -------- COSINE SIMILARITY --------
const cosineSimilarity = (vecA, vecB) => {
  const allKeys = new Set([...Object.keys(vecA), ...Object.keys(vecB)])
  let dotProduct = 0
  let normA = 0
  let normB = 0

  for (const key of allKeys) {
    const a = vecA[key] || 0
    const b = vecB[key] || 0
    dotProduct += a * b
    normA += a * a
    normB += b * b
  }

  if (normA === 0 || normB === 0) return 0
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB))
}

// -------- BUILD SKILL VECTOR --------
const buildSkillVector = (skills) => {
  const vector = {}
  skills.forEach(skill => {
    const normalized = skill.toLowerCase().trim()
    vector[normalized] = 1
  })
  return vector
}

// -------- CALCULATE MATCH SCORE --------
const calculateMatchScore = (volunteer, event) => {
  // 1. Skill Match (60% weight)
  const volunteerSkillVec = buildSkillVector(volunteer.skills || [])
  const eventSkillVec = buildSkillVector(event.skillsRequired || [])
  const skillScore = cosineSimilarity(volunteerSkillVec, eventSkillVec)

  // 2. Location Match (25% weight)
  const locationScore =
    volunteer.location?.toLowerCase().trim() ===
    event.location?.toLowerCase().trim()
      ? 1 : 0.3

  // 3. Availability Match (15% weight)
  let availabilityScore = 0.5
  if (volunteer.availability === 'both' || volunteer.availability === 'flexible') {
    availabilityScore = 1
  } else {
    const eventDay = new Date(event.date).getDay()
    const isWeekend = eventDay === 0 || eventDay === 6
    if (isWeekend && volunteer.availability === 'weekends') availabilityScore = 1
    if (!isWeekend && volunteer.availability === 'weekdays') availabilityScore = 1
  }

  // 4. Past Participation Bonus
  const participationBonus = Math.min(volunteer.eventsAttended * 0.02, 0.1)

  // 5. Performance Score Bonus
  const performanceBonus = (volunteer.performanceScore / 100) * 0.1

  // Weighted total
  const rawScore =
    skillScore * 0.60 +
    locationScore * 0.25 +
    availabilityScore * 0.15

  const finalScore = Math.min(rawScore + participationBonus + performanceBonus, 1)

  return {
    skillScore: Math.round(skillScore * 100),
    locationScore: Math.round(locationScore * 100),
    availabilityScore: Math.round(availabilityScore * 100),
    finalScore: Math.round(finalScore * 100),
  }
}

// -------- GET AI RECOMMENDATIONS FOR EVENT --------
const getEventRecommendations = async (req, res) => {
  try {
    const event = await Event.findById(req.params.eventId)
    if (!event) return res.status(404).json({ message: 'Event not found' })

    // Get all volunteers
    const volunteers = await User.find({ role: 'volunteer' }).select('-password')

    // Get already registered volunteer IDs
    const registeredIds = event.registeredVolunteers.map(r => r.volunteer.toString())

    // Calculate match scores
    const recommendations = volunteers
      .filter(v => !registeredIds.includes(v._id.toString()))
      .map(volunteer => {
        const scores = calculateMatchScore(volunteer, event)
        return {
          volunteer: {
            _id: volunteer._id,
            name: volunteer.name,
            email: volunteer.email,
            phone: volunteer.phone,
            location: volunteer.location,
            skills: volunteer.skills,
            availability: volunteer.availability,
            languages: volunteer.languages,
            eventsAttended: volunteer.eventsAttended,
            performanceScore: volunteer.performanceScore,
          },
          matchScore: scores.finalScore,
          breakdown: {
            skills: scores.skillScore,
            location: scores.locationScore,
            availability: scores.availabilityScore,
          }
        }
      })
      .filter(r => r.matchScore > 10)
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, 20)

    res.json({
      event: {
        _id: event._id,
        title: event.title,
        skillsRequired: event.skillsRequired,
        location: event.location,
        date: event.date,
      },
      totalVolunteers: volunteers.length,
      recommendations,
    })
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message })
  }
}

// -------- GET AI RECOMMENDATIONS FOR VOLUNTEER --------
const getVolunteerRecommendations = async (req, res) => {
  try {
    const volunteer = await User.findById(req.user.id)
    if (!volunteer) return res.status(404).json({ message: 'Volunteer not found' })

    // Get all upcoming events
    const events = await Event.find({ status: 'upcoming' })

    // Get already registered event IDs
    const registeredEventIds = events
      .filter(e => e.registeredVolunteers.some(r => r.volunteer.toString() === req.user.id))
      .map(e => e._id.toString())

    // Calculate match scores for each event
    const recommendations = events
      .filter(e => !registeredEventIds.includes(e._id.toString()))
      .filter(e => e.registeredVolunteers.length < e.volunteersNeeded)
      .map(event => {
        const scores = calculateMatchScore(volunteer, event)
        return {
          event: {
            _id: event._id,
            title: event.title,
            description: event.description,
            category: event.category,
            skillsRequired: event.skillsRequired,
            location: event.location,
            date: event.date,
            duration: event.duration,
            volunteersNeeded: event.volunteersNeeded,
            registeredCount: event.registeredVolunteers.length,
            orgName: event.orgName,
          },
          matchScore: scores.finalScore,
          breakdown: {
            skills: scores.skillScore,
            location: scores.locationScore,
            availability: scores.availabilityScore,
          }
        }
      })
      .filter(r => r.matchScore > 10)
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, 10)

    res.json({
      volunteer: {
        name: volunteer.name,
        skills: volunteer.skills,
        location: volunteer.location,
        availability: volunteer.availability,
      },
      recommendations,
    })
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message })
  }
}

// -------- CALCULATE PERFORMANCE SCORE --------
const calculatePerformanceScore = async (volunteerId) => {
  const User = require('../models/User')
  const Event = require('../models/Event')

  const volunteer = await User.findById(volunteerId)
  if (!volunteer) return 0

  // 1. Events Attended Score (40 points max)
  const eventsAttended = volunteer.eventsAttended || 0
  const attendanceScore = Math.min(eventsAttended * 4, 40)

  // 2. Feedback Rating Score (30 points max)
  const eventsWithFeedback = await Event.find({
    'feedback.volunteer': volunteerId
  })
  let avgRating = 0
  if (eventsWithFeedback.length > 0) {
    const allRatings = eventsWithFeedback.flatMap(e =>
      e.feedback
        .filter(f => f.volunteer.toString() === volunteerId.toString())
        .map(f => f.rating)
    )
    avgRating = allRatings.reduce((a, b) => a + b, 0) / allRatings.length
  }
  const feedbackScore = Math.round((avgRating / 5) * 30)

  // 3. Approval Rate Score (20 points max)
  const allRegistrations = await Event.find({
    'registeredVolunteers.volunteer': volunteerId
  })
  let approvalScore = 0
  if (allRegistrations.length > 0) {
    const myRegistrations = allRegistrations.flatMap(e =>
      e.registeredVolunteers.filter(
        r => r.volunteer.toString() === volunteerId.toString()
      )
    )
    const approved = myRegistrations.filter(r => r.status === 'approved').length
    const approvalRate = myRegistrations.length > 0 ? approved / myRegistrations.length : 0
    approvalScore = Math.round(approvalRate * 20)
  }

  // 4. Profile Completeness Score (10 points max)
  let profileScore = 0
  if (volunteer.name) profileScore += 2
  if (volunteer.phone) profileScore += 2
  if (volunteer.skills?.length > 0) profileScore += 2
  if (volunteer.languages?.length > 0) profileScore += 2
  if (volunteer.availability) profileScore += 2

  const totalScore = Math.min(
    attendanceScore + feedbackScore + approvalScore + profileScore,
    100
  )

  // Update the volunteer's score in DB
  await User.findByIdAndUpdate(volunteerId, {
    performanceScore: totalScore
  })

  return totalScore
}

// -------- GET VOLUNTEER PERFORMANCE DETAILS --------
const getVolunteerPerformance = async (req, res) => {
  try {
    const User = require('../models/User')
    const Event = require('../models/Event')

    const volunteer = await User.findById(req.user.id).select('-password')
    if (!volunteer) return res.status(404).json({ message: 'Volunteer not found' })

    // Calculate fresh score
    const score = await calculatePerformanceScore(req.user.id)

    // Get all registrations
    const allEvents = await Event.find({
      'registeredVolunteers.volunteer': req.user.id
    })

    const myRegistrations = allEvents.flatMap(e =>
      e.registeredVolunteers
        .filter(r => r.volunteer.toString() === req.user.id)
        .map(r => ({ ...r.toObject(), eventTitle: e.title, eventDate: e.date }))
    )

    const approved = myRegistrations.filter(r => r.status === 'approved').length
    const rejected = myRegistrations.filter(r => r.status === 'rejected').length
    const applied = myRegistrations.filter(r => r.status === 'applied').length

    // Get feedback given
    const eventsWithFeedback = await Event.find({
      'feedback.volunteer': req.user.id
    })

    let avgRating = 0
    const feedbacks = eventsWithFeedback.flatMap(e =>
      e.feedback.filter(f => f.volunteer.toString() === req.user.id)
    )
    if (feedbacks.length > 0) {
      avgRating = feedbacks.reduce((a, b) => a + b.rating, 0) / feedbacks.length
    }

    // Score breakdown
    const eventsAttended = volunteer.eventsAttended || 0
    const attendanceScore = Math.min(eventsAttended * 4, 40)
    const feedbackScore = Math.round((avgRating / 5) * 30)
    const approvalRate = myRegistrations.length > 0 ? approved / myRegistrations.length : 0
    const approvalScore = Math.round(approvalRate * 20)
    let profileScore = 0
    if (volunteer.name) profileScore += 2
    if (volunteer.phone) profileScore += 2
    if (volunteer.skills?.length > 0) profileScore += 2
    if (volunteer.languages?.length > 0) profileScore += 2
    if (volunteer.availability) profileScore += 2

    res.json({
      score,
      breakdown: {
        attendance: { score: attendanceScore, max: 40, eventsAttended },
        feedback: { score: feedbackScore, max: 30, avgRating: Math.round(avgRating * 10) / 10 },
        approval: { score: approvalScore, max: 20, approved, rejected, applied, total: myRegistrations.length },
        profile: { score: profileScore, max: 10 }
      },
      totalFeedbacks: feedbacks.length,
      hoursCompleted: volunteer.hoursCompleted,
      rank: score >= 80 ? '🥇 Gold' : score >= 60 ? '🥈 Silver' : score >= 40 ? '🥉 Bronze' : '🎗️ Starter'
    })
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message })
  }
}

// -------- MARK EVENT COMPLETE + UPDATE SCORES (Admin/Org) --------
const markEventComplete = async (req, res) => {
  try {
    const Event = require('../models/Event')
    const User = require('../models/User')

    const event = await Event.findById(req.params.eventId)
    if (!event) return res.status(404).json({ message: 'Event not found' })

    event.status = 'completed'
    await event.save()

    // Update each approved volunteer's stats
    const approvedVolunteers = event.registeredVolunteers.filter(
      r => r.status === 'approved'
    )

    for (const reg of approvedVolunteers) {
      await User.findByIdAndUpdate(reg.volunteer, {
        $inc: {
          eventsAttended: 1,
          hoursCompleted: parseFloat(event.duration) || 0
        }
      })
      await calculatePerformanceScore(reg.volunteer)
    }

    res.json({
      message: 'Event marked as completed. Volunteer scores updated.',
      volunteersUpdated: approvedVolunteers.length
    })
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message })
  }
}

// -------- GET EVENT SENTIMENT REPORT --------
const getEventSentimentReport = async (req, res) => {
  try {
    const Event = require('../models/Event')
    const event = await Event.findById(req.params.eventId)
    if (!event) return res.status(404).json({ message: 'Event not found' })

    const feedbacks = event.feedback
    if (feedbacks.length === 0) {
      return res.json({
        eventTitle: event.title,
        totalFeedbacks: 0,
        message: 'No feedback submitted yet'
      })
    }

    const positive = feedbacks.filter(f => f.sentiment === 'Positive').length
    const negative = feedbacks.filter(f => f.sentiment === 'Negative').length
    const neutral = feedbacks.filter(f => f.sentiment === 'Neutral').length

    const avgRating = feedbacks.reduce((a, b) => a + b.rating, 0) / feedbacks.length

    const allKeywords = feedbacks.flatMap(f => f.sentimentKeywords || [])
    const keywordCount = {}
    allKeywords.forEach(k => {
      keywordCount[k] = (keywordCount[k] || 0) + 1
    })
    const topKeywords = Object.entries(keywordCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([word, count]) => ({ word, count }))

    const overallSentiment = positive > negative ? 'Positive' : negative > positive ? 'Negative' : 'Neutral'

    res.json({
      eventTitle: event.title,
      totalFeedbacks: feedbacks.length,
      overallSentiment,
      avgRating: Math.round(avgRating * 10) / 10,
      breakdown: { positive, negative, neutral },
      topKeywords,
      feedbacks: feedbacks.map(f => ({
        comment: f.comment,
        rating: f.rating,
        sentiment: f.sentiment,
        sentimentScore: f.sentimentScore,
        summary: f.sentimentSummary,
        submittedAt: f.submittedAt,
      }))
    })
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message })
  }
}

module.exports = {
  getEventRecommendations,
  getVolunteerRecommendations,
  getVolunteerPerformance,
  markEventComplete,
  calculatePerformanceScore,
  getEventSentimentReport,
}