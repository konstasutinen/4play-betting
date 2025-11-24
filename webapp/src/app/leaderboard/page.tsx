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
    <div className="min-h-screen bg-[#05070A]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">Leaderboard</h1>
          <p className="text-[#A0A8B5]">See how you stack up against other players</p>
        </div>

        {/* Sort Toggle */}
        <div className="flex flex-wrap gap-2 mb-6">
          {[
            { key: 'wins', label: 'Most Wins' },
            { key: 'win_rate', label: 'Best Win Rate' }
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setSortBy(key as typeof sortBy)}
              className={`px-4 py-2 rounded-full text-sm font-semibold border transition-colors ${
                sortBy === key
                  ? 'bg-[#0E8BFF] border-[#0E8BFF] text-white shadow-sm'
                  : 'bg-[#0D1117] border-[#252B35] text-[#A0A8B5] hover:text-white hover:border-[#0E8BFF]'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Loading State */}
        {loading && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#0E8BFF]" />
            <p className="text-[#A0A8B5] mt-4">Loading leaderboard...</p>
          </div>
        )}

        {/* No Data State */}
        {!loading && leaderboard.length === 0 && (
          <div className="text-center py-12 bg-[#0D1117] rounded-2xl border border-[#1E2430]">
            <p className="text-[#A0A8B5] text-lg">No data yet. Be the first to create a ticket!</p>
          </div>
        )}

        {/* Leaderboard Table */}
        {!loading && leaderboard.length > 0 && (
          <div className="bg-[#0D1117] border border-[#1E2430] rounded-2xl overflow-hidden shadow-sm">
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead className="bg-[#0A0D13] border-b border-[#1E2430]">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-[#6B7380] uppercase tracking-wider">
                      Rank
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-[#6B7380] uppercase tracking-wider">
                      Player
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-[#6B7380] uppercase tracking-wider">
                      Total
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-[#6B7380] uppercase tracking-wider">
                      Wins
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-[#6B7380] uppercase tracking-wider">
                      Losses
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-[#6B7380] uppercase tracking-wider">
                      Win Rate
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1E2430]">
                  {leaderboard.map((entry, index) => {
                    const isCurrentUser = entry.user_id === user?.id
                    return (
                      <tr
                        key={entry.user_id}
                        className={`${isCurrentUser ? 'bg-[#0E8BFF]/10' : 'hover:bg-[#0A0D13]'} transition-colors`}
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-lg font-bold text-white">
                            {getRankEmoji(index + 1)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`font-medium ${isCurrentUser ? 'text-[#0E8BFF]' : 'text-white'}`}>
                            {entry.username}
                            {isCurrentUser && (
                              <span className="ml-2 text-xs text-[#0E8BFF]">(You)</span>
                            )}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-[#A0A8B5]">
                          {entry.total_parlays}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <span className="text-green-400 font-semibold">{entry.wins}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <span className="text-red-400 font-semibold">{entry.losses}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <span className="text-[#0E8BFF] font-bold">
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
            <div className="md:hidden divide-y divide-[#1E2430]">
              {leaderboard.map((entry, index) => {
                const isCurrentUser = entry.user_id === user?.id
                return (
                  <div
                    key={entry.user_id}
                    className={`p-4 ${isCurrentUser ? 'bg-[#0E8BFF]/10' : ''}`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <span className="text-xl font-bold text-white">
                          {getRankEmoji(index + 1)}
                        </span>
                        <div>
                          <p className={`font-medium ${isCurrentUser ? 'text-[#0E8BFF]' : 'text-white'}`}>
                            {entry.username}
                          </p>
                          {isCurrentUser && (
                            <span className="text-xs text-[#0E8BFF]">(You)</span>
                          )}
                        </div>
                      </div>
                      <span className="text-[#0E8BFF] font-bold">
                        {entry.win_rate.toFixed(1)}%
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-center text-sm">
                      <div className="rounded-lg bg-[#0D1117] border border-[#1E2430] p-3">
                        <p className="text-xs text-[#6B7380] mb-1">Total</p>
                        <p className="font-semibold text-white">{entry.total_parlays}</p>
                      </div>
                      <div className="rounded-lg bg-[#0D1117] border border-[#1E2430] p-3">
                        <p className="text-xs text-[#6B7380] mb-1">Wins</p>
                        <p className="font-semibold text-green-400">{entry.wins}</p>
                      </div>
                      <div className="rounded-lg bg-[#0D1117] border border-[#1E2430] p-3">
                        <p className="text-xs text-[#6B7380] mb-1">Losses</p>
                        <p className="font-semibold text-red-400">{entry.losses}</p>
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
