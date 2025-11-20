"""
Command-line interface for MMI package.

Provides commands for fetching games, computing MMI, and generating summaries.
"""

import argparse
import json
import logging
import sys
from datetime import date, datetime
from pathlib import Path
from typing import Optional

from mmi.data_ingest import (
    MLBStatsAPIClient,
    MLBDataParser,
    fetch_game_pitches,
    fetch_games_by_date,
)
from mmi.scaling import MMIScalerSet, create_default_scalers
from mmi.aggregate import (
    compute_game_mmi,
    summarize_mmi_by_player,
    export_game_mmi_to_dict,
    export_player_summary_to_dict,
)
from mmi.mmi_core import MMICalculator

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)


def cmd_fetch_games(args):
    """Fetch games for a specific date."""
    try:
        game_date = date.fromisoformat(args.date)
    except ValueError:
        logger.error(f"Invalid date format: {args.date}. Use YYYY-MM-DD")
        return 1

    team_id = int(args.team) if args.team else None

    try:
        client = MLBStatsAPIClient()
        game_ids = fetch_games_by_date(game_date, team_id=team_id, api_client=client)

        print(f"Found {len(game_ids)} games on {args.date}")
        for game_id in game_ids:
            print(f"  - {game_id}")

        if args.out:
            output = {"date": args.date, "game_ids": game_ids}
            with open(args.out, "w") as f:
                json.dump(output, f, indent=2)
            print(f"\nSaved to {args.out}")

        return 0

    except Exception as e:
        logger.error(f"Error fetching games: {e}")
        return 1


def cmd_compute_game(args):
    """Compute MMI for a single game."""
    game_id = args.game_id
    role = args.role

    try:
        # Fetch pitch data
        logger.info(f"Fetching data for game {game_id}")
        pitches = fetch_game_pitches(game_id)

        if not pitches:
            logger.error(f"No pitches found for game {game_id}")
            return 1

        logger.info(f"Found {len(pitches)} pitches")

        # Load or create scalers
        if args.scalers:
            scaler_path = Path(args.scalers)
            if not scaler_path.exists():
                logger.error(f"Scalers file not found: {args.scalers}")
                return 1
            scaler_set = MMIScalerSet.load(scaler_path)
            logger.info(f"Loaded scalers from {args.scalers}")
        else:
            logger.warning("No scalers provided, using defaults")
            scaler_set = create_default_scalers()

        league_stats = scaler_set.to_league_stats()

        # Compute MMI
        logger.info(f"Computing MMI for role={role}")
        mmi_results = compute_game_mmi(game_id, pitches, league_stats, role=role)

        # Export results
        output_data = export_game_mmi_to_dict(game_id, pitches, mmi_results)

        # Add summary stats
        mmi_values = [r.mmi for r in mmi_results]
        output_data["summary"] = {
            "mean_mmi": sum(mmi_values) / len(mmi_values),
            "max_mmi": max(mmi_values),
            "min_mmi": min(mmi_values),
            "high_mmi_count": sum(1 for mmi in mmi_values if mmi > 2.0),
        }

        # Save to file
        output_path = Path(args.out)
        output_format = output_path.suffix.lower()

        if output_format == ".json":
            with open(output_path, "w") as f:
                json.dump(output_data, f, indent=2)
            logger.info(f"Saved JSON to {output_path}")

        elif output_format in [".parquet", ".pq"]:
            try:
                import pandas as pd

                # Convert to DataFrame
                df = pd.DataFrame(output_data["pitches"])
                df.to_parquet(output_path, index=False)
                logger.info(f"Saved Parquet to {output_path}")

            except ImportError:
                logger.error("pandas and pyarrow required for Parquet export")
                return 1

        else:
            # Default to JSON
            with open(output_path, "w") as f:
                json.dump(output_data, f, indent=2)
            logger.info(f"Saved JSON to {output_path}")

        print(f"\nProcessed game {game_id}")
        print(f"Total pitches: {len(pitches)}")
        print(f"Mean MMI: {output_data['summary']['mean_mmi']:.3f}")
        print(f"Max MMI: {output_data['summary']['max_mmi']:.3f}")
        print(f"High-MMI moments (>2.0): {output_data['summary']['high_mmi_count']}")

        return 0

    except Exception as e:
        logger.error(f"Error computing game MMI: {e}", exc_info=True)
        return 1


def cmd_summarize_season(args):
    """Summarize MMI by player for a season."""
    # This would typically load pre-computed MMI results
    # For now, we'll provide a stub implementation

    print(f"Season summary for {args.year}, role={args.role}")
    print("Note: This command requires pre-computed MMI results.")
    print(f"Load MMI results from {args.input} and generate player summaries.")

    # TODO: Implement full season aggregation
    logger.warning("Season summarization not fully implemented yet")

    return 0


def cmd_fit_scalers(args):
    """Fit normalization scalers from training data."""
    input_path = Path(args.input)

    if not input_path.exists():
        logger.error(f"Input file not found: {args.input}")
        return 1

    try:
        # Load pitch data (JSON format expected)
        with open(input_path, "r") as f:
            data = json.load(f)

        # Extract MMI component values
        # This assumes data has already been processed through feature extraction
        logger.info(f"Loading training data from {input_path}")

        # TODO: Extract component values from training data
        # For now, create default scalers
        scaler_set = create_default_scalers()

        # Save scalers
        output_path = Path(args.out)
        scaler_set.save(output_path)

        print(f"Fitted scalers saved to {output_path}")
        return 0

    except Exception as e:
        logger.error(f"Error fitting scalers: {e}")
        return 1


def main():
    """Main CLI entry point."""
    parser = argparse.ArgumentParser(
        description="MMI Baseball - Moment Mentality Index Calculator",
        formatter_class=argparse.RawDescriptionHelpFormatter,
    )

    subparsers = parser.add_subparsers(dest="command", help="Command to run")

    # Fetch games command
    fetch_parser = subparsers.add_parser(
        "fetch-games",
        help="Fetch game IDs for a specific date",
    )
    fetch_parser.add_argument(
        "--date",
        required=True,
        help="Date in YYYY-MM-DD format",
    )
    fetch_parser.add_argument(
        "--team",
        help="Optional team ID to filter",
    )
    fetch_parser.add_argument(
        "--out",
        help="Output file for game IDs (JSON)",
    )

    # Compute game command
    compute_parser = subparsers.add_parser(
        "compute-game",
        help="Compute MMI for a single game",
    )
    compute_parser.add_argument(
        "--game-id",
        required=True,
        help="MLB game ID",
    )
    compute_parser.add_argument(
        "--role",
        choices=["pitcher", "batter"],
        default="pitcher",
        help="Role to compute MMI for",
    )
    compute_parser.add_argument(
        "--scalers",
        help="Path to scalers JSON file",
    )
    compute_parser.add_argument(
        "--out",
        required=True,
        help="Output file (.json, .parquet)",
    )

    # Summarize season command
    summarize_parser = subparsers.add_parser(
        "summarize-season",
        help="Summarize MMI by player for a season",
    )
    summarize_parser.add_argument(
        "--year",
        required=True,
        type=int,
        help="Season year",
    )
    summarize_parser.add_argument(
        "--role",
        choices=["pitcher", "batter"],
        default="pitcher",
        help="Role to summarize",
    )
    summarize_parser.add_argument(
        "--input",
        required=True,
        help="Input file with MMI results",
    )
    summarize_parser.add_argument(
        "--out",
        required=True,
        help="Output file (.csv, .json)",
    )

    # Fit scalers command
    fit_parser = subparsers.add_parser(
        "fit-scalers",
        help="Fit normalization scalers from training data",
    )
    fit_parser.add_argument(
        "--input",
        required=True,
        help="Input training data file (JSON)",
    )
    fit_parser.add_argument(
        "--out",
        required=True,
        help="Output scalers file (JSON)",
    )

    # Parse args
    args = parser.parse_args()

    if not args.command:
        parser.print_help()
        return 1

    # Dispatch to command handler
    if args.command == "fetch-games":
        return cmd_fetch_games(args)
    elif args.command == "compute-game":
        return cmd_compute_game(args)
    elif args.command == "summarize-season":
        return cmd_summarize_season(args)
    elif args.command == "fit-scalers":
        return cmd_fit_scalers(args)
    else:
        logger.error(f"Unknown command: {args.command}")
        return 1


if __name__ == "__main__":
    sys.exit(main())
