import { GameId, ControllerInputPayload, PlayerSession } from '@multipal/shared-types';

export interface GameServerConfig {
  roomId: string;
  onSnapshot: (snapshot: any) => void;
  onEvent: (event: string, payload: any) => void;
  onGameEnd: (results: any) => void;
}

export interface GameTickResult<TState> {
  tick: number;
  snapshot: TState;
  events?: Array<{ type: string; data: any }>;
  isFinished?: boolean;
  results?: any;
}

export interface IGameServerEngine<TInput = ControllerInputPayload, TState = any, TResult = any> {
  init(players: PlayerSession[]): void;
  start(): void;
  processInput(playerId: string, input: TInput): void;
  tick(dt: number): GameTickResult<TState>;
  pause?(): void;
  resume?(): void;
  end(): TResult;
  destroy(): void;
}

export interface IGameDefinition<TInput = ControllerInputPayload, TState = any, TResult = any> {
  id: GameId;
  title: string;
  description: string;
  minPlayers: number;
  maxPlayers: number;
  controllerLayout: 'dual-stick' | 'fighter-pad' | 'racing-wheel' | 'test-pad';
  createServerEngine(config: GameServerConfig): IGameServerEngine<TInput, TState, TResult>;
}

/**
 * High precision fixed-step tick runner for game simulations
 */
export class GameTicker {
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private readonly tickIntervalMs: number;
  private lastTickTime: number = 0;
  private tickCount: number = 0;
  private isRunning: boolean = false;

  constructor(
    public readonly tickRateHz: number = 30,
    private readonly onTick: (dt: number, tick: number) => void
  ) {
    this.tickIntervalMs = 1000 / tickRateHz;
  }

  public start(): void {
    if (this.isRunning) return;
    this.isRunning = true;
    this.lastTickTime = performance.now();
    this.tickCount = 0;

    this.intervalId = setInterval(() => {
      const now = performance.now();
      const dt = (now - this.lastTickTime) / 1000;
      this.lastTickTime = now;
      this.tickCount++;
      this.onTick(dt, this.tickCount);
    }, this.tickIntervalMs);
  }

  public stop(): void {
    if (!this.isRunning) return;
    this.isRunning = false;
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  public get running(): boolean {
    return this.isRunning;
  }
}

/**
 * Clamps a vector to unit circle and validates inputs
 */
export function sanitizeInputVector(vector: [number, number]): [number, number] {
  let [x, y] = vector;
  if (typeof x !== 'number' || isNaN(x)) x = 0;
  if (typeof y !== 'number' || isNaN(y)) y = 0;

  const lenSq = x * x + y * y;
  if (lenSq > 1) {
    const len = Math.sqrt(lenSq);
    return [x / len, y / len];
  }
  return [Math.max(-1, Math.min(1, x)), Math.max(-1, Math.min(1, y))];
}
