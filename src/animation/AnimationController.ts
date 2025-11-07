import {
  Scene,
  AbstractMesh,
  Animation,
  AnimationGroup,
  Vector3,
  Quaternion,
  EasingFunction,
  CubicEase
} from "@babylonjs/core";

export type AnimationType =
  | "pitchWindup"
  | "pitchRelease"
  | "battingStance"
  | "battingSwing"
  | "battingContact"
  | "fieldingReady"
  | "fieldingDive"
  | "fieldingCatch"
  | "throwWindup"
  | "throwRelease"
  | "runningStart"
  | "runningStride"
  | "sliding"
  | "celebration";

export interface AnimationConfig {
  duration: number; // frames at 60 FPS
  loop?: boolean;
  onComplete?: () => void;
}

export class AnimationController {
  private scene: Scene;
  private activeAnimations: Map<string, AnimationGroup> = new Map();

  constructor(scene: Scene) {
    this.scene = scene;
  }

  /**
   * Create and play pitcher wind-up animation
   */
  public playPitchWindup(mesh: AbstractMesh, onComplete?: () => void): void {
    const animGroup = new AnimationGroup("pitchWindup", this.scene);

    // Wind-up sequence: leg lift → torque → stride
    const keyframes = [
      { frame: 0, value: mesh.position.clone() },
      { frame: 15, value: mesh.position.add(new Vector3(0, 0.3, 0)) }, // Leg lift
      { frame: 30, value: mesh.position.add(new Vector3(0, 0.1, 0.5)) }, // Stride
      { frame: 40, value: mesh.position } // Return to ready
    ];

    const positionAnim = this.createPositionAnimation("pitchWindupPos", keyframes);
    animGroup.addTargetedAnimation(positionAnim, mesh);

    // Rotation for torque
    const rotationKeyframes = [
      { frame: 0, value: mesh.rotation.clone() },
      { frame: 15, value: mesh.rotation.add(new Vector3(0, Math.PI / 6, 0)) },
      { frame: 30, value: mesh.rotation.add(new Vector3(0, -Math.PI / 3, 0)) },
      { frame: 40, value: mesh.rotation }
    ];

    const rotationAnim = this.createRotationAnimation("pitchWindupRot", rotationKeyframes);
    animGroup.addTargetedAnimation(rotationAnim, mesh);

    animGroup.onAnimationGroupEndObservable.add(() => {
      if (onComplete) onComplete();
      this.activeAnimations.delete(mesh.name);
    });

    animGroup.play(false);
    this.activeAnimations.set(mesh.name, animGroup);
  }

  /**
   * Create and play pitch release animation
   */
  public playPitchRelease(mesh: AbstractMesh, onComplete?: () => void): void {
    const animGroup = new AnimationGroup("pitchRelease", this.scene);

    // Arm extension and follow-through
    const keyframes = [
      { frame: 0, value: mesh.position.clone() },
      { frame: 10, value: mesh.position.add(new Vector3(0, 0.2, -0.5)) }, // Extend
      { frame: 20, value: mesh.position.add(new Vector3(0, -0.1, -0.8)) }, // Follow through
      { frame: 30, value: mesh.position } // Return
    ];

    const positionAnim = this.createPositionAnimation("pitchReleasePos", keyframes);
    animGroup.addTargetedAnimation(positionAnim, mesh);

    // Rotation for arm motion
    const rotationKeyframes = [
      { frame: 0, value: mesh.rotation.clone() },
      { frame: 10, value: mesh.rotation.add(new Vector3(Math.PI / 4, 0, 0)) },
      { frame: 20, value: mesh.rotation.add(new Vector3(Math.PI / 2, 0, 0)) },
      { frame: 30, value: mesh.rotation }
    ];

    const rotationAnim = this.createRotationAnimation("pitchReleaseRot", rotationKeyframes);
    animGroup.addTargetedAnimation(rotationAnim, mesh);

    animGroup.onAnimationGroupEndObservable.add(() => {
      if (onComplete) onComplete();
      this.activeAnimations.delete(mesh.name);
    });

    animGroup.play(false);
    this.activeAnimations.set(mesh.name, animGroup);
  }

  /**
   * Create and play batting swing animation
   */
  public playBattingSwing(mesh: AbstractMesh, power: number, onComplete?: () => void): void {
    const animGroup = new AnimationGroup("battingSwing", this.scene);

    const swingSpeed = 20 + (power * 2); // Faster swing with more power
    const swingForce = 0.8 + (power * 0.2); // More rotation with power

    // Bat swing sequence: load → swing → follow through
    const keyframes = [
      { frame: 0, value: mesh.rotation.clone() },
      { frame: 5, value: mesh.rotation.add(new Vector3(0, -Math.PI / 6, 0)) }, // Load
      { frame: swingSpeed * 0.5, value: mesh.rotation.add(new Vector3(0, Math.PI * swingForce, 0)) }, // Swing
      { frame: swingSpeed, value: mesh.rotation.add(new Vector3(0, Math.PI * 0.3, 0)) }, // Follow through
      { frame: swingSpeed + 10, value: mesh.rotation } // Return
    ];

    const rotationAnim = this.createRotationAnimation("battingSwingRot", keyframes);
    animGroup.addTargetedAnimation(rotationAnim, mesh);

    // Body movement
    const posKeyframes = [
      { frame: 0, value: mesh.position.clone() },
      { frame: swingSpeed * 0.5, value: mesh.position.add(new Vector3(0, 0.1, -0.2)) },
      { frame: swingSpeed, value: mesh.position },
      { frame: swingSpeed + 10, value: mesh.position }
    ];

    const positionAnim = this.createPositionAnimation("battingSwingPos", posKeyframes);
    animGroup.addTargetedAnimation(positionAnim, mesh);

    animGroup.onAnimationGroupEndObservable.add(() => {
      if (onComplete) onComplete();
      this.activeAnimations.delete(mesh.name);
    });

    animGroup.play(false);
    this.activeAnimations.set(mesh.name, animGroup);
  }

  /**
   * Create and play fielding dive animation
   */
  public playFieldingDive(mesh: AbstractMesh, direction: Vector3, onComplete?: () => void): void {
    const animGroup = new AnimationGroup("fieldingDive", this.scene);

    const diveDistance = 3;
    const targetPos = mesh.position.add(direction.scale(diveDistance));

    // Dive trajectory
    const keyframes = [
      { frame: 0, value: mesh.position.clone() },
      { frame: 10, value: mesh.position.add(new Vector3(direction.x * 0.5, 0.5, direction.z * 0.5)) },
      { frame: 20, value: targetPos.add(new Vector3(0, 0.2, 0)) },
      { frame: 30, value: targetPos } // Hit ground
    ];

    const positionAnim = this.createPositionAnimation("fieldingDivePos", keyframes);
    animGroup.addTargetedAnimation(positionAnim, mesh);

    // Rotation during dive
    const diveAngle = Math.atan2(direction.z, direction.x);
    const rotationKeyframes = [
      { frame: 0, value: mesh.rotation.clone() },
      { frame: 10, value: new Vector3(Math.PI / 6, diveAngle, 0) },
      { frame: 20, value: new Vector3(Math.PI / 3, diveAngle, 0) },
      { frame: 30, value: new Vector3(Math.PI / 2, diveAngle, 0) } // Horizontal
    ];

    const rotationAnim = this.createRotationAnimation("fieldingDiveRot", rotationKeyframes);
    animGroup.addTargetedAnimation(rotationAnim, mesh);

    animGroup.onAnimationGroupEndObservable.add(() => {
      if (onComplete) onComplete();
      this.activeAnimations.delete(mesh.name);
    });

    animGroup.play(false);
    this.activeAnimations.set(mesh.name, animGroup);
  }

  /**
   * Create and play throwing animation
   */
  public playThrow(mesh: AbstractMesh, onComplete?: () => void): void {
    const animGroup = new AnimationGroup("throw", this.scene);

    // Throwing motion: wind up → release → follow through
    const keyframes = [
      { frame: 0, value: mesh.rotation.clone() },
      { frame: 8, value: mesh.rotation.add(new Vector3(0, -Math.PI / 4, 0)) }, // Wind up
      { frame: 15, value: mesh.rotation.add(new Vector3(Math.PI / 3, Math.PI / 2, 0)) }, // Release
      { frame: 25, value: mesh.rotation.add(new Vector3(Math.PI / 6, 0, 0)) }, // Follow through
      { frame: 35, value: mesh.rotation } // Return
    ];

    const rotationAnim = this.createRotationAnimation("throwRot", keyframes);
    animGroup.addTargetedAnimation(rotationAnim, mesh);

    animGroup.onAnimationGroupEndObservable.add(() => {
      if (onComplete) onComplete();
      this.activeAnimations.delete(mesh.name);
    });

    animGroup.play(false);
    this.activeAnimations.set(mesh.name, animGroup);
  }

  /**
   * Create and play running animation (looping)
   */
  public playRunning(mesh: AbstractMesh, speed: number): void {
    if (this.activeAnimations.has(`${mesh.name}_running`)) return;

    const animGroup = new AnimationGroup("running", this.scene);

    const strideLength = 0.2 + (speed * 0.05);
    const strideSpeed = 30 - (speed * 2); // Faster with more speed

    // Running stride (bob up and down)
    const keyframes = [
      { frame: 0, value: mesh.position.clone() },
      { frame: strideSpeed * 0.25, value: mesh.position.add(new Vector3(0, strideLength, 0)) },
      { frame: strideSpeed * 0.5, value: mesh.position },
      { frame: strideSpeed * 0.75, value: mesh.position.add(new Vector3(0, strideLength, 0)) },
      { frame: strideSpeed, value: mesh.position }
    ];

    const positionAnim = this.createPositionAnimation("runningPos", keyframes);
    animGroup.addTargetedAnimation(positionAnim, mesh);

    // Slight rotation for running motion
    const rotationKeyframes = [
      { frame: 0, value: mesh.rotation.clone() },
      { frame: strideSpeed * 0.5, value: mesh.rotation.add(new Vector3(0, 0, Math.PI / 32)) },
      { frame: strideSpeed, value: mesh.rotation }
    ];

    const rotationAnim = this.createRotationAnimation("runningRot", rotationKeyframes);
    animGroup.addTargetedAnimation(rotationAnim, mesh);

    animGroup.loopAnimation = true;
    animGroup.play(true);
    this.activeAnimations.set(`${mesh.name}_running`, animGroup);
  }

  /**
   * Stop running animation
   */
  public stopRunning(mesh: AbstractMesh): void {
    const key = `${mesh.name}_running`;
    const anim = this.activeAnimations.get(key);
    if (anim) {
      anim.stop();
      this.activeAnimations.delete(key);
    }
  }

  /**
   * Create and play sliding animation
   */
  public playSliding(mesh: AbstractMesh, direction: Vector3, onComplete?: () => void): void {
    const animGroup = new AnimationGroup("sliding", this.scene);

    const slideDistance = 2;
    const targetPos = mesh.position.add(direction.scale(slideDistance));

    // Slide trajectory
    const keyframes = [
      { frame: 0, value: mesh.position.clone() },
      { frame: 10, value: mesh.position.add(direction.scale(slideDistance * 0.7)) },
      { frame: 20, value: targetPos }
    ];

    const positionAnim = this.createPositionAnimation("slidingPos", keyframes);
    animGroup.addTargetedAnimation(positionAnim, mesh);

    // Rotation for slide
    const slideAngle = Math.atan2(direction.z, direction.x);
    const rotationKeyframes = [
      { frame: 0, value: mesh.rotation.clone() },
      { frame: 10, value: new Vector3(Math.PI / 6, slideAngle, 0) },
      { frame: 20, value: new Vector3(Math.PI / 4, slideAngle, 0) } // Lean back
    ];

    const rotationAnim = this.createRotationAnimation("slidingRot", rotationKeyframes);
    animGroup.addTargetedAnimation(rotationAnim, mesh);

    animGroup.onAnimationGroupEndObservable.add(() => {
      if (onComplete) onComplete();
      this.activeAnimations.delete(mesh.name);
    });

    animGroup.play(false);
    this.activeAnimations.set(mesh.name, animGroup);
  }

  /**
   * Create and play celebration animation
   */
  public playCelebration(mesh: AbstractMesh): void {
    const animGroup = new AnimationGroup("celebration", this.scene);

    // Jump and fist pump
    const keyframes = [
      { frame: 0, value: mesh.position.clone() },
      { frame: 15, value: mesh.position.add(new Vector3(0, 1.5, 0)) }, // Jump
      { frame: 30, value: mesh.position },
      { frame: 45, value: mesh.position.add(new Vector3(0, 1.2, 0)) }, // Second jump
      { frame: 60, value: mesh.position }
    ];

    const positionAnim = this.createPositionAnimation("celebrationPos", keyframes);
    animGroup.addTargetedAnimation(positionAnim, mesh);

    // Arms up
    const rotationKeyframes = [
      { frame: 0, value: mesh.rotation.clone() },
      { frame: 15, value: mesh.rotation.add(new Vector3(0, 0, Math.PI / 8)) },
      { frame: 30, value: mesh.rotation.add(new Vector3(0, 0, -Math.PI / 8)) },
      { frame: 45, value: mesh.rotation.add(new Vector3(0, 0, Math.PI / 8)) },
      { frame: 60, value: mesh.rotation }
    ];

    const rotationAnim = this.createRotationAnimation("celebrationRot", rotationKeyframes);
    animGroup.addTargetedAnimation(rotationAnim, mesh);

    animGroup.play(false);
    this.activeAnimations.set(`${mesh.name}_celebration`, animGroup);
  }

  /**
   * Helper: Create position animation
   */
  private createPositionAnimation(
    name: string,
    keyframes: Array<{ frame: number; value: Vector3 }>
  ): Animation {
    const anim = new Animation(
      name,
      "position",
      60,
      Animation.ANIMATIONTYPE_VECTOR3,
      Animation.ANIMATIONLOOPMODE_CONSTANT
    );

    anim.setKeys(keyframes);

    // Add easing for smooth motion
    const ease = new CubicEase();
    ease.setEasingMode(EasingFunction.EASINGMODE_EASEINOUT);
    anim.setEasingFunction(ease);

    return anim;
  }

  /**
   * Helper: Create rotation animation
   */
  private createRotationAnimation(
    name: string,
    keyframes: Array<{ frame: number; value: Vector3 }>
  ): Animation {
    const anim = new Animation(
      name,
      "rotation",
      60,
      Animation.ANIMATIONTYPE_VECTOR3,
      Animation.ANIMATIONLOOPMODE_CONSTANT
    );

    anim.setKeys(keyframes);

    // Add easing for smooth motion
    const ease = new CubicEase();
    ease.setEasingMode(EasingFunction.EASINGMODE_EASEINOUT);
    anim.setEasingFunction(ease);

    return anim;
  }

  /**
   * Stop all animations for a mesh
   */
  public stopAllAnimations(mesh: AbstractMesh): void {
    const keysToDelete: string[] = [];

    this.activeAnimations.forEach((anim, key) => {
      if (key.startsWith(mesh.name)) {
        anim.stop();
        keysToDelete.push(key);
      }
    });

    keysToDelete.forEach(key => this.activeAnimations.delete(key));
  }

  /**
   * Check if mesh has active animation
   */
  public isAnimating(mesh: AbstractMesh): boolean {
    for (const key of this.activeAnimations.keys()) {
      if (key.startsWith(mesh.name)) {
        return true;
      }
    }
    return false;
  }

  /**
   * Dispose all animations
   */
  public dispose(): void {
    this.activeAnimations.forEach(anim => anim.dispose());
    this.activeAnimations.clear();
  }
}
