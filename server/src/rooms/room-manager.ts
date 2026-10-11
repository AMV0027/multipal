import { Room, PlayerSession, PlayerSlot, SLOT_COLORS, GameId } from '@multipal/shared-types';
import { nanoid } from 'nanoid';

// Unambiguous character set for short room codes (removes 0, O, 1, I, L)
const ROOM_CODE_ALPHABET = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';

export function generateRoomCode(): string {
  let code = '';
  for (let i = 0; i < 4; i++) {
    const randomIndex = Math.floor(Math.random() * ROOM_CODE_ALPHABET.length);
    code += ROOM_CODE_ALPHABET[randomIndex];
  }
  return code;
}

export interface JoinResult {
  ok: boolean;
  player?: PlayerSession;
  room?: Room;
  error?: string;
  isReconnection?: boolean;
}

export class RoomManager {
  private roomsByCode = new Map<string, Room>();
  private roomsById = new Map<string, Room>();
  private playerSockets = new Map<string, { roomId: string; playerId: string }>();
  private hostSockets = new Map<string, string>(); // hostSocketId -> roomId
  private cleanupTimers = new Map<string, NodeJS.Timeout>(); // playerId -> timeout

  public createRoom(hostSocketId: string, initialGameId: GameId = 'zombie-survival'): Room {
    // Generate unique 4-character code
    let code = generateRoomCode();
    let attempts = 0;
    while (this.roomsByCode.has(code) && attempts < 100) {
      code = generateRoomCode();
      attempts++;
    }

    const roomId = nanoid();
    const now = Date.now();

    const slots: PlayerSlot[] = [0, 1, 2, 3].map((index) => ({
      slotIndex: index,
      label: `Player ${index + 1}`,
      color: SLOT_COLORS[index],
      occupied: false,
      playerId: null,
    }));

    const room: Room = {
      id: roomId,
      code,
      hostSocketId,
      selectedGameId: initialGameId,
      status: 'LOBBY',
      slots,
      players: {},
      createdAt: now,
      expiresAt: now + 2 * 60 * 60 * 1000, // 2 hours expiry
    };

    this.roomsByCode.set(code, room);
    this.roomsById.set(roomId, room);
    this.hostSockets.set(hostSocketId, roomId);

    return room;
  }

  public getRoomByCode(code: string): Room | undefined {
    return this.roomsByCode.get(code.toUpperCase().trim());
  }

  public getRoomById(id: string): Room | undefined {
    return this.roomsById.get(id);
  }

  public getRoomByHostSocket(hostSocketId: string): Room | undefined {
    const roomId = this.hostSockets.get(hostSocketId);
    return roomId ? this.roomsById.get(roomId) : undefined;
  }

  public getPlayerBySocket(socketId: string): { room: Room; player: PlayerSession } | undefined {
    const mapping = this.playerSockets.get(socketId);
    if (!mapping) return undefined;
    const room = this.roomsById.get(mapping.roomId);
    if (!room) return undefined;
    const player = room.players[mapping.playerId];
    if (!player) return undefined;
    return { room, player };
  }

  public joinRoom(
    code: string,
    nickname: string,
    socketId: string,
    avatarId: string = 'default',
    sessionToken?: string
  ): JoinResult {
    const room = this.getRoomByCode(code);
    if (!room) {
      return { ok: false, error: 'Room not found. Please check the room code.' };
    }

    if (room.status === 'CLOSED') {
      return { ok: false, error: 'This room has already been closed.' };
    }

    // 1. Reconnection Check: Does sessionToken match an existing player?
    if (sessionToken) {
      const existingPlayer = Object.values(room.players).find(
        (p) => p.sessionToken === sessionToken
      );

      if (existingPlayer) {
        // Cancel pending abandon timer if any
        const timer = this.cleanupTimers.get(existingPlayer.id);
        if (timer) {
          clearTimeout(timer);
          this.cleanupTimers.delete(existingPlayer.id);
        }

        // Reconnect player
        existingPlayer.connected = true;
        existingPlayer.lastHeartbeat = Date.now();
        if (nickname && nickname.trim()) {
          existingPlayer.nickname = nickname.trim();
        }

        // Update slot occupancy
        room.slots[existingPlayer.slotIndex].occupied = true;
        room.slots[existingPlayer.slotIndex].playerId = existingPlayer.id;

        this.playerSockets.set(socketId, { roomId: room.id, playerId: existingPlayer.id });

        return {
          ok: true,
          player: existingPlayer,
          room,
          isReconnection: true,
        };
      }
    }

    // 2. New Join: Check capacity (Max 4 players)
    const availableSlot = room.slots.find((s) => !s.occupied && s.playerId === null);
    if (!availableSlot) {
      return { ok: false, error: 'Room is full (Maximum 4 players).' };
    }

    const playerId = nanoid();
    const token = sessionToken || nanoid(24);
    const cleanedName = nickname.trim().slice(0, 15) || `Player ${availableSlot.slotIndex + 1}`;

    const newPlayer: PlayerSession = {
      id: playerId,
      roomId: room.id,
      slotIndex: availableSlot.slotIndex,
      nickname: cleanedName,
      avatarId,
      sessionToken: token,
      connected: true,
      isReady: false,
      lastHeartbeat: Date.now(),
    };

    availableSlot.occupied = true;
    availableSlot.playerId = playerId;
    room.players[playerId] = newPlayer;

    this.playerSockets.set(socketId, { roomId: room.id, playerId });

    return {
      ok: true,
      player: newPlayer,
      room,
      isReconnection: false,
    };
  }

  public setPlayerReady(socketId: string, isReady: boolean): { room: Room; player: PlayerSession } | undefined {
    const data = this.getPlayerBySocket(socketId);
    if (!data) return undefined;
    data.player.isReady = isReady;
    return data;
  }

  public setRoomStatus(roomId: string, status: Room['status']): Room | undefined {
    const room = this.roomsById.get(roomId);
    if (room) {
      room.status = status;
    }
    return room;
  }

  public setSelectedGame(roomId: string, gameId: GameId): Room | undefined {
    const room = this.roomsById.get(roomId);
    if (room) {
      room.selectedGameId = gameId;
    }
    return room;
  }

  public handlePlayerDisconnect(socketId: string, gracePeriodMs: number = 30000): { room: Room; player: PlayerSession } | undefined {
    const data = this.getPlayerBySocket(socketId);
    if (!data) return undefined;

    const { room, player } = data;
    player.connected = false;
    this.playerSockets.delete(socketId);

    // Schedule slot release if reconnection doesn't happen within grace period
    const timer = setTimeout(() => {
      this.cleanupTimers.delete(player.id);
      if (!player.connected) {
        // Release slot if player never reconnected
        if (room.slots[player.slotIndex]) {
          room.slots[player.slotIndex].occupied = false;
          room.slots[player.slotIndex].playerId = null;
        }
        delete room.players[player.id];
      }
    }, gracePeriodMs);

    this.cleanupTimers.set(player.id, timer);
    return { room, player };
  }

  public removeHost(hostSocketId: string): Room | undefined {
    const roomId = this.hostSockets.get(hostSocketId);
    if (!roomId) return undefined;

    const room = this.roomsById.get(roomId);
    if (!room) return undefined;

    room.status = 'CLOSED';

    // Cleanup mappings
    this.hostSockets.delete(hostSocketId);
    this.roomsByCode.delete(room.code);
    this.roomsById.delete(roomId);

    // Clean up players in room
    for (const player of Object.values(room.players)) {
      const timer = this.cleanupTimers.get(player.id);
      if (timer) {
        clearTimeout(timer);
        this.cleanupTimers.delete(player.id);
      }
    }

    return room;
  }

  public getRoomCount(): number {
    return this.roomsById.size;
  }
}
