'use client'

import { useState } from 'react'
import type { Game, Odd, SelectedPick } from '@/types/database.types'

interface GameCardProps {
  game: Game
  odds: Odd[]
  onSelectPick: (pick: SelectedPick) => void
  selectedEventIds: string[]
}

export default function GameCard({ game, odds, onSelectPick, selectedEventIds }: GameCardProps) {
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
    if (isGameSelected) return // Can't select multiple picks from same game

    onSelectPick({ game, odd })
  }

  const getSportIcon = (sport: string) => {
    if (sport === 'Ice Hockey') return '🏒'
    if (sport === 'Football') return '⚽'
    return '🎯'
  }

  return (
    <div className={`bg-slate-800/50 backdrop-blur-sm rounded-lg border ${
      isGameSelected ? 'border-purple-500' : 'border-slate-700'
    } overflow-hidden`}>
      {/* Game Header */}
      <div className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-1">
              <span className="text-2xl">{getSportIcon(game.sport)}</span>
              <span className="text-xs text-slate-400">{game.league}</span>
            </div>
            <h3 className="text-white font-semibold text-sm sm:text-base">{game.match}</h3>
            <p className="text-xs text-slate-400 mt-1">
              {new Date(`${game.date}T${game.time}`).toLocaleString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </p>
            {!game.is_available && (
              <span className="inline-block mt-2 text-xs bg-red-500/20 text-red-400 px-2 py-1 rounded">
                Starting soon
              </span>
            )}
          </div>
        </div>

        {/* Match Odds (1X2) */}
        <div className="space-y-2">
          <p className="text-xs text-slate-400 font-medium">
            {game.sport === 'Football' ? 'Full Time Result' : 'Match Odds - Regular Time'}
          </p>
          <div className="grid grid-cols-3 gap-2">
            {matchOdds.map((odd) => (
              <button
                key={odd.id}
                onClick={() => handleOddClick(odd)}
                disabled={!game.is_available || isGameSelected}
                className={`
                  py-3 px-2 rounded-lg text-center transition
                  ${!game.is_available || isGameSelected
                    ? 'bg-slate-700/50 cursor-not-allowed opacity-50'
                    : 'bg-slate-700 hover:bg-purple-600 cursor-pointer'
                  }
                  disabled:cursor-not-allowed
                `}
              >
                <div className="text-xs text-slate-300 mb-1">{odd.option}</div>
                <div className="text-sm font-bold text-white">{odd.odd.toFixed(2)}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Expand button */}
        {otherMarketCount > 0 && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="w-full mt-3 py-2 text-xs font-medium text-purple-400 hover:text-purple-300 transition"
          >
            {expanded ? '▲' : '▼'} {otherMarketCount} more markets
          </button>
        )}
      </div>

      {/* Expanded Markets */}
      {expanded && (
        <div className="border-t border-slate-700 p-4 space-y-4 bg-slate-900/30">
          {Object.entries(groupedMarkets).map(([marketName, marketOdds]) => (
            <div key={marketName}>
              <p className="text-xs text-slate-400 font-medium mb-2">{marketName}</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {marketOdds.map((odd) => (
                  <button
                    key={odd.id}
                    onClick={() => handleOddClick(odd)}
                    disabled={!game.is_available || isGameSelected}
                    className={`
                      py-2 px-2 rounded-lg text-center transition
                      ${!game.is_available || isGameSelected
                        ? 'bg-slate-700/50 cursor-not-allowed opacity-50'
                        : 'bg-slate-700 hover:bg-purple-600 cursor-pointer'
                      }
                    `}
                  >
                    <div className="text-xs text-slate-300 mb-1 truncate">{odd.option}</div>
                    <div className="text-sm font-bold text-white">{odd.odd.toFixed(2)}</div>
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
