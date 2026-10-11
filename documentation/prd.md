# PRD 01: Multiplayer Party Game Platform & Shared Game Engine

**Status:** Draft v1.0  
**Product type:** Browser-based shared-screen multiplayer gaming platform  
**Initial player capacity:** 4 players per room  
**Primary interfaces:** Display screen and mobile controllers

## 1. Product Vision

Build a multiplayer party gaming platform where one display runs the game and each player's mobile phone acts as an individual controller.

Players can create or join rooms using a short room code or QR code. The display presents the lobby and gameplay, while phones provide game-specific controls. The platform launches three initial games through a common room, networking, and player-management system.

The platform must support adding new games without rebuilding the multiplayer infrastructure.

## 2. Product Goals

- Let four players join a room without creating accounts.
- Allow players to use their existing phones as controllers.
- Support browser-based gameplay on a laptop or computer connected to a TV.
- Provide a responsive, reliable multiplayer experience.
- Reuse room management, networking, player identity, and session lifecycle across all games.
- Support different controller layouts and display configurations per game.
- Establish an architecture that can support dedicated display applications in the future.

## 3. Target Users

**Host:** Creates a room, selects a game, and starts the match.

**Player:** Joins using a phone, chooses a player identity, and controls a character or vehicle.

**Display viewer:** Watches the game on the shared screen. The host and players may also be viewers.

## 4. Core User Journey

1. Host opens the platform on a desktop or laptop.
2. Host selects one of the three games.
3. Host creates a room.
4. The platform displays a room code and QR code.
5. Players scan the QR code or enter the room code on their phones.
6. Players select names and avatars.
7. The display shows the lobby and player readiness.
8. Host starts the match.
9. Each phone displays the correct controller layout.
10. The game runs on the shared display.
11. The display shows match results.
12. Players can rematch, change games, or return to the lobby.

## 5. Functional Requirements

### 5.1 Room Management

- Generate unique, short, human-readable room codes.
- Generate a QR code linking directly to the room.
- Support a maximum of four players in the initial release.
- Show connected players and their readiness.
- Allow the host to select and start a game.
- Prevent unauthorized players from taking an occupied player slot.
- Handle host departure and room closure.
- Expire abandoned rooms after a configurable inactivity period.

### 5.2 Player Management

- Assign a unique session-scoped player ID.
- Support a display name and selectable avatar.
- Assign player slots consistently throughout a match.
- Track connected, disconnected, active, eliminated, and finished states as applicable.
- Allow a disconnected player to reclaim their slot during a defined reconnection window.
- Avoid requiring an account for casual play.

### 5.3 Display Mode

- Run in a desktop browser and support full-screen presentation.
- Show the room code and QR code in the lobby.
- Render the selected game's complete display.
- Support game-specific layouts, including shared cameras and multiple viewports.
- Show countdowns, scores, round information, and results.
- Recover gracefully from temporary connection loss.
- Provide a visible error state when the game server becomes unavailable.

### 5.4 Mobile Controller

- Open from a QR code or room URL.
- Work in modern mobile browsers without mandatory installation.
- Request landscape orientation where supported and appropriate.
- Display the correct controls for the selected game.
- Transmit compact input events or input-state updates.
- Provide visual feedback for button presses and connection status.
- Prevent accidental page scrolling and browser gestures during gameplay.
- Reconnect to an existing player slot where possible.

### 5.5 Game Integration

Each game must implement a shared integration contract:

- Register the game and its metadata.
- Declare supported player counts.
- Define controller layouts.
- Initialize and terminate game sessions.
- Receive player input.
- Update authoritative game state.
- Publish player status and match events.
- Report match completion and results.
- Support returning to the shared lobby.

The platform must not contain game-specific combat, vehicle physics, or level rules.

## 6. Shared Game Lifecycle

Room states:

- Lobby
- Ready
- Starting
- Playing
- Paused, where supported
- Results
- Closed

The platform must validate legal state transitions on the server. Clients cannot independently declare a match complete or change authoritative room state.

## 7. Technical Architecture

### Frontend

- React
- TypeScript
- Tailwind CSS for platform UI
- Phaser 3 for the initial 2D game renderer
- Responsive mobile controller interface

### Backend

- Node.js
- TypeScript
- Socket.IO for real-time communication
- PostgreSQL for persistent profiles, game metadata, and match history
- Redis as an optional later addition for cross-instance coordination

### Architecture principles

- Keep the platform UI, game rendering, and game simulation logically separated.
- Use one authoritative game-session process per match in the initial release.
- Treat player input as untrusted.
- Keep high-frequency gameplay state out of unnecessary database writes.
- Use server timestamps and sequence numbers to handle input ordering.
- Make each game independently testable.
- Avoid introducing microservices before the platform needs them.

### Proposed module structure

- `platform-web`: home, game selection, lobby, results
- `controller-web`: mobile controller interfaces
- `room-service`: room creation and player membership
- `session-service`: match lifecycle
- `realtime-gateway`: Socket.IO events and connection handling
- `game-runtime`: shared game-session contracts
- `games/zombie-survival`
- `games/platform-fighter`
- `games/racing`
- `shared-types`: player, room, input, and result schemas

These are logical modules; they do not need to be separate deployable services.

## 8. Networking Requirements

- Controller messages should contain player identity, input sequence, and current control state.
- Server validation must reject invalid player IDs, unauthorized actions, and malformed messages.
- The server must determine authoritative positions, collisions, damage, scoring, and race results.
- Input messages should avoid unnecessary payloads.
- The system should support interpolation and smoothing where appropriate.
- The platform should expose connection and latency diagnostics during development.

Initial performance targets:

- Target input-to-display latency below 100 ms under favorable local-network conditions.
- Target a stable 60 FPS on supported display hardware for appropriately optimized games.
- Test four simultaneous controllers on actual mobile devices.
- Define and measure performance budgets separately for each game.
- Do not claim a latency target is met until verified through testing.

## 9. Data Model

Core entities:

**Room**
- Room ID
- Join code
- Host session ID
- Selected game ID
- Room status
- Created timestamp
- Expiry timestamp

**Player Session**
- Player ID
- Room ID
- Display name
- Avatar ID
- Player slot
- Connection status
- Reconnection token or equivalent secure session mechanism

**Game Session**
- Session ID
- Room ID
- Game ID
- Start time
- End time
- Session status
- Result summary

**Match Result**
- Session ID
- Player ID
- Score
- Placement or outcome
- Game-specific statistics

Persist only the data needed for product operation and the chosen retention policy.

## 10. Non-Functional Requirements

- Support up to four players per match.
- Provide understandable error messages for failed joins.
- Validate all client-supplied inputs.
- Avoid exposing private session credentials in room URLs.
- Support keyboard navigation in platform interfaces where practical.
- Provide accessible text and high-contrast UI states.
- Handle browser refreshes and temporary disconnects gracefully.
- Keep game assets and network payloads reasonably small.
- Provide structured server logs and basic operational diagnostics.

## 11. MVP Scope

Included:
- Browser-based display
- Room creation and joining
- QR-code joining
- Four-player lobby
- Mobile controller framework
- Three integrated games
- Match results and rematch
- Basic reconnection handling
- Local development and production deployment configuration

Excluded initially:
- Ranked matchmaking
- Public room discovery
- Voice chat
- User-generated games
- In-platform game editor
- Payments and subscriptions
- Large-scale matchmaking infrastructure
- Mandatory native mobile apps

## 12. Acceptance Criteria

- Four different phones can join one display session.
- A fifth player is rejected with a clear capacity message.
- The correct game-specific controller appears on each phone.
- Controller inputs affect the correct player only.
- The server maintains authoritative match state.
- All three games can start, finish, and return to the lobby.
- A temporary phone disconnection does not automatically destroy the match.
- Results are displayed consistently across supported games.
- The platform works in a full-screen desktop browser.
- Automated and manual tests cover room transitions, input validation, and reconnection.

## 13. Delivery Milestones

1. Room system and controller connection proof of concept.
2. Shared display and lobby.
3. First playable game integrated end to end.
4. Remaining two games integrated through the same contract.
5. Performance, reconnection, and browser testing.
6. Deployment and initial user testing.

## 14. Product Success Metrics

- Time from opening the platform to all players joining.
- Percentage of rooms that successfully start a match.
- Match completion rate.
- Frequency of disconnects and failed joins.
- Input-to-display latency.
- Frame rate on target hardware.
- Rematch rate.
- Number of technical failures per session.

The initial product is successful when a group can create a room, join with four phones, play a complete match, and immediately start another without technical assistance.