# 4PLAY - Parlay Betting Platform

A modern betting platform where users create 4-pick parlays from today's ice hockey and football games.

## 🎯 Overview

**Concept**: Users must pick exactly 4 bets from different games (unique EventIDs). All 4 picks must win for the parlay to win.

**Tech Stack**:
- **Frontend**: Next.js 14 (TypeScript + Tailwind CSS)
- **Backend**: Supabase (Postgres + Auth)
- **Hosting**: Vercel
- **Data Pipeline**: Python scripts (local execution)

---

## 📁 Project Structure

```
4play/
├── supabase_schema.sql          # Database schema
├── upload_odds_to_supabase.py   # Morning pipeline (Phases 1 & 2)
├── evaluate_parlays.py          # Evening pipeline (Phases 3 & 4)
├── requirements.txt             # Python dependencies
├── .env.example                 # Environment variables template
├── README.md                    # This file
└── webapp/                      # Next.js application (to be created)
```

---

## 🚀 Setup Instructions

### 1. Supabase Setup

1. Create a new Supabase project at https://supabase.com
2. Go to SQL Editor and run `supabase_schema.sql`
3. Enable email authentication in Authentication settings
4. Copy your project URL and keys

### 2. Environment Variables

1. Copy `.env.example` to `.env`
2. Fill in your Supabase credentials:
   ```bash
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_SERVICE_KEY=your-service-role-key
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   ```

### 3. Python Dependencies

```bash
pip install -r requirements.txt
```

### 4. Next.js Application (Coming Next)

```bash
cd webapp
npm install
npm run dev
```

---

## 🔄 Data Pipeline

### Morning: Upload Odds (Phases 1 & 2)

**Run**: `python upload_odds_to_supabase.py`

**What it does**:
1. Executes Phase 1 API scraper → gets odds from PAF/Kambi API
2. Executes Phase 2 URL matcher → gets Flashscore URLs for games
3. Filters games for today only
4. Uploads games + odds to Supabase
5. Marks games starting in <2 minutes as unavailable

**When to run**: Every morning before users start picking (e.g., 8:00 AM)

### Evening: Evaluate Parlays (Phases 3 & 4)

**Run**: `python evaluate_parlays.py`

**What it does**:
1. Executes Phases 3 & 4 → scrapes results from Flashscore + evaluates bets
2. Loads pending parlays from database
3. Matches parlay picks to actual results
4. Updates parlay status (won/lost)

**When to run**: After games finish (e.g., 11:00 PM, or multiple times throughout evening)

---

## 📊 Database Schema

### Core Tables

1. **games** - Available games for today
   - event_id, date, time, sport, league, match
   - flashscore_url (for results scraping)
   - is_available (false if <2min to start)

2. **odds** - All betting markets
   - game_id, market, option, odd

3. **parlays** - User parlay submissions
   - user_id, status (pending/won/lost), total_odds

4. **parlay_picks** - Individual picks
   - parlay_id, game_id, market, option, odd, result

5. **user_profiles** - User data
   - username, created_at

### Leaderboard View

Automatically calculated view showing:
- username, total_parlays, wins, losses, win_rate

---

## 🎨 Features

### MVP (Phase 1)
- ✅ User authentication (email/password)
- ✅ View today's games (filtered by sport)
- ✅ See primary market (Match Odds - Regular Time 1X2)
- ✅ Expand to view all ~60 markets per game
- ✅ Build 4-pick parlay (unique EventIDs enforced)
- ✅ Submit parlay
- ✅ View parlay history
- ✅ Leaderboard (wins, win rate)
- ✅ Mobile-responsive design

### Future Enhancements
- Real-time odds updates
- Push notifications for results
- Social features (share parlays)
- Advanced analytics
- Live betting (games in progress)

---

## 🔐 Security

- Row Level Security (RLS) enabled on all tables
- Users can only view/modify their own parlays
- Service role key used only for data pipeline scripts
- Anon key used for frontend (read-only games/odds, authenticated writes)

---

## 📱 Mobile Design

- Mobile-first approach
- Sticky parlay builder at bottom
- Touch-friendly UI (min 44px tap targets)
- Dark mode support
- Responsive breakpoints: mobile (< 768px), tablet (768-1024px), desktop (> 1024px)

---

## 🐛 Troubleshooting

### Pipeline Issues

**Upload script fails**:
- Check Supabase credentials in `.env`
- Ensure Phase 1 & 2 scrapers are working
- Verify paths to JSON files are correct

**Evaluation script finds no results**:
- Check if games have finished
- Adjust `hours_ago` parameter in script
- Verify Flashscore URLs exist for games

### Database Issues

**RLS blocking queries**:
- Use service role key for admin operations
- Check RLS policies in Supabase dashboard

**Duplicate event_id errors**:
- Clear today's games before upload
- Script already handles this automatically

---

## 📝 Development Roadmap

- [x] Database schema design
- [x] Python data pipeline scripts
- [ ] Next.js frontend initialization
- [ ] Home page (game listings)
- [ ] Parlay builder component
- [ ] Profile page
- [ ] Leaderboard page
- [ ] API routes
- [ ] Authentication flow
- [ ] Vercel deployment
- [ ] Production testing

---

## 📄 License

MIT License - Educational/Personal Use

**Disclaimer**: This is a fun project for educational purposes. Always gamble responsibly and check local gambling regulations.
