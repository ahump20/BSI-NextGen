"""
Quickstart example for MMI Baseball package.

This script demonstrates how to:
1. Fetch game data from MLB StatsAPI
2. Compute MMI for all pitches
3. Find high-MMI moments
4. Summarize by player
"""

from datetime import date
from pathlib import Path

from mmi.data_ingest import fetch_game_pitches, fetch_games_by_date
from mmi.scaling import create_default_scalers
from mmi.aggregate import compute_game_mmi, summarize_mmi_by_player, get_high_mmi_moments


def main():
    print("🔥 MMI Baseball - Quickstart Example\n")

    # Step 1: Find games for a specific date
    print("Step 1: Fetching games for June 15, 2024...")
    try:
        game_date = date(2024, 6, 15)
        game_ids = fetch_games_by_date(game_date)

        if not game_ids:
            print("No games found for this date. Try a different date during baseball season.")
            return

        print(f"Found {len(game_ids)} games")
        game_id = game_ids[0]
        print(f"Using game ID: {game_id}\n")

    except Exception as e:
        print(f"Error fetching games: {e}")
        print("Using example game ID instead...")
        game_id = "662253"

    # Step 2: Fetch pitch data
    print("Step 2: Fetching pitch-by-pitch data...")
    try:
        pitches = fetch_game_pitches(game_id)
        print(f"Loaded {len(pitches)} pitches\n")
    except Exception as e:
        print(f"Error fetching pitches: {e}")
        print("This likely means the game ID doesn't exist or API is unavailable.")
        return

    # Step 3: Create scalers (normalization parameters)
    print("Step 3: Creating normalization scalers...")
    scaler_set = create_default_scalers()
    league_stats = scaler_set.to_league_stats()
    print("Using default scalers (fit on typical MLB data)\n")

    # Step 4: Compute MMI for all pitches (pitcher perspective)
    print("Step 4: Computing MMI for all pitches...")
    mmi_results = compute_game_mmi(game_id, pitches, league_stats, role="pitcher")
    print(f"Computed MMI for {len(mmi_results)} pitches\n")

    # Step 5: Find high-MMI moments
    print("Step 5: Top 5 Highest MMI Moments:")
    print("-" * 60)
    high_moments = get_high_mmi_moments(mmi_results, threshold=0.0, limit=5)

    for i, result in enumerate(high_moments, 1):
        pitch = pitches[mmi_results.index(result)]
        print(f"{i}. MMI = {result.mmi:.2f}")
        print(f"   Inning {pitch.inning}, Outs: {pitch.outs}")
        print(f"   Pitcher: {pitch.pitcher_name} vs Batter: {pitch.batter_name}")
        print(f"   Leverage: {result.components.leverage_index:.2f}, "
              f"Pressure: {result.components.pressure_score:.2f}")
        print()

    # Step 6: Player summaries
    print("Step 6: Pitcher Summaries:")
    print("-" * 60)
    summaries = summarize_mmi_by_player(mmi_results, role="pitcher", season=2024)

    for summary in sorted(summaries, key=lambda s: s.mean_mmi, reverse=True)[:5]:
        print(f"Pitcher ID: {summary.player_id}")
        print(f"  Mean MMI: {summary.mean_mmi:.2f}")
        print(f"  P90 MMI: {summary.p90_mmi:.2f}")
        print(f"  High-MMI pitches (>2.0): {summary.high_mmi_count}")
        print(f"  Total pitches: {summary.total_pitches}")
        print()

    print("✅ Quickstart complete!")
    print("\nNext steps:")
    print("  - Fit custom scalers on your own data")
    print("  - Compute MMI from batter perspective")
    print("  - Run validation experiments")
    print("  - Explore the REST API")


if __name__ == "__main__":
    main()
