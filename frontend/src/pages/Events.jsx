import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react'

import { useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'

import {
  Building2,
  CalendarDays,
  CheckCircle2,
  Clock3,
  GraduationCap,
  HandHeart,
  HeartPulse,
  Layers,
  LifeBuoy,
  Loader2,
  Lock,
  MapPin,
  PawPrint,
  RefreshCcw,
  Search,
  Sparkles,
  Users,
  X,
  XCircle,
  Leaf,
} from 'lucide-react'

import API from '../api'
import { useAuth } from '../context/AuthContext'

// -------------------------------------------------------------------------
// Static reference data — category presentation only. All events, counts,
// and statuses shown on this page come from the live API, never mocked.
// -------------------------------------------------------------------------

const CATEGORY_META = [
  {
    key: 'environment',
    label: 'Environment',
    icon: Leaf,
    ring: 'ring-emerald-200 dark:ring-emerald-500/20',
    badge: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300',
    chip: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300',
    bar: 'bg-emerald-500',
  },
  {
    key: 'education',
    label: 'Education',
    icon: GraduationCap,
    ring: 'ring-blue-200 dark:ring-blue-500/20',
    badge: 'bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300',
    chip: 'bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300',
    bar: 'bg-blue-500',
  },
  {
    key: 'health',
    label: 'Health',
    icon: HeartPulse,
    ring: 'ring-rose-200 dark:ring-rose-500/20',
    badge: 'bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300',
    chip: 'bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300',
    bar: 'bg-rose-500',
  },
  {
    key: 'community',
    label: 'Community',
    icon: HandHeart,
    ring: 'ring-amber-200 dark:ring-amber-500/20',
    badge: 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300',
    chip: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300',
    bar: 'bg-amber-500',
  },
  {
    key: 'disaster relief',
    label: 'Disaster Relief',
    icon: LifeBuoy,
    ring: 'ring-orange-200 dark:ring-orange-500/20',
    badge: 'bg-orange-50 text-orange-700 dark:bg-orange-500/10 dark:text-orange-300',
    chip: 'bg-orange-100 text-orange-700 dark:bg-orange-500/15 dark:text-orange-300',
    bar: 'bg-orange-500',
  },
  {
    key: 'animal welfare',
    label: 'Animal Welfare',
    icon: PawPrint,
    ring: 'ring-purple-200 dark:ring-purple-500/20',
    badge: 'bg-purple-50 text-purple-700 dark:bg-purple-500/10 dark:text-purple-300',
    chip: 'bg-purple-100 text-purple-700 dark:bg-purple-500/15 dark:text-purple-300',
    bar: 'bg-purple-500',
  },
  {
    key: 'other',
    label: 'Other',
    icon: Sparkles,
    ring: 'ring-slate-200 dark:ring-slate-500/20',
    badge: 'bg-slate-100 text-slate-700 dark:bg-slate-500/10 dark:text-slate-300',
    chip: 'bg-slate-200 text-slate-700 dark:bg-slate-500/15 dark:text-slate-300',
    bar: 'bg-slate-500',
  },
]

const STATUS_FILTERS = [
  { key: 'all', label: 'All events' },
  { key: 'open', label: 'Open' },
  { key: 'closed', label: 'Closed' },
]

function getCategoryMeta(key) {
  return (
    CATEGORY_META.find((item) => item.key === key) ||
    CATEGORY_META[CATEGORY_META.length - 1]
  )
}

function formatEventDate(value) {
  if (!value) return 'Date to be announced'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Date to be announced'
  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function getEventStatus(event) {
  const capacity = Number(event.volunteersNeeded) || 0
  const registeredCount = Array.isArray(event.registeredVolunteers)
    ? event.registeredVolunteers.length
    : 0
  const spotsLeft = Math.max(capacity - registeredCount, 0)
  const lifecycleClosed = Boolean(event.status) && event.status !== 'upcoming'
  const isOpen = !lifecycleClosed && spotsLeft > 0

  return {
    isOpen,
    registeredCount,
    capacity,
    spotsLeft,
    lifecycleClosed,
    lifecycleLabel: event.status,
  }
}

export default function Events() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')

  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState('all')
  const [activeStatus, setActiveStatus] = useState('all')

  const [registeringId, setRegisteringId] = useState(null)
  const [feedback, setFeedback] = useState(null)

  // Debounce the free-text search so we don't hammer the API on every keystroke.
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput.trim())
    }, 400)

    return () => clearTimeout(timer)
  }, [searchInput])

  const fetchEvents = useCallback(async () => {
    setLoading(true)
    setLoadError('')

    try {
      const params = new URLSearchParams()
      params.set('limit', '100')
      if (search) params.set('search', search)
      if (activeCategory !== 'all') params.set('category', activeCategory)

      const response = await API.get(`/events?${params.toString()}`)
      const eventData = response.data?.events || []

      setEvents(Array.isArray(eventData) ? eventData : [])
    } catch (error) {
      console.error('Unable to load events:', error)
      setLoadError('We could not load events right now. Please try again.')
      setEvents([])
    } finally {
      setLoading(false)
    }
  }, [search, activeCategory])

  useEffect(() => {
    fetchEvents()
  }, [fetchEvents])

  const visibleEvents = useMemo(() => {
    if (activeStatus === 'all') return events

    return events.filter((event) => {
      const { isOpen } = getEventStatus(event)
      return activeStatus === 'open' ? isOpen : !isOpen
    })
  }, [events, activeStatus])

  const groupedEvents = useMemo(() => {
    const groups = new Map()

    visibleEvents.forEach((event) => {
      const key = CATEGORY_META.some((item) => item.key === event.category)
        ? event.category
        : 'other'

      if (!groups.has(key)) groups.set(key, [])
      groups.get(key).push(event)
    })

    return CATEGORY_META.map((meta) => ({
      meta,
      events: groups.get(meta.key) || [],
    })).filter((group) => group.events.length > 0)
  }, [visibleEvents])

  const openCount = useMemo(
    () => events.filter((event) => getEventStatus(event).isOpen).length,
    [events]
  )

  const hasActiveFilters =
    Boolean(search) || activeCategory !== 'all' || activeStatus !== 'all'

  const clearFilters = () => {
    setSearchInput('')
    setSearch('')
    setActiveCategory('all')
    setActiveStatus('all')
  }

  const handleRegister = async (eventId) => {
    if (!user) {
      navigate('/login')
      return
    }

    if (user.role !== 'volunteer') return

    setRegisteringId(eventId)
    setFeedback(null)

    try {
      await API.post(`/events/${eventId}/register`)
      setFeedback({
        type: 'success',
        message: 'You are registered. Check your dashboard for details.',
      })
      fetchEvents()
    } catch (error) {
      setFeedback({
        type: 'error',
        message:
          error.response?.data?.message ||
          'We could not complete your registration. Please try again.',
      })
    } finally {
      setRegisteringId(null)
    }
  }

  return (
    <div className="page-shell">
      <main>
        {/* HERO */}
        <section className="relative isolate overflow-hidden bg-[#F8FAFC] dark:bg-[#0B0F19]">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 -z-10 bg-hero-gradient opacity-[0.06] dark:opacity-[0.14]"
          />

          <div className="section-container pb-10 pt-16 sm:pb-14 sm:pt-20">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="max-w-2xl"
            >
              <span className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/5 px-4 py-1.5 text-xs font-semibold uppercase tracking-wide text-primary dark:border-white/10 dark:bg-white/5 dark:text-white">
                <CalendarDays size={14} />
                Volunteering opportunities
              </span>

              <h1 className="mt-5 text-3xl font-extrabold tracking-tight text-primary sm:text-4xl lg:text-5xl dark:text-white">
                Find an event worth showing up for
              </h1>

              <p className="mt-4 text-base leading-relaxed text-slate-600 sm:text-lg dark:text-slate-300">
                Every opportunity posted by our partner organizations, organized
                by category, with live registration status so you know exactly
                where a spot is still open.
              </p>
            </motion.div>

            {/* SEARCH + FILTERS */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="glass-panel mt-9 rounded-3xl p-4 shadow-soft sm:p-5"
            >
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="relative flex-1 lg:max-w-sm">
                  <Search
                    size={18}
                    className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    type="text"
                    value={searchInput}
                    onChange={(event) => setSearchInput(event.target.value)}
                    placeholder="Search events by title..."
                    className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-sm font-medium text-slate-800 outline-none transition focus:border-primary/40 focus:ring-4 focus:ring-primary/10 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                  />
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {STATUS_FILTERS.map((status) => (
                    <button
                      key={status.key}
                      type="button"
                      onClick={() => setActiveStatus(status.key)}
                      className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
                        activeStatus === status.key
                          ? 'bg-primary text-white shadow-md shadow-primary/20'
                          : 'bg-white text-slate-600 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
                      }`}
                    >
                      {status.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-slate-200/70 pt-4 dark:border-slate-700/60">
                <button
                  type="button"
                  onClick={() => setActiveCategory('all')}
                  className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-sm font-semibold transition ${
                    activeCategory === 'all'
                      ? 'bg-primary/10 text-primary dark:bg-white/10 dark:text-white'
                      : 'text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
                  }`}
                >
                  <Layers size={15} />
                  All categories
                </button>

                {CATEGORY_META.map((meta) => {
                  const Icon = meta.icon
                  const isActive = activeCategory === meta.key

                  return (
                    <button
                      key={meta.key}
                      type="button"
                      onClick={() => setActiveCategory(meta.key)}
                      className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-sm font-semibold transition ${
                        isActive
                          ? meta.chip
                          : 'text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
                      }`}
                    >
                      <Icon size={15} />
                      {meta.label}
                    </button>
                  )
                })}

                {hasActiveFilters && (
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="ml-auto inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-sm font-semibold text-slate-400 transition hover:text-rose-500"
                  >
                    <X size={15} />
                    Clear filters
                  </button>
                )}
              </div>
            </motion.div>

            {!loading && !loadError && (
              <p className="mt-4 text-sm font-medium text-slate-500 dark:text-slate-400">
                Showing {visibleEvents.length} of {events.length} events ·{' '}
                <span className="text-emerald-600 dark:text-emerald-400">
                  {openCount} open
                </span>
              </p>
            )}
          </div>
        </section>

        {/* FEEDBACK BANNER */}
        <AnimatePresence>
          {feedback && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="section-container overflow-hidden"
            >
              <div
                className={`mb-2 mt-2 flex items-center justify-between gap-3 rounded-2xl border px-5 py-3.5 text-sm font-semibold ${
                  feedback.type === 'success'
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300'
                    : 'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-300'
                }`}
              >
                <span className="flex items-center gap-2">
                  {feedback.type === 'success' ? (
                    <CheckCircle2 size={17} />
                  ) : (
                    <XCircle size={17} />
                  )}
                  {feedback.message}
                </span>

                <button
                  type="button"
                  onClick={() => setFeedback(null)}
                  aria-label="Dismiss message"
                >
                  <X size={16} />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* EVENT LISTING */}
        <section className="section-padding pt-8 sm:pt-10">
          <div className="section-container">
            {loading ? (
              <div className="flex flex-col items-center justify-center gap-3 py-24 text-slate-400">
                <Loader2 size={30} className="animate-spin text-primary" />
                <p className="text-sm font-medium">Loading events...</p>
              </div>
            ) : loadError ? (
              <div className="premium-card flex flex-col items-center gap-4 px-6 py-16 text-center">
                <div className="grid h-14 w-14 place-items-center rounded-2xl bg-rose-50 text-rose-500 dark:bg-rose-500/10">
                  <XCircle size={26} />
                </div>
                <div>
                  <p className="text-lg font-bold text-primary dark:text-white">
                    {loadError}
                  </p>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    Check your connection and try again.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={fetchEvents}
                  className="primary-button"
                >
                  <RefreshCcw size={16} />
                  Retry
                </button>
              </div>
            ) : groupedEvents.length === 0 ? (
              <div className="premium-card flex flex-col items-center gap-4 px-6 py-16 text-center">
                <div className="grid h-14 w-14 place-items-center rounded-2xl bg-slate-100 text-slate-400 dark:bg-slate-800">
                  <Search size={26} />
                </div>
                <div>
                  <p className="text-lg font-bold text-primary dark:text-white">
                    No events match your filters
                  </p>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    Try a different category, status, or search term.
                  </p>
                </div>
                {hasActiveFilters && (
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="secondary-button"
                  >
                    <X size={16} />
                    Clear all filters
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-14">
                {groupedEvents.map(({ meta, events: categoryEvents }) => {
                  const Icon = meta.icon

                  return (
                    <div key={meta.key}>
                      <div className="mb-6 flex items-center gap-3">
                        <span
                          className={`grid h-11 w-11 place-items-center rounded-2xl ${meta.chip}`}
                        >
                          <Icon size={19} />
                        </span>
                        <div>
                          <h2 className="text-lg font-extrabold text-primary dark:text-white sm:text-xl">
                            {meta.label}
                          </h2>
                          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                            {categoryEvents.length}{' '}
                            {categoryEvents.length === 1 ? 'event' : 'events'}
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
                        {categoryEvents.map((event, index) => {
                          const status = getEventStatus(event)
                          const progress =
                            status.capacity > 0
                              ? Math.min(
                                  100,
                                  Math.round(
                                    (status.registeredCount /
                                      status.capacity) *
                                      100
                                  )
                                )
                              : 0

                          const isVolunteer = user?.role === 'volunteer'
                          const isRegistering = registeringId === event._id

                          return (
                            <motion.article
                              key={event._id}
                              initial={{ opacity: 0, y: 18 }}
                              whileInView={{ opacity: 1, y: 0 }}
                              viewport={{ once: true, margin: '-40px' }}
                              transition={{
                                duration: 0.4,
                                delay: Math.min(index, 6) * 0.05,
                              }}
                              className={`premium-card group flex h-full flex-col p-6 ring-1 ring-inset ${meta.ring} hover:-translate-y-1 hover:shadow-elevated`}
                            >
                              <div className="flex items-start justify-between gap-3">
                                <span
                                  className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${meta.badge}`}
                                >
                                  <Icon size={13} />
                                  {meta.label}
                                </span>

                                <span
                                  className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${
                                    status.isOpen
                                      ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300'
                                      : 'bg-slate-100 text-slate-500 dark:bg-slate-500/10 dark:text-slate-400'
                                  }`}
                                >
                                  {status.isOpen ? (
                                    <CheckCircle2 size={13} />
                                  ) : (
                                    <Lock size={12} />
                                  )}
                                  {status.isOpen ? 'Open' : 'Closed'}
                                </span>
                              </div>

                              <h3 className="mt-4 text-lg font-bold leading-snug text-primary dark:text-white">
                                {event.title}
                              </h3>

                              <div className="mt-1.5 flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400">
                                <Building2 size={13} />
                                {event.orgName}
                              </div>

                              <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                                {event.description}
                              </p>

                              <div className="mt-4 space-y-2 text-sm text-slate-600 dark:text-slate-300">
                                <div className="flex items-center gap-2">
                                  <CalendarDays
                                    size={15}
                                    className="shrink-0 text-slate-400"
                                  />
                                  {formatEventDate(event.date)}
                                </div>

                                <div className="flex items-center gap-2">
                                  <Clock3
                                    size={15}
                                    className="shrink-0 text-slate-400"
                                  />
                                  {event.duration}
                                </div>

                                <div className="flex items-center gap-2">
                                  <MapPin
                                    size={15}
                                    className="shrink-0 text-slate-400"
                                  />
                                  <span className="line-clamp-1">
                                    {event.location}
                                  </span>
                                </div>
                              </div>

                              <div className="mt-5">
                                <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">
                                  <span className="inline-flex items-center gap-1.5">
                                    <Users size={13} />
                                    {status.registeredCount}/{status.capacity}{' '}
                                    volunteers
                                  </span>
                                  {!status.isOpen && status.lifecycleClosed && (
                                    <span className="capitalize text-slate-400">
                                      {status.lifecycleLabel}
                                    </span>
                                  )}
                                </div>

                                <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                                  <div
                                    className={`h-full rounded-full ${meta.bar}`}
                                    style={{ width: `${progress}%` }}
                                  />
                                </div>
                              </div>

                              <div className="mt-6 flex-1" />

                              {!user ? (
                                <button
                                  type="button"
                                  onClick={() => navigate('/login')}
                                  className="secondary-button w-full !py-2.5 text-sm"
                                >
                                  Login to register
                                </button>
                              ) : isVolunteer ? (
                                <button
                                  type="button"
                                  disabled={!status.isOpen || isRegistering}
                                  onClick={() => handleRegister(event._id)}
                                  className={`w-full rounded-2xl px-5 py-2.5 text-sm font-semibold transition ${
                                    status.isOpen
                                      ? 'primary-button !py-2.5'
                                      : 'cursor-not-allowed bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500'
                                  }`}
                                >
                                  {isRegistering ? (
                                    <span className="inline-flex items-center justify-center gap-2">
                                      <Loader2
                                        size={15}
                                        className="animate-spin"
                                      />
                                      Registering...
                                    </span>
                                  ) : status.isOpen ? (
                                    'Register'
                                  ) : (
                                    'No spots left'
                                  )}
                                </button>
                              ) : (
                                <div className="rounded-2xl bg-slate-50 px-5 py-2.5 text-center text-xs font-semibold text-slate-400 dark:bg-slate-800/60">
                                  Registration is for volunteer accounts
                                </div>
                              )}
                            </motion.article>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  )
}