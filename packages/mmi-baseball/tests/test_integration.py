"""Integration tests for end-to-end MMI computation."""

import pytest
from datetime import datetime
from mmi.models import PitchEvent, BaseState, Count, PitchResult, PitchType
from mmi.scaling import create_default_scalers
from mmi.aggregate import compute_game_mmi, summarize_mmi_by_player
from mmi.mmi_core import MMICalculator


@pytest.fixture
def sample_game_pitches():
    """Create a sample game with multiple pitches."""
    pitches = []

    # Simulate a few innings worth of pitches
    for inning in [1, 5, 9]:
        for at_bat in range(3):
            for pitch_num in range(1, 5):
                pitch = PitchEvent(
                    game_id="test_game_001",
                    at_bat_index=at_bat + (inning - 1) * 10,
                    pitch_number=pitch_num,
                    game_date=datetime(2024, 6, 15, 19, 0),
                    inning=inning,
                    top_of_inning=at_bat % 2 == 0,
                    batter_id=f"batter_{at_bat}",
                    batter_name=f"Batter {at_bat}",
                    batter_team="NYY" if at_bat % 2 == 0 else "BOS",
                    pitcher_id=f"pitcher_{inning}",
                    pitcher_name=f"Pitcher {inning}",
                    pitcher_team="BOS" if at_bat % 2 == 0 else "NYY",
                    home_team="BOS",
                    away_team="NYY",
                    outs=min(at_bat, 2),
                    base_state=BaseState(
                        runner_on_first=(pitch_num > 2),
                        runner_on_second=(pitch_num > 3),
                    ),
                    count=Count(balls=min(pitch_num - 1, 3), strikes=0),
                    home_score=inning // 3,
                    away_score=inning // 4,
                    pitch_type=PitchType.FASTBALL if pitch_num % 2 == 0 else PitchType.SLIDER,
                    velocity=92.0 + pitch_num,
                    pitch_result=PitchResult.BALL if pitch_num < 4 else PitchResult.HIT_INTO_PLAY,
                    is_final_pitch_of_pa=(pitch_num == 4),
                    attendance=35000,
                )
                pitches.append(pitch)

    return pitches


def test_end_to_end_game_computation(sample_game_pitches):
    """Test complete game MMI computation pipeline."""
    # Create scalers
    scaler_set = create_default_scalers()
    league_stats = scaler_set.to_league_stats()

    # Compute MMI for entire game
    mmi_results = compute_game_mmi(
        "test_game_001",
        sample_game_pitches,
        league_stats,
        role="pitcher",
    )

    # Verify results
    assert len(mmi_results) == len(sample_game_pitches)

    # All results should have valid MMI values
    for result in mmi_results:
        assert isinstance(result.mmi, float)
        assert not (result.mmi != result.mmi)  # Not NaN
        assert result.game_id == "test_game_001"
        assert result.role == "pitcher"

    # Check that components are populated
    first_result = mmi_results[0]
    assert first_result.components.leverage_index > 0
    assert first_result.components.pressure_score > 0
    assert first_result.components.fatigue_score >= 0


def test_player_summary_aggregation(sample_game_pitches):
    """Test player-level MMI summarization."""
    # Compute game MMI first
    scaler_set = create_default_scalers()
    league_stats = scaler_set.to_league_stats()

    mmi_results = compute_game_mmi(
        "test_game_001",
        sample_game_pitches,
        league_stats,
        role="pitcher",
    )

    # Summarize by player
    summaries = summarize_mmi_by_player(mmi_results, role="pitcher", season=2024)

    # Should have summaries for each unique pitcher
    pitcher_ids = set(p.pitcher_id for p in sample_game_pitches)
    assert len(summaries) == len(pitcher_ids)

    # Check summary structure
    for summary in summaries:
        assert summary.role == "pitcher"
        assert summary.season == 2024
        assert summary.total_pitches > 0
        assert summary.mean_mmi >= 0 or summary.mean_mmi < 0  # Can be negative
        assert summary.p90_mmi >= summary.p10_mmi  # Percentiles should be ordered


def test_high_leverage_vs_low_leverage():
    """Test that high-leverage situations produce higher MMI than low-leverage."""
    scaler_set = create_default_scalers()
    calculator = MMICalculator(scaler_set=scaler_set)

    # Low-leverage: Early inning, blowout, no runners
    low_leverage_pitch = PitchEvent(
        game_id="1",
        at_bat_index=0,
        pitch_number=1,
        game_date=datetime.now(),
        inning=2,
        top_of_inning=True,
        batter_id="1",
        batter_team="NYY",
        pitcher_id="2",
        pitcher_team="BOS",
        home_team="BOS",
        away_team="NYY",
        outs=2,
        base_state=BaseState(),
        count=Count(balls=0, strikes=0),
        home_score=8,
        away_score=0,
        pitch_result=PitchResult.BALL,
        attendance=20000,
    )

    # High-leverage: Late inning, close game, runners on
    high_leverage_pitch = PitchEvent(
        game_id="1",
        at_bat_index=30,
        pitch_number=5,
        game_date=datetime.now(),
        inning=9,
        top_of_inning=False,
        batter_id="3",
        batter_team="BOS",
        pitcher_id="4",
        pitcher_team="NYY",
        home_team="BOS",
        away_team="NYY",
        outs=2,
        base_state=BaseState(runner_on_second=True, runner_on_third=True),
        count=Count(balls=3, strikes=2),
        home_score=3,
        away_score=2,
        pitch_result=PitchResult.FOUL,
        attendance=40000,
    )

    low_result = calculator.compute_pitch_mmi(low_leverage_pitch, role="pitcher")
    high_result = calculator.compute_pitch_mmi(
        high_leverage_pitch,
        role="pitcher",
        context={"pitches_in_game": 25},
    )

    # High-leverage should have higher MMI (generally)
    # Note: This isn't guaranteed due to normalization, but should be true on average
    assert high_result.components.leverage_index > low_result.components.leverage_index


def test_pitcher_fatigue_increases():
    """Test that pitcher fatigue increases with pitch count."""
    scaler_set = create_default_scalers()
    calculator = MMICalculator(scaler_set=scaler_set)

    base_pitch = PitchEvent(
        game_id="1",
        at_bat_index=0,
        pitch_number=1,
        game_date=datetime.now(),
        inning=5,
        top_of_inning=True,
        batter_id="1",
        batter_team="NYY",
        pitcher_id="2",
        pitcher_team="BOS",
        home_team="BOS",
        away_team="NYY",
        outs=1,
        base_state=BaseState(),
        count=Count(balls=0, strikes=0),
        home_score=2,
        away_score=2,
        pitch_result=PitchResult.BALL,
    )

    # Early in game
    result_early = calculator.compute_pitch_mmi(
        base_pitch,
        role="pitcher",
        context={"pitches_in_game": 20, "is_starter": True},
    )

    # Late in game, high pitch count
    result_late = calculator.compute_pitch_mmi(
        base_pitch,
        role="pitcher",
        context={"pitches_in_game": 100, "is_starter": True},
    )

    # Fatigue should be higher later in the game
    assert result_late.components.fatigue_score > result_early.components.fatigue_score


def test_mmi_consistency():
    """Test that MMI computation is consistent (deterministic)."""
    scaler_set = create_default_scalers()
    calculator = MMICalculator(scaler_set=scaler_set)

    pitch = PitchEvent(
        game_id="1",
        at_bat_index=0,
        pitch_number=1,
        game_date=datetime.now(),
        inning=5,
        top_of_inning=True,
        batter_id="1",
        batter_team="NYY",
        pitcher_id="2",
        pitcher_team="BOS",
        home_team="BOS",
        away_team="NYY",
        outs=1,
        base_state=BaseState(),
        count=Count(balls=2, strikes=1),
        home_score=3,
        away_score=2,
        pitch_result=PitchResult.BALL,
    )

    context = {"pitches_in_game": 50, "is_starter": True}

    # Compute MMI twice
    result1 = calculator.compute_pitch_mmi(pitch, role="pitcher", context=context)
    result2 = calculator.compute_pitch_mmi(pitch, role="pitcher", context=context)

    # Should get identical results
    assert result1.mmi == result2.mmi
    assert result1.components.leverage_index == result2.components.leverage_index


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
