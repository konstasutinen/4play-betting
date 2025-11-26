'use client'

interface LeagueFilterProps {
  sport: 'all' | 'Ice Hockey' | 'Football'
  availableLeagues: { name: string; count: number }[]
  selected: string[]
  onChange: (leagues: string[]) => void
}

export default function LeagueFilter({ availableLeagues, selected, onChange }: LeagueFilterProps) {
  if (availableLeagues.length === 0) {
    return null
  }

  const toggleLeague = (leagueName: string) => {
    if (selected.includes(leagueName)) {
      onChange(selected.filter(l => l !== leagueName))
    } else {
      onChange([...selected, leagueName])
    }
  }

  return (
    <div className="mb-6">
      <h3 className="text-sm font-semibold text-[#A0A8B5] uppercase tracking-wide mb-3">
        Filter by League
      </h3>
      <div className="flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory scrollbar-hide">
        {availableLeagues.map((league) => {
          const isActive = selected.includes(league.name)
          return (
            <button
              key={league.name}
              onClick={() => toggleLeague(league.name)}
              className={`
                flex items-center gap-2 px-4 py-2 rounded-full font-medium text-sm
                whitespace-nowrap snap-start transition-all duration-200 border
                ${
                  isActive
                    ? 'bg-[#0E8BFF] text-white border-transparent'
                    : 'bg-[#141820] text-[#A0A8B5] border-[#252B35] hover:border-[#0E8BFF] hover:text-white'
                }
              `}
            >
              <span>{league.name}</span>
              <span className="text-xs opacity-75">({league.count})</span>
            </button>
          )
        })}
        <style jsx>{`
          .scrollbar-hide::-webkit-scrollbar {
            display: none;
          }
          .scrollbar-hide {
            -ms-overflow-style: none;
            scrollbar-width: none;
          }
        `}</style>
      </div>
    </div>
  )
}
