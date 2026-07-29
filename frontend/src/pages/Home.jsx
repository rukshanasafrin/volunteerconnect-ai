import {
  useEffect,
  useMemo,
  useState,
} from 'react'

import {
  Link,
  useNavigate,
} from 'react-router-dom'

import {
  AnimatePresence,
  motion,
} from 'framer-motion'

import {
  ArrowRight,
  Award,
  Bot,
  CalendarDays,
  CheckCircle2,
  Clock3,
  HeartHandshake,
  Leaf,
  MapPin,
  MessageCircle,
  Search,
  ShieldCheck,
  Sparkles,
  Users,
  GraduationCap,
  HandHeart,
  Building2,
} from 'lucide-react'

import API from '../api'
import { useAuth } from '../context/AuthContext'

const categories = [
  {
    title: 'Environment',
    description:
      'Support clean-up drives, sustainability, and green initiatives.',
    icon: Leaf,
  },
  {
    title: 'Education',
    description:
      'Share knowledge through teaching, mentoring, and learning support.',
    icon: GraduationCap,
  },
  {
    title: 'Community Service',
    description:
      'Contribute to local initiatives and community-focused activities.',
    icon: HandHeart,
  },
  {
    title: 'Social Impact',
    description:
      'Join meaningful initiatives designed to support people and communities.',
    icon: HeartHandshake,
  },
]

const features = [
  {
    title: 'Discover opportunities',
    description:
      'Browse available volunteering opportunities and find activities that fit your interests.',
    icon: Search,
  },
  {
    title: 'Track your contribution',
    description:
      'Use your volunteer dashboard to monitor participation and logged volunteering hours.',
    icon: Clock3,
  },
  {
    title: 'Download certificates',
    description:
      'Access and download certificates generated through the platform.',
    icon: Award,
  },
  {
    title: 'Get AI assistance',
    description:
      'Use the in-app AI assistant for quick support and platform guidance.',
    icon: Bot,
  },
]

const steps = [
  {
    number: '01',
    title: 'Create your account',
    description:
      'Register as a volunteer or organization using the existing role-based registration flow.',
    icon: Users,
  },
  {
    number: '02',
    title: 'Explore and manage',
    description:
      'Volunteers discover opportunities while organizations manage their events.',
    icon: CalendarDays,
  },
  {
    number: '03',
    title: 'Contribute and track',
    description:
      'Participate in activities and follow your volunteering progress from the dashboard.',
    icon: Clock3,
  },
  {
    number: '04',
    title: 'Celebrate your impact',
    description:
      'Access certificates and continue building your volunteering journey.',
    icon: Award,
  },
]

const platformBenefits = [
  'Role-based volunteer and organization experience',
  'Centralized event management',
  'Volunteer activity and hour tracking',
  'Certificate access and verification',
]

function formatDate(value) {
  if (!value) {
    return {
      day: '--',
      month: 'TBA',
    }
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return {
      day: '--',
      month: 'TBA',
    }
  }

  return {
    day: String(
      date.getDate()
    ).padStart(2, '0'),

    month: date.toLocaleDateString(
      'en-IN',
      {
        month: 'short',
      }
    ),
  }
}

function getEventTitle(event) {
  return (
    event.title ||
    event.name ||
    event.eventName ||
    'Volunteer Opportunity'
  )
}

function getEventDescription(event) {
  return (
    event.description ||
    'Explore this volunteering opportunity and contribute to your community.'
  )
}

function getEventLocation(event) {
  if (
    typeof event.location ===
    'string'
  ) {
    return event.location
  }

  if (
    event.location?.name
  ) {
    return event.location.name
  }

  return 'Location details available after registration'
}

function getEventDate(event) {
  return (
    event.date ||
    event.eventDate ||
    event.startDate ||
    event.createdAt
  )
}

function getEventProgress(event) {
  const current =
    Number(
      event.registeredVolunteers ||
      event.volunteersRegistered ||
      event.currentVolunteers ||
      0
    )

  const total =
    Number(
      event.maxVolunteers ||
      event.volunteerLimit ||
      event.capacity ||
      0
    )

  if (
    !total ||
    total <= 0
  ) {
    return {
      percentage: 0,
      label:
        'Registration details available',
      status: 'Available',
    }
  }

  const percentage = Math.min(
    100,
    Math.round(
      (current / total) * 100
    )
  )

  return {
    percentage,

    label:
      `${current} of ${total} volunteer places`,

    status:
      percentage >= 100
        ? 'Full'
        : percentage >= 80
        ? 'Almost full'
        : 'Available',
  }
}

function AnimatedNumber({
  value,
  suffix = '',
}) {
  const [
    displayValue,
    setDisplayValue,
  ] = useState(0)

  useEffect(() => {
    const numericValue =
      Number(value) || 0

    const duration = 900
    const startTime =
      performance.now()

    let frameId

    const update = (time) => {
      const progress =
        Math.min(
          1,
          (time - startTime) /
            duration
        )

      const eased =
        1 -
        Math.pow(
          1 - progress,
          4
        )

      setDisplayValue(
        Math.round(
          numericValue * eased
        )
      )

      if (
        progress < 1
      ) {
        frameId =
          requestAnimationFrame(
            update
          )
      }
    }

    frameId =
      requestAnimationFrame(
        update
      )

    return () => {
      cancelAnimationFrame(
        frameId
      )
    }
  }, [value])

  return (
    <>
      {displayValue.toLocaleString(
        'en-IN'
      )}
      {suffix}
    </>
  )
}

export default function Home() {
  const {
    user,
  } = useAuth()

  const navigate =
    useNavigate()

  const [
    events,
    setEvents,
  ] = useState([])

  const [
    loadingEvents,
    setLoadingEvents,
  ] = useState(true)

  useEffect(() => {
    const fetchEvents =
      async () => {
        try {
          const response =
            await API.get(
              '/events?limit=3'
            )

          const eventData =
            response.data?.events ||
            response.data ||
            []

          setEvents(
            Array.isArray(
              eventData
            )
              ? eventData
              : []
          )
        } catch (error) {
          console.error(
            'Unable to load events:',
            error
          )

          setEvents([])
        } finally {
          setLoadingEvents(
            false
          )
        }
      }

    fetchEvents()
  }, [])

  const activeEventCount =
    events.length

  const loggedHours =
    useMemo(() => {
      return events.reduce(
        (
          total,
          event
        ) => {
          const hours =
            Number(
              event.totalHours ||
              event.hours ||
              event.volunteerHours ||
              0
            )

          return (
            total +
            (
              Number.isFinite(
                hours
              )
                ? hours
                : 0
            )
          )
        },
        0
      )
    }, [events])

  const handlePrimaryAction =
    () => {
      if (!user) {
        navigate(
          '/register'
        )

        return
      }

      if (
        user.role ===
        'volunteer'
      ) {
        navigate(
          '/volunteer/dashboard'
        )

        return
      }

      if (
        user.role ===
        'org'
      ) {
        navigate(
          '/org/dashboard'
        )

        return
      }

      navigate(
        '/admin/dashboard'
      )
    }

  return (
    <div className="page-shell">
      <main>
        {/* HERO */}

        <section
          className="
            relative
            isolate
            overflow-hidden
            bg-[#F8FAFC]
            dark:bg-[#0B0F19]
          "
        >
          <div
            className="
              absolute
              inset-0
              -z-20
              bg-[radial-gradient(circle_at_12%_15%,rgba(134,134,172,0.22),transparent_34%),radial-gradient(circle_at_88%_20%,rgba(80,80,129,0.17),transparent_30%)]
              dark:bg-[radial-gradient(circle_at_12%_15%,rgba(134,134,172,0.16),transparent_34%),radial-gradient(circle_at_88%_20%,rgba(80,80,129,0.13),transparent_30%)]
            "
          />

          <motion.div
            animate={{
              y: [
                0,
                -18,
                0,
              ],
              x: [
                0,
                10,
                0,
              ],
            }}
            transition={{
              duration: 8,
              repeat:
                Infinity,
              ease:
                'easeInOut',
            }}
            className="
              absolute
              -left-24
              top-24
              -z-10
              h-72
              w-72
              rounded-full
              bg-accent/20
              blur-3xl
            "
          />

          <motion.div
            animate={{
              y: [
                0,
                20,
                0,
              ],
            }}
            transition={{
              duration: 7,
              repeat:
                Infinity,
              ease:
                'easeInOut',
            }}
            className="
              absolute
              -right-20
              bottom-0
              -z-10
              h-80
              w-80
              rounded-full
              bg-primary/15
              blur-3xl
            "
          />

          <div
            className="
              section-container
              grid
              min-h-[760px]
              items-center
              gap-16
              py-20
              lg:grid-cols-[1.05fr_0.95fr]
              lg:py-28
            "
          >
            <motion.div
              initial={{
                opacity: 0,
                y: 30,
              }}
              animate={{
                opacity: 1,
                y: 0,
              }}
              transition={{
                duration:
                  0.7,
              }}
            >
              <div
                className="
                  mb-7
                  inline-flex
                  items-center
                  gap-2
                  rounded-full
                  border
                  border-primary/10
                  bg-white/80
                  px-4
                  py-2
                  text-sm
                  font-semibold
                  text-primary
                  shadow-sm
                  backdrop-blur
                  dark:border-slate-700
                  dark:bg-slate-900/70
                  dark:text-slate-200
                "
              >
                <Sparkles
                  size={16}
                />

                A connected volunteering experience
              </div>

              <h1
                className="
                  max-w-3xl
                  text-5xl
                  font-extrabold
                  leading-[1.04]
                  tracking-[-0.045em]
                  text-primary
                  sm:text-6xl
                  lg:text-7xl
                  dark:text-white
                "
              >
                Empowering communities
                through{' '}

                <span
                  className="
                    bg-gradient-to-r
                    from-secondary
                    to-accent
                    bg-clip-text
                    text-transparent
                  "
                >
                  seamless volunteering.
                </span>
              </h1>

              <p
                className="
                  mt-7
                  max-w-2xl
                  text-base
                  leading-8
                  text-slate-600
                  sm:text-lg
                  dark:text-slate-300
                "
              >
                Discover opportunities,
                manage volunteering
                activities, track your
                contribution, access
                certificates, and get
                support through one
                unified platform.
              </p>

              <div
                className="
                  mt-9
                  flex
                  flex-col
                  gap-4
                  sm:flex-row
                "
              >
                <button
                  type="button"
                  onClick={
                    handlePrimaryAction
                  }
                  className="
                    primary-button
                    min-w-[190px]
                  "
                >
                  {user
                    ? 'Open Dashboard'
                    : 'Get Started'}

                  <ArrowRight
                    size={18}
                  />
                </button>

                <Link
                  to={
                    user
                      ? (
                        user.role ===
                        'volunteer'
                          ? '/volunteer/dashboard'
                          : user.role ===
                            'org'
                          ? '/org/dashboard'
                          : '/admin/dashboard'
                      )
                      : '/login'
                  }
                  className="
                    secondary-button
                    min-w-[190px]
                  "
                >
                  {user
                    ? 'View Your Workspace'
                    : 'Login to Account'}
                </Link>
              </div>

              <div
                className="
                  mt-10
                  grid
                  gap-3
                  sm:grid-cols-2
                "
              >
                {platformBenefits.map(
                  (
                    benefit
                  ) => (
                    <div
                      key={
                        benefit
                      }
                      className="
                        flex
                        items-center
                        gap-3
                        text-sm
                        font-medium
                        text-slate-600
                        dark:text-slate-300
                      "
                    >
                      <CheckCircle2
                        size={18}
                        className="
                          shrink-0
                          text-emerald-500
                        "
                      />

                      {benefit}
                    </div>
                  )
                )}
              </div>
            </motion.div>

            {/* HERO VISUAL */}

            <motion.div
              initial={{
                opacity: 0,
                scale: 0.94,
              }}
              animate={{
                opacity: 1,
                scale: 1,
              }}
              transition={{
                duration:
                  0.8,
                delay: 0.15,
              }}
              className="
                relative
                mx-auto
                w-full
                max-w-xl
              "
            >
              <div
                className="
                  absolute
                  inset-8
                  rounded-[3rem]
                  bg-gradient-to-br
                  from-primary
                  via-secondary
                  to-accent
                  opacity-15
                  blur-2xl
                "
              />

              <motion.div
                whileHover={{
                  y: -7,
                }}
                className="
                  relative
                  overflow-hidden
                  rounded-[2.5rem]
                  border
                  border-white/50
                  bg-white/80
                  p-6
                  shadow-elevated
                  backdrop-blur-xl
                  dark:border-slate-700/70
                  dark:bg-[#151D2A]/90
                "
              >
                <div
                  className="
                    flex
                    items-center
                    justify-between
                  "
                >
                  <div>
                    <p
                      className="
                        text-sm
                        font-semibold
                        text-slate-500
                        dark:text-slate-400
                      "
                    >
                      Your volunteering journey
                    </p>

                    <h2
                      className="
                        mt-1
                        text-2xl
                        font-bold
                        text-primary
                        dark:text-white
                      "
                    >
                      Everything in one place
                    </h2>
                  </div>

                  <div
                    className="
                      grid
                      h-12
                      w-12
                      place-items-center
                      rounded-2xl
                      bg-primary
                      text-white
                    "
                  >
                    <HeartHandshake
                      size={23}
                    />
                  </div>
                </div>

                <div
                  className="
                    mt-7
                    grid
                    gap-4
                    sm:grid-cols-2
                  "
                >
                  <motion.div
                    whileHover={{
                      scale: 1.03,
                    }}
                    className="
                      rounded-3xl
                      bg-primary
                      p-5
                      text-white
                    "
                  >
                    <CalendarDays
                      size={22}
                    />

                    <p
                      className="
                        mt-8
                        text-sm
                        text-white/70
                      "
                    >
                      Opportunities
                    </p>

                    <p
                      className="
                        mt-1
                        text-xl
                        font-bold
                      "
                    >
                      Discover events
                    </p>
                  </motion.div>

                  <motion.div
                    whileHover={{
                      scale: 1.03,
                    }}
                    className="
                      rounded-3xl
                      bg-slate-100
                      p-5
                      dark:bg-slate-800
                    "
                  >
                    <Clock3
                      size={22}
                      className="
                        text-secondary
                        dark:text-accent
                      "
                    />

                    <p
                      className="
                        mt-8
                        text-sm
                        text-slate-500
                      "
                    >
                      Progress
                    </p>

                    <p
                      className="
                        mt-1
                        text-xl
                        font-bold
                        text-primary
                        dark:text-white
                      "
                    >
                      Track hours
                    </p>
                  </motion.div>
                </div>

                <div
                  className="
                    mt-4
                    rounded-3xl
                    border
                    border-slate-100
                    bg-slate-50
                    p-5
                    dark:border-slate-800
                    dark:bg-slate-900
                  "
                >
                  <div
                    className="
                      flex
                      items-center
                      justify-between
                    "
                  >
                    <div
                      className="
                        flex
                        items-center
                        gap-3
                      "
                    >
                      <div
                        className="
                          grid
                          h-11
                          w-11
                          place-items-center
                          rounded-2xl
                          bg-accent/20
                          text-primary
                          dark:text-accent
                        "
                      >
                        <Bot
                          size={21}
                        />
                      </div>

                      <div>
                        <p
                          className="
                            font-semibold
                            text-slate-800
                            dark:text-white
                          "
                        >
                          AI Assistant
                        </p>

                        <p
                          className="
                            text-xs
                            text-slate-500
                          "
                        >
                          Quick support inside the app
                        </p>
                      </div>
                    </div>

                    <MessageCircle
                      size={20}
                      className="
                        text-secondary
                        dark:text-accent
                      "
                    />
                  </div>
                </div>
              </motion.div>

              <motion.div
                animate={{
                  y: [
                    0,
                    -10,
                    0,
                  ],
                }}
                transition={{
                  duration: 4,
                  repeat:
                    Infinity,
                  ease:
                    'easeInOut',
                }}
                className="
                  absolute
                  -left-5
                  top-20
                  hidden
                  rounded-2xl
                  border
                  border-white/60
                  bg-white/85
                  p-4
                  shadow-lg
                  backdrop-blur
                  lg:block
                  dark:border-slate-700
                  dark:bg-slate-900/90
                "
              >
                <div
                  className="
                    flex
                    items-center
                    gap-3
                  "
                >
                  <div
                    className="
                      grid
                      h-10
                      w-10
                      place-items-center
                      rounded-xl
                      bg-emerald-100
                      text-emerald-600
                    "
                  >
                    <ShieldCheck
                      size={19}
                    />
                  </div>

                  <div>
                    <p
                      className="
                        text-xs
                        text-slate-500
                      "
                    >
                      Organized
                    </p>

                    <p
                      className="
                        text-sm
                        font-bold
                        dark:text-white
                      "
                    >
                      Manage with confidence
                    </p>
                  </div>
                </div>
              </motion.div>

              <motion.div
                animate={{
                  y: [
                    0,
                    11,
                    0,
                  ],
                }}
                transition={{
                  duration: 4.5,
                  repeat:
                    Infinity,
                  ease:
                    'easeInOut',
                }}
                className="
                  absolute
                  -bottom-5
                  right-0
                  hidden
                  rounded-2xl
                  bg-primary
                  p-4
                  text-white
                  shadow-xl
                  lg:block
                "
              >
                <Award
                  size={21}
                />

                <p
                  className="
                    mt-3
                    text-xs
                    text-white/70
                  "
                >
                  Recognition
                </p>

                <p
                  className="
                    text-sm
                    font-bold
                  "
                >
                  Certificates
                </p>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* REAL PLATFORM DATA */}

        <section
          className="
            border-y
            border-slate-200/70
            bg-white
            py-7
            dark:border-slate-800
            dark:bg-[#0F172A]
          "
        >
          <div
            className="
              section-container
              grid
              gap-5
              md:grid-cols-2
            "
          >
            <div
              className="
                flex
                items-center
                gap-4
                rounded-2xl
                bg-slate-50
                p-5
                dark:bg-slate-900
              "
            >
              <div
                className="
                  grid
                  h-12
                  w-12
                  place-items-center
                  rounded-2xl
                  bg-primary
                  text-white
                "
              >
                <CalendarDays
                  size={22}
                />
              </div>

              <div>
                <p
                  className="
                    text-2xl
                    font-extrabold
                    text-primary
                    dark:text-white
                  "
                >
                  <AnimatedNumber
                    value={
                      activeEventCount
                    }
                  />
                </p>

                <p
                  className="
                    text-sm
                    text-slate-500
                  "
                >
                  Active opportunities open for volunteers right now
                </p>
              </div>
            </div>

            <div
              className="
                flex
                items-center
                gap-4
                rounded-2xl
                bg-slate-50
                p-5
                dark:bg-slate-900
              "
            >
              <div
                className="
                  grid
                  h-12
                  w-12
                  place-items-center
                  rounded-2xl
                  bg-emerald-100
                  text-emerald-600
                  dark:bg-emerald-500/10
                "
              >
                <Clock3
                  size={22}
                />
              </div>

              <div>
                <p
                  className="
                    text-2xl
                    font-extrabold
                    text-primary
                    dark:text-white
                  "
                >
                  <AnimatedNumber
                    value={
                      loggedHours
                    }
                    suffix=" hrs"
                  />
                </p>

                <p
                  className="
                    text-sm
                    text-slate-500
                  "
                >
                  Volunteer hours logged by our community
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CATEGORIES */}

        <section
          className="
            section-padding
            bg-slate-50
            dark:bg-[#0B0F19]
          "
        >
          <div
            className="
              section-container
            "
          >
            <div
              className="
                max-w-2xl
              "
            >
              <p
                className="
                  text-sm
                  font-bold
                  uppercase
                  tracking-[0.18em]
                  text-secondary
                  dark:text-accent
                "
              >
                Explore by interest
              </p>

              <h2
                className="
                  mt-3
                  text-4xl
                  font-extrabold
                  tracking-tight
                  text-primary
                  sm:text-5xl
                  dark:text-white
                "
              >
                Find meaningful ways to contribute
              </h2>

              <p
                className="
                  mt-5
                  leading-7
                  text-slate-600
                  dark:text-slate-300
                "
              >
                Explore opportunities across
                community-focused domains and
                choose activities aligned with
                your interests.
              </p>
            </div>

            <div
              className="
                mt-12
                grid
                gap-5
                sm:grid-cols-2
                lg:grid-cols-4
              "
            >
              {categories.map(
                (
                  category,
                  index
                ) => {
                  const Icon =
                    category.icon

                  return (
                    <motion.article
                      key={
                        category.title
                      }
                      initial={{
                        opacity: 0,
                        y: 25,
                      }}
                      whileInView={{
                        opacity: 1,
                        y: 0,
                      }}
                      viewport={{
                        once: true,
                      }}
                      transition={{
                        delay:
                          index *
                          0.08,
                      }}
                      whileHover={{
                        y: -8,
                      }}
                      className="
                        premium-card
                        group
                        p-7
                        hover:shadow-xl
                      "
                    >
                      <div
                        className="
                          grid
                          h-14
                          w-14
                          place-items-center
                          rounded-2xl
                          bg-primary/10
                          text-primary
                          transition
                          group-hover:bg-primary
                          group-hover:text-white
                          dark:bg-accent/15
                          dark:text-accent
                        "
                      >
                        <Icon
                          size={25}
                        />
                      </div>

                      <h3
                        className="
                          mt-7
                          text-xl
                          font-bold
                          text-primary
                          dark:text-white
                        "
                      >
                        {
                          category.title
                        }
                      </h3>

                      <p
                        className="
                          mt-3
                          text-sm
                          leading-6
                          text-slate-500
                          dark:text-slate-400
                        "
                      >
                        {
                          category.description
                        }
                      </p>
                    </motion.article>
                  )
                }
              )}
            </div>
          </div>
        </section>

        {/* FEATURES */}

        <section
          className="
            section-padding
            bg-white
            dark:bg-[#0F172A]
          "
        >
          <div
            className="
              section-container
            "
          >
            <div
              className="
                grid
                gap-12
                lg:grid-cols-[0.8fr_1.2fr]
                lg:items-end
              "
            >
              <div>
                <p
                  className="
                    text-sm
                    font-bold
                    uppercase
                    tracking-[0.18em]
                    text-secondary
                    dark:text-accent
                  "
                >
                  Platform features
                </p>

                <h2
                  className="
                    mt-3
                    text-4xl
                    font-extrabold
                    tracking-tight
                    text-primary
                    sm:text-5xl
                    dark:text-white
                  "
                >
                  Designed for a smoother volunteering experience
                </h2>
              </div>

              <p
                className="
                  max-w-2xl
                  leading-7
                  text-slate-600
                  dark:text-slate-300
                "
              >
                VolunteerConnect brings
                opportunity discovery,
                contribution tracking,
                certificates, and in-app
                assistance together without
                changing how your existing
                platform works.
              </p>
            </div>

            <div
              className="
                mt-12
                grid
                gap-5
                md:grid-cols-2
              "
            >
              {features.map(
                (
                  feature,
                  index
                ) => {
                  const Icon =
                    feature.icon

                  return (
                    <motion.article
                      key={
                        feature.title
                      }
                      initial={{
                        opacity: 0,
                        y: 25,
                      }}
                      whileInView={{
                        opacity: 1,
                        y: 0,
                      }}
                      viewport={{
                        once: true,
                      }}
                      transition={{
                        delay:
                          index *
                          0.08,
                      }}
                      whileHover={{
                        y: -6,
                      }}
                      className="
                        premium-card
                        flex
                        gap-5
                        p-7
                        hover:shadow-xl
                      "
                    >
                      <div
                        className="
                          grid
                          h-14
                          w-14
                          shrink-0
                          place-items-center
                          rounded-2xl
                          bg-gradient-to-br
                          from-primary
                          to-secondary
                          text-white
                        "
                      >
                        <Icon
                          size={24}
                        />
                      </div>

                      <div>
                        <h3
                          className="
                            text-xl
                            font-bold
                            text-primary
                            dark:text-white
                          "
                        >
                          {
                            feature.title
                          }
                        </h3>

                        <p
                          className="
                            mt-3
                            leading-7
                            text-slate-500
                            dark:text-slate-400
                          "
                        >
                          {
                            feature.description
                          }
                        </p>
                      </div>
                    </motion.article>
                  )
                }
              )}
            </div>
          </div>
        </section>

        {/* FEATURED EVENTS */}

        <section
          className="
            section-padding
            bg-slate-50
            dark:bg-[#0B0F19]
          "
        >
          <div
            className="
              section-container
            "
          >
            <div
              className="
                flex
                flex-col
                justify-between
                gap-6
                sm:flex-row
                sm:items-end
              "
            >
              <div>
                <p
                  className="
                    text-sm
                    font-bold
                    uppercase
                    tracking-[0.18em]
                    text-secondary
                    dark:text-accent
                  "
                >
                  Featured opportunities
                </p>

                <h2
                  className="
                    mt-3
                    text-4xl
                    font-extrabold
                    tracking-tight
                    text-primary
                    sm:text-5xl
                    dark:text-white
                  "
                >
                  Live opportunities, updated in real time
                </h2>
              </div>

              <Link
                to={
                  user
                    ? (
                      user.role ===
                      'volunteer'
                        ? '/volunteer/dashboard'
                        : user.role ===
                          'org'
                        ? '/org/dashboard'
                        : '/admin/dashboard'
                    )
                    : '/register'
                }
                className="
                  inline-flex
                  items-center
                  gap-2
                  font-semibold
                  text-primary
                  dark:text-accent
                "
              >
                {user
                  ? 'Open workspace'
                  : 'Register to explore'}

                <ArrowRight
                  size={18}
                />
              </Link>
            </div>

            <AnimatePresence
              mode="wait"
            >
              {loadingEvents ? (
                <motion.div
                  key="loading"
                  initial={{
                    opacity: 0,
                  }}
                  animate={{
                    opacity: 1,
                  }}
                  exit={{
                    opacity: 0,
                  }}
                  className="
                    mt-12
                    grid
                    gap-6
                    md:grid-cols-3
                  "
                >
                  {[1, 2, 3].map(
                    (
                      item
                    ) => (
                      <div
                        key={
                          item
                        }
                        className="
                          h-[360px]
                          animate-pulse
                          rounded-3xl
                          bg-white
                          dark:bg-slate-900
                        "
                      />
                    )
                  )}
                </motion.div>
              ) : events.length >
                0 ? (
                <motion.div
                  key="events"
                  initial={{
                    opacity: 0,
                  }}
                  animate={{
                    opacity: 1,
                  }}
                  className="
                    mt-12
                    grid
                    gap-6
                    md:grid-cols-2
                    xl:grid-cols-3
                  "
                >
                  {events.map(
                    (
                      event,
                      index
                    ) => {
                      const date =
                        formatDate(
                          getEventDate(
                            event
                          )
                        )

                      const progress =
                        getEventProgress(
                          event
                        )

                      return (
                        <motion.article
                          key={
                            event._id ||
                            event.id ||
                            `${getEventTitle(
                              event
                            )}-${index}`
                          }
                          initial={{
                            opacity: 0,
                            y: 25,
                          }}
                          whileInView={{
                            opacity: 1,
                            y: 0,
                          }}
                          viewport={{
                            once: true,
                          }}
                          whileHover={{
                            y: -8,
                          }}
                          className="
                            premium-card
                            overflow-hidden
                            p-6
                            hover:shadow-xl
                          "
                        >
                          <div
                            className="
                              flex
                              items-start
                              justify-between
                              gap-4
                            "
                          >
                            <div
                              className="
                                grid
                                min-w-16
                                place-items-center
                                rounded-2xl
                                bg-primary
                                px-3
                                py-3
                                text-center
                                text-white
                              "
                            >
                              <span
                                className="
                                  text-xl
                                  font-extrabold
                                "
                              >
                                {
                                  date.day
                                }
                              </span>

                              <span
                                className="
                                  text-[11px]
                                  font-semibold
                                  uppercase
                                  tracking-wider
                                  text-white/70
                                "
                              >
                                {
                                  date.month
                                }
                              </span>
                            </div>

                            <span
                              className={`
                                rounded-full
                                px-3
                                py-1.5
                                text-xs
                                font-semibold
                                ${
                                  progress.status === 'Full'
                                    ? `
                                      bg-red-50
                                      text-red-700
                                      dark:bg-red-500/10
                                      dark:text-red-300
                                    `
                                    : progress.status === 'Almost full'
                                    ? `
                                      bg-amber-50
                                      text-amber-700
                                      dark:bg-amber-500/10
                                      dark:text-amber-300
                                    `
                                    : `
                                      bg-emerald-50
                                      text-emerald-700
                                      dark:bg-emerald-500/10
                                      dark:text-emerald-300
                                    `
                                }
                              `}
                            >
                              {progress.status}
                            </span>
                          </div>

                          <h3
                            className="
                              mt-7
                              line-clamp-2
                              text-xl
                              font-bold
                              text-primary
                              dark:text-white
                            "
                          >
                            {getEventTitle(
                              event
                            )}
                          </h3>

                          <p
                            className="
                              mt-3
                              line-clamp-3
                              min-h-[72px]
                              text-sm
                              leading-6
                              text-slate-500
                              dark:text-slate-400
                            "
                          >
                            {getEventDescription(
                              event
                            )}
                          </p>

                          <div
                            className="
                              mt-5
                              flex
                              items-center
                              gap-2
                              text-sm
                              text-slate-500
                              dark:text-slate-400
                            "
                          >
                            <MapPin
                              size={16}
                              className="
                                shrink-0
                                text-secondary
                                dark:text-accent
                              "
                            />

                            <span
                              className="
                                truncate
                              "
                            >
                              {getEventLocation(
                                event
                              )}
                            </span>
                          </div>

                          <div
                            className="
                              mt-6
                            "
                          >
                            <div
                              className="
                                mb-2
                                flex
                                justify-between
                                gap-4
                                text-xs
                                font-medium
                                text-slate-500
                              "
                            >
                              <span>
                                Volunteer
                                progress
                              </span>

                              <span>
                                {
                                  progress.label
                                }
                              </span>
                            </div>

                            <div
                              className="
                                h-2
                                overflow-hidden
                                rounded-full
                                bg-slate-100
                                dark:bg-slate-800
                              "
                            >
                              <motion.div
                                initial={{
                                  width: 0,
                                }}
                                whileInView={{
                                  width:
                                    `${progress.percentage}%`,
                                }}
                                viewport={{
                                  once: true,
                                }}
                                className="
                                  h-full
                                  rounded-full
                                  bg-gradient-to-r
                                  from-primary
                                  to-accent
                                "
                              />
                            </div>
                          </div>

                          <Link
                            to={
                              user
                                ? (
                                  user.role ===
                                  'volunteer'
                                    ? '/volunteer/dashboard'
                                    : user.role ===
                                      'org'
                                    ? '/org/dashboard'
                                    : '/admin/dashboard'
                                )
                                : '/register'
                            }
                            className="
                              mt-7
                              flex
                              items-center
                              justify-center
                              gap-2
                              rounded-2xl
                              bg-primary
                              px-5
                              py-3
                              font-semibold
                              text-white
                              transition
                              hover:bg-[#1D1D43]
                            "
                          >
                            {user
                              ? 'Open Workspace'
                              : 'Register to Join'}

                            <ArrowRight
                              size={17}
                            />
                          </Link>
                        </motion.article>
                      )
                    }
                  )}
                </motion.div>
              ) : (
                <motion.div
                  key="empty"
                  initial={{
                    opacity: 0,
                    y: 15,
                  }}
                  animate={{
                    opacity: 1,
                    y: 0,
                  }}
                  className="
                    premium-card
                    mt-12
                    grid
                    min-h-[280px]
                    place-items-center
                    p-10
                    text-center
                  "
                >
                  <div>
                    <div
                      className="
                        mx-auto
                        grid
                        h-16
                        w-16
                        place-items-center
                        rounded-3xl
                        bg-primary/10
                        text-primary
                        dark:text-accent
                      "
                    >
                      <CalendarDays
                        size={29}
                      />
                    </div>

                    <h3
                      className="
                        mt-5
                        text-xl
                        font-bold
                        text-primary
                        dark:text-white
                      "
                    >
                      No events are available yet
                    </h3>

                    <p
                      className="
                        mt-2
                        max-w-md
                        text-sm
                        leading-6
                        text-slate-500
                      "
                    >
                      Register to access your
                      workspace and check for
                      newly added volunteering
                      opportunities.
                    </p>

                    <Link
                      to="/register"
                      className="
                        primary-button
                        mt-6
                      "
                    >
                      Create an account
                    </Link>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </section>

        {/* HOW IT WORKS */}

        <section
          className="
            section-padding
            bg-white
            dark:bg-[#0F172A]
          "
        >
          <div
            className="
              section-container
            "
          >
            <div
              className="
                mx-auto
                max-w-2xl
                text-center
              "
            >
              <p
                className="
                  text-sm
                  font-bold
                  uppercase
                  tracking-[0.18em]
                  text-secondary
                  dark:text-accent
                "
              >
                How it works
              </p>

              <h2
                className="
                  mt-3
                  text-4xl
                  font-extrabold
                  tracking-tight
                  text-primary
                  sm:text-5xl
                  dark:text-white
                "
              >
                A clear path from sign-up to impact
              </h2>
            </div>

            <div
              className="
                relative
                mt-14
                grid
                gap-7
                md:grid-cols-2
                xl:grid-cols-4
              "
            >
              {steps.map(
                (
                  step,
                  index
                ) => {
                  const Icon =
                    step.icon

                  return (
                    <motion.article
                      key={
                        step.number
                      }
                      initial={{
                        opacity: 0,
                        y: 25,
                      }}
                      whileInView={{
                        opacity: 1,
                        y: 0,
                      }}
                      viewport={{
                        once: true,
                      }}
                      transition={{
                        delay:
                          index *
                          0.1,
                      }}
                      className="
                        relative
                        rounded-3xl
                        border
                        border-slate-200
                        bg-slate-50
                        p-7
                        dark:border-slate-800
                        dark:bg-slate-900
                      "
                    >
                      <span
                        className="
                          text-sm
                          font-extrabold
                          text-accent
                        "
                      >
                        {
                          step.number
                        }
                      </span>

                      <div
                        className="
                          mt-7
                          grid
                          h-14
                          w-14
                          place-items-center
                          rounded-2xl
                          bg-primary
                          text-white
                        "
                      >
                        <Icon
                          size={24}
                        />
                      </div>

                      <h3
                        className="
                          mt-6
                          text-xl
                          font-bold
                          text-primary
                          dark:text-white
                        "
                      >
                        {
                          step.title
                        }
                      </h3>

                      <p
                        className="
                          mt-3
                          text-sm
                          leading-6
                          text-slate-500
                          dark:text-slate-400
                        "
                      >
                        {
                          step.description
                        }
                      </p>
                    </motion.article>
                  )
                }
              )}
            </div>
          </div>
        </section>

        {/* ORGANIZATION CTA */}

        <section
          className="
            section-padding
            bg-slate-50
            dark:bg-[#0B0F19]
          "
        >
          <div
            className="
              section-container
            "
          >
            <div
              className="
                overflow-hidden
                rounded-[2.5rem]
                bg-gradient-to-br
                from-primary
                via-secondary
                to-[#686895]
                px-7
                py-14
                text-white
                shadow-elevated
                sm:px-12
                lg:px-16
              "
            >
              <div
                className="
                  grid
                  gap-12
                  lg:grid-cols-[1fr_auto]
                  lg:items-center
                "
              >
                <div>
                  <div
                    className="
                      inline-flex
                      items-center
                      gap-2
                      rounded-full
                      bg-white/10
                      px-4
                      py-2
                      text-sm
                      font-semibold
                    "
                  >
                    <Building2
                      size={17}
                    />

                    For volunteers and organizations
                  </div>

                  <h2
                    className="
                      mt-6
                      max-w-3xl
                      text-4xl
                      font-extrabold
                      tracking-tight
                      sm:text-5xl
                    "
                  >
                    Build stronger community connections
                  </h2>

                  <p
                    className="
                      mt-5
                      max-w-2xl
                      leading-7
                      text-white/75
                    "
                  >
                    Join VolunteerConnect to
                    discover opportunities,
                    coordinate activities,
                    manage events, and keep
                    your volunteering journey
                    organized.
                  </p>
                </div>

                <div
                  className="
                    flex
                    flex-col
                    gap-3
                    sm:flex-row
                    lg:flex-col
                  "
                >
                  <Link
                    to="/register"
                    className="
                      inline-flex
                      items-center
                      justify-center
                      gap-2
                      rounded-2xl
                      bg-white
                      px-6
                      py-3.5
                      font-semibold
                      text-primary
                      transition
                      hover:-translate-y-0.5
                      hover:shadow-xl
                    "
                  >
                    Create an account

                    <ArrowRight
                      size={18}
                    />
                  </Link>

                  <Link
                    to="/login"
                    className="
                      inline-flex
                      items-center
                      justify-center
                      rounded-2xl
                      border
                      border-white/25
                      bg-white/10
                      px-6
                      py-3.5
                      font-semibold
                      text-white
                      backdrop-blur
                      transition
                      hover:bg-white/20
                    "
                  >
                    Sign in
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}