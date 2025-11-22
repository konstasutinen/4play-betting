'use client'

import { useState } from 'react'
import GameMarketsModal from './GameMarketsModal'

type Category = 'popular' | 'main' | 'goals' | 'handicaps' | 'players' | 'other'

type Outcome = {
  id: string
  label: string
  odds: number
}

type Market = {
  id: string
  name: string
  category: Category
  outcomes: Outcome[]
  pinned?: boolean
}

// Minimal page-level example showing how to open the modal and handle callbacks
export default function GamePageExample() {
  const [isOpen, setIsOpen] = useState(false)
  // Sample markets for the demo (replace with real feed when wiring up)
  const [markets, setMarkets] = useState<Market[]>([
    {
      id: 'm1',
      name: 'Both Teams To Score',
      category: 'main',
      pinned: true,
      outcomes: [
        { id: 'o1', label: 'Yes', odds: 1.9 },
        { id: 'o2', label: 'No', odds: 1.95 }
      ]
    },
    {
      id: 'm2',
      name: 'Full Time Result',
      category: 'main',
      outcomes: [
        { id: 'o3', label: 'Home', odds: 2.1 },
        { id: 'o4', label: 'Draw', odds: 3.4 },
        { id: 'o5', label: 'Away', odds: 3.2 }
      ]
    },
    {
      id: 'm3',
      name: 'Over / Under 2.5',
      category: 'goals',
      outcomes: [
        { id: 'o6', label: 'Over 2.5', odds: 1.85 },
        { id: 'o7', label: 'Under 2.5', odds: 1.95 }
      ]
    },
    {
      id: 'm4',
      name: 'Handicap -1.5',
      category: 'handicaps',
      outcomes: [
        { id: 'o8', label: 'Home -1.5', odds: 2.4 },
        { id: 'o9', label: 'Away +1.5', odds: 1.6 }
      ]
    },
    {
      id: 'm5',
      name: 'Anytime Goalscorer',
      category: 'players',
      outcomes: [
        { id: 'o10', label: 'Player A', odds: 2.9 },
        { id: 'o11', label: 'Player B', odds: 3.6 }
      ]
    },
    {
      id: 'm6',
      name: 'Clean Sheet',
      category: 'other',
      outcomes: [
        { id: 'o12', label: 'Home', odds: 2.4 },
        { id: 'o13', label: 'Away', odds: 2.8 }
      ]
    }
  ])

  const handleTogglePin = (marketId: string) => {
    setMarkets((prev) => {
      const updated = prev.map((m) => (m.id === marketId ? { ...m, pinned: !m.pinned } : m))
      const pinnedList = updated.filter((m) => m.pinned).map((m) => m.id)
      console.log('Pinned markets:', pinnedList)
      return updated
    })
  }

  const handleSelectOutcome = (marketId: string, outcomeId: string) => {
    console.log('Selected outcome', { marketId, outcomeId })
  }

  return (
    <div className="p-4 space-y-4">
      <div className="bg-slate-900 text-white p-4 rounded-xl">
        <h2 className="text-lg font-semibold mb-2">4Play Game Page Example</h2>
        <p className="text-sm text-slate-200 mb-4">
          Tap below to open the markets modal for this match.
        </p>
        <button
          onClick={() => setIsOpen(true)}
          className="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-purple-600 text-white font-semibold hover:bg-purple-500 transition"
        >
          18 more markets
        </button>
      </div>

      {isOpen && (
        <GameMarketsModal
          isOpen={isOpen}
          markets={markets}
          onClose={() => setIsOpen(false)}
          onTogglePin={handleTogglePin}
          onSelectOutcome={handleSelectOutcome}
          matchInfo={{
            homeTeam: 'HJK Helsinki',
            awayTeam: 'KuPS',
            startTime: 'Today • 19:30',
            status: 'Not started'
          }}
        />
      )}
    </div>
  )
}
