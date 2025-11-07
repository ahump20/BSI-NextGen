import {
  Scene,
  Mesh,
  MeshBuilder,
  StandardMaterial,
  Color3,
  Vector3,
  PhysicsAggregate,
  PhysicsShapeType,
  DynamicTexture,
  Texture,
  Color4
} from "@babylonjs/core";
import { MaterialLibrary } from "../graphics/MaterialLibrary";

export interface FieldDimensions {
  leftFieldDistance: number;
  centerFieldDistance: number;
  rightFieldDistance: number;
  infieldRadius: number;
  basePath: number;
  pitcherMoundDistance: number;
  materialLibrary?: MaterialLibrary; // Optional for PBR materials
}

export class BaseballField {
  private scene: Scene;
  private dimensions: FieldDimensions;
  private materialLibrary?: MaterialLibrary;

  constructor(scene: Scene, dimensions?: Partial<FieldDimensions>) {
    this.scene = scene;
    this.materialLibrary = dimensions?.materialLibrary;
    this.dimensions = {
      leftFieldDistance: dimensions?.leftFieldDistance || 95,
      centerFieldDistance: dimensions?.centerFieldDistance || 110,
      rightFieldDistance: dimensions?.rightFieldDistance || 95,
      infieldRadius: dimensions?.infieldRadius || 29,
      basePath: dimensions?.basePath || 27.4, // 90 feet in meters (1 unit = 3.28 feet)
      pitcherMoundDistance: dimensions?.pitcherMoundDistance || 18.4 // 60.5 feet
    };
  }

  public build(): void {
    this.createGrass();
    this.createInfield();
    this.createWarningTrack();
    this.createBasePaths();
    this.createBases();
    this.createPitcherMound();
    this.createHomePlate();
    this.createFoulLines();
    this.createOutfieldFence();
    this.createDugouts();
    this.createDistanceMarkers();
  }

  private createGrass(): void {
    // Main outfield grass
    const grass = MeshBuilder.CreateGround("grass", {
      width: 150,
      height: 150,
      subdivisions: 32
    }, this.scene);

    // Enable shadow receiving for realistic field shadows
    grass.receiveShadows = true;

    // Use PBR grass material if available, otherwise fallback to Standard
    const grassMaterial = this.materialLibrary?.getMaterial("grass");

    if (grassMaterial) {
      grass.material = grassMaterial;
      console.log("✅ Applied PBR grass material to field");
    } else {
      // Fallback to StandardMaterial (original implementation)
      const grassMat = new StandardMaterial("grassMat", this.scene);

      // Create grass texture with stripe pattern
      const grassTexture = new DynamicTexture("grassTexture", 512, this.scene);
      const ctx = grassTexture.getContext();

      // Base grass color
      ctx.fillStyle = "#2d5016";
      ctx.fillRect(0, 0, 512, 512);

      // Mowing stripes
      ctx.fillStyle = "#3d6026";
      for (let i = 0; i < 512; i += 64) {
        ctx.fillRect(i, 0, 32, 512);
      }

      grassTexture.update();

      grassMat.diffuseTexture = grassTexture;
      grassMat.specularColor = new Color3(0.1, 0.1, 0.1);
      grass.material = grassMat;
    }

    new PhysicsAggregate(grass, PhysicsShapeType.BOX, {
      mass: 0,
      restitution: 0.3
    }, this.scene);
  }

  private createInfield(): void {
    // Dirt infield (circle)
    const infield = MeshBuilder.CreateDisc("infield", {
      radius: this.dimensions.infieldRadius,
      tessellation: 64
    }, this.scene);
    infield.rotation.x = Math.PI / 2;
    infield.position.y = 0.11;

    // Enable shadow receiving for infield
    infield.receiveShadows = true;

    // Use PBR dirt material if available
    const dirtMaterial = this.materialLibrary?.getMaterial("dirt");

    if (dirtMaterial) {
      infield.material = dirtMaterial;
      console.log("✅ Applied PBR dirt material to infield");
    } else {
      // Fallback to StandardMaterial
      const infieldMat = new StandardMaterial("infieldMat", this.scene);

      // Create realistic dirt texture
      const dirtTexture = new DynamicTexture("dirtTexture", 512, this.scene);
      const ctx = dirtTexture.getContext();

      // Base dirt color
      ctx.fillStyle = "#8B6F47";
      ctx.fillRect(0, 0, 512, 512);

      // Add variation/texture
      for (let i = 0; i < 5000; i++) {
        const x = Math.random() * 512;
        const y = Math.random() * 512;
        const size = Math.random() * 3;
        const shade = Math.floor(Math.random() * 40) - 20;
        const r = Math.min(255, Math.max(0, 139 + shade));
        const g = Math.min(255, Math.max(0, 111 + shade));
        const b = Math.min(255, Math.max(0, 71 + shade));

        ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
        ctx.fillRect(x, y, size, size);
      }

      dirtTexture.update();

      infieldMat.diffuseTexture = dirtTexture;
      infieldMat.specularColor = new Color3(0.2, 0.15, 0.1);
      infield.material = infieldMat;
    }
  }

  private createWarningTrack(): void {
    // Warning track around outfield fence
    const trackPoints = [];
    const innerRadius = this.dimensions.centerFieldDistance - 3;
    const outerRadius = this.dimensions.centerFieldDistance;

    for (let angle = 0; angle <= Math.PI; angle += 0.1) {
      const x = Math.cos(angle);
      const z = Math.sin(angle);

      trackPoints.push(new Vector3(x * innerRadius, 0.1, z * innerRadius));
      trackPoints.push(new Vector3(x * outerRadius, 0.1, z * outerRadius));
    }

    // Create warning track mesh
    const track = MeshBuilder.CreateRibbon("warningTrack", {
      pathArray: [trackPoints],
      closeArray: false,
      closePath: true
    }, this.scene);

    const trackMat = new StandardMaterial("trackMat", this.scene);
    trackMat.diffuseColor = new Color3(0.6, 0.4, 0.2);
    track.material = trackMat;
  }

  private createBasePaths(): void {
    // Create dirt paths between bases
    const basePathWidth = 1.5;
    const baseDistance = this.dimensions.basePath;

    // Home to first
    this.createBasePath(
      new Vector3(0, 0.1, 0),
      new Vector3(baseDistance / Math.sqrt(2), 0.1, baseDistance / Math.sqrt(2)),
      basePathWidth
    );

    // First to second
    this.createBasePath(
      new Vector3(baseDistance / Math.sqrt(2), 0.1, baseDistance / Math.sqrt(2)),
      new Vector3(0, 0.1, baseDistance * Math.sqrt(2)),
      basePathWidth
    );

    // Second to third
    this.createBasePath(
      new Vector3(0, 0.1, baseDistance * Math.sqrt(2)),
      new Vector3(-baseDistance / Math.sqrt(2), 0.1, baseDistance / Math.sqrt(2)),
      basePathWidth
    );

    // Third to home
    this.createBasePath(
      new Vector3(-baseDistance / Math.sqrt(2), 0.1, baseDistance / Math.sqrt(2)),
      new Vector3(0, 0.1, 0),
      basePathWidth
    );
  }

  private createBasePath(start: Vector3, end: Vector3, width: number): void {
    const direction = end.subtract(start);
    const length = direction.length();
    const midpoint = start.add(direction.scale(0.5));

    const path = MeshBuilder.CreateBox(`basePath_${Date.now()}`, {
      width,
      height: 0.02,
      depth: length
    }, this.scene);

    path.position = midpoint;

    // Rotate to align with direction
    const angle = Math.atan2(direction.x, direction.z);
    path.rotation.y = angle;

    const pathMat = new StandardMaterial(`basePathMat_${Date.now()}`, this.scene);
    pathMat.diffuseColor = new Color3(0.7, 0.5, 0.3);
    path.material = pathMat;
  }

  private createBases(): void {
    const baseDistance = this.dimensions.basePath / Math.sqrt(2);

    const basePositions = [
      { name: "first", pos: new Vector3(baseDistance, 0.15, baseDistance) },
      { name: "second", pos: new Vector3(0, 0.15, baseDistance * Math.sqrt(2)) },
      { name: "third", pos: new Vector3(-baseDistance, 0.15, baseDistance) }
    ];

    basePositions.forEach(({ name, pos }) => {
      // Base bag
      const base = MeshBuilder.CreateBox(name, {
        width: 0.45,
        height: 0.1,
        depth: 0.45
      }, this.scene);
      base.position = pos;

      // Use PBR bases material if available
      const basesMaterial = this.materialLibrary?.getMaterial("bases");

      if (basesMaterial) {
        base.material = basesMaterial;
      } else {
        // Fallback to StandardMaterial
        const baseMat = new StandardMaterial(`${name}Mat`, this.scene);
        baseMat.diffuseColor = new Color3(1, 1, 1);
        baseMat.emissiveColor = new Color3(0.2, 0.2, 0.2);
        base.material = baseMat;
      }

      // Add subtle anchor peg
      const peg = MeshBuilder.CreateCylinder(`${name}Peg`, {
        diameter: 0.05,
        height: 0.3
      }, this.scene);
      peg.position = pos.clone();
      peg.position.y -= 0.15;

      const pegMat = new StandardMaterial(`${name}PegMat`, this.scene);
      pegMat.diffuseColor = new Color3(0.3, 0.3, 0.3);
      peg.material = pegMat;
    });
  }

  private createPitcherMound(): void {
    // Main mound
    const mound = MeshBuilder.CreateCylinder("pitcherMound", {
      height: 0.25,
      diameterTop: 5.5,
      diameterBottom: 6,
      tessellation: 32
    }, this.scene);
    mound.position = new Vector3(0, 0.125, this.dimensions.pitcherMoundDistance);

    const moundMat = new StandardMaterial("moundMat", this.scene);
    moundMat.diffuseColor = new Color3(0.65, 0.45, 0.25);
    mound.material = moundMat;

    // Pitcher's rubber
    const rubber = MeshBuilder.CreateBox("pitcherRubber", {
      width: 0.6,
      height: 0.05,
      depth: 0.15
    }, this.scene);
    rubber.position = new Vector3(0, 0.28, this.dimensions.pitcherMoundDistance);

    const rubberMat = new StandardMaterial("rubberMat", this.scene);
    rubberMat.diffuseColor = new Color3(0.9, 0.9, 0.9);
    rubber.material = rubberMat;
  }

  private createHomePlate(): void {
    // Pentagon-shaped home plate
    const plateShape = [
      new Vector3(0, 0, 0),
      new Vector3(0.22, 0, -0.22),
      new Vector3(0.22, 0, -0.44),
      new Vector3(0, 0, -0.53),
      new Vector3(-0.22, 0, -0.44),
      new Vector3(-0.22, 0, -0.22)
    ];

    const plate = MeshBuilder.CreatePolygon("homePlate", {
      shape: plateShape,
      depth: 0.03
    }, this.scene);
    plate.rotation.x = Math.PI / 2;
    plate.position.y = 0.12;

    const plateMat = new StandardMaterial("plateMat", this.scene);
    plateMat.diffuseColor = new Color3(0.95, 0.95, 0.95);
    plateMat.emissiveColor = new Color3(0.1, 0.1, 0.1);
    plate.material = plateMat;
  }

  private createFoulLines(): void {
    const lineLength = this.dimensions.centerFieldDistance;
    const lineWidth = 0.1;

    // First base foul line
    const firstBaseLine = MeshBuilder.CreateBox("firstBaseLine", {
      width: lineWidth,
      height: 0.05,
      depth: lineLength
    }, this.scene);
    firstBaseLine.position = new Vector3(
      lineLength / 2 * Math.cos(Math.PI / 4),
      0.13,
      lineLength / 2 * Math.sin(Math.PI / 4)
    );
    firstBaseLine.rotation.y = -Math.PI / 4;

    // Third base foul line
    const thirdBaseLine = MeshBuilder.CreateBox("thirdBaseLine", {
      width: lineWidth,
      height: 0.05,
      depth: lineLength
    }, this.scene);
    thirdBaseLine.position = new Vector3(
      -lineLength / 2 * Math.cos(Math.PI / 4),
      0.13,
      lineLength / 2 * Math.sin(Math.PI / 4)
    );
    thirdBaseLine.rotation.y = Math.PI / 4;

    const lineMat = new StandardMaterial("foulLineMat", this.scene);
    lineMat.diffuseColor = new Color3(1, 1, 1);
    lineMat.emissiveColor = new Color3(0.3, 0.3, 0.3);
    firstBaseLine.material = lineMat;
    thirdBaseLine.material = lineMat.clone("thirdLineClone");
  }

  private createOutfieldFence(): void {
    const fenceHeight = 3;
    const fencePoints = [];

    // Generate fence curve
    for (let angle = 0; angle <= Math.PI; angle += 0.05) {
      const distance = this.calculateFenceDistance(angle);
      const x = Math.cos(angle) * distance;
      const z = Math.sin(angle) * distance;
      fencePoints.push(new Vector3(x, fenceHeight / 2, z));
    }

    // Create fence mesh
    const fence = MeshBuilder.CreateTube("outfieldFence", {
      path: fencePoints,
      radius: 0.15,
      sideOrientation: Mesh.DOUBLESIDE,
      cap: Mesh.CAP_ALL
    }, this.scene);

    const fenceMat = new StandardMaterial("fenceMat", this.scene);
    fenceMat.diffuseColor = new Color3(0.2, 0.4, 0.2);
    fence.material = fenceMat;

    // Add fence posts
    for (let i = 0; i < fencePoints.length; i += 4) {
      const post = MeshBuilder.CreateCylinder(`fencePost${i}`, {
        diameter: 0.2,
        height: fenceHeight
      }, this.scene);
      post.position = fencePoints[i].clone();
      post.position.y = fenceHeight / 2;

      const postMat = new StandardMaterial(`postMat${i}`, this.scene);
      postMat.diffuseColor = new Color3(0.3, 0.25, 0.1);
      post.material = postMat;
    }

    // Foul poles
    this.createFoulPole(
      new Vector3(
        Math.cos(Math.PI / 4) * this.dimensions.leftFieldDistance,
        0,
        Math.sin(Math.PI / 4) * this.dimensions.leftFieldDistance
      )
    );

    this.createFoulPole(
      new Vector3(
        -Math.cos(Math.PI / 4) * this.dimensions.rightFieldDistance,
        0,
        Math.sin(Math.PI / 4) * this.dimensions.rightFieldDistance
      )
    );
  }

  private calculateFenceDistance(angle: number): number {
    // Asymmetric fence distances (mimics real ballparks)
    const leftField = this.dimensions.leftFieldDistance;
    const centerField = this.dimensions.centerFieldDistance;
    const rightField = this.dimensions.rightFieldDistance;

    const normalizedAngle = angle / Math.PI;

    if (normalizedAngle < 0.25) {
      // Left field to left-center
      return leftField + (centerField - leftField) * (normalizedAngle / 0.25);
    } else if (normalizedAngle < 0.5) {
      // Left-center to dead center
      return centerField;
    } else if (normalizedAngle < 0.75) {
      // Dead center to right-center
      return centerField;
    } else {
      // Right-center to right field
      return centerField - (centerField - rightField) * ((normalizedAngle - 0.75) / 0.25);
    }
  }

  private createFoulPole(position: Vector3): void {
    const pole = MeshBuilder.CreateCylinder("foulPole", {
      diameter: 0.15,
      height: 10
    }, this.scene);
    pole.position = position;
    pole.position.y = 5;

    // Use PBR metal material if available
    const metalMaterial = this.materialLibrary?.getMaterial("metal");

    if (metalMaterial) {
      pole.material = metalMaterial;
      console.log("✅ Applied PBR metal material to foul pole");
    } else {
      // Fallback to StandardMaterial
      const poleMat = new StandardMaterial("poleMat", this.scene);
      poleMat.diffuseColor = new Color3(1, 0.8, 0);
      poleMat.emissiveColor = new Color3(0.3, 0.2, 0);
      pole.material = poleMat;
    }
  }

  private createDugouts(): void {
    // Home team dugout (first base side)
    this.createDugout(
      new Vector3(10, -0.5, 5),
      5,
      2,
      "homeDugout"
    );

    // Away team dugout (third base side)
    this.createDugout(
      new Vector3(-10, -0.5, 5),
      5,
      2,
      "awayDugout"
    );
  }

  private createDugout(position: Vector3, width: number, depth: number, name: string): void {
    // Dugout floor
    const floor = MeshBuilder.CreateBox(`${name}Floor`, {
      width,
      height: 0.2,
      depth
    }, this.scene);
    floor.position = position;

    const floorMat = new StandardMaterial(`${name}FloorMat`, this.scene);
    floorMat.diffuseColor = new Color3(0.4, 0.3, 0.2);
    floor.material = floorMat;

    // Dugout bench
    const bench = MeshBuilder.CreateBox(`${name}Bench`, {
      width: width - 0.5,
      height: 0.4,
      depth: 0.5
    }, this.scene);
    bench.position = position.clone();
    bench.position.y += 0.3;
    bench.position.z -= 0.6;

    const benchMat = new StandardMaterial(`${name}BenchMat`, this.scene);
    benchMat.diffuseColor = new Color3(0.3, 0.2, 0.1);
    bench.material = benchMat;
  }

  private createDistanceMarkers(): void {
    const markers = [
      { distance: this.dimensions.leftFieldDistance, angle: Math.PI * 0.25, label: `${Math.round(this.dimensions.leftFieldDistance * 3.28)}'` },
      { distance: this.dimensions.centerFieldDistance, angle: Math.PI * 0.5, label: `${Math.round(this.dimensions.centerFieldDistance * 3.28)}'` },
      { distance: this.dimensions.rightFieldDistance, angle: Math.PI * 0.75, label: `${Math.round(this.dimensions.rightFieldDistance * 3.28)}'` }
    ];

    markers.forEach(({ distance, angle, label }) => {
      const x = Math.cos(angle) * distance;
      const z = Math.sin(angle) * distance;

      // Marker sign
      const sign = MeshBuilder.CreatePlane(`marker_${label}`, {
        width: 2,
        height: 1
      }, this.scene);
      sign.position = new Vector3(x, 2, z);
      sign.rotation.y = -angle;

      // Create text texture
      const textTexture = new DynamicTexture(`markerText_${label}`, 256, this.scene);
      const ctx = textTexture.getContext() as CanvasRenderingContext2D;
      ctx.fillStyle = "#ffeb3b";
      ctx.fillRect(0, 0, 256, 256);
      ctx.fillStyle = "#000";
      ctx.font = "bold 80px Arial";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(label, 128, 128);
      textTexture.update();

      const signMat = new StandardMaterial(`markerMat_${label}`, this.scene);
      signMat.diffuseTexture = textTexture;
      signMat.emissiveColor = new Color3(0.3, 0.3, 0);
      sign.material = signMat;
    });
  }
}
