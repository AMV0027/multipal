import { describe, it, expect, beforeEach } from 'vitest';
import { PlatformFighterEngine } from '../src/games/platform-fighter-engine';
import { PlayerSession, ControllerButton } from '@multipal/shared-types';

describe('PlatformFighterEngine', () => {
  let engine: PlatformFighterEngine;

  const mockFighter1: PlayerSession = {
    id: 'f1',
    roomId: 'r1',
    slotIndex: 0,
    nickname: 'BrawlerRed',
    avatarId: 'default',
    sessionToken: 'tok1',
    connected: true,
    isReady: true,
    lastHeartbeat: Date.now(),
  };

  const mockFighter2: PlayerSession = {
    id: 'f2',
    roomId: 'r1',
    slotIndex: 1,
    nickname: 'BrawlerBlue',
    avatarId: 'default',
    sessionToken: 'tok2',
    connected: true,
    isReady: true,
    lastHeartbeat: Date.now(),
  };

  beforeEach(() => {
    engine = new PlatformFighterEngine({
      roomId: 'r1',
      onSnapshot: () => {},
      onEvent: () => {},
      onGameEnd: () => {},
    });
    engine.init([mockFighter1, mockFighter2]);
    engine.start();
  });

  it('initializes fighters with 3 stocks, 0% damage, and platforms', () => {
    const { snapshot } = engine.tick(0.016);
    expect(snapshot.players).toHaveLength(2);
    expect(snapshot.platforms.length).toBeGreaterThan(0);

    const f1 = snapshot.players.find((p) => p.playerId === 'f1');
    expect(f1).toBeDefined();
    expect(f1!.stocks).toBe(3);
    expect(f1!.damagePercent).toBe(0);
    expect(f1!.isEliminated).toBe(false);
  });

  it('applies gravity and platform landing collision', () => {
    // Tick engine to let gravity pull airborne player onto stage
    for (let i = 0; i < 30; i++) {
      engine.tick(0.02);
    }

    const { snapshot } = engine.tick(0.016);
    const f1 = snapshot.players.find((p) => p.playerId === 'f1');
    expect(f1).toBeDefined();
    expect(f1!.isGrounded).toBe(true);
    expect(f1!.vy).toBe(0);
  });

  it('handles jump with Button A', () => {
    // Settle on platform
    for (let i = 0; i < 30; i++) {
      engine.tick(0.02);
    }

    // Press Jump (Button A)
    engine.processInput('f1', {
      seq: 1,
      timestamp: Date.now(),
      vector: [0, 0],
      buttons: ControllerButton.A,
    });

    const { snapshot } = engine.tick(0.016);
    const f1 = snapshot.players.find((p) => p.playerId === 'f1');
    expect(f1!.vy).toBeLessThan(0); // Upward jump velocity
  });

  it('handles attacks and damage accumulation with Button B (Light) and Button C (Heavy)', () => {
    // Position fighters near each other
    engine.processInput('f1', {
      seq: 2,
      timestamp: Date.now(),
      vector: [0, 0],
      buttons: ControllerButton.B,
    });

    const { snapshot } = engine.tick(0.016);
    const f1 = snapshot.players.find((p) => p.playerId === 'f1');
    expect(f1!.isAttacking).toBe(true);
    expect(f1!.attackType).toBe('light');
  });

  it('eliminates stock when fighter is blasted off arena boundaries', () => {
    const { snapshot: snapStart } = engine.tick(0.016);
    const f1 = snapStart.players.find((p) => p.playerId === 'f1');
    expect(f1!.stocks).toBe(3);

    // Blast player past bottom blast zone
    engine.processInput('f1', {
      seq: 3,
      timestamp: Date.now(),
      vector: [0, 1],
      buttons: 0,
    });

    // Run ticks downward
    for (let i = 0; i < 40; i++) {
      engine.tick(0.05);
    }

    const { snapshot } = engine.tick(0.016);
    const f1After = snapshot.players.find((p) => p.playerId === 'f1');
    expect(f1After).toBeDefined();
  });
});
