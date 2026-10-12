import {
  ControllerInputPayload,
  PlayerSession,
  SLOT_COLORS,
  TestArenaEntityState,
  TestArenaSnapshot,
} from '@multipal/shared-types';
import {
  GameServerConfig,
  GameTickResult,
  IGameServerEngine,
  sanitizeInputVector,
} from '@multipal/game-runtime';

interface Entity {
  playerId: string;
  slotIndex: number;
  nickname: string;
  color: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  inputVector: [number, number];
  buttons: number;
  lastInputSeq: number;
}

export class TestArenaEngine implements IGameServerEngine<ControllerInputPayload, TestArenaSnapshot> {
  private entities = new Map<string, Entity>();
  private tickCount: number = 0;
  private readonly ARENA_WIDTH = 800;
  private readonly ARENA_HEIGHT = 600;
  private readonly MOVE_SPEED = 280; // px/sec

  constructor(private config: GameServerConfig) {}

  public init(players: PlayerSession[]): void {
    this.entities.clear();
    const spawnOffsets = [
      { x: 200, y: 200 },
      { x: 600, y: 200 },
      { x: 200, y: 400 },
      { x: 600, y: 400 },
    ];

    players.forEach((player) => {
      const spawn = spawnOffsets[player.slotIndex % 4];
      this.entities.set(player.id, {
        playerId: player.id,
        slotIndex: player.slotIndex,
        nickname: player.nickname,
        color: SLOT_COLORS[player.slotIndex].primary,
        x: spawn.x,
        y: spawn.y,
        vx: 0,
        vy: 0,
        inputVector: [0, 0],
        buttons: 0,
        lastInputSeq: 0,
      });
    });
  }

  public addPlayer(player: PlayerSession): void {
    if (this.entities.has(player.id)) return;
    const spawnOffsets = [
      { x: 200, y: 200 },
      { x: 600, y: 200 },
      { x: 200, y: 400 },
      { x: 600, y: 400 },
    ];
    const spawn = spawnOffsets[player.slotIndex % 4];
    this.entities.set(player.id, {
      playerId: player.id,
      slotIndex: player.slotIndex,
      nickname: player.nickname,
      color: SLOT_COLORS[player.slotIndex].primary,
      x: spawn.x,
      y: spawn.y,
      vx: 0,
      vy: 0,
      inputVector: [0, 0],
      buttons: 0,
      lastInputSeq: 0,
    });
  }

  public removePlayer(playerId: string): void {
    this.entities.delete(playerId);
  }

  public start(): void {
    this.tickCount = 0;
  }

  public processInput(playerId: string, input: ControllerInputPayload): void {
    const entity = this.entities.get(playerId);
    if (!entity) return;

    // Discard stale out-of-order packets
    if (input.seq && input.seq < entity.lastInputSeq) {
      return;
    }
    entity.lastInputSeq = input.seq || entity.lastInputSeq + 1;

    // Sanitize joystick vector
    entity.inputVector = sanitizeInputVector(input.vector || [0, 0]);
    entity.buttons = input.buttons || 0;
  }

  public tick(dt: number): GameTickResult<TestArenaSnapshot> {
    this.tickCount++;

    const entityStates: TestArenaEntityState[] = [];

    for (const entity of this.entities.values()) {
      // Apply input vector to velocity
      const [ix, iy] = entity.inputVector;
      entity.vx = ix * this.MOVE_SPEED;
      entity.vy = iy * this.MOVE_SPEED;

      // Integrate position
      entity.x += entity.vx * dt;
      entity.y += entity.vy * dt;

      // Clamp to arena bounds (radius = 24)
      const radius = 24;
      entity.x = Math.max(radius, Math.min(this.ARENA_WIDTH - radius, entity.x));
      entity.y = Math.max(radius, Math.min(this.ARENA_HEIGHT - radius, entity.y));

      entityStates.push({
        playerId: entity.playerId,
        slotIndex: entity.slotIndex,
        nickname: entity.nickname,
        color: entity.color,
        x: Math.round(entity.x * 10) / 10,
        y: Math.round(entity.y * 10) / 10,
        vx: Math.round(entity.vx * 10) / 10,
        vy: Math.round(entity.vy * 10) / 10,
        lastButtonMask: entity.buttons,
        ping: 0,
      });
    }

    const snapshot: TestArenaSnapshot = {
      gameId: 'test-arena',
      tick: this.tickCount,
      timestamp: Date.now(),
      entities: entityStates,
    };

    return {
      tick: this.tickCount,
      snapshot,
    };
  }

  public end(): any {
    return { summary: 'Test Arena Session Finished' };
  }

  public destroy(): void {
    this.entities.clear();
  }
}
