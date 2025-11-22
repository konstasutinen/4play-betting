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
  // Track which market accordion is open per tab
  const [openMarketIdByTab, setOpenMarketIdByTab] = useState<Record<Category, string | null>>({
    popular: null,
    main: null,
    goals: null,
    handicaps: null,
    players: null,
    other: null
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
  const requestedOpenId = openMarketIdByTab[activeTab]
  const openMarketId = activeMarkets.some((m) => m.id === requestedOpenId)
    ? requestedOpenId
    : activeMarkets[0]?.id ?? null

  const handleTabChange = (tab: Category) => {
    setActiveTab(tab)
  }

  const handleToggleAccordion = (marketId: string) => {
    setOpenMarketIdByTab((prev) => ({
      ...prev,
      [activeTab]: prev[activeTab] === marketId ? null : marketId
    }))
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
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      <div className="relative w-full h-full sm:h-auto sm:max-h-[80vh] sm:max-w-3xl bg-white shadow-2xl rounded-none sm:rounded-2xl flex flex-col">
        <header className="sticky top-0 z-10 flex items-center justify-between border-b px-4 py-3 bg-white">
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-slate-100 transition-colors"
              aria-label="Close"
            >
              <svg className="w-5 h-5 text-slate-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-slate-900">
                {matchInfo ? `${matchInfo.homeTeam} vs ${matchInfo.awayTeam}` : 'Match details'}
              </span>
              <span className="text-xs text-slate-500">
                {matchInfo
                  ? `${matchInfo.startTime}${matchInfo.status ? ` • ${matchInfo.status}` : ''}`
                  : 'Kickoff time'}
              </span>
            </div>
          </div>
        </header>

        <div className="border-b bg-white">
          <div className="flex gap-4 overflow-x-auto px-4 pb-2 pt-1 text-sm">
            {CATEGORY_TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => handleTabChange(tab.key)}
                className={`pb-2 whitespace-nowrap border-b-2 ${
                  activeTab === tab.key
                    ? 'border-slate-900 text-slate-900 font-semibold'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 pt-3 pb-6 bg-white">
          {activeMarkets.length === 0 && (
            <div className="text-center text-slate-500 text-sm py-8">No markets available for this category.</div>
          )}

          {activeMarkets.map((market) => {
            const isOpen = openMarketId === market.id

            return (
              <div key={market.id} className="bg-gray-50 rounded-xl mb-3 shadow-sm border border-slate-200 overflow-hidden">
                <div
                  role="button"
                  tabIndex={0}
                  className="w-full flex items-center justify-between px-4 py-3 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-300"
                  onClick={() => handleToggleAccordion(market.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      handleToggleAccordion(market.id)
                    }
                  }}
                >
                  <span className="text-sm font-semibold text-slate-900">{market.name}</span>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        onTogglePin(market.id)
                      }}
                      className="p-1 rounded-full hover:bg-white"
                      aria-label="Pin market"
                    >
                      {renderPinIcon(Boolean(market.pinned))}
                    </button>
                    <button
                      type="button"
                      onClick={(e) => e.stopPropagation()}
                      className="p-1 rounded-full hover:bg-white"
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
                        className="flex-1 min-w-[30%] rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-center bg-white hover:border-slate-300 hover:shadow-sm transition"
                      >
                        <div className="text-slate-800">{outcome.label}</div>
                        <div className="text-slate-500 text-xs font-semibold mt-0.5">{outcome.odds.toFixed(2)}</div>
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
