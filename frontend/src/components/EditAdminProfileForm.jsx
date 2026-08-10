import { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import API from '../api'

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
            focus:ring-2 focus:ring-primary
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

export default function EditAdminProfileForm({ profile, onUpdate }) {
  const [formData, setFormData] = useState({
    name: profile?.name || '',
    phone: profile?.phone || '',
    location: profile?.location || '',
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
      const res = await API.put('/auth/admin/profile', formData)
      onUpdate(res.data.user)
    } catch (err) {
      setServerError(err.response?.data?.message || 'Update failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white dark:bg-[#151D2A] dark:border dark:border-slate-800 rounded-2xl shadow p-6 max-w-2xl transition-colors duration-300">
      <h3 className="font-bold text-gray-800 dark:text-white text-lg mb-6">✏️ Edit Admin Profile</h3>

      {serverError && (
        <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 text-red-600 dark:text-red-300 text-sm px-4 py-3 rounded-xl mb-4">
          {serverError}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="grid md:grid-cols-2 gap-4">
          <Input label="Full Name" name="name" placeholder="Your name" value={formData.name} onChange={handleChange} errors={errors} />
          <Input label="Phone Number" name="phone" placeholder="9876543210" value={formData.phone} onChange={handleChange} errors={errors} />
          <Input label="Location (City)" name="location" placeholder="Chennai" value={formData.location} onChange={handleChange} errors={errors} />
        </div>

        <div className="border-t border-gray-200 dark:border-slate-700 pt-4 mt-2">
          <div className="flex justify-between items-center mb-3">
            <p className="text-sm font-semibold text-gray-700 dark:text-slate-300">🔒 Change Password (optional)</p>
            <button type="button" onClick={() => setShowPassword(!showPassword)}
              className="text-xs text-primary dark:text-accent hover:underline">
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
