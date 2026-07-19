const User = require('../models/User')
const Organization = require('../models/Organization')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')

const generateToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, { expiresIn: '7d' })
}

// -------- REGISTER VOLUNTEER --------
const registerVolunteer = async (req, res) => {
  try {
    const { name, email, password, phone, location, skills, availability, languages } = req.body
    const existing = await User.findOne({ email })
    if (existing) return res.status(400).json({ message: 'Email already registered' })
    const hashedPassword = await bcrypt.hash(password, 10)
    const user = await User.create({
      name, email, password: hashedPassword, phone, location,
      skills: skills ? skills.split(',').map(s => s.trim()).filter(Boolean) : [],
      availability,
      languages: languages ? languages.split(',').map(l => l.trim()).filter(Boolean) : [],
    })
    const token = generateToken(user._id, 'volunteer')
    res.status(201).json({
      message: 'Volunteer registered successfully',
      token,
      user: {
        id: user._id, name: user.name, email: user.email,
        role: 'volunteer', location: user.location,
        skills: user.skills, availability: user.availability,
        languages: user.languages, hoursCompleted: user.hoursCompleted,
        eventsAttended: user.eventsAttended, performanceScore: user.performanceScore,
      }
    })
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message })
  }
}

// -------- REGISTER ORGANIZATION --------
const registerOrganization = async (req, res) => {
  try {
    const { name, email, password, phone, location, orgName, orgType, website, description } = req.body
    const existing = await Organization.findOne({ email })
    if (existing) return res.status(400).json({ message: 'Email already registered' })
    const hashedPassword = await bcrypt.hash(password, 10)
    const org = await Organization.create({
      name, email, password: hashedPassword, phone,
      location, orgName, orgType, website, description,
    })
    res.status(201).json({
      message: 'Organization registered. Awaiting admin verification.',
      org: {
        id: org._id, name: org.name, email: org.email,
        orgName: org.orgName, orgType: org.orgType, isVerified: org.isVerified,
      }
    })
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message })
  }
}

// -------- LOGIN --------
const login = async (req, res) => {
  try {
    const { email, password, role } = req.body
    let account = null
    if (role === 'volunteer' || role === 'admin') {
      account = await User.findOne({ email })
    } else if (role === 'org') {
      account = await Organization.findOne({ email })
    }
    if (!account) return res.status(404).json({ message: 'Account not found' })
    const isMatch = await bcrypt.compare(password, account.password)
    if (!isMatch) return res.status(401).json({ message: 'Incorrect password' })
    if (role === 'org' && !account.isVerified) {
      return res.status(403).json({ message: 'Your organization is pending admin verification.' })
    }
    if (role === 'admin' && account.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' })
    }
    const token = generateToken(account._id, role)
    res.json({
      message: 'Login successful', token,
      user: {
        id: account._id, name: account.name,
        email: account.email, role,
        ...(role === 'volunteer' && {
          location: account.location, skills: account.skills,
          availability: account.availability, languages: account.languages,
          hoursCompleted: account.hoursCompleted,
          eventsAttended: account.eventsAttended,
          performanceScore: account.performanceScore,
        }),
        ...(role === 'org' && {
          orgName: account.orgName, orgType: account.orgType,
          isVerified: account.isVerified,
        })
      }
    })
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message })
  }
}

// -------- GET VOLUNTEER PROFILE --------
const getVolunteerProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password')
    if (!user) return res.status(404).json({ message: 'User not found' })
    res.json(user)
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message })
  }
}

// -------- UPDATE VOLUNTEER PROFILE --------
const updateVolunteerProfile = async (req, res) => {
  try {
    const { name, phone, location, skills, availability, languages, currentPassword, newPassword } = req.body
    const user = await User.findById(req.user.id)
    if (!user) return res.status(404).json({ message: 'User not found' })

    // Update basic fields
    if (name) user.name = name
    if (phone) user.phone = phone
    if (location) user.location = location
    if (availability) user.availability = availability
    if (skills) user.skills = skills.split(',').map(s => s.trim()).filter(Boolean)
    if (languages) user.languages = languages.split(',').map(l => l.trim()).filter(Boolean)

    // Password change
    if (currentPassword && newPassword) {
      const isMatch = await bcrypt.compare(currentPassword, user.password)
      if (!isMatch) return res.status(401).json({ message: 'Current password is incorrect' })
      if (newPassword.length < 6) return res.status(400).json({ message: 'New password must be at least 6 characters' })
      user.password = await bcrypt.hash(newPassword, 10)
    }

    await user.save()
    const updated = await User.findById(req.user.id).select('-password')
    res.json({ message: 'Profile updated successfully', user: updated })
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message })
  }
}

// -------- GET ORG PROFILE --------
const getOrgProfile = async (req, res) => {
  try {
    const org = await Organization.findById(req.user.id).select('-password')
    if (!org) return res.status(404).json({ message: 'Organization not found' })
    res.json(org)
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message })
  }
}

// -------- UPDATE ORG PROFILE --------
const updateOrgProfile = async (req, res) => {
  try {
    const { name, phone, location, website, description, currentPassword, newPassword } = req.body
    const org = await Organization.findById(req.user.id)
    if (!org) return res.status(404).json({ message: 'Organization not found' })

    if (name) org.name = name
    if (phone) org.phone = phone
    if (location) org.location = location
    if (website) org.website = website
    if (description) org.description = description

    if (currentPassword && newPassword) {
      const isMatch = await bcrypt.compare(currentPassword, org.password)
      if (!isMatch) return res.status(401).json({ message: 'Current password is incorrect' })
      if (newPassword.length < 6) return res.status(400).json({ message: 'New password must be at least 6 characters' })
      org.password = await bcrypt.hash(newPassword, 10)
    }

    await org.save()
    const updated = await Organization.findById(req.user.id).select('-password')
    res.json({ message: 'Profile updated successfully', org: updated })
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message })
  }
}

// -------- ADMIN FUNCTIONS --------
const getPendingOrgs = async (req, res) => {
  try {
    const orgs = await Organization.find({ isVerified: false }).select('-password')
    res.json(orgs)
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message })
  }
}

const verifyOrganization = async (req, res) => {
  try {
    const org = await Organization.findByIdAndUpdate(
      req.params.id,
      { isVerified: true, verifiedAt: new Date() },
      { new: true }
    ).select('-password')
    if (!org) return res.status(404).json({ message: 'Organization not found' })
    res.json({ message: 'Organization verified successfully', org })
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message })
  }
}

const rejectOrganization = async (req, res) => {
  try {
    await Organization.findByIdAndDelete(req.params.id)
    res.json({ message: 'Organization rejected and removed' })
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message })
  }
}

const getAllVolunteers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1
    const limit = parseInt(req.query.limit) || 10
    const skip = (page - 1) * limit
    const search = req.query.search || ''

    const query = {
      role: 'volunteer',
      ...(search && {
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
          { location: { $regex: search, $options: 'i' } },
        ]
      })
    }

    const total = await User.countDocuments(query)
    const volunteers = await User.find(query)
      .select('-password')
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 })

    res.json({
      volunteers,
      total,
      page,
      pages: Math.ceil(total / limit)
    })
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message })
  }
}

const deleteVolunteer = async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id)
    res.json({ message: 'Volunteer deleted successfully' })
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message })
  }
}

module.exports = {
  registerVolunteer, registerOrganization, login,
  getVolunteerProfile, updateVolunteerProfile,
  getOrgProfile, updateOrgProfile,
  getPendingOrgs, verifyOrganization,
  rejectOrganization, getAllVolunteers, deleteVolunteer,
}