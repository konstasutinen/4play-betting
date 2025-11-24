'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import type { ParlayWithPicks, UserProfile } from '@/types/database.types'
import type { User } from '@supabase/supabase-js'

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [parlays, setParlays] = useState<ParlayWithPicks[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'pending' | 'won' | 'lost'>('all')
  const [openTicketIds, setOpenTicketIds] = useState<string[]>([])
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
    const fetchProfileAndParlays = async () => {
      if (!user) return

      setLoading(true)

      const { data: profileData } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      setProfile(profileData)

      const { data: parlaysData } = await supabase
        .from('parlays')
        .select(`
          *,
          parlay_picks (
            *,
            games (*)
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      setParlays(parlaysData || [])
      setLoading(false)
    }

    fetchProfileAndParlays()
  }, [supabase, user])

  const filteredParlays = filter === 'all'
    ? parlays
    : parlays.filter(p => p.status === filter)

  const stats = {
    total: parlays.length,
    pending: parlays.filter(p => p.status === 'pending').length,
    won: parlays.filter(p => p.status === 'won').length,
    lost: parlays.filter(p => p.status === 'lost').length,
    winRate: parlays.length > 0
      ? ((parlays.filter(p => p.status === 'won').length / (parlays.filter(p => p.status !== 'pending').length || 1)) * 100).toFixed(1)
      : '0.0'
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-[#05070A]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Profile Header */}
        <div className="bg-[#0D1117] border border-[#1E2430] rounded-2xl p-6 mb-8 shadow-sm">
          <h1 className="text-3xl font-bold text-white mb-2">
            {profile?.username || 'Loading...'}
          </h1>
          <p className="text-sm text-[#A0A8B5]">{user.email}</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-[#0D1117] border border-[#1E2430] rounded-xl p-4 shadow-sm">
            <p className="text-xs uppercase tracking-wide text-[#6B7380]">Total Tickets</p>
            <p className="text-3xl font-bold text-white mt-1">{stats.total}</p>
          </div>
          <div className="bg-[#0D1117] border border-[#1E2430] rounded-xl p-4 shadow-sm">
            <p className="text-xs uppercase tracking-wide text-[#6B7380]">Wins</p>
            <p className="text-3xl font-bold text-green-400 mt-1">{stats.won}</p>
          </div>
          <div className="bg-[#0D1117] border border-[#1E2430] rounded-xl p-4 shadow-sm">
            <p className="text-xs uppercase tracking-wide text-[#6B7380]">Losses</p>
            <p className="text-3xl font-bold text-red-400 mt-1">{stats.lost}</p>
          </div>
          <div className="bg-[#0D1117] border border-[#1E2430] rounded-xl p-4 shadow-sm">
            <p className="text-xs uppercase tracking-wide text-[#6B7380]">Win Rate</p>
            <p className="text-3xl font-bold text-[#0E8BFF] mt-1">{stats.winRate}%</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2 mb-6">
          {[
            { key: 'all', label: `All Tickets (${stats.total})` },
            { key: 'pending', label: `Pending (${stats.pending})` },
            { key: 'won', label: `Won (${stats.won})` },
            { key: 'lost', label: `Lost (${stats.lost})` }
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setFilter(key as typeof filter)}
              className={`px-4 py-2 rounded-full text-sm font-semibold border transition-colors ${
                filter === key
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
            <p className="text-[#A0A8B5] mt-4">Loading tickets...</p>
          </div>
        )}

        {/* No Tickets State */}
        {!loading && filteredParlays.length === 0 && (
          <div className="text-center py-12 bg-[#0D1117] rounded-2xl border border-[#1E2430]">
            <p className="text-[#A0A8B5] text-lg mb-4">
              {filter === 'all'
                ? 'No tickets yet. Create your first ticket!'
                : `No ${filter} tickets.`}
            </p>
            {filter === 'all' && (
              <button
                onClick={() => router.push('/')}
                className="px-6 py-3 bg-[#0E8BFF] hover:bg-[#3aa3ff] text-white font-semibold rounded-lg transition-colors"
              >
                View Games
              </button>
            )}
          </div>
        )}

        {/* Tickets List */}
        {!loading && filteredParlays.length > 0 && (
          <div className="space-y-4">
            {filteredParlays.map((parlay) => {
              const isOpen = openTicketIds.includes(parlay.id)
              const toggleOpen = () => {
                setOpenTicketIds((prev) =>
                  prev.includes(parlay.id) ? prev.filter((id) => id !== parlay.id) : [...prev, parlay.id]
                )
              }

              const borderAccent =
                parlay.status === 'won'
                  ? 'border-green-500/40'
                  : parlay.status === 'lost'
                  ? 'border-red-500/40'
                  : 'border-[#1E2430]'

              return (
                <div
                  key={parlay.id}
                  className={`bg-[#0D1117] ${borderAccent} rounded-2xl overflow-hidden shadow-sm`}
                >
                  {/* Ticket Header */}
                  <button
                    onClick={toggleOpen}
                    className="w-full text-left p-4 border-b border-[#1E2430] flex items-center justify-between hover:bg-[#0A0D13] transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-full bg-[#0A0D13] border border-[#1E2430]">
                        <svg className="w-5 h-5 text-[#0E8BFF]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 9.75l15-6v16.5l-15-6v-4.5z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-white font-semibold">
                          Ticket from {new Date(parlay.created_at).toLocaleDateString('en-GB')}
                        </p>
                        <p className="text-sm text-[#A0A8B5]">
                          Total Odds: <span className="text-[#0E8BFF] font-bold">{parlay.total_odds.toFixed(2)}</span>
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${
                        parlay.status === 'won'
                          ? 'border-green-500/60 text-green-400 bg-green-500/10'
                          : parlay.status === 'lost'
                          ? 'border-red-500/60 text-red-400 bg-red-500/10'
                          : 'border-[#252B35] text-[#A0A8B5] bg-[#0A0D13]'
                      }`}>
                        {parlay.status.toUpperCase()}
                      </span>
                      <svg
                        className={`w-5 h-5 text-[#A0A8B5] transition-transform ${isOpen ? 'rotate-180' : ''}`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={1.5}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 9l6 6 6-6" />
                      </svg>
                    </div>
                  </button>

                  {/* Picks */}
                  {isOpen && (
                    <div className="p-4 space-y-2">
                      {parlay.parlay_picks.map((pick, index) => (
                        <div
                          key={pick.id}
                          className="bg-[#0A0D13] border border-[#1E2430] rounded-xl p-3 flex items-center justify-between"
                        >
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-[#6B7380] mb-1">
                              Pick {index + 1} - {pick.games.match}
                            </p>
                            <p className="text-sm text-white font-medium truncate">
                              {pick.market}: {pick.option}
                            </p>
                          </div>
                          <div className="flex items-center space-x-3 ml-3">
                            <span className="text-sm font-semibold text-[#0E8BFF]">
                              {pick.odd.toFixed(2)}
                            </span>
                            {pick.result && pick.result !== 'pending' && (
                              <span className={`text-xs font-semibold ${
                                pick.result === 'won' ? 'text-green-400' : 'text-red-400'
                              }`}>
                                {pick.result === 'won' ? 'WIN' : 'LOSS'}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
