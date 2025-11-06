import {
  Engine,
  Scene,
  ArcRotateCamera,
  HemisphericLight,
  Vector3,
  MeshBuilder,
  StandardMaterial,
  Color3,
  PhysicsAggregate,
  PhysicsShapeType,
  HavokPlugin,
  Mesh,
  AbstractMesh
} from "@babylonjs/core";
import HavokPhysics from "@babylonjs/havok";

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
  private camera: ArcRotateCamera;
  private gameState: GameState;
  private havokInstance: any;
  private ball: Mesh | null = null;
  private ballPhysics: PhysicsAggregate | null = null;
  private pitcher: AbstractMesh | null = null;
  private batter: AbstractMesh | null = null;
  private _fielders: Map<string, AbstractMesh> = new Map(); // TODO: Implement fielding
  private isPitching: boolean = false;
  private isBatting: boolean = false;
  private onStateChange: (state: GameState) => void;

  constructor(config: GameConfig) {
    this.engine = new Engine(config.canvas, true, {
      adaptToDeviceRatio: true,
      powerPreference: "high-performance"
    });
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

    this.camera = new ArcRotateCamera(
      "camera",
      -Math.PI / 2,
      Math.PI / 3,
      40,
      new Vector3(0, 0, 0),
      this.scene
    );
    this.camera.attachControl(config.canvas, true);
    this.camera.lowerRadiusLimit = 20;
    this.camera.upperRadiusLimit = 60;
    this.camera.lowerBetaLimit = 0.1;
    this.camera.upperBetaLimit = Math.PI / 2;

    new HemisphericLight("light", new Vector3(0, 1, 0), this.scene);

    this.initializePhysics();
    this.createField();
    this.setupInputHandlers();

    this.engine.runRenderLoop(() => {
      this.scene.render();
      this.update();
    });

    window.addEventListener("resize", () => {
      this.engine.resize();
    });
  }

  private async initializePhysics(): Promise<void> {
    this.havokInstance = await HavokPhysics();
    const havokPlugin = new HavokPlugin(true, this.havokInstance);
    this.scene.enablePhysics(new Vector3(0, -9.81, 0), havokPlugin);
  }

  private createField(): void {
    // Ground
    const ground = MeshBuilder.CreateGround("ground", {
      width: 100,
      height: 100
    }, this.scene);
    const groundMat = new StandardMaterial("groundMat", this.scene);
    groundMat.diffuseColor = new Color3(0.2, 0.6, 0.2);
    ground.material = groundMat;
    new PhysicsAggregate(ground, PhysicsShapeType.BOX, {
      mass: 0,
      restitution: 0.3
    }, this.scene);

    // Diamond
    this.createDiamond();

    // Outfield fence
    this.createFence();
  }

  private createDiamond(): void {
    const basePaths = [
      { name: "home", pos: new Vector3(0, 0.1, 0) },
      { name: "first", pos: new Vector3(13, 0.1, 13) },
      { name: "second", pos: new Vector3(0, 0.1, 18.4) },
      { name: "third", pos: new Vector3(-13, 0.1, 13) }
    ];

    basePaths.forEach(base => {
      const baseMesh = MeshBuilder.CreateBox(base.name, {
        width: 0.5,
        height: 0.1,
        depth: 0.5
      }, this.scene);
      baseMesh.position = base.pos;
      const baseMat = new StandardMaterial(`${base.name}Mat`, this.scene);
      baseMat.diffuseColor = new Color3(1, 1, 1);
      baseMesh.material = baseMat;
    });

    // Pitcher's mound
    const mound = MeshBuilder.CreateCylinder("mound", {
      height: 0.3,
      diameter: 3
    }, this.scene);
    mound.position = new Vector3(0, 0.15, 9);
    const moundMat = new StandardMaterial("moundMat", this.scene);
    moundMat.diffuseColor = new Color3(0.7, 0.5, 0.3);
    mound.material = moundMat;
  }

  private createFence(): void {
    const fencePoints = [];
    const radius = 35;
    for (let i = 0; i <= 180; i += 10) {
      const angle = (i * Math.PI) / 180;
      fencePoints.push(new Vector3(
        radius * Math.sin(angle),
        2,
        radius * Math.cos(angle)
      ));
    }

    const fence = MeshBuilder.CreateTube("fence", {
      path: fencePoints,
      radius: 0.2,
      sideOrientation: Mesh.DOUBLESIDE
    }, this.scene);
    const fenceMat = new StandardMaterial("fenceMat", this.scene);
    fenceMat.diffuseColor = new Color3(0.4, 0.3, 0.1);
    fence.material = fenceMat;
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

    if (role === "pitcher") {
      this.pitcher = playerMesh;
    } else {
      this.batter = playerMesh;
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

    // Animate pitch
    const pitchSpeed = this.gameState.currentPitcher.pitchSpeed;
    const pitchControl = this.gameState.currentPitcher.pitchControl;

    // Add randomness based on control
    const controlVariance = (10 - pitchControl) * 0.1;
    const targetX = (Math.random() - 0.5) * controlVariance;
    // const targetY = 1.2 + (Math.random() - 0.5) * controlVariance; // TODO: Use for vertical pitch movement
    const targetZ = 0;

    const velocity = new Vector3(
      targetX * pitchSpeed,
      -2,
      (targetZ - this.ball.position.z) * (pitchSpeed / 5)
    );

    this.ballPhysics.body.setLinearVelocity(velocity);

    // Check if pitch crosses plate
    setTimeout(() => {
      this.checkPitchResult();
    }, 800);
  }

  private handleBatSwing(): void {
    if (!this.isBatting || !this.ball || !this.batter) return;

    // Calculate timing and contact quality
    const ballPos = this.ball.position;
    const batterPos = this.batter.position;
    const distance = Vector3.Distance(ballPos, batterPos);

    // Perfect contact zone
    // const perfectZone = 1.5; // TODO: Use for bonus contact quality
    const contactZone = 3;

    if (distance < contactZone) {
      const contactQuality = 1 - (distance / contactZone);
      const power = this.gameState.currentBatter.battingPower;
      const accuracy = this.gameState.currentBatter.battingAccuracy;

      // Hit!
      this.executeHit(contactQuality, power, accuracy);
    } else {
      // Swing and miss
      this.registerStrike();
    }
  }

  private executeHit(contactQuality: number, power: number, accuracy: number): void {
    if (!this.ball || !this.ballPhysics) return;

    // Calculate hit vector
    const baseForce = 20 + (power * 3) + (contactQuality * 10);
    const launchAngle = 20 + (contactQuality * 30); // 20-50 degrees
    const direction = (Math.random() - 0.5) * (11 - accuracy) * 10; // Spray angle

    const hitVector = new Vector3(
      Math.sin(direction * Math.PI / 180) * baseForce,
      Math.sin(launchAngle * Math.PI / 180) * baseForce,
      Math.cos(direction * Math.PI / 180) * baseForce
    );

    this.ballPhysics.body.setLinearVelocity(hitVector);
    this.isBatting = false;

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

  private registerOut(_type: string): void { // TODO: Log out type for stats
    this.gameState.outs++;
    this.resetCount();

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
    this.advanceRunners(4);
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

  private update(): void {
    // Game loop updates
  }

  public getGameState(): GameState {
    return { ...this.gameState };
  }

  public dispose(): void {
    this.scene.dispose();
    this.engine.dispose();
  }
}
