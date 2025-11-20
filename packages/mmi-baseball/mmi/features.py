"""
Feature computation for MMI components:
- Pressure Score
- Fatigue Score
- Execution Windows Score
- BioProxies Score
"""

import logging
from typing import List, Dict, Optional
from datetime import datetime, timedelta
from collections import defaultdict
import math

from mmi.models import PitchEvent, PlateAppearance

logger = logging.getLogger(__name__)


class PressureCalculator:
    """
    Calculate pressure score based on game context and environment.

    Combines:
    - Game closeness (score differential)
    - Inning importance (late innings higher)
    - Venue/crowd (attendance, home vs away)
    - Game type (postseason, elimination)
    - Situational flags (timeouts, mound visits)
    """

    def __init__(self, league_avg_attendance: float = 30000.0):
        """
        Initialize pressure calculator.

        Args:
            league_avg_attendance: League average attendance for normalization
        """
        self.league_avg_attendance = league_avg_attendance

    def calculate(
        self,
        pitch: PitchEvent,
        time_pressure: Optional[float] = None,
    ) -> float:
        """
        Calculate pressure score for a pitch.

        Args:
            pitch: PitchEvent object
            time_pressure: Optional explicit time pressure signal

        Returns:
            Pressure score (higher = more pressure)
        """
        pressure_components = []

        # 1. Game closeness (score differential component)
        score_diff = abs(pitch.score_differential)
        # Closer games = higher pressure. Use exponential decay.
        # Max pressure at 0 run diff, decay as diff increases
        closeness_pressure = math.exp(-0.3 * score_diff)
        pressure_components.append(closeness_pressure * 2.0)  # Weight: 2.0

        # 2. Inning weight (late innings = higher pressure)
        # Innings 1-3: low, 4-6: medium, 7-9+: high
        if pitch.inning <= 3:
            inning_pressure = 0.5
        elif pitch.inning <= 6:
            inning_pressure = 1.0
        else:
            inning_pressure = 1.5 + (pitch.inning - 7) * 0.2  # Ramps up in late innings

        pressure_components.append(inning_pressure * 1.5)  # Weight: 1.5

        # 3. Attendance/crowd (normalized)
        if pitch.attendance:
            crowd_factor = pitch.attendance / self.league_avg_attendance
            # Cap at 2x for very large crowds
            crowd_factor = min(2.0, crowd_factor)
        else:
            crowd_factor = 1.0  # Default if unknown

        pressure_components.append(crowd_factor * 0.5)  # Weight: 0.5

        # 4. Home vs away (away players face more pressure)
        # Batting team is under pressure
        is_batting_team_away = pitch.top_of_inning
        away_pressure = 0.3 if is_batting_team_away else 0.0
        pressure_components.append(away_pressure)

        # 5. Postseason and elimination games
        if pitch.is_postseason:
            pressure_components.append(1.5)
            if pitch.is_elimination_game:
                pressure_components.append(1.0)  # Additional pressure

        # 6. Time between pitches (longer = higher pressure often)
        if pitch.time_since_last_pitch and pitch.time_since_last_pitch > 30:
            # Long pause suggests mound visit, discussion, high leverage
            time_pressure_val = min(2.0, pitch.time_since_last_pitch / 30.0)
            pressure_components.append(time_pressure_val * 0.5)

        # Sum all components
        total_pressure = sum(pressure_components)

        return total_pressure


class FatigueCalculator:
    """
    Calculate fatigue score for pitchers and batters.

    For pitchers:
    - Pitch count in game
    - Recent workload (pitches in last N days)
    - Days of rest
    - Role (starter vs reliever)

    For batters:
    - Plate appearances recently
    - Game time/extra innings
    """

    def __init__(self):
        """Initialize fatigue calculator."""
        # Store recent workload data
        self._pitcher_workload: Dict[str, List[Dict]] = defaultdict(list)
        self._batter_workload: Dict[str, List[Dict]] = defaultdict(list)

    def calculate_pitcher_fatigue(
        self,
        pitch: PitchEvent,
        pitches_in_game: int,
        pitches_last_7_days: int = 0,
        days_since_last_outing: int = 3,
        is_starter: bool = True,
    ) -> float:
        """
        Calculate pitcher fatigue score.

        Args:
            pitch: PitchEvent object
            pitches_in_game: Number of pitches thrown in current game
            pitches_last_7_days: Total pitches in last 7 days
            days_since_last_outing: Days since last appearance
            is_starter: True if starting pitcher

        Returns:
            Fatigue score (higher = more fatigued)
        """
        fatigue_components = []

        # 1. Pitches in current game
        if is_starter:
            # Starters: fatigue increases after ~75 pitches
            if pitches_in_game < 75:
                game_fatigue = pitches_in_game / 75.0
            else:
                # Exponential increase after 75
                game_fatigue = 1.0 + (pitches_in_game - 75) / 30.0
        else:
            # Relievers: fatigue increases after ~25 pitches
            if pitches_in_game < 25:
                game_fatigue = pitches_in_game / 25.0
            else:
                game_fatigue = 1.0 + (pitches_in_game - 25) / 10.0

        fatigue_components.append(game_fatigue * 2.0)  # Weight: 2.0

        # 2. Recent workload
        workload_fatigue = pitches_last_7_days / 100.0  # Normalize to ~100 pitches/week
        fatigue_components.append(workload_fatigue * 1.5)  # Weight: 1.5

        # 3. Days of rest (less rest = more fatigue)
        if days_since_last_outing == 0:
            rest_fatigue = 2.0  # Back-to-back appearances
        elif days_since_last_outing == 1:
            rest_fatigue = 1.5
        elif days_since_last_outing == 2:
            rest_fatigue = 1.0
        else:
            rest_fatigue = max(0.0, 1.0 - (days_since_last_outing - 2) * 0.2)

        fatigue_components.append(rest_fatigue * 1.0)  # Weight: 1.0

        # 4. Inning-based fatigue (later innings = more cumulative fatigue)
        inning_fatigue = pitch.inning / 9.0
        fatigue_components.append(inning_fatigue * 0.5)  # Weight: 0.5

        total_fatigue = sum(fatigue_components)
        return total_fatigue

    def calculate_batter_fatigue(
        self,
        pitch: PitchEvent,
        pas_in_game: int,
        pas_last_7_days: int = 0,
    ) -> float:
        """
        Calculate batter fatigue score.

        Args:
            pitch: PitchEvent object
            pas_in_game: Plate appearances in current game
            pas_last_7_days: Total PAs in last 7 days

        Returns:
            Fatigue score (higher = more fatigued)
        """
        fatigue_components = []

        # 1. PAs in current game
        # Typical game: 4-5 PAs. Fatigue increases in extra innings
        pa_fatigue = pas_in_game / 5.0
        fatigue_components.append(pa_fatigue * 1.0)

        # 2. Recent workload
        # Typical week: ~30 PAs
        workload_fatigue = pas_last_7_days / 30.0
        fatigue_components.append(workload_fatigue * 1.0)

        # 3. Extra innings (game duration proxy)
        if pitch.inning > 9:
            extra_inning_fatigue = (pitch.inning - 9) * 0.3
            fatigue_components.append(extra_inning_fatigue)

        # 4. Late game fatigue
        if pitch.inning >= 7:
            late_game_fatigue = (pitch.inning - 6) * 0.2
            fatigue_components.append(late_game_fatigue)

        total_fatigue = sum(fatigue_components)
        return total_fatigue


class ExecutionWindowsCalculator:
    """
    Calculate execution difficulty score.

    For pitchers: difficulty of the task (batter quality, situation)
    For batters: difficulty of the pitch (velocity, movement, count)
    """

    def __init__(self):
        """Initialize execution windows calculator."""
        pass

    def calculate_pitcher_execution(
        self,
        pitch: PitchEvent,
        batter_woba: float = 0.320,  # League average wOBA
        is_platoon_disadvantage: bool = False,
    ) -> float:
        """
        Calculate execution difficulty for pitcher.

        Args:
            pitch: PitchEvent object
            batter_woba: Batter's wOBA (weighted on-base average)
            is_platoon_disadvantage: True if unfavorable matchup

        Returns:
            Execution difficulty score
        """
        difficulty_components = []

        # 1. Batter quality
        # Average wOBA ~0.320, elite ~0.400+
        batter_difficulty = (batter_woba / 0.320) * 1.5
        difficulty_components.append(batter_difficulty)

        # 2. Count leverage
        count = pitch.count
        if count.is_hitters_count():
            count_difficulty = 1.5  # Pitcher must throw strike
        elif count.is_pitchers_count():
            count_difficulty = 0.5  # Pitcher has advantage
        else:
            count_difficulty = 1.0  # Neutral

        difficulty_components.append(count_difficulty)

        # 3. Base-out state complexity
        runners = pitch.base_state.runners_on_base()
        outs = pitch.outs

        # More runners + fewer outs = higher difficulty
        situation_difficulty = (runners * 0.5) + ((2 - outs) * 0.3)
        difficulty_components.append(situation_difficulty)

        # 4. Platoon disadvantage
        if is_platoon_disadvantage:
            difficulty_components.append(0.5)

        # 5. Score context (pitching with lead vs behind)
        if pitch.score_differential < 0:
            # Pitching team is losing - more pressure to get outs
            difficulty_components.append(0.3)

        total_difficulty = sum(difficulty_components)
        return total_difficulty

    def calculate_batter_execution(
        self,
        pitch: PitchEvent,
        previous_pitch_velocity: Optional[float] = None,
        pitcher_stuff_plus: float = 100.0,  # Stuff+ metric (100 = average)
    ) -> float:
        """
        Calculate execution difficulty for batter.

        Args:
            pitch: PitchEvent object
            previous_pitch_velocity: Previous pitch velocity for differential
            pitcher_stuff_plus: Pitcher quality metric (100 = average)

        Returns:
            Execution difficulty score
        """
        difficulty_components = []

        # 1. Pitch velocity
        if pitch.velocity:
            # Normalize velocity (avg ~92 mph)
            velocity_difficulty = (pitch.velocity / 92.0) * 1.0
            difficulty_components.append(velocity_difficulty)

            # 2. Velocity differential (if available)
            if previous_pitch_velocity:
                velo_diff = abs(pitch.velocity - previous_pitch_velocity)
                # Large changes make hitting harder
                diff_difficulty = min(1.0, velo_diff / 10.0)
                difficulty_components.append(diff_difficulty * 0.5)

        # 3. Count leverage (from batter's perspective)
        count = pitch.count
        if count.is_hitters_count():
            count_difficulty = 0.5  # Batter has advantage
        elif count.is_pitchers_count():
            count_difficulty = 1.5  # Batter in tough spot
        else:
            count_difficulty = 1.0

        difficulty_components.append(count_difficulty)

        # 4. Pitcher quality (Stuff+ metric)
        pitcher_difficulty = (pitcher_stuff_plus / 100.0) * 1.0
        difficulty_components.append(pitcher_difficulty)

        # 5. Two-strike pressure
        if count.strikes == 2:
            difficulty_components.append(0.5)

        # 6. Situational pressure (runners in scoring position)
        if pitch.base_state.runner_on_second or pitch.base_state.runner_on_third:
            difficulty_components.append(0.3)

        total_difficulty = sum(difficulty_components)
        return total_difficulty


class BioProxiesCalculator:
    """
    Calculate bio-proxies score based on behavioral/gameplay patterns.

    Designed to be pluggable - can be replaced with actual biometric data.
    """

    def __init__(self):
        """Initialize bio-proxies calculator."""
        self._pitch_timing_history: Dict[str, List[float]] = defaultdict(list)

    def calculate(
        self,
        pitch: PitchEvent,
        pitches_in_game: int,
        high_mmi_moments_in_game: int = 0,
        pitcher_avg_tempo: float = 20.0,  # seconds between pitches
    ) -> float:
        """
        Calculate bio-proxies score from behavioral signals.

        Args:
            pitch: PitchEvent object
            pitches_in_game: Number of pitches in game so far
            high_mmi_moments_in_game: Count of prior high-MMI moments
            pitcher_avg_tempo: Pitcher's average time between pitches

        Returns:
            Bio-proxies score
        """
        bio_components = []

        # 1. Tempo changes (deviation from normal)
        if pitch.time_since_last_pitch:
            tempo_deviation = abs(pitch.time_since_last_pitch - pitcher_avg_tempo)
            # Normalize by typical variance (~5 seconds)
            tempo_signal = min(1.0, tempo_deviation / 5.0)
            bio_components.append(tempo_signal * 0.8)

        # 2. Cumulative stress (prior high-MMI moments)
        cumulative_stress = min(2.0, high_mmi_moments_in_game * 0.3)
        bio_components.append(cumulative_stress)

        # 3. Back-to-back high leverage (if this is late in a high-leverage game)
        if pitch.inning >= 7 and abs(pitch.score_differential) <= 2:
            if pitch.base_state.runners_on_base() >= 2:
                bio_components.append(0.5)

        # 4. Role-based stress patterns
        # Closers in 9th inning, pinch hitters, etc.
        if pitch.inning >= 9:
            if not pitch.top_of_inning and pitch.score_differential > 0:
                # Closer situation for home team
                bio_components.append(0.6)
            elif pitch.top_of_inning and pitch.score_differential < 0:
                # High-leverage situation for away team
                bio_components.append(0.6)

        # 5. Pitch count stress (very high pitch counts)
        if pitches_in_game > 100:
            bio_components.append((pitches_in_game - 100) / 50.0)

        total_bio = sum(bio_components)
        return total_bio


class FeatureBuilder:
    """High-level interface for computing all MMI features."""

    def __init__(self, league_avg_attendance: float = 30000.0):
        """
        Initialize feature builder with all calculators.

        Args:
            league_avg_attendance: League average attendance
        """
        self.pressure_calc = PressureCalculator(league_avg_attendance)
        self.fatigue_calc = FatigueCalculator()
        self.execution_calc = ExecutionWindowsCalculator()
        self.bio_calc = BioProxiesCalculator()

    def compute_pitcher_features(
        self,
        pitch: PitchEvent,
        pitches_in_game: int,
        pitches_last_7_days: int = 0,
        days_since_last_outing: int = 3,
        is_starter: bool = True,
        batter_woba: float = 0.320,
        high_mmi_moments_in_game: int = 0,
    ) -> Dict[str, float]:
        """
        Compute all features for a pitcher.

        Returns:
            Dictionary with pressure, fatigue, execution, bio_proxies
        """
        pressure = self.pressure_calc.calculate(pitch)
        fatigue = self.fatigue_calc.calculate_pitcher_fatigue(
            pitch, pitches_in_game, pitches_last_7_days,
            days_since_last_outing, is_starter
        )
        execution = self.execution_calc.calculate_pitcher_execution(
            pitch, batter_woba
        )
        bio_proxies = self.bio_calc.calculate(
            pitch, pitches_in_game, high_mmi_moments_in_game
        )

        return {
            "pressure": pressure,
            "fatigue": fatigue,
            "execution": execution,
            "bio_proxies": bio_proxies,
        }

    def compute_batter_features(
        self,
        pitch: PitchEvent,
        pas_in_game: int,
        pas_last_7_days: int = 0,
        previous_pitch_velocity: Optional[float] = None,
        high_mmi_moments_in_game: int = 0,
    ) -> Dict[str, float]:
        """
        Compute all features for a batter.

        Returns:
            Dictionary with pressure, fatigue, execution, bio_proxies
        """
        pressure = self.pressure_calc.calculate(pitch)
        fatigue = self.fatigue_calc.calculate_batter_fatigue(
            pitch, pas_in_game, pas_last_7_days
        )
        execution = self.execution_calc.calculate_batter_execution(
            pitch, previous_pitch_velocity
        )
        bio_proxies = self.bio_calc.calculate(
            pitch, pas_in_game, high_mmi_moments_in_game
        )

        return {
            "pressure": pressure,
            "fatigue": fatigue,
            "execution": execution,
            "bio_proxies": bio_proxies,
        }
