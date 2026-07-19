import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import API from '../api'

import LoadingSpinner from '../components/LoadingSpinner'

if (loading) return <LoadingSpinner message="Loading your dashboard..." />

export default function AdminDashboard() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('overview')
  const [pendingOrgs, setPendingOrgs] = useState([])
  const [volunteers, setVolunteers] = useState([])
  const [loading, setLoading] = useState(true)
  const [notification, setNotification] = useState('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalVolunteers, setTotalVolunteers] = useState(0)

  useEffect(() => { fetchAll() }, [])
  useEffect(() => { fetchVolunteers() }, [page, search])

  const fetchAll = async () => {
    try {
      setLoading(true)
      const [pendingRes, volRes] = await Promise.all([
        API.get('/auth/admin/orgs/pending'),
        API.get('/auth/admin/volunteers?page=1&limit=10'),
      ])
      setPendingOrgs(pendingRes.data)
      const volData = volRes.data
      setVolunteers(volData.volunteers || volData)
      setTotalPages(volData.pages || 1)
      setTotalVolunteers(volData.total || volData.length)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const fetchVolunteers = async () => {
    try {
      const res = await API.get(`/auth/admin/volunteers?page=${page}&limit=10&search=${search}`)
      const data = res.data
      setVolunteers(data.volunteers || data)
      setTotalPages(data.pages || 1)
      setTotalVolunteers(data.total || data.length)
    } catch (err) {
      console.error(err)
    }
  }

  const showNotification = (msg) => {
    setNotification(msg)
    setTimeout(() => setNotification(''), 3000)
  }

  const handleVerify = async (id) => {
    try {
      await API.put(`/auth/admin/orgs/verify/${id}`)
      showNotification('✅ Organization verified!')
      fetchAll()
    } catch (err) {
      showNotification('❌ Failed to verify')
    }
  }

  const handleReject = async (id) => {
    if (!window.confirm('Reject this organization?')) return
    try {
      await API.delete(`/auth/admin/orgs/reject/${id}`)
      showNotification('🗑️ Organization rejected')
      fetchAll()
    } catch (err) {
      showNotification('❌ Failed to reject')
    }
  }

  const handleDeleteVolunteer = async (id) => {
    if (!window.confirm('Delete this volunteer?')) return
    try {
      await API.delete(`/auth/admin/volunteers/${id}`)
      showNotification('🗑️ Volunteer deleted')
      fetchVolunteers()
    } catch (err) {
      showNotification('❌ Failed to delete')
    }
  }

  const handleLogout = () => { logout(); navigate('/') }
  const tabs = ['overview', 'pending orgs', 'volunteers']

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm px-8 py-4 flex justify-between items-center">
        <h1 className="text-xl font-bold text-primary">🤝 VolunteerConnect</h1>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600">👋 {user?.name}</span>
          <span className="text-xs bg-purple-100 text-purple-700 px-3 py-1 rounded-full font-semibold">Admin</span>
          <button onClick={handleLogout} className="text-sm bg-red-50 text-red-500 px-4 py-2 rounded-lg hover:bg-red-100 transition">Logout</button>
        </div>
      </div>

      {notification && (
        <div className="fixed top-6 right-6 bg-gray-800 text-white px-6 py-3 rounded-xl shadow-lg z-50 text-sm font-medium">
          {notification}
        </div>
      )}

      <div className="max-w-6xl mx-auto px-6 py-8">

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total Volunteers', value: totalVolunteers, icon: '👥', color: 'text-blue-600', bg: 'bg-blue-50' },
            { label: 'Pending Approval', value: pendingOrgs.length, icon: '⏳', color: 'text-yellow-600', bg: 'bg-yellow-50' },
            { label: 'Total Organizations', value: pendingOrgs.length, icon: '🏢', color: 'text-green-600', bg: 'bg-green-50' },
            { label: 'Platform Status', value: 'Active', icon: '✅', color: 'text-green-600', bg: 'bg-green-50' },
          ].map(stat => (
            <div key={stat.label} className={`${stat.bg} rounded-2xl p-5 text-center`}>
              <div className="text-3xl mb-2">{stat.icon}</div>
              <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
              <div className="text-xs text-gray-500 mt-1">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-gray-200">
          {tabs.map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 text-sm font-semibold capitalize transition border-b-2 -mb-px
                ${activeTab === tab ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
              {tab === 'pending orgs' ? `Pending Orgs (${pendingOrgs.length})` : tab}
            </button>
          ))}
        </div>

        {loading && <div className="text-center py-12 text-gray-400">Loading...</div>}

        {/* Overview Tab */}
        {!loading && activeTab === 'overview' && (
          <div className="grid md:grid-cols-2 gap-6">

            {/* Pending Orgs */}
            <div className="bg-white rounded-2xl shadow p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-gray-800">⏳ Pending Organizations</h3>
                <button onClick={() => setActiveTab('pending orgs')}
                  className="text-xs text-primary hover:underline">View all →</button>
              </div>
              {pendingOrgs.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-3xl mb-2">🎉</p>
                  <p className="text-gray-400 text-sm">All organizations reviewed!</p>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {pendingOrgs.slice(0, 3).map(org => (
                    <div key={org._id} className="flex justify-between items-center p-3 bg-yellow-50 rounded-xl">
                      <div>
                        <p className="text-sm font-semibold text-gray-800">{org.orgName}</p>
                        <p className="text-xs text-gray-500">{org.email} · {org.orgType}</p>
                        <p className="text-xs text-gray-400">📍 {org.location}</p>
                      </div>
                      <div className="flex gap-1">
                        <button onClick={() => handleVerify(org._id)}
                          className="text-xs bg-green-500 text-white px-2 py-1 rounded-lg">✅</button>
                        <button onClick={() => handleReject(org._id)}
                          className="text-xs bg-red-400 text-white px-2 py-1 rounded-lg">❌</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Recent Volunteers */}
            <div className="bg-white rounded-2xl shadow p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-gray-800">👥 Recent Volunteers</h3>
                <button onClick={() => setActiveTab('volunteers')}
                  className="text-xs text-primary hover:underline">View all →</button>
              </div>
              {volunteers.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-3xl mb-2">👥</p>
                  <p className="text-gray-400 text-sm">No volunteers yet</p>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {volunteers.slice(0, 4).map(vol => (
                    <div key={vol._id} className="flex justify-between items-center p-3 bg-blue-50 rounded-xl">
                      <div>
                        <p className="text-sm font-semibold text-gray-800">{vol.name}</p>
                        <p className="text-xs text-gray-500">📍 {vol.location} · {vol.availability}</p>
                        <div className="flex gap-1 mt-1 flex-wrap">
                          {vol.skills?.slice(0, 2).map(s => (
                            <span key={s} className="text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full">{s}</span>
                          ))}
                        </div>
                      </div>
                      <div className="text-center bg-primary text-white px-3 py-2 rounded-xl">
                        <p className="text-lg font-bold">{vol.performanceScore}</p>
                        <p className="text-xs opacity-80">Score</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        )}

        {/* Pending Orgs Tab */}
        {!loading && activeTab === 'pending orgs' && (
          <div className="flex flex-col gap-4">
            {pendingOrgs.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-2xl shadow">
                <p className="text-5xl mb-4">🎉</p>
                <h3 className="text-lg font-bold text-gray-700">No Pending Organizations!</h3>
                <p className="text-gray-400 text-sm mt-2">All organizations have been reviewed.</p>
              </div>
            ) : (
              pendingOrgs.map(org => (
                <div key={org._id} className="bg-white rounded-2xl shadow p-6">
                  <div className="flex flex-col md:flex-row justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-bold text-gray-800 text-lg">{org.orgName}</h3>
                        <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full capitalize">{org.orgType}</span>
                        <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full">Pending</span>
                      </div>
                      <p className="text-sm text-gray-500">📧 {org.email}</p>
                      <p className="text-sm text-gray-500">📍 {org.location} &nbsp;|&nbsp; 📞 {org.phone}</p>
                      {org.website && (
                        <a href={org.website} target="_blank" rel="noreferrer" className="text-sm text-primary hover:underline mt-1 block">
                          🌐 {org.website}
                        </a>
                      )}
                      <p className="text-sm text-gray-600 mt-2">{org.description}</p>
                      <p className="text-xs text-gray-400 mt-2">Registered: {new Date(org.createdAt).toLocaleDateString()}</p>
                    </div>
                    <div className="flex md:flex-col gap-3">
                      <button onClick={() => handleVerify(org._id)}
                        className="bg-green-500 text-white px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-green-600 transition">
                        ✅ Verify
                      </button>
                      <button onClick={() => handleReject(org._id)}
                        className="bg-red-50 text-red-500 px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-red-100 transition">
                        ❌ Reject
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Volunteers Tab */}
        {!loading && activeTab === 'volunteers' && (
          <div className="flex flex-col gap-4">
            <input
              type="text"
              placeholder="🔍 Search by name, email or location..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1) }}
              className="border border-gray-300 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary"
            />
            {volunteers.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-2xl shadow">
                <p className="text-5xl mb-4">👥</p>
                <h3 className="text-lg font-bold text-gray-700">No Volunteers Found</h3>
              </div>
            ) : (
              <>
                {volunteers.map(vol => (
                  <div key={vol._id} className="bg-white rounded-2xl shadow p-6 flex flex-col md:flex-row justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-bold text-gray-800">{vol.name}</h3>
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full capitalize">{vol.availability}</span>
                      </div>
                      <p className="text-sm text-gray-500">📧 {vol.email} &nbsp;|&nbsp; 📍 {vol.location} &nbsp;|&nbsp; 📞 {vol.phone}</p>
                      <p className="text-sm text-gray-500 mt-1">🌐 {vol.languages?.join(', ')}</p>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {vol.skills?.map(skill => (
                          <span key={skill} className="bg-blue-50 text-blue-600 text-xs px-2 py-1 rounded-full">{skill}</span>
                        ))}
                      </div>
                      <p className="text-xs text-gray-400 mt-2">Joined: {new Date(vol.createdAt).toLocaleDateString()}</p>
                    </div>
                    <div className="flex flex-col items-end gap-3">
                      <div className="text-center bg-primary text-white px-4 py-2 rounded-xl">
                        <p className="text-lg font-bold">{vol.performanceScore}</p>
                        <p className="text-xs opacity-80">Score</p>
                      </div>
                      <button onClick={() => handleDeleteVolunteer(vol._id)}
                        className="text-xs bg-red-50 text-red-500 px-4 py-2 rounded-lg hover:bg-red-100 transition font-semibold">
                        🗑️ Delete
                      </button>
                    </div>
                  </div>
                ))}
                <div className="flex justify-center items-center gap-3 mt-4">
                  <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                    className="px-4 py-2 rounded-xl border text-sm font-semibold disabled:opacity-40 hover:bg-gray-50">← Prev</button>
                  <span className="text-sm text-gray-600">Page {page} of {totalPages}</span>
                  <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                    className="px-4 py-2 rounded-xl border text-sm font-semibold disabled:opacity-40 hover:bg-gray-50">Next →</button>
                </div>
              </>
            )}
          </div>
        )}

      </div>
    </div>
  )
}