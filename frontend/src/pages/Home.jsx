import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import API from '../api'

const testimonials = [
  { avatar: '👨‍💻', text: 'Found the perfect teaching event matching my Python skills. The AI matching is incredible — it felt like it knew exactly what I was looking for.', name: 'Arjun Sharma', role: 'Software Volunteer · Chennai' },
  { avatar: '👩‍⚕️', text: 'Earned 3 certificates in 2 months. This platform made volunteering so organized and rewarding. My profile now stands out on LinkedIn!', name: 'Priya Nair', role: 'Healthcare Volunteer · Chennai' },
  { avatar: '🌱', text: 'Found 20 qualified volunteers for our plantation drive within hours. The verification system gives us complete confidence in who we recruit.', name: 'Green Earth Foundation', role: 'Verified Organization · Chennai' },
]

const features = [
  { icon: '🤖', title: 'AI Volunteer Matching', desc: 'Smart algorithm matches you to events using skills, location, availability, and past performance — not just keywords.', bg: 'bg-blue-50' },
  { icon: '🏆', title: 'Auto Certificates', desc: 'Verified PDF certificates generated automatically after every event. Share on LinkedIn in one click.', bg: 'bg-yellow-50' },
  { icon: '📊', title: 'Performance Score', desc: 'AI calculates your volunteer score from attendance, feedback, task completion, and punctuality.', bg: 'bg-green-50' },
  { icon: '💬', title: 'AI Chatbot', desc: 'Ask anything — available events, your hours, certificates. Instant answers in English, Tamil, or Hindi.', bg: 'bg-purple-50' },
  { icon: '🔔', title: 'Live Notifications', desc: 'Real-time updates on approvals, new events matching your skills, and certificate generation.', bg: 'bg-orange-50' },
  { icon: '🏅', title: 'Leaderboard & Badges', desc: 'Earn Gold, Silver, Bronze badges. Climb the leaderboard and build your volunteering reputation.', bg: 'bg-emerald-50' },
]

const steps = [
  { icon: '📝', num: '1', title: 'Create account', desc: 'Register as volunteer or organization in 2 minutes', color: 'bg-gray-900', bg: 'bg-gray-50' },
  { icon: '🤖', num: '2', title: 'AI matches you', desc: 'Our AI finds events that perfectly match your skills', color: 'bg-blue-500', bg: 'bg-blue-50' },
  { icon: '🤝', num: '3', title: 'Contribute', desc: 'Register for events and make a real difference', color: 'bg-green-500', bg: 'bg-green-50' },
  { icon: '🏆', num: '4', title: 'Earn recognition', desc: 'Get certificates, badges, and build your profile', color: 'bg-amber-500', bg: 'bg-amber-50' },
]

const categoryStyles = {
  education: { bg: 'bg-blue-100', text: 'text-blue-700', btn: 'bg-blue-500 hover:bg-blue-600', bar: 'from-blue-500 to-purple-500' },
  health: { bg: 'bg-amber-100', text: 'text-amber-700', btn: 'bg-amber-500 hover:bg-amber-600', bar: 'from-amber-400 to-red-400' },
  environment: { bg: 'bg-green-100', text: 'text-green-700', btn: 'bg-green-500 hover:bg-green-600', bar: 'from-green-400 to-teal-400' },
  community: { bg: 'bg-teal-100', text: 'text-teal-700', btn: 'bg-teal-500 hover:bg-teal-600', bar: 'from-teal-400 to-cyan-400' },
  other: { bg: 'bg-gray-100', text: 'text-gray-700', btn: 'bg-gray-500 hover:bg-gray-600', bar: 'from-gray-400 to-gray-500' },
}

export default function Home() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [events, setEvents] = useState([])
  const [currentT, setCurrentT] = useState(0)

  useEffect(() => {
    fetchEvents()
    const timer = setInterval(() => setCurrentT(p => (p + 1) % testimonials.length), 3500)
    return () => clearInterval(timer)
  }, [])

  const fetchEvents = async () => {
    try {
      const res = await API.get('/events?limit=3')
      setEvents(res.data.events || res.data || [])
    } catch (err) {
      console.error(err)
    }
  }

  const handleDashboard = () => {
    if (!user) return navigate('/register')
    if (user.role === 'volunteer') navigate('/volunteer/dashboard')
    else if (user.role === 'org') navigate('/org/dashboard')
    else navigate('/admin/dashboard')
  }

  const t = testimonials[currentT]

  return (
    <div className="min-h-screen bg-white">

      {/* ── Hero ── */}
      <section className="relative bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 min-h-screen flex flex-col items-center justify-center px-6 py-24 overflow-hidden text-center">
        {/* Orbs */}
        <div className="absolute top-[-80px] left-[-80px] w-96 h-96 bg-blue-500 rounded-full opacity-10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-[-60px] right-[-60px] w-80 h-80 bg-purple-500 rounded-full opacity-10 blur-3xl pointer-events-none" />
        <div className="absolute top-1/2 left-2/3 w-56 h-56 bg-cyan-400 rounded-full opacity-10 blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-4xl mx-auto">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-blue-500/20 border border-blue-400/30 text-blue-300 px-4 py-2 rounded-full text-sm font-medium mb-8">
            <span>🤖</span> AI-Powered Volunteer Management
          </div>

          <h1 className="text-6xl md:text-8xl font-black text-white leading-none tracking-tight mb-4">
            Connect.<br />Volunteer.<br />
            <span className="bg-gradient-to-r from-yellow-300 to-amber-400 bg-clip-text text-transparent">
              Make Impact.
            </span>
          </h1>

          <p className="text-lg text-slate-400 max-w-xl mx-auto leading-relaxed mb-10">
            India's smartest volunteering platform. AI matches you with perfect opportunities based on your skills, location, and availability.
          </p>

          <div className="flex flex-wrap gap-3 justify-center mb-12">
            <button
              onClick={handleDashboard}
              className="bg-blue-500 hover:bg-blue-600 text-white px-8 py-4 rounded-2xl text-base font-bold transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-blue-500/30"
            >
              {user ? 'Go to Dashboard →' : 'Start Volunteering Free →'}
            </button>
            {!user && (
              <Link
                to="/login"
                className="bg-white/10 hover:bg-white/20 border border-white/20 text-white px-8 py-4 rounded-2xl text-base font-semibold transition-all"
              >
                Login to Account
              </Link>
            )}
          </div>

          <div className="flex flex-wrap gap-3 justify-center">
            {['✅ Free to join', '🤖 AI-powered matching', '🏆 Earn certificates', '📊 Track your impact'].map(c => (
              <span key={c} className="bg-white/5 border border-white/10 text-slate-300 px-4 py-2 rounded-full text-sm">{c}</span>
            ))}
          </div>
        </div>
      </section>

      {/* ── Stats ── */}
      <section className="bg-slate-50 py-16 px-6">
        <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-5 gap-4">
          {[
            { num: '10K+', label: '👥 Volunteers' },
            { num: '500+', label: '🏢 Organizations' },
            { num: '2K+', label: '📅 Events Done' },
            { num: '50K+', label: '⏱️ Hours Donated' },
            { num: '98%', label: '⭐ Satisfaction' },
          ].map(s => (
            <div key={s.label} className="bg-white border border-slate-200 rounded-2xl p-5 text-center hover:border-blue-400 hover:-translate-y-1 transition-all hover:shadow-lg hover:shadow-blue-100 group">
              <div className="text-3xl font-black text-blue-600 group-hover:scale-110 transition-transform">{s.num}</div>
              <div className="text-slate-500 text-sm mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Live Events ── */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-2 mb-2">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="bg-green-50 text-green-700 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide">Live Opportunities</span>
          </div>
          <h2 className="text-4xl font-black text-slate-900 tracking-tight mb-2">Events Happening Now</h2>
          <p className="text-slate-500 mb-10">Real events posted by verified organizations across India</p>

          {events.length === 0 ? (
            <div className="text-center py-20 bg-slate-50 rounded-3xl border border-slate-200">
              <p className="text-5xl mb-4">📅</p>
              <p className="text-slate-500 font-medium">Events will appear here once organizations post them</p>
              {!user && (
                <Link to="/register" className="mt-4 inline-block bg-blue-500 text-white px-6 py-3 rounded-xl text-sm font-bold hover:bg-blue-600 transition">
                  Register to See Events
                </Link>
              )}
            </div>
          ) : (
            <div className="grid md:grid-cols-3 gap-6">
              {events.map(event => {
                const style = categoryStyles[event.category] || categoryStyles.other
                const pct = Math.min(100, Math.round((event.registeredVolunteers?.length / event.volunteersNeeded) * 100))
                return (
                  <div key={event._id} className="bg-white border-2 border-slate-100 rounded-3xl p-6 hover:border-blue-400 hover:-translate-y-2 transition-all hover:shadow-2xl hover:shadow-blue-100 group relative overflow-hidden">
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r opacity-0 group-hover:opacity-100 transition-opacity" style={{ backgroundImage: 'linear-gradient(to right, #3b82f6, #8b5cf6)' }} />
                    <div className="flex justify-between items-start mb-3">
                      <span className={`${style.bg} ${style.text} text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide`}>
                        {event.category}
                      </span>
                      <span className="text-xs text-slate-400">{event.registeredVolunteers?.length}/{event.volunteersNeeded} joined</span>
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 mb-2 leading-snug">{event.title}</h3>
                    <p className="text-slate-500 text-sm mb-4 leading-relaxed line-clamp-2">{event.description}</p>
                    <div className="space-y-1 mb-4 text-xs text-slate-400">
                      <div>🏢 {event.orgName}</div>
                      <div>📍 {event.location} · 📅 {new Date(event.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
                      <div>⏱️ {event.duration}</div>
                    </div>
                    <div className="flex flex-wrap gap-1 mb-4">
                      {event.skillsRequired?.slice(0, 3).map(s => (
                        <span key={s} className="bg-slate-100 text-slate-600 text-xs px-2 py-0.5 rounded-full">{s}</span>
                      ))}
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-1.5 mb-1">
                      <div className={`h-1.5 rounded-full bg-gradient-to-r ${style.bar} transition-all`} style={{ width: `${pct}%` }} />
                    </div>
                    <div className="flex justify-between items-center mt-3">
                      <span className="text-xs text-slate-400">{pct}% filled</span>
                      <button
                        onClick={() => user ? navigate('/volunteer/dashboard') : navigate('/login')}
                        className={`${style.btn} text-white px-4 py-2 rounded-xl text-xs font-bold transition-all`}
                      >
                        {user ? 'Register Now' : 'Login to Join'}
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          <div className="text-center mt-10">
            <button onClick={handleDashboard} className="bg-blue-500 hover:bg-blue-600 text-white px-8 py-3 rounded-xl font-bold transition-all hover:-translate-y-0.5">
              {user ? 'View All Events →' : 'Join to See All Events →'}
            </button>
          </div>
        </div>
      </section>

      {/* ── How It Works ── */}
      <section className="bg-white py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <span className="bg-blue-50 text-blue-600 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide">Simple Process</span>
            <h2 className="text-4xl font-black text-slate-900 tracking-tight mt-4">Get started in 4 steps</h2>
          </div>
          <div className="grid md:grid-cols-4 gap-6">
            {steps.map((s, i) => (
              <div key={s.num} className={`${s.bg} rounded-2xl p-6 text-center hover:-translate-y-1 transition-all`}>
                <div className="text-4xl mb-3">{s.icon}</div>
                <div className={`w-9 h-9 ${s.color} text-white rounded-full flex items-center justify-center font-black text-sm mx-auto mb-3`}>{s.num}</div>
                <h3 className="font-bold text-slate-900 mb-2">{s.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="bg-slate-50 py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <span className="bg-purple-50 text-purple-700 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide">Why VolunteerConnect</span>
            <h2 className="text-4xl font-black text-slate-900 tracking-tight mt-4">Packed with smart features</h2>
            <p className="text-slate-500 mt-2">Everything you need for meaningful volunteering</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {features.map(f => (
              <div key={f.title} className="bg-white border-2 border-slate-100 rounded-2xl p-7 hover:border-purple-300 hover:-translate-y-1 transition-all hover:shadow-xl hover:shadow-purple-50 group">
                <div className={`w-14 h-14 ${f.bg} rounded-2xl flex items-center justify-center text-3xl mb-5 group-hover:scale-110 transition-transform`}>{f.icon}</div>
                <h3 className="font-bold text-slate-900 text-lg mb-2">{f.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section className="bg-gradient-to-br from-slate-900 to-blue-950 py-20 px-6">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-4xl font-black text-white mb-12 tracking-tight">What people say</h2>
          <div className="bg-white/8 border border-white/10 rounded-3xl p-10">
            <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center text-4xl mx-auto mb-5">{t.avatar}</div>
            <p className="text-slate-300 text-lg leading-relaxed italic mb-6">"{t.text}"</p>
            <p className="text-white font-bold">{t.name}</p>
            <p className="text-slate-400 text-sm mt-1">{t.role}</p>
          </div>
          <div className="flex justify-center gap-2 mt-6">
            {testimonials.map((_, i) => (
              <button key={i} onClick={() => setCurrentT(i)}
                className={`h-2 rounded-full transition-all border-0 ${i === currentT ? 'bg-yellow-400 w-6' : 'bg-white/20 w-2'}`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-24 px-6 text-center bg-white">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-5xl font-black text-slate-900 tracking-tight mb-4">Ready to make a<br />difference?</h2>
          <p className="text-slate-500 text-xl mb-10">Join thousands of volunteers and organizations already on VolunteerConnect</p>
          <div className="flex flex-wrap gap-4 justify-center">
            {user ? (
              <button onClick={handleDashboard} className="bg-blue-500 hover:bg-blue-600 text-white px-10 py-4 rounded-2xl text-lg font-black transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-blue-200">
                Go to Dashboard →
              </button>
            ) : (
              <>
                <Link to="/register" className="bg-blue-500 hover:bg-blue-600 text-white px-10 py-4 rounded-2xl text-lg font-black transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-blue-200">
                  Join as Volunteer →
                </Link>
                <Link to="/register" className="bg-emerald-500 hover:bg-emerald-600 text-white px-10 py-4 rounded-2xl text-lg font-black transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-emerald-200">
                  Register Organization →
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="bg-slate-900 py-12 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div>
            <p className="text-white font-black text-xl">🤝 VolunteerConnect AI</p>
            <p className="text-slate-500 text-sm mt-1">Smart Volunteer Management Platform</p>
          </div>
          <div className="flex gap-8">
            {[['/', 'Home'], ['/register', 'Register'], ['/login', 'Login']].map(([to, label]) => (
              <Link key={to} to={to} className="text-slate-400 hover:text-white text-sm transition-colors">{label}</Link>
            ))}
          </div>
          <p className="text-slate-600 text-sm">© 2026 VolunteerConnect AI. All rights reserved.</p>
        </div>
      </footer>

    </div>
  )
}