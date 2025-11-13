/**
 * Babylon.js WebGPU/WebGL2 Engine Factory
 *
 * Creates the rendering engine with automatic fallback:
 * 1. Try WebGPU (Safari 18+, Chrome 113+)
 * 2. Fallback to WebGL2 (all modern browsers)
 *
 * @module lib/babylon/engine
 */

import { Engine, WebGPUEngine, NullEngine } from '@babylonjs/core';

export type EngineType = 'webgpu' | 'webgl2' | 'null';

export interface EngineConfig {
  antialias?: boolean;
  adaptToDeviceRatio?: boolean;
  powerPreference?: 'high-performance' | 'low-power' | 'default';
  preserveDrawingBuffer?: boolean;
  stencil?: boolean;
}

export interface EngineInfo {
  type: EngineType;
  gpuVendor: string;
  gpuRenderer: string;
  maxTextureSize: number;
  supportsCompute: boolean;
}

/**
 * Create Babylon.js engine with WebGPU → WebGL2 fallback
 */
export async function createBabylonEngine(
  canvas: HTMLCanvasElement,
  config: EngineConfig = {}
): Promise<{ engine: Engine | WebGPUEngine; info: EngineInfo }> {
  const defaultConfig: EngineConfig = {
    antialias: true,
    adaptToDeviceRatio: true,
    powerPreference: 'high-performance',
    preserveDrawingBuffer: false,
    stencil: true,
    ...config,
  };

  // Try WebGPU first
  if ('gpu' in navigator) {
    try {
      console.log('[BabylonEngine] Attempting WebGPU initialization...');

      const webgpuEngine = new WebGPUEngine(canvas, {
        antialias: defaultConfig.antialias,
        stencil: defaultConfig.stencil,
        powerPreference: defaultConfig.powerPreference as GPUPowerPreference,
        adaptToDeviceRatio: defaultConfig.adaptToDeviceRatio,
      });

      await webgpuEngine.initAsync();

      const info: EngineInfo = {
        type: 'webgpu',
        gpuVendor: 'WebGPU',
        gpuRenderer: await getWebGPURenderer(),
        maxTextureSize: webgpuEngine.getCaps().maxTextureSize,
        supportsCompute: true,
      };

      console.log('[BabylonEngine] WebGPU initialized successfully', info);
      return { engine: webgpuEngine, info };
    } catch (error) {
      console.warn('[BabylonEngine] WebGPU initialization failed, falling back to WebGL2', error);
    }
  }

  // Fallback to WebGL2
  try {
    console.log('[BabylonEngine] Initializing WebGL2...');

    const webglEngine = new Engine(canvas, defaultConfig.antialias, {
      preserveDrawingBuffer: defaultConfig.preserveDrawingBuffer,
      stencil: defaultConfig.stencil,
      powerPreference: defaultConfig.powerPreference,
      adaptToDeviceRatio: defaultConfig.adaptToDeviceRatio,
    });

    const gl = canvas.getContext('webgl2');
    const debugInfo = gl?.getExtension('WEBGL_debug_renderer_info');

    const info: EngineInfo = {
      type: 'webgl2',
      gpuVendor: debugInfo && gl
        ? gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) || 'Unknown'
        : 'Unknown',
      gpuRenderer: debugInfo && gl
        ? gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) || 'Unknown'
        : 'Unknown',
      maxTextureSize: webglEngine.getCaps().maxTextureSize,
      supportsCompute: false,
    };

    console.log('[BabylonEngine] WebGL2 initialized successfully', info);
    return { engine: webglEngine, info };
  } catch (error) {
    console.error('[BabylonEngine] WebGL2 initialization failed', error);

    // Last resort: NullEngine (SSR safe)
    const nullEngine = new NullEngine();
    const info: EngineInfo = {
      type: 'null',
      gpuVendor: 'None',
      gpuRenderer: 'NullEngine',
      maxTextureSize: 0,
      supportsCompute: false,
    };

    console.warn('[BabylonEngine] Using NullEngine (no rendering)');
    return { engine: nullEngine, info };
  }
}

/**
 * Get WebGPU adapter info
 */
async function getWebGPURenderer(): Promise<string> {
  try {
    if (!('gpu' in navigator)) return 'Unknown';

    const adapter = await (navigator as any).gpu.requestAdapter();
    if (!adapter) return 'Unknown';

    // Some browsers expose adapter info
    const info = (adapter as any).info || {};
    return info.description || info.device || 'WebGPU Device';
  } catch {
    return 'WebGPU Device';
  }
}

/**
 * Optimize engine settings based on device capability
 */
export function optimizeEngineForDevice(
  engine: Engine | WebGPUEngine,
  deviceTier: 'low' | 'mid' | 'high'
): void {
  switch (deviceTier) {
    case 'low':
      engine.setHardwareScalingLevel(2); // Render at 50% resolution
      engine.enableOfflineSupport = false;
      break;

    case 'mid':
      engine.setHardwareScalingLevel(1.5); // Render at 66% resolution
      engine.enableOfflineSupport = false;
      break;

    case 'high':
      engine.setHardwareScalingLevel(1); // Full resolution
      engine.enableOfflineSupport = false;
      break;
  }

  console.log(`[BabylonEngine] Optimized for ${deviceTier} tier device`);
}

/**
 * Enable performance profiling
 */
export function enablePerformanceProfiling(engine: Engine | WebGPUEngine): void {
  engine.enableOfflineSupport = false;

  // Log FPS every 5 seconds
  setInterval(() => {
    const fps = engine.getFps();
    const deltaTime = engine.getDeltaTime();
    console.log(`[Performance] FPS: ${fps.toFixed(1)}, Frame Time: ${deltaTime.toFixed(2)}ms`);
  }, 5000);
}
