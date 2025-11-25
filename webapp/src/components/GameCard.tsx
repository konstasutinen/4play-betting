'use client'

import type { Game, Odd, SelectedPick } from '@/types/database.types'
import OutcomeButton from './OutcomeButton'

interface GameCardProps {
  game: Game
  odds: Odd[]
  onSelectPick: (pick: SelectedPick) => void
  selectedEventIds: string[]
  selectedOddId?: string | null
  onOpenMarkets?: (game: Game) => void
}

export default function GameCard({
  game,
  odds,
  onSelectPick,
  selectedEventIds,
  selectedOddId,
  onOpenMarkets
}: GameCardProps) {
  // Match odds - regular time or full time, sorted in 1X2 order
  const matchOdds = odds
    .filter((odd) => odd.market === 'Match Odds - Regular Time' || odd.market === 'Full Time')
    .sort((a, b) => {
      // Sort order: 1, X, 2
      const order = { '1': 0, 'X': 1, '2': 2 }
      return (order[a.option as keyof typeof order] ?? 3) - (order[b.option as keyof typeof order] ?? 3)
    })

  // All non-match-odds markets go to modal
  const otherMarkets = odds.filter(
    (odd) =>
      odd.market !== 'Match Odds - Regular Time' &&
      odd.market !== 'Full Time'
  )

  const groupedMarkets = otherMarkets.reduce((acc, odd) => {
    if (!acc[odd.market]) {
      acc[odd.market] = []
    }
    acc[odd.market].push(odd)
    return acc
  }, {} as Record<string, Odd[]>)

  const otherMarketCount = Object.keys(groupedMarkets).length

  const isGameSelected = selectedEventIds.includes(game.event_id)

  const handleOddClick = (odd: Odd) => {
    if (!game.is_available) return
    onSelectPick({ game, odd })
  }

  const getSportIcon = (sport: string) => {
    if (sport === 'Ice Hockey') return 'HKY'
    if (sport === 'Football') return 'FTB'
    return 'SPT'
  }

  return (
    <div
      className="
        bg-[#0D1117] rounded-2xl border border-[#1E2430] overflow-hidden
        transition-all duration-200 hover:border-[#0E8BFF]/60
      "
    >
      <div className="p-6 bg-transparent">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            {/* League badge */}
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs font-semibold px-2 py-1 bg-[#141820] rounded-full border border-[#252B35] text-[#A0A8B5]">
                {getSportIcon(game.sport)}
              </span>
              <span className="text-xs font-semibold uppercase tracking-wider text-[#A0A8B5] bg-[#141820] px-3 py-1 rounded-full border border-[#252B35]">
                {game.league}
              </span>
            </div>

            {/* Teams */}
            <h3 className="text-xl font-bold text-white mb-2 leading-tight">
              {game.match}
            </h3>

            {/* Date & Time */}
            <div className="flex items-center gap-2 text-sm text-[#A0A8B5]">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span>
                {new Date(`${game.date}T${game.time}`).toLocaleString('en-US', {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </span>
            </div>

            {!game.is_available && (
              <span className="inline-block mt-3 text-xs bg-red-500/15 text-red-400 px-3 py-1.5 rounded-full font-medium">
                Starting soon
              </span>
            )}
          </div>
        </div>

        {/* Match Odds (1X2 or Full Time) */}
        {matchOdds.length > 0 && (
          <div className="space-y-3">
            <p className="text-xs text-[#6B7380] font-semibold uppercase tracking-wide">
              {game.sport === 'Football' ? 'Full Time Result' : 'Match Odds'}
            </p>
            <div className="grid grid-cols-3 gap-3">
              {matchOdds.map((odd) => (
                <OutcomeButton
                  key={odd.id}
                  odd={odd}
                  isSelected={selectedOddId === odd.id}
                  isDisabled={!game.is_available || (isGameSelected && selectedOddId !== odd.id)}
                  onClick={() => handleOddClick(odd)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Open modal for other markets */}
        {otherMarketCount > 0 && (
          <button
            onClick={() => onOpenMarkets?.(game)}
            className="w-full mt-4 py-2.5 text-xs font-semibold text-[#0E8BFF] hover:text-[#3aa3ff] transition-colors flex items-center justify-center gap-2"
          >
            <span>+</span>
            <span>{otherMarketCount} more markets</span>
          </button>
        )}
      </div>
    </div>
  )
}
