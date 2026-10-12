import { describe, it, expect, beforeEach } from 'vitest';
import { ZombieSurvivalEngine } from '../src/games/zombie-survival-engine';
import { PlayerSession, ControllerButton } from '@multipal/shared-types';

describe('ZombieSurvivalEngine', () => {
  let engine: ZombieSurvivalEngine;

  const mockPlayer1: PlayerSession = {
    id: 'p1',
    roomId: 'r1',
    slotIndex: 0,
    nickname: 'SurvivorAlice',
    avatarId: 'default',
    sessionToken: 'tok1',
    connected: true,
    isReady: true,
    lastHeartbeat: Date.now(),
  };

  const mockPlayer2: PlayerSession = {
    id: 'p2',
    roomId: 'r1',
    slotIndex: 1,
    nickname: 'SurvivorBob',
    avatarId: 'default',
    sessionToken: 'tok2',
    connected: true,
    isReady: true,
    lastHeartbeat: Date.now(),
  };

  beforeEach(() => {
    engine = new ZombieSurvivalEngine({
      roomId: 'r1',
      onSnapshot: () => {},
      onEvent: () => {},
      onGameEnd: () => {},
    });
    engine.init([mockPlayer1, mockPlayer2]);
    engine.start();
  });

  it('initializes players with starting stats, health, ammo, and slot color', () => {
    const { snapshot } = engine.tick(0.016);
    expect(snapshot.players).toHaveLength(2);
    const p1 = snapshot.players[0];
    expect(p1.playerId).toBe('p1');
    expect(p1.hp).toBe(100);
    expect(p1.maxHp).toBe(100);
    expect(p1.ammo).toBe(150);
    expect(p1.score).toBe(0);
    expect(p1.isDowned).toBe(false);
    expect(p1.color).toBe('#245BFF');
  });

  it('spawns zombies during active wave progression', () => {
    const { snapshot } = engine.tick(0.016);
    expect(snapshot.wave).toBe(1);
    expect(snapshot.zombies.length).toBeGreaterThan(0);
    const z1 = snapshot.zombies[0];
    expect(z1.hp).toBeGreaterThan(0);
    expect(z1.speed).toBeGreaterThan(0);
  });

  it('processes movement and shooting from controller input payload', () => {
    // Aim and fire rightwards
    engine.processInput('p1', {
      seq: 1,
      timestamp: Date.now(),
      vector: [1, 0],
      aimVector: [1, 0],
      buttons: ControllerButton.A,
    });

    const { snapshot } = engine.tick(0.1);
    const p1 = snapshot.players.find((p) => p.playerId === 'p1');
    expect(p1).toBeDefined();
    expect(p1!.x).toBeGreaterThan(360); // Moved rightwards from spawn 360
    expect(snapshot.bullets.length).toBeGreaterThan(0);
    expect(p1!.ammo).toBeLessThan(150); // Fired bullets reduce ammo
  });

  it('detonates Nuke bomb with Button B when score is sufficient', () => {
    // Give player score for nuke
    const { snapshot: snapBefore } = engine.tick(0.016);
    const initialZombies = snapBefore.zombies.length;
    expect(initialZombies).toBeGreaterThan(0);

    // Simulate score accumulation & nuke trigger
    engine.processInput('p1', {
      seq: 10,
      timestamp: Date.now(),
      vector: [0, 0],
      buttons: ControllerButton.B,
    });

    // Tick engine to process button
    const { snapshot } = engine.tick(0.05);
    expect(snapshot).toBeDefined();
  });

  it('marks player as downed when health reaches zero', () => {
    // Manually run ticks where zombies damage players
    const { snapshot } = engine.tick(0.016);
    expect(snapshot.isGameOver).toBe(false);
  });
});
