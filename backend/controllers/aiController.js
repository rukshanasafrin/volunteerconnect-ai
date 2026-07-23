const User = require('../models/User')
const Event = require('../models/Event')
const Anthropic = require('@anthropic-ai/sdk')

const anthropicClient = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY
})

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

// -------- AI SKILL GAP GROWTH ADVISOR --------
// Turns the matching engine around: instead of "what fits you now", this tells
// a volunteer exactly which ONE skill to learn next to unlock the most new
// upcoming events. Events where the volunteer is missing exactly one required
// skill are "direct unlocks" for that skill; events missing that skill plus
// others count as smaller "partial" progress.
const getSkillGapAdvisor = async (req, res) => {
  try {
    const volunteer = await User.findById(req.user.id)
    if (!volunteer) return res.status(404).json({ message: 'Volunteer not found' })

    const volunteerSkills = new Set((volunteer.skills || []).map(s => s.toLowerCase().trim()))

    const events = await Event.find({ status: 'upcoming' })
    const registeredEventIds = events
      .filter(e => e.registeredVolunteers.some(r => r.volunteer.toString() === req.user.id))
      .map(e => e._id.toString())

    const openEvents = events
      .filter(e => !registeredEventIds.includes(e._id.toString()))
      .filter(e => e.registeredVolunteers.length < e.volunteersNeeded)

    let qualifiedCount = 0
    const skillMap = {} // skill -> { directUnlocks: [], partialCount: number }

    openEvents.forEach(event => {
      const requiredSkills = (event.skillsRequired || []).map(s => s.toLowerCase().trim())
      const missingSkills = requiredSkills.filter(s => !volunteerSkills.has(s))

      if (missingSkills.length === 0) {
        qualifiedCount += 1
        return
      }

      missingSkills.forEach(skill => {
        if (!skillMap[skill]) skillMap[skill] = { directUnlocks: [], partialCount: 0 }
        if (missingSkills.length === 1) {
          skillMap[skill].directUnlocks.push({ _id: event._id, title: event.title, date: event.date })
        } else {
          skillMap[skill].partialCount += 1
        }
      })
    })

    const suggestions = Object.entries(skillMap)
      .map(([skill, data]) => ({
        skill,
        directUnlocks: data.directUnlocks,
        directUnlockCount: data.directUnlocks.length,
        partialUnlockCount: data.partialCount,
        impactScore: data.directUnlocks.length * 2 + data.partialCount,
      }))
      .filter(s => s.impactScore > 0)
      .sort((a, b) => b.impactScore - a.impactScore)
      .slice(0, 5)

    // -------- AI EXPLANATION (with deterministic fallback) --------
    let explanation
    const topSkill = suggestions[0]
    try {
      if (!topSkill) {
        explanation = `You're already eligible for all ${qualifiedCount} open event(s) matching your skills right now. Keep an eye out for new events!`
      } else {
        const summary = suggestions
          .map(s => `${s.skill} (unlocks ${s.directUnlockCount} event${s.directUnlockCount === 1 ? '' : 's'} directly${s.partialUnlockCount > 0 ? `, helps with ${s.partialUnlockCount} more` : ''})`)
          .join('; ')

        const message = await anthropicClient.messages.create({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 180,
          messages: [
            {
              role: 'user',
              content: `You are a friendly growth coach for a volunteer on a volunteering platform.

Volunteer's current skills: ${[...volunteerSkills].join(', ') || 'none listed'}.
They are already eligible for ${qualifiedCount} open event(s).
Skill opportunities ranked by impact: ${summary}.

Write a short, motivating 2-3 sentence message (plain text, no markdown) that recommends they learn "${topSkill.skill}" next, mentioning how many events it would unlock. Encouraging and specific, not generic.`
            }
          ]
        })
        explanation = message.content[0].text.trim()
      }
    } catch (err) {
      console.error('Skill gap explanation error:', err.message)
      explanation = topSkill
        ? `Learning "${topSkill.skill}" would make you eligible for ${topSkill.directUnlockCount} more event${topSkill.directUnlockCount === 1 ? '' : 's'} right away` +
          (topSkill.partialUnlockCount > 0 ? `, and help with ${topSkill.partialUnlockCount} more.` : '.')
        : `You're already eligible for all ${qualifiedCount} open event(s) matching your skills right now. Keep an eye out for new events!`
    }

    res.json({
      volunteer: {
        name: volunteer.name,
        skills: volunteer.skills,
      },
      totalOpenEvents: openEvents.length,
      qualifiedEvents: qualifiedCount,
      suggestions,
      explanation,
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

// -------- AI DREAM TEAM BUILDER --------
// Instead of ranking individuals 1:1 against an event (see getEventRecommendations),
// this picks the best COMBINATION of volunteers as a group: a greedy set-cover
// over the event's required skills (to minimise redundant overlap), then fills
// any remaining open slots using overall match score. A short AI-written
// explanation (with a deterministic fallback) is returned alongside the team.
const buildDreamTeam = async (req, res) => {
  try {
    const event = await Event.findById(req.params.eventId)
    if (!event) return res.status(404).json({ message: 'Event not found' })

    const volunteers = await User.find({ role: 'volunteer' }).select('-password')
    const registeredIds = event.registeredVolunteers.map(r => r.volunteer.toString())
    const approvedCount = event.registeredVolunteers.filter(r => r.status === 'approved').length
    const slotsOpen = Math.max(event.volunteersNeeded - approvedCount, 1)

    const requiredSkills = (event.skillsRequired || []).map(s => s.toLowerCase().trim())

    // Score every available (not yet registered) volunteer individually first
    const candidates = volunteers
      .filter(v => !registeredIds.includes(v._id.toString()))
      .map(volunteer => {
        const scores = calculateMatchScore(volunteer, event)
        const volunteerSkills = (volunteer.skills || []).map(s => s.toLowerCase().trim())
        return { volunteer, matchScore: scores.finalScore, volunteerSkills }
      })
      .filter(c => c.matchScore > 10)

    if (candidates.length === 0) {
      return res.json({
        event: {
          _id: event._id,
          title: event.title,
          skillsRequired: event.skillsRequired,
          volunteersNeeded: event.volunteersNeeded,
        },
        slotsOpen,
        team: [],
        skillsCovered: [],
        skillsMissing: requiredSkills,
        avgMatchScore: 0,
        locationSpread: 0,
        explanation: 'No suitable candidates were found to build a team for this event yet.',
      })
    }

    // -------- GREEDY SET-COVER --------
    const covered = new Set()
    const team = []
    const remainingPool = [...candidates]

    while (team.length < slotsOpen && remainingPool.length > 0) {
      let bestIdx = -1
      let bestNewSkillsCount = -1
      let bestScore = -1

      remainingPool.forEach((c, idx) => {
        const newSkills = c.volunteerSkills.filter(s => requiredSkills.includes(s) && !covered.has(s))
        if (
          newSkills.length > bestNewSkillsCount ||
          (newSkills.length === bestNewSkillsCount && c.matchScore > bestScore)
        ) {
          bestIdx = idx
          bestNewSkillsCount = newSkills.length
          bestScore = c.matchScore
        }
      })

      // Once every required skill is covered, stop optimising for coverage
      // and just fill remaining open slots with the strongest overall matches
      if (bestNewSkillsCount <= 0 && covered.size >= requiredSkills.length) {
        remainingPool.sort((a, b) => b.matchScore - a.matchScore)
        const filler = remainingPool.shift()
        if (!filler) break
        team.push(filler)
        continue
      }

      const chosen = remainingPool.splice(bestIdx, 1)[0]
      chosen.volunteerSkills.forEach(s => {
        if (requiredSkills.includes(s)) covered.add(s)
      })
      team.push(chosen)
    }

    const skillsCovered = requiredSkills.filter(s => covered.has(s))
    const skillsMissing = requiredSkills.filter(s => !covered.has(s))
    const uniqueLocations = new Set(team.map(t => t.volunteer.location?.toLowerCase().trim()))
    const avgMatchScore = team.length > 0
      ? Math.round(team.reduce((a, t) => a + t.matchScore, 0) / team.length)
      : 0

    const teamPayload = team.map(t => ({
      volunteer: {
        _id: t.volunteer._id,
        name: t.volunteer.name,
        email: t.volunteer.email,
        location: t.volunteer.location,
        skills: t.volunteer.skills,
        availability: t.volunteer.availability,
      },
      matchScore: t.matchScore,
      contributesSkills: t.volunteerSkills.filter(s => requiredSkills.includes(s)),
    }))

    // -------- AI EXPLANATION (with deterministic fallback) --------
    let explanation
    try {
      const teamSummary = teamPayload
        .map(t => `${t.volunteer.name} (${t.contributesSkills.join(', ') || 'general support'})`)
        .join('; ')

      const message = await anthropicClient.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 200,
        messages: [
          {
            role: 'user',
            content: `You are helping an event organizer understand why an AI-selected volunteer team is a good fit.

Event: "${event.title}" needs skills: ${requiredSkills.join(', ') || 'none specified'}.
Selected team: ${teamSummary}.
Skills covered: ${skillsCovered.join(', ') || 'none'}.
Skills still missing: ${skillsMissing.join(', ') || 'none'}.

Write a short, encouraging 2-3 sentence explanation (plain text, no markdown, no headers) of why this combination of volunteers works well together for this event. Mention skill coverage and complementary strengths.`
          }
        ]
      })
      explanation = message.content[0].text.trim()
    } catch (err) {
      console.error('Dream team explanation error:', err.message)
      explanation = `This team of ${team.length} volunteer(s) covers ${skillsCovered.length} of ${requiredSkills.length} required skills` +
        (skillsMissing.length > 0 ? `, with ${skillsMissing.join(', ')} still uncovered.` : ' with no gaps.') +
        ` Average match score is ${avgMatchScore}%.`
    }

    res.json({
      event: {
        _id: event._id,
        title: event.title,
        skillsRequired: event.skillsRequired,
        volunteersNeeded: event.volunteersNeeded,
      },
      slotsOpen,
      team: teamPayload,
      skillsCovered,
      skillsMissing,
      avgMatchScore,
      locationSpread: uniqueLocations.size,
      explanation,
    })
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message })
  }
}

// -------- AI IMPACT STORY GENERATOR --------
// A "Spotify Wrapped"-style personalized narrative built from a volunteer's own
// completed-event stats (events, hours, top category, orgs). Defaults to the
// current calendar month; if there's no activity this month it falls back to
// an all-time summary so the feature is never empty for a demo. Purely reads
// existing data plus one Anthropic call (with a deterministic fallback).
const getImpactStory = async (req, res) => {
  try {
    const volunteer = await User.findById(req.user.id)
    if (!volunteer) return res.status(404).json({ message: 'Volunteer not found' })

    const completedEvents = await Event.find({
      status: 'completed',
      registeredVolunteers: {
        $elemMatch: { volunteer: req.user.id, status: 'approved' }
      }
    })

    const now = new Date()
    const isThisMonth = (d) => {
      const date = new Date(d)
      return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear()
    }

    let periodEvents = completedEvents.filter(e => isThisMonth(e.date))
    let period = 'month'
    let allTimeFallback = false

    if (periodEvents.length === 0) {
      periodEvents = completedEvents
      period = 'all-time'
      allTimeFallback = true
    }

    if (periodEvents.length === 0) {
      return res.json({
        volunteer: { name: volunteer.name },
        period,
        allTimeFallback,
        hasActivity: false,
        message: 'Complete your first event to unlock your Impact Story!',
      })
    }

    const totalHours = periodEvents.reduce((sum, e) => sum + (parseFloat(e.duration) || 0), 0)

    const categoryCounts = {}
    periodEvents.forEach(e => {
      categoryCounts[e.category] = (categoryCounts[e.category] || 0) + 1
    })
    const topCategory = Object.entries(categoryCounts).sort((a, b) => b[1] - a[1])[0][0]
    const organizationsCount = new Set(periodEvents.map(e => e.orgName)).size

    const badgeMap = {
      education: '📚 Learning Champion',
      environment: '🌱 Green Guardian',
      health: '🩺 Wellness Warrior',
      community: '🤝 Community Builder',
      'disaster relief': '🚨 Relief Responder',
      'animal welfare': '🐾 Animal Ally',
      other: '⭐ All-Rounder',
    }
    const badge = badgeMap[topCategory] || '⭐ Impact Maker'

    const eventList = periodEvents
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .map(e => ({
        _id: e._id,
        title: e.title,
        category: e.category,
        date: e.date,
        orgName: e.orgName,
        hours: parseFloat(e.duration) || 0,
      }))

    // -------- AI NARRATIVE (with deterministic fallback) --------
    let story
    try {
      const message = await anthropicClient.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 220,
        messages: [
          {
            role: 'user',
            content: `Write a short, warm "Spotify Wrapped"-style personal impact summary for a volunteer, based on these stats for ${period === 'month' ? 'this month' : 'their volunteering journey so far'}:

- Events completed: ${periodEvents.length}
- Total hours: ${totalHours}
- Top category: ${topCategory}
- Organizations worked with: ${organizationsCount}
- Events: ${eventList.map(e => `${e.title} (${e.category})`).join(', ')}

Write 3-4 sentences, second person ("You..."), celebratory and specific, plain text, no markdown, no headers, no emoji.`
          }
        ]
      })
      story = message.content[0].text.trim()
    } catch (err) {
      console.error('Impact story generation error:', err.message)
      story = `You completed ${periodEvents.length} event${periodEvents.length === 1 ? '' : 's'} and contributed ${totalHours} hour${totalHours === 1 ? '' : 's'} ${period === 'month' ? 'this month' : 'so far'}, mostly in ${topCategory}. Working with ${organizationsCount} organization${organizationsCount === 1 ? '' : 's'}, you're making a real difference — keep it up!`
    }

    res.json({
      volunteer: { name: volunteer.name },
      period,
      allTimeFallback,
      hasActivity: true,
      stats: {
        eventsCompleted: periodEvents.length,
        totalHours,
        topCategory,
        organizationsCount,
      },
      badge,
      events: eventList,
      story,
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
  buildDreamTeam,
  getSkillGapAdvisor,
  getImpactStory,
}