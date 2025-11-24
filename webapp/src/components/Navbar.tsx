'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import Image from 'next/image'
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
    <nav className="bg-[#05070A]/95 backdrop-blur-sm border-b border-[#1E2430] sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="flex items-center space-x-2">
            <Image
              src="/4PLAY_LOGO_24_11.png"
              alt="4PLAY"
              width={120}
              height={32}
              priority
              className="h-8 w-auto"
            />
            <span className="sr-only">4PLAY</span>
          </Link>

          <div className="flex items-center space-x-6 text-sm font-medium">
            {[
              { href: '/', label: 'Games' },
              { href: '/profile', label: 'Profile' },
              { href: '/leaderboard', label: 'Leaderboard' }
            ].map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`relative pb-1 transition text-white ${
                    isActive ? 'after:absolute after:left-0 after:right-0 after:-bottom-1 after:h-0.5 after:bg-[#0E8BFF]' : 'text-[#A0A8B5] hover:text-white'
                  }`}
                >
                  {item.label}
                </Link>
              )
            })}

            {user ? (
              <button
                onClick={handleSignOut}
                className="text-[#A0A8B5] hover:text-white transition"
              >
                Sign Out
              </button>
            ) : (
              <Link
                href="/auth/login"
                className="text-[#A0A8B5] hover:text-white transition"
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
