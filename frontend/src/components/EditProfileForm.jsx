import { useState } from 'react'
import API from '../api'

// FIXED: Moved Input out of the main render function to prevent loss of focus
const Input = ({ label, name, type = 'text', placeholder, value, onChange, errors }) => (
  <div>
    <label className="text-sm font-medium text-gray-700 mb-1 block">{label}</label>
    <input
      type={type} name={name} value={value}
      onChange={onChange} placeholder={placeholder}
      className={`w-full border rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary transition
        ${errors[name] ? 'border-red-400' : 'border-gray-300'}`}
    />
    {errors[name] && <p className="text-red-500 text-xs mt-1">{errors[name]}</p>}
  </div>
)

export default function EditProfileForm({ profile, onUpdate }) {
  const [formData, setFormData] = useState({
    name: profile?.name || '',
    phone: profile?.phone || '',
    location: profile?.location || '',
    skills: profile?.skills?.join(', ') || '',
    availability: profile?.availability || '',
    languages: profile?.languages?.join(', ') || '',
    currentPassword: '',
    newPassword: '',
  })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [serverError, setServerError] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
    setErrors({ ...errors, [e.target.name]: '' })
    setServerError('')
  }

  const validate = () => {
    const e = {}
    if (!formData.name.trim()) e.name = 'Name is required'
    if (!formData.phone.match(/^[0-9]{10}$/)) e.phone = 'Enter valid 10-digit number'
    if (!formData.location.trim()) e.location = 'Location is required'
    if (!formData.skills.trim()) e.skills = 'At least one skill required'
    if (!formData.availability) e.availability = 'Select availability'
    if (formData.newPassword && !formData.currentPassword) {
      e.currentPassword = 'Enter current password to change password'
    }
    if (formData.newPassword && formData.newPassword.length < 6) {
      e.newPassword = 'New password must be at least 6 characters'
    }
    return e
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length > 0) { setErrors(errs); return }

    setLoading(true)
    try {
      const res = await API.put('/auth/volunteer/profile', formData)
      onUpdate(res.data.user)
    } catch (err) {
      setServerError(err.response?.data?.message || 'Update failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-2xl shadow p-6 max-w-2xl">
      <h3 className="font-bold text-gray-800 text-lg mb-6">✏️ Edit Your Profile</h3>

      {serverError && (
        <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-xl mb-4">
          {serverError}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="grid md:grid-cols-2 gap-4">
          <Input label="Full Name" name="name" placeholder="Your name" value={formData.name} onChange={handleChange} errors={errors} />
          <Input label="Phone Number" name="phone" placeholder="9876543210" value={formData.phone} onChange={handleChange} errors={errors} />
          <Input label="Location (City)" name="location" placeholder="Chennai" value={formData.location} onChange={handleChange} errors={errors} />

          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">Availability</label>
            <select name="availability" value={formData.availability} onChange={handleChange}
              className={`w-full border rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary transition bg-white
                ${errors.availability ? 'border-red-400' : 'border-gray-300'}`}>
              <option value="">-- Select --</option>
              <option value="weekdays">Weekdays</option>
              <option value="weekends">Weekends</option>
              <option value="both">Both</option>
              <option value="flexible">Flexible</option>
            </select>
            {errors.availability && <p className="text-red-500 text-xs mt-1">{errors.availability}</p>}
          </div>
        </div>

        <Input label="Skills (comma separated)" name="skills" placeholder="Teaching, Python, First Aid" value={formData.skills} onChange={handleChange} errors={errors} />
        <Input label="Languages (comma separated)" name="languages" placeholder="English, Tamil" value={formData.languages} onChange={handleChange} errors={errors} />

        {/* Password Change Section */}
        <div className="border-t pt-4 mt-2">
          <div className="flex justify-between items-center mb-3">
            <p className="text-sm font-semibold text-gray-700">🔒 Change Password (optional)</p>
            <button type="button" onClick={() => setShowPassword(!showPassword)}
              className="text-xs text-primary hover:underline">
              {showPassword ? 'Hide' : 'Change password'}
            </button>
          </div>

          {showPassword && (
            <div className="grid md:grid-cols-2 gap-4">
              <Input label="Current Password" name="currentPassword" type="password" placeholder="••••••••" value={formData.currentPassword} onChange={handleChange} errors={errors} />
              <Input label="New Password" name="newPassword" type="password" placeholder="••••••••" value={formData.newPassword} onChange={handleChange} errors={errors} />
            </div>
          )}
        </div>

        <div className="flex gap-3 mt-2">
          <button type="submit" disabled={loading}
            className="flex-1 bg-primary text-white py-3 rounded-xl font-semibold text-sm hover:bg-blue-700 transition disabled:opacity-60">
            {loading ? 'Saving...' : '💾 Save Changes'}
          </button>
        </div>
      </form>
    </div>
  )
}