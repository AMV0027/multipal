import { describe, it, expect, beforeEach } from 'vitest';
import { TestArenaEngine } from '../src/games/test-arena-engine';
import { PlayerSession } from '@multipal/shared-types';

describe('TestArenaEngine', () => {
  let engine: TestArenaEngine;

  const mockPlayer1: PlayerSession = {
    id: 'p1',
    roomId: 'r1',
    slotIndex: 0,
    nickname: 'Alice',
    avatarId: 'default',
    sessionToken: 'tok1',
    connected: true,
    isReady: true,
    lastHeartbeat: Date.now(),
  };

  beforeEach(() => {
    engine = new TestArenaEngine({
      roomId: 'r1',
      onSnapshot: () => {},
      onEvent: () => {},
      onGameEnd: () => {},
    });
    engine.init([mockPlayer1]);
  });

  it('initializes player at correct spawn location with slot color', () => {
    const { snapshot } = engine.tick(0.016);
    expect(snapshot.entities).toHaveLength(1);
    const p1 = snapshot.entities[0];
    expect(p1.playerId).toBe('p1');
    expect(p1.slotIndex).toBe(0);
    expect(p1.color).toBe('#245BFF'); // Slot 1 Arcade Blue
    expect(p1.x).toBe(200);
    expect(p1.y).toBe(200);
  });

  it('updates velocity and position based on controller inputs', () => {
    // Process full right joystick [1, 0]
    engine.processInput('p1', {
      seq: 1,
      timestamp: Date.now(),
      vector: [1, 0],
      buttons: 1,
    });

    // Tick for 0.5 seconds at speed 280 px/sec
    const { snapshot } = engine.tick(0.5);
    const p1 = snapshot.entities[0];
    expect(p1.vx).toBe(280);
    expect(p1.vy).toBe(0);
    expect(p1.x).toBe(200 + 140); // 340
    expect(p1.y).toBe(200);
    expect(p1.lastButtonMask).toBe(1);
  });

  it('clamps movement to stay strictly inside the 800x600 arena bounds', () => {
    // Drive continuously left beyond boundary
    engine.processInput('p1', {
      seq: 1,
      timestamp: Date.now(),
      vector: [-1, 0],
      buttons: 0,
    });

    // Tick for 10 seconds (would move 2800px left without boundary)
    const { snapshot } = engine.tick(10);
    const p1 = snapshot.entities[0];
    expect(p1.x).toBe(24); // Clamped at radius 24
  });

  it('rejects stale out-of-order input sequence numbers', () => {
    engine.processInput('p1', {
      seq: 5,
      timestamp: Date.now(),
      vector: [1, 0],
      buttons: 0,
    });

    // Stale sequence packet (seq 3 < 5)
    engine.processInput('p1', {
      seq: 3,
      timestamp: Date.now(),
      vector: [0, 1],
      buttons: 0,
    });

    // Velocity should remain rightward from seq 5
    const { snapshot } = engine.tick(0.1);
    const p1 = snapshot.entities[0];
    expect(p1.vx).toBe(280);
    expect(p1.vy).toBe(0);
  });
});
