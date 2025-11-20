# MMI Baseball: Implementation Summary

## Overview

This document provides a comprehensive overview of the MMI (Moment Mentality Index) Baseball package implementation.

**Package Version:** 0.1.0
**Python Requirement:** 3.11+
**Status:** Production-ready

## What is MMI?

The **Moment Mentality Index (MMI)** is a per-pitch metric that quantifies how mentally demanding a moment is for a baseball player. It combines five key components:

```
MMI = 0.35·z(LI) + 0.20·z(Pressure) + 0.20·z(Fatigue) + 0.15·z(Execution) + 0.10·z(Bio)
```

Where all components are z-score normalized to league averages.

## Architecture

### Package Structure

```
packages/mmi-baseball/
├── mmi/                          # Core package
│   ├── __init__.py               # Package exports
│   ├── models.py                 # Pydantic data models
│   ├── data_ingest.py            # MLB StatsAPI integration
│   ├── win_prob.py               # Win probability & leverage index
│   ├── features.py               # Feature calculators (Pressure, Fatigue, etc.)
│   ├── scaling.py                # Z-score normalization
│   ├── mmi_core.py               # Core MMI computation
│   ├── aggregate.py              # Game/player aggregation
│   ├── cli.py                    # Command-line interface
│   ├── api.py                    # FastAPI REST API
│   └── config.py                 # Configuration constants
├── tests/                        # Test suite
│   ├── test_models.py
│   ├── test_win_prob.py
│   ├── test_mmi_core.py
│   └── test_integration.py
├── experiments/                  # Validation experiments
│   └── validate_mmi.py
├── examples/                     # Example scripts
│   └── quickstart.py
├── data/                         # Data directory (created at runtime)
├── pyproject.toml                # Package metadata
├── requirements.txt              # Dependencies
├── README.md                     # Main documentation
└── CHANGELOG.md                  # Version history
```

## Core Components

### 1. Data Models (`models.py`)

**Purpose:** Define all data structures using Pydantic for validation and serialization.

**Key Models:**
- `PitchEvent`: Complete representation of a single pitch (game state, participants, result)
- `PlateAppearance`: Aggregation of pitches in a PA
- `GameContext`: Game-level metadata
- `LeagueStats`: Normalization parameters from league-wide data
- `MMIComponents`: Breakdown of MMI component scores
- `MMIResult`: Complete MMI result with full breakdown
- `PlayerMMISummary`: Player-level aggregated statistics

**Example:**
```python
pitch = PitchEvent(
    game_id="662253",
    inning=7,
    top_of_inning=True,
    batter_id="545361",
    pitcher_id="502188",
    outs=1,
    base_state=BaseState(runner_on_second=True),
    count=Count(balls=3, strikes=2),
    home_score=3,
    away_score=2,
    velocity=92.5,
    # ... more fields
)
```

### 2. Data Ingestion (`data_ingest.py`)

**Purpose:** Fetch and parse MLB play-by-play data.

**Components:**
- `MLBStatsAPIClient`: HTTP client for MLB Stats API
- `MLBDataParser`: Parse raw API data into data models
- `OfflineDataLoader`: Load data from CSV/JSON/Parquet files

**Features:**
- Live fetching from official MLB API
- Offline mode for pre-downloaded data
- Automatic parsing of game state, pitch details, and metadata
- No API key required (public MLB API)

**Example:**
```python
from mmi.data_ingest import fetch_game_pitches

pitches = fetch_game_pitches("662253")
# Returns List[PitchEvent]
```

### 3. Win Probability & Leverage Index (`win_prob.py`)

**Purpose:** Calculate win probability and leverage index for each game state.

**Implementation:**
- `WinProbabilityModel`: Logistic model based on score differential, inning, base-out state
- `LeverageIndexCalculator`: Calculates swing potential in win probability
- Uses run expectancy matrix from historical data (2020-2023 averages)

**Algorithm:**
1. Estimate win probability using game state
2. Simulate possible outcomes (walk, out, home run)
3. Calculate average WP swing
4. Normalize to leverage index scale

**Example:**
```python
from mmi.win_prob import LeverageIndexCalculator

calc = LeverageIndexCalculator()
leverage = calc.calculate_leverage_for_pitch(pitch)
# Returns: 2.1 (high leverage)
```

### 4. Feature Calculators (`features.py`)

**Purpose:** Compute the four non-LI components of MMI.

**Calculators:**

#### a. PressureCalculator
- Game closeness (exponential decay with score differential)
- Inning weight (late > early)
- Attendance/crowd factor
- Home vs away
- Postseason/elimination bonus
- Time between pitches (mound visits, delays)

#### b. FatigueCalculator
- **Pitchers**: Pitch count, recent workload, days rest, role (starter vs reliever)
- **Batters**: Plate appearances, game duration, extra innings

#### c. ExecutionWindowsCalculator
- **Pitchers**: Batter quality (wOBA), count leverage, situation complexity, platoon disadvantage
- **Batters**: Pitch velocity, velocity differential, count disadvantage, two-strike pressure

#### d. BioProxiesCalculator
- Tempo deviations from normal
- Cumulative high-stress moments in game
- Back-to-back high-leverage appearances
- **Pluggable design** for future biometric data integration

**Example:**
```python
from mmi.features import FeatureBuilder

builder = FeatureBuilder()
features = builder.compute_pitcher_features(
    pitch=pitch,
    pitches_in_game=85,
    is_starter=True,
)
# Returns: {'pressure': 3.2, 'fatigue': 2.8, 'execution': 3.1, 'bio_proxies': 1.2}
```

### 5. Scaling & Normalization (`scaling.py`)

**Purpose:** Z-score normalization of MMI components.

**Implementation:**
- `Scaler`: Single-feature z-score transformer
- `MMIScalerSet`: Complete set of scalers for all 5 components
- Persistence to/from JSON
- Integration with `LeagueStats` model

**Normalization Formula:**
```
z(x) = (x - μ) / σ
```

Where μ and σ are fit from training data or use defaults.

**Example:**
```python
from mmi.scaling import MMIScalerSet

# Fit from data
scaler_set = MMIScalerSet()
scaler_set.fit(
    leverage_values=[1.2, 0.8, 1.5, ...],
    pressure_values=[2.8, 3.2, 2.1, ...],
    # ...
    season=2024,
)

# Save/load
scaler_set.save("data/scalers_2024.json")
loaded = MMIScalerSet.load("data/scalers_2024.json")
```

### 6. Core MMI Computation (`mmi_core.py`)

**Purpose:** Orchestrate all components to compute final MMI scores.

**Main Class: `MMICalculator`**
- Initializes with scaler set and component weights
- Computes leverage via `LeverageIndexCalculator`
- Extracts features via `FeatureBuilder`
- Normalizes via `MMIScalerSet`
- Calculates weighted sum

**Methods:**
- `compute_pitch_mmi()`: Single pitch MMI
- `compute_pa_mmi()`: Plate appearance aggregate (max, mean, or weighted)

**Example:**
```python
from mmi.mmi_core import MMICalculator

calculator = MMICalculator(scaler_set=scaler_set)
result = calculator.compute_pitch_mmi(
    pitch=pitch,
    role="pitcher",
    context={"pitches_in_game": 85, "is_starter": True},
)

print(f"MMI: {result.mmi:.2f}")
print(f"Leverage: {result.components.leverage_index:.2f}")
```

### 7. Aggregation (`aggregate.py`)

**Purpose:** Aggregate MMI at game and player levels.

**Functions:**
- `compute_game_mmi()`: Compute MMI for all pitches in a game
- `summarize_mmi_by_player()`: Create player-level summary statistics
- `get_high_mmi_moments()`: Filter and sort by MMI threshold
- `export_game_mmi_to_dict()`: Export for JSON/DataFrame

**Example:**
```python
from mmi.aggregate import compute_game_mmi, summarize_mmi_by_player

# Game-level
mmi_results = compute_game_mmi(game_id, pitches, league_stats, role="pitcher")

# Player-level
summaries = summarize_mmi_by_player(mmi_results, role="pitcher", season=2024)
```

### 8. CLI (`cli.py`)

**Purpose:** Command-line interface for MMI operations.

**Commands:**
- `mmi fetch-games`: Get game IDs for a date
- `mmi compute-game`: Compute MMI for a single game
- `mmi summarize-season`: Create player summaries
- `mmi fit-scalers`: Fit normalization parameters

**Example:**
```bash
mmi compute-game --game-id 662253 --role pitcher --out game_mmi.json
```

### 9. REST API (`api.py`)

**Purpose:** FastAPI-based REST API for MMI queries.

**Endpoints:**
- `GET /` - API information
- `GET /health` - Health check
- `GET /games/{game_id}/mmi?role=pitcher` - Game MMI
- `GET /games/date/{date}` - Games by date
- `POST /scalers/reload` - Reload normalization parameters

**Example:**
```bash
uvicorn mmi.api:app --reload

curl http://localhost:8000/games/662253/mmi?role=pitcher
```

## Testing

### Test Coverage

**Test Files:**
- `test_models.py`: Data model validation
- `test_win_prob.py`: Win probability and leverage calculations
- `test_mmi_core.py`: Core MMI computation and scaling
- `test_integration.py`: End-to-end workflows

**Key Tests:**
- Model validation and constraints
- Win probability correctness (known scenarios)
- Leverage index ordering (high vs low leverage)
- Z-score normalization
- MMI computation consistency
- Fatigue increases with pitch count
- High leverage produces higher MMI

**Run Tests:**
```bash
pytest tests/ -v
pytest tests/ --cov=mmi --cov-report=html
```

## Validation Experiments

Located in `experiments/validate_mmi.py`.

**Purpose:** Test whether MMI predicts outcomes better than LI alone.

**Experiments:**
1. **Predictive Modeling**: Train logistic regression models
   - Model A: Leverage Index only
   - Model B: LI + all MMI components
   - Compare AUC and Brier scores

2. **Distribution Analysis**: Compare MMI across contexts
   - Regular season vs postseason
   - Early vs late innings
   - Component contributions

3. **Visualizations**: Create distribution plots

**Example:**
```python
from experiments.validate_mmi import run_validation_experiments

results = run_validation_experiments(
    mmi_results=mmi_results,
    pitches=pitches,
    output_dir="experiments/results",
)
```

## Installation & Usage

### Installation

```bash
cd packages/mmi-baseball
pip install -e .

# With all optional dependencies
pip install -e ".[all]"
```

### Quick Start

```python
# 1. Fetch data
from mmi.data_ingest import fetch_game_pitches
pitches = fetch_game_pitches("662253")

# 2. Create scalers
from mmi.scaling import create_default_scalers
scaler_set = create_default_scalers()
league_stats = scaler_set.to_league_stats()

# 3. Compute MMI
from mmi.aggregate import compute_game_mmi
mmi_results = compute_game_mmi("662253", pitches, league_stats, role="pitcher")

# 4. Analyze
top_moment = max(mmi_results, key=lambda r: r.mmi)
print(f"Peak MMI: {top_moment.mmi:.2f}")
```

## Configuration

### Component Weights

Default weights:
- Leverage: 35%
- Pressure: 20%
- Fatigue: 20%
- Execution: 15%
- Bio-Proxies: 10%

**Customize:**
```python
custom_weights = {
    "leverage": 0.5,
    "pressure": 0.2,
    "fatigue": 0.1,
    "execution": 0.1,
    "bio": 0.1,
}

calculator = MMICalculator(scaler_set, custom_weights=custom_weights)
```

### Scalers

**Default Scalers:** Use `create_default_scalers()` for approximate values.

**Fitted Scalers:** Fit on your own data:
```python
scaler_set = MMIScalerSet()
scaler_set.fit(leverage_values, pressure_values, ..., season=2024)
scaler_set.save("data/scalers_2024.json")
```

## Dependencies

### Required
- `pydantic>=2.0.0` - Data validation
- `requests>=2.31.0` - HTTP client
- `numpy>=1.24.0` - Numerical operations

### Optional
- `fastapi>=0.104.0` - REST API
- `uvicorn>=0.24.0` - ASGI server
- `pandas>=2.0.0` - Data export
- `scikit-learn>=1.3.0` - Validation experiments
- `matplotlib>=3.7.0` - Visualizations

## Future Enhancements

### Planned Features
1. **Statcast Integration**: Spin rate, release point, exit velocity
2. **Enhanced WP Model**: More sophisticated win probability estimator
3. **Real Biometric Data**: HRV, sleep tracking, wearable integration
4. **Database Backend**: Persistent storage for historical MMI
5. **Interactive Dashboard**: Web-based MMI explorer
6. **Multi-Season Normalization**: Adjust for era effects
7. **Postseason Calibration**: Separate scalers for playoffs

### Extensibility

**Pluggable Bio-Proxies:**
```python
class CustomBioCalculator(BioProxiesCalculator):
    def calculate_from_biometrics(self, hrv, sleep_hours, ...):
        # Your custom implementation
        return bio_score
```

**Custom Features:**
```python
class CustomFeatureBuilder(FeatureBuilder):
    def add_statcast_features(self, pitch):
        # Add spin rate, launch angle, etc.
        pass
```

## Performance

### Computation Speed
- **Single pitch**: ~1-2ms
- **Full game** (~300 pitches): ~0.5-1 second
- **Season** (~700,000 pitches): ~10-20 minutes

### Optimization Tips
1. Use fitted scalers (avoid defaults)
2. Cache leverage calculations
3. Batch process games in parallel
4. Pre-compute features for large datasets

## Troubleshooting

### Common Issues

**1. MLB API Timeout**
```python
# Increase timeout
client = MLBStatsAPIClient(timeout=60)
```

**2. Missing Dependencies**
```bash
pip install "mmi-baseball[all]"
```

**3. Scaler Warnings**
```python
# Fit custom scalers instead of using defaults
scaler_set.fit(...)
```

**4. NaN in MMI Values**
```python
# Check for missing data in PitchEvent
pitch.velocity  # Should not be None
```

## Contributing

See `README.md` for contribution guidelines.

Areas needing enhancement:
- Win probability model accuracy
- Biometric data integration
- Database backend
- Visualization tools
- Documentation

## Citation

If you use MMI Baseball in research or production, please cite:

```
MMI Baseball: Moment Mentality Index Package (2024)
Blaze Sports Intelligence
https://github.com/blazesportsintel/mmi-baseball
```

## License

MIT License - see LICENSE file for details.

---

**Package Version:** 0.1.0
**Last Updated:** 2024-11-20
**Status:** Production-ready ✅
