import { useState, useEffect, useMemo, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import EditProfileForm from '../components/EditProfileForm'
import ThemeToggle from '../components/ThemeToggle'
import VoiceSearchButton from '../components/VoiceSearchButton'
import API from '../api'
import socket from '../socket'


export default function VolunteerDashboard() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [profile, setProfile] = useState(null)
  const [events, setEvents] = useState([])
  const [myEvents, setMyEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  const [notification, setNotification] = useState('')
  const [aiRecommendations, setAiRecommendations] = useState([])
  const [aiLoading, setAiLoading] = useState(false)
  const [performance, setPerformance] = useState(null)
  const [perfLoading, setPerfLoading] = useState(false)
  const [skillGap, setSkillGap] = useState(null)
  const [skillGapLoading, setSkillGapLoading] = useState(false)
  const [impactStory, setImpactStory] = useState(null)
  const [impactStoryLoading, setImpactStoryLoading] = useState(false)
  const [feedbackModal, setFeedbackModal] = useState(null)
  const [feedbackForm, setFeedbackForm] = useState({ comment: '', rating: 5 })
  const [feedbackLoading, setFeedbackLoading] = useState(false)
  const [feedbackResult, setFeedbackResult] = useState(null)
  const [leaderboard, setLeaderboard] = useState([])
  const [leaderboardLoading, setLeaderboardLoading] = useState(false)
  const [leaderboardSort, setLeaderboardSort] = useState('performanceScore')
  const [myRank, setMyRank] = useState(null)
  const [eventSearchInput, setEventSearchInput] = useState('')
  const [eventSearch, setEventSearch] = useState('')
  const [eventCategoryFilter, setEventCategoryFilter] = useState('all')
  const [eventStatusFilter, setEventStatusFilter] = useState('all')
  // Skips the debounce below once, right after a voice search sets both the
  // display text and the cleaned search text together, so the debounce
  // doesn't overwrite the cleaned text with the raw (unfiltered) transcript.
  const skipNextDebounceRef = useRef(false)

  // Debounce the free-text event search so we don't re-filter on every keystroke.
  useEffect(() => {
    if (skipNextDebounceRef.current) {
      skipNextDebounceRef.current = false
      return
    }
    const timer = setTimeout(() => setEventSearch(eventSearchInput.trim().toLowerCase()), 300)
    return () => clearTimeout(timer)
  }, [eventSearchInput])

  useEffect(() => {
    fetchAll()
    fetchAiRecommendations()
    fetchPerformance()
    fetchSkillGap()
    fetchImpactStory()
    fetchMyRank()
  }, [])

  useEffect(() => {
    fetchLeaderboard(leaderboardSort)
  }, [leaderboardSort])

  // Live updates: new events posted by organizations appear instantly,
  // and open/closed status + registration approvals update without a refresh.
  useEffect(() => {
    const handleNewEvent = (event) => {
      setEvents((prev) => (prev.some(e => e._id === event._id) ? prev : [event, ...prev]))
    }

    const handleEventUpdated = (patch) => {
      setEvents((prev) => prev.map(e => (e._id === patch._id ? { ...e, ...patch } : e)))
    }

    const handleEventDeleted = ({ _id }) => {
      setEvents((prev) => prev.filter(e => e._id !== _id))
      setMyEvents((prev) => prev.filter(e => e._id !== _id))
    }

    const handleRegistrationStatus = ({ eventId, status }) => {
      setMyEvents((prev) =>
        prev.map(e => (e._id === eventId ? { ...e, registrationStatus: status } : e))
      )
    }

    socket.on('event:new', handleNewEvent)
    socket.on('event:updated', handleEventUpdated)
    socket.on('event:deleted', handleEventDeleted)
    socket.on('registration:status', handleRegistrationStatus)

    return () => {
      socket.off('event:new', handleNewEvent)
      socket.off('event:updated', handleEventUpdated)
      socket.off('event:deleted', handleEventDeleted)
      socket.off('registration:status', handleRegistrationStatus)
    }
  }, [])

  const fetchAll = async () => {
    try {
      setLoading(true)
      const [profileRes, eventsRes, myEventsRes] = await Promise.all([
        API.get('/auth/volunteer/profile'),
        API.get('/events?limit=100'),
        API.get('/events/volunteer/my-events'),
      ])
      setProfile(profileRes.data)
      setEvents(eventsRes.data.events || eventsRes.data)
      setMyEvents(myEventsRes.data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const fetchAiRecommendations = async () => {
    try {
      setAiLoading(true)
      const res = await API.get('/ai/recommend/volunteer')
      setAiRecommendations(res.data.recommendations || [])
    } catch (err) {
      console.error(err)
    } finally {
      setAiLoading(false)
    }
  }

  const fetchPerformance = async () => {
  try {
    setPerfLoading(true)
    const res = await API.get('/ai/performance')
    setPerformance(res.data)
  } catch (err) {
    console.error(err)
  } finally {
    setPerfLoading(false)
  }
}

  const fetchSkillGap = async () => {
    try {
      setSkillGapLoading(true)
      const res = await API.get('/ai/skill-gap')
      setSkillGap(res.data)
    } catch (err) {
      console.error(err)
    } finally {
      setSkillGapLoading(false)
    }
  }

  const fetchImpactStory = async () => {
    try {
      setImpactStoryLoading(true)
      const res = await API.get('/ai/impact-story')
      setImpactStory(res.data)
    } catch (err) {
      console.error(err)
    } finally {
      setImpactStoryLoading(false)
    }
  }

  const fetchLeaderboard = async (sortBy) => {
    try {
      setLeaderboardLoading(true)
      const res = await API.get(`/leaderboard?sortBy=${sortBy}`)
      setLeaderboard(res.data.leaderboard || [])
    } catch (err) {
      console.error(err)
      setLeaderboard([])
    } finally {
      setLeaderboardLoading(false)
    }
  }

  const fetchMyRank = async () => {
    try {
      const res = await API.get('/leaderboard/my-rank')
      setMyRank(res.data)
    } catch (err) {
      console.error(err)
    }
  }

  const showNotification = (msg) => {
    setNotification(msg)
    setTimeout(() => setNotification(''), 3000)
  }

  const handleRegister = async (eventId, eventTitle) => {
    try {
      await API.post(`/events/${eventId}/register`)
      showNotification(`✅ Registered for "${eventTitle}" successfully!`)
      fetchAll()
      fetchAiRecommendations()
    } catch (err) {
      showNotification(`❌ ${err.response?.data?.message || 'Registration failed'}`)
    }
  }
  const handleDownloadCertificate = async (eventId) => {
    try {
      const res = await API.get(`/certificates/event/${eventId}/download`, { responseType: 'blob' })
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', 'certificate.pdf')
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
    } catch (err) {
      showNotification(`❌ ${err.response?.data?.message || 'Could not download certificate right now.'}`)
    }
  }

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  const isRegistered = (eventId) => {
    return myEvents.some(e => e._id === eventId)
  }

  const EVENT_CATEGORY_META = [
    { key: 'environment', label: 'Environment', emoji: '🌱', badge: 'bg-emerald-100 text-emerald-700' },
    { key: 'education', label: 'Education', emoji: '🎓', badge: 'bg-blue-100 text-blue-700' },
    { key: 'health', label: 'Health', emoji: '🏥', badge: 'bg-rose-100 text-rose-700' },
    { key: 'community', label: 'Community', emoji: '🤝', badge: 'bg-amber-100 text-amber-700' },
    { key: 'disaster relief', label: 'Disaster Relief', emoji: '🚨', badge: 'bg-orange-100 text-orange-700' },
    { key: 'animal welfare', label: 'Animal Welfare', emoji: '🐾', badge: 'bg-purple-100 text-purple-700' },
    { key: 'other', label: 'Other', emoji: '✨', badge: 'bg-gray-100 text-gray-700 dark:text-slate-300' },
  ]

  const getCategoryMeta = (key) =>
    EVENT_CATEGORY_META.find(c => c.key === key) || EVENT_CATEGORY_META[EVENT_CATEGORY_META.length - 1]

  const getEventOpenStatus = (event) => {
    const capacity = Number(event.volunteersNeeded) || 0
    const registeredCount = event.registeredVolunteers?.length || 0
    const lifecycleClosed = Boolean(event.status) && event.status !== 'upcoming'
    return !lifecycleClosed && registeredCount < capacity
  }

  const groupEventsByCategory = (list) => {
    const groups = new Map()
    list.forEach(event => {
      const key = EVENT_CATEGORY_META.some(c => c.key === event.category) ? event.category : 'other'
      if (!groups.has(key)) groups.set(key, [])
      groups.get(key).push(event)
    })
    return EVENT_CATEGORY_META
      .map(meta => ({ meta, events: groups.get(meta.key) || [] }))
      .filter(group => group.events.length > 0)
  }

  // Search + category + open/closed filtering for the "events" tab — the same
  // kind of event search available on the public Home/Events pages, now
  // available without leaving the dashboard.
  const filteredEvents = useMemo(() => {
    return events.filter(event => {
      const matchesSearch =
        !eventSearch ||
        event.title?.toLowerCase().includes(eventSearch) ||
        event.orgName?.toLowerCase().includes(eventSearch) ||
        event.location?.toLowerCase().includes(eventSearch)

      const matchesCategory =
        eventCategoryFilter === 'all' || event.category === eventCategoryFilter

      const isOpen = getEventOpenStatus(event)
      const matchesStatus =
        eventStatusFilter === 'all' ||
        (eventStatusFilter === 'open' ? isOpen : !isOpen)

      return matchesSearch && matchesCategory && matchesStatus
    })
  }, [events, eventSearch, eventCategoryFilter, eventStatusFilter])

  const hasActiveEventFilters =
    Boolean(eventSearch) || eventCategoryFilter !== 'all' || eventStatusFilter !== 'all'

  const clearEventFilters = () => {
    setEventSearchInput('')
    setEventSearch('')
    setEventCategoryFilter('all')
    setEventStatusFilter('all')
  }

  const tabs = ['overview', 'events', 'my events', 'certificates', 'performance', 'leaderboard', 'edit profile']

  const LEADERBOARD_SORT_OPTIONS = [
    { key: 'performanceScore', label: 'Overall Score', unit: 'score', suffix: '/100' },
    { key: 'hoursCompleted', label: 'Most Hours', unit: 'hours', suffix: '' },
    { key: 'eventsAttended', label: 'Most Events', unit: 'events', suffix: '' },
  ]

  const RANK_MEDAL = { 1: '🥇', 2: '🥈', 3: '🥉' }
  const RANK_STYLES = {
    1: 'bg-yellow-50 dark:bg-yellow-500/10 border-yellow-300',
    2: 'bg-gray-50 dark:bg-slate-800/60 border-gray-300 dark:border-slate-700',
    3: 'bg-orange-50 border-orange-300',
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#0B0F19] transition-colors duration-300">
        <div className="text-center">
          <div className="text-5xl mb-4">⏳</div>
          <p className="text-gray-500 dark:text-slate-400 font-medium">Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  const handleSubmitFeedback = async (e) => {
  e.preventDefault()
  if (!feedbackForm.comment.trim()) return
  try {
    setFeedbackLoading(true)
    const res = await API.post(`/events/${feedbackModal._id}/feedback`, feedbackForm)
    setFeedbackResult(res.data.sentiment)
    showNotification('✅ Feedback submitted!')
    fetchPerformance()
    setTimeout(() => {
      setFeedbackModal(null)
      setFeedbackResult(null)
      setFeedbackForm({ comment: '', rating: 5 })
    }, 3000)
  } catch (err) {
    showNotification(`❌ ${err.response?.data?.message || 'Failed to submit feedback'}`)
  } finally {
    setFeedbackLoading(false)
  }
}

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0B0F19] transition-colors duration-300">

      {/* Top Bar */}
      <div className="bg-white shadow-sm dark:bg-[#151D2A] dark:shadow-none dark:border-b dark:border-slate-800 px-8 py-4 flex justify-between items-center">
        <h1 className="text-xl font-bold text-primary">🤝 VolunteerConnect</h1>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600 dark:text-slate-300">👋 Hello, {profile?.name}</span>
          <span className="text-xs bg-blue-100 text-blue-700 px-3 py-1 rounded-full font-semibold">Volunteer</span>
          <ThemeToggle />
          <button onClick={handleLogout} className="text-sm bg-red-50 dark:bg-red-500/10 text-red-500 px-4 py-2 rounded-lg hover:bg-red-100 transition">
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
        <div className="bg-white rounded-2xl shadow dark:bg-[#151D2A] dark:border dark:border-slate-800 dark:shadow-none p-6 mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white">{profile?.name}</h2>
            <p className="text-gray-500 dark:text-slate-400 text-sm mt-1">
              📧 {profile?.email} &nbsp;|&nbsp;
              📍 {profile?.location} &nbsp;|&nbsp;
              🕐 {profile?.availability}
            </p>
            <p className="text-gray-500 dark:text-slate-400 text-sm mt-1">🌐 {profile?.languages?.join(', ')}</p>
            <div className="flex flex-wrap gap-2 mt-3">
              {profile?.skills?.map(skill => (
                <span key={skill} className="bg-blue-100 text-blue-700 text-xs px-3 py-1 rounded-full font-medium">
                  {skill}
                </span>
              ))}
            </div>
          </div>
          <div className="text-center bg-primary text-white px-8 py-4 rounded-2xl min-w-[140px]">
            <p className="text-sm font-medium opacity-80">Performance Score</p>
            <p className="text-5xl font-bold mt-1">{profile?.performanceScore}</p>
            <p className="text-xs opacity-70 mt-1">out of 100</p>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Hours Completed', value: profile?.hoursCompleted, icon: '⏱️' },
            { label: 'Events Attended', value: profile?.eventsAttended, icon: '📅' },
            { label: 'Registered Events', value: myEvents.length, icon: '📋' },
            { label: 'Member Since', value: new Date(profile?.createdAt).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }), icon: '📌' },
          ].map(stat => (
            <div key={stat.label} className="bg-white rounded-2xl shadow dark:bg-[#151D2A] dark:border dark:border-slate-800 dark:shadow-none p-4 text-center">
              <div className="text-3xl mb-1">{stat.icon}</div>
              <div className="text-xl font-bold text-gray-800 dark:text-white">{stat.value}</div>
              <div className="text-xs text-gray-500 dark:text-slate-400 mt-1">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-gray-200 dark:border-slate-700 overflow-x-auto">
          {tabs.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 text-sm font-semibold capitalize transition border-b-2 -mb-px whitespace-nowrap
                ${activeTab === tab ? 'border-primary text-primary' : 'border-transparent text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:text-slate-300'}`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* ── OVERVIEW TAB ── */}
        {activeTab === 'overview' && (
          <div className="grid md:grid-cols-2 gap-6">

            {/* AI Recommended Events */}
            <div className="bg-white rounded-2xl shadow dark:bg-[#151D2A] dark:border dark:border-slate-800 dark:shadow-none p-6">
              <div className="flex items-center gap-2 mb-4">
                <h3 className="font-bold text-gray-800 dark:text-white">🤖 AI Recommended for You</h3>
                {aiLoading && (
                  <span className="text-xs text-gray-400 dark:text-slate-500 animate-pulse">Analyzing...</span>
                )}
              </div>
              {aiRecommendations.length === 0 && !aiLoading ? (
                <div className="text-center py-8">
                  <p className="text-3xl mb-2">🔍</p>
                  <p className="text-gray-400 dark:text-slate-500 text-sm">Add more skills to get better recommendations</p>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {aiRecommendations.slice(0, 3).map(rec => (
                    <div key={rec.event._id} className="border border-gray-100 dark:border-slate-800 rounded-xl p-4 hover:border-primary transition">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1">
                          <p className="font-semibold text-gray-800 dark:text-white text-sm">{rec.event.title}</p>
                          <p className="text-xs text-gray-500 dark:text-slate-400">{rec.event.orgName} · {new Date(rec.event.date).toLocaleDateString()}</p>
                        </div>
                        <div className="text-center ml-3">
                          <div className={`text-lg font-black
                            ${rec.matchScore >= 70 ? 'text-green-600' :
                              rec.matchScore >= 40 ? 'text-yellow-600' : 'text-gray-400 dark:text-slate-500'}`}>
                            {rec.matchScore}%
                          </div>
                          <div className="text-xs text-gray-400 dark:text-slate-500">match</div>
                        </div>
                      </div>

                      {/* Match Breakdown */}
                      <div className="grid grid-cols-3 gap-2 mb-3">
                        {[
                          { label: 'Skills', value: rec.breakdown.skills },
                          { label: 'Location', value: rec.breakdown.location },
                          { label: 'Availability', value: rec.breakdown.availability },
                        ].map(b => (
                          <div key={b.label} className="text-center bg-gray-50 dark:bg-slate-800/60 rounded-lg py-1.5">
                            <div className="text-xs font-bold text-gray-700 dark:text-slate-300">{b.value}%</div>
                            <div className="text-xs text-gray-400 dark:text-slate-500">{b.label}</div>
                          </div>
                        ))}
                      </div>

                      <button
                        onClick={() => handleRegister(rec.event._id, rec.event.title)}
                        disabled={isRegistered(rec.event._id)}
                        className={`w-full py-1.5 rounded-lg text-xs font-semibold transition
                          ${isRegistered(rec.event._id)
                            ? 'bg-gray-100 text-gray-400 dark:text-slate-500 cursor-not-allowed'
                            : 'bg-primary text-white hover:bg-blue-700'}`}
                      >
                        {isRegistered(rec.event._id) ? 'Registered ✓' : 'Register Now'}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* My Recent Events */}
            <div className="bg-white rounded-2xl shadow dark:bg-[#151D2A] dark:border dark:border-slate-800 dark:shadow-none p-6">
              <h3 className="font-bold text-gray-800 dark:text-white mb-4">📋 My Recent Events</h3>
              {myEvents.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-3xl mb-2">🗓️</p>
                  <p className="text-gray-400 dark:text-slate-500 text-sm">No events registered yet</p>
                  <button
                    onClick={() => setActiveTab('events')}
                    className="mt-3 text-primary text-sm font-semibold hover:underline"
                  >
                    Browse Events →
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {myEvents.slice(0, 4).map(event => (
                    <div key={event._id} className="flex justify-between items-center border-b border-gray-50 pb-3">
                      <div>
                        <p className="text-sm font-semibold text-gray-800 dark:text-white">{event.title}</p>
                        <p className="text-xs text-gray-500 dark:text-slate-400">{event.orgName} · {new Date(event.date).toLocaleDateString()}</p>
                      </div>
                      <span className={`text-xs px-3 py-1 rounded-full font-medium capitalize
                        ${event.registrationStatus === 'approved' ? 'bg-green-100 text-green-700' :
                          event.registrationStatus === 'rejected' ? 'bg-red-100 text-red-700' :
                          'bg-yellow-100 text-yellow-700'}`}>
                        {event.registrationStatus}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        )}

        {/* Skill Gap Growth Advisor */}
        {activeTab === 'overview' && (
          <div className="bg-white rounded-2xl shadow dark:bg-[#151D2A] dark:border dark:border-slate-800 dark:shadow-none p-6 mt-6">
            <div className="flex items-center gap-2 mb-4">
              <h3 className="font-bold text-gray-800 dark:text-white">📈 Skill Gap Growth Advisor</h3>
              {skillGapLoading && (
                <span className="text-xs text-gray-400 dark:text-slate-500 animate-pulse">Analyzing...</span>
              )}
            </div>
            {!skillGap && !skillGapLoading ? (
              <div className="text-center py-8">
                <p className="text-3xl mb-2">📊</p>
                <p className="text-gray-400 dark:text-slate-500 text-sm">No growth data available yet</p>
              </div>
            ) : skillGap && skillGap.suggestions.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-3xl mb-2">🎉</p>
                <p className="text-gray-700 dark:text-slate-300 text-sm font-semibold">You're eligible for all {skillGap.qualifiedEvents} open event(s) right now!</p>
                <p className="text-gray-400 dark:text-slate-500 text-xs mt-1">{skillGap.explanation}</p>
              </div>
            ) : skillGap ? (
              <div className="flex flex-col gap-4">
                <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-4">
                  <p className="text-xs font-semibold text-indigo-600 mb-1">🤖 AI Growth Tip</p>
                  <p className="text-sm text-gray-700 dark:text-slate-300 leading-relaxed">{skillGap.explanation}</p>
                </div>

                <div className="flex flex-col gap-3">
                  {skillGap.suggestions.map((s, idx) => (
                    <div key={s.skill} className={`border rounded-xl p-4 ${idx === 0 ? 'border-primary bg-blue-50/40' : 'border-gray-100 dark:border-slate-800'}`}>
                      <div className="flex justify-between items-center mb-2">
                        <p className="text-sm font-semibold text-gray-800 dark:text-white capitalize">
                          {idx === 0 && '🏆 '}{s.skill}
                        </p>
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-semibold">
                          unlocks {s.directUnlockCount} event{s.directUnlockCount === 1 ? '' : 's'}
                        </span>
                      </div>
                      {s.partialUnlockCount > 0 && (
                        <p className="text-xs text-gray-500 dark:text-slate-400 mb-2">+ helps with {s.partialUnlockCount} more event{s.partialUnlockCount === 1 ? '' : 's'}</p>
                      )}
                      {s.directUnlocks.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {s.directUnlocks.slice(0, 4).map(ev => (
                            <span key={ev._id} className="text-xs bg-white border border-gray-200 dark:border-slate-700 text-gray-600 dark:text-slate-300 px-2 py-1 rounded-lg">
                              {ev.title}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                <p className="text-xs text-gray-400 dark:text-slate-500 text-center">
                  You're currently eligible for {skillGap.qualifiedEvents} of {skillGap.totalOpenEvents} open events
                </p>
              </div>
            ) : null}
          </div>
        )}

        {/* ── EVENTS TAB ── */}
        {activeTab === 'events' && (
          <div className="flex flex-col gap-8">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h3 className="font-bold text-gray-700 dark:text-slate-300">
                Available Events ({filteredEvents.length}{hasActiveEventFilters ? ` of ${events.length}` : ''})
              </h3>
              <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full">
                {filteredEvents.filter(getEventOpenStatus).length} open
              </span>
            </div>

            {/* Search + Filters */}
            <div className="bg-white rounded-2xl shadow dark:bg-[#151D2A] dark:border dark:border-slate-800 dark:shadow-none p-4 flex flex-col gap-3">
              <div className="flex flex-col md:flex-row gap-3">
                <input
                  type="text"
                  value={eventSearchInput}
                  onChange={(e) => setEventSearchInput(e.target.value)}
                  placeholder='🔍 Search events, or tap the mic and say "open environment events"...'
                  className="flex-1 border border-gray-300 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary bg-white dark:bg-slate-800 text-gray-900 dark:text-white"
                />
                <VoiceSearchButton
                  onParsedQuery={({ searchText, category, status }, rawTranscript) => {
                    // Show exactly what was said; apply the derived filters
                    // silently and use the cleaned text for actual matching.
                    skipNextDebounceRef.current = true
                    setEventSearchInput(rawTranscript)
                    setEventSearch(searchText)
                    setEventCategoryFilter(category)
                    setEventStatusFilter(status)
                  }}
                />
                <select
                  value={eventCategoryFilter}
                  onChange={(e) => setEventCategoryFilter(e.target.value)}
                  className="border border-gray-300 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary bg-white dark:bg-slate-800 text-gray-900 dark:text-white md:w-56"
                >
                  <option value="all">All categories</option>
                  {EVENT_CATEGORY_META.map(c => (
                    <option key={c.key} value={c.key}>{c.emoji} {c.label}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                {[
                  { key: 'all', label: 'All' },
                  { key: 'open', label: '🟢 Open' },
                  { key: 'closed', label: '🔒 Closed' },
                ].map(status => (
                  <button
                    key={status.key}
                    type="button"
                    onClick={() => setEventStatusFilter(status.key)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition
                      ${eventStatusFilter === status.key
                        ? 'bg-primary text-white'
                        : 'bg-gray-100 text-gray-600 dark:bg-slate-800 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-700'}`}
                  >
                    {status.label}
                  </button>
                ))}
                {hasActiveEventFilters && (
                  <button
                    type="button"
                    onClick={clearEventFilters}
                    className="ml-auto text-xs font-semibold text-gray-400 dark:text-slate-500 hover:text-red-500 transition"
                  >
                    ✕ Clear filters
                  </button>
                )}
              </div>
            </div>

            {events.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-2xl shadow dark:bg-[#151D2A] dark:border dark:border-slate-800 dark:shadow-none">
                <p className="text-5xl mb-4">📅</p>
                <h3 className="text-lg font-bold text-gray-700 dark:text-slate-300">No Events Available Yet</h3>
                <p className="text-gray-400 dark:text-slate-500 text-sm mt-2">Events will appear here once organizations post them.</p>
              </div>
            ) : filteredEvents.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-2xl shadow dark:bg-[#151D2A] dark:border dark:border-slate-800 dark:shadow-none">
                <p className="text-5xl mb-4">🔍</p>
                <h3 className="text-lg font-bold text-gray-700 dark:text-slate-300">No events match your filters</h3>
                <button
                  type="button"
                  onClick={clearEventFilters}
                  className="mt-4 text-sm font-semibold text-primary hover:underline"
                >
                  Clear all filters
                </button>
              </div>
            ) : (
              groupEventsByCategory(filteredEvents).map(({ meta, events: categoryEvents }) => (
                <div key={meta.key}>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xl">{meta.emoji}</span>
                    <h4 className="font-bold text-gray-800 dark:text-white">{meta.label}</h4>
                    <span className="text-xs text-gray-400 dark:text-slate-500 font-semibold">
                      {categoryEvents.length} {categoryEvents.length === 1 ? 'event' : 'events'}
                    </span>
                  </div>

                  <div className="flex flex-col gap-4">
                    {categoryEvents.map(event => {
                      const isOpen = getEventOpenStatus(event)

                      return (
                        <div key={event._id} className="bg-white rounded-2xl shadow dark:bg-[#151D2A] dark:border dark:border-slate-800 dark:shadow-none p-6 flex flex-col md:flex-row justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <h4 className="font-bold text-gray-800 dark:text-white">{event.title}</h4>
                              <span className={`text-xs px-2 py-0.5 rounded-full capitalize font-semibold ${meta.badge}`}>
                                {meta.emoji} {meta.label}
                              </span>
                              <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                                isOpen ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-500 dark:text-slate-400'
                              }`}>
                                {isOpen ? '🟢 Open' : '🔒 Closed'}
                              </span>
                            </div>
                            <p className="text-sm text-gray-500 dark:text-slate-400">{event.orgName}</p>
                            <p className="text-sm text-gray-600 dark:text-slate-300 mt-2">{event.description}</p>
                            <div className="flex flex-wrap gap-4 mt-3 text-xs text-gray-500 dark:text-slate-400">
                              <span>📅 {new Date(event.date).toLocaleDateString()}</span>
                              <span>📍 {event.location}</span>
                              <span>⏱️ {event.duration}</span>
                              <span>👥 {event.registeredVolunteers?.length}/{event.volunteersNeeded}</span>
                            </div>
                            <div className="flex gap-2 mt-3 flex-wrap">
                              {event.skillsRequired?.map(s => (
                                <span key={s} className="bg-gray-100 text-gray-600 dark:text-slate-300 text-xs px-2 py-1 rounded-full">{s}</span>
                              ))}
                            </div>
                          </div>
                          <div className="flex items-center">
                            <button
                              onClick={() => handleRegister(event._id, event.title)}
                              disabled={isRegistered(event._id) || !isOpen}
                              className={`px-6 py-2.5 rounded-xl text-sm font-semibold transition
                                ${isRegistered(event._id)
                                  ? 'bg-gray-100 text-gray-400 dark:text-slate-500 cursor-not-allowed'
                                  : !isOpen
                                  ? 'bg-gray-100 text-gray-400 dark:text-slate-500 cursor-not-allowed'
                                  : 'bg-primary text-white hover:bg-blue-700'}`}
                            >
                              {isRegistered(event._id) ? 'Registered ✓' : !isOpen ? 'Closed' : 'Register'}
                            </button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* ── MY EVENTS TAB ── */}
        {activeTab === 'my events' && (
          <div className="flex flex-col gap-4">
            <h3 className="font-bold text-gray-700 dark:text-slate-300">Your Registered Events ({myEvents.length})</h3>
            {myEvents.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-2xl shadow dark:bg-[#151D2A] dark:border dark:border-slate-800 dark:shadow-none">
                <p className="text-5xl mb-4">🗓️</p>
                <h3 className="text-lg font-bold text-gray-700 dark:text-slate-300">No Events Registered Yet</h3>
                <p className="text-gray-400 dark:text-slate-500 text-sm mt-2">Browse events and register to get started!</p>
                <button
                  onClick={() => setActiveTab('events')}
                  className="mt-4 bg-primary text-white px-6 py-2 rounded-xl text-sm font-semibold hover:bg-blue-700 transition"
                >
                  Browse Events
                </button>
              </div>
            ) : (
              myEvents.map(event => (
  <div key={event._id} className="bg-white rounded-2xl shadow dark:bg-[#151D2A] dark:border dark:border-slate-800 dark:shadow-none p-6 flex justify-between items-center gap-4">
    <div>
      <h4 className="font-bold text-gray-800 dark:text-white">{event.title}</h4>
      <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">
        {event.orgName} · 📅 {new Date(event.date).toLocaleDateString()} · 📍 {event.location}
      </p>
      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full capitalize mt-2 inline-block">
        {event.category}
      </span>
    </div>
    <div className="flex flex-col items-end gap-2">
      <span className={`text-sm px-4 py-1.5 rounded-full font-semibold capitalize
        ${event.registrationStatus === 'approved' ? 'bg-green-100 text-green-700' :
          event.registrationStatus === 'rejected' ? 'bg-red-100 text-red-700' :
          'bg-yellow-100 text-yellow-700'}`}>
        {event.registrationStatus}
      </span>
      {event.registrationStatus === 'approved' && (
        <button
          onClick={() => setFeedbackModal(event)}
          className="text-xs bg-blue-50 dark:bg-blue-500/10 text-blue-600 px-3 py-1.5 rounded-lg hover:bg-blue-100 transition font-semibold"
        >
          💬 Give Feedback
        </button>
      )}
    </div>
  </div>
    ))
            )}
          </div>
        )}

        {/* ── CERTIFICATES TAB ── */}
        {activeTab === 'certificates' && (
          <div className="flex flex-col gap-4">
            <h3 className="font-bold text-gray-700 dark:text-slate-300">Your Certificates</h3>
            {myEvents.filter(e => e.status === 'completed').length === 0 ? (
              <div className="text-center py-16 bg-white rounded-2xl shadow dark:bg-[#151D2A] dark:border dark:border-slate-800 dark:shadow-none">
                <p className="text-5xl mb-4">🏆</p>
                <h3 className="text-lg font-bold text-gray-700 dark:text-slate-300">No Certificates Yet</h3>
                <p className="text-gray-400 dark:text-slate-500 text-sm mt-2">Complete events to earn certificates.</p>
              </div>
            ) : (
              myEvents.filter(e => e.status === 'completed').map(event => (
                <div key={event._id} className="bg-white rounded-2xl shadow dark:bg-[#151D2A] dark:border dark:border-slate-800 dark:shadow-none p-6 border-l-4 border-primary flex justify-between items-center">
                  <div>
                    <p className="text-2xl mb-1">🏆</p>
                    <h4 className="font-bold text-gray-800 dark:text-white">{event.title}</h4>
                    <p className="text-sm text-gray-500 dark:text-slate-400">{event.orgName} · {new Date(event.date).toLocaleDateString()}</p>
                  </div>
                  <button
  onClick={() => handleDownloadCertificate(event._id)}
  className="text-sm bg-primary text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
>
  Download PDF
</button>
                </div>
              ))
            )}
          </div>
        )}
        


        {/* ── PERFORMANCE TAB ── */}
{activeTab === 'performance' && (
  <div className="flex flex-col gap-6">

    {perfLoading ? (
      <div className="text-center py-16 bg-white rounded-2xl shadow dark:bg-[#151D2A] dark:border dark:border-slate-800 dark:shadow-none">
        <p className="text-4xl mb-3 animate-pulse">📊</p>
        <p className="text-gray-400 dark:text-slate-500">Calculating your score...</p>
      </div>
    ) : performance ? (
      <>
        {/* Score Card */}
        <div className="bg-white rounded-2xl shadow dark:bg-[#151D2A] dark:border dark:border-slate-800 dark:shadow-none p-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="text-center">
              <div className="relative w-36 h-36 mx-auto">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                  <circle cx="18" cy="18" r="15.9" fill="none" stroke="#e5e7eb" strokeWidth="2.5" />
                  <circle
                    cx="18" cy="18" r="15.9" fill="none"
                    stroke={performance.score >= 80 ? '#22c55e' : performance.score >= 60 ? '#3b82f6' : performance.score >= 40 ? '#f59e0b' : '#94a3b8'}
                    strokeWidth="2.5"
                    strokeDasharray={`${performance.score} ${100 - performance.score}`}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-3xl font-black text-gray-800 dark:text-white">{performance.score}</span>
                  <span className="text-xs text-gray-400 dark:text-slate-500">/ 100</span>
                </div>
              </div>
              <p className="text-lg font-bold mt-3">{performance.rank}</p>
              <p className="text-sm text-gray-500 dark:text-slate-400">Performance Score</p>
            </div>

            <div className="flex-1 grid grid-cols-2 gap-4">
              {[
                { label: 'Events Attended', value: performance.breakdown.attendance.eventsAttended, icon: '📅', color: 'text-blue-600' },
                { label: 'Hours Contributed', value: `${performance.hoursCompleted}h`, icon: '⏱️', color: 'text-green-600' },
                { label: 'Avg Rating', value: `${performance.breakdown.feedback.avgRating}/5`, icon: '⭐', color: 'text-yellow-600' },
                { label: 'Feedbacks Given', value: performance.totalFeedbacks, icon: '💬', color: 'text-purple-600' },
              ].map(stat => (
                <div key={stat.label} className="bg-gray-50 dark:bg-slate-800/60 rounded-xl p-4 text-center">
                  <div className="text-2xl mb-1">{stat.icon}</div>
                  <div className={`text-xl font-bold ${stat.color}`}>{stat.value}</div>
                  <div className="text-xs text-gray-500 dark:text-slate-400">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* AI Impact Story Generator */}
        <div className="bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 rounded-2xl shadow p-6 text-white overflow-hidden relative">
          <div className="flex items-center gap-2 mb-4">
            <h3 className="font-bold">✨ Your Impact Story</h3>
            {impactStoryLoading && (
              <span className="text-xs opacity-70 animate-pulse">Writing your story...</span>
            )}
          </div>

          {!impactStory && !impactStoryLoading ? (
            <p className="text-sm opacity-80 py-6 text-center">No impact data available yet</p>
          ) : impactStory && !impactStory.hasActivity ? (
            <div className="text-center py-6">
              <p className="text-3xl mb-2">🌱</p>
              <p className="text-sm opacity-90">{impactStory.message}</p>
            </div>
          ) : impactStory ? (
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase tracking-wide opacity-70">
                  {impactStory.period === 'month' ? "This Month" : "All-Time Wrap"}
                </span>
                <span className="text-sm font-semibold bg-white/20 px-3 py-1 rounded-full">
                  {impactStory.badge}
                </span>
              </div>

              <p className="text-sm leading-relaxed opacity-95">{impactStory.story}</p>

              <div className="grid grid-cols-4 gap-3">
                {[
                  { label: 'Events', value: impactStory.stats.eventsCompleted },
                  { label: 'Hours', value: impactStory.stats.totalHours },
                  { label: 'Top Category', value: impactStory.stats.topCategory, capitalize: true },
                  { label: 'Organizations', value: impactStory.stats.organizationsCount },
                ].map(stat => (
                  <div key={stat.label} className="bg-white/10 rounded-xl p-3 text-center">
                    <div className={`text-lg font-black ${stat.capitalize ? 'capitalize' : ''}`}>{stat.value}</div>
                    <div className="text-xs opacity-70">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>

        {/* Score Breakdown */}
        <div className="bg-white rounded-2xl shadow dark:bg-[#151D2A] dark:border dark:border-slate-800 dark:shadow-none p-6">
          <h3 className="font-bold text-gray-800 dark:text-white mb-5">📊 Score Breakdown</h3>
          <div className="flex flex-col gap-5">
            {[
              {
                label: 'Events Attendance',
                score: performance.breakdown.attendance.score,
                max: performance.breakdown.attendance.max,
                desc: `${performance.breakdown.attendance.eventsAttended} events attended`,
                color: 'bg-blue-50 dark:bg-blue-500/100',
                tip: 'Attend more events to increase this score'
              },
              {
                label: 'Feedback Ratings',
                score: performance.breakdown.feedback.score,
                max: performance.breakdown.feedback.max,
                desc: `Avg rating: ${performance.breakdown.feedback.avgRating}/5`,
                color: 'bg-yellow-50 dark:bg-yellow-500/100',
                tip: 'Give feedback after events to boost this score'
              },
              {
                label: 'Approval Rate',
                score: performance.breakdown.approval.score,
                max: performance.breakdown.approval.max,
                desc: `${performance.breakdown.approval.approved} approved / ${performance.breakdown.approval.total} total`,
                color: 'bg-green-50 dark:bg-green-500/100',
                tip: 'Keep your skills updated to get more approvals'
              },
              {
                label: 'Profile Completeness',
                score: performance.breakdown.profile.score,
                max: performance.breakdown.profile.max,
                desc: `${performance.breakdown.profile.score * 10}% complete`,
                color: 'bg-purple-50 dark:bg-purple-500/100',
                tip: 'Complete your profile to get full marks here'
              },
            ].map(item => (
              <div key={item.label}>
                <div className="flex justify-between items-center mb-2">
                  <div>
                    <span className="text-sm font-semibold text-gray-800 dark:text-white">{item.label}</span>
                    <span className="text-xs text-gray-400 dark:text-slate-500 ml-2">{item.desc}</span>
                  </div>
                  <span className="text-sm font-bold text-gray-700 dark:text-slate-300">
                    {item.score}/{item.max}
                  </span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-3">
                  <div
                    className={`${item.color} h-3 rounded-full transition-all duration-700`}
                    style={{ width: `${(item.score / item.max) * 100}%` }}
                  />
                </div>
                {item.score < item.max && (
                  <p className="text-xs text-gray-400 dark:text-slate-500 mt-1">💡 {item.tip}</p>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Registration Stats */}
        <div className="bg-white rounded-2xl shadow dark:bg-[#151D2A] dark:border dark:border-slate-800 dark:shadow-none p-6">
          <h3 className="font-bold text-gray-800 dark:text-white mb-4">📋 Registration Summary</h3>
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'Applied', value: performance.breakdown.approval.applied, color: 'bg-yellow-50 dark:bg-yellow-500/10 text-yellow-700', border: 'border-yellow-200' },
              { label: 'Approved', value: performance.breakdown.approval.approved, color: 'bg-green-50 dark:bg-green-500/10 text-green-700', border: 'border-green-200' },
              { label: 'Rejected', value: performance.breakdown.approval.rejected, color: 'bg-red-50 dark:bg-red-500/10 text-red-700', border: 'border-red-200' },
            ].map(stat => (
              <div key={stat.label} className={`${stat.color} border ${stat.border} rounded-xl p-4 text-center`}>
                <div className="text-2xl font-bold">{stat.value}</div>
                <div className="text-xs font-medium mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* How to Improve */}
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-100">
          <h3 className="font-bold text-gray-800 dark:text-white mb-4">🚀 How to Improve Your Score</h3>
          <div className="grid md:grid-cols-2 gap-3">
            {[
              { icon: '📅', text: 'Attend more volunteering events', points: '+4 pts per event' },
              { icon: '💬', text: 'Submit feedback after each event', points: '+up to 30 pts' },
              { icon: '✅', text: 'Keep your skills updated for better matches', points: '+20 pts' },
              { icon: '👤', text: 'Complete your profile fully', points: '+10 pts' },
            ].map(tip => (
              <div key={tip.text} className="flex items-start gap-3 bg-white rounded-xl p-3">
                <span className="text-xl">{tip.icon}</span>
                <div>
                  <p className="text-sm font-medium text-gray-800 dark:text-white">{tip.text}</p>
                  <p className="text-xs text-blue-600 font-semibold mt-0.5">{tip.points}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </>
    ) : null}

  </div>
)}

        {/* ── LEADERBOARD TAB ── */}
        {activeTab === 'leaderboard' && (
          <div className="flex flex-col gap-6">

            {myRank && (
              <div className="bg-primary text-white rounded-2xl shadow p-6 flex items-center justify-between flex-wrap gap-4">
                <div>
                  <p className="text-sm text-blue-100">Your rank</p>
                  <p className="text-3xl font-bold">
                    #{myRank.rank}{' '}
                    <span className="text-sm font-normal text-blue-100">
                      of {myRank.totalVolunteers}
                    </span>
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-blue-100">
                    Top {100 - myRank.percentile <= 0 ? 1 : 100 - myRank.percentile}%
                  </p>
                  {myRank.pointsToNextRank > 0 ? (
                    <p className="text-xs text-blue-100">
                      {myRank.pointsToNextRank} points to climb a rank
                    </p>
                  ) : (
                    <p className="text-xs text-blue-100">You're at the top! 🎉</p>
                  )}
                </div>
              </div>
            )}

            <div className="bg-white rounded-2xl shadow dark:bg-[#151D2A] dark:border dark:border-slate-800 dark:shadow-none p-6">
              <div className="flex items-center justify-between flex-wrap gap-3 mb-5">
                <h3 className="font-bold text-gray-800 dark:text-white">🏆 Volunteer Leaderboard</h3>
                <div className="flex gap-2 flex-wrap">
                  {LEADERBOARD_SORT_OPTIONS.map(opt => (
                    <button
                      key={opt.key}
                      onClick={() => setLeaderboardSort(opt.key)}
                      className={`px-4 py-1.5 rounded-full text-sm font-semibold transition ${
                        leaderboardSort === opt.key
                          ? 'bg-primary text-white'
                          : 'bg-gray-50 dark:bg-slate-800/60 text-gray-600 dark:text-slate-300 border border-gray-200 dark:border-slate-700 hover:border-primary'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {leaderboardLoading ? (
                <p className="text-center text-gray-400 dark:text-slate-500 py-10">Loading leaderboard...</p>
              ) : leaderboard.length === 0 ? (
                <p className="text-center text-gray-400 dark:text-slate-500 py-10">No volunteers to rank yet — be the first!</p>
              ) : (
                <div className="space-y-2">
                  {leaderboard.map(v => {
                    const activeOption = LEADERBOARD_SORT_OPTIONS.find(
                      opt => opt.key === leaderboardSort
                    )
                    const value =
                      leaderboardSort === 'hoursCompleted'
                        ? v.hoursCompleted
                        : leaderboardSort === 'eventsAttended'
                        ? v.eventsAttended
                        : v.performanceScore
                    const isMe = profile?._id && v._id === profile._id

                    return (
                      <div
                        key={v._id}
                        className={`flex items-center gap-4 p-4 rounded-xl border ${
                          RANK_STYLES[v.rank] || 'bg-white border-gray-200 dark:border-slate-700'
                        } ${isMe ? 'ring-2 ring-primary' : ''}`}
                      >
                        <div className="w-10 text-center font-bold text-gray-500 dark:text-slate-400 text-lg">
                          {RANK_MEDAL[v.rank] || `#${v.rank}`}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-gray-800 dark:text-white truncate">
                            {v.name} {isMe && <span className="text-xs text-primary font-normal">(you)</span>}
                          </p>
                          <p className="text-xs text-gray-400 dark:text-slate-500">{v.location}</p>
                        </div>
                        {v.badge && (
                          <span className="text-xs font-semibold text-primary bg-blue-50 dark:bg-blue-500/10 px-2.5 py-1 rounded-full whitespace-nowrap">
                            {v.badge}
                          </span>
                        )}
                        <div className="text-right w-24 shrink-0">
                          <p className="font-bold text-gray-800 dark:text-white">
                            {value}
                            {activeOption?.suffix && (
                              <span className="text-xs text-gray-400 dark:text-slate-500">{activeOption.suffix}</span>
                            )}
                          </p>
                          <p className="text-xs text-gray-400 dark:text-slate-500">{activeOption?.unit}</p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── EDIT PROFILE TAB ── */}
        {activeTab === 'edit profile' && (
          <EditProfileForm
            profile={profile}
            onUpdate={(updated) => {
              fetchAll()
              showNotification('✅ Profile updated successfully!')
              setActiveTab('overview')
            }}
          />
        )}

      </div>

      {/* Feedback Modal */}
{feedbackModal && (
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
    <div className="bg-white rounded-2xl shadow dark:bg-[#151D2A] dark:border dark:border-slate-800 dark:shadow-none-2xl p-6 w-full max-w-md">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-bold text-gray-800 dark:text-white">💬 Submit Feedback</h3>
        <button onClick={() => { setFeedbackModal(null); setFeedbackResult(null) }}
          className="text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:text-slate-300 text-xl">✕</button>
      </div>

      {feedbackResult ? (
        <div className="text-center py-6">
          <div className="text-5xl mb-3">
            {feedbackResult.sentiment === 'Positive' ? '😊' : feedbackResult.sentiment === 'Negative' ? '😞' : '😐'}
          </div>
          <p className="font-bold text-lg text-gray-800 dark:text-white mb-1">
            {feedbackResult.sentiment} Sentiment
          </p>
          <p className="text-gray-500 dark:text-slate-400 text-sm mb-3">{feedbackResult.summary}</p>
          <div className="flex flex-wrap justify-center gap-2">
            {feedbackResult.keywords?.map(k => (
              <span key={k} className="bg-blue-100 text-blue-700 text-xs px-3 py-1 rounded-full">{k}</span>
            ))}
          </div>
          <p className="text-xs text-gray-400 dark:text-slate-500 mt-4">Closing automatically...</p>
        </div>
      ) : (
        <form onSubmit={handleSubmitFeedback} className="flex flex-col gap-4">
          <div>
            <p className="text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Event</p>
            <p className="text-sm text-gray-500 dark:text-slate-400 bg-gray-50 dark:bg-slate-800/60 px-3 py-2 rounded-lg">{feedbackModal.title}</p>
          </div>

          <div>
            <p className="text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">Rating</p>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map(star => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setFeedbackForm({ ...feedbackForm, rating: star })}
                  className={`text-2xl transition-transform hover:scale-110 ${star <= feedbackForm.rating ? 'opacity-100' : 'opacity-30'}`}
                >
                  ⭐
                </button>
              ))}
              <span className="text-sm text-gray-500 dark:text-slate-400 ml-2 self-center">{feedbackForm.rating}/5</span>
            </div>
          </div>

          <div>
            <p className="text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Your Feedback</p>
            <textarea
              value={feedbackForm.comment}
              onChange={e => setFeedbackForm({ ...feedbackForm, comment: e.target.value })}
              rows={4}
              placeholder="Share your experience at this event..."
              className="w-full border border-gray-300 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary transition resize-none"
            />
          </div>

          <div className="bg-blue-50 dark:bg-blue-500/10 rounded-xl p-3 text-xs text-blue-700">
            🤖 AI will analyze your feedback sentiment automatically
          </div>

          <button type="submit" disabled={feedbackLoading || !feedbackForm.comment.trim()}
            className="bg-primary text-white py-3 rounded-xl font-semibold text-sm hover:bg-blue-700 transition disabled:opacity-60">
            {feedbackLoading ? 'Analyzing sentiment...' : 'Submit Feedback'}
          </button>
        </form>
      )}
    </div>
  </div>
)} 
    </div>
  )
}