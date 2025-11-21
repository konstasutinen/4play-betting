import sys
import io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

from dotenv import load_dotenv
import os
from supabase import create_client

load_dotenv()
supabase = create_client(os.getenv('SUPABASE_URL'), os.getenv('SUPABASE_SERVICE_KEY'))

# Get first 5 games
games = supabase.table('games').select('id, match').limit(5).execute()

print('First 5 games - checking for Match Odds - Regular Time:\n')

for g in games.data:
    game_id = g['id']
    match = g['match']

    # Get Match Odds - Regular Time for this game
    match_odds = supabase.table('odds').select('market, option, odd').eq('game_id', game_id).eq('market', 'Match Odds - Regular Time').execute()

    # Get total odds for this game
    all_odds = supabase.table('odds').select('id', count='exact').eq('game_id', game_id).execute()

    print(f"Match: {match[:50]}")
    print(f"  Game ID: {game_id}")
    print(f"  Total odds: {all_odds.count}")
    print(f"  Match Odds - Regular Time: {len(match_odds.data)}")
    if match_odds.data:
        for odd in match_odds.data:
            print(f"    {odd['option']}: {odd['odd']}")
    else:
        # Show what markets this game has
        sample_markets = supabase.table('odds').select('market').eq('game_id', game_id).limit(5).execute()
        print(f"  Sample markets available:")
        for m in sample_markets.data:
            print(f"    - {m['market']}")
    print()
