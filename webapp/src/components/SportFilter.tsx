'use client'

interface SportFilterProps {
  selected: 'all' | 'Ice Hockey' | 'Football'
  onChange: (sport: 'all' | 'Ice Hockey' | 'Football') => void
}

export default function SportFilter({ selected, onChange }: SportFilterProps) {
  const sports: Array<{ value: 'all' | 'Ice Hockey' | 'Football'; label: string; icon: string }> = [
    { value: 'all', label: 'All Sports', icon: '🎯' },
    { value: 'Ice Hockey', label: 'Ice Hockey', icon: '🏒' },
    { value: 'Football', label: 'Football', icon: '⚽' },
  ]

  return (
    <div className="flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory scrollbar-hide">
      {sports.map((sport) => {
        const isActive = selected === sport.value
        return (
          <button
            key={sport.value}
            onClick={() => onChange(sport.value)}
            className={`
              flex items-center gap-2 px-5 py-2.5 rounded-full font-medium text-sm
              whitespace-nowrap snap-start transition-all duration-200 border
              ${
                isActive
                  ? 'bg-[#0E8BFF] text-white border-transparent'
                  : 'bg-[#141820] text-[#A0A8B5] border-[#252B35] hover:border-[#0E8BFF] hover:text-white'
              }
            `}
          >
            <span className="text-lg">{sport.icon}</span>
            <span>{sport.label}</span>
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
  )
}
