"""Tests for win probability and leverage index calculations."""

import pytest
from datetime import datetime
from mmi.win_prob import WinProbabilityModel, LeverageIndexCalculator
from mmi.models import PitchEvent, BaseState, Count, PitchResult


@pytest.fixture
def wp_model():
    """Create win probability model fixture."""
    return WinProbabilityModel()


@pytest.fixture
def sample_pitch():
    """Create sample pitch event."""
    return PitchEvent(
        game_id="1",
        at_bat_index=0,
        pitch_number=1,
        game_date=datetime(2024, 6, 1),
        inning=7,
        top_of_inning=True,
        batter_id="1",
        batter_team="NYY",
        pitcher_id="2",
        pitcher_team="BOS",
        home_team="BOS",
        away_team="NYY",
        outs=1,
        base_state=BaseState(runner_on_second=True),
        count=Count(balls=2, strikes=2),
        home_score=3,
        away_score=2,
        pitch_result=PitchResult.BALL,
    )


def test_wp_early_game_tied(wp_model):
    """Test WP calculation for early game, tied score."""
    wp = wp_model.calculate_win_prob(
        inning=1,
        top_of_inning=True,
        outs=0,
        base_state=BaseState(),
        home_score=0,
        away_score=0,
        is_home_batting=False,
    )

    # Early tie should be close to 50/50, slightly favoring home team
    assert 0.48 <= wp <= 0.55


def test_wp_home_team_winning_late(wp_model):
    """Test WP when home team has lead in late innings."""
    wp = wp_model.calculate_win_prob(
        inning=9,
        top_of_inning=False,
        outs=2,
        base_state=BaseState(),
        home_score=5,
        away_score=3,
        is_home_batting=True,
    )

    # Home team up 2 in bottom of 9th should have high WP
    assert wp > 0.90


def test_wp_home_team_ahead_bottom_9th(wp_model):
    """Test WP for home team ahead in bottom 9th."""
    # If home team is ahead in bottom of 9th, they've already won
    wp = wp_model.calculate_win_prob(
        inning=9,
        top_of_inning=False,
        outs=0,
        base_state=BaseState(),
        home_score=5,
        away_score=3,
        is_home_batting=True,
    )

    assert wp == 1.0


def test_wp_away_team_winning_top_9th(wp_model):
    """Test WP for away team winning in top of 9th."""
    wp = wp_model.calculate_win_prob(
        inning=9,
        top_of_inning=True,
        outs=2,
        base_state=BaseState(),
        home_score=2,
        away_score=5,
        is_home_batting=False,
    )

    # Away team up 3 runs, 2 outs in top 9th - likely to win
    # But home team still has bottom of 9th
    assert wp < 0.20  # Home team has low chance


def test_leverage_high_leverage_situation(wp_model):
    """Test leverage calculation for high-leverage situation."""
    # Tie game, late innings, runners in scoring position
    leverage = wp_model.calculate_leverage_index(
        inning=8,
        top_of_inning=True,
        outs=1,
        base_state=BaseState(runner_on_second=True, runner_on_third=True),
        home_score=3,
        away_score=3,
    )

    # High leverage situation should have LI > 1.5
    assert leverage > 1.5


def test_leverage_low_leverage_situation(wp_model):
    """Test leverage calculation for low-leverage situation."""
    # Early inning, blowout
    leverage = wp_model.calculate_leverage_index(
        inning=2,
        top_of_inning=False,
        outs=2,
        base_state=BaseState(),
        home_score=8,
        away_score=1,
    )

    # Low leverage situation should have LI < 1.0
    assert leverage < 1.0


def test_leverage_calculator(sample_pitch):
    """Test LeverageIndexCalculator."""
    calculator = LeverageIndexCalculator()

    # Calculate leverage for sample pitch
    leverage = calculator.calculate_leverage_for_pitch(sample_pitch)

    # Should return a positive value
    assert leverage > 0

    # Test caching
    leverage2 = calculator.calculate_leverage_for_pitch(sample_pitch)
    assert leverage == leverage2  # Should return cached value


def test_leverage_calculator_win_prob(sample_pitch):
    """Test win probability calculation via calculator."""
    calculator = LeverageIndexCalculator()

    wp = calculator.calculate_win_prob_for_pitch(sample_pitch)

    # Win probability should be between 0 and 1
    assert 0.0 <= wp <= 1.0

    # Home team is up by 1 in the 7th, should favor home team
    assert wp > 0.5


def test_run_expectancy_values(wp_model):
    """Test that run expectancy values are reasonable."""
    # Bases loaded, no outs should have high run expectancy
    bases_loaded = BaseState(
        runner_on_first=True,
        runner_on_second=True,
        runner_on_third=True,
    )
    re_loaded = wp_model._get_run_expectancy(0, bases_loaded)
    assert re_loaded > 2.0

    # Empty bases, 2 outs should have low run expectancy
    empty = BaseState()
    re_empty = wp_model._get_run_expectancy(2, empty)
    assert re_empty < 0.2


def test_sigmoid_function(wp_model):
    """Test sigmoid function."""
    # sigmoid(0) should be 0.5
    assert abs(wp_model._sigmoid(0.0) - 0.5) < 0.001

    # sigmoid of large positive number should be ~1
    assert wp_model._sigmoid(10.0) > 0.999

    # sigmoid of large negative number should be ~0
    assert wp_model._sigmoid(-10.0) < 0.001


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
