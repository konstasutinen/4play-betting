# 4PLAY - Quick Start Guide

Follow these steps in order to get your 4PLAY betting app up and running.

## Prerequisites

- Python 3.8+ installed
- Node.js 18+ installed
- Git installed (optional but recommended)

---

## Phase 1: Supabase Setup (15 minutes)

### 1. Create Supabase Project

1. Go to https://supabase.com and sign up
2. Create new project: `4play-betting`
3. Save your database password!
4. Wait for initialization (~2 min)

**Detailed instructions**: See `SUPABASE_SETUP_GUIDE.md`

### 2. Run Database Schema

1. Open Supabase Dashboard → **SQL Editor**
2. Copy entire contents of `supabase_schema.sql`
3. Paste and click **Run**
4. Verify success message

### 3. Get Your API Keys

1. Go to **Settings** → **API**
2. Copy:
   - Project URL
   - `anon` `public` key
   - `service_role` key

### 4. Create Environment File

```bash
# In C:\Users\35844\Parlay\4play\
copy .env.example .env
```

Edit `.env` and paste your keys:
```env
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_KEY=your-service-role-key
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 5. Install Python Dependencies

```bash
cd C:\Users\35844\Parlay\4play
pip install -r requirements.txt
```

### 6. Test Connection

```bash
python test_supabase_connection.py
```

**Expected output**:
```
🎉 All tests passed! Supabase is configured correctly.
```

---

## Phase 2: Load Initial Data (5 minutes)

### 7. Run Morning Pipeline

This populates your database with today's games and odds:

```bash
python upload_odds_to_supabase.py
```

**What it does**:
- ✅ Runs Phase 1 API scraper (gets odds from PAF)
- ✅ Runs Phase 2 URL matcher (gets Flashscore URLs)
- ✅ Filters for today's games only
- ✅ Uploads to Supabase database

**Expected output**:
```
✅ Upload complete!
   Games: 25
   Odds: 1,850
```

### 8. Verify in Supabase

1. Go to Supabase Dashboard → **Table Editor**
2. Click **games** table → you should see today's games!
3. Click **odds** table → you should see betting markets

---

## Phase 3: Frontend Setup (Coming Next)

### 9. Initialize Next.js App

```bash
cd C:\Users\35844\Parlay\4play
npx create-next-app@latest webapp --typescript --tailwind --app --src-dir
```

Options:
- ✅ TypeScript: Yes
- ✅ ESLint: Yes
- ✅ Tailwind CSS: Yes
- ✅ `src/` directory: Yes
- ✅ App Router: Yes
- ❌ Import alias: No (default @/*)

### 10. Install Supabase Client

```bash
cd webapp
npm install @supabase/supabase-js @supabase/auth-helpers-nextjs
```

### 11. Configure Environment Variables

Create `webapp/.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 12. Start Development Server

```bash
npm run dev
```

Open http://localhost:3000

---

## Daily Workflow

### Morning (e.g., 8:00 AM)

Run pipeline to load today's games:
```bash
python upload_odds_to_supabase.py
```

Users can now see games and create parlays!

### Evening (e.g., 11:00 PM)

Evaluate parlays after games finish:
```bash
python evaluate_parlays.py
```

Users can see their results!

---

## Troubleshooting

### "Module not found: supabase"
```bash
pip install -r requirements.txt
```

### "Missing environment variables"
- Check `.env` file exists
- Verify keys are correct (no spaces)
- Try restarting terminal

### "No games found"
- Run `upload_odds_to_supabase.py`
- Check games are for today's date
- Verify API scraper ran successfully

### "RLS policy violation"
- Backend scripts: Use `SUPABASE_SERVICE_KEY`
- Frontend: Use `NEXT_PUBLIC_SUPABASE_ANON_KEY`

---

## Project Structure

```
4play/
├── supabase_schema.sql              # Database schema
├── upload_odds_to_supabase.py       # Morning pipeline
├── evaluate_parlays.py              # Evening pipeline
├── test_supabase_connection.py      # Test script
├── requirements.txt                 # Python deps
├── .env                             # Your secrets (don't commit!)
├── .env.example                     # Template
├── README.md                        # Full docs
├── SUPABASE_SETUP_GUIDE.md          # Detailed setup
├── QUICK_START.md                   # This file
└── webapp/                          # Next.js app (to be created)
    ├── src/
    ├── public/
    ├── package.json
    └── .env.local
```

---

## Next Steps

1. ✅ Complete Supabase setup (Phase 1)
2. ✅ Load initial data (Phase 2)
3. ⏳ Build Next.js frontend (Phase 3)
4. ⏳ Deploy to Vercel (Phase 4)

**Ready to build the frontend?** Let me know and I'll create all the Next.js pages and components!

---

## Support

**Issues?** Check:
1. `README.md` - Full documentation
2. `SUPABASE_SETUP_GUIDE.md` - Detailed setup instructions
3. Supabase Docs - https://supabase.com/docs

**Questions?** Feel free to ask!
