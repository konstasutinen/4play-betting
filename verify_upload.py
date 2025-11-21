import sys
import io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

from dotenv import load_dotenv
import os
from supabase import create_client

load_dotenv()
supabase = create_client(os.getenv('SUPABASE_URL'), os.getenv('SUPABASE_SERVICE_KEY'))

# Get all games
games = supabase.table('games').select('id, sport, match').execute()
print(f'\nTotal games in database: {len(games.data)}')

# Count by sport
ice_hockey = [g for g in games.data if g['sport'] == 'Ice Hockey']
football = [g for g in games.data if g['sport'] == 'Football']
print(f'Ice Hockey games: {len(ice_hockey)}')
print(f'Football games: {len(football)}')

# Get odds count
odds = supabase.table('odds').select('id').execute()
print(f'\nTotal odds in database: {len(odds.data)}')

# Sample games
print(f'\nSample games:')
for g in games.data[:5]:
    print(f'  - {g["sport"]}: {g["match"]}')
