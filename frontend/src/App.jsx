import { useLocation } from 'react-router-dom'
import AppRoutes from './routes/AppRoutes'
import Navbar from './components/Navbar'

const HIDE_NAVBAR = [
  '/volunteer/dashboard',
  '/org/dashboard',
  '/admin/dashboard'
]

function App() {
  const location = useLocation()
  const hideNav = HIDE_NAVBAR.some(path => location.pathname.startsWith(path))

  return (
    <div className="min-h-screen bg-gray-50">
      {!hideNav && <Navbar />}
      <AppRoutes />
    </div>
  )
}

export default App