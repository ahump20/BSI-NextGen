# Changelog

All notable changes to the MMI Baseball package will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2024-11-20

### Added
- Initial release of MMI Baseball package
- Core MMI computation with 5 components:
  - Leverage Index (LI)
  - Pressure Score
  - Fatigue Score
  - Execution Windows
  - Bio-Proxies
- Data ingestion from MLB StatsAPI
- Offline data loading from CSV/JSON/Parquet
- Win probability and leverage index calculations
- Z-score normalization and scaler management
- Game-level and player-level aggregation
- Command-line interface (CLI)
- REST API with FastAPI
- Comprehensive test suite (pytest)
- Validation experiments module
- Example scripts and documentation

### Features
- **Data Models**: Complete Pydantic models for all data structures
- **MLB Integration**: Live data fetching from MLB StatsAPI
- **Normalization**: Robust z-score scaling with persistence
- **Aggregation**: Per-pitch, per-PA, per-game, per-player summaries
- **CLI Tools**: Fetch games, compute MMI, generate summaries
- **REST API**: Query games and players via HTTP
- **Validation**: Predictive modeling experiments
- **Extensible**: Pluggable bio-proxies for future biometric data

### Documentation
- Comprehensive README with quickstart guide
- API reference
- Example scripts
- Validation experiment documentation

## [Unreleased]

### Planned
- Statcast data integration (spin rate, release point, etc.)
- Enhanced win probability model
- Real biometric data support (HRV, sleep tracking)
- Database backend for historical MMI storage
- Interactive visualization dashboard
- Multi-season normalization options
- Player comparison tools
- Postseason-specific calibration
