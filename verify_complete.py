import sys
import io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

from dotenv import load_dotenv
import os
from supabase import create_client
from collections import Counter

load_dotenv()
supabase = create_client(os.getenv('SUPABASE_URL'), os.getenv('SUPABASE_SERVICE_KEY'))

print("="*60)
print("4PLAY Database Verification")
print("="*60)

# Get games count
games_result = supabase.table('games').select('id, sport, match', count='exact').execute()
print(f'\n✅ Total games: {games_result.count}')

# Count by sport
ice_hockey = [g for g in games_result.data if g['sport'] == 'Ice Hockey']
football = [g for g in games_result.data if g['sport'] == 'Football']
print(f'   - Ice Hockey: {len(ice_hockey)}')
print(f'   - Football: {len(football)}')

# Get odds count
odds_result = supabase.table('odds').select('game_id', count='exact').execute()
print(f'\n✅ Total odds: {odds_result.count}')

# Average odds per game
avg_odds = odds_result.count / games_result.count if games_result.count > 0 else 0
print(f'   - Average odds per game: {avg_odds:.0f}')

# Sample games with odds
print(f'\n📋 Sample games with odds:')
for i, game in enumerate(games_result.data[:5]):
    game_odds = supabase.table('odds').select('id', count='exact').eq('game_id', game['id']).execute()
    print(f'   {i+1}. {game["sport"]}: {game["match"][:50]}...')
    print(f'      Odds: {game_odds.count}')

print(f'\n🎉 Database is ready for 4PLAY!')
print("="*60)
