'use client';

import React from 'react';
import { PitchTrajectory, isStrike, describePitchMovement } from '@/lib/pitch-simulator/physics';
import { PitchPreset } from '@/lib/pitch-simulator/presets';

interface PitchStatsProps {
  pitches: Array<{
    preset: PitchPreset;
    trajectory: PitchTrajectory;
  }>;
}

export function PitchStats({ pitches }: PitchStatsProps) {
  return (
    <div className="bg-gray-800 rounded-lg p-4">
      <h3 className="text-lg font-semibold text-white mb-4">Pitch Statistics</h3>

      <div className="space-y-4">
        {pitches.map((pitch, idx) => (
          <div key={idx} className="border-l-4 pl-4 py-2" style={{ borderColor: pitch.preset.color }}>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-white font-medium">{pitch.preset.name}</h4>
              <span
                className={`px-2 py-1 text-xs rounded ${
                  isStrike(pitch.trajectory.plateLocation)
                    ? 'bg-green-600 text-white'
                    : 'bg-red-600 text-white'
                }`}
              >
                {isStrike(pitch.trajectory.plateLocation) ? 'Strike' : 'Ball'}
              </span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-xs">
              {/* Velocity */}
              <div>
                <span className="text-gray-400">Release Velo</span>
                <div className="text-white font-medium">{pitch.preset.velocity.toFixed(1)} mph</div>
              </div>

              <div>
                <span className="text-gray-400">Plate Velo</span>
                <div className="text-white font-medium">{pitch.trajectory.plateVelocity.toFixed(1)} mph</div>
              </div>

              <div>
                <span className="text-gray-400">Velo Drop</span>
                <div className="text-white font-medium">
                  {(pitch.preset.velocity - pitch.trajectory.plateVelocity).toFixed(1)} mph
                </div>
              </div>

              {/* Break */}
              <div>
                <span className="text-gray-400">Horizontal Break</span>
                <div className="text-white font-medium">{pitch.trajectory.totalBreak.horizontal.toFixed(1)}&quot;</div>
              </div>

              <div>
                <span className="text-gray-400">Vertical Break</span>
                <div className="text-white font-medium">{pitch.trajectory.totalBreak.vertical.toFixed(1)}&quot;</div>
              </div>

              <div>
                <span className="text-gray-400">Total Break</span>
                <div className="text-white font-medium">
                  {Math.sqrt(
                    Math.pow(pitch.trajectory.totalBreak.horizontal, 2) +
                      Math.pow(pitch.trajectory.totalBreak.vertical, 2)
                  ).toFixed(1)}&quot;
                </div>
              </div>

              {/* Location */}
              <div>
                <span className="text-gray-400">Plate Location X</span>
                <div className="text-white font-medium">
                  {(pitch.trajectory.plateLocation.x * 12).toFixed(1)}&quot; {pitch.trajectory.plateLocation.x > 0 ? '(arm)' : '(glove)'}
                </div>
              </div>

              <div>
                <span className="text-gray-400">Plate Location Y</span>
                <div className="text-white font-medium">{(pitch.trajectory.plateLocation.y * 12).toFixed(1)}&quot;</div>
              </div>

              <div>
                <span className="text-gray-400">Flight Time</span>
                <div className="text-white font-medium">{(pitch.trajectory.flightTime * 1000).toFixed(0)} ms</div>
              </div>

              {/* Spin */}
              <div>
                <span className="text-gray-400">Spin Rate</span>
                <div className="text-white font-medium">{pitch.preset.spinRate.toFixed(0)} rpm</div>
              </div>

              <div>
                <span className="text-gray-400">Spin Axis</span>
                <div className="text-white font-medium">{pitch.preset.spinAxis.toFixed(0)}°</div>
              </div>

              <div>
                <span className="text-gray-400">Max Height</span>
                <div className="text-white font-medium">{pitch.trajectory.maxHeight.toFixed(1)} ft</div>
              </div>
            </div>

            {/* Movement Description */}
            <div className="mt-2 pt-2 border-t border-gray-700">
              <span className="text-gray-400 text-xs">Movement:</span>
              <span className="text-white text-xs ml-2">{describePitchMovement(pitch.trajectory)}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Comparison Table (when multiple pitches) */}
      {pitches.length > 1 && (
        <div className="mt-6 border-t border-gray-700 pt-4">
          <h4 className="text-white font-medium mb-3 text-sm">Comparison</h4>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-gray-400 border-b border-gray-700">
                  <th className="text-left py-2">Pitch</th>
                  <th className="text-right py-2">Velo</th>
                  <th className="text-right py-2">Spin</th>
                  <th className="text-right py-2">H Break</th>
                  <th className="text-right py-2">V Break</th>
                  <th className="text-right py-2">Flight</th>
                </tr>
              </thead>
              <tbody>
                {pitches.map((pitch, idx) => (
                  <tr key={idx} className="border-b border-gray-700 text-white">
                    <td className="py-2">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: pitch.preset.color }} />
                        <span className="truncate">{pitch.preset.name}</span>
                      </div>
                    </td>
                    <td className="text-right">{pitch.preset.velocity.toFixed(0)}</td>
                    <td className="text-right">{pitch.preset.spinRate.toFixed(0)}</td>
                    <td className="text-right">{pitch.trajectory.totalBreak.horizontal.toFixed(1)}&quot;</td>
                    <td className="text-right">{pitch.trajectory.totalBreak.vertical.toFixed(1)}&quot;</td>
                    <td className="text-right">{(pitch.trajectory.flightTime * 1000).toFixed(0)}ms</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Velocity Layering Analysis */}
          <div className="mt-4">
            <h5 className="text-gray-400 text-xs mb-2">Velocity Layering</h5>
            {pitches.slice(0, -1).map((pitch, idx) => {
              const nextPitch = pitches[idx + 1];
              const veloDiff = Math.abs(pitch.preset.velocity - nextPitch.preset.velocity);
              const isGoodLayering = veloDiff >= 6 && veloDiff <= 12;

              return (
                <div key={idx} className="text-xs text-gray-300 mb-1">
                  <span style={{ color: pitch.preset.color }}>{pitch.preset.name}</span> vs{' '}
                  <span style={{ color: nextPitch.preset.color }}>{nextPitch.preset.name}</span>:{' '}
                  <span className={isGoodLayering ? 'text-green-400' : 'text-yellow-400'}>
                    {veloDiff.toFixed(1)} mph {isGoodLayering ? '✓' : ''}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
