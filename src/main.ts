/**
 * Phase 6: Initialize error tracking and monitoring FIRST
 */
import { initializeSentry } from "./monitoring/sentry";
initializeSentry();

// Dynamic imports to reduce initial bundle size
import { loadGameEngine, preloadGameEngine, getRecommendedSettings } from "./core/GameEngineLoader";
import type { GameEngine, Player, Stadium } from "./core/GameEngine";
import { ProgressionAPI } from "./api/progression";
import { PreGameScreen } from "./ui/PreGameScreen";
import { PostGameScreen } from "./ui/PostGameScreen";
import { LeaderboardScreen } from "./ui/LeaderboardScreen";
import { ChampionshipDashboard } from "./ui/ChampionshipDashboard";

const canvas = document.getElementById("renderCanvas") as HTMLCanvasElement;

// Use production API URL (deployed on Cloudflare Pages)
const API_BASE_URL = "https://d6cc014d.sandlot-sluggers.pages.dev/api";

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

  // Show loading indicator
  const loadingOverlay = createLoadingOverlay();
  document.body.appendChild(loadingOverlay);

  try {
    // Dynamically load and initialize game engine
    const settings = getRecommendedSettings();
    game = await loadGameEngine(
      {
        canvas,
        onGameStateChange: (state) => {
          updateUI(state);
          checkGameEnd(state);
        }
      },
      (progress) => {
        // Update loading UI
        const progressBar = loadingOverlay.querySelector('.progress-bar') as HTMLElement;
        const progressText = loadingOverlay.querySelector('.progress-text') as HTMLElement;
        if (progressBar) progressBar.style.width = `${progress.percent}%`;
        if (progressText) progressText.textContent = progress.message;
      }
    );

    // Dynamically import Vector3 for player positioning
    const { Vector3 } = await import('@babylonjs/core');

    // Load selected character as both pitcher and batter (for now)
    // TODO: Implement full team selection
    await game.loadPlayer(selectedCharacter, new Vector3(0, 0, 9), "pitcher");
    await game.loadPlayer(selectedCharacter, new Vector3(0, 0, 0), "batter");

    // Remove loading overlay
    loadingOverlay.remove();

    // Make canvas and controls visible
    canvas.style.display = "block";
    const controlsDiv = document.getElementById("controls");
    if (controlsDiv) {
      controlsDiv.style.display = "block";
    }

    console.log("Game initialized successfully!");
  } catch (error) {
    console.error("Failed to initialize game:", error);
    loadingOverlay.remove();
    alert("Failed to load game. Please refresh and try again.");
  }
}

// Create loading overlay with progress bar
function createLoadingOverlay(): HTMLElement {
  const overlay = document.createElement('div');
  overlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.9);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    z-index: 10000;
    font-family: 'Inter', sans-serif;
  `;

  overlay.innerHTML = `
    <div style="text-align: center;">
      <h2 style="color: white; margin-bottom: 20px;">Loading Game...</h2>
      <div style="width: 300px; height: 20px; background: rgba(255,255,255,0.1); border-radius: 10px; overflow: hidden;">
        <div class="progress-bar" style="width: 0%; height: 100%; background: linear-gradient(90deg, #4CAF50, #8BC34A); transition: width 0.3s ease;"></div>
      </div>
      <p class="progress-text" style="color: rgba(255,255,255,0.7); margin-top: 10px;">Preparing...</p>
    </div>
  `;

  return overlay;
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
    },
    onViewChampionships: handleViewChampionships
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

// Handle "View Championships" button
function handleViewChampionships(): void {
  console.log("View championships requested");

  // Create container for championship dashboard
  const dashboardContainer = document.createElement('div');
  dashboardContainer.id = 'championship-dashboard-container';
  dashboardContainer.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background: rgba(0, 0, 0, 0.95);
    z-index: 2000;
    overflow-y: auto;
    padding: 2rem;
  `;

  // Add close button
  const closeButton = document.createElement('button');
  closeButton.textContent = '✕ Close';
  closeButton.style.cssText = `
    position: fixed;
    top: 1rem;
    right: 1rem;
    padding: 0.75rem 1.5rem;
    font-size: 1rem;
    font-weight: bold;
    background: rgba(255, 255, 255, 0.1);
    color: white;
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-radius: 8px;
    cursor: pointer;
    z-index: 2001;
    transition: all 0.3s ease;
  `;

  closeButton.addEventListener('mouseenter', () => {
    closeButton.style.background = 'rgba(255, 255, 255, 0.2)';
    closeButton.style.borderColor = 'rgba(255, 255, 255, 0.5)';
  });

  closeButton.addEventListener('mouseleave', () => {
    closeButton.style.background = 'rgba(255, 255, 255, 0.1)';
    closeButton.style.borderColor = 'rgba(255, 255, 255, 0.3)';
  });

  closeButton.addEventListener('click', () => {
    dashboardContainer.remove();
  });

  dashboardContainer.appendChild(closeButton);
  document.body.appendChild(dashboardContainer);

  // Create and show ChampionshipDashboard
  const championshipDashboard = new ChampionshipDashboard({
    container: dashboardContainer,
    apiBaseUrl: API_BASE_URL,
    onError: (error) => {
      console.error('Championship Dashboard Error:', error);
      alert(`Failed to load championship data: ${error.message}`);
    }
  });

  championshipDashboard.show();
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
    },
    onViewChampionships: handleViewChampionships
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
