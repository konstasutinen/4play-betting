'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import type { User } from '@supabase/supabase-js'

export default function Navbar() {
  const [user, setUser] = useState<User | null>(null)
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
    }

    getUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [supabase.auth])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/auth/login')
    router.refresh()
  }

  // Don't show navbar on auth pages
  if (pathname?.startsWith('/auth')) {
    return null
  }

  return (
    <nav className="bg-slate-900/95 backdrop-blur-sm border-b border-purple-500/20 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="flex items-center space-x-2">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              4PLAY
            </h1>
          </Link>

          <div className="flex items-center space-x-6">
            <Link
              href="/"
              className={`text-sm font-medium transition ${
                pathname === '/' ? 'text-purple-400' : 'text-slate-300 hover:text-white'
              }`}
            >
              Games
            </Link>
            <Link
              href="/profile"
              className={`text-sm font-medium transition ${
                pathname === '/profile' ? 'text-purple-400' : 'text-slate-300 hover:text-white'
              }`}
            >
              Profile
            </Link>
            <Link
              href="/leaderboard"
              className={`text-sm font-medium transition ${
                pathname === '/leaderboard' ? 'text-purple-400' : 'text-slate-300 hover:text-white'
              }`}
            >
              Leaderboard
            </Link>

            {user ? (
              <button
                onClick={handleSignOut}
                className="text-sm font-medium text-slate-300 hover:text-white transition"
              >
                Sign Out
              </button>
            ) : (
              <Link
                href="/auth/login"
                className="text-sm font-medium text-slate-300 hover:text-white transition"
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
