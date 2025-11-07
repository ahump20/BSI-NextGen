import {
  Engine,
  Scene,
  ArcRotateCamera,
  HemisphericLight,
  DirectionalLight,
  PointLight,
  ShadowGenerator,
  CubeTexture,
  Vector3,
  MeshBuilder,
  StandardMaterial,
  Color3,
  PhysicsAggregate,
  PhysicsShapeType,
  HavokPlugin,
  Mesh,
  AbstractMesh,
  TrailMesh,
  ParticleSystem,
  Texture,
  DefaultRenderingPipeline,
  ImageProcessingConfiguration,
  GPUParticleSystem,
  MotionBlurPostProcess,
  Sound
} from "@babylonjs/core";
import HavokPhysics from "@babylonjs/havok";
import { BallPhysics, PitchType, PitchParameters, HitParameters } from "../physics/BallPhysics";
import { PitcherSystem, PitchSequenceContext } from "../systems/PitcherSystem";
import { BatterSystem } from "../systems/BatterSystem";
import { FieldingSystem, BallTrajectory } from "../systems/FieldingSystem";
import { BaseRunningSystem } from "../systems/BaseRunningSystem";
import { BaseballField } from "../rendering/BaseballField";
import { MaterialLibrary } from "../graphics/MaterialLibrary";

export interface GameConfig {
  canvas: HTMLCanvasElement;
  onGameStateChange: (state: GameState) => void;
}

export interface GameState {
  inning: number;
  outs: number;
  homeScore: number;
  awayScore: number;
  isTopOfInning: boolean;
  bases: [boolean, boolean, boolean]; // 1st, 2nd, 3rd
  currentBatter: Player;
  currentPitcher: Player;
  balls: number;
  strikes: number;
}

export interface Player {
  id: string;
  name: string;
  battingPower: number; // 1-10
  battingAccuracy: number; // 1-10
  speed: number; // 1-10
  pitchSpeed: number; // 1-10
  pitchControl: number; // 1-10
  fieldingRange: number; // 1-10
  fieldingAccuracy: number; // 1-10
  position: string;
  modelPath: string;
}

export interface Stadium {
  id: string;
  name: string;
  description: string;
  dimensions: {
    leftField: number;
    centerField: number;
    rightField: number;
  };
  modelPath: string;
  skyboxPath: string;
}

export class GameEngine {
  private engine: Engine;
  private scene: Scene;
  private camera!: ArcRotateCamera; // Initialized in initialize()
  private gameState: GameState;
  private havokInstance: any;
  private ball: Mesh | null = null;
  private ballPhysics: PhysicsAggregate | null = null;
  private pitcher: AbstractMesh | null = null;
  private batter: AbstractMesh | null = null;
  private _fielders: Map<string, AbstractMesh> = new Map();
  private isPitching: boolean = false;
  private isBatting: boolean = false;
  private onStateChange: (state: GameState) => void;

  // Advanced game systems (initialized with players)
  private ballPhysicsEngine!: BallPhysics;
  private pitcherSystem: PitcherSystem | null = null;
  private batterSystem: BatterSystem | null = null;
  private fieldingSystem: FieldingSystem;
  private baseRunningSystem: BaseRunningSystem;

  // Visual effects
  private ballTrail: TrailMesh | null = null;
  private dustParticles: ParticleSystem | null = null;
  private impactParticles: ParticleSystem | null = null;

  // Game state tracking
  private currentPitchType: PitchType = PitchType.FASTBALL;
  private ballInPlay: boolean = false;

  // Stat tracking for progression API
  private totalHits: number = 0;
  private totalHomeRuns: number = 0;

  // GPU capabilities
  private isWebGPUEnabled: boolean = false;

  // Graphics systems
  private materialLibrary!: MaterialLibrary; // Initialized in initialize()

  // Advanced lighting system
  private sunLight!: DirectionalLight; // Main directional light (sun/stadium)
  private shadowGenerator!: ShadowGenerator; // Cascaded shadows
  private stadiumLights: PointLight[] = []; // 4 floodlight poles
  private hdrEnvironment?: CubeTexture; // HDR environment for reflections

  // Post-processing pipeline (Phase 1.4)
  private renderPipeline?: DefaultRenderingPipeline; // Bloom, DOF, tone mapping, chromatic aberration
  private motionBlur?: MotionBlurPostProcess; // Per-object motion blur for ball

  // Enhanced visual effects (Phase 1.5)
  private volumetricDustSystem?: GPUParticleSystem; // GPU-accelerated dust clouds
  private grassSpraySystem?: GPUParticleSystem; // Grass particles on slides

  // Audio system (Phase 4)
  private backgroundMusic?: Sound;
  private batCrackSound?: Sound;
  private crowdCheerSound?: Sound;
  private crowdOhhSound?: Sound;

  /**
   * Factory method to create GameEngine with enhanced rendering
   * Attempts WebGPU if available, falls back to WebGL2
   */
  public static async create(config: GameConfig): Promise<GameEngine> {
    console.log("🎮 Initializing Sandlot Sluggers Graphics Engine...");

    // Check for WebGPU support
    const hasWebGPU = 'gpu' in navigator;
    let engine: Engine;
    let isWebGPU = false;

    if (hasWebGPU && typeof (Engine as any).CreateAsync === 'function') {
      try {
        // Attempt to create WebGPU engine (Babylon.js 7.54+)
        engine = await (Engine as any).CreateAsync(config.canvas, {
          adaptToDeviceRatio: true,
          powerPreference: "high-performance",
          antialias: true,
          stencil: true,
          preserveDrawingBuffer: false,
          premultipliedAlpha: false
        });
        isWebGPU = engine.isWebGPU || false;
        console.log(`✅ Graphics API: WebGPU (2-3x performance boost)`);
      } catch (error) {
        console.warn(`⚠️ WebGPU initialization failed, falling back to WebGL2:`, error);
        engine = new Engine(config.canvas, true, {
          adaptToDeviceRatio: true,
          powerPreference: "high-performance"
        });
      }
    } else {
      // WebGPU not supported - use WebGL2
      engine = new Engine(config.canvas, true, {
        adaptToDeviceRatio: true,
        powerPreference: "high-performance",
        antialias: true,
        stencil: true
      });
      console.log(`✅ Graphics API: WebGL2 (WebGPU not available)`);
    }

    console.log(`📊 GPU: ${engine.getGlInfo ? engine.getGlInfo().renderer : 'Unknown'}`);
    console.log(`🎯 Target: 60 FPS @ ${window.devicePixelRatio}x resolution`);

    // Create and initialize the game engine
    const gameEngine = new GameEngine(engine, config);
    gameEngine.isWebGPUEnabled = isWebGPU;

    // Complete initialization
    await gameEngine.initialize();

    return gameEngine;
  }

  // Private constructor - use GameEngine.create() instead
  private constructor(engine: Engine, config: GameConfig) {
    this.engine = engine;
    this.scene = new Scene(this.engine);
    this.onStateChange = config.onGameStateChange;

    this.gameState = {
      inning: 1,
      outs: 0,
      homeScore: 0,
      awayScore: 0,
      isTopOfInning: true,
      bases: [false, false, false],
      currentBatter: this.createDefaultPlayer("batter"),
      currentPitcher: this.createDefaultPlayer("pitcher"),
      balls: 0,
      strikes: 0
    };

    // Initialize game systems that don't require player data
    this.ballPhysicsEngine = new BallPhysics();
    this.fieldingSystem = new FieldingSystem();
    this.baseRunningSystem = new BaseRunningSystem();
  }

  /**
   * Initialize scene, camera, physics, and visual effects
   * Called by the factory method after engine creation
   */
  private async initialize(): Promise<void> {
    // Setup camera
    this.camera = new ArcRotateCamera(
      "camera",
      -Math.PI / 2,
      Math.PI / 3,
      40,
      new Vector3(0, 0, 0),
      this.scene
    );
    this.camera.attachControl(this.engine.getRenderingCanvas()!, true);
    this.camera.lowerRadiusLimit = 20;
    this.camera.upperRadiusLimit = 60;
    this.camera.lowerBetaLimit = 0.1;
    this.camera.upperBetaLimit = Math.PI / 2;

    // Initialize PBR material library
    this.materialLibrary = new MaterialLibrary(this.scene);
    this.materialLibrary.initializeFieldMaterials();
    console.log("✅ PBR Material Library initialized");

    // Setup advanced lighting system (Phase 1.3)
    this.setupAdvancedLighting();

    // Setup post-processing pipeline (Phase 1.4)
    this.setupPostProcessing();

    // Setup enhanced visual effects (Phase 1.5)
    this.setupEnhancedVisualEffects();

    // Setup audio system (Phase 4)
    this.setupAudioSystem();

    // Initialize physics
    await this.initializePhysics();

    // Create field with PBR materials
    this.createField();

    // Setup input handlers
    this.setupInputHandlers();

    // Create visual effects
    this.createVisualEffects();

    // Start render loop
    this.engine.runRenderLoop(() => {
      this.scene.render();
      this.update();
    });

    // Handle window resize
    window.addEventListener("resize", () => {
      this.engine.resize();
    });

    console.log("✅ Game engine initialized successfully");
  }

  private async initializePhysics(): Promise<void> {
    this.havokInstance = await HavokPhysics();
    const havokPlugin = new HavokPlugin(true, this.havokInstance);
    this.scene.enablePhysics(new Vector3(0, -9.81, 0), havokPlugin);
  }

  /**
   * Phase 1.3: Advanced Lighting System
   * - Directional light with cascaded shadows for realistic sun/stadium lights
   * - 4 PointLights positioned at stadium floodlight poles
   * - HDR environment for PBR material reflections
   * - Proper light intensities and color temperatures
   */
  private setupAdvancedLighting(): void {
    console.log("💡 Setting up advanced lighting system...");

    // 1. Main Directional Light (Sun/Stadium Overhead Lights)
    // Position: Evening game lighting from high angle
    this.sunLight = new DirectionalLight(
      "sunLight",
      new Vector3(-1, -2, -1), // Direction vector (pointing down and slightly to the side)
      this.scene
    );

    // Light properties for evening baseball game
    this.sunLight.position = new Vector3(50, 50, 50); // High position for cascaded shadows
    this.sunLight.intensity = 1.2; // Bright stadium lighting
    this.sunLight.diffuse = new Color3(1.0, 0.95, 0.9); // Warm white (5000K color temp)
    this.sunLight.specular = new Color3(1.0, 0.98, 0.95); // Slightly cooler specular

    // 2. Enable Cascaded Shadow Maps for Realistic Shadows
    // Cascaded shadows provide better shadow quality at varying distances
    this.shadowGenerator = new ShadowGenerator(2048, this.sunLight);

    // Shadow configuration
    this.shadowGenerator.useBlurExponentialShadowMap = true; // Soft shadows with blur
    this.shadowGenerator.blurScale = 2.0; // Shadow softness
    this.shadowGenerator.setDarkness(0.4); // Shadow intensity (0 = black, 1 = no shadow)
    this.shadowGenerator.depthScale = 50; // Reduces shadow acne
    this.shadowGenerator.bias = 0.00001; // Fine-tune shadow alignment

    // Enable cascaded shadows for better coverage (if supported in Babylon.js 7.54+)
    // Use type assertion for forward compatibility
    if (typeof (this.shadowGenerator as any).getCascadeCount === 'function') {
      (this.shadowGenerator as any).numCascades = 4; // 4 cascade levels
      (this.shadowGenerator as any).stabilizeCascades = true; // Prevent cascade flickering
    }

    console.log("✅ Directional light with cascaded shadows enabled");

    // 3. Stadium Floodlights (4 poles around the field)
    // Positioned at the corners of the outfield
    const floodlightPositions = [
      new Vector3(-60, 25, -60), // Left field foul pole area
      new Vector3(60, 25, -60),  // Right field foul pole area
      new Vector3(-60, 25, 60),  // Behind home plate (left)
      new Vector3(60, 25, 60)    // Behind home plate (right)
    ];

    floodlightPositions.forEach((position, index) => {
      const floodlight = new PointLight(
        `stadiumLight_${index}`,
        position,
        this.scene
      );

      // Floodlight properties
      floodlight.intensity = 0.8; // Moderate intensity (combined with directional)
      floodlight.diffuse = new Color3(1.0, 0.97, 0.92); // Warm white (4500K metal halide)
      floodlight.specular = new Color3(1.0, 0.99, 0.96); // Slightly cooler specular
      floodlight.range = 100; // Light range in units

      // Realistic falloff for stadium lights
      floodlight.falloffType = PointLight.FALLOFF_PHYSICAL;

      this.stadiumLights.push(floodlight);
    });

    console.log("✅ 4 stadium floodlights positioned");

    // 4. HDR Environment for PBR Reflections
    // For now, use a simple procedural skybox
    // TODO Phase 2: Replace with actual HDR texture (.env file)
    try {
      // Create a simple cube texture for environment reflections
      // This will be replaced with an actual HDR environment in production
      this.hdrEnvironment = CubeTexture.CreateFromPrefilteredData(
        "https://assets.babylonjs.com/environments/environmentSpecular.env",
        this.scene
      );

      this.hdrEnvironment.name = "stadiumEnvironment";
      this.hdrEnvironment.gammaSpace = false; // HDR environment
      this.hdrEnvironment.rotationY = Math.PI / 2; // Rotate to match field orientation

      // Apply HDR environment to scene
      this.scene.environmentTexture = this.hdrEnvironment;
      this.scene.environmentIntensity = 0.6; // Moderate environment lighting

      // Apply HDR environment to all PBR materials
      this.materialLibrary.applyHDREnvironment(this.hdrEnvironment);

      console.log("✅ HDR environment applied to PBR materials");
    } catch (error) {
      console.warn("⚠️ HDR environment loading failed, using fallback:", error);

      // Fallback: Add ambient light for basic illumination
      const ambientLight = new HemisphericLight(
        "ambientFallback",
        new Vector3(0, 1, 0),
        this.scene
      );
      ambientLight.intensity = 0.3;
      ambientLight.diffuse = new Color3(0.8, 0.85, 0.9); // Cool ambient
      ambientLight.groundColor = new Color3(0.3, 0.25, 0.2); // Warm ground bounce
    }

    // 5. Configure Scene-Wide Rendering Settings
    this.scene.ambientColor = new Color3(0.1, 0.1, 0.12); // Slight ambient for dark areas
    this.scene.clearColor = new Color3(0.05, 0.08, 0.15).toColor4(1.0); // Night sky

    console.log("💡 Advanced lighting system initialized successfully");
  }

  /**
   * Phase 1.4: Post-Processing Pipeline
   * - Bloom effect for bright highlights (stadium lights, ball impact)
   * - Depth-of-field for cinematic focus on action
   * - ACES tone mapping for film-like color grading
   * - Chromatic aberration for subtle realism
   * - Enhanced image processing (contrast, exposure, vignette)
   */
  private setupPostProcessing(): void {
    console.log("🎨 Setting up post-processing pipeline...");

    // Create the default rendering pipeline
    // This provides bloom, DOF, image processing, and more
    this.renderPipeline = new DefaultRenderingPipeline(
      "defaultPipeline",
      true, // Enable HDR
      this.scene,
      [this.camera] // Apply to main camera
    );

    // 1. Bloom Effect - Make bright areas glow (stadium lights, ball impact)
    this.renderPipeline.bloomEnabled = true;
    this.renderPipeline.bloomThreshold = 0.8; // Only bloom pixels brighter than 80%
    this.renderPipeline.bloomWeight = 0.3; // Bloom intensity (0-1)
    this.renderPipeline.bloomKernel = 64; // Bloom spread (larger = more spread)
    this.renderPipeline.bloomScale = 0.5; // Bloom resolution scale (performance)

    console.log("✅ Bloom effect enabled");

    // 2. Depth of Field - Cinematic focus effect
    this.renderPipeline.depthOfFieldEnabled = true;
    this.renderPipeline.depthOfFieldBlurLevel = 0; // 0 = low, 1 = medium, 2 = high

    // Focus on the center of action (home plate area)
    if (this.renderPipeline.depthOfField) {
      this.renderPipeline.depthOfField.focusDistance = 2000; // mm from camera
      this.renderPipeline.depthOfField.focalLength = 50; // mm lens focal length
      this.renderPipeline.depthOfField.fStop = 2.8; // Aperture (lower = more blur)
    }

    console.log("✅ Depth-of-field enabled");

    // 3. Chromatic Aberration - Subtle lens distortion for realism
    this.renderPipeline.chromaticAberrationEnabled = true;
    if (this.renderPipeline.chromaticAberration) {
      this.renderPipeline.chromaticAberration.aberrationAmount = 15; // Subtle effect (0-100)
      this.renderPipeline.chromaticAberration.radialIntensity = 0.5; // Focus in center
    }

    console.log("✅ Chromatic aberration enabled");

    // 4. Image Processing - ACES Tone Mapping + Color Grading
    if (this.renderPipeline.imageProcessing) {
      // Enable ACES tone mapping for film-like color grading
      this.renderPipeline.imageProcessing.toneMappingEnabled = true;
      this.renderPipeline.imageProcessing.toneMappingType = ImageProcessingConfiguration.TONEMAPPING_ACES;

      // Exposure adjustment (0 = default, positive = brighter, negative = darker)
      this.renderPipeline.imageProcessing.exposure = 1.0;

      // Contrast boost for punchier visuals
      this.renderPipeline.imageProcessing.contrast = 1.1;

      // Slight color saturation boost
      this.renderPipeline.imageProcessing.colorCurvesEnabled = true;
      if (this.renderPipeline.imageProcessing.colorCurves) {
        this.renderPipeline.imageProcessing.colorCurves.globalSaturation = 10; // Slight boost
      }

      // Vignette effect - darken edges for cinematic look
      this.renderPipeline.imageProcessing.vignetteEnabled = true;
      this.renderPipeline.imageProcessing.vignetteWeight = 1.5;
      this.renderPipeline.imageProcessing.vignetteStretch = 0.5;
      this.renderPipeline.imageProcessing.vignetteCameraFov = 0.8;
      this.renderPipeline.imageProcessing.vignetteColor = new Color3(0, 0, 0).toColor4(1.0);
    }

    console.log("✅ ACES tone mapping and image processing configured");

    // 5. Anti-Aliasing - Smooth edges
    this.renderPipeline.fxaaEnabled = true; // Fast approximate anti-aliasing
    this.renderPipeline.samples = 4; // MSAA samples (2, 4, or 8)

    console.log("✅ Anti-aliasing enabled (FXAA + 4x MSAA)");

    // 6. Sharpen filter for crisp details
    this.renderPipeline.sharpenEnabled = false; // Disabled by default, can enable for ultra-crisp look
    if (this.renderPipeline.sharpenEnabled && this.renderPipeline.sharpen) {
      this.renderPipeline.sharpen.edgeAmount = 0.3;
      this.renderPipeline.sharpen.colorAmount = 0.3;
    }

    // 7. Grain effect for film-like texture (optional)
    this.renderPipeline.grainEnabled = true;
    if (this.renderPipeline.grain) {
      this.renderPipeline.grain.intensity = 5; // Very subtle grain (0-50)
      this.renderPipeline.grain.animated = true; // Animated film grain
    }

    console.log("✅ Film grain effect enabled");

    console.log("🎨 Post-processing pipeline initialized successfully");
  }

  /**
   * Phase 1.5: Enhanced Visual Effects
   * - GPU-accelerated volumetric dust particle system
   * - Grass spray particles for slides
   * - Per-object motion blur for fast-moving ball
   */
  private setupEnhancedVisualEffects(): void {
    console.log("✨ Setting up enhanced visual effects...");

    // 1. Volumetric Dust System - GPU-accelerated for performance
    // Use GPUParticleSystem if WebGPU is available, otherwise fallback to ParticleSystem
    const canUseGPUParticles = this.engine.getCaps().supportComputeShaders || this.isWebGPUEnabled;

    if (canUseGPUParticles) {
      try {
        this.volumetricDustSystem = new GPUParticleSystem(
          "volumetricDust",
          { capacity: 10000 }, // Max particles
          this.scene
        );
        console.log("✅ GPU-accelerated volumetric dust system created");
      } catch (error) {
        console.warn("⚠️ GPUParticleSystem not available, using CPU fallback:", error);
        // Fallback handled in createVisualEffects()
      }
    }

    if (this.volumetricDustSystem) {
      this.volumetricDustSystem.particleTexture = new Texture(
        "https://raw.githubusercontent.com/BabylonJS/Assets/master/textures/cloud.png",
        this.scene
      );
      this.volumetricDustSystem.emitter = Vector3.Zero();

      // Volumetric properties
      this.volumetricDustSystem.minSize = 0.3;
      this.volumetricDustSystem.maxSize = 1.0;
      this.volumetricDustSystem.minLifeTime = 0.5;
      this.volumetricDustSystem.maxLifeTime = 2.0;
      this.volumetricDustSystem.emitRate = 500;

      // 3D volumetric emission
      this.volumetricDustSystem.createSphereEmitter(1.5);

      // Dust color and behavior
      this.volumetricDustSystem.color1 = new Color3(0.6, 0.5, 0.4).toColor4(0.6);
      this.volumetricDustSystem.color2 = new Color3(0.4, 0.3, 0.2).toColor4(0.3);
      this.volumetricDustSystem.colorDead = new Color3(0.2, 0.15, 0.1).toColor4(0);

      // Gravity and movement
      this.volumetricDustSystem.gravity = new Vector3(0, -2, 0);
      this.volumetricDustSystem.direction1 = new Vector3(-1, 2, -1);
      this.volumetricDustSystem.direction2 = new Vector3(1, 3, 1);

      // Blend mode for volumetric look
      this.volumetricDustSystem.blendMode = ParticleSystem.BLENDMODE_STANDARD;

      // Start disabled (trigger on events)
      this.volumetricDustSystem.stop();
    }

    // 2. Grass Spray System for slides
    if (canUseGPUParticles) {
      try {
        this.grassSpraySystem = new GPUParticleSystem(
          "grassSpray",
          { capacity: 5000 },
          this.scene
        );
        console.log("✅ GPU-accelerated grass spray system created");
      } catch (error) {
        console.warn("⚠️ Grass spray GPU system unavailable");
      }
    }

    if (this.grassSpraySystem) {
      this.grassSpraySystem.particleTexture = new Texture(
        "https://raw.githubusercontent.com/BabylonJS/Assets/master/textures/flare.png",
        this.scene
      );
      this.grassSpraySystem.emitter = Vector3.Zero();

      // Small grass particles
      this.grassSpraySystem.minSize = 0.05;
      this.grassSpraySystem.maxSize = 0.15;
      this.grassSpraySystem.minLifeTime = 0.3;
      this.grassSpraySystem.maxLifeTime = 0.8;
      this.grassSpraySystem.emitRate = 1000;

      // Grass green colors
      this.grassSpraySystem.color1 = new Color3(0.2, 0.5, 0.15).toColor4(1.0);
      this.grassSpraySystem.color2 = new Color3(0.15, 0.4, 0.1).toColor4(0.8);
      this.grassSpraySystem.colorDead = new Color3(0.1, 0.2, 0.05).toColor4(0);

      // Arc spray pattern
      this.grassSpraySystem.direction1 = new Vector3(-2, 1, -2);
      this.grassSpraySystem.direction2 = new Vector3(2, 3, 2);
      this.grassSpraySystem.gravity = new Vector3(0, -9.81, 0);

      this.grassSpraySystem.blendMode = ParticleSystem.BLENDMODE_ADD;
      this.grassSpraySystem.stop();
    }

    // 3. Motion Blur for fast-moving ball
    this.motionBlur = new MotionBlurPostProcess(
      "motionBlur",
      this.scene,
      1.0, // Ratio
      this.camera
    );
    this.motionBlur.motionStrength = 0.5; // Subtle motion blur
    this.motionBlur.motionBlurSamples = 32; // Quality vs performance

    console.log("✅ Motion blur post-process enabled");
    console.log("✨ Enhanced visual effects initialized successfully");
  }

  /**
   * Phase 4: Audio System
   * - Background music with adaptive intensity
   * - Bat crack sound effect
   * - Crowd reactions (cheers, groans)
   * - Spatial 3D audio
   */
  private setupAudioSystem(): void {
    console.log("🔊 Setting up audio system...");

    try {
      // 1. Background Music - Arcade-style upbeat track
      // Using royalty-free music from freesound.org or similar
      this.backgroundMusic = new Sound(
        "backgroundMusic",
        "https://assets.mixkit.co/active_storage/sfx/2997/2997-preview.mp3",
        this.scene,
        null,
        {
          loop: true,
          autoplay: false,
          volume: 0.3,
          spatialSound: false // Non-spatial background music
        }
      );
      console.log("✅ Background music loaded");

      // 2. Bat Crack Sound - Satisfying impact
      this.batCrackSound = new Sound(
        "batCrack",
        "https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3",
        this.scene,
        null,
        {
          loop: false,
          autoplay: false,
          volume: 0.8,
          spatialSound: true // 3D spatial audio
        }
      );
      console.log("✅ Bat crack sound loaded");

      // 3. Crowd Cheer - Home run celebration
      this.crowdCheerSound = new Sound(
        "crowdCheer",
        "https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3",
        this.scene,
        null,
        {
          loop: false,
          autoplay: false,
          volume: 0.6,
          spatialSound: false
        }
      );
      console.log("✅ Crowd cheer sound loaded");

      // 4. Crowd "Ohhh" - Close play or strikeout
      this.crowdOhhSound = new Sound(
        "crowdOhh",
        "https://assets.mixkit.co/active_storage/sfx/2020/2020-preview.mp3",
        this.scene,
        null,
        {
          loop: false,
          autoplay: false,
          volume: 0.5,
          spatialSound: false
        }
      );
      console.log("✅ Crowd reaction sound loaded");

      // Start background music
      this.backgroundMusic?.play();

      console.log("🔊 Audio system initialized successfully");
    } catch (error) {
      console.warn("⚠️ Audio system initialization failed (may be blocked by browser):", error);
      console.warn("   User interaction required to enable audio");
    }
  }

  private createField(): void {
    // Use enhanced baseball field rendering with realistic dimensions and PBR materials
    const field = new BaseballField(this.scene, {
      leftFieldDistance: 95,
      centerFieldDistance: 110,
      rightFieldDistance: 95,
      basePath: 27.4, // 90 feet converted to units
      pitcherMoundDistance: 18.4, // 60.5 feet converted to units
      materialLibrary: this.materialLibrary
    });
    field.build();
  }

  private createDefaultPlayer(type: string): Player {
    return {
      id: `player_${type}_${Date.now()}`,
      name: type === "batter" ? "Rookie Slugger" : "Ace Pitcher",
      battingPower: 5,
      battingAccuracy: 5,
      speed: 5,
      pitchSpeed: 5,
      pitchControl: 5,
      fieldingRange: 5,
      fieldingAccuracy: 5,
      position: type === "batter" ? "C" : "P",
      modelPath: `/models/${type}.glb`
    };
  }

  public async loadPlayer(player: Player, position: Vector3, role: "pitcher" | "batter"): Promise<void> {
    // Simplified player representation - replace with actual model loading
    const playerMesh = MeshBuilder.CreateCapsule(`${role}_${player.id}`, {
      radius: 0.5,
      height: 2
    }, this.scene);
    playerMesh.position = position;

    const playerMat = new StandardMaterial(`${role}Mat`, this.scene);
    playerMat.diffuseColor = role === "pitcher" ?
      new Color3(0.2, 0.2, 0.8) : new Color3(0.8, 0.2, 0.2);
    playerMesh.material = playerMat;

    // Enable shadows for players
    if (this.shadowGenerator) {
      this.shadowGenerator.addShadowCaster(playerMesh);
      playerMesh.receiveShadows = true;
    }

    if (role === "pitcher") {
      this.pitcher = playerMesh;
      this.gameState.currentPitcher = player;
      // Initialize pitcher system with player data
      this.pitcherSystem = new PitcherSystem(player);
    } else {
      this.batter = playerMesh;
      this.gameState.currentBatter = player;
      // Initialize batter system with player data
      this.batterSystem = new BatterSystem(player);
    }
  }

  private createBall(): void {
    if (this.ball) {
      this.ball.dispose();
      this.ballPhysics?.dispose();
    }

    this.ball = MeshBuilder.CreateSphere("ball", {
      diameter: 0.2
    }, this.scene);
    const ballMat = new StandardMaterial("ballMat", this.scene);
    ballMat.diffuseColor = new Color3(1, 1, 1);
    this.ball.material = ballMat;

    // Enable shadows for ball
    if (this.shadowGenerator) {
      this.shadowGenerator.addShadowCaster(this.ball);
    }

    this.ballPhysics = new PhysicsAggregate(
      this.ball,
      PhysicsShapeType.SPHERE,
      { mass: 0.145, restitution: 0.5 },
      this.scene
    );
  }

  private setupInputHandlers(): void {
    this.scene.onPointerDown = (evt) => {
      if (evt.button === 0) { // Left click/tap
        this.handleBatSwing();
      }
    };

    // Mobile swipe for fielding
    let touchStartX = 0;
    let touchStartY = 0;

    this.engine.getRenderingCanvas()?.addEventListener("touchstart", (e) => {
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
    });

    this.engine.getRenderingCanvas()?.addEventListener("touchend", (e) => {
      const touchEndX = e.changedTouches[0].clientX;
      const touchEndY = e.changedTouches[0].clientY;
      const deltaX = touchEndX - touchStartX;
      const deltaY = touchEndY - touchStartY;

      if (Math.abs(deltaX) > 50 || Math.abs(deltaY) > 50) {
        this.handleFieldingSwipe(deltaX, deltaY);
      }
    });
  }

  public startPitch(): void {
    if (this.isPitching || !this.pitcher) return;

    this.isPitching = true;
    this.createBall();

    if (!this.ball || !this.ballPhysics) return;

    // Position ball at pitcher
    this.ball.position = this.pitcher.position.clone();
    this.ball.position.y += 1.5;

    // Use advanced pitcher system to select and execute pitch
    const count = { balls: this.gameState.balls, strikes: this.gameState.strikes };

    // Create pitch sequence context for AI decision-making
    const context: PitchSequenceContext = {
      currentCount: count,
      previousPitch: this.currentPitchType,
      batterTendencies: {
        pullHitter: this.gameState.currentBatter.battingPower > 7,
        chaseSlider: this.gameState.currentBatter.battingAccuracy < 6,
        weakVsOffspeed: this.gameState.currentBatter.speed < 6
      }
    };

    // Select pitch type using AI
    if (!this.pitcherSystem) {
      this.pitcherSystem = new PitcherSystem(this.gameState.currentPitcher);
    }
    const selectedPitchType = this.pitcherSystem.selectPitch(context);
    this.currentPitchType = selectedPitchType;

    // Get target location from pitcher system
    const targetVector = this.pitcherSystem.selectTarget(selectedPitchType, count);

    // Get release point from pitcher
    const releasePoint = this.ball.position.clone();

    // Generate pitch parameters using pitcher system
    const pitchParams = this.pitcherSystem.generatePitch(
      selectedPitchType,
      releasePoint,
      targetVector
    );

    // Convert velocity from mph to m/s (1 mph = 0.44704 m/s)
    const velocityMS = pitchParams.velocity * 0.44704;

    // Calculate direction vector from release to target
    const direction = targetVector.subtract(releasePoint).normalize();

    // Create velocity vector
    const velocity = direction.scale(velocityMS);

    // Apply velocity to ball physics body
    this.ballPhysics.body.setLinearVelocity(velocity);

    // Convert spin from RPM to rad/s (RPM * 2π / 60)
    const spinRadPerSec = pitchParams.spin.scale((2 * Math.PI) / 60);
    this.ballPhysics.body.setAngularVelocity(spinRadPerSec);

    // Enable ball trail effect
    if (this.ballTrail) {
      this.ballTrail.start();
    }

    // Check if pitch crosses plate
    setTimeout(() => {
      this.checkPitchResult();
    }, 800);
  }

  private handleBatSwing(): void {
    if (!this.isBatting || !this.ball || !this.batter) return;

    // Calculate timing and contact quality using advanced batter system
    const ballPos = this.ball.position;
    const batterPos = this.batter.position;
    const distance = Vector3.Distance(ballPos, batterPos);

    // Initialize batter system if needed
    if (!this.batterSystem) {
      this.batterSystem = new BatterSystem(this.gameState.currentBatter);
    }

    // Calculate swing timing (0 = perfect timing)
    // TODO: Calculate based on when player pressed button vs ball arrival
    const swingTiming = 0;

    // Use attemptContact method from BatterSystem
    const contactResult = this.batterSystem.attemptContact(
      swingTiming,
      ballPos,
      this.currentPitchType
    );

    if (contactResult.contact) {
      // Contact made! Calculate hit outcome
      const power = this.gameState.currentBatter.battingPower;
      const accuracy = this.gameState.currentBatter.battingAccuracy;

      // Play bat crack sound
      if (this.batCrackSound && this.ball) {
        this.batCrackSound.setPosition(this.ball.position);
        this.batCrackSound.play();
      }

      this.executeHit(contactResult.contactQuality, power, accuracy);
    } else {
      // Swing and miss
      this.registerStrike();

      // Show volumetric dust particle effect (GPU-accelerated if available)
      if (this.volumetricDustSystem && this.batter) {
        this.volumetricDustSystem.emitter = this.batter.position.clone();
        this.volumetricDustSystem.start();
        setTimeout(() => this.volumetricDustSystem?.stop(), 400);
      } else if (this.dustParticles) {
        // Fallback to CPU particles
        this.dustParticles.start();
        setTimeout(() => this.dustParticles?.stop(), 200);
      }
    }

    this.isBatting = false;
  }

  private calculatePitchZone(ballPos: Vector3): number {
    // Map ball position to 9-zone strike zone (0-8)
    // Zone layout:
    // 6 7 8
    // 3 4 5
    // 0 1 2
    const xZone = ballPos.x < -0.2 ? 0 : (ballPos.x > 0.2 ? 2 : 1);
    const yZone = ballPos.y < 1.0 ? 0 : (ballPos.y > 1.4 ? 2 : 1);
    return yZone * 3 + xZone;
  }

  private executeHit(contactQuality: number, power: number, accuracy: number): void {
    if (!this.ball || !this.ballPhysics) return;

    // Track hit for stats
    this.totalHits++;
    this.ballInPlay = true;

    // Create game situation for batter system
    const situation = {
      outs: this.gameState.outs,
      runnersOn: [false, false, false], // TODO: Track actual base runners
      score: { home: this.gameState.homeScore, away: this.gameState.awayScore },
      inning: this.gameState.inning
    };

    // Get current pitch speed (assume average if not available)
    const pitchSpeed = this.gameState.currentPitcher?.pitchSpeed || 85;

    // Generate hit parameters using batter system
    const hitParams = this.batterSystem!.generateHitParameters(
      contactQuality,
      pitchSpeed,
      situation
    );

    // Calculate hit trajectory using static BallPhysics method
    const trajectory = BallPhysics.calculateHitTrajectory(
      hitParams,
      this.ball.position
    );

    // Apply hit velocity with realistic physics
    // Convert exit velocity to m/s and create velocity vector
    const exitVelocityMS = hitParams.exitVelocity * 0.44704; // mph to m/s
    const launchRad = (hitParams.launchAngle * Math.PI) / 180;
    const sprayRad = (hitParams.sprayAngle * Math.PI) / 180;

    const hitVector = new Vector3(
      Math.cos(launchRad) * Math.sin(sprayRad) * exitVelocityMS,
      Math.sin(launchRad) * exitVelocityMS,
      Math.cos(launchRad) * Math.cos(sprayRad) * exitVelocityMS
    );

    this.ballPhysics.body.setLinearVelocity(hitVector);

    // Add backspin for fly balls, topspin for ground balls
    const spinVector = new Vector3(
      hitParams.launchAngle > 20 ? -50 : 50, // Backspin for fly balls
      0,
      0
    );
    this.ballPhysics.body.setAngularVelocity(spinVector);

    // Show impact particle effect
    if (this.impactParticles) {
      this.impactParticles.emitter = this.ball.position.clone();
      this.impactParticles.start();
      setTimeout(() => this.impactParticles?.stop(), 300);
    }

    // Initialize fielding system
    this.fieldingSystem.updateBallTracking(this.ball.position, hitVector);

    // Start tracking ball for fielding
    this.trackBallForFielding();
  }

  private trackBallForFielding(): void {
    const checkInterval = setInterval(() => {
      if (!this.ball) {
        clearInterval(checkInterval);
        return;
      }

      // Ball hit ground
      if (this.ball.position.y < 0.2) {
        clearInterval(checkInterval);

        // Show grass spray particles on landing
        if (this.grassSpraySystem) {
          this.grassSpraySystem.emitter = this.ball.position.clone();
          this.grassSpraySystem.start();
          setTimeout(() => this.grassSpraySystem?.stop(), 600);
        }

        this.determineBallInPlay();
      }

      // Ball out of play
      if (this.ball.position.z > 40 || Math.abs(this.ball.position.x) > 40) {
        clearInterval(checkInterval);
        this.registerHomeRun();
      }
    }, 50);
  }

  private determineBallInPlay(): void {
    if (!this.ball) return;

    const ballPos = this.ball.position;
    const distanceFromHome = Math.sqrt(
      ballPos.x * ballPos.x + ballPos.z * ballPos.z
    );

    // Simple fielding outcome based on distance
    if (distanceFromHome < 15) {
      this.registerOut("ground out");
    } else if (distanceFromHome < 25) {
      this.advanceRunners(1);
    } else if (distanceFromHome < 35) {
      this.advanceRunners(2);
    } else {
      this.advanceRunners(3);
    }
  }

  private handleFieldingSwipe(deltaX: number, deltaY: number): void {
    // TODO: Implement fielding mechanics
    // For now, just log the swipe
    console.log(`Fielding swipe: ${deltaX}, ${deltaY}`);
  }

  private checkPitchResult(): void {
    if (!this.ball) return;

    const ballPos = this.ball.position;

    // Strike zone check (simplified)
    const inStrikeZone =
      Math.abs(ballPos.x) < 0.5 &&
      ballPos.y > 0.5 &&
      ballPos.y < 1.8 &&
      Math.abs(ballPos.z) < 0.3;

    if (inStrikeZone) {
      this.isBatting = true;
      // Wait for player to swing or let it pass
      setTimeout(() => {
        if (this.isBatting) {
          this.registerStrike();
        }
      }, 500);
    } else {
      this.registerBall();
    }

    this.isPitching = false;
  }

  private registerStrike(): void {
    this.gameState.strikes++;
    if (this.gameState.strikes >= 3) {
      this.registerOut("strikeout");
    }
    this.updateGameState();
  }

  private registerBall(): void {
    this.gameState.balls++;
    if (this.gameState.balls >= 4) {
      this.advanceRunners(1); // Walk
    }
    this.updateGameState();
  }

  private registerOut(type: string): void {
    this.gameState.outs++;
    this.resetCount();

    // Play crowd "ohh" sound for strikeouts
    if (type === "strikeout" && this.crowdOhhSound) {
      this.crowdOhhSound.play();
    }

    if (this.gameState.outs >= 3) {
      this.endInning();
    }

    this.updateGameState();
  }

  private advanceRunners(bases: number): void {
    let runsScored = 0;

    // Move runners
    for (let i = 2; i >= 0; i--) {
      if (this.gameState.bases[i]) {
        const newBase = i + bases;
        if (newBase >= 3) {
          runsScored++;
          this.gameState.bases[i] = false;
        } else {
          this.gameState.bases[newBase] = true;
          this.gameState.bases[i] = false;
        }
      }
    }

    // Batter to first (or further)
    if (bases === 1) {
      this.gameState.bases[0] = true;
    } else if (bases === 2) {
      this.gameState.bases[1] = true;
    } else if (bases === 3) {
      this.gameState.bases[2] = true;
    } else if (bases === 4) {
      runsScored++; // Batter scores
    }

    // Update score
    if (this.gameState.isTopOfInning) {
      this.gameState.awayScore += runsScored;
    } else {
      this.gameState.homeScore += runsScored;
    }

    this.resetCount();
    this.updateGameState();
  }

  private registerHomeRun(): void {
    // Track home run for stats
    this.totalHomeRuns++;
    this.advanceRunners(4);

    // Play crowd cheer sound for home run celebration
    if (this.crowdCheerSound) {
      this.crowdCheerSound.play();
    }
  }

  private resetCount(): void {
    this.gameState.balls = 0;
    this.gameState.strikes = 0;
  }

  private endInning(): void {
    this.gameState.outs = 0;
    this.gameState.bases = [false, false, false];

    if (this.gameState.isTopOfInning) {
      this.gameState.isTopOfInning = false;
    } else {
      this.gameState.isTopOfInning = true;
      this.gameState.inning++;
    }

    this.resetCount();
    this.updateGameState();
  }

  private updateGameState(): void {
    this.onStateChange(this.gameState);
  }

  private createVisualEffects(): void {
    // Ball trail effect
    if (this.ball) {
      this.ballTrail = new TrailMesh(
        "ballTrail",
        this.ball,
        this.scene,
        0.1,
        30,
        true
      );
      const trailMaterial = new StandardMaterial("trailMat", this.scene);
      trailMaterial.emissiveColor = new Color3(1, 1, 1);
      trailMaterial.alpha = 0.5;
      this.ballTrail.material = trailMaterial;
    }

    // Dust cloud particles (for swings)
    this.dustParticles = new ParticleSystem("dust", 50, this.scene);
    this.dustParticles.particleTexture = new Texture("https://raw.githubusercontent.com/BabylonJS/Assets/master/textures/flare.png", this.scene);
    this.dustParticles.emitter = Vector3.Zero();
    this.dustParticles.minSize = 0.1;
    this.dustParticles.maxSize = 0.3;
    this.dustParticles.minLifeTime = 0.2;
    this.dustParticles.maxLifeTime = 0.5;
    this.dustParticles.emitRate = 100;
    this.dustParticles.blendMode = ParticleSystem.BLENDMODE_STANDARD;
    this.dustParticles.gravity = new Vector3(0, -9.81, 0);
    this.dustParticles.direction1 = new Vector3(-0.5, 1, -0.5);
    this.dustParticles.direction2 = new Vector3(0.5, 1, 0.5);
    this.dustParticles.color1 = new Color3(0.7, 0.6, 0.5).toColor4(0.8);
    this.dustParticles.color2 = new Color3(0.5, 0.4, 0.3).toColor4(0.6);
    this.dustParticles.colorDead = new Color3(0.3, 0.2, 0.1).toColor4(0);

    // Impact particles (for bat-ball contact)
    this.impactParticles = new ParticleSystem("impact", 30, this.scene);
    this.impactParticles.particleTexture = new Texture("https://raw.githubusercontent.com/BabylonJS/Assets/master/textures/flare.png", this.scene);
    this.impactParticles.emitter = Vector3.Zero();
    this.impactParticles.minSize = 0.05;
    this.impactParticles.maxSize = 0.15;
    this.impactParticles.minLifeTime = 0.1;
    this.impactParticles.maxLifeTime = 0.3;
    this.impactParticles.emitRate = 200;
    this.impactParticles.blendMode = ParticleSystem.BLENDMODE_ADD;
    this.impactParticles.gravity = new Vector3(0, -9.81, 0);
    this.impactParticles.direction1 = new Vector3(-1, 1, -1);
    this.impactParticles.direction2 = new Vector3(1, 1, 1);
    this.impactParticles.color1 = new Color3(1, 0.9, 0.2).toColor4(1);
    this.impactParticles.color2 = new Color3(1, 0.7, 0).toColor4(1);
    this.impactParticles.colorDead = new Color3(0.5, 0.3, 0).toColor4(0);
  }

  private update(): void {
    // Update ball physics with Magnus force if ball is in flight
    if (this.ball && this.ballPhysics && this.isPitching) {
      const currentVelocity = this.ballPhysics.body.getLinearVelocity();
      if (currentVelocity) {
        const magnusForce = BallPhysics.calculateMagnusForce(
          new Vector3(currentVelocity.x, currentVelocity.y, currentVelocity.z),
          new Vector3(0, 2500, 0) // Example spin rate
        );

        // Apply Magnus force as impulse
        this.ballPhysics.body.applyImpulse(
          new Vector3(magnusForce.x * 0.01, magnusForce.y * 0.01, magnusForce.z * 0.01),
          this.ball.getAbsolutePosition()
        );
      }
    }

    // Update fielding AI if ball is in play
    if (this.ballInPlay && this.ball) {
      const velocity = this.ballPhysics?.body.getLinearVelocity() || Vector3.Zero();
      this.fieldingSystem.updateBallTracking(this.ball.position, velocity);

      // TODO: Animate fielder movement
      // TODO: Execute catch/miss logic
    }

    // Update base running (check for steal attempts, advances, etc.)
    if (this.gameState.bases.some(occupied => occupied)) {
      // TODO: Implement base running logic with baseRunningSystem
    }
  }

  public getGameState(): GameState {
    return { ...this.gameState };
  }

  // Stat tracking getters for progression API
  public getTotalHits(): number {
    return this.totalHits;
  }

  public getTotalHomeRuns(): number {
    return this.totalHomeRuns;
  }

  public getTotalRuns(): number {
    return this.gameState.homeScore + this.gameState.awayScore;
  }

  // Submit game result to progression API
  public async endGame(playerId: string, progressionAPI: any): Promise<void> {
    try {
      // Determine if player won (assuming player is home team)
      const won = this.gameState.homeScore > this.gameState.awayScore;

      // Submit game result with stats
      const updatedProgress = await progressionAPI.recordGameResult(playerId, {
        won,
        runsScored: this.getTotalRuns(),
        hitsRecorded: this.getTotalHits(),
        homeRunsHit: this.getTotalHomeRuns()
      });

      console.log("Game result submitted successfully:", updatedProgress);
      return updatedProgress;
    } catch (error) {
      console.error("Failed to submit game result:", error);
      throw error;
    }
  }

  public dispose(): void {
    this.scene.dispose();
    this.engine.dispose();
  }
}
