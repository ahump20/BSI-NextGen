/**
 * Pitch Type Presets
 *
 * Based on MLB Statcast average data (2020-2024)
 * Source: Baseball Savant / MLB Advanced Media
 *
 * All parameters represent league averages for each pitch type
 */

import { PitchParams } from './physics';

export interface PitchPreset extends PitchParams {
  name: string;
  description: string;
  color: string; // Hex color for visualization
  category: 'fastball' | 'breaking' | 'offspeed';
}

/**
 * Standard release point for right-handed pitcher
 * Adjust releaseX sign for left-handed pitcher
 */
const STANDARD_RELEASE = {
  releaseX: -2.0, // 2 feet toward first base side (RHP)
  releaseY: 5.5, // 5.5 feet above ground
  releaseZ: 55.0, // 5.5 feet in front of rubber
};

/**
 * Four-Seam Fastball
 * The "heater" - straight, fast, with backspin for "rise"
 */
export const FOUR_SEAM_FASTBALL: PitchPreset = {
  ...STANDARD_RELEASE,
  name: '4-Seam Fastball',
  description: 'Straight, high-velocity pitch with backspin',
  velocity: 94.0, // mph (league average ~93-95)
  spinRate: 2250, // rpm
  spinAxis: 0, // Pure backspin (12-6 tilt)
  spinDirection: 0,
  color: '#EF4444', // Red
  category: 'fastball',
};

/**
 * Two-Seam Fastball / Sinker
 * Slightly slower with arm-side run and sink
 */
export const TWO_SEAM_FASTBALL: PitchPreset = {
  ...STANDARD_RELEASE,
  name: '2-Seam Fastball',
  description: 'Fastball with arm-side run and sink',
  velocity: 92.5, // mph
  spinRate: 2150, // rpm (slightly less than 4-seam)
  spinAxis: 30, // 30° tilt creates sink and run
  spinDirection: 45, // Arm-side movement
  color: '#F97316', // Orange
  category: 'fastball',
};

/**
 * Cutter (Cut Fastball)
 * Late glove-side break, velocity between fastball and slider
 */
export const CUTTER: PitchPreset = {
  ...STANDARD_RELEASE,
  name: 'Cutter',
  description: 'Late glove-side movement, between fastball and slider',
  velocity: 89.0, // mph
  spinRate: 2400, // rpm (high spin creates tight break)
  spinAxis: 45, // Gyro-spin component
  spinDirection: 315, // Glove-side
  color: '#EC4899', // Pink
  category: 'fastball',
};

/**
 * Curveball
 * Big, looping break with high spin rate
 */
export const CURVEBALL: PitchPreset = {
  ...STANDARD_RELEASE,
  name: 'Curveball',
  description: '12-6 break with high spin, drops dramatically',
  velocity: 78.0, // mph
  spinRate: 2600, // rpm (highest spin rate)
  spinAxis: 180, // Pure topspin
  spinDirection: 0,
  color: '#8B5CF6', // Purple
  category: 'breaking',
};

/**
 * Slider
 * Tight, late-breaking pitch with horizontal movement
 */
export const SLIDER: PitchPreset = {
  ...STANDARD_RELEASE,
  name: 'Slider',
  description: 'Late glove-side break, tighter than curve',
  velocity: 85.0, // mph
  spinRate: 2500, // rpm
  spinAxis: 110, // Gyro-spin creates "dot" and late break
  spinDirection: 300, // Glove-side
  color: '#06B6D4', // Cyan
  category: 'breaking',
};

/**
 * Sweeper (Sweep Slider)
 * Modern slider variation with more horizontal movement
 */
export const SWEEPER: PitchPreset = {
  ...STANDARD_RELEASE,
  name: 'Sweeper',
  description: 'Horizontal slider with sweeping action',
  velocity: 83.0, // mph
  spinRate: 2450, // rpm
  spinAxis: 90, // Pure side-spin
  spinDirection: 270, // Sweeps across zone
  color: '#14B8A6', // Teal
  category: 'breaking',
};

/**
 * Changeup
 * Slower pitch that looks like fastball, drops at plate
 */
export const CHANGEUP: PitchPreset = {
  ...STANDARD_RELEASE,
  name: 'Changeup',
  description: 'Deceptive speed differential, arm-side fade',
  velocity: 84.0, // mph (8-10 mph slower than fastball)
  spinRate: 1750, // rpm (low spin = more drop)
  spinAxis: 20, // Slight topspin
  spinDirection: 45, // Arm-side
  color: '#10B981', // Green
  category: 'offspeed',
};

/**
 * Splitter (Split-Finger Fastball)
 * Late downward movement, "falls off table"
 */
export const SPLITTER: PitchPreset = {
  ...STANDARD_RELEASE,
  name: 'Splitter',
  description: 'Late tumble, minimal spin creates drop',
  velocity: 86.0, // mph
  spinRate: 1500, // rpm (very low spin)
  spinAxis: 160, // Forward tumble
  spinDirection: 0,
  color: '#84CC16', // Lime
  category: 'offspeed',
};

/**
 * Knuckle Curve
 * Slower curveball with sharp downward break
 */
export const KNUCKLE_CURVE: PitchPreset = {
  ...STANDARD_RELEASE,
  name: 'Knuckle Curve',
  description: 'Slower curve with sharp, late break',
  velocity: 76.0, // mph
  spinRate: 2700, // rpm
  spinAxis: 170, // Near-pure topspin
  spinDirection: 15,
  color: '#A855F7', // Purple (darker)
  category: 'breaking',
};

/**
 * Slurve (Slider-Curve hybrid)
 * Between slider and curveball in velocity and break
 */
export const SLURVE: PitchPreset = {
  ...STANDARD_RELEASE,
  name: 'Slurve',
  description: 'Hybrid of slider and curve, sweeping drop',
  velocity: 80.0, // mph
  spinRate: 2550, // rpm
  spinAxis: 135, // Between slider and curve
  spinDirection: 315,
  color: '#7C3AED', // Violet
  category: 'breaking',
};

/**
 * All pitch presets organized by category
 */
export const PITCH_PRESETS = {
  fastballs: [FOUR_SEAM_FASTBALL, TWO_SEAM_FASTBALL, CUTTER],
  breaking: [CURVEBALL, SLIDER, SWEEPER, KNUCKLE_CURVE, SLURVE],
  offspeed: [CHANGEUP, SPLITTER],
};

/**
 * All pitch presets as flat array
 */
export const ALL_PITCH_PRESETS: PitchPreset[] = [
  FOUR_SEAM_FASTBALL,
  TWO_SEAM_FASTBALL,
  CUTTER,
  CURVEBALL,
  SLIDER,
  SWEEPER,
  CHANGEUP,
  SPLITTER,
  KNUCKLE_CURVE,
  SLURVE,
];

/**
 * Get pitch preset by name
 */
export function getPitchPreset(name: string): PitchPreset | undefined {
  return ALL_PITCH_PRESETS.find((p) => p.name === name);
}

/**
 * Classic tunneling combinations used by MLB pitchers
 */
export const TUNNELING_COMBOS = [
  {
    name: 'Fastball-Changeup Tunnel',
    description: 'Classic speed differential tunnel - same arm action, 8-10 mph difference',
    pitches: [FOUR_SEAM_FASTBALL, CHANGEUP],
    effectiveDistance: 20, // feet from plate where pitches diverge
  },
  {
    name: 'Fastball-Slider Tunnel',
    description: 'Late break tunnel - looks same until final 15 feet',
    pitches: [FOUR_SEAM_FASTBALL, SLIDER],
    effectiveDistance: 15,
  },
  {
    name: 'Fastball-Curve Tunnel',
    description: 'Power tunnel - high velocity fastball paired with big curve',
    pitches: [FOUR_SEAM_FASTBALL, CURVEBALL],
    effectiveDistance: 25,
  },
  {
    name: 'Sinker-Changeup Tunnel',
    description: 'Arm-side tunnel - both move to arm side with different speeds',
    pitches: [TWO_SEAM_FASTBALL, CHANGEUP],
    effectiveDistance: 18,
  },
  {
    name: 'Cutter-Slider Tunnel',
    description: 'Glove-side tunnel - tight break, velocity layering',
    pitches: [CUTTER, SLIDER],
    effectiveDistance: 12,
  },
  {
    name: 'Four-Seam-Sinker-Changeup',
    description: 'Three-pitch tunnel - elite velocity layering',
    pitches: [FOUR_SEAM_FASTBALL, TWO_SEAM_FASTBALL, CHANGEUP],
    effectiveDistance: 20,
  },
  {
    name: 'Fastball-Sweeper Tunnel',
    description: 'Modern tunnel - late horizontal separation',
    pitches: [FOUR_SEAM_FASTBALL, SWEEPER],
    effectiveDistance: 14,
  },
];

/**
 * Adjust release point for left-handed pitcher
 */
export function adjustForLefty(preset: PitchPreset): PitchPreset {
  return {
    ...preset,
    releaseX: -preset.releaseX, // Flip horizontal release point
    spinDirection: (preset.spinDirection + 180) % 360, // Mirror spin direction
  };
}

/**
 * Create custom pitch by modifying a preset
 */
export function createCustomPitch(
  basePitch: PitchPreset,
  modifications: Partial<PitchParams>
): PitchPreset {
  return {
    ...basePitch,
    ...modifications,
    name: `Custom ${basePitch.name}`,
  };
}
