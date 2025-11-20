/**
 * Device Capability Detection
 *
 * Detects hardware capabilities and recommends optimal rendering settings:
 * - GPU tier (low/mid/high)
 * - WebGPU support
 * - Available memory
 * - Screen resolution
 * - Touch support
 *
 * @module lib/babylon/utils/device-capability
 */

export interface DeviceInfo {
  /** WebGPU support */
  supportsWebGPU: boolean;

  /** GPU tier: low (Mali, Adreno 5xx), mid (Adreno 6xx), high (Apple M/A15+) */
  gpuTier: 'low' | 'mid' | 'high';

  /** Device memory in GB */
  memoryGB: number;

  /** Screen width in pixels */
  screenWidth: number;

  /** Screen height in pixels */
  screenHeight: number;

  /** Device pixel ratio */
  pixelRatio: number;

  /** Touch support */
  supportsTouch: boolean;

  /** Recommended render config */
  renderConfig: RenderConfig;

  /** GPU vendor (Apple, NVIDIA, AMD, Intel, etc.) */
  gpuVendor: string;

  /** GPU renderer string */
  gpuRenderer: string;
}

export interface RenderConfig {
  /** Target FPS */
  targetFPS: 60 | 120;

  /** LOD levels (more = better quality for distant objects) */
  lodLevels: 3 | 5 | 7;

  /** Shadow quality */
  shadowQuality: 'off' | 'low' | 'high';

  /** Post-processing effects (bloom, DOF, etc.) */
  postProcessing: boolean;

  /** Render resolution multiplier (1 = native, 0.5 = half resolution) */
  resolutionScale: number;

  /** Maximum texture size */
  maxTextureSize: 1024 | 2048 | 4096 | 8192;
}

/**
 * Device capability detector
 */
export class DeviceCapability {
  /**
   * Detect device capabilities and recommend optimal settings
   */
  static async detect(): Promise<DeviceInfo> {
    // WebGPU support
    const supportsWebGPU = 'gpu' in navigator;

    // GPU tier estimation
    const { tier, vendor, renderer } = await this.detectGPUTier();

    // Memory
    const memoryGB = (navigator as any).deviceMemory || 4;

    // Screen
    const screenWidth = window.screen.width;
    const screenHeight = window.screen.height;
    const pixelRatio = window.devicePixelRatio || 1;

    // Touch support
    const supportsTouch =
      'ontouchstart' in window ||
      navigator.maxTouchPoints > 0;

    // Adaptive render configuration
    const renderConfig = this.generateRenderConfig(tier, memoryGB, pixelRatio);

    return {
      supportsWebGPU,
      gpuTier: tier,
      memoryGB,
      screenWidth,
      screenHeight,
      pixelRatio,
      supportsTouch,
      renderConfig,
      gpuVendor: vendor,
      gpuRenderer: renderer,
    };
  }

  /**
   * Detect GPU tier from renderer string
   */
  private static async detectGPUTier(): Promise<{
    tier: 'low' | 'mid' | 'high';
    vendor: string;
    renderer: string;
  }> {
    try {
      // Create temporary canvas for WebGL info
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');

      if (!gl) {
        return { tier: 'low', vendor: 'Unknown', renderer: 'Unknown' };
      }

      const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
      if (!debugInfo) {
        return { tier: 'mid', vendor: 'Unknown', renderer: 'Unknown' };
      }

      const vendor = gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) || 'Unknown';
      const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) || 'Unknown';

      // Cleanup
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      canvas.remove();

      // Tier classification
      let tier: 'low' | 'mid' | 'high' = 'mid';

      const rendererLower = renderer.toLowerCase();

      // High tier: Apple Silicon, high-end NVIDIA/AMD
      if (
        rendererLower.includes('apple m') ||       // M1, M2, M3, M4
        rendererLower.includes('apple a15') ||     // A15 Bionic+
        rendererLower.includes('apple a16') ||
        rendererLower.includes('apple a17') ||
        rendererLower.includes('apple a18') ||
        rendererLower.includes('rtx') ||           // NVIDIA RTX series
        rendererLower.includes('radeon rx 6') ||   // AMD RX 6000+
        rendererLower.includes('radeon rx 7')
      ) {
        tier = 'high';
      }
      // Mid tier: Adreno 6xx, Mali-G7x, integrated graphics
      else if (
        rendererLower.includes('adreno 6') ||
        rendererLower.includes('adreno 7') ||
        rendererLower.includes('mali-g7') ||
        rendererLower.includes('intel iris') ||
        rendererLower.includes('intel uhd')
      ) {
        tier = 'mid';
      }
      // Low tier: Adreno 5xx, Mali-G5x, older GPUs
      else if (
        rendererLower.includes('adreno 5') ||
        rendererLower.includes('mali-g5') ||
        rendererLower.includes('intel hd')
      ) {
        tier = 'low';
      }

      return { tier, vendor, renderer };
    } catch (error) {
      console.warn('[DeviceCapability] GPU detection failed:', error);
      return { tier: 'mid', vendor: 'Unknown', renderer: 'Unknown' };
    }
  }

  /**
   * Generate optimal render configuration
   */
  private static generateRenderConfig(
    tier: 'low' | 'mid' | 'high',
    memoryGB: number,
    pixelRatio: number
  ): RenderConfig {
    switch (tier) {
      case 'high':
        return {
          targetFPS: 120,
          lodLevels: 7,
          shadowQuality: 'high',
          postProcessing: true,
          resolutionScale: Math.min(pixelRatio, 2), // Cap at 2x for retina
          maxTextureSize: 8192,
        };

      case 'mid':
        return {
          targetFPS: 60,
          lodLevels: 5,
          shadowQuality: 'low',
          postProcessing: false,
          resolutionScale: 1,
          maxTextureSize: 4096,
        };

      case 'low':
        return {
          targetFPS: 60,
          lodLevels: 3,
          shadowQuality: 'off',
          postProcessing: false,
          resolutionScale: 0.75, // Render at 75% resolution
          maxTextureSize: 2048,
        };

      default:
        return {
          targetFPS: 60,
          lodLevels: 5,
          shadowQuality: 'low',
          postProcessing: false,
          resolutionScale: 1,
          maxTextureSize: 4096,
        };
    }
  }

  /**
   * Check if device is likely a mobile device
   */
  static isMobile(): boolean {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    );
  }

  /**
   * Check if device is likely a tablet
   */
  static isTablet(): boolean {
    return /iPad|Android/i.test(navigator.userAgent) && window.innerWidth >= 768;
  }

  /**
   * Get battery status (if available)
   */
  static async getBatteryInfo(): Promise<{
    level: number;
    charging: boolean;
  } | null> {
    try {
      if (!('getBattery' in navigator)) return null;

      const battery = await (navigator as any).getBattery();
      return {
        level: battery.level,
        charging: battery.charging,
      };
    } catch {
      return null;
    }
  }

  /**
   * Get network connection info (if available)
   */
  static getConnectionInfo(): {
    effectiveType: string;
    downlink: number;
    rtt: number;
  } | null {
    const conn = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;

    if (!conn) return null;

    return {
      effectiveType: conn.effectiveType || 'unknown',
      downlink: conn.downlink || 0,
      rtt: conn.rtt || 0,
    };
  }

  /**
   * Recommend whether to enable data-intensive features
   */
  static shouldEnableDataIntensiveFeatures(): boolean {
    const conn = this.getConnectionInfo();

    // Only enable on good connections
    if (conn) {
      return (
        conn.effectiveType === '4g' ||
        conn.effectiveType === '5g' ||
        conn.downlink > 5 // >5 Mbps
      );
    }

    // Default to enabled if connection info unavailable
    return true;
  }
}
