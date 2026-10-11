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
  { primary: '#3B82F6', accent: '#60A5FA', name: 'Blue' },   // Slot 1
  { primary: '#EF4444', accent: '#F87171', name: 'Red' },    // Slot 2
  { primary: '#10B981', accent: '#34D399', name: 'Green' },  // Slot 3
  { primary: '#F59E0B', accent: '#FBBF24', name: 'Amber' },  // Slot 4
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
  vector: [number, number]; // [x, y], normalized -1.0 to 1.0
  buttons: number;          // Bitmask: bit 0 = Button A, bit 1 = Button B, bit 2 = Button C
  aimVector?: [number, number]; // Optional 2nd stick [x, y]
}

export enum ControllerButton {
  A = 1 << 0, // 1
  B = 1 << 1, // 2
  C = 1 << 2, // 4
  D = 1 << 3, // 8
}

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
  tick: number;
  timestamp: number;
  entities: TestArenaEntityState[];
}

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
