'use client';

import React, { useState, useMemo, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { PitchParams, calculateTrajectory, PitchTrajectory } from '@/lib/pitch-simulator/physics';
import { PitchPreset, FOUR_SEAM_FASTBALL, CHANGEUP, PitchPreset as PitchPresetType } from '@/lib/pitch-simulator/presets';
import { PitchControls } from '@/components/pitch-simulator/PitchControls';
import { TunnelingPanel } from '@/components/pitch-simulator/TunnelingPanel';
import { PitchStats } from '@/components/pitch-simulator/PitchStats';
import { analytics } from '@bsi/shared';
import { MonitoringErrorBoundary } from '@/components/monitoring/ErrorBoundary';
import { VisualQuality } from '@/lib/pitch-simulator/visual-engine';

// Dynamic import for 3D component (client-side only)
const PitchVisualization3D = dynamic(
  () => import('@/components/pitch-simulator/PitchVisualization3D').then((mod) => mod.PitchVisualization3D),
  { ssr: false, loading: () => <div className="w-full h-full bg-gray-900 rounded-lg flex items-center justify-center"><span className="text-white">Loading 3D View...</span></div> }
);

type CameraView = 'catcher' | 'batter' | 'side' | 'top' | 'pitcher';

interface PitchSlot {
  preset: PitchPresetType;
  params: PitchParams;
  trajectory: PitchTrajectory;
  visible: boolean;
}

export default function PitchTunnelSimulator() {
  // Camera and view controls
  const [cameraView, setCameraView] = useState<CameraView>('catcher');
  const [showStrikeZone, setShowStrikeZone] = useState(true);
  const [showGrid, setShowGrid] = useState(true);
  const [animationSpeed, setAnimationSpeed] = useState(1.0);
  const [paused, setPaused] = useState(false);
  const [qualityMode, setQualityMode] = useState<VisualQuality>('balanced');
  const [showTrails, setShowTrails] = useState(true);
  const [showContextSurfaces, setShowContextSurfaces] = useState(true);

  // Pitch management
  const [pitches, setPitches] = useState<PitchSlot[]>([
    {
      preset: FOUR_SEAM_FASTBALL,
      params: { ...FOUR_SEAM_FASTBALL },
      trajectory: calculateTrajectory({ ...FOUR_SEAM_FASTBALL }),
      visible: true,
    },
    {
      preset: CHANGEUP,
      params: { ...CHANGEUP },
      trajectory: calculateTrajectory({ ...CHANGEUP }),
      visible: true,
    },
  ]);

  const [activeSlot, setActiveSlot] = useState(0);

  // Track page view on mount
  useEffect(() => {
    analytics.track('page_view', {
      path: '/pitch-tunnel-simulator'
    });
  }, []);

  // Current pitch being edited
  const currentPitch = pitches[activeSlot];

  // Handle parameter changes
  const handleParamsChange = (params: PitchParams) => {
    const newPitches = [...pitches];
    newPitches[activeSlot] = {
      ...newPitches[activeSlot],
      params,
      trajectory: calculateTrajectory(params),
    };
    setPitches(newPitches);

    // Track parameter changes
    analytics.track('pitch_parameters_changed', {
      pitchSlot: activeSlot,
      pitchType: newPitches[activeSlot].preset.name,
      velocity: params.velocity,
      spinRate: params.spinRate,
      spinAxis: params.spinAxis
    });
  };

  // Handle preset selection
  const handlePresetSelect = (preset: PitchPreset) => {
    const newPitches = [...pitches];
    newPitches[activeSlot] = {
      preset,
      params: { ...preset },
      trajectory: calculateTrajectory({ ...preset }),
      visible: true,
    };
    setPitches(newPitches);

    // Track preset selection
    analytics.track('pitch_preset_selected', {
      pitchSlot: activeSlot,
      presetName: preset.name,
      presetColor: preset.color
    });
  };

  // Add new pitch
  const handleAddPitch = () => {
    if (pitches.length >= 6) return; // Max 6 pitches
    const newPreset = FOUR_SEAM_FASTBALL;
    setPitches([
      ...pitches,
      {
        preset: newPreset,
        params: { ...newPreset },
        trajectory: calculateTrajectory({ ...newPreset }),
        visible: true,
      },
    ]);
    setActiveSlot(pitches.length);

    // Track adding new pitch
    analytics.track('pitch_added', {
      totalPitches: pitches.length + 1,
      presetName: newPreset.name
    });
  };

  // Remove pitch
  const handleRemovePitch = (index: number) => {
    if (pitches.length <= 1) return; // Keep at least one pitch
    const removedPitch = pitches[index];
    const newPitches = pitches.filter((_, i) => i !== index);
    setPitches(newPitches);
    if (activeSlot >= newPitches.length) {
      setActiveSlot(newPitches.length - 1);
    }

    // Track removing pitch
    analytics.track('pitch_removed', {
      removedPitchType: removedPitch.preset.name,
      remainingPitches: newPitches.length
    });
  };

  // Toggle pitch visibility
  const handleToggleVisibility = (index: number) => {
    const newPitches = [...pitches];
    newPitches[index].visible = !newPitches[index].visible;
    setPitches(newPitches);

    // Track visibility toggle
    analytics.track('pitch_visibility_toggled', {
      pitchType: newPitches[index].preset.name,
      visible: newPitches[index].visible
    });
  };

  // Load preset combo
  const handleLoadCombo = (comboPresets: PitchPresetType[]) => {
    const newPitches = comboPresets.map((preset) => ({
      preset,
      params: { ...preset },
      trajectory: calculateTrajectory({ ...preset }),
      visible: true,
    }));
    setPitches(newPitches);
    setActiveSlot(0);

    // Track combo load
    analytics.track('pitch_combo_loaded', {
      pitchCount: comboPresets.length,
      pitchTypes: comboPresets.map(p => p.name).join(', ')
    });
  };

  // Prepare trajectories for 3D visualization
  const trajectories = useMemo(() => {
    return pitches.map((pitch) => ({
      trajectory: pitch.trajectory,
      color: pitch.preset.color,
      name: pitch.preset.name,
      visible: pitch.visible,
    }));
  }, [pitches]);

  return (
    <MonitoringErrorBoundary>
      <div className="min-h-screen bg-gray-900 py-4 md:py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-6 md:mb-8">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-2">
            Pitch Tunnel Simulator
          </h1>
          <p className="text-gray-400 text-sm md:text-base">
            Real-time 3D pitch design and tunneling visualization with advanced physics
          </p>
        </div>

        {/* Main Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
          {/* Left Column - 3D Visualization */}
          <div className="lg:col-span-2 space-y-4">
            {/* 3D Viewport */}
            <div className="bg-gray-800 rounded-lg p-4">
              <div className="aspect-video w-full">
                <PitchVisualization3D
                  trajectories={trajectories}
                  cameraView={cameraView}
                  showStrikeZone={showStrikeZone}
                  showGrid={showGrid}
                  animationSpeed={animationSpeed}
                  paused={paused}
                  qualityMode={qualityMode}
                  showTrails={showTrails}
                  showContextSurfaces={showContextSurfaces}
                />
              </div>
            </div>

            {/* View Controls */}
            <div className="bg-gray-800 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-white mb-4">View Controls</h3>

              {/* Camera Views */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-300 mb-2">Camera Angle</label>
                <div className="grid grid-cols-3 md:grid-cols-5 gap-2">
                  {(['catcher', 'batter', 'side', 'top', 'pitcher'] as CameraView[]).map((view) => (
                    <button
                      key={view}
                      onClick={() => {
                        setCameraView(view);
                        analytics.track('camera_view_changed', {
                          fromView: cameraView,
                          toView: view
                        });
                      }}
                      className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                        cameraView === view
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      }`}
                    >
                      {view.charAt(0).toUpperCase() + view.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-300 mb-2">Visual Quality</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['performance', 'balanced', 'cinematic'] as VisualQuality[]).map((mode) => (
                    <button
                      key={mode}
                      onClick={() => {
                        setQualityMode(mode);
                        analytics.track('visual_quality_changed', {
                          mode,
                        });
                      }}
                      className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                        qualityMode === mode
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      }`}
                    >
                      {mode.charAt(0).toUpperCase() + mode.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Animation Controls */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Animation Speed: {animationSpeed.toFixed(1)}x
                  </label>
                  <input
                    type="range"
                    min="0.1"
                    max="2"
                    step="0.1"
                    value={animationSpeed}
                    onChange={(e) => {
                      const newSpeed = parseFloat(e.target.value);
                      setAnimationSpeed(newSpeed);
                      analytics.track('animation_speed_changed', {
                        speed: newSpeed
                      });
                    }}
                    className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                  />
                </div>

                <div className="flex items-end gap-2">
                  <button
                    onClick={() => {
                      const newPausedState = !paused;
                      setPaused(newPausedState);
                      analytics.track('simulation_action', {
                        action: newPausedState ? 'pause' : 'play'
                      });
                    }}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium"
                  >
                    {paused ? '▶ Play' : '⏸ Pause'}
                  </button>
                </div>
              </div>

              {/* Display Options */}
              <div className="flex flex-wrap gap-4 mt-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showStrikeZone}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      setShowStrikeZone(checked);
                      analytics.track('strike_zone_toggled', {
                        visible: checked
                      });
                    }}
                    className="w-4 h-4 rounded text-blue-600"
                  />
                  <span className="text-sm text-gray-300">Strike Zone</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showGrid}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      setShowGrid(checked);
                      analytics.track('grid_toggled', {
                        visible: checked
                      });
                    }}
                    className="w-4 h-4 rounded text-blue-600"
                  />
                  <span className="text-sm text-gray-300">Grid</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showTrails}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      setShowTrails(checked);
                      analytics.track('trail_visibility_toggled', {
                        visible: checked,
                      });
                    }}
                    className="w-4 h-4 rounded text-blue-600"
                  />
                  <span className="text-sm text-gray-300">Glowing Trails</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showContextSurfaces}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      setShowContextSurfaces(checked);
                      analytics.track('context_surface_toggled', {
                        visible: checked,
                      });
                    }}
                    className="w-4 h-4 rounded text-blue-600"
                  />
                  <span className="text-sm text-gray-300">Runway Surface</span>
                </label>
              </div>
            </div>

            {/* Pitch Statistics */}
            <PitchStats pitches={pitches} />
          </div>

          {/* Right Column - Controls */}
          <div className="space-y-4">
            {/* Pitch Selector */}
            <div className="bg-gray-800 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold text-white">Pitch Slots</h3>
                <button
                  onClick={handleAddPitch}
                  disabled={pitches.length >= 6}
                  className="px-3 py-1 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  + Add
                </button>
              </div>

              <div className="space-y-2">
                {pitches.map((pitch, index) => (
                  <div
                    key={index}
                    className={`flex items-center gap-2 p-2 rounded-md cursor-pointer transition-colors ${
                      activeSlot === index ? 'bg-gray-700' : 'bg-gray-750 hover:bg-gray-700'
                    }`}
                    onClick={() => {
                      setActiveSlot(index);
                      analytics.track('pitch_slot_selected', {
                        slotIndex: index,
                        pitchType: pitch.preset.name
                      });
                    }}
                  >
                    <div
                      className="w-4 h-4 rounded-full flex-shrink-0"
                      style={{ backgroundColor: pitch.preset.color }}
                    />
                    <span className="text-white text-sm flex-1 truncate">{pitch.preset.name}</span>
                    {pitches.length > 1 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemovePitch(index);
                        }}
                        className="text-red-400 hover:text-red-300 text-xs"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Pitch Controls */}
            <PitchControls
              params={currentPitch.params}
              onChange={handleParamsChange}
              onPresetSelect={handlePresetSelect}
            />

            {/* Tunneling Panel */}
            <TunnelingPanel
              pitches={pitches}
              onToggleVisibility={handleToggleVisibility}
              onLoadCombo={handleLoadCombo}
            />
          </div>
        </div>

        {/* Info Footer */}
        <div className="mt-8 bg-gray-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-3">About This Simulator</h3>
          <div className="text-sm text-gray-400 space-y-2">
            <p>
              This simulator uses real physics to calculate pitch trajectories based on velocity, spin rate,
              and spin axis. The physics engine accounts for:
            </p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li><strong className="text-white">Magnus Force:</strong> Spin-induced movement (breaking balls)</li>
              <li><strong className="text-white">Drag Force:</strong> Air resistance that slows the ball</li>
              <li><strong className="text-white">Gravity:</strong> Downward acceleration</li>
              <li><strong className="text-white">Release Point:</strong> Initial position and angle</li>
            </ul>
            <p className="mt-3">
              Pitch parameters are based on MLB Statcast averages (2020-2024). The tunneling analysis shows
              how effectively pitches hide their identity from batters by following similar paths before
              diverging late in flight.
            </p>
          </div>
        </div>
      </div>
    </div>
    </MonitoringErrorBoundary>
  );
}
