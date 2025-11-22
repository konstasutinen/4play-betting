"""
4PLAY - Evaluate Parlays (Phases 3 & 4)
Runs evening pipeline to scrape results and evaluate pending parlays
"""

import json
import re
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
        .select('*, parlay_picks(*, odds(outcome_id, bet_offer_id), games(*))') \
        .eq('status', 'pending') \
        .execute()

    parlays = response.data
    print(f"   Found {len(parlays)} pending parlays")

    return parlays


def match_pick_to_result(pick: dict, evaluated_bets: list, debug=False) -> str | None:
    """Match a parlay pick to an evaluated bet result using IDs"""

    def derive_match_odds_result(bet: dict, pick_option: str) -> str | None:
        """Override result for Match Odds - Regular Time using final score."""
        if bet.get('market') != 'Match Odds - Regular Time':
            return None

        score_str = bet.get('final_score') or bet.get('regular_score')
        if not score_str:
            return None

        m = re.findall(r'\d+', score_str)
        if len(m) < 2:
            return None

        home_score, away_score = int(m[0]), int(m[1])
        parts = (bet.get('match') or '').split(' - ')
        home_name = parts[0].strip() if len(parts) > 0 else ''
        away_name = parts[1].strip() if len(parts) > 1 else ''

        pick_opt = pick_option.strip()
        is_home_pick = pick_opt in {'1', home_name, 'Home'}
        is_draw_pick = pick_opt in {'X', 'Draw', 'Tie'}
        is_away_pick = pick_opt in {'2', away_name, 'Away'}

        if home_score > away_score:
            return 'won' if is_home_pick else 'lost'
        if home_score < away_score:
            return 'won' if is_away_pick else 'lost'
        # draw
        if is_draw_pick:
            return 'won'
        return 'lost'

    # Get IDs from the pick's odds record (if available)
    pick_outcome_id = pick.get('odds', {}).get('outcome_id') if 'odds' in pick else None
    pick_event_id = pick.get('event_id')

    # Primary matching: Try by outcome_id (most precise)
    if pick_outcome_id:
        for bet in evaluated_bets:
            if bet.get('outcomeId') == pick_outcome_id:
                if debug:
                    print(f"      ✓ Matched by outcome_id: {pick_outcome_id}")
                override = derive_match_odds_result(bet, pick['option'])
                return override or bet['result']  # 'WON', 'LOST', or 'UNKNOWN'

    # Secondary matching: Try by event_id + market + option
    if pick_event_id:
        for bet in evaluated_bets:
            # Convert event_id formats if needed (string vs number)
            bet_event_id = bet.get('eventId')
            if bet_event_id is not None:
                bet_event_str = str(bet_event_id)
                pick_event_str = str(pick_event_id)

                if (bet_event_str == pick_event_str and
                    pick['market'] == bet['market'] and
                    pick['option'] == bet['option']):
                    if debug:
                        print(f"      ✓ Matched by event_id + market + option")
                    override = derive_match_odds_result(bet, pick['option'])
                    return override or bet['result']

    # Fallback matching: Original string matching (for backward compatibility)
    for bet in evaluated_bets:
        if (pick['games']['match'] == bet['match'] and
            pick['market'] == bet['market'] and
            pick['option'] == bet['option']):
            if debug:
                print(f"      ✓ Matched by string matching (fallback)")
            override = derive_match_odds_result(bet, pick['option'])
            return override or bet['result']

    # Debug: print details if no match found
    if debug:
        print(f"      DEBUG: No match found for:")
        print(f"        Pick outcome_id: {pick_outcome_id}")
        print(f"        Pick event_id: {pick_event_id}")
        print(f"        Pick: {pick['games']['match'][:50]} | {pick['market']} | {pick['option']}")

    return None


def evaluate_parlay(parlay: dict, evaluated_bets: list) -> dict:
    """Evaluate a single parlay based on results"""
    picks = parlay['parlay_picks']
    pick_results = []

    first_pick = True
    for pick in picks:
        result = match_pick_to_result(pick, evaluated_bets, debug=first_pick)
        first_pick = False

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
        run_phases_3_4(hours_ago=24.0)  # Adjust based on game times

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
                print(f"   ✅ Parlay {parlay['id'][:8]} - WON (score: {parlay['total_odds']:.2f})")
                # Show the winning picks
                for pick in parlay['parlay_picks']:
                    pick_eval = next((p for p in evaluation['pick_results'] if p['pick_id'] == pick['id']), None)
                    if pick_eval:
                        print(f"      • {pick['games']['match']} - {pick['option']} ({pick['odd']:.2f}) -> {pick_eval['result'].upper()}")
            else:
                lost_count += 1
                print(f"   ❌ Parlay {parlay['id'][:8]} - LOST (score: {parlay['total_odds']:.2f})")
                # Show the losing picks
                for pick in parlay['parlay_picks']:
                    pick_eval = next((p for p in evaluation['pick_results'] if p['pick_id'] == pick['id']), None)
                    if pick_eval:
                        status_icon = "✓" if pick_eval['result'] == 'won' else "✗"
                        print(f"      {status_icon} {pick['games']['match']} - {pick['option']} ({pick['odd']:.2f}) -> {pick_eval['result'].upper()}")

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
