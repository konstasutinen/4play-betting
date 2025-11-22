'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import type { LeaderboardEntry } from '@/types/database.types'
import type { User } from '@supabase/supabase-js'

export default function LeaderboardPage() {
  const [user, setUser] = useState<User | null>(null)
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [sortBy, setSortBy] = useState<'wins' | 'win_rate'>('wins')
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth/login')
      } else {
        setUser(user)
      }
    }

    checkUser()
  }, [supabase.auth, router])

  useEffect(() => {
    const fetchLeaderboard = async () => {
      setLoading(true)

      const { data } = await supabase
        .from('leaderboard')
        .select('*')
        .order(sortBy, { ascending: false })
        .limit(100)

      setLeaderboard(data || [])
      setLoading(false)
    }

    if (user) {
      fetchLeaderboard()
    }
  }, [supabase, user, sortBy])

  const getRankEmoji = (rank: number) => {
    if (rank === 1) return '🥇'
    if (rank === 2) return '🥈'
    if (rank === 3) return '🥉'
    return `#${rank}`
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">
            Leaderboard
          </h1>
          <p className="text-slate-400">See how you stack up against other players</p>
        </div>

        {/* Sort Toggle */}
        <div className="flex space-x-2 mb-6">
          <button
            onClick={() => setSortBy('wins')}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              sortBy === 'wins'
                ? 'bg-purple-600 text-white'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            Most Wins
          </button>
          <button
            onClick={() => setSortBy('win_rate')}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              sortBy === 'win_rate'
                ? 'bg-purple-600 text-white'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            Best Win Rate
          </button>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
            <p className="text-slate-400 mt-4">Loading leaderboard...</p>
          </div>
        )}

        {/* No Data State */}
        {!loading && leaderboard.length === 0 && (
          <div className="text-center py-12 bg-slate-800/50 rounded-lg border border-slate-700">
            <p className="text-slate-400 text-lg">No data yet. Be the first to create a parlay!</p>
          </div>
        )}

        {/* Leaderboard Table */}
        {!loading && leaderboard.length > 0 && (
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg border border-slate-700 overflow-hidden">
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-900/50 border-b border-slate-700">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      Rank
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      Player
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      Total
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      Wins
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      Losses
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      Win Rate
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700">
                  {leaderboard.map((entry, index) => {
                    const isCurrentUser = entry.user_id === user?.id
                    return (
                      <tr
                        key={entry.user_id}
                        className={`${
                          isCurrentUser ? 'bg-purple-500/10' : 'hover:bg-slate-700/30'
                        } transition`}
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-lg font-bold text-white">
                            {getRankEmoji(index + 1)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`font-medium ${
                            isCurrentUser ? 'text-purple-400' : 'text-white'
                          }`}>
                            {entry.username}
                            {isCurrentUser && (
                              <span className="ml-2 text-xs text-purple-400">(You)</span>
                            )}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-slate-300">
                          {entry.total_parlays}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <span className="text-green-400 font-semibold">{entry.wins}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <span className="text-red-400 font-semibold">{entry.losses}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <span className="text-purple-400 font-bold">
                            {entry.win_rate.toFixed(1)}%
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden divide-y divide-slate-700">
              {leaderboard.map((entry, index) => {
                const isCurrentUser = entry.user_id === user?.id
                return (
                  <div
                    key={entry.user_id}
                    className={`p-4 ${isCurrentUser ? 'bg-purple-500/10' : ''}`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <span className="text-xl font-bold text-white">
                          {getRankEmoji(index + 1)}
                        </span>
                        <div>
                          <p className={`font-medium ${
                            isCurrentUser ? 'text-purple-400' : 'text-white'
                          }`}>
                            {entry.username}
                          </p>
                          {isCurrentUser && (
                            <span className="text-xs text-purple-400">(You)</span>
                          )}
                        </div>
                      </div>
                      <span className="text-purple-400 font-bold">
                        {entry.win_rate.toFixed(1)}%
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <p className="text-xs text-slate-400 mb-1">Total</p>
                        <p className="text-sm font-semibold text-white">{entry.total_parlays}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-400 mb-1">Wins</p>
                        <p className="text-sm font-semibold text-green-400">{entry.wins}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-400 mb-1">Losses</p>
                        <p className="text-sm font-semibold text-red-400">{entry.losses}</p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
