import { describe, it, expect, beforeEach } from 'vitest';
import {
  ControllerButton,
  ControllerInputPayload,
  PlayerSession,
} from '@multipal/shared-types';
import { TestArenaEngine } from '../../../server/src/games/test-arena-engine';
import { ZombieSurvivalEngine } from '../../../server/src/games/zombie-survival-engine';
import { RoomManager } from '../../../server/src/rooms/room-manager';

describe('Controller E2E Data & Game Integration Tests', () => {
  let roomManager: RoomManager;

  beforeEach(() => {
    roomManager = new RoomManager();
  });

  describe('Room Lifecycle & Player Session Handshake', () => {
    it('should allow controller to join room and maintain state', () => {
      const room = roomManager.createRoom('host-socket-1');
      expect(room.code).toHaveLength(4);

      const joinRes = roomManager.joinRoom(room.code, 'RETRO_BOY', 'controller-socket-1');
      expect(joinRes.ok).toBe(true);
      expect(joinRes.player).toBeDefined();
      expect(joinRes.player?.slotIndex).toBe(0);
      expect(joinRes.player?.nickname).toBe('RETRO_BOY');

      // Ready toggle from controller
      const readyRes = roomManager.setPlayerReady('controller-socket-1', true);
      expect(readyRes?.player.isReady).toBe(true);
    });
  });

  describe('Test Arena Engine: E2E Input Vector & Bitmask Verification', () => {
    it('should translate controller D-Pad vector and button bitmask into arena physics', () => {
      const engine = new TestArenaEngine({
        roomId: 'test-room',
        onSnapshot: () => {},
        onEvent: () => {},
        onGameEnd: () => {},
      });

      const player: PlayerSession = {
        id: 'player-1',
        roomId: 'test-room',
        slotIndex: 0,
        nickname: 'HERO',
        avatarId: 'av1',
        sessionToken: 'tok1',
        connected: true,
        isReady: true,
        lastHeartbeat: Date.now(),
      };

      engine.init([player]);
      engine.start();

      // Initial tick (spawn position is x=200, y=200)
      const initialTick = engine.tick(1 / 30);
      const initialEntity = initialTick.snapshot.entities.find((e) => e.playerId === 'player-1');
      expect(initialEntity).toBeDefined();
      const startX = initialEntity!.x;
      const startY = initialEntity!.y;
      expect(startX).toBe(200);
      expect(startY).toBe(200);

      // Emulate controller D-Pad RIGHT press [1, 0] + Button A press (bitmask = 1)
      const controllerInput: ControllerInputPayload = {
        seq: 1,
        timestamp: Date.now(),
        vector: [1, 0],
        buttons: ControllerButton.A,
      };

      engine.processInput('player-1', controllerInput);

      // Advance engine by 0.1 seconds (3 ticks at 30Hz ~ 0.1s)
      const tick1 = engine.tick(0.1);
      const updatedEntity = tick1.snapshot.entities.find((e) => e.playerId === 'player-1');
      expect(updatedEntity).toBeDefined();

      // Entity should have moved to the right (x > startX) and y remains constant
      expect(updatedEntity!.x).toBeGreaterThan(startX);
      expect(updatedEntity!.y).toBe(startY);
      // Entity should report exact button mask received from controller
      expect(updatedEntity!.lastButtonMask).toBe(ControllerButton.A);

      // Emulate controller pressing A + B simultaneously (bitmask = 3)
      engine.processInput('player-1', {
        seq: 2,
        timestamp: Date.now(),
        vector: [0, 1], // DOWN
        buttons: ControllerButton.A | ControllerButton.B,
      });

      const tick2 = engine.tick(0.1);
      const entity2 = tick2.snapshot.entities.find((e) => e.playerId === 'player-1');
      expect(entity2!.y).toBeGreaterThan(startY);
      expect(entity2!.lastButtonMask).toBe(3); // 1 | 2
    });
  });

  describe('Zombie Survival Engine: Aim & Action Integration', () => {
    it('should accurately translate aim vector and buttons to game snapshot', () => {
      const engine = new ZombieSurvivalEngine({
        roomId: 'zombie-room',
        onSnapshot: () => {},
        onEvent: () => {},
        onGameEnd: () => {},
      });

      const player: PlayerSession = {
        id: 'player-z',
        roomId: 'zombie-room',
        slotIndex: 0,
        nickname: 'SURVIVOR',
        avatarId: 'av1',
        sessionToken: 'tok1',
        connected: true,
        isReady: true,
        lastHeartbeat: Date.now(),
      };

      engine.init([player]);
      engine.start();

      // Emulate aim stick pointing diagonally down-right [0.7071, 0.7071]
      const input: ControllerInputPayload = {
        seq: 1,
        timestamp: Date.now(),
        vector: [0, 0],
        aimVector: [0.7071, 0.7071],
        buttons: 0,
      };

      engine.processInput('player-z', input);
      const tickResult = engine.tick(1 / 30);
      const pState = tickResult.snapshot.players.find((p) => p.playerId === 'player-z');

      expect(pState).toBeDefined();
      // Aim angle should be roughly PI / 4 (~0.785 rad)
      expect(pState!.aimAngle).toBeCloseTo(Math.PI / 4, 1);
    });
  });
});
