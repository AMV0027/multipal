/**
 * Haptic Vibration Engine for Mobile Controller
 * Leverages Navigator.vibrate with sensible fallbacks and persistence.
 */

class HapticsEngine {
  private enabled: boolean = true;

  constructor() {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('multipal_haptics_enabled');
      if (saved !== null) {
        this.enabled = saved === 'true';
      }
    }
  }

  public isEnabled(): boolean {
    return this.enabled;
  }

  public setEnabled(enable: boolean): void {
    this.enabled = enable;
    if (typeof window !== 'undefined') {
      localStorage.setItem('multipal_haptics_enabled', enable ? 'true' : 'false');
    }
  }

  public toggle(): boolean {
    this.setEnabled(!this.enabled);
    return this.enabled;
  }

  private trigger(pattern: number | number[]): void {
    if (!this.enabled || typeof window === 'undefined') return;
    try {
      if (navigator.vibrate) {
        navigator.vibrate(pattern);
      }
    } catch {}
  }

  /**
   * Quick crisp tap for standard buttons and dpad
   */
  public tap(): void {
    this.trigger(12);
  }

  /**
   * Heavy punch vibration for smash, jump, bomb, boost
   */
  public heavy(): void {
    this.trigger(45);
  }

  /**
   * Multi-burst vibration for receiving damage / hit
   */
  public hit(): void {
    this.trigger([50, 30, 50]);
  }

  /**
   * Victory cadence vibration
   */
  public win(): void {
    this.trigger([80, 40, 80, 40, 160]);
  }

  /**
   * Defeat / death / KO vibration
   */
  public fail(): void {
    this.trigger([120, 60, 200]);
  }
}

export const haptics = new HapticsEngine();
