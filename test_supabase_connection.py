"""
Test Supabase connection and verify setup
"""

import os
from dotenv import load_dotenv
from supabase import create_client

# Load environment variables
load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY")

if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
    print("❌ Missing environment variables!")
    print("Please create .env file with SUPABASE_URL and SUPABASE_SERVICE_KEY")
    exit(1)

print("=" * 60)
print("4PLAY - Supabase Connection Test")
print("=" * 60)

try:
    # Create client
    print("\n1. Creating Supabase client...")
    supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)
    print("   ✅ Client created")

    # Test games table
    print("\n2. Testing 'games' table...")
    games = supabase.table('games').select('*').limit(1).execute()
    print(f"   ✅ Query successful! Found {len(games.data)} games")

    # Test odds table
    print("\n3. Testing 'odds' table...")
    odds = supabase.table('odds').select('*').limit(1).execute()
    print(f"   ✅ Query successful! Found {len(odds.data)} odds")

    # Test parlays table
    print("\n4. Testing 'parlays' table...")
    parlays = supabase.table('parlays').select('*').limit(1).execute()
    print(f"   ✅ Query successful! Found {len(parlays.data)} parlays")

    # Test parlay_picks table
    print("\n5. Testing 'parlay_picks' table...")
    picks = supabase.table('parlay_picks').select('*').limit(1).execute()
    print(f"   ✅ Query successful! Found {len(picks.data)} picks")

    # Test user_profiles table
    print("\n6. Testing 'user_profiles' table...")
    profiles = supabase.table('user_profiles').select('*').execute()
    print(f"   ✅ Query successful! Found {len(profiles.data)} user profiles")

    # Test leaderboard view
    print("\n7. Testing 'leaderboard' view...")
    leaderboard = supabase.table('leaderboard').select('*').limit(5).execute()
    print(f"   ✅ Query successful! Found {len(leaderboard.data)} users on leaderboard")

    print("\n" + "=" * 60)
    print("🎉 All tests passed! Supabase is configured correctly.")
    print("=" * 60)

    print("\n📊 Database Summary:")
    print(f"   Games: {len(games.data)}")
    print(f"   Odds: {len(odds.data)}")
    print(f"   Parlays: {len(parlays.data)}")
    print(f"   Users: {len(profiles.data)}")

    if len(games.data) == 0:
        print("\n💡 Tip: Run 'python upload_odds_to_supabase.py' to populate games & odds")

except Exception as e:
    print(f"\n❌ Connection test failed: {e}")
    print("\nTroubleshooting:")
    print("1. Check .env file exists and has correct values")
    print("2. Verify Supabase URL and keys are correct")
    print("3. Ensure database schema was run in Supabase SQL Editor")
    print("4. Check Supabase project is running (not paused)")
    exit(1)
