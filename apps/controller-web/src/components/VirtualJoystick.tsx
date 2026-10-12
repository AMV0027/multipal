import React, { useRef, useState, useCallback } from 'react';

interface VirtualJoystickProps {
  size?: number;
  knobSize?: number;
  onChange: (vector: [number, number]) => void;
  color?: string;
}

export const VirtualJoystick: React.FC<VirtualJoystickProps> = ({
  size = 160,
  knobSize = 64,
  onChange,
  color = '#3B82F6',
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [knobPosition, setKnobPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [activePointerId, setActivePointerId] = useState<number | null>(null);

  const radius = size / 2;
  const maxDistance = radius - knobSize / 4;

  const handlePointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (activePointerId !== null) return;

    setActivePointerId(e.pointerId);
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    updatePosition(e.clientX, e.clientY);
  };

  const updatePosition = useCallback((clientX: number, clientY: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const dx = clientX - centerX;
    const dy = clientY - centerY;
    const distance = Math.hypot(dx, dy);

    if (distance === 0) {
      setKnobPosition({ x: 0, y: 0 });
      onChange([0, 0]);
      return;
    }

    const clampedDistance = Math.min(distance, maxDistance);
    const angle = Math.atan2(dy, dx);

    const nx = (Math.cos(angle) * clampedDistance) / maxDistance;
    const ny = (Math.sin(angle) * clampedDistance) / maxDistance;

    const px = Math.cos(angle) * clampedDistance;
    const py = Math.sin(angle) * clampedDistance;

    setKnobPosition({ x: px, y: py });
    onChange([Math.round(nx * 100) / 100, Math.round(ny * 100) / 100]);
  }, [maxDistance, onChange]);

  const handlePointerMove = (e: React.PointerEvent) => {
    if (e.pointerId !== activePointerId) return;
    e.preventDefault();
    updatePosition(e.clientX, e.clientY);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (e.pointerId !== activePointerId) return;
    e.preventDefault();
    setActivePointerId(null);
    setKnobPosition({ x: 0, y: 0 });
    onChange([0, 0]);
  };

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
      className="relative bg-[#11111B] border-4 border-[#29293A] shadow-pixel-lg flex items-center justify-center cursor-pointer select-none font-retro"
    >
      {/* 4 Direction Pixel Indicators */}
      <span className="absolute top-1 text-[10px] text-slate-500 pointer-events-none">▲</span>
      <span className="absolute bottom-1 text-[10px] text-slate-500 pointer-events-none">▼</span>
      <span className="absolute left-1 text-[10px] text-slate-500 pointer-events-none">◀</span>
      <span className="absolute right-1 text-[10px] text-slate-500 pointer-events-none">▶</span>

      {/* Grid crosshair */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
        <div className="w-full h-1 bg-black" />
        <div className="h-full w-1 bg-black absolute" />
      </div>

      {/* Chunky 8-Bit Movable Knob */}
      <div
        style={{
          width: knobSize,
          height: knobSize,
          transform: `translate(${knobPosition.x}px, ${knobPosition.y}px)`,
          backgroundColor: color,
        }}
        className="border-4 border-black shadow-pixel flex items-center justify-center transition-transform duration-75 pointer-events-none relative"
      >
        {/* Center pixel dot */}
        <div className="w-3 h-3 bg-white border-2 border-black" />
      </div>
    </div>
  );
};
