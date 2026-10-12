import React, { useState, useRef, useCallback } from 'react';
import { retroAudio } from '../lib/retro-audio';
import { haptics } from '../lib/haptics';

interface GameBoyDpadProps {
  size?: number;
  onChange: (vector: [number, number]) => void;
  accentColor?: string;
  className?: string;
}

export const GameBoyDpad: React.FC<GameBoyDpadProps> = ({
  size = 170,
  onChange,
  accentColor = '#1e1e24',
  className = '',
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [activeDirection, setActiveDirection] = useState<string | null>(null);
  const activePointerIdRef = useRef<number | null>(null);

  const calculateVectorFromPoint = useCallback(
    (clientX: number, clientY: number): { vector: [number, number]; dir: string | null } => {
      if (!containerRef.current) return { vector: [0, 0], dir: null };
      const rect = containerRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      const dx = clientX - centerX;
      const dy = clientY - centerY;
      const distance = Math.hypot(dx, dy);

      // Deadzone in the center pivot
      const deadzone = size * 0.16;
      if (distance < deadzone) {
        return { vector: [0, 0], dir: null };
      }

      // Angle in radians (-PI to PI)
      const angle = Math.atan2(dy, dx); // 0 = right, PI/2 = down, -PI/2 = up, PI = left
      const deg = (angle * 180) / Math.PI;

      // Classify into 8 segments (-180 to 180)
      // Right: -22.5 to 22.5
      // Down-Right: 22.5 to 67.5
      // Down: 67.5 to 112.5
      // Down-Left: 112.5 to 157.5
      // Left: 157.5 to 180 or -180 to -157.5
      // Up-Left: -157.5 to -112.5
      // Up: -112.5 to -67.5
      // Up-Right: -67.5 to -22.5

      const SQRT1_2 = 0.7071;

      if (deg >= -22.5 && deg < 22.5) {
        return { vector: [1, 0], dir: 'RIGHT' };
      } else if (deg >= 22.5 && deg < 67.5) {
        return { vector: [SQRT1_2, SQRT1_2], dir: 'DOWN_RIGHT' };
      } else if (deg >= 67.5 && deg < 112.5) {
        return { vector: [0, 1], dir: 'DOWN' };
      } else if (deg >= 112.5 && deg < 157.5) {
        return { vector: [-SQRT1_2, SQRT1_2], dir: 'DOWN_LEFT' };
      } else if (deg >= 157.5 || deg < -157.5) {
        return { vector: [-1, 0], dir: 'LEFT' };
      } else if (deg >= -157.5 && deg < -112.5) {
        return { vector: [-SQRT1_2, -SQRT1_2], dir: 'UP_LEFT' };
      } else if (deg >= -112.5 && deg < -67.5) {
        return { vector: [0, -1], dir: 'UP' };
      } else {
        return { vector: [SQRT1_2, -SQRT1_2], dir: 'UP_RIGHT' };
      }
    },
    [size]
  );

  const handlePointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (activePointerIdRef.current !== null) return;

    activePointerIdRef.current = e.pointerId;
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);

    const { vector, dir } = calculateVectorFromPoint(e.clientX, e.clientY);
    setActiveDirection(dir);
    onChange(vector);

    if (dir) {
      retroAudio.playDpadClick();
      haptics.tap();
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (e.pointerId !== activePointerIdRef.current) return;
    e.preventDefault();

    const { vector, dir } = calculateVectorFromPoint(e.clientX, e.clientY);
    if (dir !== activeDirection) {
      setActiveDirection(dir);
      onChange(vector);
      if (dir) {
        retroAudio.playDpadClick();
        haptics.tap();
      }
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (e.pointerId !== activePointerIdRef.current) return;
    e.preventDefault();

    activePointerIdRef.current = null;
    setActiveDirection(null);
    onChange([0, 0]);
  };

  // Cross arm dimensions
  const armThickness = Math.round(size * 0.36);
  const armLength = size;

  const isUp = activeDirection?.includes('UP');
  const isDown = activeDirection?.includes('DOWN');
  const isLeft = activeDirection?.includes('LEFT');
  const isRight = activeDirection?.includes('RIGHT');

  return (
    <div
      ref={containerRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      style={{
        width: size,
        height: size,
        touchAction: 'none',
      }}
      className={`relative flex items-center justify-center cursor-pointer select-none touch-none ${className}`}
    >
      {/* Molded Circular Bevel Base behind D-Pad */}
      <div
        className="absolute rounded-full border-4 border-[#09090F] shadow-pixel-inset bg-[#151520]"
        style={{
          width: size * 1.08,
          height: size * 1.08,
        }}
      />

      {/* Horizontal Cross Bar */}
      <div
        className="absolute bg-[#222230] border-4 border-[#09090F] shadow-pixel flex items-center justify-between px-2"
        style={{
          width: armLength,
          height: armThickness,
          backgroundColor: accentColor,
        }}
      >
        {/* Left Arrow */}
        <div
          className={`flex items-center justify-center w-6 h-6 transition-transform ${
            isLeft ? 'scale-90 opacity-100 text-[#00E5FF]' : 'opacity-40 text-white'
          }`}
        >
          <span className="font-retro text-xs pointer-events-none">◀</span>
        </div>

        {/* Right Arrow */}
        <div
          className={`flex items-center justify-center w-6 h-6 transition-transform ${
            isRight ? 'scale-90 opacity-100 text-[#00E5FF]' : 'opacity-40 text-white'
          }`}
        >
          <span className="font-retro text-xs pointer-events-none">▶</span>
        </div>
      </div>

      {/* Vertical Cross Bar */}
      <div
        className="absolute bg-[#222230] border-4 border-[#09090F] shadow-pixel flex flex-col items-center justify-between py-2"
        style={{
          width: armThickness,
          height: armLength,
          backgroundColor: accentColor,
        }}
      >
        {/* Up Arrow */}
        <div
          className={`flex items-center justify-center w-6 h-6 transition-transform ${
            isUp ? 'scale-90 opacity-100 text-[#00E5FF]' : 'opacity-40 text-white'
          }`}
        >
          <span className="font-retro text-xs pointer-events-none">▲</span>
        </div>

        {/* Down Arrow */}
        <div
          className={`flex items-center justify-center w-6 h-6 transition-transform ${
            isDown ? 'scale-90 opacity-100 text-[#00E5FF]' : 'opacity-40 text-white'
          }`}
        >
          <span className="font-retro text-xs pointer-events-none">▼</span>
        </div>
      </div>

      {/* Center Pivot Indentation Dot */}
      <div
        className="absolute rounded-full border-2 border-[#09090F] bg-[#151520] pointer-events-none shadow-pixel-inset flex items-center justify-center"
        style={{
          width: armThickness * 0.55,
          height: armThickness * 0.55,
        }}
      >
        <div className="w-2 h-2 rounded-full bg-[#09090F] opacity-70" />
      </div>

      {/* Subtle Directional Text Hint */}
      <span className="absolute -bottom-5 text-[8px] font-retro text-[#77778D] tracking-widest uppercase pointer-events-none">
        {activeDirection ? activeDirection.replace('_', ' ') : 'D-PAD'}
      </span>
    </div>
  );
};
