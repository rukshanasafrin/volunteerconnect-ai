import { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import API from '../api'

// FIXED: Moved Input out of the main render function to prevent loss of focus
const Input = ({ label, name, type = 'text', placeholder, value, onChange, errors }) => {
  const isPassword = type === 'password'
  const [showPassword, setShowPassword] = useState(false)

  return (
    <div>
      <label className="text-sm font-medium text-gray-700 dark:text-slate-300 mb-1 block">{label}</label>
      <div className="relative">
        <input
          type={isPassword ? (showPassword ? 'text' : 'password') : type}
          name={name} value={value}
          onChange={onChange} placeholder={placeholder}
          className={`w-full border rounded-xl px-4 py-2.5 text-sm outline-none transition
            bg-white text-gray-900 placeholder-gray-400
            dark:bg-slate-800 dark:text-white dark:placeholder-slate-500
            focus:ring-2 focus:ring-secondary
            ${isPassword ? 'pr-11' : ''}
            ${errors[name] ? 'border-red-400' : 'border-gray-300 dark:border-slate-700'}`}
        />
        {isPassword && (
          <button
            type="button"
            tabIndex={-1}
            onClick={() => setShowPassword((prev) => !prev)}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:text-slate-500 dark:hover:text-slate-300 transition"
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        )}
      </div>
      {errors[name] && <p className="text-red-500 dark:text-red-400 text-xs mt-1">{errors[name]}</p>}
    </div>
  )
}

export default function EditOrgProfileForm({ profile, onUpdate }) {
  const [formData, setFormData] = useState({
    name: profile?.name || '',
    phone: profile?.phone || '',
    location: profile?.location || '',
    website: profile?.website || '',
    description: profile?.description || '',
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
    if (!formData.name.trim()) e.name = 'Contact name is required'
    if (!formData.phone.match(/^[0-9]{10}$/)) e.phone = 'Enter valid 10-digit number'
    if (!formData.location.trim()) e.location = 'Location is required'
    if (!formData.description.trim()) e.description = 'Description is required'
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
      const res = await API.put('/auth/org/profile', formData)
      onUpdate(res.data.org)
    } catch (err) {
      setServerError(err.response?.data?.message || 'Update failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white dark:bg-[#151D2A] dark:border dark:border-slate-800 rounded-2xl shadow p-6 max-w-2xl transition-colors duration-300">
      <h3 className="font-bold text-gray-800 dark:text-white text-lg mb-6">✏️ Edit Organization Profile</h3>

      {serverError && (
        <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 text-red-600 dark:text-red-300 text-sm px-4 py-3 rounded-xl mb-4">
          {serverError}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="grid md:grid-cols-2 gap-4">
          <Input label="Contact Person Name" name="name" placeholder="Your name" value={formData.name} onChange={handleChange} errors={errors} />
          <Input label="Phone Number" name="phone" placeholder="9876543210" value={formData.phone} onChange={handleChange} errors={errors} />
          <Input label="Location (City)" name="location" placeholder="Chennai" value={formData.location} onChange={handleChange} errors={errors} />
          <Input label="Website (optional)" name="website" placeholder="https://yourorg.com" value={formData.website} onChange={handleChange} errors={errors} />
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700 dark:text-slate-300 mb-1 block">About Your Organization</label>
          <textarea
            name="description" value={formData.description}
            onChange={handleChange} rows={4}
            placeholder="Describe what your organization does..."
            className={`w-full border rounded-xl px-4 py-2.5 text-sm outline-none transition resize-none
              bg-white text-gray-900 placeholder-gray-400
              dark:bg-slate-800 dark:text-white dark:placeholder-slate-500
              focus:ring-2 focus:ring-secondary
              ${errors.description ? 'border-red-400' : 'border-gray-300 dark:border-slate-700'}`}
          />
          {errors.description && <p className="text-red-500 dark:text-red-400 text-xs mt-1">{errors.description}</p>}
        </div>

        <div className="border-t border-gray-200 dark:border-slate-700 pt-4 mt-2">
          <div className="flex justify-between items-center mb-3">
            <p className="text-sm font-semibold text-gray-700 dark:text-slate-300">🔒 Change Password (optional)</p>
            <button type="button" onClick={() => setShowPassword(!showPassword)}
              className="text-xs text-secondary dark:text-accent hover:underline">
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

        <button type="submit" disabled={loading}
          className="bg-secondary text-white py-3 rounded-xl font-semibold text-sm hover:bg-green-700 transition disabled:opacity-60 mt-2">
          {loading ? 'Saving...' : '💾 Save Changes'}
        </button>
      </form>
    </div>
  )
}