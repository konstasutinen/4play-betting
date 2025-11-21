'use client'

import { useState } from 'react'
import type { SelectedPick } from '@/types/database.types'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

interface ParlayBuilderProps {
  picks: SelectedPick[]
  onRemovePick: (eventId: string) => void
  onClearAll: () => void
}

export default function ParlayBuilder({ picks, onRemovePick, onClearAll }: ParlayBuilderProps) {
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showSuccess, setShowSuccess] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const totalOdds = picks.reduce((acc, pick) => acc * pick.odd.odd, 1)
  const isComplete = picks.length === 4

  const handleSubmit = async () => {
    if (!isComplete) return

    setSubmitting(true)
    setError(null)

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        setError('You must be logged in to submit a ticket')
        setSubmitting(false)
        return
      }

      // Create parlay (ticket)
      const { data: parlay, error: parlayError } = await supabase
        .from('parlays')
        .insert({
          user_id: user.id,
          status: 'pending',
          total_odds: totalOdds,
        })
        .select()
        .single()

      if (parlayError) throw parlayError

      // Create parlay picks - include event_id from the game
      const pickData = picks.map(pick => ({
        parlay_id: parlay.id,
        game_id: pick.game.id,
        event_id: pick.game.event_id, // Add event_id to fix null constraint error
        market: pick.odd.market,
        option: pick.odd.option,
        odd: pick.odd.odd,
        result: 'pending',
      }))

      const { error: picksError } = await supabase
        .from('parlay_picks')
        .insert(pickData)

      if (picksError) throw picksError

      // Success! Show animation
      setShowSuccess(true)
      setSubmitting(false)

      // Clear picks and redirect after animation
      setTimeout(() => {
        onClearAll()
        setShowSuccess(false)
        router.push('/profile')
        router.refresh()
      }, 2000)
    } catch (err: any) {
      console.error('Submission error:', err)
      setError(err.message || 'Failed to submit ticket')
      setSubmitting(false)
    }
  }

  // Success Animation Overlay
  if (showSuccess) {
    return (
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center">
        <div className="bg-gradient-to-br from-purple-600 to-pink-600 rounded-2xl p-8 text-center animate-scale-in shadow-2xl">
          <div className="text-6xl mb-4">🎉</div>
          <h2 className="text-2xl font-bold text-white mb-2">Ticket Submitted!</h2>
          <p className="text-purple-100">Good luck with your picks!</p>
          <div className="mt-4 flex justify-center">
            <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
          </div>
        </div>
        <style jsx>{`
          @keyframes scale-in {
            from {
              transform: scale(0.5);
              opacity: 0;
            }
            to {
              transform: scale(1);
              opacity: 1;
            }
          }
          .animate-scale-in {
            animation: scale-in 0.3s ease-out;
          }
        `}</style>
      </div>
    )
  }

  if (picks.length === 0) {
    return (
      <div className="fixed bottom-0 left-0 right-0 bg-slate-900/95 backdrop-blur-sm border-t border-slate-700 p-4 z-40">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-slate-400 text-sm">Select 4 picks from different games to create your ticket</p>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-slate-900/95 backdrop-blur-sm border-t border-purple-500/30 z-40">
      <div className="max-w-7xl mx-auto p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-white font-semibold text-sm sm:text-base">
            Your Ticket ({picks.length}/4)
          </h3>
          <button
            onClick={onClearAll}
            className="text-xs text-slate-400 hover:text-white transition"
          >
            Clear All
          </button>
        </div>

        {error && (
          <div className="mb-3 bg-red-500/10 border border-red-500/50 text-red-400 px-3 py-2 rounded text-xs">
            {error}
          </div>
        )}

        <div className="space-y-2 mb-3 max-h-48 overflow-y-auto">
          {picks.map((pick, index) => (
            <div
              key={pick.game.event_id}
              className="flex items-center justify-between bg-slate-800/50 rounded-lg p-3"
            >
              <div className="flex-1 min-w-0">
                <p className="text-xs text-slate-400 truncate">{pick.game.match}</p>
                <p className="text-sm text-white font-medium">
                  {pick.odd.market}: {pick.odd.option}
                </p>
              </div>
              <div className="flex items-center space-x-3 ml-3">
                <span className="text-sm font-bold text-purple-400">{pick.odd.odd.toFixed(2)}</span>
                <button
                  onClick={() => onRemovePick(pick.game.event_id)}
                  className="text-slate-400 hover:text-red-400 transition"
                >
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between gap-4">
          <div className="flex-1">
            <p className="text-xs text-slate-400">Score</p>
            <p className="text-xl font-bold text-purple-400">{totalOdds.toFixed(2)}</p>
          </div>
          <button
            onClick={handleSubmit}
            disabled={!isComplete || submitting}
            className={`
              px-6 py-3 rounded-lg font-semibold transition
              ${isComplete && !submitting
                ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white'
                : 'bg-slate-700 text-slate-400 cursor-not-allowed'
              }
            `}
          >
            {submitting ? 'Submitting...' : isComplete ? 'Submit Ticket' : `Need ${4 - picks.length} more`}
          </button>
        </div>
      </div>
    </div>
  )
}
