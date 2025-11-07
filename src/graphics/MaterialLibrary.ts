import {
  Scene,
  PBRMaterial,
  Color3,
  Texture,
  CubeTexture
} from "@babylonjs/core";

/**
 * Material Library for Sandlot Sluggers
 *
 * Provides PBR (Physically Based Rendering) materials for:
 * - Natural grass (outfield, infield edges)
 * - Dirt/clay (infield, mound, base paths)
 * - Metal (foul poles, bases)
 * - Wood (bat - future use)
 *
 * Uses PBR workflow: Albedo, Normal, Roughness, Metallic, AO
 */
export class MaterialLibrary {
  private scene: Scene;
  private materials: Map<string, PBRMaterial> = new Map();

  constructor(scene: Scene) {
    this.scene = scene;
  }

  /**
   * Initialize all baseball field materials
   * Creates materials but doesn't load textures until needed
   */
  public initializeFieldMaterials(): void {
    this.createGrassMaterial();
    this.createDirtMaterial();
    this.createMetalMaterial();
    this.createBasesMaterial();
    this.createFoulLineMaterial();
  }

  /**
   * Natural grass material for outfield and infield edges
   * Uses PBR for realistic light interaction
   */
  private createGrassMaterial(): void {
    const grass = new PBRMaterial("grassPBR", this.scene);

    // Base color: Natural grass green
    grass.albedoColor = new Color3(0.2, 0.45, 0.15);

    // Roughness: Grass is fairly rough, not shiny
    grass.roughness = 0.95;

    // Metallic: Grass is non-metallic
    grass.metallic = 0.0;

    // Subsurface scattering for realistic grass translucency
    grass.subSurface.isTranslucencyEnabled = true;
    grass.subSurface.translucencyIntensity = 0.3;
    grass.subSurface.tintColor = new Color3(0.2, 0.5, 0.2);

    // Environmental reflections (when HDR environment is added in Phase 1.3)
    grass.environmentIntensity = 0.3;

    // TODO Phase 2: Add actual grass texture maps
    // grass.albedoTexture = new Texture("assets/textures/grass_albedo.jpg", this.scene);
    // grass.bumpTexture = new Texture("assets/textures/grass_normal.jpg", this.scene);
    // grass.metallicTexture = new Texture("assets/textures/grass_roughness.jpg", this.scene);
    // grass.ambientTexture = new Texture("assets/textures/grass_ao.jpg", this.scene);

    this.materials.set("grass", grass);
    console.log("✅ PBR Material: Grass created");
  }

  /**
   * Dirt/clay material for infield, pitcher's mound, base paths
   */
  private createDirtMaterial(): void {
    const dirt = new PBRMaterial("dirtPBR", this.scene);

    // Base color: Baseball infield clay/dirt mix
    dirt.albedoColor = new Color3(0.55, 0.4, 0.25);

    // Roughness: Dirt is very rough, no shine
    dirt.roughness = 1.0;

    // Metallic: Dirt is non-metallic
    dirt.metallic = 0.0;

    // Slightly higher ambient occlusion for depth
    dirt.environmentIntensity = 0.2;

    // TODO Phase 2: Add actual dirt texture maps
    // dirt.albedoTexture = new Texture("assets/textures/dirt_albedo.jpg", this.scene);
    // dirt.bumpTexture = new Texture("assets/textures/dirt_normal.jpg", this.scene);
    // dirt.metallicTexture = new Texture("assets/textures/dirt_roughness.jpg", this.scene);
    // dirt.ambientTexture = new Texture("assets/textures/dirt_ao.jpg", this.scene);

    this.materials.set("dirt", dirt);
    console.log("✅ PBR Material: Dirt created");
  }

  /**
   * Metal material for foul poles and backstop
   */
  private createMetalMaterial(): void {
    const metal = new PBRMaterial("metalPBR", this.scene);

    // Base color: Weathered yellow foul pole paint
    metal.albedoColor = new Color3(0.9, 0.85, 0.3);

    // Roughness: Painted metal, somewhat weathered
    metal.roughness = 0.6;

    // Metallic: High metallic value for foul poles
    metal.metallic = 0.8;

    // Strong environmental reflections
    metal.environmentIntensity = 1.0;

    // Clearcoat for painted metal finish
    metal.clearCoat.isEnabled = true;
    metal.clearCoat.intensity = 0.3;
    metal.clearCoat.roughness = 0.4;

    this.materials.set("metal", metal);
    console.log("✅ PBR Material: Metal created");
  }

  /**
   * Material for bases (white canvas over rubber)
   */
  private createBasesMaterial(): void {
    const bases = new PBRMaterial("basesPBR", this.scene);

    // Base color: Slightly off-white canvas
    bases.albedoColor = new Color3(0.95, 0.95, 0.92);

    // Roughness: Canvas is fairly rough
    bases.roughness = 0.9;

    // Metallic: Canvas is non-metallic
    bases.metallic = 0.0;

    // Low environmental intensity for matte finish
    bases.environmentIntensity = 0.1;

    this.materials.set("bases", bases);
    console.log("✅ PBR Material: Bases created");
  }

  /**
   * Material for foul lines and batter's box (white chalk)
   */
  private createFoulLineMaterial(): void {
    const chalk = new PBRMaterial("chalkPBR", this.scene);

    // Base color: Bright white chalk
    chalk.albedoColor = new Color3(1.0, 1.0, 1.0);

    // Emissive: Slight glow for visibility
    chalk.emissiveColor = new Color3(0.1, 0.1, 0.1);

    // Roughness: Chalk is very rough
    chalk.roughness = 1.0;

    // Metallic: Chalk is non-metallic
    chalk.metallic = 0.0;

    // No environmental reflections
    chalk.environmentIntensity = 0.0;

    this.materials.set("chalk", chalk);
    console.log("✅ PBR Material: Chalk created");
  }

  /**
   * Wood material for baseball bat (future character models)
   */
  public createWoodMaterial(): PBRMaterial {
    const wood = new PBRMaterial("woodPBR", this.scene);

    // Base color: Maple bat wood
    wood.albedoColor = new Color3(0.6, 0.45, 0.3);

    // Roughness: Polished bat surface
    wood.roughness = 0.3;

    // Metallic: Wood is non-metallic
    wood.metallic = 0.0;

    // Clearcoat for lacquered finish
    wood.clearCoat.isEnabled = true;
    wood.clearCoat.intensity = 0.5;
    wood.clearCoat.roughness = 0.2;

    // Subsurface scattering for wood depth
    wood.subSurface.isRefractionEnabled = false;
    wood.subSurface.isTranslucencyEnabled = true;
    wood.subSurface.translucencyIntensity = 0.2;

    // TODO Phase 2: Add wood grain texture
    // wood.albedoTexture = new Texture("assets/textures/wood_albedo.jpg", this.scene);
    // wood.bumpTexture = new Texture("assets/textures/wood_normal.jpg", this.scene);

    this.materials.set("wood", wood);
    console.log("✅ PBR Material: Wood created");

    return wood;
  }

  /**
   * Get a material by name
   */
  public getMaterial(name: string): PBRMaterial | undefined {
    return this.materials.get(name);
  }

  /**
   * Apply HDR environment to all materials
   * Called in Phase 1.3 when HDR lighting is added
   */
  public applyHDREnvironment(envTexture: CubeTexture): void {
    for (const [name, material] of this.materials) {
      // PBRMaterial uses reflectionTexture for environment maps
      material.reflectionTexture = envTexture;
      console.log(`✅ Applied HDR environment to ${name}`);
    }
  }

  /**
   * Dispose all materials
   */
  public dispose(): void {
    for (const material of this.materials.values()) {
      material.dispose();
    }
    this.materials.clear();
  }
}
