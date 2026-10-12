/**
 * MultiPal Shared Types and Network Protocol
 */

export type GameId = 'zombie-survival' | 'platform-fighter' | 'racing' | 'test-arena';

export type RoomStatus = 'LOBBY' | 'STARTING' | 'PLAYING' | 'RESULTS' | 'CLOSED';

export type SlotColor = {
  primary: string;
  accent: string;
  name: string;
};

export const SLOT_COLORS: readonly SlotColor[] = [
  { primary: '#245BFF', accent: '#00E5FF', name: 'Arcade Blue' },   // Slot 1
  { primary: '#FF2E88', accent: '#FF4268', name: 'Hot Pink' },      // Slot 2
  { primary: '#35E58A', accent: '#00E5FF', name: 'Neon Green' },    // Slot 3
  { primary: '#FFD400', accent: '#FF6B00', name: 'Electric Gold' }, // Slot 4
] as const;

export interface PlayerSlot {
  slotIndex: number; // 0, 1, 2, 3
  label: string;     // 'Player 1', 'Player 2', etc.
  color: SlotColor;
  occupied: boolean;
  playerId: string | null;
}

export interface PlayerSession {
  id: string;
  roomId: string;
  slotIndex: number;
  nickname: string;
  avatarId: string;
  sessionToken: string;
  connected: boolean;
  isReady: boolean;
  lastHeartbeat: number;
}

export interface Room {
  id: string;
  code: string; // 4-char uppercase code (e.g. 'K9X2')
  hostSocketId: string;
  selectedGameId: GameId;
  status: RoomStatus;
  slots: PlayerSlot[];
  players: Record<string, PlayerSession>;
  createdAt: number;
  expiresAt: number;
}

export interface ControllerInputPayload {
  seq: number;
  timestamp: number;
  vector: [number, number]; // [x, y], normalized -1.0 to 1.0 (Move/Steer)
  buttons: number;          // Bitmask: bit 0 = A, bit 1 = B, bit 2 = C, bit 3 = D
  aimVector?: [number, number]; // Optional 2nd stick [x, y] (Aim/Shoot)
}

export enum ControllerButton {
  A = 1 << 0, // 1 (Fire / Jump / Gas)
  B = 1 << 1, // 2 (Bomb / Attack / Brake)
  C = 1 << 2, // 4 (Revive / Special / Drift)
  D = 1 << 3, // 8 (Dodge / Item / Boost)
}

/* =========================================================
 * 1. TEST ARENA PROTOCOL
 * ========================================================= */
export interface TestArenaEntityState {
  playerId: string;
  slotIndex: number;
  nickname: string;
  color: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  lastButtonMask: number;
  ping: number;
}

export interface TestArenaSnapshot {
  gameId: 'test-arena';
  tick: number;
  timestamp: number;
  entities: TestArenaEntityState[];
}

/* =========================================================
 * 2. ZOMBIE SURVIVAL PROTOCOL (PRD 02)
 * ========================================================= */
export type ZombieType = 'walker' | 'runner' | 'brute' | 'boss';

export interface ZombieEntity {
  id: string;
  type: ZombieType;
  x: number;
  y: number;
  hp: number;
  maxHp: number;
  speed: number;
  targetPlayerId: string | null;
}

export interface ZombieBullet {
  id: string;
  playerId: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
}

export interface ZombieDrop {
  id: string;
  type: 'health' | 'ammo' | 'speed_boost' | 'nuke';
  x: number;
  y: number;
}

export interface ZombiePlayerState {
  playerId: string;
  slotIndex: number;
  nickname: string;
  color: string;
  x: number;
  y: number;
  aimAngle: number;
  hp: number;
  maxHp: number;
  score: number;
  kills: number;
  isDowned: boolean;
  reviveProgress: number; // 0 to 100
  ammo: number;
}

export interface ZombieSurvivalSnapshot {
  gameId: 'zombie-survival';
  tick: number;
  timestamp: number;
  wave: number;
  waveTimeRemaining: number;
  isWaveIntermission: boolean;
  players: ZombiePlayerState[];
  zombies: ZombieEntity[];
  bullets: ZombieBullet[];
  drops: ZombieDrop[];
  isGameOver: boolean;
  isVictory: boolean;
}

/* =========================================================
 * 3. PLATFORM FIGHTER PROTOCOL (PRD 03)
 * ========================================================= */
export interface FighterPlatform {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  isOneWay?: boolean;
}

export interface FighterPlayerState {
  playerId: string;
  slotIndex: number;
  nickname: string;
  color: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  facing: 1 | -1;
  stocks: number; // starts at 3
  damagePercent: number; // 0% up to 999%
  isGrounded: boolean;
  isAttacking: boolean;
  attackType: 'none' | 'light' | 'heavy' | 'special';
  attackCooldown: number;
  invincibleFrames: number;
  isEliminated: boolean;
}

export interface PlatformFighterSnapshot {
  gameId: 'platform-fighter';
  tick: number;
  timestamp: number;
  timeRemainingSec: number;
  platforms: FighterPlatform[];
  players: FighterPlayerState[];
  isGameOver: boolean;
  winnerSlotIndex: number | null;
}

/* =========================================================
 * 4. SPLIT-SCREEN RACING PROTOCOL (PRD 04)
 * ========================================================= */
export interface RacingKartState {
  playerId: string;
  slotIndex: number;
  nickname: string;
  color: string;
  x: number;
  y: number;
  angle: number; // in radians
  speed: number;
  currentLap: number; // 1, 2, 3
  maxLaps: number;    // default 3
  currentCheckpoint: number;
  totalCheckpoints: number;
  lapTimes: number[]; // seconds per lap
  isFinished: boolean;
  finishRank: number | null; // 1st, 2nd, 3rd, 4th
}

export interface RacingTrackWaypoint {
  x: number;
  y: number;
}

export interface RacingGameSnapshot {
  gameId: 'racing';
  tick: number;
  timestamp: number;
  trackLength: number;
  waypoints: RacingTrackWaypoint[];
  karts: RacingKartState[];
  isRaceOver: boolean;
  winnerPlayerId: string | null;
}

/* Union Game Snapshot */
export type GameStateSnapshot =
  | TestArenaSnapshot
  | ZombieSurvivalSnapshot
  | PlatformFighterSnapshot
  | RacingGameSnapshot;

export interface JoinRoomPayload {
  code: string;
  nickname: string;
  avatarId?: string;
  sessionToken?: string;
}

export interface JoinRoomResponse {
  ok: boolean;
  player?: PlayerSession;
  room?: Room;
  error?: string;
}

export interface CreateRoomResponse {
  ok: boolean;
  room?: Room;
  error?: string;
}
