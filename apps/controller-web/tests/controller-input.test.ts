import { describe, it, expect, beforeEach } from 'vitest';
import { ControllerButton, ControllerInputPayload } from '@multipal/shared-types';
import { retroAudio } from '../src/lib/retro-audio';
import { haptics } from '../src/lib/haptics';

describe('Controller Input Data & Values', () => {
  describe('Button Bitmask Manipulation', () => {
    it('should accurately set individual button bit flags', () => {
      let mask = 0;

      // Press A (1 << 0 = 1)
      mask |= ControllerButton.A;
      expect(mask).toBe(1);
      expect(mask & ControllerButton.A).toBeTruthy();

      // Press B (1 << 1 = 2)
      mask |= ControllerButton.B;
      expect(mask).toBe(3);
      expect(mask & ControllerButton.A).toBeTruthy();
      expect(mask & ControllerButton.B).toBeTruthy();

      // Press C (1 << 2 = 4)
      mask |= ControllerButton.C;
      expect(mask).toBe(7);

      // Press D (1 << 3 = 8)
      mask |= ControllerButton.D;
      expect(mask).toBe(15);
    });

    it('should accurately clear individual button bit flags on release', () => {
      let mask = ControllerButton.A | ControllerButton.B | ControllerButton.C;
      expect(mask).toBe(7);

      // Release A
      mask &= ~ControllerButton.A;
      expect(mask).toBe(6);
      expect(mask & ControllerButton.A).toBeFalsy();
      expect(mask & ControllerButton.B).toBeTruthy();
      expect(mask & ControllerButton.C).toBeTruthy();

      // Release C
      mask &= ~ControllerButton.C;
      expect(mask).toBe(2);
      expect(mask & ControllerButton.B).toBeTruthy();

      // Release B
      mask &= ~ControllerButton.B;
      expect(mask).toBe(0);
    });
  });

  describe('D-Pad Directional Angle to Normalized Vector Calculation', () => {
    const SQRT1_2 = 0.7071;

    // Helper to compute vector matching GameBoyDpad logic
    function computeDpadVector(dx: number, dy: number, size: number = 170): [number, number] {
      const distance = Math.hypot(dx, dy);
      const deadzone = size * 0.16;
      if (distance < deadzone) return [0, 0];

      const angle = Math.atan2(dy, dx);
      const deg = (angle * 180) / Math.PI;

      if (deg >= -22.5 && deg < 22.5) {
        return [1, 0]; // RIGHT
      } else if (deg >= 22.5 && deg < 67.5) {
        return [SQRT1_2, SQRT1_2]; // DOWN_RIGHT
      } else if (deg >= 67.5 && deg < 112.5) {
        return [0, 1]; // DOWN
      } else if (deg >= 112.5 && deg < 157.5) {
        return [-SQRT1_2, SQRT1_2]; // DOWN_LEFT
      } else if (deg >= 157.5 || deg < -157.5) {
        return [-1, 0]; // LEFT
      } else if (deg >= -157.5 && deg < -112.5) {
        return [-SQRT1_2, -SQRT1_2]; // UP_LEFT
      } else if (deg >= -112.5 && deg < -67.5) {
        return [0, -1]; // UP
      } else {
        return [SQRT1_2, -SQRT1_2]; // UP_RIGHT
      }
    }

    it('should return [0, 0] inside center deadzone', () => {
      expect(computeDpadVector(0, 0)).toEqual([0, 0]);
      expect(computeDpadVector(5, 5)).toEqual([0, 0]);
      expect(computeDpadVector(-10, 8)).toEqual([0, 0]);
    });

    it('should return exact cardinal directions', () => {
      // Right
      expect(computeDpadVector(50, 0)).toEqual([1, 0]);
      // Left
      expect(computeDpadVector(-50, 0)).toEqual([-1, 0]);
      // Down
      expect(computeDpadVector(0, 50)).toEqual([0, 1]);
      // Up
      expect(computeDpadVector(0, -50)).toEqual([0, -1]);
    });

    it('should return normalized diagonal vectors', () => {
      // Down-Right
      expect(computeDpadVector(40, 40)).toEqual([SQRT1_2, SQRT1_2]);
      // Up-Right
      expect(computeDpadVector(40, -40)).toEqual([SQRT1_2, -SQRT1_2]);
      // Down-Left
      expect(computeDpadVector(-40, 40)).toEqual([-SQRT1_2, SQRT1_2]);
      // Up-Left
      expect(computeDpadVector(-40, -40)).toEqual([-SQRT1_2, -SQRT1_2]);
    });
  });

  describe('Input Payload Packaging', () => {
    it('should generate valid ControllerInputPayload for the 30Hz network stream', () => {
      let seq = 0;
      const createPayload = (
        vector: [number, number],
        buttons: number,
        aimVector?: [number, number]
      ): ControllerInputPayload => {
        seq++;
        return {
          seq,
          timestamp: Date.now(),
          vector,
          buttons,
          aimVector,
        };
      };

      const p1 = createPayload([0, -1], ControllerButton.A);
      expect(p1.seq).toBe(1);
      expect(p1.vector).toEqual([0, -1]);
      expect(p1.buttons).toBe(1);
      expect(p1.timestamp).toBeGreaterThan(0);

      const p2 = createPayload([1, 0], ControllerButton.A | ControllerButton.B, [0.7, -0.7]);
      expect(p2.seq).toBe(2);
      expect(p2.vector).toEqual([1, 0]);
      expect(p2.buttons).toBe(3);
      expect(p2.aimVector).toEqual([0.7, -0.7]);
    });
  });

  describe('Audio Engine & Haptics State', () => {
    it('should clamp volume between 0 and 1', () => {
      retroAudio.setVolume(1.5);
      expect(retroAudio.getVolume()).toBe(1);

      retroAudio.setVolume(-0.2);
      expect(retroAudio.getVolume()).toBe(0);

      retroAudio.setVolume(0.75);
      expect(retroAudio.getVolume()).toBe(0.75);
    });

    it('should toggle sound mute state', () => {
      retroAudio.setMuted(false);
      expect(retroAudio.isSoundMuted()).toBe(false);

      const next = retroAudio.toggleMute();
      expect(next).toBe(true);
      expect(retroAudio.isSoundMuted()).toBe(true);

      retroAudio.setMuted(false);
    });

    it('should toggle haptics state', () => {
      haptics.setEnabled(true);
      expect(haptics.isEnabled()).toBe(true);

      const next = haptics.toggle();
      expect(next).toBe(false);
      expect(haptics.isEnabled()).toBe(false);

      haptics.setEnabled(true);
    });
  });
});
