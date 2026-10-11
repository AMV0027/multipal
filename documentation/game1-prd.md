# PRD 02: Zombie Survival — Cooperative Wave Shooter

**Status:** Draft v1.0  
**Genre:** Cooperative top-down survival shooter  
**Players:** 1–4, with four-player balance as the primary target  
**Visual style:** 2D pixel art with atmospheric lighting  
**Engine:** Phaser 3  
**Match structure:** Survive waves, collect upgrades, defeat elite enemies

## 1. Game Vision

Create a cooperative top-down shooter in which players defend themselves against increasingly dangerous waves of zombies.

All players share one arena and one camera. The group must move, aim, shoot, collect upgrades, and coordinate positioning to survive.

The game should be easy to understand within seconds but provide enough variation in enemy behavior, weapon choices, and upgrades to encourage repeated matches.

## 2. Design Pillars

**Readable chaos:** Even with four players and many enemies, characters, bullets, damage effects, and pickups must remain distinguishable.

**Cooperation:** Players benefit from staying aware of teammates and covering different directions.

**Escalating danger:** Each wave increases pressure through enemy counts, enemy types, or special encounters.

**Meaningful upgrades:** Defeating selected enemies creates opportunities to improve a build.

**Short-session replayability:** A match should provide a satisfying experience without requiring a long campaign.

## 3. Core Gameplay Loop

1. Players enter the arena.
2. A countdown starts the wave.
3. Zombies spawn around the arena's perimeter.
4. Players move and attack while avoiding damage.
5. Zombies drop experience, health, ammunition, or upgrade rewards according to their type.
6. The team clears the wave.
7. Players receive a short upgrade or preparation interval.
8. The next wave begins.
9. The match ends when the team loses or completes the final wave.

The first release should focus on survival and wave progression. A separate campaign mode can be considered later.

## 4. Controls

### Mobile controller

- Left joystick: move in any direction.
- Right joystick: aim.
- Fire input: shoot while active.
- Ability button: use a special ability.
- Reload or interact button: use only if required by the selected weapon system.

The controller must allow simultaneous movement and firing.

An optional auto-aim mode should prioritize nearby threats within a configurable angle or radius. It must not make manual aiming unusable.

### Display

The shared display shows:
- All living players
- Health and status indicators
- Wave number
- Enemy progress or remaining enemies
- Upgrade drops
- Team survival status
- Match results

## 5. Camera and Arena

Use a single top-down camera.

All players must remain visible within the camera's playable bounds. The camera may follow the group or use a carefully constrained zoom, but must not zoom out so far that the characters become unreadable.

The arena should be designed around four-player movement rather than a huge, mostly empty map.

Arena elements may include:
- Cover objects
- Open combat spaces
- Obstacles that influence movement
- Spawn areas around the perimeter
- Clearly marked boundaries
- Optional environmental hazards

Avoid obstacles that trap players or prevent them from escaping a large group of enemies.

## 6. Enemy Design

### Basic Walker

- Slow movement
- Low health
- Approaches the nearest target
- Appears in large numbers

### Runner

- Fast movement
- Low-to-medium health
- Punishes stationary players
- Appears in controlled groups

### Brute

- High health
- Slow attacks with clear telegraphs
- Forces players to reposition
- Appears less frequently

### Spitter

- Ranged attacks
- Forces movement away from predictable positions
- Must have clearly visible projectile warnings

### Elite / Upgrade Carrier

- Distinct appearance
- Higher threat than basic enemies
- Guaranteed or increased chance of a meaningful reward
- Introduced after players understand basic combat

Enemy types should be introduced gradually. Do not introduce every type in the opening wave.

## 7. Wave Progression

The following is the proposed initial progression, to be tuned through playtesting.

**Wave 1 — First Contact**
- Basic walkers only
- Low enemy count
- Teaches movement and shooting
- No severe punishment for beginners

**Wave 2 — Pressure**
- More walkers
- First runner groups
- Encourages continuous movement

**Wave 3 — First Reward**
- Introduces an elite upgrade carrier
- Demonstrates the reward system
- Offers the first meaningful build decision

**Wave 4 — Encirclement**
- Zombies approach from more directions
- Adds moderate runner pressure
- Tests team positioning

**Wave 5 — First Boss**
- Introduces a large, clearly telegraphed enemy
- Uses distinct attack patterns
- Rewards coordinated movement and sustained damage

**Waves 6–9 — Escalation**
- Combines previously introduced enemy types
- Increases density and selected enemy stats
- Adds new reward opportunities
- Avoids increasing every difficulty parameter simultaneously

**Wave 10 — Final Encounter**
- A boss-focused survival challenge
- Includes supporting enemies in controlled groups
- Ends with a victory state if the team survives

Later waves can continue in endless mode, but endless mode should not be required for the first release.

## 8. Upgrade System

Upgrades should be easy to understand and quick to collect.

### Offense
- Increased weapon damage
- Increased fire rate
- Additional projectiles
- Improved projectile penetration

### Mobility
- Increased movement speed
- Shorter dash cooldown
- Temporary movement boost after eliminating an enemy

### Survival
- Increased maximum health
- Limited-use shield
- Healing pickup
- Temporary damage reduction

### Upgrade delivery

Selected enemies drop identifiable reward items. Players can collect them by moving over the item or interacting with it, depending on the reward type.

The game must clearly communicate whether a reward benefits the collecting player or the entire team.

Avoid excessive loot clutter. Use a limited set of meaningful drops instead of filling the arena with dozens of item types.

## 9. Player and Combat Rules

- Each player has a health value and a defined damage response.
- Weapon behavior must be consistent and server-authoritative.
- Damage, collisions, enemy movement, and reward eligibility are validated by the game simulation.
- A defeated player may enter a downed state or be eliminated, depending on the selected MVP rule.
- If downed-state revival is implemented, define a clear revive duration and interruption rule.
- The team loses when all players are eliminated or otherwise unable to continue.
- A surviving team wins by completing the final encounter.

For the first playable build, implement simple elimination first. Add downed-state revival only if it materially improves cooperative gameplay.

## 10. Visual Direction

### Style

- Pixel-art characters and zombies
- Readable silhouettes
- Top-down or three-quarter top-down perspective
- Limited, consistent color palette
- Layered environmental details
- Short hit flashes and readable damage feedback
- Controlled lighting and atmospheric effects

The environment should establish a post-apocalyptic setting without sacrificing visibility.

### Proposed biomes

**Level 1: Abandoned Street**
- Broken vehicles
- Road barriers
- Damaged streetlights
- Wide combat areas
- Primary tutorial environment

**Level 2: Quarantined District**
- Barricades
- Abandoned supply crates
- Narrower routes
- More environmental obstacles

**Level 3: Industrial Yard**
- Containers and machinery
- Hazard zones
- Multiple movement routes
- Strong visual separation between combat spaces

**Level 4: Research Facility**
- Laboratory equipment
- Containment rooms
- High-tech lighting
- Elite and boss-focused encounters

These are proposed environments for future content. The MVP needs one complete arena before the others are developed.

## 11. Audio Direction

- Distinct weapon firing and hit sounds
- Directionally useful enemy attack cues where feasible
- Clear pickup and upgrade sounds
- Wave-start and wave-complete cues
- Stronger audio identity for elite enemies and bosses
- Adjustable game volume

Audio must support gameplay readability rather than overwhelm the action.

## 12. Technical Requirements

- Phaser 3 renders the game.
- The server controls authoritative player state, combat results, enemy state, and progression.
- Player input supports simultaneous movement and aiming.
- Enemy updates should be efficient enough for the planned maximum enemy count.
- The game must remain playable at the target frame rate on supported hardware.
- Camera behavior must be tested with players at maximum separation.
- Upgrade and combat events must be deterministic enough to avoid conflicting results.

## 13. MVP Scope

Included:
- One complete arena
- Four-player cooperative play
- Movement and shooting
- At least three distinct enemy types
- Five initial waves
- One boss encounter
- A small upgrade pool
- Health and defeat rules
- Victory and defeat screens
- Rematch support

Excluded initially:
- Campaign progression
- Persistent player levels
- Large weapon inventories
- Crafting
- Procedurally generated worlds
- Online public matchmaking
- Extensive character cosmetics

## 14. Acceptance Criteria

- Four players can move and shoot simultaneously.
- All living players remain visible.
- Enemies target players using consistent rules.
- Damage and rewards are validated by the game simulation.
- Upgrade drops are visible and collectible.
- Wave progression occurs correctly.
- Boss encounters have readable attack warnings.
- Match results return to the shared platform.
- Reconnecting players do not duplicate their player state or rewards.

## 15. Success Metrics

- Percentage of matches reaching wave five.
- Average survival time.
- Average number of upgrades collected.
- Percentage of players who finish a match.
- Rematch rate.
- Reported control responsiveness.
- Frame rate and network stability at maximum player count.