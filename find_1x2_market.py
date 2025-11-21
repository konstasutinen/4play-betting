import sys
import io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

from dotenv import load_dotenv
import os
from supabase import create_client

load_dotenv()
supabase = create_client(os.getenv('SUPABASE_URL'), os.getenv('SUPABASE_SERVICE_KEY'))

print("🔍 Checking market names for Football vs Ice Hockey:\n")

# Get a sample football game
print("=" * 60)
print("FOOTBALL GAMES:")
print("=" * 60)
football_games = supabase.table('games').select('id, match').eq('sport', 'Football').limit(2).execute()

for game in football_games.data:
    game_id = game['id']
    match = game['match']

    print(f"\n📋 Match: {match}")
    print(f"   Game ID: {game_id}")

    # Get all odds for this game
    odds = supabase.table('odds').select('market, option, odd').eq('game_id', game_id).execute()

    # Get unique markets
    markets = {}
    for odd in odds.data:
        market = odd['market']
        if market not in markets:
            markets[market] = []
        markets[market].append({'option': odd['option'], 'odd': odd['odd']})

    print(f"   Total markets: {len(markets)}")
    print(f"   Total odds: {len(odds.data)}")

    # Check for Match Odds - Regular Time
    if 'Match Odds - Regular Time' in markets:
        print(f"\n   ✅ HAS 'Match Odds - Regular Time':")
        for opt in markets['Match Odds - Regular Time']:
            print(f"      {opt['option']}: {opt['odd']}")
    else:
        print(f"\n   ❌ NO 'Match Odds - Regular Time' market")
        print(f"\n   Available markets:")
        for market_name in sorted(markets.keys()):
            print(f"      - {market_name} ({len(markets[market_name])} options)")
            # Show options for markets that might be 1X2
            if any(keyword in market_name.lower() for keyword in ['match', 'result', '1x2', 'winner', 'outcome']):
                for opt in markets[market_name]:
                    print(f"         → {opt['option']}: {opt['odd']}")

# Get a sample hockey game
print("\n\n" + "=" * 60)
print("ICE HOCKEY GAMES:")
print("=" * 60)
hockey_games = supabase.table('games').select('id, match').eq('sport', 'Ice Hockey').limit(2).execute()

for game in hockey_games.data:
    game_id = game['id']
    match = game['match']

    print(f"\n📋 Match: {match}")
    print(f"   Game ID: {game_id}")

    # Get all odds for this game
    odds = supabase.table('odds').select('market, option, odd').eq('game_id', game_id).execute()

    # Get unique markets
    markets = {}
    for odd in odds.data:
        market = odd['market']
        if market not in markets:
            markets[market] = []
        markets[market].append({'option': odd['option'], 'odd': odd['odd']})

    print(f"   Total markets: {len(markets)}")
    print(f"   Total odds: {len(odds.data)}")

    # Check for Match Odds - Regular Time
    if 'Match Odds - Regular Time' in markets:
        print(f"\n   ✅ HAS 'Match Odds - Regular Time':")
        for opt in markets['Match Odds - Regular Time']:
            print(f"      {opt['option']}: {opt['odd']}")
    else:
        print(f"\n   ❌ NO 'Match Odds - Regular Time' market")
        print(f"\n   Available markets:")
        for market_name in sorted(markets.keys()):
            print(f"      - {market_name} ({len(markets[market_name])} options)")
