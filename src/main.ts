import { GameEngine } from "./core/GameEngine";
import { ORIGINAL_CHARACTERS } from "./data/characters";
// import { STADIUMS } from "./data/stadiums"; // TODO: Implement stadium selection
// import { ProgressionAPI } from "./api/progression"; // TODO: Implement progression tracking
import { Vector3 } from "@babylonjs/core";

const canvas = document.getElementById("renderCanvas") as HTMLCanvasElement;
// const progressionAPI = new ProgressionAPI(); // TODO: Hook up progression API

// Generate or retrieve player ID for progression tracking
let currentPlayerId = localStorage.getItem("playerId");
if (!currentPlayerId) {
  currentPlayerId = `player_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  localStorage.setItem("playerId", currentPlayerId);
}
// TODO: Use currentPlayerId to fetch/save player progress

const game = new GameEngine({
  canvas,
  onGameStateChange: (state) => {
    updateUI(state);
  }
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
  game.startPitch();
});

// Load initial players
const randomPitcher = ORIGINAL_CHARACTERS.find(c => c.position === "P");
const randomBatter = ORIGINAL_CHARACTERS[0];

if (randomPitcher) {
  game.loadPlayer(randomPitcher, new Vector3(0, 0, 9), "pitcher");
}
game.loadPlayer(randomBatter, new Vector3(0, 0, 0), "batter");
