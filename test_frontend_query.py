import sys
import io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

from dotenv import load_dotenv
import os
from supabase import create_client

load_dotenv()

# Use ANON key like the frontend does
ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl3Z3p1eGx4Y2N3d2Z5aW14eG96Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM2NTI2NjcsImV4cCI6MjA3OTIyODY2N30.-GUDHYLQooUuulW_bgebsVbkQ9kB8ycMpB728Vu04VU'
supabase = create_client(os.getenv('SUPABASE_URL'), ANON_KEY)

print("Simulating frontend query with pagination:\n")

# Fetch all odds with pagination like the frontend does
all_odds = []
RANGE_SIZE = 1000
from_idx = 0
has_more = True

while has_more:
    print(f"Fetching range {from_idx} to {from_idx + RANGE_SIZE - 1}...")

    result = supabase.table('odds').select('*').range(from_idx, from_idx + RANGE_SIZE - 1).execute()

    if result.data and len(result.data) > 0:
        all_odds.extend(result.data)
        from_idx += RANGE_SIZE
        has_more = len(result.data) == RANGE_SIZE
        print(f"  Got {len(result.data)} odds, total so far: {len(all_odds)}")
    else:
        has_more = False
        print(f"  No more data")

print(f"\n✅ Total odds fetched: {len(all_odds)}")

# Group by game_id
from collections import Counter
game_odds_count = Counter(odd['game_id'] for odd in all_odds)
print(f"✅ Odds distributed across {len(game_odds_count)} games")
print(f"\nFirst 5 games with their odds count:")
for game_id, count in list(game_odds_count.items())[:5]:
    print(f"  {game_id}: {count} odds")
