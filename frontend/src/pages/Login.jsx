import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff } from 'lucide-react'
import API from '../api'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [formData, setFormData] = useState({ email: '', password: '', role: 'volunteer' })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [serverError, setServerError] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  const validate = () => {
    const newErrors = {}
    if (!formData.email) newErrors.email = 'Email is required'
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Enter a valid email'
    if (!formData.password) newErrors.password = 'Password is required'
    else if (formData.password.length < 6) newErrors.password = 'Minimum 6 characters'
    return newErrors
  }

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
    setErrors({ ...errors, [e.target.name]: '' })
    setServerError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const validationErrors = validate()
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      return
    }

    setLoading(true)
    try {
      const res = await API.post('/auth/login', formData)
      login(res.data.user, res.data.token)

      // Redirect based on the role the server actually returns —
      // this may be 'admin' even if the volunteer/org tab was selected,
      // since admin login is detected silently by the backend.
      if (res.data.user.role === 'admin') navigate('/admin/dashboard')
      else if (res.data.user.role === 'volunteer') navigate('/volunteer/dashboard')
      else navigate('/org/dashboard')

    } catch (err) {
      setServerError(err.response?.data?.message || 'Login failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[90vh] flex items-center justify-center bg-gray-50 dark:bg-[#0B0F19] px-4 transition-colors duration-300">
      <div className="bg-white dark:bg-[#151D2A] dark:border dark:border-slate-800 shadow-lg rounded-2xl p-8 w-full max-w-md transition-colors duration-300">

        <div className="text-center mb-6">
          <h2 className="text-3xl font-bold text-gray-800 dark:text-white">Welcome Back 👋</h2>
          <p className="text-gray-500 dark:text-slate-400 mt-1">Login to your account</p>
        </div>

        {/* Role Selector */}
        <div className="flex rounded-xl overflow-hidden border border-gray-200 dark:border-slate-700 mb-6">
          {['volunteer', 'org'].map((role) => (
            <button
              key={role}
              onClick={() => setFormData({ ...formData, role })}
              className={`flex-1 py-2 text-sm font-semibold capitalize transition
                ${formData.role === role
                  ? 'bg-primary text-white'
                  : 'bg-white dark:bg-[#151D2A] text-gray-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800'
                }`}
            >
              {role === 'org' ? 'Organization' : role.charAt(0).toUpperCase() + role.slice(1)}
            </button>
          ))}
        </div>

        {/* Server Error */}
        {serverError && (
  <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 text-red-600 dark:text-red-300 text-sm px-4 py-3 rounded-xl mb-4 text-center flex items-center gap-2 justify-center">
    <span>⚠️</span> {serverError}
  </div>
)}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-slate-300 mb-1 block">Email</label>
            <input
              type="text"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="you@example.com"
              className={`w-full border rounded-xl px-4 py-2.5 text-sm outline-none transition
                bg-white text-gray-900 placeholder-gray-400
                dark:bg-slate-800 dark:text-white dark:placeholder-slate-500
                focus:ring-2 focus:ring-primary
                ${errors.email ? 'border-red-400' : 'border-gray-300 dark:border-slate-700'}`}
            />
            {errors.email && <p className="text-red-500 dark:text-red-400 text-xs mt-1">{errors.email}</p>}
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-slate-300 mb-1 block">Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••"
                className={`w-full border rounded-xl px-4 py-2.5 pr-11 text-sm outline-none transition
                  bg-white text-gray-900 placeholder-gray-400
                  dark:bg-slate-800 dark:text-white dark:placeholder-slate-500
                  focus:ring-2 focus:ring-primary
                  ${errors.password ? 'border-red-400' : 'border-gray-300 dark:border-slate-700'}`}
              />
              <button
                type="button"
                tabIndex={-1}
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:text-slate-500 dark:hover:text-slate-300 transition"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {errors.password && <p className="text-red-500 dark:text-red-400 text-xs mt-1">{errors.password}</p>}
          </div>

          <div className="text-right">
            <a href="#" className="text-sm text-primary dark:text-accent hover:underline">Forgot password?</a>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="bg-primary text-white py-3 rounded-xl font-semibold text-sm hover:bg-[#1D1D43] transition disabled:opacity-60"
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 dark:text-slate-400 mt-6">
          Don't have an account?{' '}
          <Link to="/register" className="text-primary dark:text-accent font-semibold hover:underline">
            Register here
          </Link>
        </p>
      </div>
    </div>
  )
}