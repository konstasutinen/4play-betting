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
  // Match odds - regular time or full time
  const matchOdds = odds.filter(
    (odd) => odd.market === 'Match Odds - Regular Time' || odd.market === 'Full Time'
  )

  const isCorrectScore = (market: string) => market.toLowerCase().startsWith('correct score')
  const isTotalGoalsWholeGame = (market: string) => {
    const lower = market.toLowerCase()
    return lower.includes('total goals') && !lower.includes('period') && !lower.includes('by') && !lower.includes('0:00')
  }
  const isInlineMarket = (market: string) => isCorrectScore(market) || isTotalGoalsWholeGame(market)

  // Inline markets (Correct Score, whole-game totals)
  const inlineGrouped = odds.reduce((acc, odd) => {
    if (odd.market === 'Match Odds - Regular Time' || odd.market === 'Full Time') return acc
    if (!isInlineMarket(odd.market)) return acc
    if (!acc[odd.market]) acc[odd.market] = []
    acc[odd.market].push(odd)
    return acc
  }, {} as Record<string, Odd[]>)
  const inlineMarkets = Object.entries(inlineGrouped).map(([name, group]) => ({ name, odds: group }))

  // Other markets (for modal)
  const otherMarkets = odds.filter(
    (odd) =>
      odd.market !== 'Match Odds - Regular Time' &&
      odd.market !== 'Full Time' &&
      !isInlineMarket(odd.market)
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

  const getSportAccent = (sport: string) => {
    if (sport === 'Ice Hockey') return 'from-cyan-500/40 to-blue-500/40 border-cyan-500/50'
    if (sport === 'Football') return 'from-emerald-500/40 to-green-500/40 border-emerald-500/50'
    return 'from-purple-500/40 to-pink-500/40 border-purple-500/50'
  }

  return (
    <div
      className={`
        bg-gradient-to-br ${getSportAccent(game.sport)}
        backdrop-blur-sm rounded-2xl border-2 overflow-hidden
        shadow-xl transition-all duration-200
        ${isGameSelected ? 'border-purple-500 shadow-purple-500/40' : 'border-slate-600 hover:border-slate-500'}
      `}
    >
      <div className="p-6 bg-slate-900/85">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            {/* League badge */}
            <div className="flex items-center gap-2 mb-3">
              <span className="text-sm font-semibold px-2 py-1 bg-slate-800/90 rounded border border-slate-700 text-slate-200">
                {getSportIcon(game.sport)}
              </span>
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-300 bg-slate-800/90 px-3 py-1 rounded-full border border-slate-700">
                {game.league}
              </span>
            </div>

            {/* Teams */}
            <h3 className="text-xl font-bold text-white mb-2 leading-tight">
              {game.match}
            </h3>

            {/* Date & Time */}
            <div className="flex items-center gap-2 text-sm text-slate-300">
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
              <span className="inline-block mt-3 text-xs bg-red-500/20 text-red-400 px-3 py-1.5 rounded-full font-medium">
                Starting soon
              </span>
            )}
          </div>
        </div>

        {/* Match Odds (1X2 or Full Time) */}
        {matchOdds.length > 0 && (
          <div className="space-y-3">
            <p className="text-xs text-slate-300 font-semibold uppercase tracking-wide">
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

        {/* Inline key markets (Correct Score, Total Goals) */}
        {inlineMarkets.length > 0 && (
          <div className="mt-5 space-y-4">
            {inlineMarkets.map((market) => (
              <div key={market.name} className="space-y-2">
                <p className="text-xs text-slate-300 font-semibold uppercase tracking-wide">
                  {market.name}
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {market.odds.map((odd) => (
                    <button
                      key={odd.id}
                      onClick={() => handleOddClick(odd)}
                      disabled={!game.is_available || (isGameSelected && selectedOddId !== odd.id)}
                      className={`py-3 px-3 rounded-xl text-left transition-all duration-200 border ${
                        selectedOddId === odd.id
                          ? 'border-purple-500 bg-purple-600/30 shadow-lg shadow-purple-500/40'
                          : !game.is_available || (isGameSelected && selectedOddId !== odd.id)
                          ? 'border-slate-700 bg-slate-800/30 cursor-not-allowed opacity-60'
                          : 'border-slate-700 bg-slate-800/70 hover:border-purple-400 hover:bg-slate-800'
                      }`}
                    >
                      <div className={`text-xs mb-1 truncate ${selectedOddId === odd.id ? 'text-white' : 'text-slate-300'}`}>
                        {odd.option}
                      </div>
                      <div className={`text-lg font-bold ${selectedOddId === odd.id ? 'text-white' : 'text-purple-400'}`}>
                        {odd.odd.toFixed(2)}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Open modal for other markets */}
        {otherMarketCount > 0 && (
          <button
            onClick={() => onOpenMarkets?.(game)}
            className="w-full mt-4 py-2.5 text-xs font-semibold text-purple-400 hover:text-purple-300 transition-colors flex items-center justify-center gap-2"
          >
            <span>+</span>
            <span>{otherMarketCount} more markets</span>
          </button>
        )}
      </div>
    </div>
  )
}
