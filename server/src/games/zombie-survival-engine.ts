import {
  ControllerButton,
  ControllerInputPayload,
  PlayerSession,
  SLOT_COLORS,
  ZombieBullet,
  ZombieDrop,
  ZombieEntity,
  ZombiePlayerState,
  ZombieSurvivalSnapshot,
} from '@multipal/shared-types';
import {
  GameServerConfig,
  GameTickResult,
  IGameServerEngine,
  sanitizeInputVector,
} from '@multipal/game-runtime';

interface PlayerInternal extends ZombiePlayerState {
  inputVector: [number, number];
  aimVector: [number, number];
  buttons: number;
  lastInputSeq: number;
  fireCooldown: number;
}

export class ZombieSurvivalEngine
  implements IGameServerEngine<ControllerInputPayload, ZombieSurvivalSnapshot>
{
  private players = new Map<string, PlayerInternal>();
  private zombies = new Map<string, ZombieEntity>();
  private bullets: ZombieBullet[] = [];
  private drops: ZombieDrop[] = [];

  private tickCount: number = 0;
  private wave: number = 1;
  private waveTimer: number = 45; // 45 seconds per wave
  private isWaveIntermission: boolean = false;
  private intermissionTimer: number = 5;
  private isGameOver: boolean = false;
  private isVictory: boolean = false;

  private zombieIdCounter: number = 0;
  private bulletIdCounter: number = 0;
  private dropIdCounter: number = 0;

  private readonly ARENA_WIDTH = 800;
  private readonly ARENA_HEIGHT = 600;
  private readonly MOVE_SPEED = 240;

  constructor(private config: GameServerConfig) {}

  public init(players: PlayerSession[]): void {
    this.players.clear();
    this.zombies.clear();
    this.bullets = [];
    this.drops = [];
    this.wave = 1;
    this.waveTimer = 40;
    this.isWaveIntermission = false;
    this.isGameOver = false;
    this.isVictory = false;

    const spawnOffsets = [
      { x: 360, y: 280 },
      { x: 440, y: 280 },
      { x: 360, y: 320 },
      { x: 440, y: 320 },
    ];

    players.forEach((p) => {
      const sp = spawnOffsets[p.slotIndex % 4];
      this.players.set(p.id, {
        playerId: p.id,
        slotIndex: p.slotIndex,
        nickname: p.nickname,
        color: SLOT_COLORS[p.slotIndex].primary,
        x: sp.x,
        y: sp.y,
        aimAngle: 0,
        hp: 100,
        maxHp: 100,
        score: 0,
        kills: 0,
        isDowned: false,
        reviveProgress: 0,
        ammo: 150,
        inputVector: [0, 0],
        aimVector: [1, 0],
        buttons: 0,
        lastInputSeq: 0,
        fireCooldown: 0,
      });
    });

    this.spawnWaveZombies();
  }

  public addPlayer(player: PlayerSession): void {
    if (this.players.has(player.id)) return;
    this.players.set(player.id, {
      playerId: player.id,
      slotIndex: player.slotIndex,
      nickname: player.nickname,
      color: SLOT_COLORS[player.slotIndex].primary,
      x: 400,
      y: 300,
      aimAngle: 0,
      hp: 100,
      maxHp: 100,
      score: 0,
      kills: 0,
      isDowned: false,
      reviveProgress: 0,
      ammo: 150,
      inputVector: [0, 0],
      aimVector: [1, 0],
      buttons: 0,
      lastInputSeq: 0,
      fireCooldown: 0,
    });
  }

  public removePlayer(playerId: string): void {
    this.players.delete(playerId);
  }

  public start(): void {
    this.tickCount = 0;
  }

  public processInput(playerId: string, input: ControllerInputPayload): void {
    const p = this.players.get(playerId);
    if (!p) return;

    if (input.seq && input.seq < p.lastInputSeq) return;
    p.lastInputSeq = input.seq || p.lastInputSeq + 1;

    p.inputVector = sanitizeInputVector(input.vector || [0, 0]);
    if (input.aimVector && (Math.abs(input.aimVector[0]) > 0.1 || Math.abs(input.aimVector[1]) > 0.1)) {
      p.aimVector = sanitizeInputVector(input.aimVector);
      p.aimAngle = Math.atan2(p.aimVector[1], p.aimVector[0]);
    }
    p.buttons = input.buttons || 0;
  }

  private spawnWaveZombies(): void {
    const baseCount = 8 + this.wave * 4;
    const isBossWave = this.wave === 5 || this.wave === 10;

    for (let i = 0; i < baseCount; i++) {
      this.zombieIdCounter++;
      const edge = Math.floor(Math.random() * 4);
      let x = 0;
      let y = 0;
      if (edge === 0) { x = Math.random() * this.ARENA_WIDTH; y = 10; }
      else if (edge === 1) { x = this.ARENA_WIDTH - 10; y = Math.random() * this.ARENA_HEIGHT; }
      else if (edge === 2) { x = Math.random() * this.ARENA_WIDTH; y = this.ARENA_HEIGHT - 10; }
      else { x = 10; y = Math.random() * this.ARENA_HEIGHT; }

      const isRunner = Math.random() < Math.min(0.5, 0.1 + this.wave * 0.05);
      const isBrute = !isRunner && this.wave >= 3 && Math.random() < 0.25;

      const type = isBrute ? 'brute' : isRunner ? 'runner' : 'walker';
      const hp = isBrute ? 120 + this.wave * 20 : isRunner ? 30 : 50 + this.wave * 10;
      const speed = isBrute ? 75 : isRunner ? 160 : 90 + this.wave * 5;

      this.zombies.set(`z_${this.zombieIdCounter}`, {
        id: `z_${this.zombieIdCounter}`,
        type,
        x,
        y,
        hp,
        maxHp: hp,
        speed,
        targetPlayerId: null,
      });
    }

    if (isBossWave) {
      this.zombieIdCounter++;
      this.zombies.set(`boss_${this.zombieIdCounter}`, {
        id: `boss_${this.zombieIdCounter}`,
        type: 'boss',
        x: this.ARENA_WIDTH / 2,
        y: 30,
        hp: 500 + this.wave * 200,
        maxHp: 500 + this.wave * 200,
        speed: 85,
        targetPlayerId: null,
      });
    }
  }

  public tick(dt: number): GameTickResult<ZombieSurvivalSnapshot> {
    this.tickCount++;

    if (!this.isGameOver && !this.isVictory) {
      // 1. Intermission handling
      if (this.isWaveIntermission) {
        this.intermissionTimer -= dt;
        if (this.intermissionTimer <= 0) {
          this.isWaveIntermission = false;
          this.wave++;
          if (this.wave > 10) {
            this.isVictory = true;
          } else {
            this.waveTimer = 40 + this.wave * 5;
            this.spawnWaveZombies();
          }
        }
      } else {
        this.waveTimer -= dt;
        if (this.waveTimer <= 0 || this.zombies.size === 0) {
          this.isWaveIntermission = true;
          this.intermissionTimer = 5;
          this.zombies.clear();
        }
      }

      // 2. Player movement and shooting
      let activeSurvivors = 0;
      for (const p of this.players.values()) {
        if (!p.isDowned) {
          activeSurvivors++;
          p.x += p.inputVector[0] * this.MOVE_SPEED * dt;
          p.y += p.inputVector[1] * this.MOVE_SPEED * dt;
          p.x = Math.max(20, Math.min(this.ARENA_WIDTH - 20, p.x));
          p.y = Math.max(20, Math.min(this.ARENA_HEIGHT - 20, p.y));

          // Weapon firing (Button A or aim magnitude > 0.5)
          p.fireCooldown -= dt;
          const isFiring = (p.buttons & ControllerButton.A) !== 0 || (p.aimVector && Math.hypot(p.aimVector[0], p.aimVector[1]) > 0.6);
          if (isFiring && p.fireCooldown <= 0 && p.ammo > 0) {
            p.fireCooldown = 0.15; // 6.6 shots per second
            p.ammo--;
            this.bulletIdCounter++;

            const bulletSpeed = 650;
            const dirX = Math.cos(p.aimAngle);
            const dirY = Math.sin(p.aimAngle);

            this.bullets.push({
              id: `b_${this.bulletIdCounter}`,
              playerId: p.playerId,
              x: p.x + dirX * 18,
              y: p.y + dirY * 18,
              vx: dirX * bulletSpeed,
              vy: dirY * bulletSpeed,
            });
          }

          // Button B: Grenade / Nuke
          if ((p.buttons & ControllerButton.B) !== 0 && p.score >= 500) {
            p.score -= 500;
            // Clear nearby zombies
            for (const [zid, z] of this.zombies.entries()) {
              if (Math.hypot(z.x - p.x, z.y - p.y) < 180) {
                z.hp -= 200;
              }
            }
          }
        } else {
          // Downed player: check if teammate nearby to revive
          for (const teammate of this.players.values()) {
            if (teammate.playerId !== p.playerId && !teammate.isDowned) {
              const dist = Math.hypot(teammate.x - p.x, teammate.y - p.y);
              if (dist < 40) {
                p.reviveProgress += dt * 40;
                if (p.reviveProgress >= 100) {
                  p.isDowned = false;
                  p.hp = 50;
                  p.reviveProgress = 0;
                }
              }
            }
          }
        }
      }

      if (this.players.size > 0 && activeSurvivors === 0) {
        this.isGameOver = true;
      }

      // 3. Bullet simulation & Zombie collision
      const remainingBullets: ZombieBullet[] = [];
      for (const b of this.bullets) {
        b.x += b.vx * dt;
        b.y += b.vy * dt;

        if (b.x < 0 || b.x > this.ARENA_WIDTH || b.y < 0 || b.y > this.ARENA_HEIGHT) {
          continue;
        }

        let bulletHit = false;
        for (const [zid, z] of this.zombies.entries()) {
          const hitRadius = z.type === 'boss' ? 36 : z.type === 'brute' ? 24 : 16;
          if (Math.hypot(z.x - b.x, z.y - b.y) < hitRadius) {
            bulletHit = true;
            z.hp -= 35;
            if (z.hp <= 0) {
              this.zombies.delete(zid);
              const shooter = this.players.get(b.playerId);
              if (shooter) {
                shooter.kills++;
                shooter.score += z.type === 'boss' ? 500 : z.type === 'brute' ? 100 : 25;
              }

              // Random drop chance
              if (Math.random() < 0.25) {
                this.dropIdCounter++;
                const dropTypes: Array<ZombieDrop['type']> = ['health', 'ammo', 'speed_boost'];
                this.drops.push({
                  id: `d_${this.dropIdCounter}`,
                  type: dropTypes[Math.floor(Math.random() * dropTypes.length)],
                  x: z.x,
                  y: z.y,
                });
              }
            }
            break;
          }
        }

        if (!bulletHit) {
          remainingBullets.push(b);
        }
      }
      this.bullets = remainingBullets;

      // 4. Zombie AI and Player Damaging
      for (const z of this.zombies.values()) {
        // Find nearest living player
        let nearestPlayer: PlayerInternal | null = null;
        let minDist = Infinity;
        for (const p of this.players.values()) {
          if (!p.isDowned) {
            const dist = Math.hypot(p.x - z.x, p.y - z.y);
            if (dist < minDist) {
              minDist = dist;
              nearestPlayer = p;
            }
          }
        }

        if (nearestPlayer) {
          z.targetPlayerId = nearestPlayer.playerId;
          const angle = Math.atan2(nearestPlayer.y - z.y, nearestPlayer.x - z.x);
          z.x += Math.cos(angle) * z.speed * dt;
          z.y += Math.sin(angle) * z.speed * dt;

          // Attack player
          if (minDist < 24) {
            const dmg = z.type === 'boss' ? 40 : z.type === 'brute' ? 25 : 12;
            nearestPlayer.hp -= dmg * dt;
            if (nearestPlayer.hp <= 0) {
              nearestPlayer.hp = 0;
              nearestPlayer.isDowned = true;
              nearestPlayer.reviveProgress = 0;
            }
          }
        }
      }

      // 5. Item Pickup Collection
      this.drops = this.drops.filter((d) => {
        for (const p of this.players.values()) {
          if (!p.isDowned && Math.hypot(p.x - d.x, p.y - d.y) < 28) {
            if (d.type === 'health') p.hp = Math.min(p.maxHp, p.hp + 40);
            if (d.type === 'ammo') p.ammo = Math.min(300, p.ammo + 60);
            return false;
          }
        }
        return true;
      });
    }

    const snapshot: ZombieSurvivalSnapshot = {
      gameId: 'zombie-survival',
      tick: this.tickCount,
      timestamp: Date.now(),
      wave: this.wave,
      waveTimeRemaining: Math.max(0, Math.round(this.waveTimer)),
      isWaveIntermission: this.isWaveIntermission,
      players: Array.from(this.players.values()).map((p) => ({
        playerId: p.playerId,
        slotIndex: p.slotIndex,
        nickname: p.nickname,
        color: p.color,
        x: Math.round(p.x * 10) / 10,
        y: Math.round(p.y * 10) / 10,
        aimAngle: Math.round(p.aimAngle * 100) / 100,
        hp: Math.round(p.hp),
        maxHp: p.maxHp,
        score: p.score,
        kills: p.kills,
        isDowned: p.isDowned,
        reviveProgress: Math.round(p.reviveProgress),
        ammo: p.ammo,
      })),
      zombies: Array.from(this.zombies.values()).map((z) => ({
        id: z.id,
        type: z.type,
        x: Math.round(z.x * 10) / 10,
        y: Math.round(z.y * 10) / 10,
        hp: Math.round(z.hp),
        maxHp: z.maxHp,
        speed: z.speed,
        targetPlayerId: z.targetPlayerId,
      })),
      bullets: this.bullets.map((b) => ({
        id: b.id,
        playerId: b.playerId,
        x: Math.round(b.x * 10) / 10,
        y: Math.round(b.y * 10) / 10,
        vx: Math.round(b.vx),
        vy: Math.round(b.vy),
      })),
      drops: this.drops,
      isGameOver: this.isGameOver,
      isVictory: this.isVictory,
    };

    return {
      tick: this.tickCount,
      snapshot,
      isFinished: this.isGameOver || this.isVictory,
    };
  }

  public end(): any {
    return {
      summary: 'Zombie Survival Match Ended',
      wave: this.wave,
      victory: this.isVictory,
    };
  }

  public destroy(): void {
    this.players.clear();
    this.zombies.clear();
    this.bullets = [];
    this.drops = [];
  }
}
