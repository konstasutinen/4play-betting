"""
4PLAY - Upload Odds to Supabase (Phases 1 & 2)
Runs morning pipeline to load today's games and odds into Supabase database
"""

import sys
import io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

import json
import subprocess
from datetime import datetime, timedelta, timezone
from pathlib import Path
import os
from dotenv import load_dotenv
from supabase import create_client, Client

# Load environment variables
load_dotenv()

# Supabase configuration
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY")  # Use service role key for admin access

if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
    raise ValueError("Please set SUPABASE_URL and SUPABASE_SERVICE_KEY environment variables")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

# Paths
ODDS_DIR = Path("C:/Users/35844/4Play/odds")
FLASH_URLS_DIR = Path("C:/Users/35844/Parlay/Flash_URLs")
ODDS_JSON_DIR = ODDS_DIR / "Scraped_odds_json"
MATCHED_GAMES_DIR = FLASH_URLS_DIR / "URL_matching_data"


def run_phase1_scraper():
    """Run Phase 1: API Scraper to get odds"""
    print("🚀 Running Phase 1: API Scraper...")
    result = subprocess.run(
        ["npx.cmd", "tsx", "src/api-scraper.ts"],
        cwd=str(ODDS_DIR),
        capture_output=True,
        text=True,
        shell=True,
        encoding='utf-8',
        errors='ignore'
    )

    if result.returncode != 0:
        print(f"❌ Phase 1 failed: {result.stderr}")
        raise Exception("Phase 1 scraper failed")

    print("✅ Phase 1 complete")
    print(result.stdout)


def run_phase2_url_matcher():
    """Run Phase 2: URL Matcher to get Flashscore URLs"""
    print("\n🚀 Running Phase 2: URL Matcher...")
    result = subprocess.run(
        ["node", "match-games-to-urls.js"],
        cwd=str(FLASH_URLS_DIR),
        capture_output=True,
        text=True,
        shell=True,
        encoding='utf-8',
        errors='ignore'
    )

    if result.returncode != 0:
        print(f"❌ Phase 2 failed: {result.stderr}")
        raise Exception("Phase 2 URL matcher failed")

    print("✅ Phase 2 complete")
    print(result.stdout)


def get_latest_file(directory: Path, prefix: str, suffix: str) -> Path:
    """Get the most recent file matching pattern by modification time"""
    files = list(directory.glob(f"{prefix}*{suffix}"))
    if not files:
        raise FileNotFoundError(f"No files found in {directory} matching {prefix}*{suffix}")

    # Sort by modification time (most recent first) instead of alphabetically
    files.sort(key=lambda f: f.stat().st_mtime, reverse=True)
    return files[0]


def load_odds_json() -> list:
    """Load latest odds JSON from Phase 1"""
    print("\n📂 Loading odds data...")
    latest_odds_file = get_latest_file(ODDS_JSON_DIR, "odds_", ".json")
    print(f"   Using: {latest_odds_file.name}")

    with open(latest_odds_file, 'r', encoding='utf-8') as f:
        odds_data = json.load(f)

    print(f"   Loaded {len(odds_data)} betting options")
    return odds_data


def load_matched_games_json() -> dict:
    """Load latest matched games JSON from Phase 2 and index by eventId"""
    print("\n📂 Loading matched games data...")
    try:
        latest_matched_file = get_latest_file(MATCHED_GAMES_DIR, "matched_games_", ".json")
        print(f"   Using: {latest_matched_file.name}")

        with open(latest_matched_file, 'r', encoding='utf-8') as f:
            matched_games = json.load(f)

        # Create dictionary indexed by eventId for O(1) lookup
        matched_dict = {}
        for game in matched_games:
            if 'eventId' in game:
                matched_dict[game['eventId']] = game

        print(f"   Loaded {len(matched_games)} matched games ({len(matched_dict)} with eventId)")
        return matched_dict
    except FileNotFoundError:
        print("   ⚠️  No matched games found - will upload games without Flashscore URLs")
        return {}


def filter_todays_games(odds_data: list) -> dict:
    """Filter odds to only include today's games, grouped by event"""
    print("\n🔍 Filtering for today's games...")

    today = datetime.now().date()
    today_str = today.strftime("%Y-%m-%d")

    # Group by unique event using Kambi eventId
    events = {}

    for bet in odds_data:
        if bet['date'] != today_str:
            continue

        # Use Kambi eventId as the key (it's unique and consistent)
        kambi_event_id = bet.get('eventId')

        if kambi_event_id and kambi_event_id not in events:
            # Use Kambi eventId directly instead of creating hash
            events[kambi_event_id] = {
                'event_id': f"kambi_{kambi_event_id}",  # For Supabase internal ID
                'kambi_event_id': kambi_event_id,  # Store Kambi ID
                'date': bet['date'],
                'time': bet['time'],
                'sport': bet['sport'],
                'league': bet['league'],
                'match': bet['match'],
                'odds': []
            }

        if kambi_event_id:
            events[kambi_event_id]['odds'].append(bet)

    print(f"   Found {len(events)} unique games for today")
    return events


def check_game_availability(game_date: str, game_time: str) -> bool:
    """Check if game is still available (>2 minutes until start)"""
    now = datetime.now(timezone.utc)
    # Parse date and time as UTC
    game_datetime = datetime.strptime(f"{game_date} {game_time}", "%Y-%m-%d %H:%M")
    game_datetime = game_datetime.replace(tzinfo=timezone.utc)

    time_until_start = (game_datetime - now).total_seconds() / 60  # minutes

    return time_until_start > 2


def match_flashscore_url(kambi_event_id: int, match_name: str, matched_games_dict: dict) -> str | None:
    """Find Flashscore URL using Kambi event ID (fast O(1) lookup)

    Args:
        kambi_event_id: Kambi API event ID (primary matching key)
        match_name: Team names as fallback
        matched_games_dict: Dictionary indexed by eventId

    Returns:
        Flashscore URL or None
    """
    # TIER 1: Try to match by Kambi event ID (O(1), most reliable)
    if kambi_event_id and kambi_event_id in matched_games_dict:
        return matched_games_dict[kambi_event_id].get('flashscoreUrl')

    # TIER 2: Fallback to string matching (O(n), less reliable)
    for game in matched_games_dict.values():
        if game.get('match') == match_name:
            return game.get('flashscoreUrl')

    return None


def upload_to_supabase(events: dict, matched_games_dict: dict):
    """Upload games and odds to Supabase using event ID-based matching"""
    import time

    print("\n📤 Uploading to Supabase...")

    # Clear today's games first (this will cascade delete odds due to foreign key)
    today_str = datetime.now().date().strftime("%Y-%m-%d")
    supabase.table('games').delete().eq('date', today_str).execute()
    print("   Cleared existing games for today")

    games_uploaded = 0
    games_skipped = 0
    odds_uploaded = 0
    id_matches = 0
    string_matches = 0
    BATCH_SIZE = 100  # Insert odds in batches

    for kambi_event_id, event in events.items():
        # Check if game is available
        is_available = check_game_availability(event['date'], event['time'])

        # Find Flashscore URL using Kambi event ID (with string fallback)
        flashscore_url = match_flashscore_url(
            kambi_event_id=event.get('kambi_event_id'),
            match_name=event['match'],
            matched_games_dict=matched_games_dict
        )

        # Track match method for debugging
        if flashscore_url:
            if kambi_event_id in matched_games_dict:
                id_matches += 1
            else:
                string_matches += 1

        # Skip games without Flashscore URL
        if not flashscore_url:
            games_skipped += 1
            print(f"   ❌ No match found: {event['league']} - {event['match']}")
            continue

        # Insert game with retry logic
        game_data = {
            'event_id': event['event_id'],
            'kambi_event_id': event.get('kambi_event_id'),  # Store real Kambi event ID
            'date': event['date'],
            'time': event['time'],
            'sport': event['sport'],
            'league': event['league'],
            'match': event['match'],
            'flashscore_url': flashscore_url,
            'is_available': is_available
        }

        try:
            game_response = supabase.table('games').insert(game_data).execute()
            game_id = game_response.data[0]['id']
            games_uploaded += 1
        except Exception as e:
            print(f"   ❌ Failed to upload game: {event['match']} - {str(e)}")
            continue

        # Prepare odds data in batches
        odds_data = []
        for bet in event['odds']:
            odd_data = {
                'game_id': game_id,
                'event_id': event['event_id'],
                'market': bet['market'],
                'option': bet['option'],
                'odd': float(bet['odd']),
                'outcome_id': bet.get('outcomeId'),
                'bet_offer_id': bet.get('betOfferId')
            }
            odds_data.append(odd_data)

        # Insert odds in batches
        for i in range(0, len(odds_data), BATCH_SIZE):
            batch = odds_data[i:i + BATCH_SIZE]
            retry_count = 0
            max_retries = 3

            while retry_count < max_retries:
                try:
                    supabase.table('odds').insert(batch).execute()
                    odds_uploaded += len(batch)
                    break
                except Exception as e:
                    retry_count += 1
                    if retry_count >= max_retries:
                        print(f"   ❌ Failed to upload odds batch for {event['match']} after {max_retries} retries")
                    else:
                        print(f"   ⚠️  Retry {retry_count}/{max_retries} for {event['match']}")
                        time.sleep(2)  # Wait 2 seconds before retrying

        status = "🔒 Locked" if not is_available else "✅ Available"
        print(f"   {status} 🔗 - {event['sport']}: {event['match']} ({len(event['odds'])} odds)")

    print(f"\n✅ Upload complete!")
    print(f"   Games uploaded: {games_uploaded}")
    print(f"   - Matched by event ID: {id_matches}")
    print(f"   - Matched by string: {string_matches}")
    print(f"   Games skipped (no URL): {games_skipped}")
    print(f"   Odds: {odds_uploaded}")


def main():
    """Main pipeline execution"""
    print("=" * 60)
    print("4PLAY - Morning Data Pipeline (Phases 1 & 2)")
    print("=" * 60)

    try:
        # Step 1: Run Phase 1 (API Scraper)
        run_phase1_scraper()

        # Step 2: Run Phase 2 (URL Matcher)
        run_phase2_url_matcher()

        # Step 3: Load data
        odds_data = load_odds_json()
        matched_games = load_matched_games_json()

        # Step 4: Filter and prepare data
        todays_events = filter_todays_games(odds_data)

        # Step 5: Upload to Supabase
        upload_to_supabase(todays_events, matched_games)

        print("\n🎉 Pipeline complete! Data is ready for 4PLAY app.")

    except Exception as e:
        print(f"\n❌ Pipeline failed: {e}")
        raise


if __name__ == "__main__":
    main()
