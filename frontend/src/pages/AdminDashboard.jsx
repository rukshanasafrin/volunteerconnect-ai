import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import API from '../api'
import { MiniBarChart, MiniPieChart } from '../components/AdminCharts'
import EditAdminProfileForm from '../components/EditAdminProfileForm'
import ThemeToggle from '../components/ThemeToggle'

const CATEGORIES = ['education', 'environment', 'health', 'community', 'disaster relief', 'animal welfare', 'other']
const EVENT_STATUSES = ['upcoming', 'ongoing', 'completed', 'cancelled']

const STATUS_BADGE = {
  upcoming: 'bg-blue-100 text-blue-700', ongoing: 'bg-amber-100 text-amber-700',
  completed: 'bg-green-100 text-green-700', cancelled: 'bg-gray-200 text-gray-600 dark:text-slate-300',
}

export default function AdminDashboard() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('overview')
  const [notification, setNotification] = useState('')
  const [detailModal, setDetailModal] = useState(null) // { type: 'org'|'volunteer', data }

  const showNotification = (msg) => {
    setNotification(msg)
    setTimeout(() => setNotification(''), 3000)
  }
  const handleLogout = () => { logout(); navigate('/') }

  // ---------------- PROFILE ----------------
  const [adminProfile, setAdminProfile] = useState(null)
  const [profileLoading, setProfileLoading] = useState(false)

  const fetchAdminProfile = useCallback(async () => {
    try {
      setProfileLoading(true)
      const res = await API.get('/auth/admin/profile')
      setAdminProfile(res.data)
    } catch (err) {
      console.error(err)
    } finally {
      setProfileLoading(false)
    }
  }, [])

  useEffect(() => {
    if (activeTab === 'edit profile' && !adminProfile) fetchAdminProfile()
  }, [activeTab, adminProfile, fetchAdminProfile])

  // ---------------- OVERVIEW ----------------
  const [stats, setStats] = useState(null)
  const [activity, setActivity] = useState([])
  const [pendingOrgs, setPendingOrgs] = useState([])
  const [overviewLoading, setOverviewLoading] = useState(true)

  const fetchOverview = useCallback(async () => {
    try {
      setOverviewLoading(true)
      const [statsRes, activityRes, pendingRes] = await Promise.all([
        API.get('/admin/stats'),
        API.get('/admin/activity?limit=12'),
        API.get('/auth/admin/orgs/pending'),
      ])
      setStats(statsRes.data)
      setActivity(activityRes.data)
      setPendingOrgs(pendingRes.data)
    } catch (err) {
      console.error(err)
    } finally {
      setOverviewLoading(false)
    }
  }, [])

  useEffect(() => { fetchOverview() }, [fetchOverview])

  const handleVerify = async (id) => {
    try {
      await API.put(`/auth/admin/orgs/verify/${id}`)
      showNotification('✅ Organization verified!')
      fetchOverview()
      if (activeTab === 'organizations') fetchOrganizations()
    } catch {
      showNotification('❌ Failed to verify')
    }
  }

  const handleReject = async (id) => {
    if (!window.confirm('Reject this organization? This cannot be undone.')) return
    try {
      await API.delete(`/auth/admin/orgs/reject/${id}`)
      showNotification('🗑️ Organization rejected')
      fetchOverview()
      if (activeTab === 'organizations') fetchOrganizations()
    } catch {
      showNotification('❌ Failed to reject')
    }
  }

  // ---------------- ORGANIZATIONS ----------------
  const [orgs, setOrgs] = useState([])
  const [orgSearch, setOrgSearch] = useState('')
  const [orgStatus, setOrgStatus] = useState('')
  const [orgPage, setOrgPage] = useState(1)
  const [orgTotalPages, setOrgTotalPages] = useState(1)
  const [orgLoading, setOrgLoading] = useState(false)

  const fetchOrganizations = useCallback(async () => {
    try {
      setOrgLoading(true)
      const res = await API.get('/admin/organizations', { params: { search: orgSearch, status: orgStatus, page: orgPage, limit: 10 } })
      setOrgs(res.data.organizations)
      setOrgTotalPages(res.data.pages)
    } catch (err) {
      console.error(err)
    } finally {
      setOrgLoading(false)
    }
  }, [orgSearch, orgStatus, orgPage])

  useEffect(() => { if (activeTab === 'organizations') fetchOrganizations() }, [activeTab, fetchOrganizations])

  const openOrgDetails = async (id) => {
    try {
      const res = await API.get(`/admin/organizations/${id}`)
      setDetailModal({ type: 'org', data: res.data })
    } catch {
      showNotification('❌ Could not load organization details')
    }
  }

  // ---------------- VOLUNTEERS ----------------
  const [volunteers, setVolunteers] = useState([])
  const [volSearch, setVolSearch] = useState('')
  const [volStatus, setVolStatus] = useState('')
  const [volPage, setVolPage] = useState(1)
  const [volTotalPages, setVolTotalPages] = useState(1)
  const [volLoading, setVolLoading] = useState(false)

  const fetchVolunteers = useCallback(async () => {
    try {
      setVolLoading(true)
      const res = await API.get('/admin/volunteers', { params: { search: volSearch, status: volStatus, page: volPage, limit: 10 } })
      setVolunteers(res.data.volunteers)
      setVolTotalPages(res.data.pages)
    } catch (err) {
      console.error(err)
    } finally {
      setVolLoading(false)
    }
  }, [volSearch, volStatus, volPage])

  useEffect(() => { if (activeTab === 'volunteers') fetchVolunteers() }, [activeTab, fetchVolunteers])

  const openVolunteerDetails = async (id) => {
    try {
      const res = await API.get(`/admin/volunteers/${id}`)
      setDetailModal({ type: 'volunteer', data: res.data })
    } catch {
      showNotification('❌ Could not load volunteer details')
    }
  }

  const handleDeleteVolunteer = async (id) => {
    if (!window.confirm('Permanently delete this volunteer? This cannot be undone.')) return
    try {
      await API.delete(`/auth/admin/volunteers/${id}`)
      showNotification('🗑️ Volunteer deleted')
      fetchVolunteers()
      setDetailModal(null)
    } catch {
      showNotification('❌ Failed to delete')
    }
  }

  // ---------------- EVENTS ----------------
  const [events, setEvents] = useState([])
  const [eventSearch, setEventSearch] = useState('')
  const [eventCategory, setEventCategory] = useState('')
  const [eventStatus, setEventStatus] = useState('')
  const [eventLocation, setEventLocation] = useState('')
  const [eventPage, setEventPage] = useState(1)
  const [eventTotalPages, setEventTotalPages] = useState(1)
  const [eventLoading, setEventLoading] = useState(false)

  const fetchEvents = useCallback(async () => {
    try {
      setEventLoading(true)
      const res = await API.get('/admin/events', {
        params: { search: eventSearch, category: eventCategory, status: eventStatus, location: eventLocation, page: eventPage, limit: 10 },
      })
      setEvents(res.data.events)
      setEventTotalPages(res.data.pages)
    } catch (err) {
      console.error(err)
    } finally {
      setEventLoading(false)
    }
  }, [eventSearch, eventCategory, eventStatus, eventLocation, eventPage])

  useEffect(() => { if (activeTab === 'events') fetchEvents() }, [activeTab, fetchEvents])


  const tabs = ['overview', 'organizations', 'events', 'volunteers', 'edit profile']

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0B0F19] transition-colors duration-300">
      <div className="bg-white shadow-sm dark:bg-[#151D2A] dark:shadow-none dark:border-b dark:border-slate-800 px-8 py-4 flex justify-between items-center">
        <h1 className="text-xl font-bold text-primary">🤝 VolunteerConnect</h1>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600 dark:text-slate-300">👋 {user?.name}</span>
          <span className="text-xs bg-purple-100 text-purple-700 px-3 py-1 rounded-full font-semibold">Admin</span>
          <ThemeToggle />
          <button onClick={handleLogout} className="text-sm bg-red-50 dark:bg-red-500/10 text-red-500 px-4 py-2 rounded-lg hover:bg-red-100 transition">Logout</button>
        </div>
      </div>

      {notification && (
        <div className="fixed top-6 right-6 bg-gray-800 text-white px-6 py-3 rounded-xl shadow-lg z-50 text-sm font-medium">
          {notification}
        </div>
      )}

      <div className="max-w-6xl mx-auto px-6 py-8">

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-gray-200 dark:border-slate-700 overflow-x-auto">
          {tabs.map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 text-sm font-semibold capitalize transition border-b-2 -mb-px whitespace-nowrap
                ${activeTab === tab ? 'border-primary text-primary' : 'border-transparent text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:text-slate-300'}`}>
              {tab === 'organizations' && pendingOrgs.length > 0 ? `Organizations (${pendingOrgs.length} pending)` : tab}
            </button>
          ))}
        </div>

        {/* ============ OVERVIEW ============ */}
        {activeTab === 'overview' && (
          <>
            {overviewLoading ? (
              <div className="text-center py-16 text-gray-400 dark:text-slate-500">Loading dashboard...</div>
            ) : (
              <>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  {[
                    { label: 'Volunteers', value: stats?.totalVolunteers ?? 0, icon: '👥', color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-500/10' },
                    { label: 'Organizations', value: stats?.totalOrganizations ?? 0, icon: '🏢', color: 'text-green-600', bg: 'bg-green-50 dark:bg-green-500/10' },
                    { label: 'Events', value: stats?.totalEvents ?? 0, icon: '📅', color: 'text-purple-600', bg: 'bg-purple-50 dark:bg-purple-500/10' },
                    { label: 'Hours Contributed', value: stats?.totalHours ?? 0, icon: '⏱️', color: 'text-amber-600', bg: 'bg-amber-50' },
                  ].map(s => (
                    <div key={s.label} className={`${s.bg} rounded-2xl p-5 text-center`}>
                      <div className="text-3xl mb-2">{s.icon}</div>
                      <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
                      <div className="text-xs text-gray-500 dark:text-slate-400 mt-1">{s.label}</div>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                  {[
                    { label: 'Pending Orgs', value: stats?.totalOrgsPending ?? 0, color: 'text-yellow-600' },
                    { label: 'Events Completed', value: stats?.totalEventsCompleted ?? 0, color: 'text-green-600' },
                  ].map(s => (
                    <div key={s.label} className="bg-white border border-gray-100 dark:border-slate-800 rounded-xl p-3 text-center">
                      <div className={`text-lg font-bold ${s.color}`}>{s.value}</div>
                      <div className="text-xs text-gray-400 dark:text-slate-500">{s.label}</div>
                    </div>
                  ))}
                </div>

                <div className="grid md:grid-cols-2 gap-6 mb-8">
                  <div className="bg-white rounded-2xl shadow dark:bg-[#151D2A] dark:border dark:border-slate-800 dark:shadow-none p-6">
                    <h3 className="font-bold text-gray-800 dark:text-white mb-4">📈 Volunteer Growth (6 months)</h3>
                    <MiniBarChart data={stats?.volunteerGrowth || []} valueKey="count" labelKey="label" />
                  </div>
                  <div className="bg-white rounded-2xl shadow dark:bg-[#151D2A] dark:border dark:border-slate-800 dark:shadow-none p-6">
                    <h3 className="font-bold text-gray-800 dark:text-white mb-4">🗂️ Events by Category</h3>
                    <MiniPieChart data={stats?.eventsByCategory || []} valueKey="count" labelKey="category" />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="bg-white rounded-2xl shadow dark:bg-[#151D2A] dark:border dark:border-slate-800 dark:shadow-none p-6">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="font-bold text-gray-800 dark:text-white">⏳ Pending Organizations</h3>
                      <button onClick={() => setActiveTab('organizations')} className="text-xs text-primary hover:underline">View all →</button>
                    </div>
                    {pendingOrgs.length === 0 ? (
                      <div className="text-center py-8">
                        <p className="text-3xl mb-2">🎉</p>
                        <p className="text-gray-400 dark:text-slate-500 text-sm">All organizations reviewed!</p>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-3">
                        {pendingOrgs.slice(0, 4).map(org => (
                          <div key={org._id} className="flex justify-between items-center p-3 bg-yellow-50 dark:bg-yellow-500/10 rounded-xl">
                            <div>
                              <p className="text-sm font-semibold text-gray-800 dark:text-white">{org.orgName}</p>
                              <p className="text-xs text-gray-500 dark:text-slate-400">{org.email} · {org.orgType}</p>
                            </div>
                            <div className="flex gap-1">
                              <button onClick={() => handleVerify(org._id)} className="text-xs bg-green-50 dark:bg-green-500/100 text-white px-2 py-1 rounded-lg">✅</button>
                              <button onClick={() => handleReject(org._id)} className="text-xs bg-red-400 text-white px-2 py-1 rounded-lg">❌</button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="bg-white rounded-2xl shadow dark:bg-[#151D2A] dark:border dark:border-slate-800 dark:shadow-none p-6">
                    <h3 className="font-bold text-gray-800 dark:text-white mb-4">🕒 Recent Activity</h3>
                    {activity.length === 0 ? (
                      <p className="text-gray-400 dark:text-slate-500 text-sm text-center py-8">No recent activity</p>
                    ) : (
                      <div className="flex flex-col gap-2.5 max-h-72 overflow-y-auto">
                        {activity.map((a, i) => (
                          <div key={i} className="flex justify-between items-start gap-2 text-sm border-b border-gray-50 pb-2 last:border-0">
                            <span className="text-gray-600 dark:text-slate-300">{a.label}</span>
                            <span className="text-xs text-gray-400 dark:text-slate-500 whitespace-nowrap">{new Date(a.at).toLocaleDateString()}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </>
        )}

        {/* ============ ORGANIZATIONS ============ */}
        {activeTab === 'organizations' && (
          <div className="flex flex-col gap-4">
            <div className="flex flex-col md:flex-row gap-3">
              <input
                type="text" placeholder="🔍 Search by name, email or location..."
                value={orgSearch}
                onChange={(e) => { setOrgSearch(e.target.value); setOrgPage(1) }}
                className="flex-1 border border-gray-300 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary"
              />
              <select value={orgStatus} onChange={(e) => { setOrgStatus(e.target.value); setOrgPage(1) }}
                className="border border-gray-300 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary">
                <option value="">All status</option>
                <option value="verified">Verified</option>
                <option value="pending">Pending</option>
              </select>
            </div>

            {orgLoading && <div className="text-center py-12 text-gray-400 dark:text-slate-500">Loading...</div>}

            {!orgLoading && orgs.length === 0 && (
              <div className="text-center py-16 bg-white rounded-2xl shadow dark:bg-[#151D2A] dark:border dark:border-slate-800 dark:shadow-none">
                <p className="text-5xl mb-4">🏢</p>
                <h3 className="text-lg font-bold text-gray-700 dark:text-slate-300">No organizations found</h3>
              </div>
            )}

            {!orgLoading && orgs.map(org => (
              <div key={org._id} className="bg-white rounded-2xl shadow dark:bg-[#151D2A] dark:border dark:border-slate-800 dark:shadow-none p-6 flex flex-col md:flex-row justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <h3 className="font-bold text-gray-800 dark:text-white">{org.orgName}</h3>
                    <span className="text-xs bg-gray-100 text-gray-600 dark:text-slate-300 px-2 py-0.5 rounded-full capitalize">{org.orgType}</span>
                    {org.isVerified ? (
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Verified</span>
                    ) : (
                      <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">Pending</span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 dark:text-slate-400">📧 {org.email} &nbsp;|&nbsp; 📍 {org.location}</p>
                </div>
                <div className="flex flex-wrap gap-2 items-center">
                  <button onClick={() => openOrgDetails(org._id)} className="text-xs bg-gray-100 text-gray-700 dark:text-slate-300 px-3 py-2 rounded-lg hover:bg-gray-200 transition font-semibold">Details</button>
                  {!org.isVerified && (
                    <>
                      <button onClick={() => handleVerify(org._id)} className="text-xs bg-green-50 dark:bg-green-500/100 text-white px-3 py-2 rounded-lg hover:bg-green-600 transition font-semibold">✅ Verify</button>
                      <button onClick={() => handleReject(org._id)} className="text-xs bg-red-50 dark:bg-red-500/10 text-red-500 px-3 py-2 rounded-lg hover:bg-red-100 transition font-semibold">❌ Reject</button>
                    </>
                  )}
                </div>
              </div>
            ))}

            {!orgLoading && orgs.length > 0 && (
              <Pagination page={orgPage} totalPages={orgTotalPages} onChange={setOrgPage} />
            )}
          </div>
        )}

        {/* ============ EVENTS ============ */}
        {activeTab === 'events' && (
          <div className="flex flex-col gap-4">
            <div className="grid md:grid-cols-4 gap-3">
              <input
                type="text" placeholder="🔍 Search title or org..."
                value={eventSearch}
                onChange={(e) => { setEventSearch(e.target.value); setEventPage(1) }}
                className="border border-gray-300 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary md:col-span-2"
              />
              <select value={eventCategory} onChange={(e) => { setEventCategory(e.target.value); setEventPage(1) }}
                className="border border-gray-300 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary">
                <option value="">All categories</option>
                {CATEGORIES.map(c => <option key={c} value={c} className="capitalize">{c}</option>)}
              </select>
              <select value={eventStatus} onChange={(e) => { setEventStatus(e.target.value); setEventPage(1) }}
                className="border border-gray-300 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary">
                <option value="">All statuses</option>
                {EVENT_STATUSES.map(s => <option key={s} value={s} className="capitalize">{s}</option>)}
              </select>
            </div>
            <input
              type="text" placeholder="📍 Filter by location..."
              value={eventLocation}
              onChange={(e) => { setEventLocation(e.target.value); setEventPage(1) }}
              className="border border-gray-300 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary md:w-64"
            />

            {eventLoading && <div className="text-center py-12 text-gray-400 dark:text-slate-500">Loading...</div>}

            {!eventLoading && events.length === 0 && (
              <div className="text-center py-16 bg-white rounded-2xl shadow dark:bg-[#151D2A] dark:border dark:border-slate-800 dark:shadow-none">
                <p className="text-5xl mb-4">📅</p>
                <h3 className="text-lg font-bold text-gray-700 dark:text-slate-300">No events found</h3>
              </div>
            )}

            {!eventLoading && events.map(e => (
              <div key={e._id} className="bg-white rounded-2xl shadow dark:bg-[#151D2A] dark:border dark:border-slate-800 dark:shadow-none p-5 flex flex-col md:flex-row justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <h3 className="font-bold text-gray-800 dark:text-white">{e.title}</h3>
                    <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${STATUS_BADGE[e.status] || 'bg-gray-100 text-gray-600 dark:text-slate-300'}`}>{e.status}</span>
                    <span className="text-xs bg-blue-50 dark:bg-blue-500/10 text-blue-600 px-2 py-0.5 rounded-full capitalize">{e.category}</span>
                  </div>
                  <p className="text-sm text-gray-500 dark:text-slate-400">🏢 {e.orgName} &nbsp;|&nbsp; 📍 {e.location} &nbsp;|&nbsp; 📅 {new Date(e.date).toLocaleDateString()}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-bold text-gray-800 dark:text-white">{e.registeredCount}/{e.volunteersNeeded}</p>
                  <p className="text-xs text-gray-400 dark:text-slate-500">registered</p>
                </div>
              </div>
            ))}

            {!eventLoading && events.length > 0 && (
              <Pagination page={eventPage} totalPages={eventTotalPages} onChange={setEventPage} />
            )}
          </div>
        )}

        {/* ============ VOLUNTEERS ============ */}
        {activeTab === 'volunteers' && (
          <div className="flex flex-col gap-4">
            <div className="flex flex-col md:flex-row gap-3">
              <input
                type="text" placeholder="🔍 Search by name, email or location..."
                value={volSearch}
                onChange={(e) => { setVolSearch(e.target.value); setVolPage(1) }}
                className="flex-1 border border-gray-300 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary"
              />
              <select value={volStatus} onChange={(e) => { setVolStatus(e.target.value); setVolPage(1) }}
                className="border border-gray-300 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary">
                <option value="">All status</option>
                <option value="active">Active</option>
              </select>
            </div>

            {volLoading && <div className="text-center py-12 text-gray-400 dark:text-slate-500">Loading...</div>}

            {!volLoading && volunteers.length === 0 && (
              <div className="text-center py-16 bg-white rounded-2xl shadow dark:bg-[#151D2A] dark:border dark:border-slate-800 dark:shadow-none">
                <p className="text-5xl mb-4">👥</p>
                <h3 className="text-lg font-bold text-gray-700 dark:text-slate-300">No volunteers found</h3>
              </div>
            )}

            {!volLoading && volunteers.map(vol => (
              <div key={vol._id} className="bg-white rounded-2xl shadow dark:bg-[#151D2A] dark:border dark:border-slate-800 dark:shadow-none p-6 flex flex-col md:flex-row justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <h3 className="font-bold text-gray-800 dark:text-white">{vol.name}</h3>
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full capitalize">{vol.availability}</span>
                  </div>
                  <p className="text-sm text-gray-500 dark:text-slate-400">📧 {vol.email} &nbsp;|&nbsp; 📍 {vol.location}</p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {vol.skills?.slice(0, 4).map(skill => (
                      <span key={skill} className="bg-blue-50 dark:bg-blue-500/10 text-blue-600 text-xs px-2 py-1 rounded-full">{skill}</span>
                    ))}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <div className="text-center bg-primary text-white px-4 py-2 rounded-xl">
                    <p className="text-lg font-bold">{vol.performanceScore}</p>
                    <p className="text-xs opacity-80">Score</p>
                  </div>
                  <div className="flex gap-1.5 flex-wrap justify-end">
                    <button onClick={() => openVolunteerDetails(vol._id)} className="text-xs bg-gray-100 text-gray-700 dark:text-slate-300 px-3 py-1.5 rounded-lg hover:bg-gray-200 transition font-semibold">Details</button>
                    <button onClick={() => handleDeleteVolunteer(vol._id)} className="text-xs bg-red-50 dark:bg-red-500/10 text-red-500 px-3 py-1.5 rounded-lg hover:bg-red-100 transition font-semibold">🗑️ Delete</button>
                  </div>
                </div>
              </div>
            ))}

            {!volLoading && volunteers.length > 0 && (
              <Pagination page={volPage} totalPages={volTotalPages} onChange={setVolPage} />
            )}
          </div>
        )}

        {/* ============ EDIT PROFILE ============ */}
        {activeTab === 'edit profile' && (
          <div className="max-w-2xl">
            {profileLoading && !adminProfile ? (
              <div className="text-center py-16 bg-white rounded-2xl shadow dark:bg-[#151D2A] dark:border dark:border-slate-800 dark:shadow-none">
                <p className="text-gray-400 dark:text-slate-500 text-sm">Loading your profile...</p>
              </div>
            ) : (
              <EditAdminProfileForm
                profile={adminProfile}
                onUpdate={(updated) => {
                  setAdminProfile(updated)
                  showNotification('✅ Profile updated successfully!')
                  setActiveTab('overview')
                }}
              />
            )}
          </div>
        )}
      </div>

      {/* ============ DETAIL MODAL ============ */}
      {detailModal && (
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
          onClick={() => setDetailModal(null)}
        >
          <div
            className="bg-white rounded-2xl shadow dark:bg-[#151D2A] dark:border dark:border-slate-800 dark:shadow-none-2xl max-w-lg w-full max-h-[85vh] overflow-y-auto p-6"
            onClick={(e) => e.stopPropagation()}
          >

            {/* ================= ORGANIZATION ================= */}
            {detailModal.type === "org" && (
              <>
                <div className="flex justify-between items-start mb-4">
                  <h2 className="text-xl font-bold text-gray-800 dark:text-white">
                    {detailModal.data.organization?.orgName}
                  </h2>

                  <button
                    onClick={() => setDetailModal(null)}
                    className="text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:text-slate-300 text-xl"
                  >
                    ✕
                  </button>
                </div>

                <div className="space-y-2 text-sm text-gray-600 dark:text-slate-300 mb-5">

                  <p>📧 {detailModal.data.organization?.email}</p>

                  <p>
                    📍 {detailModal.data.organization?.location}
                  </p>

                  <p>
                    📞 {detailModal.data.organization?.phone || "Not provided"}
                  </p>

                  <p className="capitalize">
                    🏷️ {detailModal.data.organization?.orgType}
                  </p>

                  {detailModal.data.organization?.website && (
                    <a
                      href={
                        detailModal.data.organization.website.startsWith("http")
                          ? detailModal.data.organization.website
                          : `https://${detailModal.data.organization.website}`
                      }
                      target="_blank"
                      rel="noreferrer"
                      className="text-blue-600 hover:underline break-all"
                    >
                      🌐 {detailModal.data.organization.website}
                    </a>
                  )}

                  {detailModal.data.organization?.description && (
                    <p>{detailModal.data.organization.description}</p>
                  )}

                  <p className="text-xs text-gray-400 dark:text-slate-500">
                    Registered on{" "}
                    {new Date(
                      detailModal.data.organization?.createdAt
                    ).toLocaleDateString()}
                  </p>
                </div>

                <h3 className="font-semibold text-gray-700 dark:text-slate-300 mb-2">
                  Events ({detailModal.data.events?.length ?? 0})
                </h3>

                <div className="space-y-2 max-h-40 overflow-y-auto mb-5">

                  {(detailModal.data.events?.length ?? 0) === 0 && (
                    <p className="text-gray-400 dark:text-slate-500 text-sm">
                      No events available.
                    </p>
                  )}

                  {detailModal.data.events?.map((event) => (
                    <div
                      key={event._id}
                      className="flex justify-between bg-gray-50 dark:bg-slate-800/60 rounded-lg px-3 py-2"
                    >
                      <span>{event.title}</span>

                      <span
                        className={`text-xs px-2 py-1 rounded-full capitalize ${
                          STATUS_BADGE[event.status] ??
                          "bg-gray-100 text-gray-600 dark:text-slate-300"
                        }`}
                      >
                        {event.status}
                      </span>
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* ================= VOLUNTEER ================= */}

            {detailModal.type === "volunteer" && (
              <>
                <div className="flex justify-between items-start mb-4">

                  <h2 className="text-xl font-bold text-gray-800 dark:text-white">
                    {detailModal.data.volunteer?.name}
                  </h2>

                  <button
                    onClick={() => setDetailModal(null)}
                    className="text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:text-slate-300 text-xl"
                  >
                    ✕
                  </button>

                </div>

                <div className="space-y-2 text-sm text-gray-600 dark:text-slate-300 mb-5">

                  <p>
                    📧 {detailModal.data.volunteer?.email}
                  </p>

                  <p>
                    📞 {detailModal.data.volunteer?.phone || "Not provided"}
                  </p>

                  <p>
                    📍 {detailModal.data.volunteer?.location}
                  </p>

                  <p>
                    ⏱️ {detailModal.data.volunteer?.hoursCompleted || 0} hrs
                  </p>

                  <p>
                    🎯 {detailModal.data.volunteer?.eventsAttended || 0} events
                  </p>

                  <p>
                    ⭐ {detailModal.data.volunteer?.performanceScore || 0}/100
                  </p>

                  <div className="flex flex-wrap gap-2">

                    {detailModal.data.volunteer?.skills?.map((skill) => (

                      <span
                        key={skill}
                        className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-xs"
                      >
                        {skill}
                      </span>

                    ))}

                  </div>

                </div>

                <h3 className="font-semibold mb-2">
                  Registrations ({detailModal.data.registrations?.length ?? 0})
                </h3>

                <div className="space-y-2 max-h-40 overflow-y-auto mb-5">

                  {(detailModal.data.registrations?.length ?? 0) === 0 && (
                    <p className="text-gray-400 dark:text-slate-500 text-sm">
                      No registrations.
                    </p>
                  )}

                  {detailModal.data.registrations?.map((registration) => (

                    <div
                      key={registration.eventId}
                      className="flex justify-between bg-gray-50 dark:bg-slate-800/60 rounded-lg px-3 py-2"
                    >
                      <span>{registration.title}</span>

                      <span className="text-xs text-gray-500 dark:text-slate-400 capitalize">
                        {registration.registrationStatus}
                      </span>
                    </div>

                  ))}

                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() =>
                      handleDeleteVolunteer(detailModal.data.volunteer._id)
                    }
                    className="flex-1 bg-red-600 text-white py-2 rounded-xl"
                  >
                    🗑️ Delete
                  </button>

                </div>
              </>
            )}

          </div>
        </div>
      )}
    </div>
  )
}

function Pagination({ page, totalPages, onChange }) {
  if (totalPages <= 1) return null
  return (
    <div className="flex justify-center items-center gap-3 mt-2">
      <button onClick={() => onChange(p => Math.max(1, p - 1))} disabled={page === 1}
        className="px-4 py-2 rounded-xl border text-sm font-semibold disabled:opacity-40 hover:bg-gray-50 dark:bg-slate-800/60">← Prev</button>
      <span className="text-sm text-gray-600 dark:text-slate-300">Page {page} of {totalPages}</span>
      <button onClick={() => onChange(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
        className="px-4 py-2 rounded-xl border text-sm font-semibold disabled:opacity-40 hover:bg-gray-50 dark:bg-slate-800/60">Next →</button>
    </div>
  )
}