import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  const getDashboardLink = () => {
    if (user?.role === 'volunteer') return '/volunteer/dashboard'
    if (user?.role === 'org') return '/org/dashboard'
    if (user?.role === 'admin') return '/admin/dashboard'
    return '/'
  }

  return (
    <nav className="bg-white shadow-md px-8 py-4 flex justify-between items-center">
      <Link to="/" className="text-2xl font-bold text-primary">
        🤝 VolunteerConnect
      </Link>

      <div className="flex gap-6 text-gray-600 font-medium items-center">
        <Link to="/" className="hover:text-primary transition">Home</Link>

        {user ? (
          // Logged in state
          <>
            <Link
              to={getDashboardLink()}
              className="hover:text-primary transition text-sm"
            >
              Dashboard
            </Link>
            <span className="text-xs bg-blue-100 text-blue-700 px-3 py-1 rounded-full font-semibold capitalize">
              {user.role === 'org' ? 'Organization' : user.role}
            </span>
            <span className="text-sm text-gray-600">👋 {user.name}</span>
            <button
              onClick={handleLogout}
              className="bg-red-50 text-red-500 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-red-100 transition"
            >
              Logout
            </button>
          </>
        ) : (
          // Logged out state
          <>
            <Link to="/login" className="hover:text-primary transition">Login</Link>
            <Link
              to="/register"
              className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
            >
              Register
            </Link>
          </>
        )}
      </div>
    </nav>
  )
}