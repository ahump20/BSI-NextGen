"""
Core MMI computation functions.

Combines leverage, pressure, fatigue, execution, and bio-proxies into final MMI score.
"""

import logging
from typing import Dict, List, Optional

from mmi.models import (
    PitchEvent,
    PlateAppearance,
    LeagueStats,
    MMIComponents,
    MMIResult,
)
from mmi.win_prob import LeverageIndexCalculator
from mmi.features import FeatureBuilder
from mmi.scaling import MMIScalerSet, create_default_scalers

logger = logging.getLogger(__name__)


class MMICalculator:
    """
    Main calculator for computing MMI scores.

    Orchestrates leverage calculation, feature extraction, normalization,
    and final MMI computation.
    """

    def __init__(
        self,
        scaler_set: Optional[MMIScalerSet] = None,
        custom_weights: Optional[Dict[str, float]] = None,
    ):
        """
        Initialize MMI calculator.

        Args:
            scaler_set: Pre-fitted scaler set (uses defaults if None)
            custom_weights: Custom component weights (uses defaults if None)
        """
        # Initialize sub-components
        self.leverage_calc = LeverageIndexCalculator()
        self.feature_builder = FeatureBuilder()

        # Scalers
        if scaler_set is None:
            logger.warning("No scaler set provided, using defaults")
            self.scaler_set = create_default_scalers()
        else:
            self.scaler_set = scaler_set

        # Component weights
        self.weights = {
            "leverage": 0.35,
            "pressure": 0.20,
            "fatigue": 0.20,
            "execution": 0.15,
            "bio": 0.10,
        }

        if custom_weights:
            self.weights.update(custom_weights)
            logger.info(f"Using custom weights: {self.weights}")

        # Validate weights sum to 1.0
        total_weight = sum(self.weights.values())
        if abs(total_weight - 1.0) > 0.01:
            logger.warning(
                f"Weights sum to {total_weight:.3f}, not 1.0. Normalizing..."
            )
            for key in self.weights:
                self.weights[key] /= total_weight

    def compute_pitch_mmi(
        self,
        pitch: PitchEvent,
        role: str = "pitcher",
        context: Optional[Dict] = None,
    ) -> MMIResult:
        """
        Compute MMI for a single pitch.

        Args:
            pitch: PitchEvent object
            role: "pitcher" or "batter"
            context: Optional additional context (pitch counts, workload, etc.)

        Returns:
            MMIResult object with full breakdown
        """
        if role not in ["pitcher", "batter"]:
            raise ValueError("role must be 'pitcher' or 'batter'")

        # 1. Calculate leverage index
        leverage = self.leverage_calc.calculate_leverage_for_pitch(pitch)

        # 2. Extract context parameters
        ctx = context or {}
        pitches_in_game = ctx.get("pitches_in_game", 50)
        pitches_last_7_days = ctx.get("pitches_last_7_days", 0)
        days_since_last_outing = ctx.get("days_since_last_outing", 3)
        is_starter = ctx.get("is_starter", True)
        batter_woba = ctx.get("batter_woba", 0.320)
        pas_in_game = ctx.get("pas_in_game", 3)
        pas_last_7_days = ctx.get("pas_last_7_days", 25)
        high_mmi_moments = ctx.get("high_mmi_moments_in_game", 0)

        # 3. Compute features based on role
        if role == "pitcher":
            features = self.feature_builder.compute_pitcher_features(
                pitch=pitch,
                pitches_in_game=pitches_in_game,
                pitches_last_7_days=pitches_last_7_days,
                days_since_last_outing=days_since_last_outing,
                is_starter=is_starter,
                batter_woba=batter_woba,
                high_mmi_moments_in_game=high_mmi_moments,
            )
        else:  # batter
            features = self.feature_builder.compute_batter_features(
                pitch=pitch,
                pas_in_game=pas_in_game,
                pas_last_7_days=pas_last_7_days,
                previous_pitch_velocity=ctx.get("previous_pitch_velocity"),
                high_mmi_moments_in_game=high_mmi_moments,
            )

        pressure = features["pressure"]
        fatigue = features["fatigue"]
        execution = features["execution"]
        bio_proxies = features["bio_proxies"]

        # 4. Normalize to z-scores
        z_scores = self.scaler_set.transform_all(
            leverage=leverage,
            pressure=pressure,
            fatigue=fatigue,
            execution=execution,
            bio=bio_proxies,
        )

        # 5. Create components object
        components = MMIComponents(
            leverage_index=leverage,
            pressure_score=pressure,
            fatigue_score=fatigue,
            execution_windows=execution,
            bio_proxies=bio_proxies,
            z_leverage=z_scores["z_leverage"],
            z_pressure=z_scores["z_pressure"],
            z_fatigue=z_scores["z_fatigue"],
            z_execution=z_scores["z_execution"],
            z_bio=z_scores["z_bio"],
            weight_leverage=self.weights["leverage"],
            weight_pressure=self.weights["pressure"],
            weight_fatigue=self.weights["fatigue"],
            weight_execution=self.weights["execution"],
            weight_bio=self.weights["bio"],
        )

        # 6. Compute final MMI
        mmi_score = components.weighted_sum

        # 7. Create result
        result = MMIResult(
            pitch_id=pitch.pitch_id,
            game_id=pitch.game_id,
            batter_id=pitch.batter_id,
            pitcher_id=pitch.pitcher_id,
            inning=pitch.inning,
            mmi=mmi_score,
            components=components,
            role=role,
            meta={
                "at_bat_index": pitch.at_bat_index,
                "pitch_number": pitch.pitch_number,
            },
        )

        return result

    def compute_pa_mmi(
        self,
        pitches: List[PitchEvent],
        role: str = "pitcher",
        aggregation: str = "max",
        contexts: Optional[List[Dict]] = None,
    ) -> MMIResult:
        """
        Compute MMI for a plate appearance (aggregate of pitches).

        Args:
            pitches: List of PitchEvent objects in the PA
            role: "pitcher" or "batter"
            aggregation: "max", "mean", or "weighted"
            contexts: Optional list of context dicts (one per pitch)

        Returns:
            MMIResult for the PA
        """
        if not pitches:
            raise ValueError("Cannot compute PA MMI with no pitches")

        # Compute MMI for each pitch
        mmi_results = []
        for i, pitch in enumerate(pitches):
            ctx = contexts[i] if contexts and i < len(contexts) else None
            result = self.compute_pitch_mmi(pitch, role=role, context=ctx)
            mmi_results.append(result)

        # Aggregate
        if aggregation == "max":
            # Use maximum MMI from any pitch
            pa_result = max(mmi_results, key=lambda r: r.mmi)
        elif aggregation == "mean":
            # Average MMI across pitches
            avg_mmi = sum(r.mmi for r in mmi_results) / len(mmi_results)

            # Average components
            avg_components = MMIComponents(
                leverage_index=sum(r.components.leverage_index for r in mmi_results) / len(mmi_results),
                pressure_score=sum(r.components.pressure_score for r in mmi_results) / len(mmi_results),
                fatigue_score=sum(r.components.fatigue_score for r in mmi_results) / len(mmi_results),
                execution_windows=sum(r.components.execution_windows for r in mmi_results) / len(mmi_results),
                bio_proxies=sum(r.components.bio_proxies for r in mmi_results) / len(mmi_results),
                z_leverage=sum(r.components.z_leverage for r in mmi_results) / len(mmi_results),
                z_pressure=sum(r.components.z_pressure for r in mmi_results) / len(mmi_results),
                z_fatigue=sum(r.components.z_fatigue for r in mmi_results) / len(mmi_results),
                z_execution=sum(r.components.z_execution for r in mmi_results) / len(mmi_results),
                z_bio=sum(r.components.z_bio for r in mmi_results) / len(mmi_results),
                weight_leverage=self.weights["leverage"],
                weight_pressure=self.weights["pressure"],
                weight_fatigue=self.weights["fatigue"],
                weight_execution=self.weights["execution"],
                weight_bio=self.weights["bio"],
            )

            first_pitch = pitches[0]
            pa_result = MMIResult(
                pitch_id=None,
                game_id=first_pitch.game_id,
                batter_id=first_pitch.batter_id,
                pitcher_id=first_pitch.pitcher_id,
                inning=first_pitch.inning,
                mmi=avg_mmi,
                components=avg_components,
                role=role,
                meta={"aggregation": "mean", "pitch_count": len(pitches)},
            )
        elif aggregation == "weighted":
            # Weight by leverage index
            total_leverage = sum(r.components.leverage_index for r in mmi_results)
            if total_leverage == 0:
                # Fall back to mean if no leverage
                return self.compute_pa_mmi(pitches, role, "mean", contexts)

            weighted_mmi = sum(
                r.mmi * r.components.leverage_index / total_leverage
                for r in mmi_results
            )

            # Weighted components
            weighted_components = MMIComponents(
                leverage_index=sum(r.components.leverage_index * r.components.leverage_index for r in mmi_results) / total_leverage,
                pressure_score=sum(r.components.pressure_score * r.components.leverage_index for r in mmi_results) / total_leverage,
                fatigue_score=sum(r.components.fatigue_score * r.components.leverage_index for r in mmi_results) / total_leverage,
                execution_windows=sum(r.components.execution_windows * r.components.leverage_index for r in mmi_results) / total_leverage,
                bio_proxies=sum(r.components.bio_proxies * r.components.leverage_index for r in mmi_results) / total_leverage,
                z_leverage=sum(r.components.z_leverage * r.components.leverage_index for r in mmi_results) / total_leverage,
                z_pressure=sum(r.components.z_pressure * r.components.leverage_index for r in mmi_results) / total_leverage,
                z_fatigue=sum(r.components.z_fatigue * r.components.leverage_index for r in mmi_results) / total_leverage,
                z_execution=sum(r.components.z_execution * r.components.leverage_index for r in mmi_results) / total_leverage,
                z_bio=sum(r.components.z_bio * r.components.leverage_index for r in mmi_results) / total_leverage,
                weight_leverage=self.weights["leverage"],
                weight_pressure=self.weights["pressure"],
                weight_fatigue=self.weights["fatigue"],
                weight_execution=self.weights["execution"],
                weight_bio=self.weights["bio"],
            )

            first_pitch = pitches[0]
            pa_result = MMIResult(
                pitch_id=None,
                game_id=first_pitch.game_id,
                batter_id=first_pitch.batter_id,
                pitcher_id=first_pitch.pitcher_id,
                inning=first_pitch.inning,
                mmi=weighted_mmi,
                components=weighted_components,
                role=role,
                meta={"aggregation": "weighted", "pitch_count": len(pitches)},
            )
        else:
            raise ValueError(f"Unknown aggregation: {aggregation}")

        return pa_result


def compute_pitch_mmi(
    pitch: PitchEvent,
    league_stats: LeagueStats,
    role: str = "pitcher",
    context: Optional[Dict] = None,
    custom_weights: Optional[Dict[str, float]] = None,
) -> MMIResult:
    """
    Convenience function to compute MMI for a single pitch.

    Args:
        pitch: PitchEvent object
        league_stats: Pre-computed league normalization parameters
        role: "pitcher" or "batter"
        context: Additional context (pitch counts, etc.)
        custom_weights: Optional custom component weights

    Returns:
        MMIResult
    """
    scaler_set = MMIScalerSet.from_league_stats(league_stats)
    calculator = MMICalculator(scaler_set=scaler_set, custom_weights=custom_weights)
    return calculator.compute_pitch_mmi(pitch, role=role, context=context)


def compute_pa_mmi(
    pitches: List[PitchEvent],
    league_stats: LeagueStats,
    role: str = "pitcher",
    aggregation: str = "max",
    contexts: Optional[List[Dict]] = None,
    custom_weights: Optional[Dict[str, float]] = None,
) -> MMIResult:
    """
    Convenience function to compute MMI for a plate appearance.

    Args:
        pitches: List of pitch events in the PA
        league_stats: League normalization parameters
        role: "pitcher" or "batter"
        aggregation: "max", "mean", or "weighted"
        contexts: Optional context for each pitch
        custom_weights: Optional custom weights

    Returns:
        MMIResult for the PA
    """
    scaler_set = MMIScalerSet.from_league_stats(league_stats)
    calculator = MMICalculator(scaler_set=scaler_set, custom_weights=custom_weights)
    return calculator.compute_pa_mmi(pitches, role=role, aggregation=aggregation, contexts=contexts)
