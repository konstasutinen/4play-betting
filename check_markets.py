import sys
import io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

from dotenv import load_dotenv
import os
from supabase import create_client

load_dotenv()
supabase = create_client(os.getenv('SUPABASE_URL'), os.getenv('SUPABASE_SERVICE_KEY'))

# Get sample odds with their markets
odds = supabase.table('odds').select('market, option, odd, game_id').limit(1000).execute()

# Get unique markets
markets = set(o['market'] for o in odds.data)
print(f'Total unique markets found: {len(markets)}\n')
print('Sample markets:')
for m in sorted(list(markets))[:20]:
    print(f'  - {m}')

# Check specific game (JYP - Lukko)
games = supabase.table('games').select('id, match').execute()
jyp_game = next((g for g in games.data if 'JYP' in g['match']), None)
if jyp_game:
    print(f'\n\nJYP - Lukko game ID: {jyp_game["id"]}')
    jyp_odds = supabase.table('odds').select('market, option, odd').eq('game_id', jyp_game['id']).execute()
    jyp_markets = {}
    for o in jyp_odds.data:
        if o['market'] not in jyp_markets:
            jyp_markets[o['market']] = []
        jyp_markets[o['market']].append(f"{o['option']} @ {o['odd']}")

    print(f'\nMarkets for JYP - Lukko ({len(jyp_markets)} markets):')
    for market, opts in list(jyp_markets.items())[:5]:
        print(f'\n  {market}:')
        for opt in opts[:3]:
            print(f'    - {opt}')
