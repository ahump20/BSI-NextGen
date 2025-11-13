/**
 * 3D Visualization Demo Page
 *
 * Demonstrates Babylon.js integration with:
 * - Baseball diamond visualization
 * - Device capability detection
 * - WebGPU/WebGL2 automatic fallback
 *
 * @page /3d-demo
 */

'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';

// Dynamically import 3D component (SSR-safe)
const BaseballDiamond = dynamic(
  () => import('@/components/3d/baseball/BaseballDiamond').then(mod => mod.BaseballDiamond),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-[600px] bg-gray-900 rounded-lg">
        <div className="text-center">
          <div className="inline-block w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-white text-sm">Loading 3D Engine...</p>
          <p className="text-gray-400 text-xs mt-2">Initializing WebGPU/WebGL2...</p>
        </div>
      </div>
    ),
  }
);

export default function ThreeDDemoPage() {
  const [showHeatmap, setShowHeatmap] = useState(true);
  const [showPitchTrajectories, setShowPitchTrajectories] = useState(false);
  const [showPlayerPositions, setShowPlayerPositions] = useState(true);

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-8">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-orange-500 hover:text-orange-400 transition-colors mb-4"
        >
          ← Back to Home
        </Link>

        <h1 className="text-4xl font-bold mb-2">
          Blaze Sports Intel - 3D Visualization Demo
        </h1>
        <p className="text-gray-400 text-lg">
          GPU-accelerated sports analytics with Babylon.js + WebGPU
        </p>
      </div>

      {/* Controls */}
      <div className="max-w-7xl mx-auto mb-6">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-bold mb-4">Visualization Controls</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Heatmap Toggle */}
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={showHeatmap}
                onChange={e => setShowHeatmap(e.target.checked)}
                className="w-5 h-5 rounded border-gray-700 bg-gray-800 text-orange-500 focus:ring-orange-500 focus:ring-offset-gray-900"
              />
              <div>
                <div className="font-semibold">Hit Heatmap</div>
                <div className="text-xs text-gray-400">WebGPU compute shader</div>
              </div>
            </label>

            {/* Pitch Trajectories Toggle */}
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={showPitchTrajectories}
                onChange={e => setShowPitchTrajectories(e.target.checked)}
                className="w-5 h-5 rounded border-gray-700 bg-gray-800 text-orange-500 focus:ring-orange-500 focus:ring-offset-gray-900"
              />
              <div>
                <div className="font-semibold">Pitch Trajectories</div>
                <div className="text-xs text-gray-400">Physics simulation</div>
              </div>
            </label>

            {/* Player Positions Toggle */}
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={showPlayerPositions}
                onChange={e => setShowPlayerPositions(e.target.checked)}
                className="w-5 h-5 rounded border-gray-700 bg-gray-800 text-orange-500 focus:ring-orange-500 focus:ring-offset-gray-900"
              />
              <div>
                <div className="font-semibold">Player Positions</div>
                <div className="text-xs text-gray-400">Real-time updates</div>
              </div>
            </label>
          </div>
        </div>
      </div>

      {/* 3D Visualization */}
      <div className="max-w-7xl mx-auto">
        <div className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden">
          <BaseballDiamond
            teamId="138" // St. Louis Cardinals
            showHeatmap={showHeatmap}
            showPitchTrajectories={showPitchTrajectories}
            showPlayerPositions={showPlayerPositions}
          />
        </div>
      </div>

      {/* Info Cards */}
      <div className="max-w-7xl mx-auto mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* WebGPU Status */}
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
          <h3 className="text-lg font-bold mb-2 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500"></div>
            WebGPU Status
          </h3>
          <p className="text-sm text-gray-400 mb-4">
            Automatic detection and fallback to WebGL2 if WebGPU unavailable.
          </p>
          <div className="text-xs space-y-1">
            <div className="flex justify-between">
              <span className="text-gray-500">Safari 18+:</span>
              <span className="text-green-400">Supported</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Chrome 113+:</span>
              <span className="text-green-400">Supported</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Fallback:</span>
              <span className="text-blue-400">WebGL2</span>
            </div>
          </div>
        </div>

        {/* Performance Targets */}
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
          <h3 className="text-lg font-bold mb-2">Performance Targets</h3>
          <p className="text-sm text-gray-400 mb-4">
            Adaptive rendering based on device capability detection.
          </p>
          <div className="text-xs space-y-1">
            <div className="flex justify-between">
              <span className="text-gray-500">Mobile:</span>
              <span className="text-green-400">60 FPS</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Desktop:</span>
              <span className="text-green-400">120 FPS</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Memory:</span>
              <span className="text-blue-400">&lt;150MB</span>
            </div>
          </div>
        </div>

        {/* Features */}
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
          <h3 className="text-lg font-bold mb-2">Features</h3>
          <ul className="text-sm space-y-2">
            <li className="flex items-start gap-2">
              <span className="text-green-500 mt-0.5">✓</span>
              <span className="text-gray-400">Baseball diamond 3D mesh</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-yellow-500 mt-0.5">⚠</span>
              <span className="text-gray-400">Hit heatmap (WebGPU compute)</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-yellow-500 mt-0.5">⚠</span>
              <span className="text-gray-400">Pitch trajectory physics</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-500 mt-0.5">✓</span>
              <span className="text-gray-400">Touch controls (mobile)</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Documentation Link */}
      <div className="max-w-7xl mx-auto mt-8 text-center">
        <p className="text-gray-400 text-sm">
          For complete architecture documentation, see{' '}
          <code className="bg-gray-800 px-2 py-1 rounded text-orange-500">
            /Users/AustinHumphrey/BSI-NextGen/BLAZE-3D-VISUALIZATION-ARCHITECTURE.md
          </code>
        </p>
      </div>
    </div>
  );
}
