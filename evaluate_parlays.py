"""
4PLAY - Evaluate Parlays (Phases 3 & 4)
Runs evening pipeline to scrape results and evaluate pending parlays
"""

import json
import subprocess
from datetime import datetime
from pathlib import Path
import os
from supabase import create_client, Client

# Supabase configuration
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY")

if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
    raise ValueError("Please set SUPABASE_URL and SUPABASE_SERVICE_KEY environment variables")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

# Paths
FLASH_URLS_DIR = Path("C:/Users/35844/Parlay/Flash_URLs")
RESULTS_DIR = FLASH_URLS_DIR / "Results_and_Evaluations"


def run_phases_3_4(hours_ago: float = 3.0):
    """Run Phases 3 & 4: Scrape results and evaluate bets"""
    print(f"🚀 Running Phases 3 & 4 (games from {hours_ago} hours ago)...")

    result = subprocess.run(
        ["node", "run-phases-3-4.js", str(hours_ago)],
        cwd=str(FLASH_URLS_DIR),
        capture_output=True,
        text=True
    )

    if result.returncode != 0:
        print(f"❌ Phases 3 & 4 failed: {result.stderr}")
        raise Exception("Phases 3 & 4 failed")

    print("✅ Phases 3 & 4 complete")
    print(result.stdout)


def get_latest_results() -> tuple[list, list]:
    """Load latest results and evaluated bets from Phases 3 & 4"""
    print("\n📂 Loading evaluation results...")

    # Find latest results file
    results_files = list(RESULTS_DIR.glob("results_*.json"))
    if not results_files:
        raise FileNotFoundError("No results files found")

    latest_results = sorted(results_files, reverse=True)[0]
    print(f"   Using results: {latest_results.name}")

    # Find corresponding evaluated bets file
    timestamp = latest_results.stem.replace("results_", "")
    evaluated_bets_file = RESULTS_DIR / f"evaluated_bets_{timestamp}.json"

    if not evaluated_bets_file.exists():
        raise FileNotFoundError(f"Evaluated bets file not found: {evaluated_bets_file}")

    print(f"   Using evaluations: {evaluated_bets_file.name}")

    with open(latest_results, 'r', encoding='utf-8') as f:
        results = json.load(f)

    with open(evaluated_bets_file, 'r', encoding='utf-8') as f:
        evaluated_bets = json.load(f)

    print(f"   Loaded {len(results)} results and {len(evaluated_bets)} evaluated bets")

    return results, evaluated_bets


def get_pending_parlays() -> list:
    """Fetch all pending parlays from database"""
    print("\n🔍 Fetching pending parlays...")

    response = supabase.table('parlays') \
        .select('*, parlay_picks(*, odds(*), games(*))') \
        .eq('status', 'pending') \
        .execute()

    parlays = response.data
    print(f"   Found {len(parlays)} pending parlays")

    return parlays


def match_pick_to_result(pick: dict, evaluated_bets: list) -> str | None:
    """Match a parlay pick to an evaluated bet result"""
    # Try matching by event_id, match name, market, and option
    for bet in evaluated_bets:
        # Match by game details
        if (pick['games']['match'] == bet['match'] and
            pick['market'] == bet['market'] and
            pick['option'] == bet['option']):
            return bet['result']  # 'WON', 'LOST', or 'UNKNOWN'

    return None


def evaluate_parlay(parlay: dict, evaluated_bets: list) -> dict:
    """Evaluate a single parlay based on results"""
    picks = parlay['parlay_picks']
    pick_results = []

    for pick in picks:
        result = match_pick_to_result(pick, evaluated_bets)

        if result is None:
            # No result found - game probably hasn't finished yet
            return {
                'status': 'pending',
                'pick_results': []
            }

        pick_results.append({
            'pick_id': pick['id'],
            'result': result.lower()  # 'won' or 'lost'
        })

    # Determine parlay status
    all_won = all(pr['result'] == 'won' for pr in pick_results)
    parlay_status = 'won' if all_won else 'lost'

    return {
        'status': parlay_status,
        'pick_results': pick_results
    }


def update_parlay_results(parlay_id: str, evaluation: dict):
    """Update parlay and pick results in database"""
    # Update parlay status
    supabase.table('parlays').update({
        'status': evaluation['status'],
        'evaluated_at': datetime.now().isoformat()
    }).eq('id', parlay_id).execute()

    # Update individual pick results
    for pick_result in evaluation['pick_results']:
        supabase.table('parlay_picks').update({
            'result': pick_result['result']
        }).eq('id', pick_result['pick_id']).execute()


def main():
    """Main evaluation pipeline"""
    print("=" * 60)
    print("4PLAY - Evening Evaluation Pipeline (Phases 3 & 4)")
    print("=" * 60)

    try:
        # Step 1: Run Phases 3 & 4 to get results
        run_phases_3_4(hours_ago=3.0)  # Adjust based on game times

        # Step 2: Load results
        results, evaluated_bets = get_latest_results()

        # Step 3: Get pending parlays
        parlays = get_pending_parlays()

        if not parlays:
            print("\n✅ No pending parlays to evaluate")
            return

        # Step 4: Evaluate each parlay
        print("\n🎲 Evaluating parlays...\n")

        won_count = 0
        lost_count = 0
        still_pending = 0

        for parlay in parlays:
            evaluation = evaluate_parlay(parlay, evaluated_bets)

            if evaluation['status'] == 'pending':
                still_pending += 1
                print(f"   ⏳ Parlay {parlay['id'][:8]} - Still pending (games not finished)")
                continue

            # Update database
            update_parlay_results(parlay['id'], evaluation)

            if evaluation['status'] == 'won':
                won_count += 1
                print(f"   ✅ Parlay {parlay['id'][:8]} - WON (odds: {parlay['total_odds']})")
            else:
                lost_count += 1
                print(f"   ❌ Parlay {parlay['id'][:8]} - LOST")

        print(f"\n📊 Evaluation Summary:")
        print(f"   Won: {won_count}")
        print(f"   Lost: {lost_count}")
        print(f"   Still Pending: {still_pending}")

        print("\n🎉 Evaluation complete!")

    except Exception as e:
        print(f"\n❌ Evaluation failed: {e}")
        raise


if __name__ == "__main__":
    main()
