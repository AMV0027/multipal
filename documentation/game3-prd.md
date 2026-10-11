# PRD 04: Split-Screen Racing — Four-Player Arcade Racer

**Status:** Draft v1.0  
**Genre:** Multiplayer arcade racing  
**Players:** 1–4, with four-player racing as the primary target  
**Visual style:** Stylized 2D top-down pixel-art racing  
**Engine:** Phaser 3 for the initial implementation  
**Match structure:** Lap-based races

## 1. Game Vision

Build an arcade racing game where up to four players race simultaneously on the same track.

Unlike the other games, racing requires independent views of the world. Each player receives a separate viewport showing their vehicle and nearby track conditions.

The initial version prioritizes responsive steering, readable tracks, short races, and stable four-player rendering over realistic driving simulation.

## 2. Design Pillars

- Responsive steering and acceleration.
- Clear track boundaries and racing direction.
- Four independent camera viewports.
- Short, replayable races.
- Readable vehicle positions and standings.
- Track layouts that reward steering and route choice.

## 3. Core Race Loop

1. Players join the room.
2. Each player selects an available vehicle or color.
3. The game loads the selected track.
4. Each viewport displays its player's starting position.
5. A countdown begins.
6. Players race through checkpoints and complete the required laps.
7. The game tracks progress and finishing order.
8. The results screen displays placements and lap times.
9. Players can rematch or choose another track.

## 4. Race Rules

- Support one to four players.
- Use a configurable lap count, initially three laps.
- Validate checkpoint progression.
- Track lap times and total race time.
- Prevent players from skipping sections of the track to gain an unfair advantage.
- Define a maximum race duration.
- Determine finishing order using validated progress and timing.
- Display final results consistently for every player.

The first release should use a shared track and common race rules. Time trials and AI opponents can be considered later.

## 5. Vehicle Controls

### Mobile controller
- Steering: left joystick.
- Accelerate: hold acceleration button.
- Brake/reverse: hold brake button.
- Optional drift: dedicated button after basic handling is stable.
- Optional item: dedicated action if a pickup system is introduced.

The initial controller requires only steering, acceleration, and braking.

### Driving model

Use arcade physics rather than a realistic vehicle simulator.

Each vehicle should have:
- Maximum speed
- Acceleration
- Braking strength
- Steering response
- Grip or traction
- Collision behavior

Vehicle parameters must be tuned so that steering feels responsive on touchscreen controls.

## 6. Split-Screen Layout

### Four players

Use a fixed 2 × 2 grid.

- Top-left: Player 1
- Top-right: Player 2
- Bottom-left: Player 3
- Bottom-right: Player 4

Each viewport contains:
- Independent camera
- Vehicle
- Nearby track
- Speed indicator
- Lap count
- Position indicator
- Optional compact minimap

### Three players

Use three viewports and a reserved fourth region for standings, a shared map, or race information.

### Two players

Use two large side-by-side or stacked viewports, selected according to display aspect ratio.

### One player

Use the full display area. Support solo practice if enabled in the selected release.

Viewport boundaries must remain stable during a race. Avoid dynamic layout changes that make players lose track of their own section.

## 7. Track and Level Progression

The initial game should contain three distinct tracks.

**Track 1: Sunset Circuit**
- Wide turns
- Long straights
- Minimal obstacles
- Forgiving boundaries
- Designed to teach steering and acceleration

**Track 2: Neon City**
- Medium-width roads
- Repeated corner sequences
- Chicanes and alternative racing lines
- Visually distinct urban scenery

**Track 3: Industrial Rush**
- Tight turns
- Longer technical sections
- Barriers and obstacle clusters
- Greater emphasis on braking and positioning

These tracks should share the same underlying vehicle and checkpoint system. Their differences should come from geometry, corner difficulty, and layout.

## 8. Level Progression

The initial progression is based on track difficulty rather than an unlock campaign.

**Stage 1: Learn to Drive**
- Sunset Circuit
- No advanced mechanics required
- Emphasis on steering and braking

**Stage 2: Master the Corners**
- Neon City
- Introduces more technical turns
- Encourages consistent cornering

**Stage 3: Technical Challenge**
- Industrial Rush
- More demanding corner sequences
- Requires improved braking and steering

All three tracks should be selectable during development and testing. Any later unlock system should be separate from basic track functionality.

## 9. Visual Direction

### Initial style
- 2D top-down pixel-art racing
- Clearly outlined vehicles
- Readable road edges
- Contrasting track and off-track surfaces
- Simple shadows or ground effects
- Distinct player colors
- Compact, legible HUD elements

### Track presentation
- Distinct environmental palettes
- Minimal decorative clutter near track edges
- Clear checkpoint markers
- Visible collision boundaries
- Consistent road markings
- Effects that do not obscure vehicle positions

The racing camera should follow each player's vehicle smoothly while preserving sufficient forward visibility.

A future 3D version can be evaluated after the initial 2D racer is playable. Moving to 3D would require a separate rendering and physics assessment; it should not be assumed to be a trivial visual upgrade.

## 10. Vehicle Selection

Begin with four visually distinct vehicle skins using the same baseline handling.

Once the race loop is balanced, introduce optional handling archetypes:
- Balanced
- Acceleration-focused
- High top speed
- High grip

For the MVP, cosmetic differentiation is preferable to a complicated vehicle-stat system that could make multiplayer balance harder.

## 11. Optional Pickups and Drift

These features are not required for the first playable version.

Potential future additions:
- Temporary speed boost
- Defensive shield
- Short-duration handling modifier
- Drift-based boost meter
- Track shortcuts
- Time-limited track hazards

Each addition should be tested for fairness across all four viewports and for its impact on race readability.

## 12. Technical Requirements

- Use Phaser 3 for the initial 2D implementation.
- Render each player's viewport with an independent camera.
- Maintain one authoritative race state per session.
- Validate checkpoints, lap progression, and finishing order on the server.
- Prevent client-side manipulation of speed or race position.
- Optimize drawing and camera updates for four simultaneous viewports.
- Test collision and off-track behavior at different frame rates.
- Avoid unnecessary physics calculations for objects outside relevant simulation areas.
- Ensure the viewport layout adapts to the display aspect ratio.

The four-player performance target must be measured on the intended hardware. A full-screen single-player benchmark is not sufficient.

## 13. MVP Scope

Included:
- One-to-four-player racing
- Four distinct vehicle skins
- Three selectable tracks
- Steering, acceleration, and braking
- Checkpoints and lap tracking
- Independent viewports
- Race countdown
- Finishing order and lap times
- Results and rematch
- Basic collision handling

Excluded initially:
- Realistic vehicle simulation
- Online matchmaking
- AI traffic
- Vehicle upgrades
- Persistent garage progression
- Large pickup inventories
- Dynamic weather
- Full 3D rendering

## 14. Acceptance Criteria

- Four players can race simultaneously.
- Each player sees the correct independent viewport.
- Steering and acceleration affect only the intended vehicle.
- Checkpoints and lap counts are validated.
- The finishing order is calculated correctly.
- The game rejects invalid or skipped checkpoint progress.
- The display layout remains stable throughout the race.
- Results are displayed after the race ends.
- The platform supports a rematch without recreating the room.
- Frame rate remains within the defined performance budget on target hardware.

## 15. Success Metrics

- Race completion rate.
- Average race duration.
- Rematch rate.
- Frequency of incorrect checkpoint or lap states.
- Input-to-display latency.
- Frame rate with four active viewports.
- Controller usability feedback.
- Percentage of players who finish without assistance.