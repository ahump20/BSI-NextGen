"""
Data models for MMI computation using Pydantic for validation and serialization.
"""

from datetime import datetime
from enum import Enum
from typing import Optional, Dict, Any
from pydantic import BaseModel, Field, validator


class PitchType(str, Enum):
    """Standard pitch type classifications."""
    FASTBALL = "FF"
    TWO_SEAM = "FT"
    CUTTER = "FC"
    SINKER = "SI"
    SLIDER = "SL"
    CURVEBALL = "CU"
    CHANGEUP = "CH"
    SPLITTER = "FS"
    KNUCKLEBALL = "KN"
    UNKNOWN = "UN"


class PitchResult(str, Enum):
    """Outcome of a pitch."""
    BALL = "ball"
    CALLED_STRIKE = "called_strike"
    SWINGING_STRIKE = "swinging_strike"
    FOUL = "foul"
    HIT_INTO_PLAY = "hit_into_play"
    HIT_BY_PITCH = "hit_by_pitch"


class EventType(str, Enum):
    """Plate appearance outcome."""
    SINGLE = "single"
    DOUBLE = "double"
    TRIPLE = "triple"
    HOME_RUN = "home_run"
    WALK = "walk"
    STRIKEOUT = "strikeout"
    GROUND_OUT = "ground_out"
    FLY_OUT = "fly_out"
    LINE_OUT = "line_out"
    POP_OUT = "pop_out"
    DOUBLE_PLAY = "double_play"
    TRIPLE_PLAY = "triple_play"
    FIELDERS_CHOICE = "fielders_choice"
    ERROR = "error"
    HIT_BY_PITCH = "hit_by_pitch"
    SACRIFICE = "sacrifice"
    OTHER = "other"


class BaseState(BaseModel):
    """Current base runner state."""
    runner_on_first: bool = False
    runner_on_second: bool = False
    runner_on_third: bool = False

    def to_code(self) -> str:
        """Convert to standard base code (e.g., '___', '1__', '12_', '123')."""
        code = ""
        code += "1" if self.runner_on_first else "_"
        code += "2" if self.runner_on_second else "_"
        code += "3" if self.runner_on_third else "_"
        return code

    def runners_on_base(self) -> int:
        """Count of runners on base."""
        return sum([self.runner_on_first, self.runner_on_second, self.runner_on_third])


class Count(BaseModel):
    """Ball-strike count."""
    balls: int = Field(ge=0, le=3)
    strikes: int = Field(ge=0, le=2)

    def to_string(self) -> str:
        """Return count as string (e.g., '0-2', '3-1')."""
        return f"{self.balls}-{self.strikes}"

    def is_hitters_count(self) -> bool:
        """True if count favors hitter (3-0, 3-1, 2-0)."""
        return self.balls >= 2 and self.strikes <= 1

    def is_pitchers_count(self) -> bool:
        """True if count favors pitcher (0-2, 1-2)."""
        return self.strikes == 2 and self.balls <= 1


class PitchEvent(BaseModel):
    """Complete representation of a single pitch."""
    # Identifiers
    game_id: str
    pitch_id: Optional[str] = None
    at_bat_index: int
    pitch_number: int  # Within this at-bat

    # Temporal
    game_date: datetime
    inning: int = Field(ge=1, le=20)  # Allow extra innings
    top_of_inning: bool

    # Participants
    batter_id: str
    batter_name: Optional[str] = None
    batter_team: str
    pitcher_id: str
    pitcher_name: Optional[str] = None
    pitcher_team: str
    home_team: str
    away_team: str

    # Game state
    outs: int = Field(ge=0, le=2)
    base_state: BaseState
    count: Count
    home_score: int = Field(ge=0)
    away_score: int = Field(ge=0)

    # Pitch details
    pitch_type: Optional[PitchType] = None
    velocity: Optional[float] = Field(None, ge=0, le=120)  # mph
    release_speed: Optional[float] = None

    # Pitch location (normalized from catcher's perspective, in feet)
    plate_x: Optional[float] = None  # Horizontal
    plate_z: Optional[float] = None  # Vertical

    # Result
    pitch_result: PitchResult
    is_final_pitch_of_pa: bool = False

    # Win probability
    wp_before: Optional[float] = Field(None, ge=0, le=1)
    wp_after: Optional[float] = Field(None, ge=0, le=1)

    # Venue and context
    venue: Optional[str] = None
    attendance: Optional[int] = Field(None, ge=0)
    is_postseason: bool = False
    is_elimination_game: bool = False

    # Timing
    time_since_last_pitch: Optional[float] = None  # seconds

    # Additional context
    meta: Dict[str, Any] = Field(default_factory=dict)

    @property
    def score_differential(self) -> int:
        """Score differential from batting team's perspective."""
        if self.top_of_inning:
            # Away team batting
            return self.away_score - self.home_score
        else:
            # Home team batting
            return self.home_score - self.away_score

    @property
    def inning_weight(self) -> float:
        """Weight based on inning (later innings = higher weight)."""
        return min(1.0, self.inning / 9.0)

    @validator("pitch_number")
    def pitch_number_positive(cls, v):
        if v < 1:
            raise ValueError("pitch_number must be >= 1")
        return v


class PlateAppearance(BaseModel):
    """Aggregate of all pitches in a plate appearance."""
    # Identifiers
    game_id: str
    at_bat_index: int
    pa_id: Optional[str] = None

    # Participants
    batter_id: str
    batter_name: Optional[str] = None
    pitcher_id: str
    pitcher_name: Optional[str] = None

    # Outcome
    event_type: EventType
    is_out: bool
    runs_scored: int = Field(ge=0)
    rbi: int = Field(ge=0)

    # All pitches in this PA
    pitches: list[PitchEvent]

    # Context at start of PA
    initial_outs: int = Field(ge=0, le=2)
    initial_base_state: BaseState
    inning: int
    top_of_inning: bool

    @property
    def pitch_count(self) -> int:
        """Number of pitches in this PA."""
        return len(self.pitches)

    @property
    def final_pitch(self) -> Optional[PitchEvent]:
        """Last pitch of the PA."""
        return self.pitches[-1] if self.pitches else None


class GameContext(BaseModel):
    """Overall game context and metadata."""
    game_id: str
    game_date: datetime
    home_team: str
    away_team: str
    venue: str
    attendance: Optional[int] = None

    # Game type
    is_postseason: bool = False
    is_elimination_game: bool = False
    is_day_game: bool = True

    # Weather (if available)
    temperature: Optional[float] = None
    weather_conditions: Optional[str] = None

    # Final score
    home_score: Optional[int] = None
    away_score: Optional[int] = None
    innings: int = 9

    meta: Dict[str, Any] = Field(default_factory=dict)


class LeagueStats(BaseModel):
    """Normalization parameters computed from league-wide data."""
    # Season identifier
    season: int
    season_type: str = "regular"  # regular, postseason, spring
    last_updated: datetime

    # Sample size
    total_pitches: int
    total_games: int

    # Component means and standard deviations for z-score normalization
    li_mean: float
    li_std: float

    pressure_mean: float
    pressure_std: float

    fatigue_mean: float
    fatigue_std: float

    execution_mean: float
    execution_std: float

    bio_proxies_mean: float
    bio_proxies_std: float

    # Additional statistics for context
    avg_leverage_index: float
    avg_game_attendance: float

    # Store raw stats for feature computation
    run_expectancy_matrix: Optional[Dict[str, float]] = None
    win_probability_table: Optional[Dict[str, float]] = None

    meta: Dict[str, Any] = Field(default_factory=dict)


class MMIComponents(BaseModel):
    """Individual components of MMI before final aggregation."""
    # Raw component values
    leverage_index: float
    pressure_score: float
    fatigue_score: float
    execution_windows: float
    bio_proxies: float

    # Z-scored components
    z_leverage: float
    z_pressure: float
    z_fatigue: float
    z_execution: float
    z_bio: float

    # Weights used (allow custom weights)
    weight_leverage: float = 0.35
    weight_pressure: float = 0.20
    weight_fatigue: float = 0.20
    weight_execution: float = 0.15
    weight_bio: float = 0.10

    @property
    def weighted_sum(self) -> float:
        """Compute weighted sum of z-scored components."""
        return (
            self.weight_leverage * self.z_leverage +
            self.weight_pressure * self.z_pressure +
            self.weight_fatigue * self.z_fatigue +
            self.weight_execution * self.z_execution +
            self.weight_bio * self.z_bio
        )


class MMIResult(BaseModel):
    """Complete MMI result for a pitch or plate appearance."""
    # Context
    pitch_id: Optional[str] = None
    game_id: str
    batter_id: str
    pitcher_id: str
    inning: int

    # MMI value
    mmi: float

    # Components breakdown
    components: MMIComponents

    # Additional metadata
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    role: str  # "pitcher" or "batter"

    meta: Dict[str, Any] = Field(default_factory=dict)


class PlayerMMISummary(BaseModel):
    """Aggregated MMI statistics for a player over a period."""
    player_id: str
    player_name: Optional[str] = None
    role: str  # "pitcher" or "batter"

    # Time period
    season: int
    season_type: str = "regular"
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None

    # Summary statistics
    total_pitches: int
    total_pas: Optional[int] = None  # For batters
    total_games: int

    mean_mmi: float
    median_mmi: float
    std_mmi: float

    # Percentiles
    p10_mmi: float
    p25_mmi: float
    p75_mmi: float
    p90_mmi: float
    p95_mmi: float
    p99_mmi: float

    # High-MMI moments
    high_mmi_count: int  # Count of pitches with MMI > 2.0
    extreme_mmi_count: int  # Count of pitches with MMI > 3.0

    # Component averages
    avg_leverage: float
    avg_pressure: float
    avg_fatigue: float
    avg_execution: float
    avg_bio: float

    meta: Dict[str, Any] = Field(default_factory=dict)
