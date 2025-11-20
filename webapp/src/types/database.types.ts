export interface Game {
  id: string
  event_id: string
  date: string
  time: string
  sport: 'Ice Hockey' | 'Football'
  league: string
  match: string
  flashscore_url: string | null
  is_available: boolean
  created_at: string
}

export interface Odd {
  id: string
  game_id: string
  market: string
  option: string
  odd: number
  created_at: string
}

export interface GameWithOdds extends Game {
  odds: Odd[]
}

export interface Parlay {
  id: string
  user_id: string
  status: 'pending' | 'won' | 'lost'
  total_odds: number
  created_at: string
}

export interface ParlayPick {
  id: string
  parlay_id: string
  game_id: string
  market: string
  option: string
  odd: number
  result: 'won' | 'lost' | 'pending' | null
  created_at: string
}

export interface ParlayWithPicks extends Parlay {
  parlay_picks: (ParlayPick & { games: Game })[]
}

export interface UserProfile {
  id: string
  username: string
  created_at: string
}

export interface LeaderboardEntry {
  user_id: string
  username: string
  total_parlays: number
  wins: number
  losses: number
  win_rate: number
}

export interface SelectedPick {
  game: Game
  odd: Odd
}
