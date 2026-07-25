import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import API from '../api'

const SORT_OPTIONS = [
  { key: 'performanceScore', label: 'Overall Score' },
  { key: 'hoursCompleted', label: 'Most Hours' },
  { key: 'eventsAttended', label: 'Most Events' },
]

const RANK_STYLES = {
  1: 'bg-yellow-50 border-yellow-300',
  2: 'bg-gray-50 border-gray-300',
  3: 'bg-orange-50 border-orange-300',
}
const RANK_MEDAL = { 1: '🥇', 2: '🥈', 3: '🥉' }

export default function Leaderboard() {
  const { user } = useAuth()
  const [sortBy, setSortBy] = useState('performanceScore')
  const [leaderboard, setLeaderboard] = useState([])
  const [loading, setLoading] = useState(true)
  const [myRank, setMyRank] = useState(null)

  useEffect(() => {
    setLoading(true)
    API.get(`/leaderboard?sortBy=${sortBy}`)
      .then(res => setLeaderboard(res.data.leaderboard))
      .catch(() => setLeaderboard([]))
      .finally(() => setLoading(false))
  }, [sortBy])

  useEffect(() => {
    if (user?.role === 'volunteer') {
      API.get('/leaderboard/my-rank').then(res => setMyRank(res.data)).catch(() => {})
    }
  }, [user])

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">🏆 Volunteer Leaderboard</h1>
          <p className="text-gray-500 mt-1">Real stats, AI-labeled — every badge is grounded in actual contributions.</p>
        </div>

        {myRank && (
          <div className="bg-primary text-white rounded-2xl p-5 mb-6 flex items-center justify-between flex-wrap gap-3">
            <div>
              <p className="text-sm text-blue-100">Your rank</p>
              <p className="text-2xl font-bold">#{myRank.rank} <span className="text-sm font-normal text-blue-100">of {myRank.totalVolunteers}</span></p>
            </div>
            <div className="text-right">
              <p className="text-sm text-blue-100">Top {100 - myRank.percentile <= 0 ? 1 : 100 - myRank.percentile}%</p>
              {myRank.pointsToNextRank > 0 ? (
                <p className="text-xs text-blue-100">{myRank.pointsToNextRank} points to climb a rank</p>
              ) : (
                <p className="text-xs text-blue-100">You're at the top! 🎉</p>
              )}
            </div>
          </div>
        )}

        <div className="flex gap-2 mb-5 justify-center flex-wrap">
          {SORT_OPTIONS.map(opt => (
            <button
              key={opt.key}
              onClick={() => setSortBy(opt.key)}
              className={`px-4 py-1.5 rounded-full text-sm font-semibold transition ${
                sortBy === opt.key ? 'bg-primary text-white' : 'bg-white text-gray-600 border border-gray-200 hover:border-primary'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {loading && <p className="text-center text-gray-400 py-10">Loading leaderboard...</p>}

        {!loading && leaderboard.length === 0 && (
          <p className="text-center text-gray-400 py-10">No volunteers to rank yet — be the first!</p>
        )}

        <div className="space-y-2">
          {leaderboard.map(v => (
            <div
              key={v._id}
              className={`flex items-center gap-4 p-4 rounded-xl border ${RANK_STYLES[v.rank] || 'bg-white border-gray-200'}`}
            >
              <div className="w-10 text-center font-bold text-gray-500 text-lg">
                {RANK_MEDAL[v.rank] || `#${v.rank}`}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-800 truncate">{v.name}</p>
                <p className="text-xs text-gray-400">{v.location}</p>
              </div>
              {v.badge && (
                <span className="text-xs font-semibold text-primary bg-blue-50 px-2.5 py-1 rounded-full whitespace-nowrap">
                  {v.badge}
                </span>
              )}
              <div className="text-right w-24 shrink-0">
                <p className="font-bold text-gray-800">
                  {sortBy === 'hoursCompleted' ? v.hoursCompleted : sortBy === 'eventsAttended' ? v.eventsAttended : v.performanceScore}
                  {sortBy === 'performanceScore' && <span className="text-xs text-gray-400">/100</span>}
                </p>
                <p className="text-xs text-gray-400">
                  {sortBy === 'hoursCompleted' ? 'hours' : sortBy === 'eventsAttended' ? 'events' : 'score'}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}