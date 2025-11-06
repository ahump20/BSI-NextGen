import { Stadium } from "../core/GameEngine";

export const STADIUMS: Stadium[] = [
  {
    id: "stadium_001",
    name: "Dusty Acres",
    description: "A dusty desert diamond with tumbleweeds and cacti",
    dimensions: {
      leftField: 32,
      centerField: 38,
      rightField: 32
    },
    modelPath: "/models/dusty_acres.glb",
    skyboxPath: "/textures/desert_sky.env"
  },
  {
    id: "stadium_002",
    name: "Frostbite Field",
    description: "Snow-covered outfield with icy patches",
    dimensions: {
      leftField: 30,
      centerField: 35,
      rightField: 30
    },
    modelPath: "/models/frostbite_field.glb",
    skyboxPath: "/textures/winter_sky.env"
  },
  {
    id: "stadium_003",
    name: "Treehouse Park",
    description: "Elevated platform among giant trees",
    dimensions: {
      leftField: 28,
      centerField: 33,
      rightField: 28
    },
    modelPath: "/models/treehouse_park.glb",
    skyboxPath: "/textures/forest_sky.env"
  },
  {
    id: "stadium_004",
    name: "Rooftop Rally",
    description: "City rooftop with skyscraper backdrop",
    dimensions: {
      leftField: 34,
      centerField: 40,
      rightField: 34
    },
    modelPath: "/models/rooftop_rally.glb",
    skyboxPath: "/textures/city_sky.env"
  },
  {
    id: "stadium_005",
    name: "Beach Bash",
    description: "Sandy diamond with ocean waves",
    dimensions: {
      leftField: 31,
      centerField: 36,
      rightField: 31
    },
    modelPath: "/models/beach_bash.glb",
    skyboxPath: "/textures/beach_sky.env"
  }
];
