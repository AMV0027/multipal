import { describe, it, expect, beforeEach } from 'vitest';
import { RoomManager } from '../src/rooms/room-manager';

describe('RoomManager', () => {
  let roomManager: RoomManager;

  beforeEach(() => {
    roomManager = new RoomManager();
  });

  it('creates a room with a 4-character code and 4 empty slots', () => {
    const room = roomManager.createRoom('host-socket-1');
    expect(room).toBeDefined();
    expect(room.code).toHaveLength(4);
    expect(room.slots).toHaveLength(4);
    expect(room.slots[0].occupied).toBe(false);
    expect(room.status).toBe('LOBBY');
  });

  it('allows up to 4 players to join and assigns unique sequential slots', () => {
    const room = roomManager.createRoom('host-socket-1');

    const p1 = roomManager.joinRoom(room.code, 'Alice', 'socket-p1');
    expect(p1.ok).toBe(true);
    expect(p1.player?.slotIndex).toBe(0);
    expect(p1.player?.nickname).toBe('Alice');

    const p2 = roomManager.joinRoom(room.code, 'Bob', 'socket-p2');
    expect(p2.ok).toBe(true);
    expect(p2.player?.slotIndex).toBe(1);

    const p3 = roomManager.joinRoom(room.code, 'Charlie', 'socket-p3');
    expect(p3.ok).toBe(true);
    expect(p3.player?.slotIndex).toBe(2);

    const p4 = roomManager.joinRoom(room.code, 'Dave', 'socket-p4');
    expect(p4.ok).toBe(true);
    expect(p4.player?.slotIndex).toBe(3);

    // Verify all 4 slots are occupied
    const updatedRoom = roomManager.getRoomByCode(room.code);
    expect(updatedRoom?.slots.every((s) => s.occupied)).toBe(true);
  });

  it('rejects a 5th player when the room is full', () => {
    const room = roomManager.createRoom('host-socket-1');

    for (let i = 1; i <= 4; i++) {
      const res = roomManager.joinRoom(room.code, `Player ${i}`, `socket-${i}`);
      expect(res.ok).toBe(true);
    }

    const p5 = roomManager.joinRoom(room.code, 'Eve', 'socket-5');
    expect(p5.ok).toBe(false);
    expect(p5.error).toContain('Room is full');
  });

  it('allows a disconnected player to reclaim their slot with their sessionToken', () => {
    const room = roomManager.createRoom('host-socket-1');
    const p1 = roomManager.joinRoom(room.code, 'Alice', 'socket-p1');
    expect(p1.ok).toBe(true);
    const token = p1.player!.sessionToken;
    const originalSlot = p1.player!.slotIndex;

    // Simulate disconnect
    roomManager.handlePlayerDisconnect('socket-p1');
    expect(room.players[p1.player!.id].connected).toBe(false);

    // Reconnect with same token on a new socket
    const reconnect = roomManager.joinRoom(room.code, 'Alice', 'new-socket-p1', 'default', token);
    expect(reconnect.ok).toBe(true);
    expect(reconnect.isReconnection).toBe(true);
    expect(reconnect.player?.slotIndex).toBe(originalSlot);
    expect(reconnect.player?.connected).toBe(true);
  });

  it('cleans up the room when the host disconnects', () => {
    const room = roomManager.createRoom('host-socket-1');
    expect(roomManager.getRoomByCode(room.code)).toBeDefined();

    const closed = roomManager.removeHost('host-socket-1');
    expect(closed).toBeDefined();
    expect(closed?.status).toBe('CLOSED');
    expect(roomManager.getRoomByCode(room.code)).toBeUndefined();
  });
});
