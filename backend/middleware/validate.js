const { body, param, validationResult } = require('express-validator')

// Middleware to check validation results
const checkValidation = (req, res, next) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({
      message: errors.array()[0].msg,
      errors: errors.array()
    })
  }
  next()
}

// Volunteer Registration Validation
const validateVolunteerRegister = [
  body('name').trim().notEmpty().withMessage('Name is required')
    .isLength({ min: 2, max: 50 }).withMessage('Name must be 2-50 characters'),
  body('email').trim().isEmail().withMessage('Enter a valid email')
    .normalizeEmail(),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
    .matches(/\d/).withMessage('Password must contain at least one number'),
  body('phone').matches(/^[0-9]{10}$/).withMessage('Enter a valid 10-digit phone number'),
  body('location').trim().notEmpty().withMessage('Location is required'),
  body('availability').isIn(['weekdays', 'weekends', 'both', 'flexible'])
    .withMessage('Invalid availability option'),
  checkValidation
]

// Organization Registration Validation
const validateOrgRegister = [
  body('name').trim().notEmpty().withMessage('Contact name is required'),
  body('email').trim().isEmail().withMessage('Enter a valid email').normalizeEmail(),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
    .matches(/\d/).withMessage('Password must contain at least one number'),
  body('phone').matches(/^[0-9]{10}$/).withMessage('Enter a valid 10-digit phone number'),
  body('location').trim().notEmpty().withMessage('Location is required'),
  body('orgName').trim().notEmpty().withMessage('Organization name is required'),
  body('orgType').isIn(['ngo', 'college', 'corporate', 'government', 'community', 'other'])
    .withMessage('Invalid organization type'),
  body('description').trim().isLength({ min: 20 })
    .withMessage('Description must be at least 20 characters'),
  checkValidation
]

// Login Validation
const validateLogin = [
  body('email').trim().isEmail().withMessage('Enter a valid email').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required'),
  body('role').isIn(['volunteer', 'org', 'admin']).withMessage('Invalid role'),
  checkValidation
]

// Event Validation
const validateEvent = [
  body('title').trim().notEmpty().withMessage('Event title is required')
    .isLength({ min: 5, max: 100 }).withMessage('Title must be 5-100 characters'),
  body('description').trim().isLength({ min: 20 })
    .withMessage('Description must be at least 20 characters'),
  body('category').isIn(['education', 'environment', 'health', 'community', 'disaster relief', 'animal welfare', 'other'])
    .withMessage('Invalid category'),
  body('location').trim().notEmpty().withMessage('Location is required'),
  body('date').isISO8601().withMessage('Invalid date format')
    .custom((value) => {
      if (new Date(value) < new Date()) {
        throw new Error('Event date cannot be in the past')
      }
      return true
    }),
  body('duration').trim().notEmpty().withMessage('Duration is required'),
  body('volunteersNeeded').isInt({ min: 1, max: 10000 })
    .withMessage('Volunteers needed must be between 1 and 10000'),
  checkValidation
]

// ObjectId Validation
const validateObjectId = (paramName) => [
  param(paramName).isMongoId().withMessage('Invalid ID format'),
  checkValidation
]

module.exports = {
  validateVolunteerRegister,
  validateOrgRegister,
  validateLogin,
  validateEvent,
  validateObjectId,
}