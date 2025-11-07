/**
 * Phase 6: Initialize error tracking and monitoring FIRST
 */
import { initializeSentry } from "./monitoring/sentry";
initializeSentry();

import { GameEngine, Player, Stadium } from "./core/GameEngine";
import { ProgressionAPI } from "./api/progression";
import { PreGameScreen } from "./ui/PreGameScreen";
import { PostGameScreen } from "./ui/PostGameScreen";
import { LeaderboardScreen } from "./ui/LeaderboardScreen";
import { Vector3 } from "@babylonjs/core";

const canvas = document.getElementById("renderCanvas") as HTMLCanvasElement;

// Use production API URL (deployed on Cloudflare Pages)
const API_BASE_URL = "https://d1f1fd9b.sandlot-sluggers.pages.dev/api";

const progressionAPI = new ProgressionAPI(API_BASE_URL);

// Generate or retrieve player ID for progression tracking
let currentPlayerId = localStorage.getItem("playerId");
if (!currentPlayerId) {
  currentPlayerId = `player_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  localStorage.setItem("playerId", currentPlayerId);
}

// Store game instance (will be initialized after character/stadium selection)
let game: GameEngine | null = null;
let gameEnded = false; // Track if game has ended to prevent multiple PostGameScreen displays

// Initialize game with selected character and stadium
async function initializeGame(selectedCharacter: Player, selectedStadium: Stadium): Promise<void> {
  console.log("Initializing game with:", {
    character: selectedCharacter.name,
    stadium: selectedStadium.name
  });

  gameEnded = false; // Reset game end flag

  // Create game engine instance with WebGPU support
  game = await GameEngine.create({
    canvas,
    onGameStateChange: (state) => {
      updateUI(state);
      checkGameEnd(state);
    }
  });

  // Load selected character as both pitcher and batter (for now)
  // TODO: Implement full team selection
  await game.loadPlayer(selectedCharacter, new Vector3(0, 0, 9), "pitcher");
  await game.loadPlayer(selectedCharacter, new Vector3(0, 0, 0), "batter");

  // Make canvas and controls visible
  canvas.style.display = "block";
  const controlsDiv = document.getElementById("controls");
  if (controlsDiv) {
    controlsDiv.style.display = "block";
  }

  console.log("Game initialized successfully!");
}

// Check if game has ended (9 innings completed)
function checkGameEnd(state: any): void {
  if (gameEnded) return; // Already handled

  // Game ends after 9 full innings (top and bottom of 9th completed)
  if (state.inning > 9) {
    gameEnded = true;
    showPostGameScreen();
  }
}

// Show post-game screen with results and XP
function showPostGameScreen(): void {
  if (!game) {
    console.error("Cannot show post-game screen: game is null");
    return;
  }

  // Collect game stats
  const finalScore = {
    home: game.getGameState().homeScore,
    away: game.getGameState().awayScore
  };

  const won = finalScore.home > finalScore.away; // Player is home team

  const gameResult = {
    won,
    finalScore,
    runsScored: game.getTotalRuns(),
    hitsRecorded: game.getTotalHits(),
    homeRunsHit: game.getTotalHomeRuns()
  };

  console.log("Game ended with result:", gameResult);

  // Hide controls
  const controlsDiv = document.getElementById("controls");
  if (controlsDiv) {
    controlsDiv.style.display = "none";
  }

  // Create and show PostGameScreen
  const postGameScreen = new PostGameScreen({
    container: document.body,
    progressionAPI,
    playerId: currentPlayerId!,
    gameResult,
    onPlayAgain: handlePlayAgain,
    onViewLeaderboard: handleViewLeaderboard
  });

  postGameScreen.show();
}

// Handle "Play Again" button
function handlePlayAgain(): void {
  console.log("Play again requested");

  // Hide canvas and reset game
  canvas.style.display = "none";
  game = null;
  gameEnded = false;

  // Show pre-game screen again
  const preGameScreen = new PreGameScreen({
    container: document.body,
    progressionAPI,
    playerId: currentPlayerId!,
    onStartGame: async (character, stadium) => {
      await initializeGame(character, stadium);
    }
  });

  preGameScreen.show();
}

// Handle "View Leaderboard" button
function handleViewLeaderboard(): void {
  console.log("View leaderboard requested");

  // Create and show LeaderboardScreen
  const leaderboardScreen = new LeaderboardScreen({
    container: document.body,
    progressionAPI,
    currentPlayerId: currentPlayerId!,
    onClose: () => {
      console.log("Leaderboard closed");
      // Could show PostGameScreen again or go back to main menu
    }
  });

  leaderboardScreen.show();
}

// Show pre-game screen on start
window.addEventListener("DOMContentLoaded", () => {
  // Hide canvas and controls initially
  canvas.style.display = "none";
  const controlsDiv = document.getElementById("controls");
  if (controlsDiv) {
    controlsDiv.style.display = "none";
  }

  // Create and show pre-game screen
  const preGameScreen = new PreGameScreen({
    container: document.body,
    progressionAPI,
    playerId: currentPlayerId!,
    onStartGame: async (character, stadium) => {
      await initializeGame(character, stadium);
    }
  });

  preGameScreen.show();
});

// UI initialization
const scoreDisplay = document.getElementById("score");
const inningDisplay = document.getElementById("inning");
const countDisplay = document.getElementById("count");
const basesDisplay = document.getElementById("bases");
const pitchButton = document.getElementById("pitchButton");

function updateUI(state: any) {
  if (scoreDisplay) {
    scoreDisplay.textContent = `${state.awayScore} - ${state.homeScore}`;
  }
  if (inningDisplay) {
    inningDisplay.textContent = `Inning: ${state.inning} ${state.isTopOfInning ? "Top" : "Bot"}`;
  }
  if (countDisplay) {
    countDisplay.textContent = `${state.balls}-${state.strikes}, ${state.outs} Outs`;
  }
  if (basesDisplay) {
    const baseStatus = state.bases.map((occupied: boolean, i: number) =>
      occupied ? `${i + 1}B` : ""
    ).filter(Boolean).join(", ");
    basesDisplay.textContent = baseStatus || "Bases Empty";
  }
}

pitchButton?.addEventListener("click", () => {
  if (game) {
    game.startPitch();
  }
});
