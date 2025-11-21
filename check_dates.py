import sys
import io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

from dotenv import load_dotenv
import os
from supabase import create_client
from datetime import datetime

load_dotenv()
supabase = create_client(os.getenv('SUPABASE_URL'), os.getenv('SUPABASE_SERVICE_KEY'))

# Get sample games
games = supabase.table('games').select('date, match').limit(5).execute()
print('Sample dates in database:')
for g in games.data:
    print(f'  {g["date"]} - {g["match"][:50]}')

# Check what JavaScript would query
today_js = datetime.now().date().isoformat()
print(f'\nJavaScript query would use: {today_js}')

# Check how many games match today
today_games = supabase.table('games').select('id', count='exact').eq('date', today_js).execute()
print(f'\nGames matching "{today_js}": {today_games.count}')

# Check all unique dates in database
all_games = supabase.table('games').select('date').execute()
unique_dates = set(g['date'] for g in all_games.data)
print(f'\nUnique dates in database: {unique_dates}')
