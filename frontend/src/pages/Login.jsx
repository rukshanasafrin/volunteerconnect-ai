import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import API from '../api'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [formData, setFormData] = useState({ email: '', password: '', role: 'volunteer' })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [serverError, setServerError] = useState('')

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

      // Redirect based on role
      if (res.data.user.role === 'volunteer') navigate('/volunteer/dashboard')
      else if (res.data.user.role === 'org') navigate('/org/dashboard')
      else navigate('/admin/dashboard')

    } catch (err) {
      setServerError(err.response?.data?.message || 'Login failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[90vh] flex items-center justify-center bg-gray-50 px-4">
      <div className="bg-white shadow-lg rounded-2xl p-8 w-full max-w-md">

        <div className="text-center mb-6">
          <h2 className="text-3xl font-bold text-gray-800">Welcome Back 👋</h2>
          <p className="text-gray-500 mt-1">Login to your account</p>
        </div>

        {/* Role Selector */}
        <div className="flex rounded-xl overflow-hidden border border-gray-200 mb-6">
          {['volunteer', 'org', 'admin'].map((role) => (
            <button
              key={role}
              onClick={() => setFormData({ ...formData, role })}
              className={`flex-1 py-2 text-sm font-semibold capitalize transition
                ${formData.role === role
                  ? 'bg-primary text-white'
                  : 'bg-white text-gray-500 hover:bg-gray-100'
                }`}
            >
              {role === 'org' ? 'Organization' : role.charAt(0).toUpperCase() + role.slice(1)}
            </button>
          ))}
        </div>

        {/* Server Error */}
        {serverError && (
  <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-xl mb-4 text-center flex items-center gap-2 justify-center">
    <span>⚠️</span> {serverError}
  </div>
)}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">Email</label>
            <input
              type="text"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="you@example.com"
              className={`w-full border rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary transition
                ${errors.email ? 'border-red-400' : 'border-gray-300'}`}
            />
            {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">Password</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="••••••••"
              className={`w-full border rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary transition
                ${errors.password ? 'border-red-400' : 'border-gray-300'}`}
            />
            {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
          </div>

          <div className="text-right">
            <a href="#" className="text-sm text-primary hover:underline">Forgot password?</a>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="bg-primary text-white py-3 rounded-xl font-semibold text-sm hover:bg-blue-700 transition disabled:opacity-60"
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-6">
          Don't have an account?{' '}
          <Link to="/register" className="text-primary font-semibold hover:underline">
            Register here
          </Link>
        </p>
      </div>
    </div>
  )
}