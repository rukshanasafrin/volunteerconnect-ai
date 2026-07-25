const Groq = require('groq-sdk')
const User = require('../models/User')
const Event = require('../models/Event')

const groqClient = new Groq({ apiKey: process.env.GROQ_API_KEY })
const MODEL = 'llama-3.3-70b-versatile'

const CATEGORY_LABELS = {
  education: 'Education',
  environment: 'Environment',
  health: 'Health',
  community: 'Community',
  'disaster relief': 'Disaster Relief',
  'animal welfare': 'Animal Welfare',
  other: 'General',
}

// -------- Per-volunteer "top category" (real data, no AI) --------
// Which category each volunteer has put the most completed, approved
// hours into — used both to show a specialty tag and to feed the AI badge.
const getTopCategoryByVolunteer = async () => {
  const rows = await Event.aggregate([
    { $match: { status: 'completed' } },
    { $unwind: '$registeredVolunteers' },
    { $match: { 'registeredVolunteers.status': 'approved' } },
    {
      $group: {
        _id: { volunteer: '$registeredVolunteers.volunteer', category: '$category' },
        hours: { $sum: '$registeredVolunteers.hoursContributed' },
      },
    },
    { $sort: { hours: -1 } },
    {
      $group: {
        _id: '$_id.volunteer',
        topCategory: { $first: '$_id.category' },
        topCategoryHours: { $first: '$hours' },
      },
    },
  ])
  const map = {}
  rows.forEach(r => { map[r._id.toString()] = { topCategory: r.topCategory, topCategoryHours: r.topCategoryHours } }
  )
  return map
}

// -------- Rule-based badge fallback --------
// Used if the AI call fails/errors, so the leaderboard never breaks.
const fallbackBadge = (v) => {
  if (v.eventsAttended >= 15) return '🏆 Veteran Volunteer'
  if (v.hoursCompleted >= 50) return '⏱️ Century Club'
  if (v.performanceScore >= 85) return '⭐ Top Performer'
  if (v.topCategory) return `🎯 ${CATEGORY_LABELS[v.topCategory] || v.topCategory} Specialist`
  if (v.eventsAttended >= 5) return '🌱 Rising Volunteer'
  return '🤝 Community Contributor'
}

// -------- AI-generated recognition badges (real data, one batched call) --------
// Every fact fed in is real; the model is only asked to phrase a punchy
// 2-4 word badge from those facts, not invent anything.
const generateAIBadges = async (volunteers) => {
  const prompt = `You are labeling volunteers on a leaderboard with short recognition badges based ONLY on their real stats below. For each volunteer, write one punchy badge: 2-4 words, plus one relevant emoji at the start. Do not invent achievements not implied by the stats.

Volunteers:
${volunteers.map((v, i) => `${i + 1}. ${v.name}: ${v.eventsAttended} events, ${v.hoursCompleted} hours, performance score ${v.performanceScore}/100, top category: ${v.topCategory ? CATEGORY_LABELS[v.topCategory] || v.topCategory : 'none yet'}`).join('\n')}

Return ONLY a JSON object of this exact shape, no other text: {"badges": ["badge for volunteer 1", "badge for volunteer 2", ...]} — the array must have exactly ${volunteers.length} items, in the same order as listed above.`

  const response = await groqClient.chat.completions.create({
    model: MODEL,
    max_tokens: 400,
    messages: [{ role: 'user', content: prompt }],
    response_format: { type: 'json_object' },
  }).catch(() =>
    // Retry without response_format in case the model/account doesn't support it
    groqClient.chat.completions.create({
      model: MODEL,
      max_tokens: 400,
      messages: [{ role: 'user', content: prompt }],
    })
  )

  const raw = response.choices[0].message.content.trim()
  let badges
  try {
    const parsed = JSON.parse(raw)
    badges = Array.isArray(parsed) ? parsed : parsed.badges
  } catch {
    const jsonMatch = raw.match(/\[[\s\S]*\]/)
    badges = jsonMatch ? JSON.parse(jsonMatch[0]) : null
  }
  if (!Array.isArray(badges) || badges.length !== volunteers.length) throw new Error('Badge count mismatch')
  return badges
}

// GET /api/leaderboard?sortBy=performanceScore|hoursCompleted|eventsAttended
const getLeaderboard = async (req, res) => {
  try {
    const sortBy = ['performanceScore', 'hoursCompleted', 'eventsAttended'].includes(req.query.sortBy)
      ? req.query.sortBy
      : 'performanceScore'

    const topVolunteers = await User.find({ role: 'volunteer' })
      .select('name location hoursCompleted eventsAttended performanceScore')
      .sort({ [sortBy]: -1 })
      .limit(20)

    const categoryMap = await getTopCategoryByVolunteer()

    let leaderboard = topVolunteers.map((v, i) => {
      const cat = categoryMap[v._id.toString()] || {}
      return {
        rank: i + 1,
        _id: v._id,
        name: v.name,
        location: v.location,
        hoursCompleted: v.hoursCompleted,
        eventsAttended: v.eventsAttended,
        performanceScore: v.performanceScore,
        topCategory: cat.topCategory || null,
        badge: null,
      }
    })

    // Only badge the top 10 — keeps the AI call small/fast and cheap on the free tier
    const badgeTargets = leaderboard.slice(0, 10)
    try {
      const badges = await generateAIBadges(badgeTargets)
      badgeTargets.forEach((v, i) => { v.badge = badges[i] })
    } catch (err) {
      console.error('Leaderboard AI badge error (using fallback):', err.message)
      badgeTargets.forEach(v => { v.badge = fallbackBadge(v) })
    }
    leaderboard.slice(10).forEach(v => { v.badge = fallbackBadge(v) })

    res.json({ sortBy, leaderboard, generatedAt: new Date() })
  } catch (error) {
    console.error('Leaderboard error:', error.message)
    res.status(500).json({ message: 'Could not load the leaderboard right now.' })
  }
}

// GET /api/leaderboard/my-rank  (protect — volunteer only)
const getMyRank = async (req, res) => {
  try {
    const me = await User.findById(req.user.id).select('name hoursCompleted eventsAttended performanceScore')
    if (!me) return res.status(404).json({ message: 'User not found' })

    const totalVolunteers = await User.countDocuments({ role: 'volunteer' })
    const rank = (await User.countDocuments({ role: 'volunteer', performanceScore: { $gt: me.performanceScore } })) + 1
    const percentile = totalVolunteers > 0 ? Math.round(((totalVolunteers - rank) / totalVolunteers) * 100) : 0

    // Who's directly above me, and by how much, for a "next milestone" nudge
    const nextAbove = await User.find({ role: 'volunteer', performanceScore: { $gt: me.performanceScore } })
      .sort({ performanceScore: 1 })
      .limit(1)
      .select('performanceScore')

    res.json({
      rank,
      totalVolunteers,
      percentile,
      performanceScore: me.performanceScore,
      hoursCompleted: me.hoursCompleted,
      eventsAttended: me.eventsAttended,
      pointsToNextRank: nextAbove[0] ? nextAbove[0].performanceScore - me.performanceScore : 0,
    })
  } catch (error) {
    res.status(500).json({ message: 'Could not load your rank right now.' })
  }
}

module.exports = { getLeaderboard, getMyRank }