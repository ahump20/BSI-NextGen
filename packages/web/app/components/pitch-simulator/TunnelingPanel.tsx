'use client';

import React from 'react';
import { PitchTrajectory, calculateTunnelingPoint, isStrike } from '@/lib/pitch-simulator/physics';
import { TUNNELING_COMBOS, PitchPreset } from '@/lib/pitch-simulator/presets';

interface TunnelingPanelProps {
  pitches: Array<{
    preset: PitchPreset;
    trajectory: PitchTrajectory;
    visible: boolean;
  }>;
  onToggleVisibility: (index: number) => void;
  onLoadCombo: (pitches: PitchPreset[]) => void;
}

export function TunnelingPanel({ pitches, onToggleVisibility, onLoadCombo }: TunnelingPanelProps) {
  // Calculate tunneling metrics between visible pitches
  const tunnelingAnalysis = React.useMemo(() => {
    const visiblePitches = pitches.filter((p) => p.visible);
    if (visiblePitches.length < 2) return null;

    const analyses = [];
    for (let i = 0; i < visiblePitches.length - 1; i++) {
      for (let j = i + 1; j < visiblePitches.length; j++) {
        const p1 = visiblePitches[i];
        const p2 = visiblePitches[j];
        const divergencePoint = calculateTunnelingPoint(p1.trajectory, p2.trajectory, 0.3);
        const distanceToPlate = 60.5 - divergencePoint;

        analyses.push({
          pitch1: p1.preset.name,
          pitch2: p2.preset.name,
          color1: p1.preset.color,
          color2: p2.preset.color,
          divergencePoint: divergencePoint.toFixed(1),
          distanceToPlate: distanceToPlate.toFixed(1),
          effectivenessRating: calculateEffectiveness(distanceToPlate),
        });
      }
    }
    return analyses;
  }, [pitches]);

  return (
    <div className="bg-gray-800 rounded-lg p-4 space-y-4">
      <h3 className="text-lg font-semibold text-white mb-4">Tunneling Analysis</h3>

      {/* Active Pitches */}
      <div>
        <h4 className="text-sm font-medium text-gray-300 mb-2">Active Pitches ({pitches.length})</h4>
        <div className="space-y-2">
          {pitches.map((pitch, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-3 bg-gray-700 rounded-md"
            >
              <div className="flex items-center gap-3 flex-1">
                <button
                  onClick={() => onToggleVisibility(index)}
                  className="flex-shrink-0"
                >
                  <div
                    className={`w-6 h-6 rounded border-2 flex items-center justify-center transition-all ${
                      pitch.visible ? 'border-white' : 'border-gray-500'
                    }`}
                    style={{ backgroundColor: pitch.visible ? pitch.preset.color : 'transparent' }}
                  >
                    {pitch.visible && (
                      <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    )}
                  </div>
                </button>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-white truncate">{pitch.preset.name}</span>
                    <span
                      className={`px-2 py-0.5 text-xs rounded ${
                        isStrike(pitch.trajectory.plateLocation)
                          ? 'bg-green-600 text-white'
                          : 'bg-red-600 text-white'
                      }`}
                    >
                      {isStrike(pitch.trajectory.plateLocation) ? 'Strike' : 'Ball'}
                    </span>
                  </div>
                  <div className="text-xs text-gray-400 mt-1">
                    {pitch.trajectory.plateVelocity.toFixed(1)} mph at plate •{' '}
                    {pitch.trajectory.totalBreak.horizontal.toFixed(1)}&quot; H •{' '}
                    {pitch.trajectory.totalBreak.vertical.toFixed(1)}&quot; V
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Tunneling Metrics */}
      {tunnelingAnalysis && tunnelingAnalysis.length > 0 && (
        <div className="border-t border-gray-700 pt-4">
          <h4 className="text-sm font-medium text-gray-300 mb-3">Tunneling Metrics</h4>
          <div className="space-y-3">
            {tunnelingAnalysis.map((analysis, idx) => (
              <div key={idx} className="p-3 bg-gray-700 rounded-md">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: analysis.color1 }} />
                  <span className="text-white text-sm font-medium">{analysis.pitch1}</span>
                  <span className="text-gray-400">vs</span>
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: analysis.color2 }} />
                  <span className="text-white text-sm font-medium">{analysis.pitch2}</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-gray-400">Divergence Point:</span>
                    <span className="text-white ml-2">{analysis.divergencePoint} ft from mound</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Distance to Plate:</span>
                    <span className="text-white ml-2">{analysis.distanceToPlate} ft</span>
                  </div>
                </div>
                <div className="mt-2">
                  <EffectivenessBar rating={analysis.effectivenessRating} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Preset Tunneling Combos */}
      <div className="border-t border-gray-700 pt-4">
        <h4 className="text-sm font-medium text-gray-300 mb-3">Preset Tunneling Combos</h4>
        <div className="space-y-2">
          {TUNNELING_COMBOS.map((combo, idx) => (
            <button
              key={idx}
              onClick={() => onLoadCombo(combo.pitches)}
              className="w-full text-left p-3 bg-gray-700 rounded-md hover:bg-gray-600 transition-colors"
            >
              <div className="font-medium text-white text-sm mb-1">{combo.name}</div>
              <div className="text-xs text-gray-400 mb-2">{combo.description}</div>
              <div className="flex gap-1">
                {combo.pitches.map((pitch, pidx) => (
                  <div
                    key={pidx}
                    className="px-2 py-1 rounded text-xs text-white"
                    style={{ backgroundColor: pitch.color }}
                  >
                    {pitch.name}
                  </div>
                ))}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Educational Info */}
      <div className="border-t border-gray-700 pt-4">
        <h4 className="text-sm font-medium text-gray-300 mb-2">About Tunneling</h4>
        <p className="text-xs text-gray-400 leading-relaxed">
          Pitch tunneling occurs when different pitches follow the same trajectory from release point
          before breaking in different directions. The later the divergence point (closer to home plate),
          the more effective the tunneling. Elite pitchers can tunnel pitches that don&apos;t diverge until
          15-20 feet from the plate, making it nearly impossible for batters to identify pitch type.
        </p>
      </div>
    </div>
  );
}

function calculateEffectiveness(distanceToPlate: number): number {
  // Closer divergence to plate = more effective
  // 20+ feet = Elite (100%)
  // 15-20 feet = Excellent (80%)
  // 10-15 feet = Good (60%)
  // 5-10 feet = Average (40%)
  // <5 feet = Poor (20%)

  if (distanceToPlate >= 20) return 100;
  if (distanceToPlate >= 15) return 80;
  if (distanceToPlate >= 10) return 60;
  if (distanceToPlate >= 5) return 40;
  return 20;
}

function EffectivenessBar({ rating }: { rating: number }) {
  const getColor = (rating: number) => {
    if (rating >= 80) return 'bg-green-500';
    if (rating >= 60) return 'bg-yellow-500';
    if (rating >= 40) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const getLabel = (rating: number) => {
    if (rating >= 80) return 'Elite';
    if (rating >= 60) return 'Good';
    if (rating >= 40) return 'Average';
    return 'Poor';
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-1">
        <span className="text-xs text-gray-400">Tunneling Effectiveness:</span>
        <span className="text-xs text-white font-medium">{getLabel(rating)}</span>
      </div>
      <div className="w-full h-2 bg-gray-600 rounded-full overflow-hidden">
        <div
          className={`h-full ${getColor(rating)} transition-all duration-300`}
          style={{ width: `${rating}%` }}
        />
      </div>
    </div>
  );
}
