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
        relative group py-4 px-3 rounded-xl text-center transition-all duration-200 border
        ${
          isSelected
            ? 'bg-[#0E8BFF] border-[#0E8BFF] text-white scale-105'
            : isDisabled
            ? 'bg-[#141820] border-[#1E2430] cursor-not-allowed opacity-50'
            : 'bg-[#141820] border-[#1E2430] hover:border-[#0E8BFF] hover:scale-102'
        }
        disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:shadow-none
      `}
    >
      {/* Selection checkmark */}
      {isSelected && (
        <div className="absolute top-1 right-1 w-5 h-5 bg-white rounded-full flex items-center justify-center">
          <svg className="w-3 h-3 text-[#0E8BFF]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        </div>
      )}

      {/* Option label */}
      <div className={`text-sm font-semibold mb-1 ${isSelected ? 'text-white' : 'text-[#A0A8B5]'}`}>
        {odd.option}
      </div>

      {/* Score value */}
      <div className={`text-2xl font-bold ${isSelected ? 'text-white' : 'text-white'}`}>
        {odd.odd.toFixed(2)}
      </div>
    </button>
  )
}
