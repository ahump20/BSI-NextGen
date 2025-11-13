/**
 * Base Babylon.js Scene Wrapper Component
 *
 * Handles:
 * - WebGPU/WebGL2 engine initialization
 * - Device capability detection
 * - Touch controls for mobile
 * - Performance monitoring
 * - SSR safety
 *
 * @module components/3d/BabylonScene
 */

'use client';

import { useEffect, useRef, useState } from 'react';
import { Scene, ArcRotateCamera, HemisphericLight, Vector3, Engine, WebGPUEngine } from '@babylonjs/core';
import { createBabylonEngine, optimizeEngineForDevice, type EngineInfo } from '@/lib/babylon/engine';
import { DeviceCapability, type DeviceInfo } from '@/lib/babylon/utils/device-capability';

export interface BabylonSceneProps {
  /**
   * Callback to build the scene contents
   */
  onSceneReady?: (scene: Scene, engine: Engine | WebGPUEngine, deviceInfo: DeviceInfo) => void;

  /**
   * Callback called on each frame render
   */
  onRender?: (scene: Scene) => void;

  /**
   * Camera initial position
   */
  cameraPosition?: { alpha: number; beta: number; radius: number };

  /**
   * Camera target (what it looks at)
   */
  cameraTarget?: Vector3;

  /**
   * Enable performance monitoring (logs FPS to console)
   */
  enablePerformanceMonitoring?: boolean;

  /**
   * Canvas CSS class name
   */
  className?: string;

  /**
   * Canvas inline styles
   */
  style?: React.CSSProperties;
}

/**
 * Base Babylon.js scene wrapper with automatic WebGPU/WebGL2 fallback
 */
export function BabylonScene({
  onSceneReady,
  onRender,
  cameraPosition = { alpha: Math.PI / 4, beta: Math.PI / 3, radius: 20 },
  cameraTarget = Vector3.Zero(),
  enablePerformanceMonitoring = false,
  className = '',
  style = {},
}: BabylonSceneProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [engineInfo, setEngineInfo] = useState<EngineInfo | null>(null);
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    let engine: Engine | WebGPUEngine | null = null;
    let scene: Scene | null = null;

    async function initialize() {
      try {
        setIsLoading(true);

        // Detect device capabilities
        const device = await DeviceCapability.detect();
        setDeviceInfo(device);
        console.log('[BabylonScene] Device capabilities:', device);

        // Create engine with WebGPU → WebGL2 fallback
        const { engine: createdEngine, info } = await createBabylonEngine(
          canvasRef.current!,
          {
            powerPreference: device.gpuTier === 'high' ? 'high-performance' : 'default',
            antialias: device.gpuTier !== 'low',
          }
        );

        engine = createdEngine;
        setEngineInfo(info);

        // Optimize engine for device
        optimizeEngineForDevice(engine, device.gpuTier);

        // Create scene
        scene = new Scene(engine);
        scene.clearColor.set(0.05, 0.05, 0.05, 1); // Dark background

        // Create default camera
        const camera = new ArcRotateCamera(
          'camera',
          cameraPosition.alpha,
          cameraPosition.beta,
          cameraPosition.radius,
          cameraTarget,
          scene
        );
        camera.attachControl(canvasRef.current!, true);
        camera.lowerRadiusLimit = 2;
        camera.upperRadiusLimit = 100;
        camera.wheelPrecision = 20;

        // Create default light
        const light = new HemisphericLight('light', new Vector3(0, 1, 0), scene);
        light.intensity = 0.7;

        // Call user's scene setup
        if (onSceneReady) {
          onSceneReady(scene, engine, device);
        }

        // Performance monitoring
        if (enablePerformanceMonitoring) {
          let frameCount = 0;
          let lastTime = performance.now();

          scene.onBeforeRenderObservable.add(() => {
            frameCount++;
            const now = performance.now();
            if (now - lastTime >= 5000) {
              const fps = (frameCount / ((now - lastTime) / 1000)).toFixed(1);
              console.log(`[Performance] FPS: ${fps}, Engine: ${info.type}`);
              frameCount = 0;
              lastTime = now;
            }
          });
        }

        // Start render loop
        engine.runRenderLoop(() => {
          if (scene) {
            scene.render();
            if (onRender) {
              onRender(scene);
            }
          }
        });

        // Handle window resize
        const handleResize = () => {
          engine?.resize();
        };
        window.addEventListener('resize', handleResize);

        setIsLoading(false);

        // Cleanup
        return () => {
          window.removeEventListener('resize', handleResize);
          scene?.dispose();
          engine?.dispose();
        };
      } catch (err) {
        console.error('[BabylonScene] Initialization error:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
        setIsLoading(false);
      }
    }

    initialize();

    return () => {
      scene?.dispose();
      engine?.dispose();
    };
  }, [onSceneReady, onRender, cameraPosition, cameraTarget, enablePerformanceMonitoring]);

  return (
    <div className="relative w-full h-full">
      <canvas
        ref={canvasRef}
        className={`w-full h-full ${className}`}
        style={{ touchAction: 'none', ...style }}
      />

      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900/80">
          <div className="text-center">
            <div className="inline-block w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-white text-sm">Initializing 3D Engine...</p>
            {deviceInfo && (
              <p className="text-gray-400 text-xs mt-2">
                Device: {deviceInfo.gpuTier.toUpperCase()} tier
              </p>
            )}
          </div>
        </div>
      )}

      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-red-900/20">
          <div className="bg-red-800 border border-red-500 rounded-lg p-6 max-w-md">
            <h3 className="text-white font-bold mb-2">3D Initialization Failed</h3>
            <p className="text-red-200 text-sm mb-4">{error}</p>
            <p className="text-gray-300 text-xs">
              Your browser may not support WebGL2. Try updating to the latest version.
            </p>
          </div>
        </div>
      )}

      {engineInfo && !isLoading && (
        <div className="absolute bottom-4 left-4 bg-black/60 text-white text-xs px-3 py-2 rounded-lg">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${
              engineInfo.type === 'webgpu' ? 'bg-green-500' : 'bg-yellow-500'
            }`}></div>
            <span className="uppercase font-mono">{engineInfo.type}</span>
            {engineInfo.supportsCompute && (
              <span className="text-green-400">| Compute Shaders</span>
            )}
          </div>
          <div className="text-gray-400 mt-1">
            {engineInfo.gpuRenderer.substring(0, 40)}
            {engineInfo.gpuRenderer.length > 40 ? '...' : ''}
          </div>
        </div>
      )}
    </div>
  );
}
