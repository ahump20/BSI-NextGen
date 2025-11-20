# MMI Baseball: Moment Mentality Index

A production-ready Python package for computing the **Moment Mentality Index (MMI)**, a per-pitch metric that quantifies how mentally demanding a moment is for a baseball player.

MMI combines **leverage**, **pressure**, **fatigue**, **execution difficulty**, and **bio-behavioral signals** into a single, normalized score that captures the mental intensity of each pitch.

## 🎯 What is MMI?

The **Moment Mentality Index (MMI)** is defined as:

```
MMI = 0.35·z(LI) + 0.20·z(Pressure) + 0.20·z(Fatigue) + 0.15·z(Execution) + 0.10·z(Bio)
```

Where:
- **z()** = z-score normalization (standardized to league averages)
- **LI** = Leverage Index (win probability swing potential)
- **Pressure** = Game context pressure (closeness, crowd, stakes)
- **Fatigue** = Cumulative physical/mental wear
- **Execution** = Technical difficulty of the task
- **Bio** = Behavioral/physiological proxies

### Components

1. **Leverage Index (35% weight)**
   - Based on win probability model
   - Accounts for score, inning, base-out state
   - Higher in close games, late innings

2. **Pressure Score (20% weight)**
   - Game closeness (tight score differential)
   - Inning importance (late > early)
   - Venue/crowd (attendance, home vs. away)
   - Postseason and elimination games

3. **Fatigue Score (20% weight)**
   - **Pitchers**: Pitch count, recent workload, days rest
   - **Batters**: Plate appearances, game duration
   - Role-specific (starters vs. relievers)

4. **Execution Windows (15% weight)**
   - **Pitchers**: Batter quality, count leverage, situation complexity
   - **Batters**: Pitch velocity, count disadvantage, pitch difficulty

5. **Bio-Proxies (10% weight)**
   - Tempo deviations (rushed or delayed)
   - Cumulative high-stress moments in game
   - Back-to-back high-leverage appearances
   - Pluggable: designed for future biometric integration

## 📦 Installation

### From Source

```bash
cd packages/mmi-baseball
pip install -e .
```

### Dependencies

```bash
pip install -r requirements.txt
```

**Required:**
- Python 3.11+
- pydantic
- requests
- numpy

**Optional:**
- pandas (for CSV/Parquet export)
- fastapi + uvicorn (for REST API)
- scikit-learn (for validation experiments)
- matplotlib (for visualizations)

## 🚀 Quick Start

### 1. Compute MMI for a Single Game

```python
from datetime import date
from mmi.data_ingest import fetch_game_pitches
from mmi.scaling import create_default_scalers
from mmi.aggregate import compute_game_mmi

# Fetch game data
game_id = "662253"
pitches = fetch_game_pitches(game_id)

# Create or load scalers (normalization parameters)
scaler_set = create_default_scalers()
league_stats = scaler_set.to_league_stats()

# Compute MMI for all pitches (pitcher perspective)
mmi_results = compute_game_mmi(game_id, pitches, league_stats, role="pitcher")

# Print top 5 highest MMI pitches
top_moments = sorted(mmi_results, key=lambda r: r.mmi, reverse=True)[:5]
for result in top_moments:
    print(f"Pitch {result.pitch_id}: MMI = {result.mmi:.2f}")
```

### 2. Summarize by Player

```python
from mmi.aggregate import summarize_mmi_by_player

# Aggregate across multiple games
summaries = summarize_mmi_by_player(mmi_results, role="pitcher", season=2024)

for summary in summaries:
    print(f"{summary.player_id}: Mean MMI = {summary.mean_mmi:.2f}, "
          f"High-MMI moments = {summary.high_mmi_count}")
```

### 3. Using the CLI

```bash
# Fetch games for a date
mmi fetch-games --date 2024-06-15 --out games.json

# Compute MMI for a game
mmi compute-game --game-id 662253 --role pitcher --out game_mmi.json

# Summarize a season
mmi summarize-season --year 2024 --role pitcher --input season_data.json --out summaries.csv
```

### 4. REST API

```bash
# Start the API server
uvicorn mmi.api:app --reload

# Query endpoints
curl http://localhost:8000/games/662253/mmi?role=pitcher
curl http://localhost:8000/games/date/2024-06-15
curl http://localhost:8000/health
```

## 📊 Data Ingestion

### Live from MLB StatsAPI

```python
from mmi.data_ingest import MLBStatsAPIClient, fetch_game_pitches

# Fetch a single game
pitches = fetch_game_pitches("662253")

# Fetch games by date
from datetime import date
client = MLBStatsAPIClient()
game_ids = client.get_schedule(date(2024, 6, 15))
```

### From Offline Files

```python
from pathlib import Path
from mmi.data_ingest import OfflineDataLoader

# Load from JSON
loader = OfflineDataLoader()
pitches = loader.load_from_json(Path("data/pitches.json"))

# Load from CSV (requires pandas)
pitches = loader.load_from_csv(Path("data/pitches.csv"))
```

## 🔧 Normalization & Scalers

MMI components are z-score normalized using league-wide statistics. You can fit scalers from your own data or use defaults.

### Fit Scalers from Data

```python
from mmi.win_prob import LeverageIndexCalculator
from mmi.features import FeatureBuilder
from mmi.scaling import MMIScalerSet

# Compute components for all pitches in your training set
leverage_values = []
pressure_values = []
# ... (compute for all pitches)

# Fit scalers
scaler_set = MMIScalerSet()
scaler_set.fit(
    leverage_values=leverage_values,
    pressure_values=pressure_values,
    fatigue_values=fatigue_values,
    execution_values=execution_values,
    bio_values=bio_values,
    season=2024,
)

# Save for later use
scaler_set.save(Path("data/scalers_2024.json"))
```

### Load Pre-fitted Scalers

```python
from mmi.scaling import MMIScalerSet

scaler_set = MMIScalerSet.load(Path("data/scalers_2024.json"))
league_stats = scaler_set.to_league_stats()
```

## 🧪 Validation Experiments

Run validation experiments to test if MMI predicts outcomes better than LI alone:

```python
from experiments.validate_mmi import run_validation_experiments

results = run_validation_experiments(
    mmi_results=mmi_results,
    pitches=pitches,
    output_dir=Path("experiments/results"),
)

print(f"AUC improvement: {results['prediction_evaluation']['improvement_auc']:.3f}")
```

This will:
- Train logistic regression models (LI only vs. LI + MMI components)
- Report AUC and Brier score improvements
- Generate distribution plots
- Save results to JSON

## 🏗️ Architecture

```
mmi/
├── models.py          # Pydantic data models
├── data_ingest.py     # MLB StatsAPI client and parsers
├── win_prob.py        # Win probability and leverage index
├── features.py        # Pressure, Fatigue, Execution, Bio calculators
├── scaling.py         # Z-score normalization
├── mmi_core.py        # Core MMI computation
├── aggregate.py       # Game and player aggregation
├── cli.py             # Command-line interface
├── api.py             # FastAPI REST API
└── config.py          # Configuration constants
```

## 🎨 Customization

### Custom Component Weights

```python
from mmi.mmi_core import MMICalculator

custom_weights = {
    "leverage": 0.5,    # Increase leverage weight
    "pressure": 0.2,
    "fatigue": 0.1,
    "execution": 0.1,
    "bio": 0.1,
}

calculator = MMICalculator(scaler_set=scaler_set, custom_weights=custom_weights)
result = calculator.compute_pitch_mmi(pitch, role="pitcher")
```

### Pluggable Bio-Proxies

The `BioProxiesCalculator` is designed to accept real biometric data:

```python
from mmi.features import BioProxiesCalculator

bio_calc = BioProxiesCalculator()

# Current: uses behavioral proxies
bio_score = bio_calc.calculate(pitch, pitches_in_game=50)

# Future: plug in real HRV, sleep, or other biometric data
# bio_score = bio_calc.calculate_from_biometrics(hrv=65, sleep_hours=7.5, ...)
```

## 📈 Example Use Cases

### 1. Identify Clutch Performers

```python
# Get players with highest average MMI in high-leverage situations
high_leverage_moments = [r for r in mmi_results if r.components.leverage_index > 2.0]
summaries = summarize_mmi_by_player(high_leverage_moments, role="pitcher")

# Sort by mean MMI
top_clutch = sorted(summaries, key=lambda s: s.mean_mmi, reverse=True)[:10]
```

### 2. Pitcher Workload Management

```python
# Track cumulative high-MMI exposure
pitcher_mmis = [r for r in mmi_results if r.pitcher_id == "12345"]
high_stress_count = sum(1 for r in pitcher_mmis if r.mmi > 2.0)

print(f"High-stress pitches: {high_stress_count}")
```

### 3. Game Narrative Analysis

```python
# Find the most intense moment of a game
peak_moment = max(mmi_results, key=lambda r: r.mmi)

print(f"Peak MMI: {peak_moment.mmi:.2f}")
print(f"Inning: {peak_moment.inning}, Leverage: {peak_moment.components.leverage_index:.2f}")
```

## 🧪 Testing

Run tests with pytest:

```bash
# All tests
pytest tests/ -v

# Specific test file
pytest tests/test_mmi_core.py -v

# With coverage
pytest tests/ --cov=mmi --cov-report=html
```

## 📚 API Reference

### Core Functions

**`compute_pitch_mmi(pitch, league_stats, role, context)`**
- Compute MMI for a single pitch
- Returns: `MMIResult`

**`compute_pa_mmi(pitches, league_stats, role, aggregation)`**
- Aggregate MMI for a plate appearance
- Aggregation: `"max"`, `"mean"`, or `"weighted"`

**`compute_game_mmi(game_id, pitches, league_stats, role)`**
- Compute MMI for all pitches in a game
- Returns: `List[MMIResult]`

**`summarize_mmi_by_player(mmi_results, role, season)`**
- Create player-level summary statistics
- Returns: `List[PlayerMMISummary]`

### REST API Endpoints

- `GET /` - API info
- `GET /health` - Health check
- `GET /games/{game_id}/mmi?role=pitcher` - Get game MMI
- `GET /games/date/{date}` - Get games by date
- `POST /scalers/reload` - Reload normalization parameters

## 🤝 Contributing

Contributions welcome! Areas for enhancement:

1. **Better Win Probability Model**: Integrate more sophisticated WP estimators
2. **Biometric Integration**: Add support for real HRV, sleep, and wearable data
3. **Pitch-level Tracking**: Incorporate Statcast data for spin rate, release point
4. **Database Backend**: Add persistent storage for historical MMI data
5. **Visualization Dashboard**: Build interactive MMI explorer

## 📄 License

MIT License - see LICENSE file for details.

## 🙏 Acknowledgments

- MLB StatsAPI for free play-by-play data
- Win Probability and Leverage Index research by Tom Tango
- Run Expectancy matrices from Baseball Prospectus

## 📞 Contact

For questions or issues, please open a GitHub issue or contact the maintainers.

---

**Built with ❤️ for baseball analytics**
