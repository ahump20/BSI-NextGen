"""
Scaling and normalization utilities for MMI components.

Provides z-score normalization and parameter fitting from training data.
"""

import json
import logging
from pathlib import Path
from typing import List, Dict, Optional
from datetime import datetime
import math

from mmi.models import LeagueStats

logger = logging.getLogger(__name__)


class Scaler:
    """
    Z-score scaler for normalizing MMI components.

    Transforms raw feature values to z-scores: (x - mean) / std
    """

    def __init__(
        self,
        mean: float = 0.0,
        std: float = 1.0,
        name: str = "feature",
    ):
        """
        Initialize scaler with normalization parameters.

        Args:
            mean: Mean value for normalization
            std: Standard deviation for normalization
            name: Name of the feature being scaled
        """
        self.mean = mean
        self.std = std
        self.name = name

        if self.std == 0:
            logger.warning(f"Scaler for {name} has std=0, setting to 1.0")
            self.std = 1.0

    def transform(self, value: float) -> float:
        """
        Transform a value to z-score.

        Args:
            value: Raw feature value

        Returns:
            Z-score
        """
        if self.std == 0:
            return 0.0

        z_score = (value - self.mean) / self.std
        return z_score

    def inverse_transform(self, z_score: float) -> float:
        """
        Convert z-score back to original scale.

        Args:
            z_score: Standardized value

        Returns:
            Original scale value
        """
        return (z_score * self.std) + self.mean

    def fit(self, values: List[float]) -> None:
        """
        Fit scaler parameters from data.

        Args:
            values: List of feature values
        """
        if not values:
            logger.warning(f"No values provided to fit scaler for {self.name}")
            return

        n = len(values)
        self.mean = sum(values) / n

        # Calculate standard deviation
        variance = sum((x - self.mean) ** 2 for x in values) / n
        self.std = math.sqrt(variance)

        if self.std == 0:
            logger.warning(f"Fitted std=0 for {self.name}, setting to 1.0")
            self.std = 1.0

        logger.info(
            f"Fitted scaler for {self.name}: mean={self.mean:.4f}, std={self.std:.4f}"
        )

    def to_dict(self) -> Dict:
        """Export scaler parameters to dictionary."""
        return {
            "name": self.name,
            "mean": self.mean,
            "std": self.std,
        }

    @classmethod
    def from_dict(cls, data: Dict) -> "Scaler":
        """Create scaler from dictionary."""
        return cls(
            mean=data["mean"],
            std=data["std"],
            name=data.get("name", "feature"),
        )


class MMIScalerSet:
    """
    Complete set of scalers for all MMI components.

    Manages fitting, transformation, and persistence of all component scalers.
    """

    def __init__(self):
        """Initialize empty scaler set."""
        self.leverage_scaler = Scaler(name="leverage_index")
        self.pressure_scaler = Scaler(name="pressure")
        self.fatigue_scaler = Scaler(name="fatigue")
        self.execution_scaler = Scaler(name="execution")
        self.bio_scaler = Scaler(name="bio_proxies")

        # Metadata
        self.season: Optional[int] = None
        self.season_type: str = "regular"
        self.total_pitches: int = 0
        self.last_updated: Optional[datetime] = None

    def fit(
        self,
        leverage_values: List[float],
        pressure_values: List[float],
        fatigue_values: List[float],
        execution_values: List[float],
        bio_values: List[float],
        season: int,
        season_type: str = "regular",
    ) -> None:
        """
        Fit all scalers from training data.

        Args:
            leverage_values: List of leverage index values
            pressure_values: List of pressure scores
            fatigue_values: List of fatigue scores
            execution_values: List of execution scores
            bio_values: List of bio-proxies scores
            season: Season year
            season_type: Type of season (regular, postseason)
        """
        logger.info(f"Fitting MMI scalers for {season} {season_type}")

        self.leverage_scaler.fit(leverage_values)
        self.pressure_scaler.fit(pressure_values)
        self.fatigue_scaler.fit(fatigue_values)
        self.execution_scaler.fit(execution_values)
        self.bio_scaler.fit(bio_values)

        self.season = season
        self.season_type = season_type
        self.total_pitches = len(leverage_values)
        self.last_updated = datetime.utcnow()

        logger.info(f"Fitted scalers on {self.total_pitches} pitches")

    def transform_all(
        self,
        leverage: float,
        pressure: float,
        fatigue: float,
        execution: float,
        bio: float,
    ) -> Dict[str, float]:
        """
        Transform all components to z-scores.

        Args:
            leverage: Raw leverage index
            pressure: Raw pressure score
            fatigue: Raw fatigue score
            execution: Raw execution score
            bio: Raw bio-proxies score

        Returns:
            Dictionary of z-scores
        """
        return {
            "z_leverage": self.leverage_scaler.transform(leverage),
            "z_pressure": self.pressure_scaler.transform(pressure),
            "z_fatigue": self.fatigue_scaler.transform(fatigue),
            "z_execution": self.execution_scaler.transform(execution),
            "z_bio": self.bio_scaler.transform(bio),
        }

    def save(self, file_path: Path) -> None:
        """
        Save scaler parameters to JSON file.

        Args:
            file_path: Path to save JSON
        """
        data = {
            "metadata": {
                "season": self.season,
                "season_type": self.season_type,
                "total_pitches": self.total_pitches,
                "last_updated": self.last_updated.isoformat() if self.last_updated else None,
            },
            "scalers": {
                "leverage": self.leverage_scaler.to_dict(),
                "pressure": self.pressure_scaler.to_dict(),
                "fatigue": self.fatigue_scaler.to_dict(),
                "execution": self.execution_scaler.to_dict(),
                "bio_proxies": self.bio_scaler.to_dict(),
            },
        }

        with open(file_path, "w") as f:
            json.dump(data, f, indent=2)

        logger.info(f"Saved MMI scalers to {file_path}")

    @classmethod
    def load(cls, file_path: Path) -> "MMIScalerSet":
        """
        Load scaler parameters from JSON file.

        Args:
            file_path: Path to JSON file

        Returns:
            MMIScalerSet instance
        """
        with open(file_path, "r") as f:
            data = json.load(f)

        scaler_set = cls()

        # Load metadata
        metadata = data.get("metadata", {})
        scaler_set.season = metadata.get("season")
        scaler_set.season_type = metadata.get("season_type", "regular")
        scaler_set.total_pitches = metadata.get("total_pitches", 0)
        if metadata.get("last_updated"):
            scaler_set.last_updated = datetime.fromisoformat(metadata["last_updated"])

        # Load scalers
        scalers_data = data.get("scalers", {})
        scaler_set.leverage_scaler = Scaler.from_dict(scalers_data["leverage"])
        scaler_set.pressure_scaler = Scaler.from_dict(scalers_data["pressure"])
        scaler_set.fatigue_scaler = Scaler.from_dict(scalers_data["fatigue"])
        scaler_set.execution_scaler = Scaler.from_dict(scalers_data["execution"])
        scaler_set.bio_scaler = Scaler.from_dict(scalers_data["bio_proxies"])

        logger.info(f"Loaded MMI scalers from {file_path}")
        return scaler_set

    def to_league_stats(self, total_games: int = 2430) -> LeagueStats:
        """
        Convert scaler set to LeagueStats model.

        Args:
            total_games: Total number of games in sample

        Returns:
            LeagueStats object
        """
        return LeagueStats(
            season=self.season or datetime.now().year,
            season_type=self.season_type,
            last_updated=self.last_updated or datetime.utcnow(),
            total_pitches=self.total_pitches,
            total_games=total_games,
            li_mean=self.leverage_scaler.mean,
            li_std=self.leverage_scaler.std,
            pressure_mean=self.pressure_scaler.mean,
            pressure_std=self.pressure_scaler.std,
            fatigue_mean=self.fatigue_scaler.mean,
            fatigue_std=self.fatigue_scaler.std,
            execution_mean=self.execution_scaler.mean,
            execution_std=self.execution_scaler.std,
            bio_proxies_mean=self.bio_scaler.mean,
            bio_proxies_std=self.bio_scaler.std,
            avg_leverage_index=self.leverage_scaler.mean,
            avg_game_attendance=30000.0,  # Default
        )

    @classmethod
    def from_league_stats(cls, league_stats: LeagueStats) -> "MMIScalerSet":
        """
        Create scaler set from LeagueStats model.

        Args:
            league_stats: LeagueStats object

        Returns:
            MMIScalerSet instance
        """
        scaler_set = cls()

        scaler_set.leverage_scaler = Scaler(
            mean=league_stats.li_mean,
            std=league_stats.li_std,
            name="leverage_index",
        )
        scaler_set.pressure_scaler = Scaler(
            mean=league_stats.pressure_mean,
            std=league_stats.pressure_std,
            name="pressure",
        )
        scaler_set.fatigue_scaler = Scaler(
            mean=league_stats.fatigue_mean,
            std=league_stats.fatigue_std,
            name="fatigue",
        )
        scaler_set.execution_scaler = Scaler(
            mean=league_stats.execution_mean,
            std=league_stats.execution_std,
            name="execution",
        )
        scaler_set.bio_scaler = Scaler(
            mean=league_stats.bio_proxies_mean,
            std=league_stats.bio_proxies_std,
            name="bio_proxies",
        )

        scaler_set.season = league_stats.season
        scaler_set.season_type = league_stats.season_type
        scaler_set.total_pitches = league_stats.total_pitches
        scaler_set.last_updated = league_stats.last_updated

        return scaler_set


def create_default_scalers() -> MMIScalerSet:
    """
    Create default scaler set with reasonable initial values.

    These are approximate values based on expected distributions.
    Should be replaced with fitted values from real data.

    Returns:
        MMIScalerSet with default parameters
    """
    scaler_set = MMIScalerSet()

    # Default leverage index: mean ~1.0, std ~0.5
    scaler_set.leverage_scaler = Scaler(mean=1.0, std=0.5, name="leverage_index")

    # Default pressure: mean ~3.0, std ~1.5
    scaler_set.pressure_scaler = Scaler(mean=3.0, std=1.5, name="pressure")

    # Default fatigue: mean ~2.5, std ~1.2
    scaler_set.fatigue_scaler = Scaler(mean=2.5, std=1.2, name="fatigue")

    # Default execution: mean ~3.0, std ~1.0
    scaler_set.execution_scaler = Scaler(mean=3.0, std=1.0, name="execution")

    # Default bio: mean ~1.0, std ~0.8
    scaler_set.bio_scaler = Scaler(mean=1.0, std=0.8, name="bio_proxies")

    scaler_set.season = datetime.now().year
    scaler_set.season_type = "default"
    scaler_set.last_updated = datetime.utcnow()

    logger.info("Created default MMI scaler set")

    return scaler_set
