import { Routes, Route, Navigate } from 'react-router-dom'
import Home from '../pages/Home'
import Login from '../pages/Login'
import Register from '../pages/Register'
import VolunteerDashboard from '../pages/VolunteerDashboard'
import OrgDashboard from '../pages/OrgDashboard'
import AdminDashboard from '../pages/AdminDashboard'
import { useAuth } from '../context/AuthContext'

// Protected Route Component
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-5xl mb-4">⏳</div>
          <p className="text-gray-500">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />
  }

  return children
}

export default function AppRoutes() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Volunteer Protected */}
      <Route path="/volunteer/dashboard" element={
        <ProtectedRoute allowedRoles={['volunteer']}>
          <VolunteerDashboard />
        </ProtectedRoute>
      } />

      {/* Org Protected */}
      <Route path="/org/dashboard" element={
        <ProtectedRoute allowedRoles={['org']}>
          <OrgDashboard />
        </ProtectedRoute>
      } />

      {/* Admin Protected */}
      <Route path="/admin/dashboard" element={
        <ProtectedRoute allowedRoles={['admin']}>
          <AdminDashboard />
        </ProtectedRoute>
      } />

      {/* Catch all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}