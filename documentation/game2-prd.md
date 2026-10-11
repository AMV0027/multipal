# PRD 03: Platform Fighter — Shared-Screen Arena Combat

**Status:** Draft v1.0  
**Genre:** 2D platform fighter  
**Players:** 2–4  
**Visual style:** Pixel-art characters with animated combat effects  
**Engine:** Phaser 3  
**Match structure:** Stock-based elimination

## 1. Game Vision

Build a fast, accessible platform-fighting game in which two to four players compete in a single arena.

The design takes inspiration from the shared-screen platform-fighter genre, including Brawlhalla, but uses original characters, arenas, animations, and combat rules.

The defining requirement is that all active players remain visible on the shared display. Players should never need individual screens to understand the match.

## 2. Design Pillars

- Fast, readable combat.
- Responsive movement and jumping.
- Knockback that creates exciting eliminations.
- A shared camera that keeps every active fighter visible.
- Distinct character identities without excessive complexity.
- Matches that are short enough for repeated local play.

## 3. Core Match Rules

- Support two, three, or four players.
- Each player begins with three stocks.
- Players take damage from attacks.
- Knockback increases the likelihood of being launched out of the arena.
- Falling beyond the recovery boundary costs a stock.
- Players respawn while stocks remain.
- The last surviving player wins.
- If the match timer expires, use a clearly defined tiebreak rule based on remaining stocks and then accumulated damage or another deterministic criterion.

The selected tiebreak rule must be consistent across all matches.

## 4. Movement System

Each character supports:
- Horizontal movement
- Ground acceleration and deceleration
- Jumping
- Double-jumping
- Air control
- Falling and landing
- Basic directional attacks
- Knockback and recovery
- Optional dodge or defensive movement

Movement should feel responsive and predictable. Avoid introducing complicated momentum rules before basic movement has been tuned.

## 5. Combat System

### Light attacks
Fast attacks with shorter recovery and moderate knockback.

### Heavy attacks
Slower attacks with stronger knockback and more commitment.

### Air attacks
Attacks performed while airborne, with behavior dependent on direction.

### Defensive movement
A dodge or evasive action with a short cooldown, if supported by the initial balance model.

### Damage and knockback

The combat system should use a consistent relationship between accumulated damage and knockback. As damage increases, opponents generally become easier to launch out of the arena.

Attacks must have clear startup, active, and recovery phases. Visual and audio effects should communicate hits without obscuring characters.

## 6. Character Roster

Start with four original fighters.

**Character A: Swift**
- Fast movement
- Short-range dual-blade attacks
- Lower individual hit strength
- Intended for aggressive, mobile play

**Character B: Heavy**
- Slower movement
- Hammer-based attacks
- Strong knockback
- Intended for deliberate, high-commitment combat

**Character C: Ranger**
- Moderate movement
- Limited ranged attack
- Requires positioning and resource-aware use
- Must not dominate the arena through continuous projectiles

**Character D: Balanced**
- Moderate speed
- Sword-based attacks
- Straightforward movement and attack patterns
- Intended as the beginner-friendly character

These are initial gameplay archetypes. Final names, designs, animation sets, and move lists should be developed as original intellectual property.

## 7. Camera and Arena Requirements

The game uses a single shared camera.

### Camera behavior
- Follow the center of the active fighter group.
- Zoom out when players spread apart.
- Apply a maximum zoom-out limit.
- Keep the playable arena within a predictable visual boundary.
- Avoid camera movement that causes sudden or disorienting shifts.
- Show directional indicators when a fighter is temporarily off-screen.

### Arena design

Arenas should constrain gameplay enough to preserve readability while allowing meaningful movement and knockback.

Use:
- A central fighting platform
- Elevated secondary platforms
- Clearly visible arena boundaries
- Recovery space beneath platforms
- Distinct background layers
- Limited decorative effects

The camera must prioritize active gameplay over decorative scenery.

## 8. Arena and Level Progression

The MVP should include three arenas with different layouts.

**Arena 1: Training Platforms**
- One large central platform
- Two small elevated platforms
- Wide recovery margins
- Simple background
- Suitable for learning movement and combat

**Arena 2: Sky Ruins**
- Central platform with two elevated side platforms
- Gaps that create recovery challenges
- Slightly more complex positioning
- Strong vertical visual identity

**Arena 3: Neon Foundry**
- Wide main platform
- Elevated sections
- Optional temporary environmental hazards
- Clear warning effects before any hazard activates

Environmental hazards should be disabled by default until basic combat balance is established.

## 9. Mobile Controller

- Left joystick or directional pad: move left and right.
- Jump button: jump and double-jump.
- Light attack button: fast attack.
- Heavy attack button: powerful attack.
- Dodge button: evade or recover.

Controls must support simultaneous movement and action inputs.

Buttons should be large enough for landscape phone use, with clear visual feedback and no reliance on reading the phone during combat.

## 10. Visual Style

### Character rendering
- Pixel-art or pixel-inspired sprites
- Distinct silhouettes
- Readable facing direction
- Clear attack anticipation
- Brief hit flashes
- Consistent animation timing

### Environments
- Layered parallax backgrounds
- Strong contrast between platforms and background
- Limited particle density during combat
- Consistent platform collision visuals
- Distinct palettes for each arena

Visual effects must never make players, platforms, or attack hitboxes difficult to distinguish.

## 11. Audio Direction

- Unique attack sounds by weapon class
- Clear jump and landing sounds
- Distinct hit and knockback cues
- Elimination and respawn sounds
- Countdown and match-end cues
- Optional background music with adjustable volume

## 12. Technical Requirements

- Use Phaser 3 for rendering.
- Implement collision and movement logic with predictable frame behavior.
- Keep authoritative stocks, damage, hits, and elimination results on the server.
- Synchronize input and state for up to four players.
- Use interpolation where necessary to smooth remote movement.
- Keep the shared camera independent of any single player's controller.
- Ensure player positions and attack states remain consistent across the display and server.

Combat should be validated using real controller latency rather than only local keyboard tests.

## 13. MVP Scope

Included:
- Two-to-four-player combat
- Four character archetypes
- Three attack categories where applicable
- Jumping and recovery
- Stock system
- One fully polished arena, with two additional arenas added after combat validation
- Shared camera
- Match timer
- Victory and results screen
- Rematch support

Excluded initially:
- Ranked play
- Online matchmaking
- Large character roster
- Complex combo trees
- Character progression
- Competitive seasons
- Advanced environmental hazards

## 14. Acceptance Criteria

- Two, three, and four players can compete.
- All active fighters remain visible under normal arena conditions.
- Jumping, attacks, collisions, and knockback behave consistently.
- Stocks and respawns update correctly.
- Eliminated players cannot continue affecting combat.
- The final winner is determined correctly.
- The shared display returns to the results screen after a match.
- Four simultaneous mobile controllers remain responsive.

## 15. Success Metrics

- Average match duration.
- Match completion rate.
- Rematch rate.
- Distribution of character selections.
- Frequency of accidental falls versus attack-driven eliminations.
- Frame rate during four-player combat.
- Player feedback on movement responsiveness and combat readability.