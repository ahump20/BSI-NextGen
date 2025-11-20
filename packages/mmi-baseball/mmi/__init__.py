"""
Moment Mentality Index (MMI) for Baseball

A production-ready Python package for computing the Moment Mentality Index,
a per-pitch metric that quantifies how mentally demanding a moment is for a player.
"""

__version__ = "0.1.0"

from mmi.models import (
    PitchEvent,
    PlateAppearance,
    GameContext,
    LeagueStats,
    MMIComponents,
    MMIResult,
)
from mmi.mmi_core import compute_pitch_mmi, compute_pa_mmi
from mmi.aggregate import compute_game_mmi, summarize_mmi_by_player

__all__ = [
    "PitchEvent",
    "PlateAppearance",
    "GameContext",
    "LeagueStats",
    "MMIComponents",
    "MMIResult",
    "compute_pitch_mmi",
    "compute_pa_mmi",
    "compute_game_mmi",
    "summarize_mmi_by_player",
]
