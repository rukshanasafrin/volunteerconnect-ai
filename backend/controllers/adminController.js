const User = require('../models/User')
const Organization = require('../models/Organization')
const Event = require('../models/Event')

// -------- PLATFORM STATISTICS + CHART DATA --------
// GET /api/admin/stats
const getPlatformStats = async (req, res) => {
  try {
    const [
      totalVolunteers,
      totalOrgsVerified,
      totalOrgsPending,
      totalOrgsSuspended,
      totalEventsUpcoming,
      totalEventsOngoing,
      totalEventsCompleted,
      totalEventsCancelled,
      suspendedVolunteers,
    ] = await Promise.all([
      User.countDocuments({ role: 'volunteer' }),
      Organization.countDocuments({ isVerified: true }),
      Organization.countDocuments({ isVerified: false }),
      Organization.countDocuments({ isSuspended: true }),
      Event.countDocuments({ status: 'upcoming' }),
      Event.countDocuments({ status: 'ongoing' }),
      Event.countDocuments({ status: 'completed' }),
      Event.countDocuments({ status: 'cancelled' }),
      User.countDocuments({ role: 'volunteer', isSuspended: true }),
    ])

    const totalHoursAgg = await User.aggregate([
      { $match: { role: 'volunteer' } },
      { $group: { _id: null, totalHours: { $sum: '$hoursCompleted' } } },
    ])
    const totalHours = totalHoursAgg[0]?.totalHours || 0

    // Events by category (for a pie/bar chart)
    const eventsByCategory = await Event.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ])

    // Volunteer signups over the last 6 months (for a line/bar chart)
    const sixMonthsAgo = new Date()
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5)
    sixMonthsAgo.setDate(1)
    sixMonthsAgo.setHours(0, 0, 0, 0)

    const volunteerGrowthRaw = await User.aggregate([
      { $match: { role: 'volunteer', createdAt: { $gte: sixMonthsAgo } } },
      { $group: { _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } }, count: { $sum: 1 } } },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ])

    // Fill in every month in range, even ones with 0 signups
    const monthLabels = []
    const cursor = new Date(sixMonthsAgo)
    for (let i = 0; i < 6; i++) {
      monthLabels.push({ year: cursor.getFullYear(), month: cursor.getMonth() + 1, label: cursor.toLocaleString('en-US', { month: 'short' }) })
      cursor.setMonth(cursor.getMonth() + 1)
    }
    const volunteerGrowth = monthLabels.map(({ year, month, label }) => {
      const match = volunteerGrowthRaw.find(r => r._id.year === year && r._id.month === month)
      return { label, count: match ? match.count : 0 }
    })

    res.json({
      totalVolunteers,
      totalOrganizations: totalOrgsVerified + totalOrgsPending,
      totalOrgsVerified,
      totalOrgsPending,
      totalOrgsSuspended,
      suspendedVolunteers,
      totalEvents: totalEventsUpcoming + totalEventsOngoing + totalEventsCompleted + totalEventsCancelled,
      totalEventsUpcoming,
      totalEventsOngoing,
      totalEventsCompleted,
      totalEventsCancelled,
      totalHours,
      eventsByCategory: eventsByCategory.map(c => ({ category: c._id, count: c.count })),
      volunteerGrowth,
    })
  } catch (error) {
    res.status(500).json({ message: 'Could not load platform stats', error: error.message })
  }
}

// -------- RECENT ACTIVITY FEED --------
// GET /api/admin/activity
const getRecentActivity = async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 15, 50)

    const [recentVolunteers, recentOrgs, recentEvents, recentAudit] = await Promise.all([
      User.find({ role: 'volunteer' }).sort({ createdAt: -1 }).limit(limit).select('name createdAt'),
      Organization.find().sort({ createdAt: -1 }).limit(limit).select('orgName isVerified createdAt'),
      Event.find().sort({ createdAt: -1 }).limit(limit).select('title orgName createdAt'),
    ])

    const feed = [
      ...recentVolunteers.map(v => ({ type: 'volunteer_joined', label: `${v.name} joined as a volunteer`, at: v.createdAt })),
      ...recentOrgs.map(o => ({ type: 'org_registered', label: `${o.orgName} registered${o.isVerified ? ' (verified)' : ' (pending)'}`, at: o.createdAt })),
      ...recentEvents.map(e => ({ type: 'event_created', label: `"${e.title}" created by ${e.orgName}`, at: e.createdAt })),
    ]
      .sort((a, b) => new Date(b.at) - new Date(a.at))
      .slice(0, limit)

    res.json(feed)
  } catch (error) {
    res.status(500).json({ message: 'Could not load recent activity', error: error.message })
  }
}

// -------- ORGANIZATIONS: search / filter / paginate --------
// GET /api/admin/organizations?search=&status=verified|pending|suspended&page=&limit=
const searchOrganizations = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1
    const limit = parseInt(req.query.limit) || 10
    const skip = (page - 1) * limit
    const search = req.query.search || ''
    const status = req.query.status || ''

    const query = {
      ...(search && {
        $or: [
          { orgName: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
          { location: { $regex: search, $options: 'i' } },
        ],
      }),
      ...(status === 'verified' && { isVerified: true, isSuspended: false }),
      ...(status === 'pending' && { isVerified: false }),
      ...(status === 'suspended' && { isSuspended: true }),
    }

    const total = await Organization.countDocuments(query)
    const organizations = await Organization.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)

    res.json({ organizations, total, page, pages: Math.ceil(total / limit) || 1 })
  } catch (error) {
    res.status(500).json({ message: 'Could not search organizations', error: error.message })
  }
}

// GET /api/admin/organizations/:id
const getOrganizationDetails = async (req, res) => {
  try {
    const org = await Organization.findById(req.params.id).select('-password')
    if (!org) return res.status(404).json({ message: 'Organization not found' })
    const events = await Event.find({ organization: org._id }).sort({ date: -1 })
    res.json({ organization: org, events })
  } catch (error) {
    res.status(500).json({ message: 'Could not load organization details', error: error.message })
  }
}

// PUT /api/admin/organizations/:id/suspend
const suspendOrganization = async (req, res) => {
  try {
    const org = await Organization.findByIdAndUpdate(
      req.params.id,
      { isSuspended: true, suspendedAt: new Date(), suspendedReason: req.body.reason || '' },
      { new: true }
    ).select('-password')
    if (!org) return res.status(404).json({ message: 'Organization not found' })
    res.json({ message: 'Organization suspended', organization: org })
  } catch (error) {
    res.status(500).json({ message: 'Could not suspend organization', error: error.message })
  }
}

// PUT /api/admin/organizations/:id/restore
const restoreOrganization = async (req, res) => {
  try {
    const org = await Organization.findByIdAndUpdate(
      req.params.id,
      { isSuspended: false, suspendedAt: null, suspendedReason: '' },
      { new: true }
    ).select('-password')
    if (!org) return res.status(404).json({ message: 'Organization not found' })
    res.json({ message: 'Organization restored', organization: org })
  } catch (error) {
    res.status(500).json({ message: 'Could not restore organization', error: error.message })
  }
}

// -------- VOLUNTEERS: search / filter / paginate (richer than the legacy authController version) --------
// GET /api/admin/volunteers?search=&status=active|suspended&page=&limit=
const searchVolunteers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1
    const limit = parseInt(req.query.limit) || 10
    const skip = (page - 1) * limit
    const search = req.query.search || ''
    const status = req.query.status || ''

    const query = {
      role: 'volunteer',
      ...(search && {
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
          { location: { $regex: search, $options: 'i' } },
        ],
      }),
      ...(status === 'suspended' && { isSuspended: true }),
      ...(status === 'active' && { isSuspended: false }),
    }

    const total = await User.countDocuments(query)
    const volunteers = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)

    res.json({ volunteers, total, page, pages: Math.ceil(total / limit) || 1 })
  } catch (error) {
    res.status(500).json({ message: 'Could not search volunteers', error: error.message })
  }
}

// GET /api/admin/volunteers/:id
const getVolunteerDetails = async (req, res) => {
  try {
    const volunteer = await User.findById(req.params.id).select('-password')
    if (!volunteer) return res.status(404).json({ message: 'Volunteer not found' })
    const events = await Event.find({ 'registeredVolunteers.volunteer': volunteer._id })
      .select('title orgName date status registeredVolunteers')
    const registrations = events.map(e => {
      const reg = e.registeredVolunteers.find(r => r.volunteer.toString() === volunteer._id.toString())
      return { eventId: e._id, title: e.title, orgName: e.orgName, date: e.date, eventStatus: e.status, registrationStatus: reg?.status, hoursContributed: reg?.hoursContributed || 0 }
    })
    res.json({ volunteer, registrations })
  } catch (error) {
    res.status(500).json({ message: 'Could not load volunteer details', error: error.message })
  }
}

// PUT /api/admin/volunteers/:id/suspend
const suspendVolunteer = async (req, res) => {
  try {
    const volunteer = await User.findOneAndUpdate(
      { _id: req.params.id, role: 'volunteer' },
      { isSuspended: true, suspendedAt: new Date(), suspendedReason: req.body.reason || '' },
      { new: true }
    ).select('-password')
    if (!volunteer) return res.status(404).json({ message: 'Volunteer not found' })
    res.json({ message: 'Volunteer suspended', volunteer })
  } catch (error) {
    res.status(500).json({ message: 'Could not suspend volunteer', error: error.message })
  }
}

// PUT /api/admin/volunteers/:id/restore
const restoreVolunteer = async (req, res) => {
  try {
    const volunteer = await User.findOneAndUpdate(
      { _id: req.params.id, role: 'volunteer' },
      { isSuspended: false, suspendedAt: null, suspendedReason: '' },
      { new: true }
    ).select('-password')
    if (!volunteer) return res.status(404).json({ message: 'Volunteer not found' })
    res.json({ message: 'Volunteer restored', volunteer })
  } catch (error) {
    res.status(500).json({ message: 'Could not restore volunteer', error: error.message })
  }
}

// -------- EVENTS: search / filter / paginate --------
// GET /api/admin/events?search=&category=&status=&location=&page=&limit=
const searchEvents = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1
    const limit = parseInt(req.query.limit) || 10
    const skip = (page - 1) * limit
    const search = req.query.search || ''
    const { category, status, location } = req.query

    const query = {
      ...(search && {
        $or: [
          { title: { $regex: search, $options: 'i' } },
          { orgName: { $regex: search, $options: 'i' } },
        ],
      }),
      ...(category && { category }),
      ...(status && { status }),
      ...(location && { location: { $regex: location, $options: 'i' } }),
    }

    const total = await Event.countDocuments(query)
    const events = await Event.find(query)
      .select('title category location date status volunteersNeeded registeredVolunteers orgName organization')
      .sort({ date: -1 })
      .skip(skip)
      .limit(limit)

    res.json({
      events: events.map(e => ({
        _id: e._id, title: e.title, category: e.category, location: e.location,
        date: e.date, status: e.status, volunteersNeeded: e.volunteersNeeded,
        registeredCount: e.registeredVolunteers.length, orgName: e.orgName, organization: e.organization,
      })),
      total, page, pages: Math.ceil(total / limit) || 1,
    })
  } catch (error) {
    res.status(500).json({ message: 'Could not search events', error: error.message })
  }
}


module.exports = {
  getPlatformStats,
  getRecentActivity,
  searchOrganizations,
  getOrganizationDetails,
  suspendOrganization,
  restoreOrganization,
  searchVolunteers,
  getVolunteerDetails,
  suspendVolunteer,
  restoreVolunteer,
  searchEvents,
}