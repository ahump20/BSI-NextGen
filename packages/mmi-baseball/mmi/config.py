"""
Configuration module for MMI package.

Manages paths, constants, and configuration parameters.
"""

from pathlib import Path
from typing import Dict

# Package root directory
PACKAGE_ROOT = Path(__file__).parent.parent

# Data directories
DATA_DIR = PACKAGE_ROOT / "data"
SCALERS_DIR = DATA_DIR / "scalers"
CACHE_DIR = DATA_DIR / "cache"

# Default scaler file
DEFAULT_SCALERS_FILE = SCALERS_DIR / "default_scalers.json"

# MMI component weights (default)
DEFAULT_WEIGHTS: Dict[str, float] = {
    "leverage": 0.35,
    "pressure": 0.20,
    "fatigue": 0.20,
    "execution": 0.15,
    "bio": 0.10,
}

# League average values (for fallback/defaults)
LEAGUE_AVG_ATTENDANCE = 30000.0
LEAGUE_AVG_WOBA = 0.320

# API configuration
MLB_STATS_API_BASE_URL = "https://statsapi.mlb.com/api/v1"
API_TIMEOUT = 30  # seconds

# MMI thresholds
MMI_HIGH_THRESHOLD = 2.0  # High-MMI moment
MMI_EXTREME_THRESHOLD = 3.0  # Extreme-MMI moment

# Logging
LOG_FORMAT = "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
LOG_LEVEL = "INFO"


def ensure_data_dirs():
    """Create data directories if they don't exist."""
    DATA_DIR.mkdir(exist_ok=True, parents=True)
    SCALERS_DIR.mkdir(exist_ok=True, parents=True)
    CACHE_DIR.mkdir(exist_ok=True, parents=True)
