'use client'

import type { Odd } from '@/types/database.types'

interface OutcomeButtonProps {
  odd: Odd
  isSelected: boolean
  isDisabled: boolean
  onClick: () => void
}

export default function OutcomeButton({ odd, isSelected, isDisabled, onClick }: OutcomeButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={isDisabled}
      className={`
        relative group py-4 px-3 rounded-xl text-center transition-all duration-200
        ${
          isSelected
            ? 'bg-gradient-to-br from-purple-600 to-pink-600 shadow-lg shadow-purple-500/40 scale-105'
            : isDisabled
            ? 'bg-slate-800/30 cursor-not-allowed opacity-50'
            : 'bg-slate-800/60 hover:bg-slate-700 hover:scale-105 hover:shadow-xl hover:shadow-purple-500/20'
        }
        disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:shadow-none
      `}
    >
      {/* Selection checkmark */}
      {isSelected && (
        <div className="absolute top-1 right-1 w-5 h-5 bg-white rounded-full flex items-center justify-center">
          <svg className="w-3 h-3 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        </div>
      )}

      {/* Option label */}
      <div className={`text-sm font-semibold mb-1 ${isSelected ? 'text-white' : 'text-slate-300'}`}>
        {odd.option}
      </div>

      {/* Score value */}
      <div className={`text-2xl font-bold ${isSelected ? 'text-white' : 'text-purple-400'}`}>
        {odd.odd.toFixed(2)}
      </div>
    </button>
  )
}
