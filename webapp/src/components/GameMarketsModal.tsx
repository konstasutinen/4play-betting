'use client'

import { useMemo, useState } from 'react'

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

type GameMarketsModalProps = {
  markets: Market[]
  isOpen: boolean
  onClose: () => void
  onTogglePin: (marketId: string) => void
  onSelectOutcome: (marketId: string, outcomeId: string) => void
  matchInfo?: {
    homeTeam: string
    awayTeam: string
    startTime: string
    status?: string
  }
}

const CATEGORY_TABS: { key: Category; label: string }[] = [
  { key: 'popular', label: 'Popular' },
  { key: 'main', label: 'Main' },
  { key: 'goals', label: 'Goals' },
  { key: 'handicaps', label: 'Handicaps' },
  { key: 'players', label: 'Players' },
  { key: 'other', label: 'Other' }
]

const DEFAULT_MAIN_FOR_POPULAR = 3

export default function GameMarketsModal({
  markets,
  isOpen,
  onClose,
  onTogglePin,
  onSelectOutcome,
  matchInfo
}: GameMarketsModalProps) {
  const [activeTab, setActiveTab] = useState<Category>('popular')
  // Track which market accordions are open per tab (allow multiple open)
  const [openMarketIdsByTab, setOpenMarketIdsByTab] = useState<Record<Category, string[]>>({
    popular: [],
    main: [],
    goals: [],
    handicaps: [],
    players: [],
    other: []
  })

  const marketsByTab = useMemo(() => {
    const grouped: Record<Category, Market[]> = {
      popular: [],
      main: [],
      goals: [],
      handicaps: [],
      players: [],
      other: []
    }

    markets.forEach((market) => {
      grouped[market.category].push(market)
    })

    // Popular = pinned + a few key main markets (deduped)
    const pinned = markets.filter((m) => m.pinned)
    const mainDefaults = grouped.main.slice(0, DEFAULT_MAIN_FOR_POPULAR)

    const popularMap = new Map<string, Market>()
    ;[...pinned, ...mainDefaults].forEach((market) => {
      if (!popularMap.has(market.id)) {
        popularMap.set(market.id, market)
      }
    })

    grouped.popular = Array.from(popularMap.values())
    return grouped
  }, [markets])

  if (!isOpen) return null

  const activeMarkets = marketsByTab[activeTab] || []
  const openIdsForTab = openMarketIdsByTab[activeTab] || []

  const handleTabChange = (tab: Category) => {
    setActiveTab(tab)
  }

  const handleToggleAccordion = (marketId: string) => {
    setOpenMarketIdsByTab((prev) => {
      const current = new Set(prev[activeTab] || [])
      if (current.has(marketId)) {
        current.delete(marketId)
      } else {
        current.add(marketId)
      }
      return { ...prev, [activeTab]: Array.from(current) }
    })
  }

  const renderPinIcon = (isPinned: boolean) => (
    <svg
      className={`w-5 h-5 ${isPinned ? 'text-purple-600' : 'text-slate-400'}`}
      fill={isPinned ? 'currentColor' : 'none'}
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M11.48 3.5l1.26 3.86h4.06l-3.28 2.38 1.25 3.86-3.29-2.39-3.29 2.39 1.25-3.86-3.28-2.38h4.06L11.48 3.5z"
      />
    </svg>
  )

  const renderCaret = (isOpen: boolean) => (
    <svg
      className={`w-5 h-5 text-slate-500 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 9l6 6 6-6" />
    </svg>
  )

  return (
    <div className="fixed inset-0 z-50 flex sm:items-center sm:justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full h-full sm:h-auto sm:max-h-[85vh] sm:max-w-4xl bg-slate-900 text-white shadow-2xl rounded-none sm:rounded-2xl flex flex-col border border-slate-800">
        <header className="sticky top-0 z-10 flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-gradient-to-r from-slate-900 to-slate-850">
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="p-2 rounded-full bg-slate-800/70 hover:bg-slate-700 transition-colors border border-slate-700"
              aria-label="Close"
            >
              <svg className="w-5 h-5 text-slate-100" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-white">
                {matchInfo ? `${matchInfo.homeTeam} vs ${matchInfo.awayTeam}` : 'Match details'}
              </span>
              <span className="text-xs text-slate-400">
                {matchInfo
                  ? `${matchInfo.startTime}${matchInfo.status ? ` • ${matchInfo.status}` : ''}`
                  : 'Kickoff time'}
              </span>
            </div>
          </div>
        </header>

        <div className="border-b border-slate-800 bg-slate-900">
          <div className="flex gap-4 overflow-x-auto px-5 pb-2 pt-2 text-sm">
            {CATEGORY_TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => handleTabChange(tab.key)}
                className={`pb-2 whitespace-nowrap border-b-2 transition-colors ${
                  activeTab === tab.key
                    ? 'border-purple-500 text-white font-semibold'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-5 pt-4 pb-6 bg-gradient-to-b from-slate-900 to-slate-950">
          {activeMarkets.length === 0 && (
            <div className="text-center text-slate-400 text-sm py-8">No markets available for this category.</div>
          )}

          {activeMarkets.map((market, index) => {
            const isOpen = openIdsForTab.includes(market.id) || (openIdsForTab.length === 0 && index < 2)

            return (
              <div
                key={market.id}
                className="bg-slate-800/70 rounded-xl mb-3 shadow-md border border-slate-700 overflow-hidden"
              >
                <div
                  role="button"
                  tabIndex={0}
                  className="w-full flex items-center justify-between px-4 py-3 focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500/60"
                  onClick={() => handleToggleAccordion(market.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      handleToggleAccordion(market.id)
                    }
                  }}
                >
                  <span className="text-sm font-semibold text-white">{market.name}</span>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        onTogglePin(market.id)
                      }}
                      className="p-1 rounded-full hover:bg-slate-700"
                      aria-label="Pin market"
                    >
                      {renderPinIcon(Boolean(market.pinned))}
                    </button>
                    <button
                      type="button"
                      onClick={(e) => e.stopPropagation()}
                      className="p-1 rounded-full hover:bg-slate-700"
                      aria-label="Info"
                    >
                      <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8h.01M11 12h1v4h1m-1-12a9 9 0 110 18 9 9 0 010-18z" />
                      </svg>
                    </button>
                    {renderCaret(isOpen)}
                  </div>
                </div>

                {isOpen && (
                  <div className="flex flex-wrap gap-2 px-4 pb-4">
                    {market.outcomes.map((outcome) => (
                      <button
                        key={outcome.id}
                        onClick={() => onSelectOutcome(market.id, outcome.id)}
                        className="flex-1 min-w-[30%] rounded-lg border border-slate-700 px-3 py-2 text-sm font-medium text-center bg-slate-900/60 hover:border-purple-500/70 hover:shadow-lg hover:shadow-purple-500/10 transition"
                      >
                        <div className="text-slate-100">{outcome.label}</div>
                        <div className="text-purple-300 text-xs font-semibold mt-0.5">{outcome.odds.toFixed(2)}</div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
