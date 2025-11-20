"""
Data ingestion layer for MLB play-by-play data.

Supports both live API fetching from MLB StatsAPI and offline data loading
from CSV/JSON/Parquet files.
"""

import json
import logging
from datetime import datetime, date
from pathlib import Path
from typing import Optional, List, Dict, Any
import requests
from mmi.models import (
    PitchEvent,
    PlateAppearance,
    GameContext,
    BaseState,
    Count,
    PitchType,
    PitchResult,
    EventType,
)

logger = logging.getLogger(__name__)


class MLBStatsAPIClient:
    """Client for fetching data from MLB Stats API."""

    BASE_URL = "https://statsapi.mlb.com/api/v1"

    def __init__(self, timeout: int = 30):
        """
        Initialize MLB StatsAPI client.

        Args:
            timeout: Request timeout in seconds
        """
        self.timeout = timeout
        self.session = requests.Session()
        self.session.headers.update({
            "User-Agent": "MMI-Baseball-Package/0.1.0",
            "Accept": "application/json",
        })

    def get_schedule(
        self,
        start_date: date,
        end_date: Optional[date] = None,
        team_id: Optional[int] = None,
    ) -> List[Dict[str, Any]]:
        """
        Fetch game schedule for a date range.

        Args:
            start_date: Start date for schedule
            end_date: End date (defaults to start_date)
            team_id: Optional team ID to filter

        Returns:
            List of game dictionaries
        """
        if end_date is None:
            end_date = start_date

        params = {
            "sportId": 1,  # MLB
            "startDate": start_date.isoformat(),
            "endDate": end_date.isoformat(),
            "hydrate": "game(content(summary)),linescore,team",
        }

        if team_id:
            params["teamId"] = team_id

        url = f"{self.BASE_URL}/schedule"
        logger.info(f"Fetching schedule from {url} with params {params}")

        try:
            response = self.session.get(url, params=params, timeout=self.timeout)
            response.raise_for_status()
            data = response.json()

            games = []
            for date_entry in data.get("dates", []):
                games.extend(date_entry.get("games", []))

            logger.info(f"Found {len(games)} games")
            return games

        except requests.exceptions.RequestException as e:
            logger.error(f"Error fetching schedule: {e}")
            raise

    def get_game_data(self, game_id: str) -> Dict[str, Any]:
        """
        Fetch complete game data including play-by-play.

        Args:
            game_id: MLB game ID (e.g., "662253")

        Returns:
            Complete game data dictionary
        """
        url = f"{self.BASE_URL}/game/{game_id}/feed/live"
        logger.info(f"Fetching game data for {game_id}")

        try:
            response = self.session.get(url, timeout=self.timeout)
            response.raise_for_status()
            data = response.json()
            return data

        except requests.exceptions.RequestException as e:
            logger.error(f"Error fetching game {game_id}: {e}")
            raise

    def get_play_by_play(self, game_id: str) -> List[Dict[str, Any]]:
        """
        Extract play-by-play data from game feed.

        Args:
            game_id: MLB game ID

        Returns:
            List of play dictionaries
        """
        game_data = self.get_game_data(game_id)
        plays = game_data.get("liveData", {}).get("plays", {}).get("allPlays", [])
        logger.info(f"Extracted {len(plays)} plays from game {game_id}")
        return plays


class MLBDataParser:
    """Parser for converting MLB StatsAPI data to MMI data models."""

    @staticmethod
    def parse_pitch_type(pitch_data: Dict[str, Any]) -> Optional[PitchType]:
        """Convert MLB pitch type code to PitchType enum."""
        pitch_type_code = pitch_data.get("details", {}).get("type", {}).get("code")

        type_map = {
            "FF": PitchType.FASTBALL,
            "FT": PitchType.TWO_SEAM,
            "FC": PitchType.CUTTER,
            "SI": PitchType.SINKER,
            "SL": PitchType.SLIDER,
            "CU": PitchType.CURVEBALL,
            "CH": PitchType.CHANGEUP,
            "FS": PitchType.SPLITTER,
            "KN": PitchType.KNUCKLEBALL,
        }

        return type_map.get(pitch_type_code, PitchType.UNKNOWN)

    @staticmethod
    def parse_pitch_result(pitch_data: Dict[str, Any]) -> PitchResult:
        """Convert MLB pitch result to PitchResult enum."""
        details = pitch_data.get("details", {})
        description = details.get("description", "").lower()

        if "ball" in description and "foul" not in description:
            return PitchResult.BALL
        elif "called strike" in description:
            return PitchResult.CALLED_STRIKE
        elif "swinging strike" in description:
            return PitchResult.SWINGING_STRIKE
        elif "foul" in description:
            return PitchResult.FOUL
        elif "in play" in description:
            return PitchResult.HIT_INTO_PLAY
        elif "hit by pitch" in description:
            return PitchResult.HIT_BY_PITCH
        else:
            return PitchResult.BALL  # Default

    @staticmethod
    def parse_base_state(runners: List[Dict[str, Any]]) -> BaseState:
        """Parse base state from runners list."""
        base_state = BaseState()

        for runner in runners:
            start_base = runner.get("movement", {}).get("start")
            if start_base == "1B":
                base_state.runner_on_first = True
            elif start_base == "2B":
                base_state.runner_on_second = True
            elif start_base == "3B":
                base_state.runner_on_third = True

        return base_state

    @staticmethod
    def parse_event_type(event: str) -> EventType:
        """Convert event description to EventType enum."""
        event_lower = event.lower()

        if "single" in event_lower:
            return EventType.SINGLE
        elif "double" in event_lower and "play" not in event_lower:
            return EventType.DOUBLE
        elif "triple" in event_lower and "play" not in event_lower:
            return EventType.TRIPLE
        elif "home run" in event_lower or "homer" in event_lower:
            return EventType.HOME_RUN
        elif "walk" in event_lower or "base on balls" in event_lower:
            return EventType.WALK
        elif "strikeout" in event_lower or "strikes out" in event_lower:
            return EventType.STRIKEOUT
        elif "ground" in event_lower and "out" in event_lower:
            return EventType.GROUND_OUT
        elif "fly" in event_lower and "out" in event_lower:
            return EventType.FLY_OUT
        elif "line" in event_lower and "out" in event_lower:
            return EventType.LINE_OUT
        elif "pop" in event_lower and "out" in event_lower:
            return EventType.POP_OUT
        elif "double play" in event_lower:
            return EventType.DOUBLE_PLAY
        elif "triple play" in event_lower:
            return EventType.TRIPLE_PLAY
        elif "fielder's choice" in event_lower or "fielders choice" in event_lower:
            return EventType.FIELDERS_CHOICE
        elif "error" in event_lower:
            return EventType.ERROR
        elif "hit by pitch" in event_lower:
            return EventType.HIT_BY_PITCH
        elif "sacrifice" in event_lower:
            return EventType.SACRIFICE
        else:
            return EventType.OTHER

    def parse_game_context(self, game_data: Dict[str, Any]) -> GameContext:
        """Parse game context from game data."""
        game_info = game_data.get("gameData", {})
        game_dt = game_info.get("datetime", {})

        # Parse datetime
        game_date_str = game_dt.get("dateTime", game_dt.get("officialDate"))
        if game_date_str:
            game_date = datetime.fromisoformat(game_date_str.replace("Z", "+00:00"))
        else:
            game_date = datetime.now()

        teams = game_info.get("teams", {})
        venue_info = game_info.get("venue", {})

        return GameContext(
            game_id=str(game_data.get("gamePk", "")),
            game_date=game_date,
            home_team=teams.get("home", {}).get("abbreviation", ""),
            away_team=teams.get("away", {}).get("abbreviation", ""),
            venue=venue_info.get("name", ""),
            attendance=game_info.get("gameInfo", {}).get("attendance"),
            is_postseason=game_info.get("game", {}).get("type") == "P",
            meta={"raw_game_data": game_info},
        )

    def parse_pitch_events(
        self,
        game_data: Dict[str, Any],
        game_context: GameContext,
    ) -> List[PitchEvent]:
        """
        Parse all pitch events from game data.

        Args:
            game_data: Raw game data from MLB StatsAPI
            game_context: Parsed game context

        Returns:
            List of PitchEvent objects
        """
        plays = game_data.get("liveData", {}).get("plays", {}).get("allPlays", [])
        pitch_events = []

        for at_bat_idx, play in enumerate(plays):
            matchup = play.get("matchup", {})
            batter = matchup.get("batter", {})
            pitcher = matchup.get("pitcher", {})

            # Get play result
            result = play.get("result", {})
            about = play.get("about", {})

            # Base state and game state
            runners = play.get("runners", [])
            base_state = self.parse_base_state(runners)

            # Score
            home_score = result.get("homeScore", 0)
            away_score = result.get("awayScore", 0)

            # Inning info
            inning = about.get("inning", 1)
            top_of_inning = about.get("halfInning", "").lower() == "top"

            # Parse each pitch
            pitch_data_list = play.get("playEvents", [])
            for pitch_num, pitch_data in enumerate(pitch_data_list, start=1):
                if pitch_data.get("isPitch", False):
                    # Count before this pitch
                    count_data = pitch_data.get("count", {})
                    count = Count(
                        balls=count_data.get("balls", 0),
                        strikes=count_data.get("strikes", 0),
                    )

                    # Pitch details
                    pitch_details = pitch_data.get("pitchData", {})

                    is_final = (pitch_num == len([p for p in pitch_data_list if p.get("isPitch")]))

                    pitch_event = PitchEvent(
                        game_id=game_context.game_id,
                        pitch_id=f"{game_context.game_id}_{at_bat_idx}_{pitch_num}",
                        at_bat_index=at_bat_idx,
                        pitch_number=pitch_num,
                        game_date=game_context.game_date,
                        inning=inning,
                        top_of_inning=top_of_inning,
                        batter_id=str(batter.get("id", "")),
                        batter_name=batter.get("fullName"),
                        batter_team=game_context.away_team if top_of_inning else game_context.home_team,
                        pitcher_id=str(pitcher.get("id", "")),
                        pitcher_name=pitcher.get("fullName"),
                        pitcher_team=game_context.home_team if top_of_inning else game_context.away_team,
                        home_team=game_context.home_team,
                        away_team=game_context.away_team,
                        outs=about.get("outs", 0),
                        base_state=base_state,
                        count=count,
                        home_score=home_score,
                        away_score=away_score,
                        pitch_type=self.parse_pitch_type(pitch_data),
                        velocity=pitch_details.get("startSpeed"),
                        plate_x=pitch_details.get("coordinates", {}).get("pX"),
                        plate_z=pitch_details.get("coordinates", {}).get("pZ"),
                        pitch_result=self.parse_pitch_result(pitch_data),
                        is_final_pitch_of_pa=is_final,
                        venue=game_context.venue,
                        attendance=game_context.attendance,
                        is_postseason=game_context.is_postseason,
                        meta={
                            "play_id": play.get("playId"),
                            "at_bat_index": at_bat_idx,
                        },
                    )

                    pitch_events.append(pitch_event)

        logger.info(f"Parsed {len(pitch_events)} pitch events from game {game_context.game_id}")
        return pitch_events


class OfflineDataLoader:
    """Load data from offline CSV/JSON/Parquet files."""

    @staticmethod
    def load_from_json(file_path: Path) -> List[PitchEvent]:
        """
        Load pitch events from JSON file.

        Expected format: List of pitch event dictionaries matching PitchEvent schema.

        Args:
            file_path: Path to JSON file

        Returns:
            List of PitchEvent objects
        """
        logger.info(f"Loading pitch events from {file_path}")

        with open(file_path, "r") as f:
            data = json.load(f)

        if not isinstance(data, list):
            raise ValueError("JSON file must contain a list of pitch events")

        pitch_events = []
        for item in data:
            # Convert date strings to datetime
            if isinstance(item.get("game_date"), str):
                item["game_date"] = datetime.fromisoformat(item["game_date"])

            pitch_event = PitchEvent(**item)
            pitch_events.append(pitch_event)

        logger.info(f"Loaded {len(pitch_events)} pitch events")
        return pitch_events

    @staticmethod
    def load_from_csv(file_path: Path) -> List[PitchEvent]:
        """
        Load pitch events from CSV file.

        Args:
            file_path: Path to CSV file

        Returns:
            List of PitchEvent objects
        """
        try:
            import pandas as pd
        except ImportError:
            raise ImportError("pandas is required for CSV loading. Install with: pip install pandas")

        logger.info(f"Loading pitch events from {file_path}")
        df = pd.read_csv(file_path)

        pitch_events = []
        for _, row in df.iterrows():
            # Convert row to dict and create PitchEvent
            # This assumes CSV columns match PitchEvent fields
            row_dict = row.to_dict()

            # Parse nested objects
            if "base_state" in row_dict:
                # Assume format like "1__" or "123"
                base_code = row_dict["base_state"]
                row_dict["base_state"] = BaseState(
                    runner_on_first="1" in base_code,
                    runner_on_second="2" in base_code,
                    runner_on_third="3" in base_code,
                )

            if "count" in row_dict and isinstance(row_dict["count"], str):
                # Assume format like "0-2"
                balls, strikes = map(int, row_dict["count"].split("-"))
                row_dict["count"] = Count(balls=balls, strikes=strikes)

            # Convert date
            if isinstance(row_dict.get("game_date"), str):
                row_dict["game_date"] = pd.to_datetime(row_dict["game_date"]).to_pydatetime()

            pitch_event = PitchEvent(**row_dict)
            pitch_events.append(pitch_event)

        logger.info(f"Loaded {len(pitch_events)} pitch events from CSV")
        return pitch_events


def fetch_game_pitches(
    game_id: str,
    api_client: Optional[MLBStatsAPIClient] = None,
) -> List[PitchEvent]:
    """
    Convenience function to fetch and parse all pitches from a game.

    Args:
        game_id: MLB game ID
        api_client: Optional API client (creates new one if not provided)

    Returns:
        List of PitchEvent objects
    """
    if api_client is None:
        api_client = MLBStatsAPIClient()

    parser = MLBDataParser()

    # Fetch game data
    game_data = api_client.get_game_data(game_id)

    # Parse context
    game_context = parser.parse_game_context(game_data)

    # Parse pitches
    pitch_events = parser.parse_pitch_events(game_data, game_context)

    return pitch_events


def fetch_games_by_date(
    game_date: date,
    team_id: Optional[int] = None,
    api_client: Optional[MLBStatsAPIClient] = None,
) -> List[str]:
    """
    Get list of game IDs for a specific date.

    Args:
        game_date: Date to fetch games for
        team_id: Optional team ID filter
        api_client: Optional API client

    Returns:
        List of game IDs
    """
    if api_client is None:
        api_client = MLBStatsAPIClient()

    games = api_client.get_schedule(game_date, team_id=team_id)
    game_ids = [str(game["gamePk"]) for game in games]

    logger.info(f"Found {len(game_ids)} games on {game_date}")
    return game_ids
