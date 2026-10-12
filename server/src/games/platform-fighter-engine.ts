import {
  ControllerButton,
  ControllerInputPayload,
  FighterPlatform,
  FighterPlayerState,
  PlatformFighterSnapshot,
  PlayerSession,
  SLOT_COLORS,
} from '@multipal/shared-types';
import {
  GameServerConfig,
  GameTickResult,
  IGameServerEngine,
  sanitizeInputVector,
} from '@multipal/game-runtime';

interface FighterInternal extends FighterPlayerState {
  inputVector: [number, number];
  buttons: number;
  lastButtons: number;
  lastInputSeq: number;
  jumpsRemaining: number;
}

export class PlatformFighterEngine
  implements IGameServerEngine<ControllerInputPayload, PlatformFighterSnapshot>
{
  private players = new Map<string, FighterInternal>();
  private platforms: FighterPlatform[] = [];
  private tickCount: number = 0;
  private timeRemainingSec: number = 180; // 3-minute match
  private isGameOver: boolean = false;
  private winnerSlotIndex: number | null = null;

  private readonly ARENA_WIDTH = 800;
  private readonly ARENA_HEIGHT = 600;
  private readonly GRAVITY = 1100; // px/s^2
  private readonly JUMP_FORCE = -480;
  private readonly MOVE_SPEED = 320;

  constructor(private config: GameServerConfig) {
    // Arena platforms
    this.platforms = [
      // Main central stage
      { id: 'p_main', x: 200, y: 440, width: 400, height: 24, isOneWay: false },
      // Left elevated ledge
      { id: 'p_left', x: 120, y: 310, width: 140, height: 16, isOneWay: true },
      // Right elevated ledge
      { id: 'p_right', x: 540, y: 310, width: 140, height: 16, isOneWay: true },
      // Top platform
      { id: 'p_top', x: 330, y: 200, width: 140, height: 16, isOneWay: true },
    ];
  }

  public init(players: PlayerSession[]): void {
    this.players.clear();
    this.timeRemainingSec = 180;
    this.isGameOver = false;
    this.winnerSlotIndex = null;

    const spawns = [
      { x: 260, y: 360 },
      { x: 540, y: 360 },
      { x: 160, y: 240 },
      { x: 620, y: 240 },
    ];

    players.forEach((p) => {
      const sp = spawns[p.slotIndex % 4];
      this.players.set(p.id, {
        playerId: p.id,
        slotIndex: p.slotIndex,
        nickname: p.nickname,
        color: SLOT_COLORS[p.slotIndex].primary,
        x: sp.x,
        y: sp.y,
        vx: 0,
        vy: 0,
        facing: p.slotIndex % 2 === 0 ? 1 : -1,
        stocks: 3,
        damagePercent: 0,
        isGrounded: false,
        isAttacking: false,
        attackType: 'none',
        attackCooldown: 0,
        invincibleFrames: 60,
        isEliminated: false,
        inputVector: [0, 0],
        buttons: 0,
        lastButtons: 0,
        lastInputSeq: 0,
        jumpsRemaining: 2,
      });
    });
  }

  public addPlayer(player: PlayerSession): void {
    if (this.players.has(player.id)) return;
    this.players.set(player.id, {
      playerId: player.id,
      slotIndex: player.slotIndex,
      nickname: player.nickname,
      color: SLOT_COLORS[player.slotIndex].primary,
      x: 400,
      y: 200,
      vx: 0,
      vy: 0,
      facing: 1,
      stocks: 3,
      damagePercent: 0,
      isGrounded: false,
      isAttacking: false,
      attackType: 'none',
      attackCooldown: 0,
      invincibleFrames: 60,
      isEliminated: false,
      inputVector: [0, 0],
      buttons: 0,
      lastButtons: 0,
      lastInputSeq: 0,
      jumpsRemaining: 2,
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

    p.lastButtons = p.buttons;
    p.inputVector = sanitizeInputVector(input.vector || [0, 0]);
    p.buttons = input.buttons || 0;
  }

  public tick(dt: number): GameTickResult<PlatformFighterSnapshot> {
    this.tickCount++;

    if (!this.isGameOver) {
      this.timeRemainingSec = Math.max(0, this.timeRemainingSec - dt);

      // Check remaining stocks
      let alivePlayers = 0;
      let lastSurvivorSlot: number | null = null;
      for (const p of this.players.values()) {
        if (!p.isEliminated) {
          alivePlayers++;
          lastSurvivorSlot = p.slotIndex;
        }
      }

      if (this.players.size > 1 && alivePlayers <= 1) {
        this.isGameOver = true;
        this.winnerSlotIndex = lastSurvivorSlot;
      } else if (this.timeRemainingSec <= 0) {
        this.isGameOver = true;
        // Tiebreak: player with most stocks and lowest damage
        let minDamage = Infinity;
        let maxStocks = -1;
        for (const p of this.players.values()) {
          if (p.stocks > maxStocks || (p.stocks === maxStocks && p.damagePercent < minDamage)) {
            maxStocks = p.stocks;
            minDamage = p.damagePercent;
            this.winnerSlotIndex = p.slotIndex;
          }
        }
      }

      // Physics & Combat loop
      for (const p of this.players.values()) {
        if (p.isEliminated) continue;

        if (p.invincibleFrames > 0) p.invincibleFrames--;
        if (p.attackCooldown > 0) p.attackCooldown -= dt;
        else p.isAttacking = false;

        // Jump trigger (Button A fresh press or Up on stick)
        const jumpPressed =
          ((p.buttons & ControllerButton.A) !== 0 && (p.lastButtons & ControllerButton.A) === 0) ||
          (p.inputVector[1] < -0.6);

        if (jumpPressed && p.jumpsRemaining > 0) {
          p.vy = this.JUMP_FORCE;
          p.jumpsRemaining--;
          p.isGrounded = false;
        }

        // Horizontal velocity
        const targetVx = p.inputVector[0] * this.MOVE_SPEED;
        p.vx += (targetVx - p.vx) * Math.min(1, 15 * dt);
        if (Math.abs(p.inputVector[0]) > 0.1) {
          p.facing = p.inputVector[0] > 0 ? 1 : -1;
        }

        // Apply Gravity
        p.vy += this.GRAVITY * dt;

        // Position integration
        p.x += p.vx * dt;
        p.y += p.vy * dt;

        // Platform collisions
        p.isGrounded = false;
        const playerBottom = p.y + 18;
        const playerLeft = p.x - 14;
        const playerRight = p.x + 14;

        for (const plat of this.platforms) {
          if (
            playerRight > plat.x &&
            playerLeft < plat.x + plat.width &&
            p.vy >= 0 &&
            playerBottom >= plat.y &&
            playerBottom - p.vy * dt <= plat.y + 10
          ) {
            p.y = plat.y - 18;
            p.vy = 0;
            p.isGrounded = true;
            p.jumpsRemaining = 2; // Restore double jump
            break;
          }
        }

        // Attacks: Button B (Light Attack), Button C (Heavy Attack)
        const lightPressed = (p.buttons & ControllerButton.B) !== 0 && (p.lastButtons & ControllerButton.B) === 0;
        const heavyPressed = (p.buttons & ControllerButton.C) !== 0 && (p.lastButtons & ControllerButton.C) === 0;

        if ((lightPressed || heavyPressed) && p.attackCooldown <= 0) {
          p.isAttacking = true;
          p.attackType = lightPressed ? 'light' : 'heavy';
          p.attackCooldown = lightPressed ? 0.25 : 0.55;

          // Hitbox detection
          const attackBox = {
            x: p.facing === 1 ? p.x + 10 : p.x - 50,
            y: p.y - 20,
            w: 40,
            h: 36,
          };

          for (const target of this.players.values()) {
            if (target.playerId === p.playerId || target.isEliminated || target.invincibleFrames > 0) continue;

            if (
              target.x > attackBox.x &&
              target.x < attackBox.x + attackBox.w &&
              target.y > attackBox.y &&
              target.y < attackBox.y + attackBox.h
            ) {
              const baseDmg = lightPressed ? 8 : 18;
              target.damagePercent += baseDmg;

              // Knockback math based on accumulated damage percentage
              const knockMultiplier = 1 + target.damagePercent / 45;
              const launchDirX = p.facing;
              const launchDirY = lightPressed ? -0.4 : -0.7;

              target.vx = launchDirX * (lightPressed ? 320 : 540) * knockMultiplier;
              target.vy = launchDirY * (lightPressed ? 280 : 480) * knockMultiplier;
              target.isGrounded = false;
            }
          }
        }

        // Blast zones checking
        const BLAST_LEFT = -60;
        const BLAST_RIGHT = this.ARENA_WIDTH + 60;
        const BLAST_TOP = -100;
        const BLAST_BOTTOM = this.ARENA_HEIGHT + 80;

        if (p.x < BLAST_LEFT || p.x > BLAST_RIGHT || p.y < BLAST_TOP || p.y > BLAST_BOTTOM) {
          // Player Ring Out!
          p.stocks--;
          if (p.stocks <= 0) {
            p.isEliminated = true;
            p.stocks = 0;
          } else {
            // Respawn with invulnerability
            p.x = 400;
            p.y = 160;
            p.vx = 0;
            p.vy = 0;
            p.damagePercent = 0;
            p.invincibleFrames = 90; // 3 seconds at 30Hz
          }
        }
      }
    }

    const snapshot: PlatformFighterSnapshot = {
      gameId: 'platform-fighter',
      tick: this.tickCount,
      timestamp: Date.now(),
      timeRemainingSec: Math.round(this.timeRemainingSec),
      platforms: this.platforms,
      players: Array.from(this.players.values()).map((p) => ({
        playerId: p.playerId,
        slotIndex: p.slotIndex,
        nickname: p.nickname,
        color: p.color,
        x: Math.round(p.x * 10) / 10,
        y: Math.round(p.y * 10) / 10,
        vx: Math.round(p.vx * 10) / 10,
        vy: Math.round(p.vy * 10) / 10,
        facing: p.facing,
        stocks: p.stocks,
        damagePercent: Math.round(p.damagePercent),
        isGrounded: p.isGrounded,
        isAttacking: p.isAttacking,
        attackType: p.attackType,
        attackCooldown: Math.round(p.attackCooldown * 10) / 10,
        invincibleFrames: p.invincibleFrames,
        isEliminated: p.isEliminated,
      })),
      isGameOver: this.isGameOver,
      winnerSlotIndex: this.winnerSlotIndex,
    };

    return {
      tick: this.tickCount,
      snapshot,
      isFinished: this.isGameOver,
    };
  }

  public end(): any {
    return {
      summary: 'Platform Fighter Match Ended',
      winnerSlot: this.winnerSlotIndex,
    };
  }

  public destroy(): void {
    this.players.clear();
  }
}
