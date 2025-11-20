"""
Aggregation functions for computing game-level and player-level MMI summaries.
"""

import logging
from typing import List, Dict, Optional
from collections import defaultdict
from datetime import datetime
import statistics

from mmi.models import (
    PitchEvent,
    MMIResult,
    PlayerMMISummary,
    LeagueStats,
)
from mmi.mmi_core import MMICalculator
from mmi.scaling import MMIScalerSet

logger = logging.getLogger(__name__)


def compute_game_mmi(
    game_id: str,
    pitches: List[PitchEvent],
    league_stats: LeagueStats,
    role: str = "pitcher",
) -> List[MMIResult]:
    """
    Compute MMI for all pitches in a game.

    Args:
        game_id: MLB game ID
        pitches: List of all pitch events in the game
        league_stats: League normalization parameters
        role: "pitcher" or "batter"

    Returns:
        List of MMIResult objects, one per pitch
    """
    logger.info(f"Computing MMI for game {game_id}, role={role}, pitches={len(pitches)}")

    scaler_set = MMIScalerSet.from_league_stats(league_stats)
    calculator = MMICalculator(scaler_set=scaler_set)

    # Track context across pitches
    pitcher_pitch_counts = defaultdict(int)
    batter_pa_counts = defaultdict(int)
    high_mmi_counts = defaultdict(int)

    results = []

    for pitch in pitches:
        # Build context
        if role == "pitcher":
            pitcher_pitch_counts[pitch.pitcher_id] += 1
            context = {
                "pitches_in_game": pitcher_pitch_counts[pitch.pitcher_id],
                "high_mmi_moments_in_game": high_mmi_counts[pitch.pitcher_id],
            }
        else:  # batter
            batter_pa_counts[pitch.batter_id] += 1
            context = {
                "pas_in_game": batter_pa_counts[pitch.batter_id],
                "high_mmi_moments_in_game": high_mmi_counts[pitch.batter_id],
            }

        # Compute MMI
        result = calculator.compute_pitch_mmi(pitch, role=role, context=context)
        results.append(result)

        # Track high-MMI moments (threshold: 2.0)
        if result.mmi > 2.0:
            player_id = pitch.pitcher_id if role == "pitcher" else pitch.batter_id
            high_mmi_counts[player_id] += 1

    logger.info(f"Computed {len(results)} MMI values for game {game_id}")
    return results


def summarize_mmi_by_player(
    mmi_results: List[MMIResult],
    role: str = "pitcher",
    season: int = None,
    season_type: str = "regular",
) -> List[PlayerMMISummary]:
    """
    Aggregate MMI results by player to create summary statistics.

    Args:
        mmi_results: List of MMIResult objects
        role: "pitcher" or "batter"
        season: Season year
        season_type: "regular" or "postseason"

    Returns:
        List of PlayerMMISummary objects, one per player
    """
    logger.info(f"Summarizing {len(mmi_results)} MMI results by player for role={role}")

    # Group by player
    player_results: Dict[str, List[MMIResult]] = defaultdict(list)
    for result in mmi_results:
        if result.role != role:
            continue
        player_id = result.pitcher_id if role == "pitcher" else result.batter_id
        player_results[player_id].append(result)

    # Compute summaries
    summaries = []

    for player_id, results in player_results.items():
        if not results:
            continue

        # Extract MMI values
        mmi_values = [r.mmi for r in results]
        mmi_values.sort()

        # Unique games
        unique_games = len(set(r.game_id for r in results))

        # Count high-MMI moments
        high_mmi_count = sum(1 for mmi in mmi_values if mmi > 2.0)
        extreme_mmi_count = sum(1 for mmi in mmi_values if mmi > 3.0)

        # Component averages
        avg_leverage = statistics.mean(r.components.leverage_index for r in results)
        avg_pressure = statistics.mean(r.components.pressure_score for r in results)
        avg_fatigue = statistics.mean(r.components.fatigue_score for r in results)
        avg_execution = statistics.mean(r.components.execution_windows for r in results)
        avg_bio = statistics.mean(r.components.bio_proxies for r in results)

        # Calculate percentiles
        n = len(mmi_values)

        def percentile(p):
            if n == 0:
                return 0.0
            k = (n - 1) * p / 100
            f = int(k)
            c = int(k) + 1 if k < n - 1 else f
            return mmi_values[f] + (mmi_values[c] - mmi_values[f]) * (k - f)

        summary = PlayerMMISummary(
            player_id=player_id,
            role=role,
            season=season or datetime.now().year,
            season_type=season_type,
            total_pitches=len(results),
            total_games=unique_games,
            mean_mmi=statistics.mean(mmi_values),
            median_mmi=statistics.median(mmi_values),
            std_mmi=statistics.stdev(mmi_values) if n > 1 else 0.0,
            p10_mmi=percentile(10),
            p25_mmi=percentile(25),
            p75_mmi=percentile(75),
            p90_mmi=percentile(90),
            p95_mmi=percentile(95),
            p99_mmi=percentile(99),
            high_mmi_count=high_mmi_count,
            extreme_mmi_count=extreme_mmi_count,
            avg_leverage=avg_leverage,
            avg_pressure=avg_pressure,
            avg_fatigue=avg_fatigue,
            avg_execution=avg_execution,
            avg_bio=avg_bio,
        )

        summaries.append(summary)

    logger.info(f"Created summaries for {len(summaries)} players")
    return summaries


def compute_season_mmi(
    all_pitches: List[PitchEvent],
    league_stats: LeagueStats,
    role: str = "pitcher",
) -> List[MMIResult]:
    """
    Compute MMI for an entire season's worth of pitches.

    Args:
        all_pitches: All pitch events across multiple games
        league_stats: League normalization parameters
        role: "pitcher" or "batter"

    Returns:
        List of MMIResult objects
    """
    logger.info(f"Computing season MMI for {len(all_pitches)} pitches, role={role}")

    # Group by game
    games: Dict[str, List[PitchEvent]] = defaultdict(list)
    for pitch in all_pitches:
        games[pitch.game_id].append(pitch)

    # Compute MMI for each game
    all_results = []
    for game_id, game_pitches in games.items():
        game_results = compute_game_mmi(game_id, game_pitches, league_stats, role)
        all_results.extend(game_results)

    logger.info(f"Computed {len(all_results)} total MMI values across {len(games)} games")
    return all_results


def get_high_mmi_moments(
    mmi_results: List[MMIResult],
    threshold: float = 2.0,
    limit: int = 50,
) -> List[MMIResult]:
    """
    Get the highest MMI moments from a set of results.

    Args:
        mmi_results: List of MMIResult objects
        threshold: Minimum MMI threshold
        limit: Maximum number of moments to return

    Returns:
        List of top MMI moments, sorted by MMI descending
    """
    # Filter by threshold
    high_moments = [r for r in mmi_results if r.mmi >= threshold]

    # Sort by MMI descending
    high_moments.sort(key=lambda r: r.mmi, reverse=True)

    # Limit
    return high_moments[:limit]


def export_game_mmi_to_dict(
    game_id: str,
    pitches: List[PitchEvent],
    mmi_results: List[MMIResult],
) -> Dict:
    """
    Export game MMI results to a dictionary format suitable for JSON export.

    Args:
        game_id: Game ID
        pitches: Original pitch events
        mmi_results: Computed MMI results

    Returns:
        Dictionary with game data and MMI values
    """
    if len(pitches) != len(mmi_results):
        raise ValueError("Number of pitches and MMI results must match")

    pitch_data = []
    for pitch, result in zip(pitches, mmi_results):
        pitch_dict = {
            "pitch_id": pitch.pitch_id,
            "inning": pitch.inning,
            "pitcher_id": pitch.pitcher_id,
            "pitcher_name": pitch.pitcher_name,
            "batter_id": pitch.batter_id,
            "batter_name": pitch.batter_name,
            "outs": pitch.outs,
            "count": pitch.count.to_string(),
            "base_state": pitch.base_state.to_code(),
            "score_diff": pitch.score_differential,
            "mmi": result.mmi,
            "components": {
                "leverage": result.components.leverage_index,
                "pressure": result.components.pressure_score,
                "fatigue": result.components.fatigue_score,
                "execution": result.components.execution_windows,
                "bio_proxies": result.components.bio_proxies,
            },
            "z_scores": {
                "leverage": result.components.z_leverage,
                "pressure": result.components.z_pressure,
                "fatigue": result.components.z_fatigue,
                "execution": result.components.z_execution,
                "bio": result.components.z_bio,
            },
        }
        pitch_data.append(pitch_dict)

    return {
        "game_id": game_id,
        "total_pitches": len(pitch_data),
        "pitches": pitch_data,
    }


def export_player_summary_to_dict(summary: PlayerMMISummary) -> Dict:
    """
    Export PlayerMMISummary to dictionary.

    Args:
        summary: PlayerMMISummary object

    Returns:
        Dictionary representation
    """
    return {
        "player_id": summary.player_id,
        "player_name": summary.player_name,
        "role": summary.role,
        "season": summary.season,
        "season_type": summary.season_type,
        "stats": {
            "total_pitches": summary.total_pitches,
            "total_games": summary.total_games,
            "mean_mmi": round(summary.mean_mmi, 3),
            "median_mmi": round(summary.median_mmi, 3),
            "std_mmi": round(summary.std_mmi, 3),
        },
        "percentiles": {
            "p10": round(summary.p10_mmi, 3),
            "p25": round(summary.p25_mmi, 3),
            "p75": round(summary.p75_mmi, 3),
            "p90": round(summary.p90_mmi, 3),
            "p95": round(summary.p95_mmi, 3),
            "p99": round(summary.p99_mmi, 3),
        },
        "high_moments": {
            "high_mmi_count": summary.high_mmi_count,
            "extreme_mmi_count": summary.extreme_mmi_count,
        },
        "avg_components": {
            "leverage": round(summary.avg_leverage, 3),
            "pressure": round(summary.avg_pressure, 3),
            "fatigue": round(summary.avg_fatigue, 3),
            "execution": round(summary.avg_execution, 3),
            "bio_proxies": round(summary.avg_bio, 3),
        },
    }
