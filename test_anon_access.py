import sys
import io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

from dotenv import load_dotenv
import os
from supabase import create_client

load_dotenv()

# Test with anon key (what the frontend uses)
ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl3Z3p1eGx4Y2N3d2Z5aW14eG96Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM2NTI2NjcsImV4cCI6MjA3OTIyODY2N30.-GUDHYLQooUuulW_bgebsVbkQ9kB8ycMpB728Vu04VU'
supabase_anon = create_client(os.getenv('SUPABASE_URL'), ANON_KEY)

print("Testing with ANON key (frontend access):\n")

# Try to fetch games
try:
    games = supabase_anon.table('games').select('id, match').limit(3).execute()
    print(f"✅ Games fetched: {len(games.data)}")

    if games.data:
        game_id = games.data[0]['id']
        match = games.data[0]['match']
        print(f"   First game: {match}")
        print(f"   Game ID: {game_id}\n")

        # Try to fetch odds for this game
        try:
            odds = supabase_anon.table('odds').select('*').eq('game_id', game_id).execute()
            print(f"✅ Odds fetched for first game: {len(odds.data)}")
            if odds.data:
                print(f"   Sample odds:")
                for odd in odds.data[:5]:
                    print(f"     {odd['market']} - {odd['option']}: {odd['odd']}")
            else:
                print(f"   ❌ NO ODDS RETURNED!")
        except Exception as e:
            print(f"❌ Error fetching odds: {e}")
except Exception as e:
    print(f"❌ Error fetching games: {e}")
