# MultiPal Architecture Specification

**Product Type:** Browser-based shared-screen multiplayer gaming platform  
**Version:** 1.0.0  
**Target Architecture:** Monorepo (pnpm workspaces), React + Vite + Tailwind CSS + Phaser 3 frontend, Node.js + TypeScript + Socket.IO authoritative backend  

---

## 1. System Overview

MultiPal is a local multiplayer party game platform where:
1. **Host Display (`apps/platform-web`)**: Runs on a computer/laptop connected to a large screen or TV. It renders the shared room lobby, QR code, and the active game using Phaser 3 canvas rendering.
2. **Mobile Controller (`apps/controller-web`)**: Runs in mobile web browsers without app installation. Players scan the QR code, select a nickname/avatar, and receive a responsive virtual controller tailored to the active game.
3. **Realtime Server (`server/`)**: Authoritative Node.js + Socket.IO server managing room state, player slots, session reconnection tokens, and high-frequency game simulation tick loops.
4. **Shared Runtime & Packages (`packages/`, `games/`)**: Modular packages containing protocol types, game contracts, and decoupled game simulation logic.

```
                      +-----------------------------+
                      |       Host Display          |
                      |    (apps/platform-web)      |
                      |  - React + Tailwind HUD     |
                      |  - Phaser 3 Canvas Renderer |
                      +--------------+--------------+
                                     ^
                                     | WebSocket (State snapshots 30-60Hz, Room Events)
                                     v
+------------------------+     +-----+-----+     +------------------------+
|   Player 1 Controller  |     |           |     |   Player 2 Controller  |
|  (apps/controller-web) |<--->| MultiPal  |<--->|  (apps/controller-web) |
|   - Virtual Joystick   |     | Server    |     |   - Virtual Joystick   |
|   - Action Buttons     |     | (Node.js/ |     |   - Action Buttons     |
+------------------------+     | Socket.IO)|     +------------------------+
                               |           |
+------------------------+     | Author-   |     +------------------------+
|   Player 3 Controller  |<--->| itative   |<--->|   Player 4 Controller  |
|  (apps/controller-web) |     | State     |     |  (apps/controller-web) |
+------------------------+     +-----------+     +------------------------+
```

---

## 2. Monorepo Organization

```
multipal/
├── apps/
│   ├── platform-web/          # Host application: Lobby, QR code, Game Viewport (Phaser 3), HUD, Results
│   └── controller-web/        # Mobile controller: Touch joysticks, Buttons, Haptic/Vibration, Diagnostics
├── packages/
│   ├── shared-types/          # Protocol definitions, Room & Session DTOs, Input schemas, Result contracts
│   ├── game-runtime/          # Game contract interfaces, simulation loop utilities, vector math, input buffers
│   └── shared-ui/             # Reusable UI primitives, sound effects helper, QR code component
├── server/
│   └── src/
│       ├── rooms/             # Room lifecycle, 4-letter code generator, expiry watchdog
│       ├── sessions/          # Player slots (1-4), session tokens, reconnect window
│       ├── realtime/          # Socket.IO connection gateway, rate limiting, validation
│       └── games/             # Game engine coordinator and match execution
├── games/
│   ├── zombie-survival/       # Game 1: Top-down co-op shooter (server simulation + client Phaser scene)
│   ├── platform-fighter/      # Game 2: 2D platform fighter (server simulation + client Phaser scene)
│   └── racing/                # Game 3: Split-screen 4-viewport racer (server simulation + client Phaser scene)
├── documentation/             # PRDs, Architecture, Implementation Plan, Asset Pipeline
└── tests/                     # Monorepo integration and Playwright E2E test suites
```

---

## 3. Server-Authoritative Architecture & Physics Decoupling

### 3.1 The Headless Simulation Principle
A fundamental architectural requirement is that **the server is authoritative** for game state (positions, damage, eliminations, stocks, lap completions).
- Running Phaser 3 directly on Node.js requires DOM and Canvas emulation (`jsdom`, `node-canvas`), which is heavy, fragile, and leaks memory.
- Therefore, **game simulations are written as pure TypeScript mathematical systems** in `games/<game-name>/server`.
  - Fixed-timestep tick loop (30Hz or 60Hz depending on game requirements).
  - Pure 2D vector mathematics, AABB/circle collision detection, and deterministic state transitions.
- **Client Phaser 3 (`platform-web`)** acts as a visual and audio presentation layer:
  - Consumes server snapshots (`state_snapshot`).
  - Interpolates positions between ticks for buttery-smooth 60fps rendering.
  - Spawns client-side visual particles, hit flashes, and sound effects based on authoritative server events.

### 3.2 Network Protocol & Serialization
- Room & Lobby events use discrete typed Socket.IO events (`room:create`, `room:join`, `player:ready`, `game:start`).
- In-game controller inputs are streamed at 30Hz or delta-throttled:
  - Format: `[seq: number, timestamp: number, inputVector: [x, y], buttons: number (bitmask)]`.
  - Bitmasking and compact arrays keep payload sizes under 50 bytes per packet.
- In-game state broadcasts from server to host display:
  - Broadcast at 30Hz or 60Hz.
  - Contains entities with IDs, positions `[x, y]`, velocities, states, and active events (e.g., sound triggers, damage popups).

---

## 4. Shared Game Contract (`packages/game-runtime`)

Every game conforms to a strict unified contract:

```typescript
export interface IGameDefinition<TInput, TState, TResult> {
  id: GameId; // 'zombie-survival' | 'platform-fighter' | 'racing'
  title: string;
  minPlayers: number;
  maxPlayers: number;
  controllerLayout: ControllerLayoutId; // 'dual-stick' | 'fighter-pad' | 'racing-wheel'
  
  // Server-side simulation factory
  createServerEngine(config: GameServerConfig): IGameServerEngine<TInput, TState, TResult>;
  
  // Client-side display factory (Phaser 3 Scene config & asset manifest)
  createClientRenderer(): IGameClientRenderer<TState>;
}

export interface IGameServerEngine<TInput, TState, TResult> {
  init(players: PlayerSession[]): void;
  start(): void;
  processInput(playerId: string, input: TInput): void;
  tick(dt: number): GameTickResult<TState>;
  pause?(): void;
  resume?(): void;
  end(): TResult;
  destroy(): void;
}

export interface IGameClientRenderer<TState> {
  getAssetManifest(): AssetManifest;
  mount(container: HTMLElement, phaserGame: Phaser.Game): void;
  applyStateSnapshot(snapshot: TState): void;
  destroy(): void;
}
```

---

## 5. Room & Player Lifecycle

```
[Host Creates Room]
       |
       v
+--------------+    4-Player Max     +--------------+
|    LOBBY     | <------------------ | Player Joins |
+--------------+   QR / 4-char code  +--------------+
       |
       | (Host selects game & starts)
       v
+--------------+
|   STARTING   | (3-second synchronized countdown, preloads assets)
+--------------+
       |
       v
+--------------+
|   PLAYING    | (Server tick loop running, mobile controls active)
+--------------+
       |
       | (Game condition met: Victory, Wipeout, Stocks=0, Laps Complete)
       v
+--------------+
|   RESULTS    | (Display rankings & stats, Rematch / Lobby options)
+--------------+
       |
       +---> [Rematch] -> Return to STARTING / PLAYING
       +---> [Exit]    -> Return to LOBBY
```

### 5.1 Reconnection Model
- When a mobile player connects, the server issues a `sessionToken` stored in the phone's `sessionStorage`.
- If the socket disconnects (e.g. phone screen sleep, network flutter):
  - The player slot is held in `DISCONNECTED` state for a 30-second grace window.
  - When the phone reconnects with `sessionToken`, it automatically re-attaches to the player's slot, color, and in-game entity without losing game state.
  - If the timer expires, the slot is marked as `ABANDONED` or converted to an inactive spectator.

---

## 6. Controller UX & Mobile Device Reliability

- **Touch Interaction**: Uses pointer events with `touch-action: none` to disable all native mobile browser gestures (pinch-zoom, pull-to-refresh, swipe-back).
- **Full Viewport / Landscape**: Controller prompts the user to rotate into landscape mode when optimal.
- **Haptic Feedback**: Fires short `navigator.vibrate(15)` pulses on key action presses where supported.
- **Visual Feedback**: Real-time visual depression states and active stick handles so players feel responsive physical control.
- **Latency Diagnostics**: Host and mobile client display an optional debug ping/latency overlay during development.

---

## 7. Scalability & Deployment

- **MVP Target**: Single-instance Node.js server with in-memory room management (`RoomStore`). Capable of running hundreds of simultaneous 4-player rooms efficiently.
- **Zero-Dependency Core**: Does not require Docker, Redis, or PostgreSQL to run the MVP. 
- **Production Persistence Path**: An abstracted repository interface (`IRoomRepository`, `ISessionRepository`, `IMatchResultRepository`) allows PostgreSQL to be plugged in via Prisma/Drizzle for historical match logging when required.
