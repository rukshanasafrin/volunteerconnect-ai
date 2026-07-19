import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import EditOrgProfileForm from '../components/EditOrgProfileForm'
import API from '../api'

import LoadingSpinner from '../components/LoadingSpinner'

if (loading) return <LoadingSpinner message="Loading your dashboard..." />

// ✅ OUTSIDE component — fixes typing bug
const FormInput = ({ label, name, value, onChange, error, type = 'text', placeholder }) => (
  <div>
    <label className="text-sm font-medium text-gray-700 mb-1 block">{label}</label>
    <input
      type={type}
      name={name}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className={`w-full border rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-secondary transition
        ${error ? 'border-red-400' : 'border-gray-300'}`}
    />
    {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
  </div>
)

export default function OrgDashboard() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [profile, setProfile] = useState(null)
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [notification, setNotification] = useState('')
  const [aiRecommendations, setAiRecommendations] = useState({})
  const [aiLoadingId, setAiLoadingId] = useState(null)
  const [sentimentData, setSentimentData] = useState({})
  const [sentimentLoadingId, setSentimentLoadingId] = useState(null)
  const [formData, setFormData] = useState({
    title: '', description: '', category: '',
    skillsRequired: '', location: '', date: '',
    duration: '', volunteersNeeded: ''
  })
  const [formErrors, setFormErrors] = useState({})
  const [creating, setCreating] = useState(false)

  useEffect(() => { fetchAll() }, [])

  const fetchAll = async () => {
    try {
      setLoading(true)
      const [profileRes, eventsRes] = await Promise.all([
        API.get('/auth/org/profile'),
        API.get('/events/org/my-events'),
      ])
      setProfile(profileRes.data)
      setEvents(eventsRes.data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const fetchAiRecommendations = async (eventId) => {
    try {
      setAiLoadingId(eventId)
      const res = await API.get(`/ai/recommend/event/${eventId}`)
      setAiRecommendations(prev => ({
        ...prev,
        [eventId]: res.data.recommendations || []
      }))
    } catch (err) {
      showNotification('❌ Failed to get AI recommendations')
    } finally {
      setAiLoadingId(null)
    }
  }

  const fetchSentiment = async (eventId) => {
    try {
      setSentimentLoadingId(eventId)
      const res = await API.get(`/ai/sentiment/event/${eventId}`)
      setSentimentData(prev => ({ ...prev, [eventId]: res.data }))
    } catch (err) {
      showNotification('❌ Failed to load sentiment')
    } finally {
      setSentimentLoadingId(null)
    }
  }

  const showNotification = (msg) => {
    setNotification(msg)
    setTimeout(() => setNotification(''), 3000)
  }

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
    setFormErrors({ ...formErrors, [e.target.name]: '' })
  }

  const validateForm = () => {
    const e = {}
    if (!formData.title.trim()) e.title = 'Title is required'
    if (!formData.description.trim()) e.description = 'Description is required'
    if (!formData.category) e.category = 'Category is required'
    if (!formData.location.trim()) e.location = 'Location is required'
    if (!formData.date) e.date = 'Date is required'
    if (!formData.duration.trim()) e.duration = 'Duration is required'
    if (!formData.volunteersNeeded) e.volunteersNeeded = 'Number of volunteers is required'
    return e
  }

  const handleCreateEvent = async (e) => {
    e.preventDefault()
    const errs = validateForm()
    if (Object.keys(errs).length > 0) { setFormErrors(errs); return }
    try {
      setCreating(true)
      await API.post('/events', formData)
      showNotification('✅ Event created successfully!')
      setShowCreateForm(false)
      setFormData({
        title: '', description: '', category: '',
        skillsRequired: '', location: '', date: '',
        duration: '', volunteersNeeded: ''
      })
      fetchAll()
    } catch (err) {
      showNotification(`❌ ${err.response?.data?.message || 'Failed to create event'}`)
    } finally {
      setCreating(false)
    }
  }

  const handleDeleteEvent = async (id) => {
    if (!window.confirm('Delete this event?')) return
    try {
      await API.delete(`/events/${id}`)
      showNotification('🗑️ Event deleted')
      fetchAll()
    } catch (err) {
      showNotification('❌ Failed to delete event')
    }
  }

  const handleMarkComplete = async (eventId) => {
    if (!window.confirm('Mark this event as completed? This will update volunteer scores.')) return
    try {
      const res = await API.put(`/ai/events/${eventId}/complete`)
      showNotification(`✅ Event completed! ${res.data.volunteersUpdated} volunteer scores updated.`)
      fetchAll()
    } catch (err) {
      showNotification('❌ Failed to mark event complete')
    }
  }

  const handleVolunteerStatus = async (eventId, volunteerId, status) => {
    try {
      await API.put(`/events/${eventId}/volunteer-status`, { volunteerId, status })
      showNotification(`✅ Volunteer ${status}!`)
      fetchAll()
    } catch (err) {
      showNotification('❌ Failed to update status')
    }
  }

  const handleLogout = () => { logout(); navigate('/') }

  const totalVolunteers = events.reduce((acc, e) => acc + (e.registeredVolunteers?.length || 0), 0)
  const tabs = ['overview', 'events', 'volunteers', 'edit profile']

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-secondary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500 font-medium">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Top Bar */}
      <div className="bg-white shadow-sm px-8 py-4 flex justify-between items-center">
        <h1 className="text-xl font-bold text-primary">🤝 VolunteerConnect</h1>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600">👋 {profile?.orgName}</span>
          <span className="text-xs bg-green-100 text-green-700 px-3 py-1 rounded-full font-semibold capitalize">
            {profile?.orgType}
          </span>
          <button
            onClick={handleLogout}
            className="text-sm bg-red-50 text-red-500 px-4 py-2 rounded-lg hover:bg-red-100 transition"
          >
            Logout
          </button>
        </div>
      </div>

      {/* Notification Toast */}
      {notification && (
        <div className="fixed top-6 right-6 bg-gray-800 text-white px-6 py-3 rounded-xl shadow-lg z-50 text-sm font-medium">
          {notification}
        </div>
      )}

      <div className="max-w-6xl mx-auto px-6 py-8">

        {/* Profile Card */}
        <div className="bg-white rounded-2xl shadow p-6 mb-6">
          <div className="flex flex-col md:flex-row justify-between items-start gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h2 className="text-2xl font-bold text-gray-800">{profile?.orgName}</h2>
                <span className="text-xs bg-green-100 text-green-700 px-3 py-1 rounded-full font-semibold">
                  ✅ Verified
                </span>
              </div>
              <p className="text-gray-500 text-sm">
                📧 {profile?.email} &nbsp;|&nbsp;
                📍 {profile?.location} &nbsp;|&nbsp;
                📞 {profile?.phone}
              </p>
              {profile?.website && (
                  <a
                  href={profile.website}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm text-primary hover:underline mt-1 block"
                >
                  🌐 {profile.website}
                </a>
              )} 
              <p className="text-gray-600 text-sm mt-2 max-w-2xl">{profile?.description}</p>
            </div>
            <button
              onClick={() => { setShowCreateForm(true); setActiveTab('events') }}
              className="bg-secondary text-white px-6 py-3 rounded-xl font-semibold text-sm hover:bg-green-700 transition whitespace-nowrap"
            >
              + Create Event
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
          {[
            { label: 'Events Created', value: events.length, icon: '📅' },
            { label: 'Total Volunteers', value: totalVolunteers, icon: '👥' },
            { label: 'Completed Events', value: events.filter(e => e.status === 'completed').length, icon: '✅' },
          ].map(stat => (
            <div key={stat.label} className="bg-white rounded-2xl shadow p-4 text-center">
              <div className="text-3xl mb-1">{stat.icon}</div>
              <div className="text-2xl font-bold text-gray-800">{stat.value}</div>
              <div className="text-xs text-gray-500 mt-1">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-gray-200 overflow-x-auto">
          {tabs.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 text-sm font-semibold capitalize transition border-b-2 -mb-px whitespace-nowrap
                ${activeTab === tab
                  ? 'border-secondary text-secondary'
                  : 'border-transparent text-gray-500 hover:text-gray-700'}`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* ── OVERVIEW TAB ── */}
        {activeTab === 'overview' && (
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl shadow p-6">
              <h3 className="font-bold text-gray-800 mb-4">🏢 Organization Details</h3>
              <div className="flex flex-col gap-3 text-sm">
                {[
                  { label: 'Contact Person', value: profile?.name },
                  { label: 'Email', value: profile?.email },
                  { label: 'Phone', value: profile?.phone },
                  { label: 'Location', value: profile?.location },
                  { label: 'Type', value: profile?.orgType },
                  { label: 'Status', value: '✅ Verified' },
                ].map(item => (
                  <div key={item.label} className="flex justify-between border-b pb-2">
                    <span className="text-gray-500">{item.label}</span>
                    <span className="font-medium text-gray-800 capitalize">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow p-6">
              <h3 className="font-bold text-gray-800 mb-4">📅 Recent Events</h3>
              {events.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-3xl mb-2">📋</p>
                  <p className="text-gray-400 text-sm">No events created yet</p>
                  <button
                    onClick={() => { setShowCreateForm(true); setActiveTab('events') }}
                    className="mt-3 text-secondary text-sm font-semibold hover:underline"
                  >
                    Create your first event →
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {events.slice(0, 3).map(event => (
                    <div key={event._id} className="flex justify-between items-center border-b pb-2">
                      <div>
                        <p className="text-sm font-semibold text-gray-800">{event.title}</p>
                        <p className="text-xs text-gray-500">
                          {new Date(event.date).toLocaleDateString()} · {event.registeredVolunteers?.length} volunteers
                        </p>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full capitalize font-medium
                        ${event.status === 'completed'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-blue-100 text-blue-700'}`}>
                        {event.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── EVENTS TAB ── */}
        {activeTab === 'events' && (
          <div className="flex flex-col gap-4">

            {/* Create Event Form */}
            {showCreateForm && (
              <div className="bg-white rounded-2xl shadow p-6 border-l-4 border-secondary">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold text-gray-800">📋 Create New Event</h3>
                  <button
                    onClick={() => setShowCreateForm(false)}
                    className="text-gray-400 hover:text-gray-600 text-xl font-bold"
                  >
                    ✕
                  </button>
                </div>
                <form onSubmit={handleCreateEvent} className="grid md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <FormInput
                      label="Event Title"
                      name="title"
                      value={formData.title}
                      onChange={handleChange}
                      error={formErrors.title}
                      placeholder="Tree Plantation Drive"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="text-sm font-medium text-gray-700 mb-1 block">Description</label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleChange}
                      rows={3}
                      placeholder="Describe the event and what volunteers will do..."
                      className={`w-full border rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-secondary transition resize-none
                        ${formErrors.description ? 'border-red-400' : 'border-gray-300'}`}
                    />
                    {formErrors.description && (
                      <p className="text-red-500 text-xs mt-1">{formErrors.description}</p>
                    )}
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1 block">Category</label>
                    <select
                      name="category"
                      value={formData.category}
                      onChange={handleChange}
                      className={`w-full border rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-secondary transition bg-white
                        ${formErrors.category ? 'border-red-400' : 'border-gray-300'}`}
                    >
                      <option value="">-- Select Category --</option>
                      {['education', 'environment', 'health', 'community', 'disaster relief', 'animal welfare', 'other'].map(c => (
                        <option key={c} value={c} className="capitalize">{c}</option>
                      ))}
                    </select>
                    {formErrors.category && (
                      <p className="text-red-500 text-xs mt-1">{formErrors.category}</p>
                    )}
                  </div>

                  <FormInput
                    label="Skills Required (comma separated)"
                    name="skillsRequired"
                    value={formData.skillsRequired}
                    onChange={handleChange}
                    error={formErrors.skillsRequired}
                    placeholder="Teaching, First Aid"
                  />
                  <FormInput
                    label="Location"
                    name="location"
                    value={formData.location}
                    onChange={handleChange}
                    error={formErrors.location}
                    placeholder="Chennai"
                  />
                  <FormInput
                    label="Event Date"
                    name="date"
                    type="date"
                    value={formData.date}
                    onChange={handleChange}
                    error={formErrors.date}
                  />
                  <FormInput
                    label="Duration"
                    name="duration"
                    value={formData.duration}
                    onChange={handleChange}
                    error={formErrors.duration}
                    placeholder="4 hours"
                  />
                  <FormInput
                    label="Volunteers Needed"
                    name="volunteersNeeded"
                    type="number"
                    value={formData.volunteersNeeded}
                    onChange={handleChange}
                    error={formErrors.volunteersNeeded}
                    placeholder="20"
                  />

                  <div className="md:col-span-2 flex gap-3 mt-2">
                    <button
                      type="button"
                      onClick={() => setShowCreateForm(false)}
                      className="flex-1 border border-gray-300 text-gray-600 py-3 rounded-xl font-semibold text-sm hover:bg-gray-100 transition"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={creating}
                      className="flex-1 bg-secondary text-white py-3 rounded-xl font-semibold text-sm hover:bg-green-700 transition disabled:opacity-60"
                    >
                      {creating ? 'Creating...' : 'Create Event'}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Events List Header */}
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-gray-700">Your Events ({events.length})</h3>
              {!showCreateForm && (
                <button
                  onClick={() => setShowCreateForm(true)}
                  className="bg-secondary text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-green-700 transition"
                >
                  + Create Event
                </button>
              )}
            </div>

            {events.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-2xl shadow">
                <p className="text-5xl mb-4">📅</p>
                <h3 className="text-lg font-bold text-gray-700">No Events Created Yet</h3>
                <p className="text-gray-400 text-sm mt-2 mb-4">
                  Create your first event to start finding volunteers.
                </p>
                <button
                  onClick={() => setShowCreateForm(true)}
                  className="bg-secondary text-white px-6 py-3 rounded-xl font-semibold text-sm hover:bg-green-700 transition"
                >
                  + Create Event
                </button>
              </div>
            ) : (
              events.map(event => (
                <div key={event._id} className="bg-white rounded-2xl shadow p-6">

                  {/* Event Header */}
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <h4 className="font-bold text-gray-800">{event.title}</h4>
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full capitalize">
                          {event.category}
                        </span>
                        <span className={`text-xs px-2 py-0.5 rounded-full capitalize font-medium
                          ${event.status === 'completed'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-yellow-100 text-yellow-700'}`}>
                          {event.status}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 mt-1">{event.description}</p>
                      <div className="flex flex-wrap gap-4 mt-2 text-xs text-gray-500">
                        <span>📅 {new Date(event.date).toLocaleDateString()}</span>
                        <span>📍 {event.location}</span>
                        <span>⏱️ {event.duration}</span>
                        <span>👥 {event.registeredVolunteers?.length}/{event.volunteersNeeded}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-4 flex-shrink-0">
                      {event.status === 'upcoming' && (
                        <button
                          onClick={() => handleMarkComplete(event._id)}
                          className="text-xs bg-green-50 text-green-600 px-3 py-1.5 rounded-lg hover:bg-green-100 transition font-semibold"
                        >
                          ✅ Complete
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteEvent(event._id)}
                        className="text-xs bg-red-50 text-red-500 px-3 py-1.5 rounded-lg hover:bg-red-100 transition font-semibold"
                      >
                        🗑️ Delete
                      </button>
                    </div>
                  </div>

                  {/* Registered Volunteers */}
                  {event.registeredVolunteers?.length > 0 && (
                    <div className="mt-4 border-t pt-4">
                      <p className="text-sm font-semibold text-gray-700 mb-3">
                        Registered Volunteers ({event.registeredVolunteers.length}):
                      </p>
                      <div className="flex flex-col gap-2">
                        {event.registeredVolunteers.map(vol => (
                          <div key={vol._id} className="flex justify-between items-center bg-gray-50 rounded-xl px-4 py-2">
                            <div>
                              <p className="text-sm font-medium text-gray-800">{vol.name}</p>
                              <p className="text-xs text-gray-500">{vol.email} · {vol.skills?.join(', ')}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className={`text-xs px-2 py-1 rounded-full font-medium capitalize
                                ${vol.status === 'approved' ? 'bg-green-100 text-green-700' :
                                  vol.status === 'rejected' ? 'bg-red-100 text-red-700' :
                                  'bg-yellow-100 text-yellow-700'}`}>
                                {vol.status}
                              </span>
                              {vol.status === 'applied' && (
                                <div className="flex gap-1">
                                  <button
                                    onClick={() => handleVolunteerStatus(event._id, vol.volunteer, 'approved')}
                                    className="text-xs bg-green-500 text-white px-2 py-1 rounded-lg hover:bg-green-600 transition"
                                  >
                                    Approve
                                  </button>
                                  <button
                                    onClick={() => handleVolunteerStatus(event._id, vol.volunteer, 'rejected')}
                                    className="text-xs bg-red-400 text-white px-2 py-1 rounded-lg hover:bg-red-500 transition"
                                  >
                                    Reject
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* AI Volunteer Recommendations */}
                  <div className="mt-4 border-t pt-4">
                    <div className="flex justify-between items-center mb-3">
                      <p className="text-sm font-semibold text-gray-700">🤖 AI Recommended Volunteers</p>
                      <button
                        onClick={() => fetchAiRecommendations(event._id)}
                        disabled={aiLoadingId === event._id}
                        className="text-xs bg-blue-50 text-blue-600 px-3 py-1.5 rounded-lg hover:bg-blue-100 transition font-semibold disabled:opacity-60"
                      >
                        {aiLoadingId === event._id ? 'Analyzing...' : 'Find Matches'}
                      </button>
                    </div>
                    {aiRecommendations[event._id] && (
                      <div className="flex flex-col gap-2">
                        {aiRecommendations[event._id].length === 0 ? (
                          <p className="text-xs text-gray-400 text-center py-3">
                            No matching volunteers found
                          </p>
                        ) : (
                          aiRecommendations[event._id].slice(0, 5).map(rec => (
                            <div key={rec.volunteer._id} className="flex justify-between items-center bg-blue-50 rounded-xl px-4 py-3">
                              <div className="flex-1">
                                <p className="text-sm font-semibold text-gray-800">{rec.volunteer.name}</p>
                                <p className="text-xs text-gray-500">
                                  📍 {rec.volunteer.location} · {rec.volunteer.skills?.slice(0, 2).join(', ')}
                                </p>
                                <div className="flex gap-3 mt-1">
                                  <span className="text-xs text-gray-400">Skills: {rec.breakdown.skills}%</span>
                                  <span className="text-xs text-gray-400">Location: {rec.breakdown.location}%</span>
                                  <span className="text-xs text-gray-400">Availability: {rec.breakdown.availability}%</span>
                                </div>
                              </div>
                              <div className="text-center ml-3">
                                <div className={`text-xl font-black
                                  ${rec.matchScore >= 70 ? 'text-green-600' :
                                    rec.matchScore >= 40 ? 'text-yellow-600' : 'text-gray-500'}`}>
                                  {rec.matchScore}%
                                </div>
                                <div className="text-xs text-gray-400">match</div>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </div>

                  {/* Sentiment Analysis */}
                  <div className="mt-4 border-t pt-4">
                    <div className="flex justify-between items-center mb-3">
                      <p className="text-sm font-semibold text-gray-700">📊 Feedback Sentiment</p>
                      <button
                        onClick={() => fetchSentiment(event._id)}
                        disabled={sentimentLoadingId === event._id}
                        className="text-xs bg-purple-50 text-purple-600 px-3 py-1.5 rounded-lg hover:bg-purple-100 transition font-semibold disabled:opacity-60"
                      >
                        {sentimentLoadingId === event._id ? 'Loading...' : 'View Sentiment'}
                      </button>
                    </div>
                    {sentimentData[event._id] && (
                      <div>
                        {sentimentData[event._id].totalFeedbacks === 0 ? (
                          <p className="text-xs text-gray-400 text-center py-3">
                            No feedback submitted yet
                          </p>
                        ) : (
                          <div className="flex flex-col gap-3">
                            <div className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3">
                              <div>
                                <p className="text-sm font-semibold text-gray-800">
                                  Overall: {sentimentData[event._id].overallSentiment}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {sentimentData[event._id].totalFeedbacks} feedbacks · Avg rating: {sentimentData[event._id].avgRating}/5
                                </p>
                              </div>
                              <span className="text-3xl">
                                {sentimentData[event._id].overallSentiment === 'Positive' ? '😊' :
                                 sentimentData[event._id].overallSentiment === 'Negative' ? '😞' : '😐'}
                              </span>
                            </div>

                            <div className="grid grid-cols-3 gap-2">
                              {[
                                { label: 'Positive', value: sentimentData[event._id].breakdown.positive, text: 'text-green-700', bg: 'bg-green-50' },
                                { label: 'Neutral', value: sentimentData[event._id].breakdown.neutral, text: 'text-yellow-700', bg: 'bg-yellow-50' },
                                { label: 'Negative', value: sentimentData[event._id].breakdown.negative, text: 'text-red-700', bg: 'bg-red-50' },
                              ].map(s => (
                                <div key={s.label} className={`${s.bg} rounded-xl p-3 text-center`}>
                                  <div className={`text-lg font-bold ${s.text}`}>{s.value}</div>
                                  <div className="text-xs text-gray-500">{s.label}</div>
                                </div>
                              ))}
                            </div>

                            {sentimentData[event._id].topKeywords?.length > 0 && (
                              <div>
                                <p className="text-xs text-gray-500 mb-2">Top Keywords:</p>
                                <div className="flex flex-wrap gap-2">
                                  {sentimentData[event._id].topKeywords.map(k => (
                                    <span key={k.word} className="bg-blue-50 text-blue-700 text-xs px-2 py-1 rounded-full">
                                      {k.word} ({k.count})
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}

                            <div className="flex flex-col gap-2 max-h-48 overflow-y-auto">
                              {sentimentData[event._id].feedbacks?.map((f, i) => (
                                <div key={i} className="bg-white border border-gray-100 rounded-xl p-3">
                                  <div className="flex justify-between items-start mb-1">
                                    <div className="flex gap-0.5">
                                      {[...Array(5)].map((_, s) => (
                                        <span key={s} className={s < f.rating ? 'text-yellow-400' : 'text-gray-200'} style={{ fontSize: '12px' }}>⭐</span>
                                      ))}
                                    </div>
                                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium
                                      ${f.sentiment === 'Positive' ? 'bg-green-100 text-green-700' :
                                        f.sentiment === 'Negative' ? 'bg-red-100 text-red-700' :
                                        'bg-yellow-100 text-yellow-700'}`}>
                                      {f.sentiment}
                                    </span>
                                  </div>
                                  <p className="text-xs text-gray-600">"{f.comment}"</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                </div>
              ))
            )}
          </div>
        )}

        {/* ── VOLUNTEERS TAB ── */}
        {activeTab === 'volunteers' && (
          <div className="flex flex-col gap-4">
            <h3 className="font-bold text-gray-700">All Registered Volunteers ({totalVolunteers})</h3>
            {totalVolunteers === 0 ? (
              <div className="text-center py-16 bg-white rounded-2xl shadow">
                <p className="text-5xl mb-4">👥</p>
                <h3 className="text-lg font-bold text-gray-700">No Volunteers Yet</h3>
                <p className="text-gray-400 text-sm mt-2">
                  Volunteers who register for your events will appear here.
                </p>
              </div>
            ) : (
              events.map(event =>
                event.registeredVolunteers?.length > 0 && (
                  <div key={event._id} className="bg-white rounded-2xl shadow p-6">
                    <h4 className="font-bold text-gray-700 mb-3">📅 {event.title}</h4>
                    <div className="flex flex-col gap-2">
                      {event.registeredVolunteers.map(vol => (
                        <div key={vol._id} className="flex justify-between items-center bg-gray-50 rounded-xl px-4 py-3">
                          <div>
                            <p className="text-sm font-semibold text-gray-800">{vol.name}</p>
                            <p className="text-xs text-gray-500">{vol.email} · 📞 {vol.phone}</p>
                            <div className="flex gap-1 mt-1 flex-wrap">
                              {vol.skills?.map(s => (
                                <span key={s} className="text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full">{s}</span>
                              ))}
                            </div>
                          </div>
                          <span className={`text-xs px-3 py-1 rounded-full font-medium capitalize
                            ${vol.status === 'approved' ? 'bg-green-100 text-green-700' :
                              vol.status === 'rejected' ? 'bg-red-100 text-red-700' :
                              'bg-yellow-100 text-yellow-700'}`}>
                            {vol.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              )
            )}
          </div>
        )}

        {/* ── EDIT PROFILE TAB ── */}
        {activeTab === 'edit profile' && (
          <EditOrgProfileForm
            profile={profile}
            onUpdate={(updated) => {
              setProfile(updated)
              showNotification('✅ Profile updated successfully!')
              setActiveTab('overview')
            }}
          />
        )}

      </div>
    </div>
  )
}