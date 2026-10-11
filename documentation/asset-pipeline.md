# MultiPal Asset Pipeline Specification

**Version:** 1.0.0  
**Scope:** Asset acquisition, licensing compliance, directory organization, sprite conventions, and fallback procedures.

---

## 1. Asset Strategy & Core Policy

1. **Strict Licensing Compliance**:
   - Only use assets with explicit public domain or permissive commercial-use licenses (e.g., CC0 1.0 Universal, MIT, Kenney Public Domain).
   - Record all sources, original creators, license terms, and required attribution in `assets/ATTRIBUTION.md`.
   - Never scrape or hotlink arbitrary images from Google Images, Pinterest, or copyrighted games.
2. **Cohesive Visual Style**:
   - 2D pixel art aesthetic with consistent pixel density (e.g., 16x16, 24x24, or 32x32 native resolutions upscaled crisply with nearest-neighbor filtering).
   - Approved primary open source asset libraries:
     - **Kenney** (CC0 Public Domain): Top-down shooter assets, platformer characters, arcade racing packs, pixel UI buttons, sounds.
     - **OpenGameArt.org** (CC0 / CC-BY with explicit attribution): Sound effects, ambient loops, sprite sheets.
3. **Local Self-Contained Assets**:
   - Assets are bundled and served locally from the repository. Hotlinking third-party URLs in production is strictly forbidden.
4. **Graceful Missing-Asset & Fallback Rules**:
   - The engine must NEVER crash on a missing audio file or texture.
   - If an asset is pending or missing:
     - A dynamic 1x1 or colored procedural canvas texture with an identifiable colored outline is generated at runtime as a visual placeholder.
     - A clear warning is logged to the debug console: `[AssetManager] Warning: Asset '${id}' missing; using magenta placeholder texture.`
     - The asset is marked as `PENDING` in the project backlog rather than claimed as finished.

---

## 2. Directory Structure

```
assets/
├── ATTRIBUTION.md             # Complete record of asset sources, authors, and licenses
├── manifest.json              # Master asset manifest (preloaded by Phaser)
├── common/
│   ├── audio/                 # Common UI clicks, countdown beeps, victory fanfares
│   ├── fonts/                 # Retro pixel fonts (e.g., Press Start 2P, Silkscreen - SIL OFL)
│   └── ui/                    # Controller buttons, directional pads, joystick knobs/bases
├── games/
│   ├── zombie-survival/
│   │   ├── sprites/           # Survivors (4 colors), Walkers, Runners, Brute, Spitter, Boss
│   │   ├── tilesets/          # Arena 1: Abandoned Street tiles and obstacles
│   │   ├── particles/         # Blood splatters, muzzle flash, bullet sparks, drops
│   │   └── audio/             # Gunshot, reload, zombie groan, upgrade pickup
│   ├── platform-fighter/
│   │   ├── sprites/           # 4 Archetypes: Swift, Heavy, Ranger, Balanced (Idle, Run, Jump, Attack)
│   │   ├── arenas/            # Training Platforms tiles, sky parallax background layers
│   │   ├── effects/           # Hit sparks, blast lines, dust clouds
│   │   └── audio/             # Sword slash, heavy blunt impact, launch whoosh, stock loss KO
│   └── racing/
│       ├── vehicles/          # 4 colorway race cars (top-down, 32-angle sprite sheets or rotating sprites)
│       ├── tracks/            # Track 1: Sunset Circuit asphalt, curbs, grass, barrier tiles
│       ├── hud/               # Tachometer, lap counter, minimap dots
│       └── audio/             # Engine idle/accel loop, screech/drift, checkpoint chime, finish horn
```

---

## 3. Asset Manifest Schema

All game assets are declared via a typed JSON manifest or TypeScript descriptor:

```typescript
export interface AssetManifest {
  images?: Array<{ key: string; path: string }>;
  spritesheets?: Array<{
    key: string;
    path: string;
    frameWidth: number;
    frameHeight: number;
    margin?: number;
    spacing?: number;
  }>;
  audio?: Array<{ key: string; path: string }>;
  fonts?: Array<{ key: string; path: string; type: 'bitmap' | 'webfont' }>;
}
```

---

## 4. Sprite & Animation Conventions

- **Origin Points**: All character sprites default to center origin `(0.5, 0.5)` unless foot-anchored `(0.5, 1.0)` for platformers.
- **Orientation**: Top-down directional assets (Zombie survival survivors & zombies, racing cars) face **Right (0 degrees / +X axis)** by default.
- **Rendering Quality**: Phaser game config sets `pixelArt: true` and `roundPixels: true` to prevent blurry texture interpolation and subpixel jitter.

---

## 5. Audio Guidelines

- **Formats**: `.mp3` and `.ogg` formats for universal browser compatibility.
- **Sound Levels**: Normalize SFX between -6 dB and -3 dB to prevent distortion when multiple sounds trigger simultaneously.
- **Audio Context Unlock**: Display and mobile controller initialize the Web Audio API on the first user interaction (touch/click) to comply with browser autoplay restrictions.
