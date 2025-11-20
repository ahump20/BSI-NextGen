"""Tests for data models."""

import pytest
from datetime import datetime
from mmi.models import (
    PitchEvent,
    BaseState,
    Count,
    PitchType,
    PitchResult,
    MMIComponents,
)


def test_base_state_creation():
    """Test BaseState model."""
    base_state = BaseState(runner_on_first=True, runner_on_second=False, runner_on_third=True)
    assert base_state.runner_on_first is True
    assert base_state.runner_on_second is False
    assert base_state.runner_on_third is True


def test_base_state_to_code():
    """Test base state code generation."""
    base_state = BaseState(runner_on_first=True, runner_on_second=True, runner_on_third=False)
    assert base_state.to_code() == "12_"

    empty_bases = BaseState()
    assert empty_bases.to_code() == "___"

    bases_loaded = BaseState(runner_on_first=True, runner_on_second=True, runner_on_third=True)
    assert bases_loaded.to_code() == "123"


def test_base_state_runners_on_base():
    """Test counting runners on base."""
    base_state = BaseState(runner_on_first=True, runner_on_second=True, runner_on_third=False)
    assert base_state.runners_on_base() == 2

    empty = BaseState()
    assert empty.runners_on_base() == 0


def test_count_creation():
    """Test Count model."""
    count = Count(balls=3, strikes=2)
    assert count.balls == 3
    assert count.strikes == 2
    assert count.to_string() == "3-2"


def test_count_hitters_count():
    """Test hitter's count detection."""
    assert Count(balls=3, strikes=0).is_hitters_count()
    assert Count(balls=3, strikes=1).is_hitters_count()
    assert Count(balls=2, strikes=0).is_hitters_count()
    assert not Count(balls=0, strikes=2).is_hitters_count()


def test_count_pitchers_count():
    """Test pitcher's count detection."""
    assert Count(balls=0, strikes=2).is_pitchers_count()
    assert Count(balls=1, strikes=2).is_pitchers_count()
    assert not Count(balls=3, strikes=0).is_pitchers_count()


def test_pitch_event_creation():
    """Test PitchEvent model creation."""
    pitch = PitchEvent(
        game_id="662253",
        at_bat_index=0,
        pitch_number=1,
        game_date=datetime(2024, 6, 1, 19, 0),
        inning=1,
        top_of_inning=True,
        batter_id="545361",
        batter_team="NYY",
        pitcher_id="502188",
        pitcher_team="BOS",
        home_team="BOS",
        away_team="NYY",
        outs=0,
        base_state=BaseState(),
        count=Count(balls=0, strikes=0),
        home_score=0,
        away_score=0,
        pitch_type=PitchType.FASTBALL,
        velocity=95.5,
        pitch_result=PitchResult.BALL,
    )

    assert pitch.game_id == "662253"
    assert pitch.pitch_number == 1
    assert pitch.velocity == 95.5
    assert pitch.pitch_type == PitchType.FASTBALL


def test_pitch_event_score_differential():
    """Test score differential calculation."""
    # Away team batting, losing
    pitch_away = PitchEvent(
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
        away_score=1,
        pitch_result=PitchResult.BALL,
    )
    assert pitch_away.score_differential == -2  # Away team down by 2

    # Home team batting, winning
    pitch_home = PitchEvent(
        game_id="1",
        at_bat_index=1,
        pitch_number=1,
        game_date=datetime.now(),
        inning=5,
        top_of_inning=False,
        batter_id="3",
        batter_team="BOS",
        pitcher_id="4",
        pitcher_team="NYY",
        home_team="BOS",
        away_team="NYY",
        outs=0,
        base_state=BaseState(),
        count=Count(balls=0, strikes=0),
        home_score=3,
        away_score=1,
        pitch_result=PitchResult.BALL,
    )
    assert pitch_home.score_differential == 2  # Home team up by 2


def test_mmi_components():
    """Test MMIComponents model."""
    components = MMIComponents(
        leverage_index=1.5,
        pressure_score=3.0,
        fatigue_score=2.5,
        execution_windows=3.5,
        bio_proxies=1.0,
        z_leverage=0.8,
        z_pressure=1.2,
        z_fatigue=0.5,
        z_execution=1.0,
        z_bio=0.3,
    )

    # Test weighted sum
    expected_sum = (
        0.35 * 0.8 +  # leverage
        0.20 * 1.2 +  # pressure
        0.20 * 0.5 +  # fatigue
        0.15 * 1.0 +  # execution
        0.10 * 0.3    # bio
    )

    assert abs(components.weighted_sum - expected_sum) < 0.001


def test_mmi_components_custom_weights():
    """Test MMIComponents with custom weights."""
    components = MMIComponents(
        leverage_index=1.5,
        pressure_score=3.0,
        fatigue_score=2.5,
        execution_windows=3.5,
        bio_proxies=1.0,
        z_leverage=1.0,
        z_pressure=1.0,
        z_fatigue=1.0,
        z_execution=1.0,
        z_bio=1.0,
        # Custom weights
        weight_leverage=0.5,
        weight_pressure=0.2,
        weight_fatigue=0.1,
        weight_execution=0.1,
        weight_bio=0.1,
    )

    expected_sum = 0.5 + 0.2 + 0.1 + 0.1 + 0.1  # All z-scores are 1.0
    assert abs(components.weighted_sum - expected_sum) < 0.001


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
