import { Scene, Sound } from "@babylonjs/core";

export type SoundEffect =
  | "batCrack"
  | "catchMitt"
  | "ballHitGround"
  | "crowdCheer"
  | "crowdAw"
  | "umpireStrike"
  | "umpireBall"
  | "umpireOut"
  | "walkupMusic"
  | "organCharge";

export class SoundManager {
  private scene: Scene;
  private sounds: Map<SoundEffect, Sound> = new Map();
  private musicVolume: number = 0.5;
  private sfxVolume: number = 0.7;

  constructor(scene: Scene) {
    this.scene = scene;
    this.loadSounds();
  }

  private loadSounds(): void {
    // Bat crack sound (high priority)
    this.sounds.set(
      "batCrack",
      new Sound(
        "batCrack",
        "/sounds/bat_crack.wav",
        this.scene,
        null,
        { volume: this.sfxVolume }
      )
    );

    // Catch in mitt
    this.sounds.set(
      "catchMitt",
      new Sound(
        "catchMitt",
        "/sounds/catch_mitt.wav",
        this.scene,
        null,
        { volume: this.sfxVolume * 0.8 }
      )
    );

    // Ball hitting ground
    this.sounds.set(
      "ballHitGround",
      new Sound(
        "ballHitGround",
        "/sounds/ball_ground.wav",
        this.scene,
        null,
        { volume: this.sfxVolume * 0.6 }
      )
    );

    // Crowd reactions
    this.sounds.set(
      "crowdCheer",
      new Sound(
        "crowdCheer",
        "/sounds/crowd_cheer.wav",
        this.scene,
        null,
        { volume: this.musicVolume, loop: false }
      )
    );

    this.sounds.set(
      "crowdAw",
      new Sound(
        "crowdAw",
        "/sounds/crowd_aw.wav",
        this.scene,
        null,
        { volume: this.musicVolume * 0.8, loop: false }
      )
    );

    // Umpire calls
    this.sounds.set(
      "umpireStrike",
      new Sound(
        "umpireStrike",
        "/sounds/umpire_strike.wav",
        this.scene,
        null,
        { volume: this.sfxVolume }
      )
    );

    this.sounds.set(
      "umpireBall",
      new Sound(
        "umpireBall",
        "/sounds/umpire_ball.wav",
        this.scene,
        null,
        { volume: this.sfxVolume * 0.9 }
      )
    );

    this.sounds.set(
      "umpireOut",
      new Sound(
        "umpireOut",
        "/sounds/umpire_out.wav",
        this.scene,
        null,
        { volume: this.sfxVolume }
      )
    );

    // Stadium music
    this.sounds.set(
      "walkupMusic",
      new Sound(
        "walkupMusic",
        "/sounds/walkup_theme.mp3",
        this.scene,
        null,
        { volume: this.musicVolume * 0.6, loop: false }
      )
    );

    this.sounds.set(
      "organCharge",
      new Sound(
        "organCharge",
        "/sounds/organ_charge.mp3",
        this.scene,
        null,
        { volume: this.musicVolume * 0.7, loop: false }
      )
    );
  }

  public play(effect: SoundEffect): void {
    const sound = this.sounds.get(effect);
    if (sound && sound.isReady()) {
      sound.play();
    }
  }

  public stop(effect: SoundEffect): void {
    const sound = this.sounds.get(effect);
    if (sound) {
      sound.stop();
    }
  }

  public setMusicVolume(volume: number): void {
    this.musicVolume = Math.max(0, Math.min(1, volume));
    this.sounds.get("walkupMusic")?.setVolume(this.musicVolume * 0.6);
    this.sounds.get("organCharge")?.setVolume(this.musicVolume * 0.7);
    this.sounds.get("crowdCheer")?.setVolume(this.musicVolume);
    this.sounds.get("crowdAw")?.setVolume(this.musicVolume * 0.8);
  }

  public setSfxVolume(volume: number): void {
    this.sfxVolume = Math.max(0, Math.min(1, volume));
    this.sounds.forEach((sound, key) => {
      if (!["walkupMusic", "organCharge", "crowdCheer", "crowdAw"].includes(key)) {
        sound.setVolume(this.sfxVolume);
      }
    });
  }

  public dispose(): void {
    this.sounds.forEach(sound => sound.dispose());
    this.sounds.clear();
  }
}
