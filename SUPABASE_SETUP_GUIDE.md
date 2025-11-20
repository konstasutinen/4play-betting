# Supabase Setup Guide for 4PLAY

## Step-by-Step Setup Instructions

### Step 1: Create Supabase Account & Project

1. **Go to** https://supabase.com
2. **Click** "Start your project" or "Sign In"
3. **Sign up** with GitHub (recommended) or email
4. **Click** "New Project"
5. **Fill in**:
   - **Project Name**: `4play-betting` (or your preferred name)
   - **Database Password**: Create a strong password (save this!)
   - **Region**: Choose closest to you (e.g., `US East (North Virginia)`)
   - **Pricing Plan**: Free tier is perfect for MVP
6. **Click** "Create new project"
7. **Wait** ~2 minutes for project to initialize

---

### Step 2: Run Database Schema

1. In your Supabase project dashboard, click **"SQL Editor"** in the left sidebar
2. Click **"+ New query"**
3. **Copy the entire contents** of `supabase_schema.sql` from this folder
4. **Paste** into the SQL editor
5. **Click** "Run" (or press Ctrl+Enter)
6. You should see: **"Success. No rows returned"**

**What this creates:**
- ✅ 5 tables (games, odds, parlays, parlay_picks, user_profiles)
- ✅ All indexes for performance
- ✅ Row Level Security (RLS) policies
- ✅ Leaderboard view
- ✅ Auto user profile creation trigger

---

### Step 3: Enable Email Authentication

1. Click **"Authentication"** in left sidebar
2. Click **"Providers"**
3. **Email** should already be enabled by default
4. **Confirm Settings**:
   - ✅ Enable email provider: ON
   - ✅ Confirm email: ON (recommended)
   - ✅ Secure email change: ON (recommended)

**Optional - Email Templates**:
- Go to **"Authentication" > "Email Templates"**
- Customize signup confirmation, password reset emails
- Add your branding (4PLAY logo, colors)

---

### Step 4: Get API Keys

1. Click **"Settings"** (gear icon) in left sidebar
2. Click **"API"**
3. **Copy these values** (you'll need them):

   **Project URL**:
   ```
   https://xxxxxxxxxxxxx.supabase.co
   ```

   **anon public** (for frontend - safe to expose):
   ```
   eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

   **service_role** (for backend scripts - KEEP SECRET!):
   ```
   eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

---

### Step 5: Configure Environment Variables

1. Create `.env` file in `C:\Users\35844\Parlay\4play\`:
   ```bash
   # Copy .env.example to .env
   cp .env.example .env
   ```

2. **Edit `.env`** and fill in your values:
   ```env
   # Supabase Configuration (from Step 4)
   SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
   SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.your-service-role-key

   # Next.js Public Keys (for frontend)
   NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.your-anon-key
   ```

3. **IMPORTANT**: Add `.env` to `.gitignore` (never commit secrets!)

---

### Step 6: Verify Database Setup

Let's verify everything was set up correctly:

1. Go to **"Table Editor"** in Supabase
2. You should see these tables:
   - ✅ `games`
   - ✅ `odds`
   - ✅ `parlays`
   - ✅ `parlay_picks`
   - ✅ `user_profiles`

3. Click on each table and verify columns match the schema

4. Go to **"Database" > "Policies"**
   - You should see RLS policies for each table
   - Games & Odds: SELECT policy (public read)
   - Parlays: SELECT/INSERT/UPDATE (own data only)
   - etc.

---

### Step 7: Test Authentication

1. Go to **"Authentication" > "Users"**
2. Click **"Add user" > "Create new user"**
3. Enter test credentials:
   - Email: `test@4play.com`
   - Password: `TestPassword123!`
   - Auto Confirm User: ✅ ON
4. Click **"Create user"**
5. Check **"Table Editor" > "user_profiles"**
   - You should see a new row with username like `user_xxxxxxxx`
   - This confirms the trigger is working!

---

### Step 8: Install Python Dependencies

```bash
cd C:\Users\35844\Parlay\4play
pip install -r requirements.txt
```

This installs:
- `supabase` - Python client library
- `python-dotenv` - Environment variable loader

---

### Step 9: Test Database Connection

Create a test script to verify everything works:

**File**: `test_supabase_connection.py`

```python
import os
from dotenv import load_dotenv
from supabase import create_client

# Load environment variables
load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY")

# Create client
supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

# Test query
print("Testing Supabase connection...")
result = supabase.table('games').select('*').limit(1).execute()
print(f"✅ Connection successful! Found {len(result.data)} games.")

# Test user profiles
users = supabase.table('user_profiles').select('*').execute()
print(f"✅ Found {len(users.data)} user profiles.")
```

**Run**:
```bash
python test_supabase_connection.py
```

**Expected output**:
```
Testing Supabase connection...
✅ Connection successful! Found 0 games.
✅ Found 1 user profiles.
```

---

## Common Issues & Troubleshooting

### Issue: "relation does not exist"
**Solution**: Re-run the SQL schema in SQL Editor

### Issue: "Row Level Security" blocking queries
**Solutions**:
- Python scripts: Use `SUPABASE_SERVICE_KEY` (bypasses RLS)
- Frontend: Use `NEXT_PUBLIC_SUPABASE_ANON_KEY` (enforces RLS)
- Check policies in Database > Policies

### Issue: Python can't connect
**Check**:
1. `.env` file exists in correct location
2. Keys are copied correctly (no extra spaces)
3. `python-dotenv` is installed

### Issue: User profile not created on signup
**Check**:
1. Trigger exists: Database > Triggers > `on_auth_user_created`
2. Function exists: Database > Functions > `handle_new_user`
3. Re-run schema SQL if missing

---

## Next Steps

Once Supabase is set up and tested:

1. ✅ **Run morning pipeline** to populate games:
   ```bash
   python upload_odds_to_supabase.py
   ```

2. ✅ **Initialize Next.js frontend**:
   ```bash
   cd webapp
   npm install
   npm run dev
   ```

3. ✅ **Open app** at http://localhost:3000

---

## Security Best Practices

### DO:
- ✅ Use `service_role` key only in backend scripts (never in frontend)
- ✅ Use `anon` key in Next.js frontend
- ✅ Keep `.env` file in `.gitignore`
- ✅ Enable email confirmation for production
- ✅ Use RLS policies for data access control

### DON'T:
- ❌ Commit `.env` file to Git
- ❌ Share `service_role` key publicly
- ❌ Disable RLS policies without reason
- ❌ Use same credentials for dev/production

---

## Supabase Dashboard Quick Reference

**Useful Sections**:
- **Table Editor**: View/edit data directly
- **SQL Editor**: Run custom queries
- **Authentication > Users**: Manage users
- **Database > Policies**: View/edit RLS rules
- **Logs > Postgres Logs**: Debug queries
- **Settings > API**: Get keys
- **Settings > Database**: Get connection strings

---

## Support

**Supabase Docs**: https://supabase.com/docs
**Supabase Discord**: https://discord.supabase.com

**4PLAY Specific Issues**: Check README.md troubleshooting section
