'use client'

import { useState } from 'react'
import type { SelectedPick } from '@/types/database.types'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

interface TicketBarProps {
  picks: SelectedPick[]
  onRemovePick: (eventId: string) => void
  onClearAll: () => void
}

export default function TicketBar({ picks, onRemovePick, onClearAll }: TicketBarProps) {
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showSuccess, setShowSuccess] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const totalScore = picks.reduce((acc, pick) => acc * pick.odd.odd, 1)
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
          total_odds: totalScore,
        })
        .select()
        .single()

      if (parlayError) throw parlayError

      // Create parlay picks - include event_id and odds_id
      const pickData = picks.map(pick => ({
        parlay_id: parlay.id,
        game_id: pick.game.id,
        event_id: pick.game.event_id,
        odds_id: pick.odd.id,
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
    } catch (err) {
      console.error('Submission error:', err)
      const message = err instanceof Error ? err.message : 'Failed to submit ticket'
      setError(message)
      setSubmitting(false)
    }
  }

  // Success Animation Overlay
  if (showSuccess) {
    return (
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-gradient-to-br from-purple-600 to-pink-600 rounded-3xl p-10 text-center animate-scale-in shadow-2xl max-w-md w-full">
          <div className="text-7xl mb-6">🎉</div>
          <h2 className="text-3xl font-bold text-white mb-3">Ticket Submitted!</h2>
          <p className="text-purple-100 text-lg">Good luck with your picks!</p>
          <div className="mt-6 flex justify-center">
            <div className="w-14 h-14 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
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
            animation: scale-in 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          }
        `}</style>
      </div>
    )
  }

  // Empty state
  if (picks.length === 0) {
    return (
      <div className="fixed bottom-0 left-0 right-0 bg-slate-900/95 backdrop-blur-sm border-t border-slate-700/50 p-4 z-40">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-slate-400 text-sm">Select 4 picks to complete your ticket</p>
          {/* Progress dots */}
          <div className="flex justify-center gap-2 mt-3">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="w-2 h-2 rounded-full bg-slate-700"
              />
            ))}
          </div>
        </div>
      </div>
    )
  }

  // Mobile: Bottom bar (compact or expanded)
  return (
    <>
      {/* Mobile View */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-slate-900/98 backdrop-blur-md border-t border-purple-500/30 z-40 shadow-2xl">
        {/* Compact bar */}
        {!expanded && (
          <button
            onClick={() => setExpanded(true)}
            className="w-full p-4 flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="flex gap-1.5">
                {[...Array(4)].map((_, i) => (
                  <div
                    key={i}
                    className={`w-2 h-2 rounded-full transition-all ${
                      i < picks.length
                        ? 'bg-gradient-to-r from-purple-500 to-pink-500'
                        : 'bg-slate-700'
                    }`}
                  />
                ))}
              </div>
              <span className="text-white font-semibold">
                Your Ticket ({picks.length}/4)
              </span>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <div className="text-xs text-slate-400">Score</div>
                <div className="text-lg font-bold text-purple-400">{totalScore.toFixed(2)}</div>
              </div>
              <svg className="w-5 h-5 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
              </svg>
            </div>
          </button>
        )}

        {/* Expanded view */}
        {expanded && (
          <div className="max-h-96 overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b border-slate-700/50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex gap-1.5">
                  {[...Array(4)].map((_, i) => (
                    <div
                      key={i}
                      className={`w-2 h-2 rounded-full transition-all ${
                        i < picks.length
                          ? 'bg-gradient-to-r from-purple-500 to-pink-500'
                          : 'bg-slate-700'
                      }`}
                    />
                  ))}
                </div>
                <h3 className="text-white font-semibold">Your Ticket ({picks.length}/4)</h3>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={onClearAll}
                  className="text-xs text-slate-400 hover:text-white transition"
                >
                  Clear All
                </button>
                <button
                  onClick={() => setExpanded(false)}
                  className="text-purple-400"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              </div>
            </div>

            {error && (
              <div className="mx-4 mt-4 bg-red-500/10 border border-red-500/50 text-red-400 px-3 py-2 rounded-lg text-xs">
                {error}
              </div>
            )}

            {/* Picks list */}
            <div className="max-h-64 overflow-y-auto p-4 space-y-2">
              {picks.map((pick) => (
                <div
                  key={pick.game.event_id}
                  className="flex items-center justify-between bg-slate-800/50 rounded-xl p-3 group"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-slate-400 truncate">{pick.game.match}</p>
                    <p className="text-sm text-white font-medium mt-0.5">
                      {pick.odd.option}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 ml-3">
                    <span className="text-lg font-bold text-purple-400">{pick.odd.odd.toFixed(2)}</span>
                    <button
                      onClick={() => onRemovePick(pick.game.event_id)}
                      className="text-slate-500 hover:text-red-400 transition opacity-0 group-hover:opacity-100"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Footer with score and submit */}
            <div className="p-4 border-t border-slate-700/50 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-slate-400 text-sm">Total Score</span>
                <span className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                  {totalScore.toFixed(2)}
                </span>
              </div>
              <button
                onClick={handleSubmit}
                disabled={!isComplete || submitting}
                className={`
                  w-full py-4 rounded-xl font-bold text-lg transition-all duration-200
                  ${isComplete && !submitting
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg shadow-purple-500/50 hover:scale-105 animate-pulse-slow'
                    : 'bg-slate-700 text-slate-400 cursor-not-allowed'
                  }
                `}
              >
                {submitting ? 'Submitting...' : isComplete ? 'Submit Ticket' : `Need ${4 - picks.length} more picks`}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Desktop View: Right sidebar */}
      <div className="hidden lg:block fixed top-20 right-8 w-96 bg-slate-900/95 backdrop-blur-md border border-purple-500/30 rounded-2xl shadow-2xl z-40">
        {/* Header */}
        <div className="p-6 border-b border-slate-700/50">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-white">Your Ticket</h3>
            <button
              onClick={onClearAll}
              className="text-xs text-slate-400 hover:text-white transition"
            >
              Clear All
            </button>
          </div>
          {/* Progress dots */}
          <div className="flex gap-2">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className={`flex-1 h-1.5 rounded-full transition-all ${
                  i < picks.length
                    ? 'bg-gradient-to-r from-purple-500 to-pink-500'
                    : 'bg-slate-700'
                }`}
              />
            ))}
          </div>
        </div>

        {error && (
          <div className="mx-6 mt-4 bg-red-500/10 border border-red-500/50 text-red-400 px-3 py-2 rounded-lg text-xs">
            {error}
          </div>
        )}

        {/* Picks list */}
        <div className="max-h-96 overflow-y-auto p-6 space-y-3">
          {picks.map((pick) => (
            <div
              key={pick.game.event_id}
              className="flex items-start justify-between bg-slate-800/50 rounded-xl p-4 group hover:bg-slate-800/70 transition"
            >
              <div className="flex-1 min-w-0">
                <p className="text-xs text-slate-400 mb-1">{pick.game.match}</p>
                <p className="text-sm text-white font-semibold">{pick.odd.option}</p>
                <p className="text-xs text-slate-500 mt-1">{pick.odd.market}</p>
              </div>
              <div className="flex flex-col items-end gap-2 ml-3">
                <span className="text-xl font-bold text-purple-400">{pick.odd.odd.toFixed(2)}</span>
                <button
                  onClick={() => onRemovePick(pick.game.event_id)}
                  className="text-slate-500 hover:text-red-400 transition"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-700/50 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-slate-400">Total Score</span>
            <span className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              {totalScore.toFixed(2)}
            </span>
          </div>
          <button
            onClick={handleSubmit}
            disabled={!isComplete || submitting}
            className={`
              w-full py-4 rounded-xl font-bold text-lg transition-all duration-200
              ${isComplete && !submitting
                ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg shadow-purple-500/50 hover:scale-105'
                : 'bg-slate-700 text-slate-400 cursor-not-allowed'
              }
            `}
          >
            {submitting ? 'Submitting...' : isComplete ? 'Submit Ticket' : `Select ${4 - picks.length} more`}
          </button>
        </div>
      </div>

      <style jsx>{`
        @keyframes pulse-slow {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.9;
          }
        }
        .animate-pulse-slow {
          animation: pulse-slow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
      `}</style>
    </>
  )
}
