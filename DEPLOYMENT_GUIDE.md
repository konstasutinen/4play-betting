# 4PLAY - Vercel Deployment Guide

## Prerequisites

- GitHub account (for deployment)
- Vercel account (free tier is fine)
- Supabase project (already set up)
- Git installed

---

## Step 1: Initialize Git Repository

```bash
cd C:\Users\35844\Parlay\4play
git init
git add .
git commit -m "Initial commit - 4PLAY betting platform"
```

---

## Step 2: Create GitHub Repository

1. Go to https://github.com/new
2. Create a new repository named `4play-betting`
3. **Don't** initialize with README, .gitignore, or license (we have these already)
4. Copy the repository URL

---

## Step 3: Push to GitHub

```bash
git remote add origin https://github.com/YOUR_USERNAME/4play-betting.git
git branch -M main
git push -u origin main
```

---

## Step 4: Deploy to Vercel

### Option A: Deploy via Vercel Dashboard

1. Go to https://vercel.com and sign in
2. Click **"Add New..." → "Project"**
3. Import your GitHub repository `4play-betting`
4. **Configure Project:**
   - **Framework Preset:** Next.js
   - **Root Directory:** `webapp`
   - **Build Command:** `npm run build` (default)
   - **Output Directory:** `.next` (default)

5. **Add Environment Variables:**
   Click "Environment Variables" and add:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://ywgzuxlxccwwfyimxxoz.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl3Z3p1eGx4Y2N3d2Z5aW14eG96Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM2NTI2NjcsImV4cCI6MjA3OTIyODY2N30.-GUDHYLQooUuulW_bgebsVbkQ9kB8ycMpB728Vu04VU
   ```

6. Click **"Deploy"**
7. Wait 2-3 minutes for build to complete
8. Your app will be live at `https://your-project.vercel.app`!

### Option B: Deploy via Vercel CLI

```bash
npm install -g vercel
cd webapp
vercel login
vercel --prod
```

Follow prompts and add environment variables when asked.

---

## Step 5: Configure Custom Domain (Optional)

1. In Vercel dashboard, go to your project
2. Click **"Settings" → "Domains"**
3. Add your custom domain (e.g., `4play.bet`)
4. Follow DNS configuration instructions

---

## Step 6: Update Supabase Auth Settings

1. Go to Supabase Dashboard → **Authentication → URL Configuration**
2. Add your Vercel deployment URL to:
   - **Site URL:** `https://your-project.vercel.app`
   - **Redirect URLs:**
     ```
     https://your-project.vercel.app/auth/callback
     https://your-project.vercel.app/**
     ```

---

## Daily Workflow (Production)

### Morning: Upload Odds

Run locally on your computer:

```bash
cd C:\Users\35844\Parlay\4play
python upload_odds_to_supabase.py
```

This populates your Supabase database with today's games. Users will see them immediately on your live site!

### Evening: Evaluate Parlays

Run locally on your computer:

```bash
cd C:\Users\35844\Parlay\4play
python evaluate_parlays.py
```

This evaluates all pending parlays and updates results.

---

## Continuous Deployment

Vercel automatically redeploys when you push to GitHub:

```bash
git add .
git commit -m "Update feature X"
git push
```

Your site will rebuild and redeploy automatically!

---

## Environment Variables

### Production (Vercel)
- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Your Supabase anon key

### Local Development (webapp/.env.local)
Same as production, but already configured.

### Backend Scripts (.env)
- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_SERVICE_KEY` - Your Supabase service role key (NOT the anon key!)

---

## Monitoring and Logs

### Vercel Logs
- Go to your project → **"Deployments"**
- Click any deployment → **"View Function Logs"**
- Monitor real-time errors and requests

### Supabase Logs
- Go to Supabase Dashboard → **"Logs"**
- Check **Postgres Logs** for database queries
- Check **Auth Logs** for login attempts

---

## Troubleshooting

### Build Fails on Vercel

**Error: "Module not found"**
- Check that all dependencies are in `webapp/package.json`
- Run `npm install` locally first to verify

**Error: "Environment variables missing"**
- Verify environment variables are set in Vercel dashboard
- Make sure they start with `NEXT_PUBLIC_`

### Users Can't Sign Up

**Check Supabase:**
1. Dashboard → **Authentication → Providers**
2. Ensure email provider is enabled
3. Check **URL Configuration** has correct redirect URLs

### No Games Showing

**Possible causes:**
1. Haven't run `upload_odds_to_supabase.py` yet
2. No games scheduled for today
3. Check Supabase Table Editor → **games** table

### Parlays Not Evaluating

**Possible causes:**
1. Haven't run `evaluate_parlays.py` yet
2. Games haven't finished yet
3. Missing Flashscore URLs for games
4. Check Supabase Table Editor → **parlays** and **parlay_picks**

---

## Performance Optimization

### Enable Caching
Vercel automatically caches your pages. To revalidate data more frequently, add to your data fetching:

```typescript
export const revalidate = 60 // Revalidate every 60 seconds
```

### Database Indexes
Already configured in `supabase_schema.sql`:
- Games indexed by `date` and `event_id`
- Odds indexed by `game_id`
- Parlays indexed by `user_id`

---

## Security Checklist

- ✅ `.env` and `.env.local` in `.gitignore`
- ✅ Service role key only used in backend scripts (not in frontend)
- ✅ Anon key used in frontend (safe to expose)
- ✅ RLS policies enabled on all tables
- ✅ User authentication required for all actions
- ✅ HTTPS enforced by Vercel

---

## Scaling Considerations

### Free Tier Limits
- **Vercel:** 100 GB bandwidth/month, unlimited deployments
- **Supabase:** 500 MB database, 2 GB file storage, 50k monthly active users

### When to Upgrade
- If you get 10k+ users, consider Vercel Pro ($20/month)
- If database > 500 MB, upgrade Supabase to Pro ($25/month)

---

## Future Automation (Optional)

### Automated Data Pipeline
Instead of running scripts manually, you could:

1. **GitHub Actions** - Run Python scripts on schedule
2. **Vercel Cron Jobs** - Trigger at specific times
3. **Supabase Edge Functions** - Serverless functions

For MVP, manual execution is fine!

---

## Support

**Vercel Docs:** https://vercel.com/docs
**Supabase Docs:** https://supabase.com/docs
**Next.js Docs:** https://nextjs.org/docs

**Project Issues:** Check your `README.md` troubleshooting section

---

## Success Checklist

After deployment, verify:

- [ ] Can access site at Vercel URL
- [ ] Can sign up new account
- [ ] Can log in with existing account
- [ ] Games appear on home page (after running morning pipeline)
- [ ] Can select picks and create parlay
- [ ] Profile page shows parlay history
- [ ] Leaderboard displays users
- [ ] Mobile responsive (test on phone)
- [ ] Sign out works correctly

---

**You're live! 🎉**

Your 4PLAY betting platform is now deployed and accessible worldwide!
