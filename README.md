# MultiPal 🎮

> **Browser-based 8-bit local multiplayer party gaming platform powered by smartphones as controllers.**  
> Zero app downloads. Zero hardware purchases. Scan a QR code on your phone and start playing in seconds.

---

## 🌟 Key Features

- **📱 Smartphone Controllers**: Players scan a QR code or enter a 4-letter room code on their mobile browser (`/join/<ROOM_CODE>`) to turn their phone into an interactive gamepad with virtual joysticks, haptic feedback, and custom action buttons.
- **🖥️ Full-Screen Arcade Display**: Clean retro party display with a compact floating QR code HUD overlay on the top-left and an infinite retro pixel marquee ticker along the bottom showing all player names, numbers (P1–P4), and connection statuses.
- **⚡ Authoritative Game Simulation**: 30Hz server-authoritative simulation using Node.js Fastify and Socket.IO. Physics, collisions, weapon fire, knockback calculations, and checkpoints are validated on the server.
- **🎨 8-Bit Pixel Aesthetic & Audio Engine**: Built with authentic public-domain Kenney/OpenGameArt pixel spritesheets and 33 retro OGG sound effects preloaded and triggered dynamically in response to game events.
- **🚀 Single-Service Deployment on Render**: Serves both client web applications (`platform-web` and `controller-web`) and WebSocket gateway from a single Fastify Node.js server.

---

## 🕹️ Included Games

### 1. Zombie Survival (Co-op Wave Shooter)
- **Genre**: 4-Player Co-op Twin-Stick Wave Shooter.
- **Mechanics**: 4 unique survivor sprites, 4 zombie archetypes (Walker, Runner, Brute, Boss), weapon ammo/health drops, player revives, and 500-point Nuke bombs.
- **Audio SFX**: Gunshots, zombie groans, upgrade pickups, player hurt, wave clear fanfares, and mission victory jingles.

### 2. Platform Fighter (Smash-Style Arena)
- **Genre**: 4-Player Smash-Style Platform Brawler.
- **Mechanics**: 4 distinct fighter archetypes (Swift, Heavy, Balanced, Ranger) with full idle, run, jump, slash, kick, and hurt animations. Features 3 stocks, knockback scaling based on accumulated damage percentage (0% to 999%), floating one-way drop-through platforms, and blast zone eliminations.
- **Audio SFX**: Light slash, heavy impact, jumps, high-velocity launch whooshes, KO blasts, and retro announcer callouts.

### 3. Split-Screen Racing (2x2 Kart Grand Prix)
- **Genre**: 4-Player 2x2 Split-Screen Kart Racing.
- **Mechanics**: Grand Prix circuit with 4 distinct karts, acceleration physics, reverse braking, steering drift damping, 8 waypoint checkpoints, lap counters (Lap 1/3, 2/3, 3/3), and final race placements.
- **Audio SFX**: Tire screech drifts, checkpoint chimes, lap flags, finish horns, and victory fanfares.

### 4. Test Arena
- **Genre**: Diagnostic Grid & Latency Sandbox.
- **Mechanics**: Direct visual feedback of joystick vectors and button inputs inside an 800x600 coordinate grid.

---

## 📂 Project Structure

MultiPal is organized as a lightweight pnpm monorepo:

```
multipal/
├── apps/
│   ├── platform-web/       # TV / Host Display application (React 19 + Vite + Tailwind + 8bitcn UI)
│   └── controller-web/     # Mobile phone controller web app (React 19 + Virtual Joysticks)
├── packages/
│   ├── shared-types/       # Network contracts, game state snapshots, and player slot colors
│   └── game-runtime/       # Engine interfaces, vector math, and input sanitization utilities
├── server/                 # Authoritative Fastify + Socket.IO server & game engines
├── assets/                 # Shared pixel sprites, tilesets, and sound effect libraries
├── scripts/                # Asset acquisition and organization automation scripts
├── .env                    # Local development configuration
├── .env.production         # Render / Railway single-port production environment
└── .env.deployment         # Cloud staging / custom port deployment template
```

---

## 🛠️ Quick Start & Local Development

### Prerequisites
- Node.js 20+
- pnpm 9+

### 1. Install Dependencies
```bash
pnpm install
```

### 2. Build All Packages
```bash
pnpm build
```

### 3. Run Automated Tests
```bash
pnpm test
```
All **36 unit tests** verify room creation, simulation physics, weapon fire, blast zone knockbacks, waypoint advancement, and input bitmasks.

### 4. Start the Unified Server
```bash
pnpm --filter @multipal/server start
```
- Open **Host Display**: `http://localhost:3001`
- Open **Phone Controller**: `http://localhost:3001/join` or scan the on-screen QR code

---

## 🌍 Environment Configurations

The platform includes modular environment templates:

| File | Target Environment | Description |
|---|---|---|
| `.env` | Local Development | Default local dev with `PORT=3001` and `VITE_SERVER_URL=http://localhost:3001`. |
| `.env.production` | Production (Render/Railway) | Single-service configuration where client connects directly to `window.location.origin`. |
| `.env.deployment` | Custom Cloud / Staging | Template for custom ports (`PORT=10000`) or separate reverse proxies. |

---

## 🚢 Deploying to Render

MultiPal is optimized for **Render Web Services** (free tier compatible):

1. **Create Web Service** on Render connected to this repository.
2. Set **Build Command**:
   ```bash
   pnpm install && pnpm build
   ```
3. Set **Start Command**:
   ```bash
   pnpm --filter @multipal/server start
   ```
4. Set **Environment Variables**:
   - `NODE_ENV`: `production`
   - `PORT`: `10000` (Render default)

The server will automatically serve the host display at `/`, the controller at `/join`, and handle authoritative WebSocket traffic on the same port with zero CORS issues.

---

## 📜 License & Asset Attributions

- MultiPal game code is licensed under the MIT License.
- Visual and audio assets are derived from public-domain and CC0 assets by **Kenney** (kenney.nl) and **OpenGameArt.org**. Full asset attributions are documented in [`apps/platform-web/public/assets/ATTRIBUTION.md`](file:///c:/SideProjects/multipal/apps/platform-web/public/assets/ATTRIBUTION.md).
