# MultiPal Implementation Plan & Milestones

**Version:** 1.0.0  
**Status:** Approved for execution  
**Target:** Phased delivery of multiplayer party game platform and 3 games.

---

## 1. Phased Milestones Overview

| Milestone | Scope | Dependencies | Status |
|---|---|---|---|
| **M1: Platform Foundation & Realtime Slice** | Monorepo setup, Room creation (4-char code & QR), Mobile join (4 players max), Socket.IO gateway, Reconnect session token, Live interactive input test | None | **Current Focus** |
| **M2: Shared Game Contract & Host UI** | `game-runtime` contract, Phaser 3 lifecycle wrapper, Host Lobby UI, Game Selector, Countdown transitions, Results screen framework | M1 | Pending |
| **M3: Game 1 — Zombie Survival** | Dual-stick controller, server wave & zombie simulation, health/damage, upgrade drops, boss wave, Phaser rendering | M2 | Pending |
| **M4: Game 2 — Platform Fighter** | Fighter controller pad, 2D physics/gravity/knockback, stock system, shared auto-framing camera, 4 archetypes | M2 | Pending |
| **M5: Game 3 — Split-Screen Racing** | Steering/pedal controller, 2x2 multi-viewport cameras, checkpoints & lap validation, arcade car physics | M2 | Pending |
| **M6: Polish, E2E Testing & Hardening** | Reconnection edge cases, mobile touch latency benchmarks, audio unlock, Playwright E2E suite | M3, M4, M5 | Pending |

---

## 2. Milestone 1: Platform Foundation & Realtime Vertical Slice (Immediate Goal)

### 2.1 Objective
Establish the foundational monorepo, real-time networking, room creation, mobile phone pairing via QR code, player slot assignment (1–4), and an interactive end-to-end input verification slice that proves the architecture before building full game scenes.

### 2.2 Acceptance Criteria
1. **Monorepo Structure**:
   - `pnpm` workspaces configured with `apps/platform-web`, `apps/controller-web`, `packages/shared-types`, `packages/game-runtime`, `packages/shared-ui`, `server`.
   - TypeScript configurations linked via shared `tsconfig.base.json`.
2. **Room Creation & Code**:
   - Host can open `platform-web` and click "Create Room".
   - Server generates a unique 4-character room code (e.g. `K9X2`) and session ID.
   - Host displays the room code and a scannable QR code encoding the controller join URL (`http://<host-ip>:<port>/join/<room-code>`).
3. **Mobile Joining & Slot Management**:
   - Mobile browser opens `/join/<room-code>` or enters the room code.
   - Player inputs a nickname and selects a color/avatar.
   - Server assigns the next available slot (Slot 1: Blue, Slot 2: Red, Slot 3: Green, Slot 4: Yellow).
   - Server issues a `sessionToken` stored in phone `sessionStorage`.
   - A 5th player attempting to join is rejected with "Room is full (Maximum 4 players)".
4. **Realtime Input Streaming**:
   - Mobile controller renders a virtual touch pad with joystick and action buttons.
   - Input packets (`[seq, timestamp, vector, buttons]`) stream to the server at 30Hz or on state change.
   - Server validates player identity, sequence numbers, and normalizes input vectors.
5. **Display Input Reflection (Vertical Slice)**:
   - Host screen displays connected players with slot badges, live ping indicators, and an interactive test canvas.
   - When Player 1 moves their mobile joystick or taps a button, their avatar square on the host screen immediately responds with low latency.
6. **Graceful Disconnection & Cleanup**:
   - When a phone disconnects, their slot is flagged as `disconnected` with a 30s grace window. Reconnecting with the same token re-claims the slot.
   - When the host closes the tab, the room is safely torn down on the server.
7. **Automated Tests**:
   - Unit tests covering room generation, player slot allocation, 4-player capacity cap, and input packet validation.

---

## 3. Milestone 2: Shared Game Contract & Host UI

### 3.1 Objective
Finalize the `game-runtime` abstraction and build the display lobby experience: game selection carousel, player readiness toggles, synchronized countdown (`Starting`), and the state transition pipeline to enter/exit any game.

### 3.2 Key Deliverables
- `packages/game-runtime`:
  - `IGameDefinition`, `IGameServerEngine`, `IGameClientRenderer`.
  - Fixed-step server tick loop manager (`GameTicker`).
  - Client state interpolator (`SnapshotInterpolator`).
- `apps/platform-web`:
  - Fullscreen toggle button.
  - Game selection cards (Zombie Survival, Platform Fighter, Split-Screen Racing).
  - Ready check system (All joined players must toggle "Ready" on their mobile controller, or Host can force start).
  - 3-second animated countdown overlay.
  - Results & Rematch screen wireframe.

---

## 4. Milestone 3: Game 1 — Zombie Survival (Co-op Wave Shooter)

### 4.1 Objective
Deliver a complete, playable 1–4 player co-op top-down shooter following `documentation/game1-prd.md`.

### 4.2 Key Deliverables
- **Controller**: Dual-stick mobile controller (left stick move, right stick aim/fire, ability button, reload).
- **Server Engine**:
  - Authoritative 30Hz simulation loop.
  - Player entity movement, health, shooting line/projectile collision.
  - Zombie AI pathfinding towards nearest player.
  - Enemy types: Walker, Runner, Brute, Spitter, Elite Carrier.
  - 5 wave progression table ending with a Boss encounter.
  - Upgrade drops (Offense, Mobility, Survival) spawned on enemy death.
- **Client Renderer**:
  - Phaser 3 top-down scene with single auto-framing camera keeping all living survivors visible.
  - Pixel-art survivor and zombie sprites, muzzle flashes, blood particles, HUD overlay (Wave, Health bars, Score).
  - Game over / Victory condition reporting back to the platform.

---

## 5. Milestone 4: Game 2 — Platform Fighter (2D Arena Combat)

### 5.1 Objective
Deliver a fast 2–4 player platform fighter with stock elimination and shared dynamic camera following `documentation/game2-prd.md`.

### 5.2 Key Deliverables
- **Controller**: Platformer pad (D-pad/stick, Jump/Double Jump, Light Attack, Heavy Attack, Dodge).
- **Server Engine**:
  - 2D platform physics (gravity, ground/air friction, jump impulse).
  - Attack hitboxes, hurtboxes, startup/active/recovery frame data.
  - Damage percentage scaling knockback trajectories.
  - Stock tracking (3 stocks per fighter) and blast zones / ringouts.
  - 4 archetypes: Swift, Heavy, Ranger, Balanced.
- **Client Renderer**:
  - Arena 1: Training Platforms.
  - Dynamic shared camera calculating bounding box of all active fighters with smooth zoom constraints.
  - Hit sparks, launch trails, stock indicators.

---

## 6. Milestone 5: Game 3 — Split-Screen Racing (4-Viewport Arcade Racer)

### 6.1 Objective
Deliver a 1–4 player arcade racer with independent camera viewports and lap tracking following `documentation/game3-prd.md`.

### 6.2 Key Deliverables
- **Controller**: Racing layout (Steering wheel/horizontal slider, Accelerate pedal, Brake/Reverse pedal).
- **Server Engine**:
  - Arcade top-down vehicle physics (forward acceleration, braking, tire grip/slip, steering yaw).
  - Checkpoint gate sequence verification (anti-cheat against shortcut skipping).
  - Lap counter (default 3 laps) and race timer.
  - Authoritative finishing order and lap times.
- **Client Renderer**:
  - Phaser multi-camera viewport manager (2x2 grid for 4 players; 2 viewports for 2 players; 1 viewport for 1 player).
  - Sunset Circuit track layout with asphalt, curbs, barriers.
  - Speedometer HUD, lap indicator, placement badge per viewport.

---

## 7. Milestone 6: Polish, Mobile Optimization & E2E Verification

### 7.1 Key Deliverables
- Cross-device testing on actual iOS (Safari) and Android (Chrome) devices.
- Network jitter simulation and reconnection stress testing.
- Web Audio API user-gesture unlock verification across mobile and desktop.
- End-to-end Playwright tests verifying the complete room creation -> 4 phone join -> game start -> match result loop.
