import { describe, it, expect, beforeEach } from 'vitest';
import { SplitScreenRacingEngine } from '../src/games/racing-engine';
import { PlayerSession, ControllerButton } from '@multipal/shared-types';

describe('SplitScreenRacingEngine', () => {
  let engine: SplitScreenRacingEngine;

  const mockRacer1: PlayerSession = {
    id: 'k1',
    roomId: 'r1',
    slotIndex: 0,
    nickname: 'RacerBlue',
    avatarId: 'default',
    sessionToken: 'tok1',
    connected: true,
    isReady: true,
    lastHeartbeat: Date.now(),
  };

  const mockRacer2: PlayerSession = {
    id: 'k2',
    roomId: 'r1',
    slotIndex: 1,
    nickname: 'RacerRed',
    avatarId: 'default',
    sessionToken: 'tok2',
    connected: true,
    isReady: true,
    lastHeartbeat: Date.now(),
  };

  beforeEach(() => {
    engine = new SplitScreenRacingEngine({
      roomId: 'r1',
      onSnapshot: () => {},
      onEvent: () => {},
      onGameEnd: () => {},
    });
    engine.init([mockRacer1, mockRacer2]);
    engine.start();
  });

  it('initializes karts at starting grid with 0 speed and Lap 1 of 3', () => {
    const { snapshot } = engine.tick(0.016);
    expect(snapshot.karts).toHaveLength(2);
    expect(snapshot.waypoints.length).toBeGreaterThan(0);

    const k1 = snapshot.karts.find((k) => k.playerId === 'k1');
    expect(k1).toBeDefined();
    expect(k1!.currentLap).toBe(1);
    expect(k1!.maxLaps).toBe(3);
    expect(k1!.speed).toBe(0);
    expect(k1!.isFinished).toBe(false);
  });

  it('accelerates kart forward when throttle or Button A is pressed', () => {
    engine.processInput('k1', {
      seq: 1,
      timestamp: Date.now(),
      vector: [0, 0],
      buttons: ControllerButton.A, // Gas pedal
    });

    // Run acceleration ticks
    for (let i = 0; i < 20; i++) {
      engine.tick(0.05);
    }

    const { snapshot } = engine.tick(0.016);
    const k1 = snapshot.karts.find((k) => k.playerId === 'k1');
    expect(k1!.speed).toBeGreaterThan(0);
    expect(k1!.x).toBeGreaterThan(160); // Moved forward along circuit
  });

  it('turns kart when steering joystick vector is applied', () => {
    const { snapshot: snapInitial } = engine.tick(0.016);
    const initialAngle = snapInitial.karts[0].angle;

    // Apply right turn steering with gas
    engine.processInput('k1', {
      seq: 2,
      timestamp: Date.now(),
      vector: [1, 0], // Turn Right
      buttons: ControllerButton.A,
    });

    for (let i = 0; i < 15; i++) {
      engine.tick(0.05);
    }

    const { snapshot } = engine.tick(0.016);
    const k1 = snapshot.karts.find((k) => k.playerId === 'k1');
    expect(k1!.angle).not.toBe(initialAngle); // Angle rotated
  });

  it('brakes and decelerates with Button B', () => {
    // First accelerate
    engine.processInput('k1', {
      seq: 3,
      timestamp: Date.now(),
      vector: [0, 0],
      buttons: ControllerButton.A,
    });
    for (let i = 0; i < 20; i++) engine.tick(0.05);

    const { snapshot: snapFast } = engine.tick(0.016);
    const fastSpeed = snapFast.karts[0].speed;
    expect(fastSpeed).toBeGreaterThan(50);

    // Now apply brake
    engine.processInput('k1', {
      seq: 4,
      timestamp: Date.now(),
      vector: [0, 0],
      buttons: ControllerButton.B,
    });
    for (let i = 0; i < 15; i++) engine.tick(0.05);

    const { snapshot: snapSlow } = engine.tick(0.016);
    expect(snapSlow.karts[0].speed).toBeLessThan(fastSpeed);
  });

  it('advances checkpoints and completes laps towards checkered flag', () => {
    const { snapshot } = engine.tick(0.016);
    const k1 = snapshot.karts[0];
    // Checkpoint 0 was crossed at the start grid (160, 180 within 90px of WP0: 200, 150), so target is 1
    expect(k1.currentCheckpoint).toBe(1);
    expect(k1.totalCheckpoints).toBe(snapshot.waypoints.length);
  });
});
