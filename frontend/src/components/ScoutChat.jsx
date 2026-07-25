import { useState, useRef, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import API from '../api'

// -------- Small inline icons (no icon library in this project's deps) --------
const CompassIcon = ({ className }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className}>
    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.6" />
    <path d="M15.5 8.5L13 13l-4.5 2.5L11 11l4.5-2.5z" fill="currentColor" />
  </svg>
)
const SendIcon = ({ className }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className}>
    <path d="M4 12L20 4L13 20L11 13L4 12Z" fill="currentColor" />
  </svg>
)
const CloseIcon = ({ className }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className}>
    <path d="M6 6L18 18M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
)

const SUGGESTIONS = {
  guest: ['What events are open right now?', 'How does the matching work?'],
  volunteer: ['What events match me best?', 'What skill should I learn next?', "How's my performance score?"],
  org: ['Show my events', 'Recommend volunteers for an event', 'Build a dream team for an event'],
  admin: ['Give me a platform overview', 'Which orgs are pending verification?'],
}

const roleLabel = (role) => {
  if (role === 'volunteer') return 'volunteer guide'
  if (role === 'org') return 'org co-pilot'
  if (role === 'admin') return 'admin console'
  return 'volunteering guide'
}

function EventCard({ card }) {
  return (
    <div className="border border-gray-200 rounded-xl p-3 bg-white hover:shadow-sm transition">
      <div className="flex items-start justify-between gap-2">
        <p className="font-semibold text-gray-800 text-sm leading-snug">{card.title}</p>
        {typeof card.matchScore === 'number' && (
          <span className="text-xs font-bold text-secondary bg-green-50 px-2 py-0.5 rounded-full whitespace-nowrap">
            {card.matchScore}% match
          </span>
        )}
      </div>
      <p className="text-xs text-gray-500 mt-1 capitalize">{card.category} • {card.location}</p>
      {card.date && (
        <p className="text-xs text-gray-500">{new Date(card.date).toLocaleDateString()}</p>
      )}
      {card.orgName && <p className="text-xs text-gray-400 mt-1">by {card.orgName}</p>}
      {typeof card.spotsLeft === 'number' && (
        <p className="text-xs text-primary font-medium mt-1">{card.spotsLeft} spot{card.spotsLeft === 1 ? '' : 's'} left</p>
      )}
    </div>
  )
}

function VolunteerCard({ card }) {
  return (
    <div className="border border-gray-200 rounded-xl p-3 bg-white hover:shadow-sm transition">
      <div className="flex items-start justify-between gap-2">
        <p className="font-semibold text-gray-800 text-sm">{card.name}</p>
        {typeof card.matchScore === 'number' && (
          <span className="text-xs font-bold text-secondary bg-green-50 px-2 py-0.5 rounded-full whitespace-nowrap">
            {card.matchScore}% match
          </span>
        )}
      </div>
      {card.location && <p className="text-xs text-gray-500 mt-1">{card.location}</p>}
      {(card.contributesSkills || card.skills)?.length > 0 && (
        <p className="text-xs text-gray-400 mt-1">Skills: {(card.contributesSkills || card.skills).join(', ')}</p>
      )}
    </div>
  )
}

function GenericCard({ card }) {
  return (
    <div className="border border-gray-200 rounded-xl p-3 bg-white text-xs text-gray-600">
      {card.title || card.orgName || card.name}
      {card.status && <span className="ml-2 capitalize text-gray-400">({card.status})</span>}
    </div>
  )
}

function Card({ card }) {
  if (card.type === 'event') return <EventCard card={card} />
  if (card.type === 'volunteer') return <VolunteerCard card={card} />
  return <GenericCard card={card} />
}

export default function ScoutChat() {
  const { user } = useAuth()
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const scrollRef = useRef(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, loading, open])

  const send = async (text) => {
    const content = (text ?? input).trim()
    if (!content || loading) return

    const history = messages.map(m => ({ role: m.role, content: m.content }))
    setMessages(prev => [...prev, { role: 'user', content }])
    setInput('')
    setLoading(true)

    try {
      const res = await API.post('/chat', { message: content, history })
      setMessages(prev => [...prev, { role: 'assistant', content: res.data.reply, cards: res.data.cards || [] }])
    } catch (err) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: err.response?.data?.message || "Scout couldn't reach the server just now — please try again in a moment.",
        cards: [],
      }])
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      send()
    }
  }

  const suggestions = SUGGESTIONS[user?.role] || SUGGESTIONS.guest

  return (
    <>
      {/* Floating toggle */}
      <button
        onClick={() => setOpen(o => !o)}
        aria-label={open ? 'Close Scout chat' : 'Open Scout chat'}
        className="fixed bottom-5 right-5 z-50 w-14 h-14 rounded-full bg-primary text-white shadow-lg hover:bg-blue-700 hover:scale-105 transition flex items-center justify-center"
      >
        {open ? <CloseIcon className="w-6 h-6" /> : <CompassIcon className="w-7 h-7 animate-pulse-slow" />}
      </button>

      {open && (
        <div className="fixed bottom-24 right-5 z-50 w-[22rem] max-w-[calc(100vw-2.5rem)] h-[32rem] max-h-[calc(100vh-8rem)] bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="bg-primary text-white px-4 py-3 flex items-center gap-2">
            <CompassIcon className="w-5 h-5" />
            <div className="flex-1">
              <p className="font-bold text-sm leading-none">Scout</p>
              <p className="text-xs text-blue-100 capitalize">{roleLabel(user?.role)}</p>
            </div>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-3 space-y-3 bg-gray-50">
            {messages.length === 0 && (
              <div className="text-center text-gray-400 text-sm mt-6 px-2">
                <CompassIcon className="w-8 h-8 mx-auto mb-2 text-primary/40" />
                Hey{user?.name ? `, ${user.name.split(' ')[0]}` : ''} — I'm Scout. Ask me about events, matches, or your stats, and I'll pull the real numbers.
              </div>
            )}

            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] ${m.role === 'user' ? '' : 'w-full'}`}>
                  <div
                    className={`rounded-2xl px-3 py-2 text-sm whitespace-pre-wrap ${
                      m.role === 'user'
                        ? 'bg-primary text-white rounded-br-sm'
                        : 'bg-white border border-gray-200 text-gray-700 rounded-bl-sm'
                    }`}
                  >
                    {m.content}
                  </div>
                  {m.cards?.length > 0 && (
                    <div className="mt-2 space-y-2">
                      {m.cards.map((c, ci) => <Card key={ci} card={c} />)}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-sm px-3 py-2 flex gap-1 items-center">
                  <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
                  <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
                  <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" />
                </div>
              </div>
            )}
          </div>

          {/* Suggestions (only before the conversation starts) */}
          {messages.length === 0 && (
            <div className="px-3 pb-2 flex flex-wrap gap-1.5">
              {suggestions.map((s, i) => (
                <button
                  key={i}
                  onClick={() => send(s)}
                  className="text-xs bg-blue-50 text-primary px-2.5 py-1.5 rounded-full hover:bg-blue-100 transition text-left"
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="border-t border-gray-200 p-2 flex items-end gap-2 bg-white">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask Scout anything..."
              rows={1}
              className="flex-1 resize-none text-sm px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/40 max-h-24"
            />
            <button
              onClick={() => send()}
              disabled={loading || !input.trim()}
              aria-label="Send message"
              className="w-9 h-9 shrink-0 rounded-full bg-primary text-white flex items-center justify-center disabled:opacity-40 hover:bg-blue-700 transition"
            >
              <SendIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </>
  )
}
