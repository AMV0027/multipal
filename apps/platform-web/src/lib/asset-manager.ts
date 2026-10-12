/**
 * MultiPal Asset Loader & Animation Engine
 * Preloads all character spritesheets, poses, and tilesets
 * Provides animated frame rendering for Zombie Survival, Platform Fighter, and Split-Screen Racing
 */

export interface CharacterAnimFrame {
  img: HTMLImageElement;
  loaded: boolean;
}

class AssetManager {
  private cache = new Map<string, HTMLImageElement>();
  private audioCache = new Map<string, HTMLAudioElement>();
  private listeners: Array<() => void> = [];
  public isReady = false;

  public preloadAll(): void {
    const imagesToLoad: Record<string, string> = {
      // 1. ZOMBIE SURVIVAL SPRITES
      'survivor_blue_gun': '/assets/games/zombie-survival/sprites/survivor_blue_gun.png',
      'survivor_blue_stand': '/assets/games/zombie-survival/sprites/survivor_blue_stand.png',
      'survivor_blue_machine': '/assets/games/zombie-survival/sprites/survivor_blue_machine.png',
      'survivor_red_gun': '/assets/games/zombie-survival/sprites/survivor_red_gun.png',
      'survivor_red_stand': '/assets/games/zombie-survival/sprites/survivor_red_stand.png',
      'survivor_green_gun': '/assets/games/zombie-survival/sprites/survivor_green_gun.png',
      'survivor_green_stand': '/assets/games/zombie-survival/sprites/survivor_green_stand.png',
      'survivor_yellow_gun': '/assets/games/zombie-survival/sprites/survivor_yellow_gun.png',
      'survivor_yellow_stand': '/assets/games/zombie-survival/sprites/survivor_yellow_stand.png',
      
      'zombie_walker': '/assets/games/zombie-survival/sprites/zombie_walker.png',
      'zombie_runner': '/assets/games/zombie-survival/sprites/zombie_runner.png',
      'zombie_brute': '/assets/games/zombie-survival/sprites/zombie_brute.png',
      'zombie_spitter': '/assets/games/zombie-survival/sprites/zombie_spitter.png',
      'zombie_boss': '/assets/games/zombie-survival/sprites/zombie_boss.png',
      'zombie_tilesheet': '/assets/games/zombie-survival/tilesets/abandoned_street_tilesheet.png',

      // 2. PLATFORM FIGHTER SPRITES & ANIMATION POSES
      // Swift (Adventurer)
      'swift_idle': '/assets/games/platform-fighter/sprites/swift/adventurer_idle.png',
      'swift_walk1': '/assets/games/platform-fighter/sprites/swift/adventurer_walk1.png',
      'swift_walk2': '/assets/games/platform-fighter/sprites/swift/adventurer_walk2.png',
      'swift_jump': '/assets/games/platform-fighter/sprites/swift/adventurer_jump.png',
      'swift_action1': '/assets/games/platform-fighter/sprites/swift/adventurer_action1.png',
      'swift_action2': '/assets/games/platform-fighter/sprites/swift/adventurer_action2.png',
      'swift_kick': '/assets/games/platform-fighter/sprites/swift/adventurer_kick.png',
      'swift_hurt': '/assets/games/platform-fighter/sprites/swift/adventurer_hurt.png',

      // Heavy (Soldier)
      'heavy_idle': '/assets/games/platform-fighter/sprites/heavy/soldier_idle.png',
      'heavy_walk1': '/assets/games/platform-fighter/sprites/heavy/soldier_walk1.png',
      'heavy_walk2': '/assets/games/platform-fighter/sprites/heavy/soldier_walk2.png',
      'heavy_jump': '/assets/games/platform-fighter/sprites/heavy/soldier_jump.png',
      'heavy_action1': '/assets/games/platform-fighter/sprites/heavy/soldier_action1.png',
      'heavy_action2': '/assets/games/platform-fighter/sprites/heavy/soldier_action2.png',
      'heavy_kick': '/assets/games/platform-fighter/sprites/heavy/soldier_kick.png',
      'heavy_hurt': '/assets/games/platform-fighter/sprites/heavy/soldier_hurt.png',

      // Balanced (Player)
      'balanced_idle': '/assets/games/platform-fighter/sprites/balanced/player_idle.png',
      'balanced_walk1': '/assets/games/platform-fighter/sprites/balanced/player_walk1.png',
      'balanced_walk2': '/assets/games/platform-fighter/sprites/balanced/player_walk2.png',
      'balanced_jump': '/assets/games/platform-fighter/sprites/balanced/player_jump.png',
      'balanced_action1': '/assets/games/platform-fighter/sprites/balanced/player_action1.png',
      'balanced_action2': '/assets/games/platform-fighter/sprites/balanced/player_action2.png',
      'balanced_kick': '/assets/games/platform-fighter/sprites/balanced/player_kick.png',
      'balanced_hurt': '/assets/games/platform-fighter/sprites/balanced/player_hurt.png',

      // Ranger (Zombie/Female)
      'ranger_idle': '/assets/games/platform-fighter/sprites/ranger/zombie_idle.png',
      'ranger_walk1': '/assets/games/platform-fighter/sprites/ranger/zombie_walk1.png',
      'ranger_walk2': '/assets/games/platform-fighter/sprites/ranger/zombie_walk2.png',
      'ranger_jump': '/assets/games/platform-fighter/sprites/ranger/zombie_jump.png',
      'ranger_action1': '/assets/games/platform-fighter/sprites/ranger/zombie_action1.png',
      'ranger_action2': '/assets/games/platform-fighter/sprites/ranger/zombie_action2.png',
      'ranger_kick': '/assets/games/platform-fighter/sprites/ranger/zombie_kick.png',
      'ranger_hurt': '/assets/games/platform-fighter/sprites/ranger/zombie_hurt.png',

      // Arenas
      'fighter_sky_bg': '/assets/games/platform-fighter/arenas/sky_parallax_background.png',
      'fighter_tiles': '/assets/games/platform-fighter/arenas/training_platforms_tilemap.png',

      // 3. SPLIT-SCREEN RACING CARS & TRACKS
      'car_blue': '/assets/games/racing/vehicles/car_blue.png',
      'car_red': '/assets/games/racing/vehicles/car_red.png',
      'car_green': '/assets/games/racing/vehicles/car_green.png',
      'car_yellow': '/assets/games/racing/vehicles/car_yellow.png',
      'racing_track_tiles': '/assets/games/racing/tracks/sunset_circuit_tilesheet.png',
      'barrel_red': '/assets/games/racing/tracks/barrel_red.png',
      'barrier_red': '/assets/games/racing/tracks/barrier_red_race.png',
    };

    let remaining = Object.keys(imagesToLoad).length;

    for (const [key, path] of Object.entries(imagesToLoad)) {
      const img = new Image();
      img.src = path;
      img.onload = () => {
        this.cache.set(key, img);
        remaining--;
        if (remaining <= 0) {
          this.isReady = true;
          this.notify();
        }
      };
      img.onerror = () => {
        remaining--;
        if (remaining <= 0) {
          this.isReady = true;
          this.notify();
        }
      };
    }

    // Audio SFX Preload
    const sfxList: Record<string, string> = {
      'gunshot': '/assets/games/zombie-survival/audio/gunshot.ogg',
      'zombie_groan': '/assets/games/zombie-survival/audio/zombie_groan.ogg',
      'slash_light': '/assets/games/platform-fighter/audio/slash_light.ogg',
      'impact_heavy': '/assets/games/platform-fighter/audio/impact_heavy.ogg',
      'jump': '/assets/games/platform-fighter/audio/jump.ogg',
      'tire_screech': '/assets/games/racing/audio/tire_screech.ogg',
      'checkpoint': '/assets/games/racing/audio/checkpoint_chime.ogg',
    };

    for (const [key, path] of Object.entries(sfxList)) {
      try {
        const audio = new Audio(path);
        this.audioCache.set(key, audio);
      } catch {}
    }
  }

  public getImage(key: string): HTMLImageElement | undefined {
    return this.cache.get(key);
  }

  public playSound(key: string, volume: number = 0.5): void {
    const audio = this.audioCache.get(key);
    if (audio) {
      try {
        const clone = audio.cloneNode() as HTMLAudioElement;
        clone.volume = volume;
        clone.play().catch(() => {});
      } catch {}
    }
  }

  public onReady(cb: () => void): () => void {
    this.listeners.push(cb);
    if (this.isReady) cb();
    return () => {
      this.listeners = this.listeners.filter((l) => l !== cb);
    };
  }

  private notify(): void {
    this.listeners.forEach((cb) => cb());
  }
}

export const assetManager = new AssetManager();
