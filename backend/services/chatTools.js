const mongoose = require('mongoose')
const User = require('../models/User')
const Event = require('../models/Event')
const Organization = require('../models/Organization')
const { calculateMatchScore, calculatePerformanceScore } = require('../controllers/aiController')

const isValidId = (id) => mongoose.Types.ObjectId.isValid(id)

// -------- TOOL SCHEMAS (Anthropic tool-use format) --------
// Each tool is tagged with the roles allowed to use it. `null` role (guest)
// only ever gets the `public` set.
const TOOLS = [
  {
    name: 'search_events',
    roles: ['public', 'volunteer', 'org', 'admin'],
    description: 'Search upcoming volunteering events on the platform by keyword, category, and/or location. Use this whenever the user asks what events exist, is browsing, or wants something specific (e.g. "beach cleanups near Chennai").',
    input_schema: {
      type: 'object',
      properties: {
        keyword: { type: 'string', description: 'Free-text match against event title/description' },
        category: { type: 'string', enum: ['education', 'environment', 'health', 'community', 'disaster relief', 'animal welfare', 'other'] },
        location: { type: 'string', description: 'City/area to filter by' },
        limit: { type: 'number', description: 'Max results, default 6' },
      },
    },
  },
  {
    name: 'find_matching_events',
    roles: ['volunteer'],
    description: "Find the events that best match the CURRENT logged-in volunteer's own skills, location, and availability, using the platform's real match-scoring engine. Use this when a volunteer asks what they should sign up for, or what fits them.",
    input_schema: {
      type: 'object',
      properties: {
        limit: { type: 'number', description: 'Max results, default 5' },
      },
    },
  },
  {
    name: 'get_my_registrations',
    roles: ['volunteer'],
    description: "List the events the current logged-in volunteer has already registered for, and each registration's status (applied/approved/rejected).",
    input_schema: { type: 'object', properties: {} },
  },
  {
    name: 'get_my_performance',
    roles: ['volunteer'],
    description: "Get the current logged-in volunteer's performance score, rank, and score breakdown (attendance, feedback, approval rate, profile completeness).",
    input_schema: { type: 'object', properties: {} },
  },
  {
    name: 'get_skill_gap_advice',
    roles: ['volunteer'],
    description: "Get data on which single skill the current logged-in volunteer should learn next to unlock the most new events, based on the platform's skill-gap engine. Use this when asked how to grow, improve, or become eligible for more events.",
    input_schema: { type: 'object', properties: {} },
  },
  {
    name: 'get_org_events',
    roles: ['org'],
    description: "List the current logged-in organization's own events, with registration counts and status.",
    input_schema: { type: 'object', properties: {} },
  },
  {
    name: 'get_event_recommendations_for_org',
    roles: ['org'],
    description: "For one of the current organization's own events, get the top-matching volunteers (not yet registered) ranked by the platform's real match-scoring engine.",
    input_schema: {
      type: 'object',
      properties: {
        eventId: { type: 'string', description: 'The MongoDB _id of the event' },
      },
      required: ['eventId'],
    },
  },
  {
    name: 'get_dream_team_for_event',
    roles: ['org'],
    description: "For one of the current organization's own events, suggest a small team of volunteers whose combined skills best cover what the event requires (skill-coverage-optimized, not just top individual scores).",
    input_schema: {
      type: 'object',
      properties: {
        eventId: { type: 'string', description: 'The MongoDB _id of the event' },
      },
      required: ['eventId'],
    },
  },
  {
    name: 'get_platform_overview',
    roles: ['admin'],
    description: 'Get platform-wide counts: total volunteers, total organizations (verified vs pending), and total events by status.',
    input_schema: { type: 'object', properties: {} },
  },
  {
    name: 'get_pending_orgs',
    roles: ['admin'],
    description: 'List organizations awaiting verification/approval.',
    input_schema: { type: 'object', properties: {} },
  },
]

const toolsForRole = (role) => {
  const key = role || 'public'
  return TOOLS.filter(t => t.roles.includes(key)).map(({ name, description, input_schema }) => ({ name, description, input_schema }))
}

// -------- EXECUTORS --------
// Every executor returns { forModel, cards? }.
// `forModel` is compact JSON text handed back to Claude as the tool_result.
// `cards` (optional) is structured data the frontend can render as rich UI,
// independent of however Claude chooses to phrase its reply.

async function searchEvents({ keyword, category, location, limit }) {
  const query = { status: 'upcoming' }
  if (category) query.category = category
  if (location) query.location = { $regex: location, $options: 'i' }
  if (keyword) {
    query.$or = [
      { title: { $regex: keyword, $options: 'i' } },
      { description: { $regex: keyword, $options: 'i' } },
    ]
  }
  const events = await Event.find(query).sort({ date: 1 }).limit(Math.min(limit || 6, 10))

  const cards = events.map(e => ({
    type: 'event',
    _id: e._id,
    title: e.title,
    category: e.category,
    location: e.location,
    date: e.date,
    duration: e.duration,
    orgName: e.orgName,
    skillsRequired: e.skillsRequired,
    spotsLeft: Math.max(e.volunteersNeeded - e.registeredVolunteers.length, 0),
  }))

  return { forModel: JSON.stringify(cards), cards }
}

async function findMatchingEvents(user, { limit }) {
  const volunteer = await User.findById(user.id)
  const events = await Event.find({ status: 'upcoming' })
  const registeredIds = events
    .filter(e => e.registeredVolunteers.some(r => r.volunteer.toString() === user.id))
    .map(e => e._id.toString())

  const ranked = events
    .filter(e => !registeredIds.includes(e._id.toString()))
    .filter(e => e.registeredVolunteers.length < e.volunteersNeeded)
    .map(e => ({ event: e, score: calculateMatchScore(volunteer, e).finalScore }))
    .filter(r => r.score > 10)
    .sort((a, b) => b.score - a.score)
    .slice(0, Math.min(limit || 5, 8))

  const cards = ranked.map(r => ({
    type: 'event',
    _id: r.event._id,
    title: r.event.title,
    category: r.event.category,
    location: r.event.location,
    date: r.event.date,
    orgName: r.event.orgName,
    matchScore: r.score,
    spotsLeft: Math.max(r.event.volunteersNeeded - r.event.registeredVolunteers.length, 0),
  }))

  return { forModel: JSON.stringify(cards), cards }
}

async function getMyRegistrations(user) {
  const events = await Event.find({ 'registeredVolunteers.volunteer': user.id })
  const list = events.map(e => {
    const reg = e.registeredVolunteers.find(r => r.volunteer.toString() === user.id)
    return {
      type: 'registration',
      _id: e._id,
      title: e.title,
      date: e.date,
      status: reg?.status,
      orgName: e.orgName,
    }
  })
  return { forModel: JSON.stringify(list), cards: list }
}

async function getMyPerformance(user) {
  const score = await calculatePerformanceScore(user.id)
  const volunteer = await User.findById(user.id)
  const rank = score >= 80 ? 'Gold' : score >= 60 ? 'Silver' : score >= 40 ? 'Bronze' : 'Starter'
  const data = {
    score,
    rank,
    eventsAttended: volunteer.eventsAttended,
    hoursCompleted: volunteer.hoursCompleted,
  }
  return { forModel: JSON.stringify(data) }
}

async function getSkillGapAdvice(user) {
  const volunteer = await User.findById(user.id)
  const volunteerSkills = new Set((volunteer.skills || []).map(s => s.toLowerCase().trim()))
  const events = await Event.find({ status: 'upcoming' })
  const registeredEventIds = events
    .filter(e => e.registeredVolunteers.some(r => r.volunteer.toString() === user.id))
    .map(e => e._id.toString())
  const openEvents = events
    .filter(e => !registeredEventIds.includes(e._id.toString()))
    .filter(e => e.registeredVolunteers.length < e.volunteersNeeded)

  let qualifiedCount = 0
  const skillMap = {}
  openEvents.forEach(event => {
    const required = (event.skillsRequired || []).map(s => s.toLowerCase().trim())
    const missing = required.filter(s => !volunteerSkills.has(s))
    if (missing.length === 0) { qualifiedCount += 1; return }
    missing.forEach(skill => {
      if (!skillMap[skill]) skillMap[skill] = { direct: 0, partial: 0 }
      if (missing.length === 1) skillMap[skill].direct += 1
      else skillMap[skill].partial += 1
    })
  })

  const suggestions = Object.entries(skillMap)
    .map(([skill, d]) => ({ skill, directUnlocks: d.direct, partialUnlocks: d.partial, impact: d.direct * 2 + d.partial }))
    .sort((a, b) => b.impact - a.impact)
    .slice(0, 5)

  return { forModel: JSON.stringify({ currentSkills: [...volunteerSkills], qualifiedEvents: qualifiedCount, totalOpenEvents: openEvents.length, suggestions }) }
}

async function getOrgEvents(user) {
  const events = await Event.find({ organization: user.id }).sort({ date: 1 })
  const cards = events.map(e => ({
    type: 'org_event',
    _id: e._id,
    title: e.title,
    status: e.status,
    date: e.date,
    registeredCount: e.registeredVolunteers.length,
    volunteersNeeded: e.volunteersNeeded,
  }))
  return { forModel: JSON.stringify(cards), cards }
}

async function getEventRecommendationsForOrg(user, { eventId }) {
  if (!isValidId(eventId)) return { forModel: JSON.stringify({ error: 'Not a valid eventId' }) }
  const event = await Event.findOne({ _id: eventId, organization: user.id })
  if (!event) return { forModel: JSON.stringify({ error: 'Event not found, or does not belong to this organization' }) }

  const volunteers = await User.find({ role: 'volunteer' })
  const registeredIds = event.registeredVolunteers.map(r => r.volunteer.toString())
  const ranked = volunteers
    .filter(v => !registeredIds.includes(v._id.toString()))
    .map(v => ({ volunteer: v, score: calculateMatchScore(v, event).finalScore }))
    .filter(r => r.score > 10)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)

  const cards = ranked.map(r => ({
    type: 'volunteer',
    _id: r.volunteer._id,
    name: r.volunteer.name,
    location: r.volunteer.location,
    skills: r.volunteer.skills,
    matchScore: r.score,
  }))
  return { forModel: JSON.stringify(cards), cards }
}

async function getDreamTeamForEvent(user, { eventId }) {
  if (!isValidId(eventId)) return { forModel: JSON.stringify({ error: 'Not a valid eventId' }) }
  const event = await Event.findOne({ _id: eventId, organization: user.id })
  if (!event) return { forModel: JSON.stringify({ error: 'Event not found, or does not belong to this organization' }) }

  const volunteers = await User.find({ role: 'volunteer' })
  const registeredIds = event.registeredVolunteers.map(r => r.volunteer.toString())
  const approvedCount = event.registeredVolunteers.filter(r => r.status === 'approved').length
  const slotsOpen = Math.max(event.volunteersNeeded - approvedCount, 1)
  const required = (event.skillsRequired || []).map(s => s.toLowerCase().trim())

  const candidates = volunteers
    .filter(v => !registeredIds.includes(v._id.toString()))
    .map(v => ({ volunteer: v, score: calculateMatchScore(v, event).finalScore, skills: (v.skills || []).map(s => s.toLowerCase().trim()) }))
    .filter(c => c.score > 10)

  const covered = new Set()
  const team = []
  const pool = [...candidates]
  while (team.length < slotsOpen && pool.length > 0) {
    let bestIdx = -1, bestNew = -1, bestScore = -1
    pool.forEach((c, idx) => {
      const newSkills = c.skills.filter(s => required.includes(s) && !covered.has(s))
      if (newSkills.length > bestNew || (newSkills.length === bestNew && c.score > bestScore)) {
        bestIdx = idx; bestNew = newSkills.length; bestScore = c.score
      }
    })
    if (bestNew <= 0 && covered.size >= required.length) {
      pool.sort((a, b) => b.score - a.score)
      const filler = pool.shift()
      if (!filler) break
      team.push(filler)
      continue
    }
    const chosen = pool.splice(bestIdx, 1)[0]
    chosen.skills.forEach(s => { if (required.includes(s)) covered.add(s) })
    team.push(chosen)
  }

  const cards = team.map(t => ({
    type: 'volunteer',
    _id: t.volunteer._id,
    name: t.volunteer.name,
    matchScore: t.score,
    contributesSkills: t.skills.filter(s => required.includes(s)),
  }))
  return {
    forModel: JSON.stringify({ team: cards, skillsCovered: required.filter(s => covered.has(s)), skillsMissing: required.filter(s => !covered.has(s)) }),
    cards,
  }
}

async function getPlatformOverview() {
  const [volunteers, orgsVerified, orgsPending, upcoming, completed] = await Promise.all([
    User.countDocuments({ role: 'volunteer' }),
    Organization.countDocuments({ isVerified: true }),
    Organization.countDocuments({ isVerified: false }),
    Event.countDocuments({ status: 'upcoming' }),
    Event.countDocuments({ status: 'completed' }),
  ])
  return { forModel: JSON.stringify({ volunteers, orgsVerified, orgsPending, eventsUpcoming: upcoming, eventsCompleted: completed }) }
}

async function getPendingOrgs() {
  const orgs = await Organization.find({ isVerified: false }).select('orgName orgType location email createdAt')
  const cards = orgs.map(o => ({ type: 'org', _id: o._id, orgName: o.orgName, orgType: o.orgType, location: o.location }))
  return { forModel: JSON.stringify(cards), cards }
}

// -------- DISPATCH --------
async function runTool(name, input, user) {
  const role = user?.role || 'public'
  const tool = TOOLS.find(t => t.name === name)
  if (!tool || !tool.roles.includes(role)) {
    return { forModel: JSON.stringify({ error: 'Tool not permitted for this user' }) }
  }
  try {
    switch (name) {
      case 'search_events': return await searchEvents(input || {})
      case 'find_matching_events': return await findMatchingEvents(user, input || {})
      case 'get_my_registrations': return await getMyRegistrations(user)
      case 'get_my_performance': return await getMyPerformance(user)
      case 'get_skill_gap_advice': return await getSkillGapAdvice(user)
      case 'get_org_events': return await getOrgEvents(user)
      case 'get_event_recommendations_for_org': return await getEventRecommendationsForOrg(user, input || {})
      case 'get_dream_team_for_event': return await getDreamTeamForEvent(user, input || {})
      case 'get_platform_overview': return await getPlatformOverview()
      case 'get_pending_orgs': return await getPendingOrgs()
      default: return { forModel: JSON.stringify({ error: 'Unknown tool' }) }
    }
  } catch (err) {
    return { forModel: JSON.stringify({ error: err.message }) }
  }
}

module.exports = { toolsForRole, runTool }
