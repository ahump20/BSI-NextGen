"""
Win Probability (WP) and Leverage Index (LI) calculations.

Uses run expectancy matrices and win probability models based on historical data.
"""

import logging
from typing import Dict, Tuple
import math
from mmi.models import PitchEvent, BaseState

logger = logging.getLogger(__name__)


# Run Expectancy Matrix (2020-2023 average)
# Format: (outs, base_code) -> expected runs until end of inning
RUN_EXPECTANCY_MATRIX: Dict[Tuple[int, str], float] = {
    # 0 outs
    (0, "___"): 0.481,
    (0, "1__"): 0.859,
    (0, "_2_"): 1.100,
    (0, "__3"): 1.361,
    (0, "12_"): 1.437,
    (0, "1_3"): 1.784,
    (0, "_23"): 1.970,
    (0, "123"): 2.292,
    # 1 out
    (1, "___"): 0.254,
    (1, "1__"): 0.509,
    (1, "_2_"): 0.664,
    (1, "__3"): 0.950,
    (1, "12_"): 0.888,
    (1, "1_3"): 1.140,
    (1, "_23"): 1.352,
    (1, "123"): 1.541,
    # 2 outs
    (2, "___"): 0.098,
    (2, "1__"): 0.214,
    (2, "_2_"): 0.305,
    (2, "__3"): 0.362,
    (2, "12_"): 0.421,
    (2, "1_3"): 0.561,
    (2, "_23"): 0.570,
    (2, "123"): 0.772,
}


class WinProbabilityModel:
    """
    Win Probability model based on game state.

    Uses a simplified model combining:
    - Score differential
    - Inning
    - Base-out state
    - Home field advantage
    """

    def __init__(self):
        """Initialize win probability model with default parameters."""
        self.home_advantage = 0.54  # Historical home team win rate

    def calculate_win_prob(
        self,
        inning: int,
        top_of_inning: bool,
        outs: int,
        base_state: BaseState,
        home_score: int,
        away_score: int,
        is_home_batting: bool,
    ) -> float:
        """
        Calculate win probability for the batting team.

        Args:
            inning: Current inning (1-indexed)
            top_of_inning: True if top of inning
            outs: Current outs (0-2)
            base_state: Current base state
            home_score: Home team score
            away_score: Away team score
            is_home_batting: True if home team is batting

        Returns:
            Win probability for the home team (0-1)
        """
        # Calculate innings remaining (half-innings)
        innings_remaining = (9 - inning) * 2
        if not top_of_inning:
            innings_remaining += 1

        # If game is in bottom of 9th or later and home team ahead, they win
        if inning >= 9 and not top_of_inning and home_score > away_score:
            return 1.0

        # If game is over (9+ innings complete and not tied)
        if inning > 9 and top_of_inning and home_score != away_score:
            return 1.0 if home_score > away_score else 0.0

        # Score differential from home team's perspective
        score_diff = home_score - away_score

        # Get run expectancy for current state
        run_expectancy = self._get_run_expectancy(outs, base_state)

        # Adjust score diff by run expectancy if home team batting
        if is_home_batting:
            effective_diff = score_diff + run_expectancy
        else:
            effective_diff = score_diff - run_expectancy

        # Calculate win probability using logistic regression approximation
        # Based on research: WP ~ sigmoid(score_diff / sqrt(innings_remaining))
        if innings_remaining == 0:
            # Game over
            return 1.0 if home_score > away_score else (0.5 if home_score == away_score else 0.0)

        # Standard deviation of run differential over remaining innings
        # Approximated as 2 * sqrt(innings_remaining)
        innings_factor = max(0.5, innings_remaining)
        std_dev = 2.0 * math.sqrt(innings_factor)

        # Z-score
        z_score = effective_diff / std_dev

        # Convert to probability using sigmoid
        win_prob = self._sigmoid(z_score)

        # Apply small home field adjustment if game is close
        if abs(score_diff) <= 2:
            if inning <= 5:
                # Early game, apply home advantage
                win_prob = win_prob * 0.9 + self.home_advantage * 0.1

        # Ensure bounds
        win_prob = max(0.0, min(1.0, win_prob))

        return win_prob

    def _get_run_expectancy(self, outs: int, base_state: BaseState) -> float:
        """Get run expectancy from matrix."""
        base_code = base_state.to_code()
        return RUN_EXPECTANCY_MATRIX.get((outs, base_code), 0.0)

    @staticmethod
    def _sigmoid(x: float) -> float:
        """Sigmoid function: 1 / (1 + exp(-x))."""
        try:
            return 1.0 / (1.0 + math.exp(-x))
        except OverflowError:
            # Handle extreme values
            return 0.0 if x < 0 else 1.0

    def calculate_leverage_index(
        self,
        inning: int,
        top_of_inning: bool,
        outs: int,
        base_state: BaseState,
        home_score: int,
        away_score: int,
    ) -> float:
        """
        Calculate Leverage Index for the current game state.

        Leverage Index represents the potential swing in win probability
        from a typical play outcome.

        Args:
            inning: Current inning
            top_of_inning: True if top of inning
            outs: Current outs
            base_state: Current base state
            home_score: Home team score
            away_score: Away team score

        Returns:
            Leverage Index (typically 0.5 to 3.0, but can be higher)
        """
        is_home_batting = not top_of_inning

        # Current win probability
        wp_current = self.calculate_win_prob(
            inning, top_of_inning, outs, base_state,
            home_score, away_score, is_home_batting
        )

        # Simulate possible outcomes and calculate WP swing
        # We'll estimate by looking at:
        # 1. Best reasonable outcome (single/walk - runner advances)
        # 2. Worst reasonable outcome (out, possibly DP)
        # 3. Neutral outcome (out, no runners score)

        # Clone base state for simulations
        swings = []

        # Scenario 1: Walk or single (runner to first, existing runners advance one base)
        new_base_walk = BaseState(
            runner_on_first=True,
            runner_on_second=base_state.runner_on_first or base_state.runner_on_second,
            runner_on_third=base_state.runner_on_third,
        )
        # Runs scored if runner on third
        runs_scored_walk = 1 if base_state.runner_on_third else 0
        new_home_walk = home_score + (runs_scored_walk if is_home_batting else 0)
        new_away_walk = away_score + (runs_scored_walk if not is_home_batting else 0)

        wp_walk = self.calculate_win_prob(
            inning, top_of_inning, outs, new_base_walk,
            new_home_walk, new_away_walk, is_home_batting
        )
        swings.append(abs(wp_walk - wp_current))

        # Scenario 2: Out (no advancement)
        new_outs_out = outs + 1
        if new_outs_out <= 2:
            wp_out = self.calculate_win_prob(
                inning, top_of_inning, new_outs_out, base_state,
                home_score, away_score, is_home_batting
            )
            swings.append(abs(wp_out - wp_current))

        # Scenario 3: Home run (clear bases, score all runs)
        runs_scored_hr = 1 + base_state.runners_on_base()
        new_home_hr = home_score + (runs_scored_hr if is_home_batting else 0)
        new_away_hr = away_score + (runs_scored_hr if not is_home_batting else 0)
        empty_bases = BaseState()

        wp_hr = self.calculate_win_prob(
            inning, top_of_inning, outs, empty_bases,
            new_home_hr, new_away_hr, is_home_batting
        )
        swings.append(abs(wp_hr - wp_current))

        # Leverage is the average swing in WP
        avg_swing = sum(swings) / len(swings) if swings else 0.0

        # Normalize to league average (~1.0)
        # Typical average swing is around 0.05 (5%)
        leverage_index = avg_swing / 0.05

        return max(0.0, leverage_index)


class LeverageIndexCalculator:
    """High-level calculator for leverage index with caching."""

    def __init__(self):
        """Initialize calculator with WP model."""
        self.wp_model = WinProbabilityModel()
        self._cache: Dict[str, float] = {}

    def calculate_leverage_for_pitch(self, pitch: PitchEvent) -> float:
        """
        Calculate leverage index for a pitch event.

        Args:
            pitch: PitchEvent object

        Returns:
            Leverage index value
        """
        # Create cache key
        cache_key = self._make_cache_key(pitch)

        if cache_key in self._cache:
            return self._cache[cache_key]

        is_home_batting = not pitch.top_of_inning

        leverage = self.wp_model.calculate_leverage_index(
            inning=pitch.inning,
            top_of_inning=pitch.top_of_inning,
            outs=pitch.outs,
            base_state=pitch.base_state,
            home_score=pitch.home_score,
            away_score=pitch.away_score,
        )

        self._cache[cache_key] = leverage
        return leverage

    def calculate_win_prob_for_pitch(self, pitch: PitchEvent) -> float:
        """
        Calculate win probability for the home team at time of pitch.

        Args:
            pitch: PitchEvent object

        Returns:
            Win probability (0-1)
        """
        is_home_batting = not pitch.top_of_inning

        return self.wp_model.calculate_win_prob(
            inning=pitch.inning,
            top_of_inning=pitch.top_of_inning,
            outs=pitch.outs,
            base_state=pitch.base_state,
            home_score=pitch.home_score,
            away_score=pitch.away_score,
            is_home_batting=is_home_batting,
        )

    def _make_cache_key(self, pitch: PitchEvent) -> str:
        """Create a cache key from pitch state."""
        return (
            f"{pitch.inning}_{pitch.top_of_inning}_{pitch.outs}_"
            f"{pitch.base_state.to_code()}_{pitch.home_score}_{pitch.away_score}"
        )

    def clear_cache(self):
        """Clear the leverage index cache."""
        self._cache.clear()


def calculate_leverage_index(pitch: PitchEvent) -> float:
    """
    Convenience function to calculate leverage index for a single pitch.

    Args:
        pitch: PitchEvent object

    Returns:
        Leverage index
    """
    calculator = LeverageIndexCalculator()
    return calculator.calculate_leverage_for_pitch(pitch)


def calculate_win_probability(pitch: PitchEvent) -> float:
    """
    Convenience function to calculate win probability for a single pitch.

    Args:
        pitch: PitchEvent object

    Returns:
        Win probability for home team
    """
    calculator = LeverageIndexCalculator()
    return calculator.calculate_win_prob_for_pitch(pitch)
