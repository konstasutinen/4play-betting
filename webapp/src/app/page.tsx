'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Game, Odd, SelectedPick } from '@/types/database.types'
import GameCard from '@/components/GameCard'
import TicketBar from '@/components/TicketBar'
import SportFilter from '@/components/SportFilter'
import { useRouter } from 'next/navigation'

export default function HomePage() {
  const [games, setGames] = useState<Game[]>([])
  const [odds, setOdds] = useState<Record<string, Odd[]>>({})
  const [loading, setLoading] = useState(true)
  const [selectedPicks, setSelectedPicks] = useState<SelectedPick[]>([])
  const [sportFilter, setSportFilter] = useState<'all' | 'Ice Hockey' | 'Football'>('all')
  const [user, setUser] = useState<any>(null)
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
    const fetchGamesAndOdds = async () => {
      setLoading(true)

      // Get today's date in YYYY-MM-DD format
      const today = new Date().toISOString().split('T')[0]

      // Fetch games for today
      const { data: gamesData, error: gamesError } = await supabase
        .from('games')
        .select('*')
        .eq('date', today)
        .order('time', { ascending: true })

      if (gamesError) {
        console.error('Error fetching games:', gamesError)
        setLoading(false)
        return
      }

      setGames(gamesData || [])

      // Fetch odds for all games
      if (gamesData && gamesData.length > 0) {
        // Fetch all odds with pagination to avoid the 1000 row limit
        const allOdds: Odd[] = []
        const RANGE_SIZE = 1000
        let from = 0
        let hasMore = true

        // Get today's date for filtering
        const today = new Date().toISOString().split('T')[0]

        while (hasMore) {
          const { data: oddsData, error: oddsError } = await supabase
            .from('odds')
            .select('*')
            .range(from, from + RANGE_SIZE - 1)

          if (oddsError) {
            console.error('Error fetching odds:', oddsError)
            break
          }

          if (oddsData && oddsData.length > 0) {
            allOdds.push(...oddsData)
            from += RANGE_SIZE
            hasMore = oddsData.length === RANGE_SIZE
          } else {
            hasMore = false
          }
        }

        // Group odds by game_id and filter to only games we have
        const gameIdSet = new Set(gamesData.map(g => g.id))
        const oddsMap: Record<string, Odd[]> = {}

        allOdds.forEach(odd => {
          if (gameIdSet.has(odd.game_id)) {
            if (!oddsMap[odd.game_id]) {
              oddsMap[odd.game_id] = []
            }
            oddsMap[odd.game_id].push(odd)
          }
        })

        console.log(`Fetched ${allOdds.length} total odds for ${Object.keys(oddsMap).length} games`)
        console.log('Sample game odds:', Object.keys(oddsMap)[0], oddsMap[Object.keys(oddsMap)[0]]?.length)
        setOdds(oddsMap)
      }

      setLoading(false)
    }

    if (user) {
      fetchGamesAndOdds()
    }
  }, [supabase, user])

  const handleSelectPick = (pick: SelectedPick) => {
    const existingPick = selectedPicks.find(p => p.game.event_id === pick.game.event_id)

    // If clicking the same odd, remove it (toggle off)
    if (existingPick && existingPick.odd.id === pick.odd.id) {
      setSelectedPicks(selectedPicks.filter(p => p.game.event_id !== pick.game.event_id))
      return
    }

    // If clicking different odd in same game, replace it
    if (existingPick) {
      setSelectedPicks(selectedPicks.map(p =>
        p.game.event_id === pick.game.event_id ? pick : p
      ))
      return
    }

    // Check if already have 4 picks from different games
    if (selectedPicks.length >= 4) {
      return
    }

    // Add new pick
    setSelectedPicks([...selectedPicks, pick])
  }

  const handleRemovePick = (eventId: string) => {
    setSelectedPicks(selectedPicks.filter(p => p.game.event_id !== eventId))
  }

  const handleClearAll = () => {
    setSelectedPicks([])
  }

  const selectedEventIds = selectedPicks.map(p => p.game.event_id)

  // Filter games by sport and also hide games that have already started
  const now = new Date()
  const filteredGames = (sportFilter === 'all' ? games : games.filter(g => g.sport === sportFilter))
    .filter(g => {
      const gameDateTime = new Date(`${g.date}T${g.time}`)
      return gameDateTime > now
    })

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen pb-64">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">
            Today&apos;s Games
          </h1>
          <p className="text-slate-400">Select 4 picks from different games to create your ticket</p>
        </div>

        {/* Sport Filter */}
        <SportFilter selected={sportFilter} onChange={setSportFilter} />

        {/* Loading State */}
        {loading && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
            <p className="text-slate-400 mt-4">Loading games...</p>
          </div>
        )}

        {/* No Games State */}
        {!loading && filteredGames.length === 0 && (
          <div className="text-center py-12 bg-slate-800/50 rounded-lg border border-slate-700">
            <p className="text-slate-400 text-lg">
              {sportFilter === 'all'
                ? 'No games available today. Check back later!'
                : `No ${sportFilter} games available today.`}
            </p>
          </div>
        )}

        {/* Games Grid */}
        {!loading && filteredGames.length > 0 && (
          <div className="space-y-6 lg:pr-[26rem]">
            {filteredGames.map(game => {
              const selectedPick = selectedPicks.find(p => p.game.event_id === game.event_id)
              return (
                <GameCard
                  key={game.id}
                  game={game}
                  odds={odds[game.id] || []}
                  onSelectPick={handleSelectPick}
                  selectedEventIds={selectedEventIds}
                  selectedOddId={selectedPick?.odd.id || null}
                />
              )
            })}
          </div>
        )}
      </div>

      {/* Ticket Bar (Mobile Bottom + Desktop Sidebar) */}
      <TicketBar
        picks={selectedPicks}
        onRemovePick={handleRemovePick}
        onClearAll={handleClearAll}
      />
    </div>
  )
}

