import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'

import {
  Award,
  Bot,
  CalendarCheck,
  ClipboardCheck,
  HeartHandshake,
  LineChart,
  ListChecks,
  Search,
  ShieldCheck,
  Sparkles,
  Trophy,
  Users,
} from 'lucide-react'

// -------------------------------------------------------------------------
// Content below describes capabilities that actually exist in the app
// (event management, AI recommendations, certificates, leaderboard,
// sentiment-based feedback). No invented team bios or made-up statistics.
// -------------------------------------------------------------------------

const roles = [
  {
    title: 'Volunteers',
    icon: Users,
    description:
      'Browse open events by category, register for the ones that fit, track hours and registration status from a personal dashboard, and download certificates for completed events.',
  },
  {
    title: 'Organizations',
    icon: HeartHandshake,
    description:
      'Post events with the details volunteers need — category, location, date, duration, and volunteer capacity — then review applicants and manage registration status.',
  },
  {
    title: 'Admins',
    icon: ShieldCheck,
    description:
      'Oversee the platform end to end, with visibility across volunteers, organizations, and the events running between them.',
  },
]

const capabilities = [
  {
    title: 'Category-wise event discovery',
    description:
      'Every open opportunity is organized by category — education, environment, health, community, disaster relief, animal welfare, and more — with live open/closed status.',
    icon: Search,
  },
  {
    title: 'AI-assisted matching',
    description:
      'The platform can recommend events to volunteers and suggest volunteers to organizations, based on skills and past participation.',
    icon: Bot,
  },
  {
    title: 'Performance & impact tracking',
    description:
      'Volunteers can follow their contribution history, performance score, and an AI-generated summary of their impact over time.',
    icon: LineChart,
  },
  {
    title: 'Verified certificates',
    description:
      'Certificates are issued for completed events and can be independently verified by anyone using a certificate ID — no login required.',
    icon: Award,
  },
  {
    title: 'Community leaderboard',
    description:
      'A public leaderboard ranks active volunteers, with a personal rank and percentile available to anyone signed in.',
    icon: Trophy,
  },
  {
    title: 'Feedback with sentiment analysis',
    description:
      'Post-event feedback is analyzed for sentiment, giving organizations a clearer read on how each event actually went.',
    icon: ClipboardCheck,
  },
]

const steps = [
  {
    title: 'Register your account',
    description:
      'Sign up as a volunteer or as an organization — each gets a purpose-built dashboard.',
  },
  {
    title: 'Post or discover events',
    description:
      'Organizations publish opportunities; volunteers browse them by category and open/closed status.',
  },
  {
    title: 'Register and participate',
    description:
      'Volunteers register for open events; organizations review and manage who takes part.',
  },
  {
    title: 'Track and get recognized',
    description:
      'Hours, feedback, and performance feed into certificates and the community leaderboard.',
  },
]

export default function About() {
  return (
    <div className="page-shell">
      <main>
        {/* HERO */}
        <section className="relative isolate overflow-hidden bg-[#F8FAFC] dark:bg-[#0B0F19]">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 -z-10 bg-hero-gradient opacity-[0.06] dark:opacity-[0.14]"
          />

          <div className="section-container pb-14 pt-16 sm:pb-16 sm:pt-20">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="max-w-2xl"
            >
              <span className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/5 px-4 py-1.5 text-xs font-semibold uppercase tracking-wide text-primary dark:border-white/10 dark:bg-white/5 dark:text-white">
                <Sparkles size={14} />
                About VolunteerConnect
              </span>

              <h1 className="mt-5 text-3xl font-extrabold tracking-tight text-primary sm:text-4xl lg:text-5xl dark:text-white">
                Connect. Contribute. Grow.
              </h1>

              <p className="mt-4 text-base leading-relaxed text-slate-600 sm:text-lg dark:text-slate-300">
                VolunteerConnect brings volunteers and organizations onto one
                platform — to discover meaningful opportunities, manage
                events, track contributions, and recognize impact.
              </p>
            </motion.div>
          </div>
        </section>

        {/* ROLES */}
        <section className="section-padding pt-4">
          <div className="section-container">
            <div className="mb-10 max-w-2xl">
              <h2 className="text-2xl font-extrabold text-primary sm:text-3xl dark:text-white">
                Built around three roles
              </h2>
              <p className="mt-3 text-slate-600 dark:text-slate-300">
                Every account on the platform fits one of these, each with its
                own dashboard and set of tools.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              {roles.map((role, index) => {
                const Icon = role.icon

                return (
                  <motion.div
                    key={role.title}
                    initial={{ opacity: 0, y: 18 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: '-40px' }}
                    transition={{ duration: 0.4, delay: index * 0.08 }}
                    className="premium-card p-7"
                  >
                    <span className="grid h-12 w-12 place-items-center rounded-2xl bg-primary/10 text-primary dark:bg-white/10 dark:text-white">
                      <Icon size={22} />
                    </span>

                    <h3 className="mt-5 text-lg font-bold text-primary dark:text-white">
                      {role.title}
                    </h3>

                    <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                      {role.description}
                    </p>
                  </motion.div>
                )
              })}
            </div>
          </div>
        </section>

        {/* CAPABILITIES */}
        <section className="section-padding bg-white pt-4 dark:bg-slate-950/40">
          <div className="section-container">
            <div className="mb-10 max-w-2xl">
              <h2 className="text-2xl font-extrabold text-primary sm:text-3xl dark:text-white">
                What the platform actually does
              </h2>
              <p className="mt-3 text-slate-600 dark:text-slate-300">
                A quick look at the tools available once you're signed in.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {capabilities.map((item, index) => {
                const Icon = item.icon

                return (
                  <motion.div
                    key={item.title}
                    initial={{ opacity: 0, y: 18 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: '-40px' }}
                    transition={{ duration: 0.4, delay: (index % 3) * 0.08 }}
                    className="premium-card p-6"
                  >
                    <span className="grid h-11 w-11 place-items-center rounded-2xl bg-primary/10 text-primary dark:bg-white/10 dark:text-white">
                      <Icon size={19} />
                    </span>

                    <h3 className="mt-4 text-base font-bold text-primary dark:text-white">
                      {item.title}
                    </h3>

                    <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                      {item.description}
                    </p>
                  </motion.div>
                )
              })}
            </div>
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section className="section-padding pt-4">
          <div className="section-container">
            <div className="mb-10 max-w-2xl">
              <h2 className="text-2xl font-extrabold text-primary sm:text-3xl dark:text-white">
                How it works
              </h2>
              <p className="mt-3 text-slate-600 dark:text-slate-300">
                From sign-up to recognition, the flow stays the same for
                everyone.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {steps.map((step, index) => (
                <motion.div
                  key={step.title}
                  initial={{ opacity: 0, y: 18 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-40px' }}
                  transition={{ duration: 0.4, delay: index * 0.08 }}
                  className="premium-card relative overflow-hidden p-6"
                >
                  <span className="text-3xl font-extrabold text-primary/10 dark:text-white/10">
                    {String(index + 1).padStart(2, '0')}
                  </span>

                  <h3 className="mt-1 text-base font-bold text-primary dark:text-white">
                    {step.title}
                  </h3>

                  <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                    {step.description}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="section-padding pt-4">
          <div className="section-container">
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.5 }}
              className="relative overflow-hidden rounded-3xl bg-hero-gradient px-8 py-14 text-center shadow-elevated sm:px-14"
            >
              <CalendarCheck
                size={30}
                className="mx-auto text-white/80"
              />

              <h2 className="mt-4 text-2xl font-extrabold text-white sm:text-3xl">
                Ready to get involved?
              </h2>

              <p className="mx-auto mt-3 max-w-xl text-white/80">
                Explore open events by category, or create an account to
                start registering, tracking, and getting recognized for your
                contribution.
              </p>

              <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
                <Link
                  to="/events"
                  className="inline-flex items-center gap-2 rounded-2xl bg-white px-6 py-3.5 font-semibold text-primary shadow-lg transition hover:-translate-y-0.5"
                >
                  <ListChecks size={17} />
                  Browse events
                </Link>

                <Link
                  to="/register"
                  className="inline-flex items-center gap-2 rounded-2xl border border-white/30 px-6 py-3.5 font-semibold text-white transition hover:-translate-y-0.5 hover:bg-white/10"
                >
                  Create an account
                </Link>
              </div>
            </motion.div>
          </div>
        </section>
      </main>
    </div>
  )
}