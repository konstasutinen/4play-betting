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
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Profile Header */}
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg border border-purple-500/20 p-6 mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            {profile?.username || 'Loading...'}
          </h1>
          <p className="text-slate-400 text-sm">{user.email}</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg border border-slate-700 p-4">
            <p className="text-slate-400 text-sm mb-1">Total Tickets</p>
            <p className="text-3xl font-bold text-white">{stats.total}</p>
          </div>
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg border border-green-500/30 p-4">
            <p className="text-slate-400 text-sm mb-1">Wins</p>
            <p className="text-3xl font-bold text-green-400">{stats.won}</p>
          </div>
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg border border-red-500/30 p-4">
            <p className="text-slate-400 text-sm mb-1">Losses</p>
            <p className="text-3xl font-bold text-red-400">{stats.lost}</p>
          </div>
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg border border-purple-500/30 p-4">
            <p className="text-slate-400 text-sm mb-1">Win Rate</p>
            <p className="text-3xl font-bold text-purple-400">{stats.winRate}%</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex space-x-2 mb-6 overflow-x-auto">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg font-medium transition whitespace-nowrap ${
              filter === 'all'
                ? 'bg-purple-600 text-white'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            All Tickets ({stats.total})
          </button>
          <button
            onClick={() => setFilter('pending')}
            className={`px-4 py-2 rounded-lg font-medium transition whitespace-nowrap ${
              filter === 'pending'
                ? 'bg-purple-600 text-white'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            Pending ({stats.pending})
          </button>
          <button
            onClick={() => setFilter('won')}
            className={`px-4 py-2 rounded-lg font-medium transition whitespace-nowrap ${
              filter === 'won'
                ? 'bg-purple-600 text-white'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            Won ({stats.won})
          </button>
          <button
            onClick={() => setFilter('lost')}
            className={`px-4 py-2 rounded-lg font-medium transition whitespace-nowrap ${
              filter === 'lost'
                ? 'bg-purple-600 text-white'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            Lost ({stats.lost})
          </button>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
            <p className="text-slate-400 mt-4">Loading tickets...</p>
          </div>
        )}

        {/* No Tickets State */}
        {!loading && filteredParlays.length === 0 && (
          <div className="text-center py-12 bg-slate-800/50 rounded-lg border border-slate-700">
            <p className="text-slate-400 text-lg mb-4">
              {filter === 'all'
                ? 'No tickets yet. Create your first ticket!'
                : `No ${filter} tickets.`}
            </p>
            {filter === 'all' && (
              <button
                onClick={() => router.push('/')}
                className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold rounded-lg transition"
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

              return (
                <div
                  key={parlay.id}
                  className={`bg-slate-800/50 backdrop-blur-sm rounded-lg border overflow-hidden ${
                    parlay.status === 'won' ? 'border-green-500/30' :
                    parlay.status === 'lost' ? 'border-red-500/30' :
                    'border-slate-700'
                  }`}
                >
                  {/* Ticket Header */}
                  <button
                    onClick={toggleOpen}
                    className="w-full text-left p-4 border-b border-slate-700 flex items-center justify-between hover:bg-slate-700/30 transition"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-full bg-slate-900/70 border border-slate-700">
                        <svg className="w-5 h-5 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 9.75l15-6v16.5l-15-6v-4.5z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-white font-semibold">
                          Ticket from {new Date(parlay.created_at).toLocaleDateString()}
                        </p>
                        <p className="text-sm text-slate-400">
                          Total Odds: <span className="text-purple-400 font-bold">{parlay.total_odds.toFixed(2)}</span>
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        parlay.status === 'won' ? 'bg-green-500/20 text-green-400' :
                        parlay.status === 'lost' ? 'bg-red-500/20 text-red-400' :
                        'bg-yellow-500/20 text-yellow-400'
                      }`}>
                        {parlay.status.toUpperCase()}
                      </span>
                      <svg
                        className={`w-5 h-5 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
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
                          className="bg-slate-900/30 rounded-lg p-3 flex items-center justify-between"
                        >
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-slate-400 mb-1">
                              Pick {index + 1} • {pick.games.match}
                            </p>
                            <p className="text-sm text-white font-medium">
                              {pick.market}: {pick.option}
                            </p>
                          </div>
                          <div className="flex items-center space-x-3 ml-3">
                            <span className="text-sm font-bold text-purple-400">
                              {pick.odd.toFixed(2)}
                            </span>
                            {pick.result && pick.result !== 'pending' && (
                              <span className={`text-xs font-semibold ${
                                pick.result === 'won' ? 'text-green-400' : 'text-red-400'
                              }`}>
                                {pick.result === 'won' ? '✓' : '✕'}
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
