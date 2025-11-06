import { Player } from "../core/GameEngine";

export const ORIGINAL_CHARACTERS: Player[] = [
  {
    id: "char_001",
    name: "Rocket Rodriguez",
    battingPower: 9,
    battingAccuracy: 6,
    speed: 8,
    pitchSpeed: 4,
    pitchControl: 4,
    fieldingRange: 7,
    fieldingAccuracy: 6,
    position: "CF",
    modelPath: "/models/rocket.glb"
  },
  {
    id: "char_002",
    name: "Ace McKenzie",
    battingPower: 5,
    battingAccuracy: 7,
    speed: 6,
    pitchSpeed: 10,
    pitchControl: 9,
    fieldingRange: 5,
    fieldingAccuracy: 8,
    position: "P",
    modelPath: "/models/ace.glb"
  },
  {
    id: "char_003",
    name: "Thunder Thompson",
    battingPower: 10,
    battingAccuracy: 5,
    speed: 4,
    pitchSpeed: 3,
    pitchControl: 3,
    fieldingRange: 4,
    fieldingAccuracy: 5,
    position: "1B",
    modelPath: "/models/thunder.glb"
  },
  {
    id: "char_004",
    name: "Dizzy Daniels",
    battingPower: 6,
    battingAccuracy: 8,
    speed: 7,
    pitchSpeed: 8,
    pitchControl: 7,
    fieldingRange: 6,
    fieldingAccuracy: 7,
    position: "SS",
    modelPath: "/models/dizzy.glb"
  },
  {
    id: "char_005",
    name: "Flash Freeman",
    battingPower: 4,
    battingAccuracy: 9,
    speed: 10,
    pitchSpeed: 3,
    pitchControl: 4,
    fieldingRange: 9,
    fieldingAccuracy: 8,
    position: "LF",
    modelPath: "/models/flash.glb"
  },
  {
    id: "char_006",
    name: "Brick Martinez",
    battingPower: 8,
    battingAccuracy: 5,
    speed: 3,
    pitchSpeed: 2,
    pitchControl: 2,
    fieldingRange: 3,
    fieldingAccuracy: 6,
    position: "C",
    modelPath: "/models/brick.glb"
  },
  {
    id: "char_007",
    name: "Pepper Sanchez",
    battingPower: 7,
    battingAccuracy: 7,
    speed: 8,
    pitchSpeed: 5,
    pitchControl: 6,
    fieldingRange: 8,
    fieldingAccuracy: 7,
    position: "2B",
    modelPath: "/models/pepper.glb"
  },
  {
    id: "char_008",
    name: "Zoom Williams",
    battingPower: 6,
    battingAccuracy: 8,
    speed: 9,
    pitchSpeed: 4,
    pitchControl: 5,
    fieldingRange: 9,
    fieldingAccuracy: 8,
    position: "RF",
    modelPath: "/models/zoom.glb"
  },
  {
    id: "char_009",
    name: "Knuckles O'Brien",
    battingPower: 5,
    battingAccuracy: 6,
    speed: 5,
    pitchSpeed: 9,
    pitchControl: 8,
    fieldingRange: 6,
    fieldingAccuracy: 7,
    position: "P",
    modelPath: "/models/knuckles.glb"
  },
  {
    id: "char_010",
    name: "Slider Jackson",
    battingPower: 7,
    battingAccuracy: 6,
    speed: 6,
    pitchSpeed: 7,
    pitchControl: 9,
    fieldingRange: 7,
    fieldingAccuracy: 8,
    position: "3B",
    modelPath: "/models/slider.glb"
  }
];

export const UNLOCKABLE_CHARACTERS: Player[] = [
  {
    id: "char_secret_001",
    name: "Comet Carter",
    battingPower: 10,
    battingAccuracy: 10,
    speed: 10,
    pitchSpeed: 10,
    pitchControl: 10,
    fieldingRange: 10,
    fieldingAccuracy: 10,
    position: "CF",
    modelPath: "/models/comet.glb"
  },
  {
    id: "char_secret_002",
    name: "Blaze (Dog)",
    battingPower: 8,
    battingAccuracy: 7,
    speed: 9,
    pitchSpeed: 6,
    pitchControl: 5,
    fieldingRange: 10,
    fieldingAccuracy: 9,
    position: "CF",
    modelPath: "/models/blaze_dog.glb"
  }
];
