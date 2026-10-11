import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const EXTRACT_DIR = path.resolve(ROOT_DIR, '.asset_cache/extracted');
const CACHE_DIR = path.resolve(ROOT_DIR, '.asset_cache');
const ASSETS_ROOT = path.resolve(ROOT_DIR, 'assets');
const PUBLIC_ASSETS_ROOT = path.resolve(ROOT_DIR, 'apps/platform-web/public/assets');

function copyFileSafe(src, dest) {
  if (!fs.existsSync(src)) {
    console.warn(`[Warn] Source file missing: ${src}`);
    return false;
  }
  const dir = path.dirname(dest);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.copyFileSync(src, dest);
  return true;
}

function copyToBoth(src, relDest) {
  const dest1 = path.resolve(ASSETS_ROOT, relDest);
  const dest2 = path.resolve(PUBLIC_ASSETS_ROOT, relDest);
  copyFileSafe(src, dest1);
  copyFileSafe(src, dest2);
}

console.log('--- Starting MultiPal Asset Organization ---');

// 1. Common Assets
console.log('Organizing Common Assets...');

// Fonts
copyToBoth(path.resolve(CACHE_DIR, 'PressStart2P-Regular.ttf'), 'common/fonts/PressStart2P-Regular.ttf');
copyToBoth(path.resolve(CACHE_DIR, 'Silkscreen-Regular.ttf'), 'common/fonts/Silkscreen-Regular.ttf');

// Common UI
copyToBoth(
  path.resolve(EXTRACT_DIR, 'ui-pack-pixel-adventure/Tilesheets/Large tiles/Thick outline/tilemap_packed.png'),
  'common/ui/ui_tilesheet.png'
);
copyToBoth(
  path.resolve(EXTRACT_DIR, 'ui-pack-pixel-adventure/Preview.png'),
  'common/ui/ui_preview.png'
);

// Common Audio
const commonAudioMap = {
  'click.ogg': 'interface-sounds/Audio/click_001.ogg',
  'select.ogg': 'interface-sounds/Audio/select_001.ogg',
  'confirm.ogg': 'interface-sounds/Audio/confirmation_001.ogg',
  'back.ogg': 'interface-sounds/Audio/back_001.ogg',
  'countdown_3.ogg': 'voiceover-pack-fighter/Audio/3.ogg',
  'countdown_2.ogg': 'voiceover-pack-fighter/Audio/2.ogg',
  'countdown_1.ogg': 'voiceover-pack-fighter/Audio/1.ogg',
  'countdown_go.ogg': 'voiceover-pack-fighter/Audio/fight.ogg',
  'victory_jingle.ogg': 'music-jingles/Audio/8-Bit jingles/jingles_NES00.ogg',
  'game_over_jingle.ogg': 'music-jingles/Audio/8-Bit jingles/jingles_NES08.ogg',
  'winner_voice.ogg': 'voiceover-pack-fighter/Audio/winner.ogg',
  'game_over_voice.ogg': 'voiceover-pack-fighter/Audio/game_over.ogg',
};

for (const [target, sourceRel] of Object.entries(commonAudioMap)) {
  copyToBoth(path.resolve(EXTRACT_DIR, sourceRel), `common/audio/${target}`);
}

// 2. Game 1: Zombie Survival
console.log('Organizing Game 1: Zombie Survival Assets...');

// Survivors (Slots 1-4)
const survivorMap = {
  'survivor_blue_gun.png': 'top-down-shooter/PNG/Man Blue/manBlue_gun.png',
  'survivor_blue_stand.png': 'top-down-shooter/PNG/Man Blue/manBlue_stand.png',
  'survivor_blue_machine.png': 'top-down-shooter/PNG/Man Blue/manBlue_machine.png',
  'survivor_blue_reload.png': 'top-down-shooter/PNG/Man Blue/manBlue_reload.png',
  'survivor_red_gun.png': 'top-down-shooter/PNG/Survivor 1/survivor1_gun.png',
  'survivor_red_stand.png': 'top-down-shooter/PNG/Survivor 1/survivor1_stand.png',
  'survivor_red_machine.png': 'top-down-shooter/PNG/Survivor 1/survivor1_machine.png',
  'survivor_red_reload.png': 'top-down-shooter/PNG/Survivor 1/survivor1_reload.png',
  'survivor_green_gun.png': 'top-down-shooter/PNG/Woman Green/womanGreen_gun.png',
  'survivor_green_stand.png': 'top-down-shooter/PNG/Woman Green/womanGreen_stand.png',
  'survivor_green_machine.png': 'top-down-shooter/PNG/Woman Green/womanGreen_machine.png',
  'survivor_green_reload.png': 'top-down-shooter/PNG/Woman Green/womanGreen_reload.png',
  'survivor_yellow_gun.png': 'top-down-shooter/PNG/Soldier 1/soldier1_gun.png',
  'survivor_yellow_stand.png': 'top-down-shooter/PNG/Soldier 1/soldier1_stand.png',
  'survivor_yellow_machine.png': 'top-down-shooter/PNG/Soldier 1/soldier1_machine.png',
  'survivor_yellow_reload.png': 'top-down-shooter/PNG/Soldier 1/soldier1_reload.png',
  // Enemies
  'zombie_walker.png': 'top-down-shooter/PNG/Zombie 1/zoimbie1_stand.png',
  'zombie_runner.png': 'top-down-shooter/PNG/Zombie 1/zoimbie1_hold.png',
  'zombie_brute.png': 'top-down-shooter/PNG/Zombie 1/zoimbie1_gun.png',
  'zombie_spitter.png': 'top-down-shooter/PNG/Zombie 1/zoimbie1_silencer.png',
  'zombie_boss.png': 'top-down-shooter/PNG/Robot 1/robot1_hold.png',
  // Weapons
  'weapon_gun.png': 'top-down-shooter/PNG/weapon_gun.png',
  'weapon_machine.png': 'top-down-shooter/PNG/weapon_machine.png',
  'weapon_silencer.png': 'top-down-shooter/PNG/weapon_silencer.png',
  // Spritesheet
  'characters_spritesheet.png': 'top-down-shooter/Spritesheet/spritesheet_characters.png',
};

for (const [target, sourceRel] of Object.entries(survivorMap)) {
  copyToBoth(path.resolve(EXTRACT_DIR, sourceRel), `games/zombie-survival/sprites/${target}`);
}

// Tilesets
copyToBoth(
  path.resolve(EXTRACT_DIR, 'top-down-shooter/Tilesheet/tilesheet_complete.png'),
  'games/zombie-survival/tilesets/abandoned_street_tilesheet.png'
);
copyToBoth(
  path.resolve(EXTRACT_DIR, 'top-down-shooter/Spritesheet/spritesheet_tiles.png'),
  'games/zombie-survival/tilesets/spritesheet_tiles.png'
);

// Individual tiles for obstacles & debris
const zombieTiles = ['tile_01.png', 'tile_10.png', 'tile_12.png', 'tile_13.png', 'tile_25.png', 'tile_48.png', 'tile_50.png', 'tile_90.png'];
for (const t of zombieTiles) {
  copyToBoth(
    path.resolve(EXTRACT_DIR, `top-down-shooter/PNG/Tiles/${t}`),
    `games/zombie-survival/tilesets/${t}`
  );
}

// Audio for Zombie Survival
const zombieAudioMap = {
  'gunshot.ogg': 'sci-fi-sounds/Audio/laserSmall_000.ogg',
  'machinegun.ogg': 'sci-fi-sounds/Audio/laserRetro_000.ogg',
  'shotgun.ogg': 'sci-fi-sounds/Audio/laserLarge_000.ogg',
  'reload.ogg': 'interface-sounds/Audio/confirmation_002.ogg',
  'zombie_groan.ogg': 'sci-fi-sounds/Audio/slime_000.ogg',
  'zombie_spit.ogg': 'sci-fi-sounds/Audio/slime_001.ogg',
  'zombie_hit.ogg': 'impact-sounds/Audio/impactPlate_heavy_000.ogg',
  'upgrade_pickup.ogg': 'interface-sounds/Audio/drop_001.ogg',
  'wave_start.ogg': 'music-jingles/Audio/8-Bit jingles/jingles_NES15.ogg',
  'wave_clear.ogg': 'music-jingles/Audio/8-Bit jingles/jingles_NES05.ogg',
  'player_hurt.ogg': 'impact-sounds/Audio/impactWood_heavy_000.ogg',
};

for (const [target, sourceRel] of Object.entries(zombieAudioMap)) {
  copyToBoth(path.resolve(EXTRACT_DIR, sourceRel), `games/zombie-survival/audio/${target}`);
}

// 3. Game 2: Platform Fighter
console.log('Organizing Game 2: Platform Fighter Assets...');

// Swift Archetype (Adventurer)
const swiftPoses = ['adventurer_idle.png', 'adventurer_stand.png', 'adventurer_walk1.png', 'adventurer_walk2.png', 'adventurer_jump.png', 'adventurer_fall.png', 'adventurer_action1.png', 'adventurer_action2.png', 'adventurer_kick.png', 'adventurer_hurt.png'];
for (const p of swiftPoses) {
  copyToBoth(path.resolve(EXTRACT_DIR, `platformer-characters/PNG/Adventurer/Poses/${p}`), `games/platform-fighter/sprites/swift/${p}`);
}
copyToBoth(path.resolve(EXTRACT_DIR, 'platformer-characters/PNG/Adventurer/adventurer_tilesheet.png'), 'games/platform-fighter/sprites/swift/swift_tilesheet.png');

// Heavy Archetype (Soldier)
const heavyPoses = ['soldier_idle.png', 'soldier_stand.png', 'soldier_walk1.png', 'soldier_walk2.png', 'soldier_jump.png', 'soldier_fall.png', 'soldier_action1.png', 'soldier_action2.png', 'soldier_kick.png', 'soldier_hurt.png'];
for (const p of heavyPoses) {
  copyToBoth(path.resolve(EXTRACT_DIR, `platformer-characters/PNG/Soldier/Poses/${p}`), `games/platform-fighter/sprites/heavy/${p}`);
}
copyToBoth(path.resolve(EXTRACT_DIR, 'platformer-characters/PNG/Soldier/soldier_tilesheet.png'), 'games/platform-fighter/sprites/heavy/heavy_tilesheet.png');

// Balanced Archetype (Player)
const balancedPoses = ['player_idle.png', 'player_stand.png', 'player_walk1.png', 'player_walk2.png', 'player_jump.png', 'player_fall.png', 'player_action1.png', 'player_action2.png', 'player_kick.png', 'player_hurt.png'];
for (const p of balancedPoses) {
  copyToBoth(path.resolve(EXTRACT_DIR, `platformer-characters/PNG/Player/Poses/${p}`), `games/platform-fighter/sprites/balanced/${p}`);
}
copyToBoth(path.resolve(EXTRACT_DIR, 'platformer-characters/PNG/Player/player_tilesheet.png'), 'games/platform-fighter/sprites/balanced/balanced_tilesheet.png');

// Ranger Archetype (Zombie / Female)
const rangerPoses = ['zombie_idle.png', 'zombie_stand.png', 'zombie_walk1.png', 'zombie_walk2.png', 'zombie_jump.png', 'zombie_fall.png', 'zombie_action1.png', 'zombie_action2.png', 'zombie_kick.png', 'zombie_hurt.png'];
for (const p of rangerPoses) {
  copyToBoth(path.resolve(EXTRACT_DIR, `platformer-characters/PNG/Zombie/Poses/${p}`), `games/platform-fighter/sprites/ranger/${p}`);
}
copyToBoth(path.resolve(EXTRACT_DIR, 'platformer-characters/PNG/Zombie/zombie_tilesheet.png'), 'games/platform-fighter/sprites/ranger/ranger_tilesheet.png');

// Arena 1: Training Platforms
copyToBoth(
  path.resolve(EXTRACT_DIR, 'pixel-platformer/Tilemap/tilemap_packed.png'),
  'games/platform-fighter/arenas/training_platforms_tilemap.png'
);
copyToBoth(
  path.resolve(EXTRACT_DIR, 'pixel-platformer/Tilemap/tilemap-backgrounds_packed.png'),
  'games/platform-fighter/arenas/sky_parallax_background.png'
);

// Audio for Platform Fighter
const fighterAudioMap = {
  'slash_light.ogg': 'impact-sounds/Audio/impactMining_000.ogg',
  'impact_heavy.ogg': 'impact-sounds/Audio/impactPlate_heavy_001.ogg',
  'whoosh_launch.ogg': 'sci-fi-sounds/Audio/forceField_000.ogg',
  'jump.ogg': 'impact-sounds/Audio/footstep_concrete_000.ogg',
  'double_jump.ogg': 'sci-fi-sounds/Audio/thrusterFire_000.ogg',
  'ko_blast.ogg': 'sci-fi-sounds/Audio/explosionCrunch_000.ogg',
  'announcer_ready.ogg': 'voiceover-pack-fighter/Audio/ready.ogg',
  'announcer_fight.ogg': 'voiceover-pack-fighter/Audio/fight.ogg',
  'announcer_ko.ogg': 'voiceover-pack-fighter/Audio/multi_kill.ogg',
  'announcer_sudden_death.ogg': 'voiceover-pack-fighter/Audio/sudden_death.ogg',
  'announcer_winner.ogg': 'voiceover-pack-fighter/Audio/winner.ogg',
};

for (const [target, sourceRel] of Object.entries(fighterAudioMap)) {
  copyToBoth(path.resolve(EXTRACT_DIR, sourceRel), `games/platform-fighter/audio/${target}`);
}

// 4. Game 3: Split-Screen Racing
console.log('Organizing Game 3: Split-Screen Racing Assets...');

// Vehicles (Slots 1-4)
const racingVehicles = {
  'car_blue.png': 'racing-pack/PNG/Cars/car_blue_1.png',
  'car_red.png': 'racing-pack/PNG/Cars/car_red_1.png',
  'car_green.png': 'racing-pack/PNG/Cars/car_green_1.png',
  'car_yellow.png': 'racing-pack/PNG/Cars/car_yellow_1.png',
  'spritesheet_vehicles.png': 'racing-pack/Spritesheets/spritesheet_vehicles.png',
};

for (const [target, sourceRel] of Object.entries(racingVehicles)) {
  copyToBoth(path.resolve(EXTRACT_DIR, sourceRel), `games/racing/vehicles/${target}`);
}

// Tracks & Props
copyToBoth(
  path.resolve(EXTRACT_DIR, 'racing-pack/Spritesheets/spritesheet_tiles.png'),
  'games/racing/tracks/sunset_circuit_tilesheet.png'
);
copyToBoth(
  path.resolve(EXTRACT_DIR, 'racing-pack/Spritesheets/spritesheet_objects.png'),
  'games/racing/tracks/spritesheet_objects.png'
);

const racingProps = [
  'barrier_red.png',
  'barrier_white.png',
  'barrier_red_race.png',
  'barrier_white_race.png',
  'barrel_red.png',
  'barrel_blue.png',
  'arrow_white.png',
  'arrow_yellow.png',
];
for (const p of racingProps) {
  copyToBoth(path.resolve(EXTRACT_DIR, `racing-pack/PNG/Objects/${p}`), `games/racing/tracks/${p}`);
}

// Audio for Racing
const racingAudioMap = {
  'engine_loop.ogg': 'car-sfx/Car_Engine_Loop.ogg',
  'engine_accel.ogg': 'car-sfx/Car_Acceleration.ogg',
  'tire_screech.ogg': 'sci-fi-sounds/Audio/impactMetal_000.ogg',
  'car_crash.ogg': 'sci-fi-sounds/Audio/explosionCrunch_001.ogg',
  'checkpoint_chime.ogg': 'interface-sounds/Audio/confirmation_001.ogg',
  'lap_flag.ogg': 'interface-sounds/Audio/drop_001.ogg',
  'finish_horn.ogg': 'car-sfx/Car_Horn.ogg',
  'finish_fanfare.ogg': 'music-jingles/Audio/8-Bit jingles/jingles_NES00.ogg',
};

for (const [target, sourceRel] of Object.entries(racingAudioMap)) {
  copyToBoth(path.resolve(EXTRACT_DIR, sourceRel), `games/racing/audio/${target}`);
}

// 5. Generate Master Manifest
console.log('Generating master manifest.json...');

const manifest = {
  $schema: 'MultiPal Asset Manifest v1.0.0',
  common: {
    fonts: [
      { key: 'font-press-start', path: '/assets/common/fonts/PressStart2P-Regular.ttf', type: 'webfont' },
      { key: 'font-silkscreen', path: '/assets/common/fonts/Silkscreen-Regular.ttf', type: 'webfont' },
    ],
    images: [
      { key: 'ui-preview', path: '/assets/common/ui/ui_preview.png' },
    ],
    spritesheets: [
      { key: 'ui-tilesheet', path: '/assets/common/ui/ui_tilesheet.png', frameWidth: 16, frameHeight: 16 },
    ],
    audio: Object.keys(commonAudioMap).map((name) => ({
      key: `common-${name.replace('.ogg', '')}`,
      path: `/assets/common/audio/${name}`,
    })),
  },
  games: {
    'zombie-survival': {
      images: [
        { key: 'zombie-survivor-blue', path: '/assets/games/zombie-survival/sprites/survivor_blue_gun.png' },
        { key: 'zombie-survivor-red', path: '/assets/games/zombie-survival/sprites/survivor_red_gun.png' },
        { key: 'zombie-survivor-green', path: '/assets/games/zombie-survival/sprites/survivor_green_gun.png' },
        { key: 'zombie-survivor-yellow', path: '/assets/games/zombie-survival/sprites/survivor_yellow_gun.png' },
        { key: 'zombie-walker', path: '/assets/games/zombie-survival/sprites/zombie_walker.png' },
        { key: 'zombie-runner', path: '/assets/games/zombie-survival/sprites/zombie_runner.png' },
        { key: 'zombie-brute', path: '/assets/games/zombie-survival/sprites/zombie_brute.png' },
        { key: 'zombie-spitter', path: '/assets/games/zombie-survival/sprites/zombie_spitter.png' },
        { key: 'zombie-boss', path: '/assets/games/zombie-survival/sprites/zombie_boss.png' },
        { key: 'weapon-gun', path: '/assets/games/zombie-survival/sprites/weapon_gun.png' },
        { key: 'weapon-machine', path: '/assets/games/zombie-survival/sprites/weapon_machine.png' },
        { key: 'abandoned-street-tilesheet', path: '/assets/games/zombie-survival/tilesets/abandoned_street_tilesheet.png' },
      ],
      spritesheets: [
        { key: 'zombie-characters-sheet', path: '/assets/games/zombie-survival/sprites/characters_spritesheet.png', frameWidth: 50, frameHeight: 43 },
        { key: 'zombie-tiles-sheet', path: '/assets/games/zombie-survival/tilesets/spritesheet_tiles.png', frameWidth: 64, frameHeight: 64 },
      ],
      audio: Object.keys(zombieAudioMap).map((name) => ({
        key: `zombie-${name.replace('.ogg', '')}`,
        path: `/assets/games/zombie-survival/audio/${name}`,
      })),
    },
    'platform-fighter': {
      images: [
        { key: 'fighter-training-platforms', path: '/assets/games/platform-fighter/arenas/training_platforms_tilemap.png' },
        { key: 'fighter-sky-bg', path: '/assets/games/platform-fighter/arenas/sky_parallax_background.png' },
        { key: 'swift-idle', path: '/assets/games/platform-fighter/sprites/swift/adventurer_idle.png' },
        { key: 'heavy-idle', path: '/assets/games/platform-fighter/sprites/heavy/soldier_idle.png' },
        { key: 'balanced-idle', path: '/assets/games/platform-fighter/sprites/balanced/player_idle.png' },
        { key: 'ranger-idle', path: '/assets/games/platform-fighter/sprites/ranger/zombie_idle.png' },
      ],
      spritesheets: [
        { key: 'swift-sheet', path: '/assets/games/platform-fighter/sprites/swift/swift_tilesheet.png', frameWidth: 80, frameHeight: 110 },
        { key: 'heavy-sheet', path: '/assets/games/platform-fighter/sprites/heavy/heavy_tilesheet.png', frameWidth: 80, frameHeight: 110 },
        { key: 'balanced-sheet', path: '/assets/games/platform-fighter/sprites/balanced/balanced_tilesheet.png', frameWidth: 80, frameHeight: 110 },
        { key: 'ranger-sheet', path: '/assets/games/platform-fighter/sprites/ranger/ranger_tilesheet.png', frameWidth: 80, frameHeight: 110 },
        { key: 'fighter-platform-tiles', path: '/assets/games/platform-fighter/arenas/training_platforms_tilemap.png', frameWidth: 18, frameHeight: 18 },
      ],
      audio: Object.keys(fighterAudioMap).map((name) => ({
        key: `fighter-${name.replace('.ogg', '')}`,
        path: `/assets/games/platform-fighter/audio/${name}`,
      })),
    },
    'racing': {
      images: [
        { key: 'racing-car-blue', path: '/assets/games/racing/vehicles/car_blue.png' },
        { key: 'racing-car-red', path: '/assets/games/racing/vehicles/car_red.png' },
        { key: 'racing-car-green', path: '/assets/games/racing/vehicles/car_green.png' },
        { key: 'racing-car-yellow', path: '/assets/games/racing/vehicles/car_yellow.png' },
        { key: 'sunset-circuit-tiles', path: '/assets/games/racing/tracks/sunset_circuit_tilesheet.png' },
      ],
      spritesheets: [
        { key: 'racing-vehicles-sheet', path: '/assets/games/racing/vehicles/spritesheet_vehicles.png', frameWidth: 128, frameHeight: 128 },
        { key: 'racing-track-sheet', path: '/assets/games/racing/tracks/sunset_circuit_tilesheet.png', frameWidth: 128, frameHeight: 128 },
        { key: 'racing-objects-sheet', path: '/assets/games/racing/tracks/spritesheet_objects.png', frameWidth: 128, frameHeight: 128 },
      ],
      audio: Object.keys(racingAudioMap).map((name) => ({
        key: `racing-${name.replace('.ogg', '')}`,
        path: `/assets/games/racing/audio/${name}`,
      })),
    },
  },
};

const manifestJson = JSON.stringify(manifest, null, 2);
fs.writeFileSync(path.resolve(ASSETS_ROOT, 'manifest.json'), manifestJson, 'utf-8');
fs.writeFileSync(path.resolve(PUBLIC_ASSETS_ROOT, 'manifest.json'), manifestJson, 'utf-8');

// 6. Generate ATTRIBUTION.md
console.log('Generating ATTRIBUTION.md...');

const attributionMd = `# MultiPal Game Asset Attribution & License Register

All assets bundled in MultiPal are verified open source assets under **CC0 1.0 Universal (Public Domain)** or **SIL Open Font License 1.1**, permitting commercial, non-commercial, modification, and offline distribution.

---

## 1. Visual & Audio Assets by Kenney

- **Creator:** Kenney (Asset Jesus) — https://kenney.nl
- **License:** Creative Commons Zero 1.0 Universal (CC0 1.0)
- **License URI:** https://creativecommons.org/publicdomain/zero/1.0/

### Packages Included:
1. **Top-Down Shooter** (Survivors, Walkers, Runners, Weapons, Street Tileset)
   - Source: https://kenney.nl/assets/top-down-shooter
2. **Platformer Characters** (Swift, Heavy, Ranger, Balanced archetypes & poses)
   - Source: https://kenney.nl/assets/platformer-characters
3. **Pixel Platformer & Industrial Expansion** (Arena platforms, obstacles, background tiles)
   - Source: https://kenney.nl/assets/pixel-platformer
4. **Racing Pack** (Top-down sports cars in 4 player colors, road tiles, track barriers)
   - Source: https://kenney.nl/assets/racing-pack
5. **UI Pack - Pixel Adventure** (Retro buttons, dpad, joystick knobs and frames)
   - Source: https://kenney.nl/assets/ui-pack-pixel-adventure
6. **Voiceover Pack (Fighter)** (Announcer countdown: 3, 2, 1, Fight!, KO, Winner!)
   - Source: https://kenney.nl/assets/voiceover-pack-fighter
7. **Impact Sounds** (Hit impacts, body slams, punches, kicks, falls)
   - Source: https://kenney.nl/assets/impact-sounds
8. **Interface Sounds** (UI clicks, select, confirm, back, drop)
   - Source: https://kenney.nl/assets/interface-sounds
9. **Sci-Fi Sounds** (Gunshots, lasers, plasma spit, shield forcefield, thrusters)
   - Source: https://kenney.nl/assets/sci-fi-sounds
10. **Music Jingles (8-Bit)** (NES-style victory fanfare, game over jingle, wave cleared)
    - Source: https://kenney.nl/assets/music-jingles

---

## 2. Additional Audio by OpenGameArt Contributors

- **Car Sound Effects Pack** (Engine loop, acceleration, horn)
  - Authors: car_sound_effects_pack contributors
  - License: CC0 1.0 Universal
  - Source: https://opengameart.org/content/car-sound-effects-pack-low-quality

---

## 3. Retro Typography

1. **Press Start 2P**
   - Author: CodeMan38
   - License: SIL Open Font License 1.1
   - Source: https://fonts.google.com/specimen/Press+Start+2P
2. **Silkscreen**
   - Author: Jason Kottke
   - License: SIL Open Font License 1.1
   - Source: https://fonts.google.com/specimen/Silkscreen

---
*Generated by MultiPal Asset Pipeline Automation*
`;

fs.writeFileSync(path.resolve(ASSETS_ROOT, 'ATTRIBUTION.md'), attributionMd, 'utf-8');
fs.writeFileSync(path.resolve(PUBLIC_ASSETS_ROOT, 'ATTRIBUTION.md'), attributionMd, 'utf-8');

console.log('--- MultiPal Asset Organization Finished Successfully ---');
