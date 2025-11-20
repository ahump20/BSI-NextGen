"""
REST API for MMI package using FastAPI.

Provides endpoints for querying MMI by game, player, and date.
"""

import logging
from typing import List, Optional
from datetime import date
from pathlib import Path

from fastapi import FastAPI, HTTPException, Query
from fastapi.responses import JSONResponse
from pydantic import BaseModel

from mmi.data_ingest import fetch_game_pitches, fetch_games_by_date
from mmi.scaling import MMIScalerSet, create_default_scalers
from mmi.aggregate import (
    compute_game_mmi,
    summarize_mmi_by_player,
    export_game_mmi_to_dict,
    export_player_summary_to_dict,
    get_high_mmi_moments,
)
from mmi.models import MMIResult

logger = logging.getLogger(__name__)

# Create FastAPI app
app = FastAPI(
    title="MMI Baseball API",
    description="REST API for Moment Mentality Index (MMI) calculations",
    version="0.1.0",
)

# Global scalers (loaded at startup)
_scaler_set: Optional[MMIScalerSet] = None


# Response models
class GameMMIResponse(BaseModel):
    """Response model for game MMI endpoint."""
    game_id: str
    total_pitches: int
    mean_mmi: float
    max_mmi: float
    high_mmi_count: int
    pitches: List[dict]


class PlayerSummaryResponse(BaseModel):
    """Response model for player summary endpoint."""
    player_id: str
    role: str
    season: int
    stats: dict
    percentiles: dict
    high_moments: dict
    avg_components: dict


class HighMMIMomentResponse(BaseModel):
    """Response model for high MMI moment."""
    pitch_id: Optional[str]
    game_id: str
    pitcher_id: str
    batter_id: str
    inning: int
    mmi: float
    components: dict


@app.on_event("startup")
async def startup_event():
    """Load scalers on startup."""
    global _scaler_set

    # Try to load from default location
    scaler_path = Path("data/scalers.json")
    if scaler_path.exists():
        try:
            _scaler_set = MMIScalerSet.load(scaler_path)
            logger.info(f"Loaded scalers from {scaler_path}")
        except Exception as e:
            logger.warning(f"Failed to load scalers: {e}")
            _scaler_set = create_default_scalers()
    else:
        logger.warning("No scalers found, using defaults")
        _scaler_set = create_default_scalers()


@app.get("/")
async def root():
    """Root endpoint with API information."""
    return {
        "name": "MMI Baseball API",
        "version": "0.1.0",
        "description": "Moment Mentality Index calculations for MLB",
        "endpoints": {
            "games": "/games/{game_id}/mmi",
            "players": "/players/{player_id}/mmi-summary",
            "search": "/search/high-mmi",
            "health": "/health",
        },
    }


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "scalers_loaded": _scaler_set is not None,
    }


@app.get("/games/{game_id}/mmi")
async def get_game_mmi(
    game_id: str,
    role: str = Query("pitcher", regex="^(pitcher|batter)$"),
):
    """
    Get MMI for all pitches in a game.

    Args:
        game_id: MLB game ID
        role: "pitcher" or "batter"

    Returns:
        GameMMIResponse with all pitches and summary stats
    """
    if _scaler_set is None:
        raise HTTPException(status_code=500, detail="Scalers not loaded")

    try:
        # Fetch pitch data
        logger.info(f"Fetching game {game_id}")
        pitches = fetch_game_pitches(game_id)

        if not pitches:
            raise HTTPException(status_code=404, detail=f"Game {game_id} not found")

        # Compute MMI
        league_stats = _scaler_set.to_league_stats()
        mmi_results = compute_game_mmi(game_id, pitches, league_stats, role=role)

        # Export to dict
        output_data = export_game_mmi_to_dict(game_id, pitches, mmi_results)

        # Add summary
        mmi_values = [r.mmi for r in mmi_results]
        output_data["mean_mmi"] = sum(mmi_values) / len(mmi_values)
        output_data["max_mmi"] = max(mmi_values)
        output_data["high_mmi_count"] = sum(1 for mmi in mmi_values if mmi > 2.0)

        return JSONResponse(content=output_data)

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error processing game {game_id}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/players/{player_id}/mmi-summary")
async def get_player_summary(
    player_id: str,
    year: int = Query(..., ge=2000, le=2030),
    role: str = Query("pitcher", regex="^(pitcher|batter)$"),
):
    """
    Get MMI summary for a player in a season.

    Note: This endpoint requires pre-computed MMI data.
    For demonstration, returns a placeholder response.

    Args:
        player_id: Player ID
        year: Season year
        role: "pitcher" or "batter"

    Returns:
        PlayerSummaryResponse with aggregated stats
    """
    # TODO: Implement database/storage backend for pre-computed results
    raise HTTPException(
        status_code=501,
        detail="Player summary requires pre-computed data storage (not yet implemented)",
    )


@app.get("/search/high-mmi")
async def search_high_mmi(
    threshold: float = Query(2.0, ge=0.0, le=10.0),
    limit: int = Query(50, ge=1, le=500),
):
    """
    Search for high MMI moments across games.

    Note: This endpoint requires a database of pre-computed MMI results.
    For demonstration, returns a placeholder response.

    Args:
        threshold: Minimum MMI threshold
        limit: Maximum number of results

    Returns:
        List of high MMI moments
    """
    # TODO: Implement database query for high-MMI moments
    raise HTTPException(
        status_code=501,
        detail="High-MMI search requires database backend (not yet implemented)",
    )


@app.get("/games/date/{game_date}")
async def get_games_by_date(game_date: str):
    """
    Get list of game IDs for a specific date.

    Args:
        game_date: Date in YYYY-MM-DD format

    Returns:
        List of game IDs
    """
    try:
        date_obj = date.fromisoformat(game_date)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD")

    try:
        game_ids = fetch_games_by_date(date_obj)
        return {
            "date": game_date,
            "game_count": len(game_ids),
            "game_ids": game_ids,
        }
    except Exception as e:
        logger.error(f"Error fetching games for {game_date}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/scalers/reload")
async def reload_scalers(file_path: str = Query("data/scalers.json")):
    """
    Reload scalers from file.

    Args:
        file_path: Path to scalers JSON file

    Returns:
        Success message
    """
    global _scaler_set

    scaler_path = Path(file_path)
    if not scaler_path.exists():
        raise HTTPException(status_code=404, detail=f"Scalers file not found: {file_path}")

    try:
        _scaler_set = MMIScalerSet.load(scaler_path)
        logger.info(f"Reloaded scalers from {file_path}")
        return {"status": "success", "message": f"Scalers reloaded from {file_path}"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to load scalers: {str(e)}")


# Run with: uvicorn mmi.api:app --reload
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
