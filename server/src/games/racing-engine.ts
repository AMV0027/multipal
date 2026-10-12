import {
  ControllerButton,
  ControllerInputPayload,
  PlayerSession,
  RacingGameSnapshot,
  RacingKartState,
  RacingTrackWaypoint,
  SLOT_COLORS,
} from '@multipal/shared-types';
import {
  GameServerConfig,
  GameTickResult,
  IGameServerEngine,
  sanitizeInputVector,
} from '@multipal/game-runtime';

interface KartInternal extends RacingKartState {
  steer: number;
  throttle: number; // 1 = gas, -1 = reverse/brake, 0 = coast
  lastInputSeq: number;
  lapStartTime: number;
}

export class SplitScreenRacingEngine
  implements IGameServerEngine<ControllerInputPayload, RacingGameSnapshot>
{
  private karts = new Map<string, KartInternal>();
  private waypoints: RacingTrackWaypoint[] = [];
  private tickCount: number = 0;
  private isRaceOver: boolean = false;
  private finishRankCounter: number = 1;
  private winnerPlayerId: string | null = null;

  private readonly MAX_SPEED = 380;
  private readonly ACCELERATION = 280;
  private readonly BRAKE_FORCE = 380;
  private readonly TURN_SPEED = 3.2; // rad/s
  private readonly DRAG = 0.985;

  constructor(private config: GameServerConfig) {
    // Grand Prix oval / circuit track waypoints
    this.waypoints = [
      { x: 200, y: 150 },
      { x: 400, y: 120 },
      { x: 650, y: 180 },
      { x: 700, y: 350 },
      { x: 600, y: 480 },
      { x: 350, y: 520 },
      { x: 150, y: 440 },
      { x: 120, y: 280 },
    ];
  }

  public init(players: PlayerSession[]): void {
    this.karts.clear();
    this.isRaceOver = false;
    this.finishRankCounter = 1;
    this.winnerPlayerId = null;

    // Grid starting positions near waypoint 0
    const startGrid = [
      { x: 160, y: 180, angle: 0 },
      { x: 160, y: 220, angle: 0 },
      { x: 120, y: 180, angle: 0 },
      { x: 120, y: 220, angle: 0 },
    ];

    const now = Date.now();
    players.forEach((p) => {
      const sp = startGrid[p.slotIndex % 4];
      this.karts.set(p.id, {
        playerId: p.id,
        slotIndex: p.slotIndex,
        nickname: p.nickname,
        color: SLOT_COLORS[p.slotIndex].primary,
        x: sp.x,
        y: sp.y,
        angle: sp.angle,
        speed: 0,
        currentLap: 1,
        maxLaps: 3,
        currentCheckpoint: 0,
        totalCheckpoints: this.waypoints.length,
        lapTimes: [],
        isFinished: false,
        finishRank: null,
        steer: 0,
        throttle: 0,
        lastInputSeq: 0,
        lapStartTime: now,
      });
    });
  }

  public addPlayer(player: PlayerSession): void {
    if (this.karts.has(player.id)) return;
    this.karts.set(player.id, {
      playerId: player.id,
      slotIndex: player.slotIndex,
      nickname: player.nickname,
      color: SLOT_COLORS[player.slotIndex].primary,
      x: 140,
      y: 200,
      angle: 0,
      speed: 0,
      currentLap: 1,
      maxLaps: 3,
      currentCheckpoint: 0,
      totalCheckpoints: this.waypoints.length,
      lapTimes: [],
      isFinished: false,
      finishRank: null,
      steer: 0,
      throttle: 0,
      lastInputSeq: 0,
      lapStartTime: Date.now(),
    });
  }

  public removePlayer(playerId: string): void {
    this.karts.delete(playerId);
  }

  public start(): void {
    this.tickCount = 0;
  }

  public processInput(playerId: string, input: ControllerInputPayload): void {
    const k = this.karts.get(playerId);
    if (!k || k.isFinished) return;

    if (input.seq && input.seq < k.lastInputSeq) return;
    k.lastInputSeq = input.seq || k.lastInputSeq + 1;

    const [vx, vy] = sanitizeInputVector(input.vector || [0, 0]);
    k.steer = vx; // -1 (left) to 1 (right)

    // Gas & Brake
    const gasPressed = (input.buttons & ControllerButton.A) !== 0 || vy < -0.4;
    const brakePressed = (input.buttons & ControllerButton.B) !== 0 || vy > 0.4;

    if (gasPressed && !brakePressed) {
      k.throttle = 1;
    } else if (brakePressed && !gasPressed) {
      k.throttle = -0.8;
    } else {
      k.throttle = 0;
    }
  }

  public tick(dt: number): GameTickResult<RacingGameSnapshot> {
    this.tickCount++;
    const now = Date.now();

    if (!this.isRaceOver) {
      let allFinished = true;

      for (const k of this.karts.values()) {
        if (!k.isFinished) {
          allFinished = false;

          // Steering rotates the kart depending on speed
          if (Math.abs(k.speed) > 10) {
            const steerFactor = k.speed >= 0 ? 1 : -1;
            k.angle += k.steer * this.TURN_SPEED * steerFactor * dt;
          }

          // Acceleration / braking
          if (k.throttle > 0) {
            k.speed += this.ACCELERATION * k.throttle * dt;
          } else if (k.throttle < 0) {
            k.speed -= this.BRAKE_FORCE * Math.abs(k.throttle) * dt;
          } else {
            // Coasting drag
            k.speed *= Math.pow(this.DRAG, dt * 60);
          }

          // Speed limit
          k.speed = Math.max(-120, Math.min(this.MAX_SPEED, k.speed));

          // Position updates
          k.x += Math.cos(k.angle) * k.speed * dt;
          k.y += Math.sin(k.angle) * k.speed * dt;

          // Waypoint / Checkpoint collision check
          const nextTargetWP = this.waypoints[k.currentCheckpoint];
          if (nextTargetWP) {
            const dist = Math.hypot(k.x - nextTargetWP.x, k.y - nextTargetWP.y);
            if (dist < 90) {
              k.currentCheckpoint = (k.currentCheckpoint + 1) % this.waypoints.length;

              // Completed a lap?
              if (k.currentCheckpoint === 0) {
                const lapSec = (now - k.lapStartTime) / 1000;
                k.lapTimes.push(Math.round(lapSec * 100) / 100);
                k.lapStartTime = now;
                k.currentLap++;

                if (k.currentLap > k.maxLaps) {
                  k.isFinished = true;
                  k.finishRank = this.finishRankCounter++;
                  if (!this.winnerPlayerId) {
                    this.winnerPlayerId = k.playerId;
                  }
                }
              }
            }
          }
        }
      }

      if (this.karts.size > 0 && allFinished) {
        this.isRaceOver = true;
      }
    }

    const snapshot: RacingGameSnapshot = {
      gameId: 'racing',
      tick: this.tickCount,
      timestamp: now,
      trackLength: this.waypoints.length,
      waypoints: this.waypoints,
      karts: Array.from(this.karts.values()).map((k) => ({
        playerId: k.playerId,
        slotIndex: k.slotIndex,
        nickname: k.nickname,
        color: k.color,
        x: Math.round(k.x * 10) / 10,
        y: Math.round(k.y * 10) / 10,
        angle: Math.round(k.angle * 100) / 100,
        speed: Math.round(k.speed),
        currentLap: Math.min(k.currentLap, k.maxLaps),
        maxLaps: k.maxLaps,
        currentCheckpoint: k.currentCheckpoint,
        totalCheckpoints: k.totalCheckpoints,
        lapTimes: k.lapTimes,
        isFinished: k.isFinished,
        finishRank: k.finishRank,
      })),
      isRaceOver: this.isRaceOver,
      winnerPlayerId: this.winnerPlayerId,
    };

    return {
      tick: this.tickCount,
      snapshot,
      isFinished: this.isRaceOver,
    };
  }

  public end(): any {
    return {
      summary: 'Grand Prix Race Ended',
      winnerId: this.winnerPlayerId,
    };
  }

  public destroy(): void {
    this.karts.clear();
  }
}
