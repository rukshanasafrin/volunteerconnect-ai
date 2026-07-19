import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import API from '../api'

// ---------- Reusable Input (moved OUTSIDE Register so it isn't recreated on every keystroke) ----------
const Input = ({ label, name, type = 'text', placeholder, value, onChange, error }) => (
  <div>
    <label className="text-sm font-medium text-gray-700 mb-1 block">{label}</label>
    <input
      type={type} 
      name={name}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className={`w-full border rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary transition
        ${error ? 'border-red-400' : 'border-gray-300'}`}
    />
    {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
  </div>
)

const Select = ({ label, name, options, value, onChange, error }) => (
  <div>
    <label className="text-sm font-medium text-gray-700 mb-1 block">{label}</label>
    <select
      name={name}
      value={value}
      onChange={onChange}
      className={`w-full border rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary transition bg-white
        ${error ? 'border-red-400' : 'border-gray-300'}`}
    >
      <option value="">-- Select --</option>
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
    {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
  </div>
)

export default function Register() {
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [role, setRole] = useState('volunteer')
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})
  const [serverError, setServerError] = useState('')

  const [formData, setFormData] = useState({
    // Common
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    location: '',

    // Volunteer only
    skills: '',
    availability: '',
    languages: '',

    // Organization only
    orgName: '',
    orgType: '',
    website: '',
    description: '',
  })

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
    setErrors({ ...errors, [e.target.name]: '' })
  }

  // ---------- Validation ----------
  const validateStep1 = () => {
    const e = {}
    if (!formData.name.trim()) e.name = 'Name is required'
    if (!formData.email.trim()) e.email = 'Email is required'
    else if (!/\S+@\S+\.\S+/.test(formData.email)) e.email = 'Enter a valid email'
    if (!formData.password) e.password = 'Password is required'
    else if (formData.password.length < 6) e.password = 'Minimum 6 characters'
    if (!formData.confirmPassword) e.confirmPassword = 'Please confirm your password'
    else if (formData.password !== formData.confirmPassword) e.confirmPassword = 'Passwords do not match'
    if (!formData.phone.trim()) e.phone = 'Phone number is required'
    else if (!/^[0-9]{10}$/.test(formData.phone)) e.phone = 'Enter a valid 10-digit number'
    if (!formData.location.trim()) e.location = 'Location is required'
    return e
  }

  const validateStep2Volunteer = () => {
    const e = {}
    if (!formData.skills.trim()) e.skills = 'Please enter at least one skill'
    if (!formData.availability) e.availability = 'Please select availability'
    if (!formData.languages.trim()) e.languages = 'Please enter at least one language'
    return e
  }

  const validateStep2Org = () => {
    const e = {}
    if (!formData.orgName.trim()) e.orgName = 'Organization name is required'
    if (!formData.orgType) e.orgType = 'Please select organization type'
    if (!formData.description.trim()) e.description = 'Please describe your organization'
    return e
  }

  // ---------- Navigation ----------
  const handleNext = () => {
    const errs = validateStep1()
    if (Object.keys(errs).length > 0) { setErrors(errs); return }
    setStep(2)
  }

  const handleBack = () => setStep(1)

  const handleSubmit = async (e) => {
    e.preventDefault()
    const errs = role === 'volunteer' ? validateStep2Volunteer() : validateStep2Org()
    if (Object.keys(errs).length > 0) { setErrors(errs); return }

    setLoading(true)
    setServerError('')
    try {
      if (role === 'volunteer') {
        await API.post('/auth/register/volunteer', formData)
        navigate('/login')
      } else {
        await API.post('/auth/register/org', formData)
        navigate('/login')
      }
    } catch (err) {
      setServerError(err.response?.data?.message || 'Registration failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[90vh] flex items-center justify-center bg-gray-50 px-4 py-10">
      <div className="bg-white shadow-lg rounded-2xl p-8 w-full max-w-lg">

        {/* Header */}
        <div className="text-center mb-6">
          <h2 className="text-3xl font-bold text-gray-800">Create Account 🚀</h2>
          <p className="text-gray-500 mt-1">Step {step} of 2</p>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-gray-200 rounded-full h-2 mb-6">
          <div
            className="bg-primary h-2 rounded-full transition-all duration-300"
            style={{ width: step === 1 ? '50%' : '100%' }}
          />
        </div>

        {/* ---------- STEP 1 ---------- */}
        {step === 1 && (
          <div className="flex flex-col gap-4">

            {/* Role Selector */}
            <div className="flex rounded-xl overflow-hidden border border-gray-200 mb-2">
              {['volunteer', 'org'].map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => { setRole(r); setErrors({}) }}
                  className={`flex-1 py-2 text-sm font-semibold capitalize transition
                    ${role === r ? 'bg-primary text-white' : 'bg-white text-gray-500 hover:bg-gray-100'}`}
                >
                  {r === 'org' ? 'Organization' : 'Volunteer'}
                </button>
              ))}
            </div>

            <Input label="Full Name" name="name" placeholder="Your Name" value={formData.name} onChange={handleChange} error={errors.name} />
            <Input label="Email" name="email" placeholder="you@example.com" value={formData.email} onChange={handleChange} error={errors.email} />
            <Input label="Password" name="password" type="password" placeholder="••••••••" value={formData.password} onChange={handleChange} error={errors.password} />
            <Input label="Confirm Password" name="confirmPassword" type="password" placeholder="••••••••" value={formData.confirmPassword} onChange={handleChange} error={errors.confirmPassword} />
            <Input label="Phone Number" name="phone" placeholder="9876543210" value={formData.phone} onChange={handleChange} error={errors.phone} />
            <Input label="Location (City)" name="location" placeholder="Chennai" value={formData.location} onChange={handleChange} error={errors.location} />

            <button
              type="button"
              onClick={handleNext}
              className="bg-primary text-white py-3 rounded-xl font-semibold text-sm hover:bg-blue-700 transition mt-2"
            >
              Next →
            </button>
          </div>
        )}

        {/* ---------- STEP 2 VOLUNTEER ---------- */}
        {step === 2 && role === 'volunteer' && (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <p className="text-sm text-gray-500 -mt-2 mb-1">Tell us about your skills so we can match you to the right events.</p>
            {serverError && (
              <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-xl text-center">
                {serverError}
              </div>
            )}
            <Input
              label="Skills (comma separated)"
              name="skills"
              placeholder="Teaching, Python, First Aid"
              value={formData.skills}
              onChange={handleChange}
              error={errors.skills}
            />

            <Select
              label="Availability"
              name="availability"
              value={formData.availability}
              onChange={handleChange}
              error={errors.availability}
              options={[
                { value: 'weekdays', label: 'Weekdays' },
                { value: 'weekends', label: 'Weekends' },
                { value: 'both', label: 'Both' },
                { value: 'flexible', label: 'Flexible' },
              ]}
            />

            <Input
              label="Languages Known (comma separated)"
              name="languages"
              placeholder="English, Tamil, Hindi"
              value={formData.languages}
              onChange={handleChange}
              error={errors.languages}
            />

            <div className="flex gap-3 mt-2">
              <button
                type="button"
                onClick={handleBack}
                className="flex-1 border border-gray-300 text-gray-600 py-3 rounded-xl font-semibold text-sm hover:bg-gray-100 transition"
              >
                ← Back
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-primary text-white py-3 rounded-xl font-semibold text-sm hover:bg-blue-700 transition disabled:opacity-60"
              >
                {loading ? 'Creating Account...' : 'Register'}
              </button>
            </div>
          </form>
        )}

        {/* ---------- STEP 2 ORGANIZATION ---------- */}
        {step === 2 && role === 'org' && (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <p className="text-sm text-gray-500 -mt-2 mb-1">Tell us about your organization. An admin will review and verify your account before you can post events.</p>
            {serverError && (
              <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-xl text-center">
                {serverError}
              </div>
            )}
            <Input
              label="Organization Name"
              name="orgName"
              placeholder="Green Earth Foundation"
              value={formData.orgName}
              onChange={handleChange}
              error={errors.orgName}
            />

            <Select
              label="Organization Type"
              name="orgType"
              value={formData.orgType}
              onChange={handleChange}
              error={errors.orgType}
              options={[
                { value: 'ngo', label: 'NGO / Non-Profit' },
                { value: 'college', label: 'College / University' },
                { value: 'corporate', label: 'Corporate CSR' },
                { value: 'government', label: 'Government Body' },
                { value: 'community', label: 'Community Group' },
                { value: 'other', label: 'Other' },
              ]}
            />

            <Input
              label="Website (optional)"
              name="website"
              placeholder="https://yourorg.com"
              value={formData.website}
              onChange={handleChange}
              error={errors.website}
            />

            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">About Your Organization</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={3}
                placeholder="Briefly describe what your organization does and what kind of volunteers you need..."
                className={`w-full border rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary transition resize-none
                  ${errors.description ? 'border-red-400' : 'border-gray-300'}`}
              />
              {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description}</p>}
            </div>

            <div className="flex gap-3 mt-2">
              <button
                type="button"
                onClick={handleBack}
                className="flex-1 border border-gray-300 text-gray-600 py-3 rounded-xl font-semibold text-sm hover:bg-gray-100 transition"
              >
                ← Back
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-secondary text-white py-3 rounded-xl font-semibold text-sm hover:bg-green-700 transition disabled:opacity-60"
              >
                {loading ? 'Submitting...' : 'Submit for Approval'}
              </button>
            </div>
          </form>
        )}

        {/* Footer */}
        <p className="text-center text-sm text-gray-500 mt-6">
          Already have an account?{' '}
          <Link to="/login" className="text-primary font-semibold hover:underline">
            Login here
          </Link>
        </p>

      </div>
    </div>
  )
}