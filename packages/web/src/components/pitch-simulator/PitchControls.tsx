'use client';

import React from 'react';
import { PitchParams } from '@/lib/pitch-simulator/physics';
import { PitchPreset, ALL_PITCH_PRESETS, PITCH_PRESETS } from '@/lib/pitch-simulator/presets';

interface PitchControlsProps {
  params: PitchParams;
  onChange: (params: PitchParams) => void;
  onPresetSelect: (preset: PitchPreset) => void;
}

export function PitchControls({ params, onChange, onPresetSelect }: PitchControlsProps) {
  const handleChange = (field: keyof PitchParams, value: number) => {
    onChange({ ...params, [field]: value });
  };

  return (
    <div className="bg-gray-800 rounded-lg p-4 space-y-4">
      <h3 className="text-lg font-semibold text-white mb-4">Pitch Parameters</h3>

      {/* Pitch Presets */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">Pitch Type</label>
        <div className="grid grid-cols-2 gap-2 md:grid-cols-3 lg:grid-cols-4">
          {ALL_PITCH_PRESETS.map((preset) => (
            <button
              key={preset.name}
              onClick={() => onPresetSelect(preset)}
              className="px-3 py-2 text-xs rounded-md text-white font-medium transition-colors hover:opacity-80"
              style={{ backgroundColor: preset.color }}
            >
              {preset.name}
            </button>
          ))}
        </div>
      </div>

      {/* Velocity Control */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Velocity: {params.velocity.toFixed(1)} mph
        </label>
        <input
          type="range"
          min="70"
          max="105"
          step="0.5"
          value={params.velocity}
          onChange={(e) => handleChange('velocity', parseFloat(e.target.value))}
          className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
        />
        <div className="flex justify-between text-xs text-gray-400 mt-1">
          <span>70 mph</span>
          <span>105 mph</span>
        </div>
      </div>

      {/* Spin Rate Control */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Spin Rate: {params.spinRate.toFixed(0)} rpm
        </label>
        <input
          type="range"
          min="1000"
          max="3500"
          step="50"
          value={params.spinRate}
          onChange={(e) => handleChange('spinRate', parseFloat(e.target.value))}
          className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
        />
        <div className="flex justify-between text-xs text-gray-400 mt-1">
          <span>1000 rpm</span>
          <span>3500 rpm</span>
        </div>
      </div>

      {/* Spin Axis Control */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Spin Axis: {params.spinAxis.toFixed(0)}° ({getSpinAxisDescription(params.spinAxis)})
        </label>
        <input
          type="range"
          min="0"
          max="180"
          step="5"
          value={params.spinAxis}
          onChange={(e) => handleChange('spinAxis', parseFloat(e.target.value))}
          className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
        />
        <div className="flex justify-between text-xs text-gray-400 mt-1">
          <span>Backspin</span>
          <span>Sidespin</span>
          <span>Topspin</span>
        </div>
      </div>

      {/* Spin Direction Control */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Spin Direction: {params.spinDirection.toFixed(0)}°
        </label>
        <input
          type="range"
          min="0"
          max="360"
          step="5"
          value={params.spinDirection}
          onChange={(e) => handleChange('spinDirection', parseFloat(e.target.value))}
          className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
        />
        <div className="flex justify-between text-xs text-gray-400 mt-1">
          <span>Home</span>
          <span>1st</span>
          <span>Mound</span>
          <span>3rd</span>
        </div>
      </div>

      {/* Release Point Controls */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Release X: {params.releaseX.toFixed(1)} ft
          </label>
          <input
            type="range"
            min="-3"
            max="3"
            step="0.1"
            value={params.releaseX}
            onChange={(e) => handleChange('releaseX', parseFloat(e.target.value))}
            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
          />
          <div className="flex justify-between text-xs text-gray-400 mt-1">
            <span>1st</span>
            <span>3rd</span>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Release Y: {params.releaseY.toFixed(1)} ft
          </label>
          <input
            type="range"
            min="4"
            max="7"
            step="0.1"
            value={params.releaseY}
            onChange={(e) => handleChange('releaseY', parseFloat(e.target.value))}
            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
          />
          <div className="flex justify-between text-xs text-gray-400 mt-1">
            <span>Low</span>
            <span>High</span>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Release Z: {params.releaseZ.toFixed(1)} ft
          </label>
          <input
            type="range"
            min="53"
            max="57"
            step="0.1"
            value={params.releaseZ}
            onChange={(e) => handleChange('releaseZ', parseFloat(e.target.value))}
            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
          />
          <div className="flex justify-between text-xs text-gray-400 mt-1">
            <span>Back</span>
            <span>Front</span>
          </div>
        </div>
      </div>

      {/* Pitch Categories Info */}
      <div className="border-t border-gray-700 pt-4 mt-4">
        <h4 className="text-sm font-medium text-gray-300 mb-2">Pitch Categories</h4>
        <div className="space-y-2 text-xs">
          <div>
            <span className="text-gray-400">Fastballs:</span>{' '}
            <span className="text-white">{PITCH_PRESETS.fastballs.map((p) => p.name).join(', ')}</span>
          </div>
          <div>
            <span className="text-gray-400">Breaking Balls:</span>{' '}
            <span className="text-white">{PITCH_PRESETS.breaking.map((p) => p.name).join(', ')}</span>
          </div>
          <div>
            <span className="text-gray-400">Offspeed:</span>{' '}
            <span className="text-white">{PITCH_PRESETS.offspeed.map((p) => p.name).join(', ')}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function getSpinAxisDescription(angle: number): string {
  if (angle < 30) return 'Pure Backspin';
  if (angle < 60) return 'Backspin + Side';
  if (angle < 120) return 'Sidespin';
  if (angle < 150) return 'Topspin + Side';
  return 'Pure Topspin';
}
