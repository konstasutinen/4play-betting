-- 4PLAY Betting App - Supabase Database Schema
-- Run this in Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- TABLES
-- ============================================

-- 1. Games table - today's available betting games
CREATE TABLE games (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id TEXT UNIQUE NOT NULL,
  date DATE NOT NULL,
  time TIME NOT NULL,
  sport TEXT NOT NULL CHECK (sport IN ('Ice Hockey', 'Football')),
  league TEXT NOT NULL,
  match TEXT NOT NULL,
  flashscore_url TEXT,
  is_available BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_games_event_id ON games(event_id);
CREATE INDEX idx_games_date ON games(date);
CREATE INDEX idx_games_sport ON games(sport);

-- 2. Odds table - all betting markets and options
CREATE TABLE odds (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  event_id TEXT NOT NULL,
  market TEXT NOT NULL,
  option TEXT NOT NULL,
  odd DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_odds_game_id ON odds(game_id);
CREATE INDEX idx_odds_event_id ON odds(event_id);
CREATE INDEX idx_odds_market ON odds(market);

-- 3. Parlays table - user parlay submissions
CREATE TABLE parlays (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'won', 'lost')),
  evaluated_at TIMESTAMP WITH TIME ZONE,
  total_odds DECIMAL(10, 2) NOT NULL
);

CREATE INDEX idx_parlays_user_id ON parlays(user_id);
CREATE INDEX idx_parlays_status ON parlays(status);
CREATE INDEX idx_parlays_created_at ON parlays(created_at DESC);

-- 4. Parlay picks table - individual picks in a parlay
CREATE TABLE parlay_picks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  parlay_id UUID NOT NULL REFERENCES parlays(id) ON DELETE CASCADE,
  game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  event_id TEXT NOT NULL,
  odds_id UUID NOT NULL REFERENCES odds(id) ON DELETE CASCADE,
  market TEXT NOT NULL,
  option TEXT NOT NULL,
  odd DECIMAL(10, 2) NOT NULL,
  result TEXT CHECK (result IN ('won', 'lost', NULL)),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_parlay_picks_parlay_id ON parlay_picks(parlay_id);
CREATE INDEX idx_parlay_picks_game_id ON parlay_picks(game_id);
CREATE INDEX idx_parlay_picks_event_id ON parlay_picks(event_id);

-- 5. User profiles table - extended user data
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT username_length CHECK (char_length(username) >= 3 AND char_length(username) <= 20)
);

CREATE INDEX idx_user_profiles_username ON user_profiles(username);

-- ============================================
-- VIEWS
-- ============================================

-- Leaderboard view - user stats
CREATE OR REPLACE VIEW leaderboard AS
SELECT
  up.id,
  up.username,
  COUNT(p.id) AS total_parlays,
  COUNT(CASE WHEN p.status = 'won' THEN 1 END) AS wins,
  COUNT(CASE WHEN p.status = 'lost' THEN 1 END) AS losses,
  ROUND(
    CASE
      WHEN COUNT(CASE WHEN p.status IN ('won', 'lost') THEN 1 END) > 0
      THEN (COUNT(CASE WHEN p.status = 'won' THEN 1 END)::DECIMAL /
            COUNT(CASE WHEN p.status IN ('won', 'lost') THEN 1 END)::DECIMAL) * 100
      ELSE 0
    END,
    2
  ) AS win_rate
FROM user_profiles up
LEFT JOIN parlays p ON up.id = p.user_id
GROUP BY up.id, up.username;

-- ============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

-- Enable RLS on all tables
ALTER TABLE games ENABLE ROW LEVEL SECURITY;
ALTER TABLE odds ENABLE ROW LEVEL SECURITY;
ALTER TABLE parlays ENABLE ROW LEVEL SECURITY;
ALTER TABLE parlay_picks ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Games policies (public read)
CREATE POLICY "Games are viewable by everyone"
  ON games FOR SELECT
  USING (true);

-- Odds policies (public read)
CREATE POLICY "Odds are viewable by everyone"
  ON odds FOR SELECT
  USING (true);

-- Parlays policies
CREATE POLICY "Users can view their own parlays"
  ON parlays FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own parlays"
  ON parlays FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own parlays"
  ON parlays FOR UPDATE
  USING (auth.uid() = user_id);

-- Parlay picks policies
CREATE POLICY "Users can view their own parlay picks"
  ON parlay_picks FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM parlays
      WHERE parlays.id = parlay_picks.parlay_id
      AND parlays.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their own parlay picks"
  ON parlay_picks FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM parlays
      WHERE parlays.id = parlay_picks.parlay_id
      AND parlays.user_id = auth.uid()
    )
  );

-- User profiles policies
CREATE POLICY "User profiles are viewable by everyone"
  ON user_profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can insert their own profile"
  ON user_profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON user_profiles FOR UPDATE
  USING (auth.uid() = id);

-- ============================================
-- FUNCTIONS
-- ============================================

-- Function to create user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, username)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', 'user_' || substring(NEW.id::text from 1 for 8))
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to calculate parlay total odds
CREATE OR REPLACE FUNCTION calculate_parlay_total_odds(parlay_uuid UUID)
RETURNS DECIMAL AS $$
DECLARE
  total DECIMAL := 1.0;
  pick_odd DECIMAL;
BEGIN
  FOR pick_odd IN
    SELECT odd FROM parlay_picks WHERE parlay_id = parlay_uuid
  LOOP
    total := total * pick_odd;
  END LOOP;
  RETURN ROUND(total, 2);
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- SAMPLE DATA (for testing - remove in production)
-- ============================================

-- This is just example data structure - will be populated by Python script
/*
INSERT INTO games (event_id, date, time, sport, league, match, flashscore_url)
VALUES
  ('1012345678', '2025-11-20', '19:00', 'Ice Hockey', 'NHL', 'Boston Bruins - Toronto Maple Leafs', 'https://www.flashscore.com/match/...'),
  ('1012345679', '2025-11-20', '20:00', 'Football', 'Premier League', 'Manchester United - Liverpool', 'https://www.flashscore.com/match/...');
*/

-- Grant necessary permissions to authenticated users
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
