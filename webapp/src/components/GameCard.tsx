'use client'

import { useState } from 'react'
import type { Game, Odd, SelectedPick } from '@/types/database.types'
import OutcomeButton from './OutcomeButton'

interface GameCardProps {
  game: Game
  odds: Odd[]
  onSelectPick: (pick: SelectedPick) => void
  selectedEventIds: string[]
  selectedOddId?: string | null
}

export default function GameCard({ game, odds, onSelectPick, selectedEventIds, selectedOddId }: GameCardProps) {
  const [expanded, setExpanded] = useState(false)

  // Get Match Odds - Regular Time (1X2) market
  // Football uses "Full Time", Ice Hockey uses "Match Odds - Regular Time"
  const matchOdds = odds.filter(odd =>
    odd.market === 'Match Odds - Regular Time' || odd.market === 'Full Time'
  )

  // Get all other markets
  const otherMarkets = odds.filter(odd =>
    odd.market !== 'Match Odds - Regular Time' && odd.market !== 'Full Time'
  )

  // Group other markets by market name
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
    if (sport === 'Ice Hockey') return '🏒'
    if (sport === 'Football') return '⚽'
    return '🎯'
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
              <span className="text-2xl">{getSportIcon(game.sport)}</span>
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

        {/* Expand button for other markets */}
        {otherMarketCount > 0 && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="w-full mt-4 py-2.5 text-xs font-semibold text-purple-400 hover:text-purple-300 transition-colors flex items-center justify-center gap-2"
          >
            <span>{expanded ? '▲' : '▼'}</span>
            <span>{otherMarketCount} more markets</span>
          </button>
        )}
      </div>

      {/* Expanded Markets */}
      {expanded && (
        <div className="border-t border-slate-700/70 p-6 space-y-6 bg-slate-900/90">
          {Object.entries(groupedMarkets).map(([marketName, marketOdds]) => (
            <div key={marketName}>
              <p className="text-xs text-slate-300 font-semibold uppercase tracking-wide mb-3">
                {marketName}
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {marketOdds.map((odd) => (
                  <button
                    key={odd.id}
                    onClick={() => handleOddClick(odd)}
                    disabled={!game.is_available || (isGameSelected && selectedOddId !== odd.id)}
                    className={`
                      py-3 px-3 rounded-xl text-center transition-all duration-200
                      ${selectedOddId === odd.id
                        ? 'bg-gradient-to-br from-purple-600 to-pink-600 shadow-lg shadow-purple-500/40'
                        : !game.is_available || (isGameSelected && selectedOddId !== odd.id)
                        ? 'bg-slate-800/30 cursor-not-allowed opacity-50'
                        : 'bg-slate-800/60 hover:bg-slate-700 hover:scale-105'
                      }
                    `}
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
    </div>
  )
}
