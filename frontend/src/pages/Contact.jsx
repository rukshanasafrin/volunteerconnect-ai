import { useState } from 'react'
import { motion } from 'framer-motion'

import {
  CheckCircle2,
  Mail,
  MessageCircle,
  Send,
  Sparkles,
  Users,
} from 'lucide-react'

// -------------------------------------------------------------------------
// NOTE: There is no backend "contact" endpoint in this project yet, so this
// form composes an email via mailto: rather than pretending to submit to a
// server. Replace SUPPORT_EMAIL below with your real support address, and
// swap this out for a real API.post('/contact', ...) call once a backend
// route exists.
// -------------------------------------------------------------------------

const SUPPORT_EMAIL = 'support@volunteerconnect.app'

const topics = [
  {
    title: 'General questions',
    description: 'Anything about how the platform works.',
    icon: MessageCircle,
  },
  {
    title: 'Organizations',
    description: 'Posting events or managing volunteers.',
    icon: Users,
  },
  {
    title: 'Something else',
    description: "Feedback, issues, or anything that doesn't fit above.",
    icon: Sparkles,
  },
]

export default function Contact() {
  const [form, setForm] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  })

  const [errors, setErrors] = useState({})
  const [submitted, setSubmitted] = useState(false)

  const handleChange = (field) => (event) => {
    setForm((prev) => ({ ...prev, [field]: event.target.value }))
    setErrors((prev) => ({ ...prev, [field]: '' }))
  }

  const validate = () => {
    const nextErrors = {}

    if (!form.name.trim()) nextErrors.name = 'Please enter your name.'
    if (!form.email.trim()) {
      nextErrors.email = 'Please enter your email.'
    } else if (!/^\S+@\S+\.\S+$/.test(form.email)) {
      nextErrors.email = 'Please enter a valid email address.'
    }
    if (!form.subject.trim()) nextErrors.subject = 'Please add a subject.'
    if (!form.message.trim() || form.message.trim().length < 10) {
      nextErrors.message = 'Message should be at least 10 characters.'
    }

    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    if (!validate()) return

    const body = `${form.message}\n\n— ${form.name} (${form.email})`

    const mailtoUrl =
      `mailto:${SUPPORT_EMAIL}` +
      `?subject=${encodeURIComponent(form.subject)}` +
      `&body=${encodeURIComponent(body)}`

    window.location.href = mailtoUrl
    setSubmitted(true)
  }

  const handleSendAnother = () => {
    setForm({ name: '', email: '', subject: '', message: '' })
    setErrors({})
    setSubmitted(false)
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
                <Mail size={14} />
                Get in touch
              </span>

              <h1 className="mt-5 text-3xl font-extrabold tracking-tight text-primary sm:text-4xl lg:text-5xl dark:text-white">
                We'd like to hear from you
              </h1>

              <p className="mt-4 text-base leading-relaxed text-slate-600 sm:text-lg dark:text-slate-300">
                Questions about volunteering, posting events, or the platform
                in general — send a message and we'll get back to you.
              </p>
            </motion.div>
          </div>
        </section>

        {/* FORM + INFO */}
        <section className="section-padding pt-4">
          <div className="section-container grid grid-cols-1 gap-8 lg:grid-cols-5">
            {/* Form */}
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.5 }}
              className="premium-card p-7 lg:col-span-3 sm:p-9"
            >
              {submitted ? (
                <div className="flex flex-col items-center justify-center gap-4 py-10 text-center">
                  <span className="grid h-14 w-14 place-items-center rounded-2xl bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-300">
                    <CheckCircle2 size={26} />
                  </span>

                  <div>
                    <p className="text-lg font-bold text-primary dark:text-white">
                      Your email app should be open now
                    </p>
                    <p className="mt-1 max-w-sm text-sm text-slate-500 dark:text-slate-400">
                      Finish sending from there and we'll get back to you.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleSendAnother}
                    className="secondary-button"
                  >
                    Send another message
                  </button>
                </div>
              ) : (
                <form
                  onSubmit={handleSubmit}
                  noValidate
                  className="space-y-5"
                >
                  <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                    <div>
                      <label
                        htmlFor="name"
                        className="mb-1.5 block text-sm font-semibold text-slate-700 dark:text-slate-200"
                      >
                        Your name
                      </label>
                      <input
                        id="name"
                        type="text"
                        value={form.name}
                        onChange={handleChange('name')}
                        placeholder="Jordan Lee"
                        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-800 outline-none transition focus:border-primary/40 focus:ring-4 focus:ring-primary/10 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                      />
                      {errors.name && (
                        <p className="mt-1.5 text-xs font-semibold text-rose-500">
                          {errors.name}
                        </p>
                      )}
                    </div>

                    <div>
                      <label
                        htmlFor="email"
                        className="mb-1.5 block text-sm font-semibold text-slate-700 dark:text-slate-200"
                      >
                        Your email
                      </label>
                      <input
                        id="email"
                        type="email"
                        value={form.email}
                        onChange={handleChange('email')}
                        placeholder="you@example.com"
                        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-800 outline-none transition focus:border-primary/40 focus:ring-4 focus:ring-primary/10 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                      />
                      {errors.email && (
                        <p className="mt-1.5 text-xs font-semibold text-rose-500">
                          {errors.email}
                        </p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="subject"
                      className="mb-1.5 block text-sm font-semibold text-slate-700 dark:text-slate-200"
                    >
                      Subject
                    </label>
                    <input
                      id="subject"
                      type="text"
                      value={form.subject}
                      onChange={handleChange('subject')}
                      placeholder="What's this about?"
                      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-800 outline-none transition focus:border-primary/40 focus:ring-4 focus:ring-primary/10 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                    />
                    {errors.subject && (
                      <p className="mt-1.5 text-xs font-semibold text-rose-500">
                        {errors.subject}
                      </p>
                    )}
                  </div>

                  <div>
                    <label
                      htmlFor="message"
                      className="mb-1.5 block text-sm font-semibold text-slate-700 dark:text-slate-200"
                    >
                      Message
                    </label>
                    <textarea
                      id="message"
                      rows={5}
                      value={form.message}
                      onChange={handleChange('message')}
                      placeholder="Tell us a bit more..."
                      className="w-full resize-none rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-800 outline-none transition focus:border-primary/40 focus:ring-4 focus:ring-primary/10 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                    />
                    {errors.message && (
                      <p className="mt-1.5 text-xs font-semibold text-rose-500">
                        {errors.message}
                      </p>
                    )}
                  </div>

                  <button
                    type="submit"
                    className="primary-button w-full sm:w-auto"
                  >
                    <Send size={16} />
                    Send message
                  </button>
                </form>
              )}
            </motion.div>

            {/* Info panel */}
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="lg:col-span-2 space-y-6"
            >
              <div className="premium-card p-7">
                <span className="grid h-11 w-11 place-items-center rounded-2xl bg-primary/10 text-primary dark:bg-white/10 dark:text-white">
                  <Mail size={19} />
                </span>

                <h3 className="mt-4 text-base font-bold text-primary dark:text-white">
                  Email us directly
                </h3>

                <a
                  href={`mailto:${SUPPORT_EMAIL}`}
                  className="mt-1.5 block break-all text-sm font-semibold text-secondary hover:underline dark:text-accent"
                >
                  {SUPPORT_EMAIL}
                </a>

                <p className="mt-2 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
                  Building stronger communities together — reach out any time.
                </p>
              </div>

              <div className="premium-card p-7">
                <h3 className="text-base font-bold text-primary dark:text-white">
                  What can we help with?
                </h3>

                <div className="mt-4 space-y-4">
                  {topics.map((topic) => {
                    const Icon = topic.icon

                    return (
                      <div
                        key={topic.title}
                        className="flex items-start gap-3"
                      >
                        <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-300">
                          <Icon size={16} />
                        </span>
                        <div>
                          <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                            {topic.title}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            {topic.description}
                          </p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </motion.div>
          </div>
        </section>
      </main>
    </div>
  )
}