"""Tests for core MMI computation."""

import pytest
from datetime import datetime
from pathlib import Path
import tempfile

from mmi.models import PitchEvent, BaseState, Count, PitchResult, PitchType
from mmi.scaling import Scaler, MMIScalerSet, create_default_scalers
from mmi.mmi_core import MMICalculator, compute_pitch_mmi


@pytest.fixture
def sample_pitch():
    """Create sample pitch event."""
    return PitchEvent(
        game_id="662253",
        at_bat_index=5,
        pitch_number=3,
        game_date=datetime(2024, 6, 1, 19, 30),
        inning=7,
        top_of_inning=False,
        batter_id="545361",
        batter_name="Mike Trout",
        batter_team="BOS",
        pitcher_id="502188",
        pitcher_name="Clayton Kershaw",
        pitcher_team="NYY",
        home_team="BOS",
        away_team="NYY",
        outs=1,
        base_state=BaseState(runner_on_first=True, runner_on_second=True),
        count=Count(balls=3, strikes=2),
        home_score=3,
        away_score=2,
        pitch_type=PitchType.SLIDER,
        velocity=89.5,
        pitch_result=PitchResult.SWINGING_STRIKE,
        attendance=35000,
    )


@pytest.fixture
def scaler_set():
    """Create default scaler set."""
    return create_default_scalers()


def test_scaler_basic():
    """Test basic scaler functionality."""
    scaler = Scaler(mean=5.0, std=2.0, name="test")

    # Test transform
    z_score = scaler.transform(7.0)
    assert z_score == 1.0  # (7 - 5) / 2 = 1

    z_score = scaler.transform(3.0)
    assert z_score == -1.0  # (3 - 5) / 2 = -1

    # Test inverse transform
    original = scaler.inverse_transform(1.0)
    assert original == 7.0


def test_scaler_fit():
    """Test scaler fitting from data."""
    scaler = Scaler(name="test")
    values = [1.0, 2.0, 3.0, 4.0, 5.0]

    scaler.fit(values)

    assert scaler.mean == 3.0
    # std = sqrt(((1-3)^2 + (2-3)^2 + ... + (5-3)^2) / 5) = sqrt(2)
    assert abs(scaler.std - 1.414) < 0.01


def test_scaler_zero_std():
    """Test scaler with zero standard deviation."""
    scaler = Scaler(mean=5.0, std=0.0, name="test")

    # Should not raise error, should return 0
    z_score = scaler.transform(10.0)
    assert z_score == 0.0


def test_scaler_set_transform():
    """Test MMIScalerSet transformation."""
    scaler_set = MMIScalerSet()
    scaler_set.leverage_scaler = Scaler(mean=1.0, std=0.5, name="leverage")
    scaler_set.pressure_scaler = Scaler(mean=3.0, std=1.0, name="pressure")
    scaler_set.fatigue_scaler = Scaler(mean=2.0, std=1.0, name="fatigue")
    scaler_set.execution_scaler = Scaler(mean=3.0, std=1.0, name="execution")
    scaler_set.bio_scaler = Scaler(mean=1.0, std=0.5, name="bio")

    z_scores = scaler_set.transform_all(
        leverage=1.5,
        pressure=4.0,
        fatigue=3.0,
        execution=4.0,
        bio=1.5,
    )

    assert z_scores["z_leverage"] == 1.0  # (1.5 - 1.0) / 0.5
    assert z_scores["z_pressure"] == 1.0  # (4.0 - 3.0) / 1.0
    assert z_scores["z_fatigue"] == 1.0  # (3.0 - 2.0) / 1.0


def test_scaler_set_save_load():
    """Test saving and loading scaler set."""
    scaler_set = create_default_scalers()

    with tempfile.TemporaryDirectory() as tmpdir:
        file_path = Path(tmpdir) / "scalers.json"

        # Save
        scaler_set.save(file_path)
        assert file_path.exists()

        # Load
        loaded_set = MMIScalerSet.load(file_path)

        # Check values match
        assert loaded_set.leverage_scaler.mean == scaler_set.leverage_scaler.mean
        assert loaded_set.leverage_scaler.std == scaler_set.leverage_scaler.std
        assert loaded_set.pressure_scaler.mean == scaler_set.pressure_scaler.mean


def test_mmi_calculator_init():
    """Test MMI calculator initialization."""
    scaler_set = create_default_scalers()
    calculator = MMICalculator(scaler_set=scaler_set)

    assert calculator.scaler_set is not None
    assert calculator.weights["leverage"] == 0.35
    assert calculator.weights["pressure"] == 0.20


def test_mmi_calculator_custom_weights():
    """Test MMI calculator with custom weights."""
    scaler_set = create_default_scalers()
    custom_weights = {
        "leverage": 0.5,
        "pressure": 0.2,
        "fatigue": 0.1,
        "execution": 0.1,
        "bio": 0.1,
    }

    calculator = MMICalculator(scaler_set=scaler_set, custom_weights=custom_weights)

    assert calculator.weights["leverage"] == 0.5
    assert calculator.weights["pressure"] == 0.2


def test_compute_pitch_mmi_pitcher(sample_pitch, scaler_set):
    """Test computing MMI for a pitcher."""
    calculator = MMICalculator(scaler_set=scaler_set)

    context = {
        "pitches_in_game": 85,
        "is_starter": True,
    }

    result = calculator.compute_pitch_mmi(sample_pitch, role="pitcher", context=context)

    # Check result structure
    assert result.game_id == sample_pitch.game_id
    assert result.pitcher_id == sample_pitch.pitcher_id
    assert result.role == "pitcher"

    # MMI should be a finite number
    assert isinstance(result.mmi, float)
    assert not (result.mmi != result.mmi)  # Not NaN

    # Components should be present
    assert result.components.leverage_index > 0
    assert result.components.pressure_score > 0


def test_compute_pitch_mmi_batter(sample_pitch, scaler_set):
    """Test computing MMI for a batter."""
    calculator = MMICalculator(scaler_set=scaler_set)

    context = {
        "pas_in_game": 3,
    }

    result = calculator.compute_pitch_mmi(sample_pitch, role="batter", context=context)

    assert result.role == "batter"
    assert result.batter_id == sample_pitch.batter_id
    assert isinstance(result.mmi, float)


def test_compute_pa_mmi_max_aggregation(scaler_set):
    """Test PA MMI aggregation with max."""
    # Create multiple pitches
    pitches = []
    for i in range(5):
        pitch = PitchEvent(
            game_id="1",
            at_bat_index=0,
            pitch_number=i + 1,
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
            count=Count(balls=min(i, 3), strikes=min(i, 2)),
            home_score=2,
            away_score=2,
            pitch_result=PitchResult.BALL if i < 3 else PitchResult.FOUL,
        )
        pitches.append(pitch)

    calculator = MMICalculator(scaler_set=scaler_set)
    result = calculator.compute_pa_mmi(pitches, role="pitcher", aggregation="max")

    # Should return a valid result
    assert isinstance(result.mmi, float)
    assert result.meta.get("aggregation") is None  # Max uses one of the original results


def test_compute_pa_mmi_mean_aggregation(scaler_set):
    """Test PA MMI aggregation with mean."""
    pitches = []
    for i in range(3):
        pitch = PitchEvent(
            game_id="1",
            at_bat_index=0,
            pitch_number=i + 1,
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
            count=Count(balls=i, strikes=0),
            home_score=2,
            away_score=2,
            pitch_result=PitchResult.BALL,
        )
        pitches.append(pitch)

    calculator = MMICalculator(scaler_set=scaler_set)
    result = calculator.compute_pa_mmi(pitches, role="pitcher", aggregation="mean")

    assert result.meta.get("aggregation") == "mean"
    assert result.meta.get("pitch_count") == 3


def test_compute_pitch_mmi_convenience_function(sample_pitch, scaler_set):
    """Test convenience function for computing pitch MMI."""
    league_stats = scaler_set.to_league_stats()

    result = compute_pitch_mmi(
        sample_pitch,
        league_stats,
        role="pitcher",
        context={"pitches_in_game": 70},
    )

    assert isinstance(result.mmi, float)
    assert result.role == "pitcher"


def test_mmi_high_leverage_situation():
    """Test MMI computation for high-leverage situation."""
    # Create a high-leverage pitch
    high_leverage_pitch = PitchEvent(
        game_id="1",
        at_bat_index=30,
        pitch_number=5,
        game_date=datetime.now(),
        inning=9,  # Late inning
        top_of_inning=False,
        batter_id="1",
        batter_team="BOS",
        pitcher_id="2",
        pitcher_team="NYY",
        home_team="BOS",
        away_team="NYY",
        outs=2,  # 2 outs
        base_state=BaseState(runner_on_second=True, runner_on_third=True),  # RISP
        count=Count(balls=3, strikes=2),  # Full count
        home_score=3,  # Close game
        away_score=2,
        pitch_result=PitchResult.FOUL,
        attendance=40000,  # Full stadium
        is_postseason=True,  # Postseason
    )

    scaler_set = create_default_scalers()
    calculator = MMICalculator(scaler_set=scaler_set)

    result = calculator.compute_pitch_mmi(
        high_leverage_pitch,
        role="pitcher",
        context={"pitches_in_game": 25, "is_starter": False},
    )

    # High-leverage situation should produce high MMI
    # Note: Actual value depends on scaler parameters
    assert result.mmi > 0  # Should be positive z-score
    assert result.components.leverage_index > 1.5  # Should have high leverage


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
