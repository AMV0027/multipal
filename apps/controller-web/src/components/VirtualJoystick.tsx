import React, { useRef, useState, useEffect, useCallback } from 'react';

interface VirtualJoystickProps {
  size?: number; // Outer base size in px (e.g. 150)
  knobSize?: number; // Knob size in px (e.g. 64)
  onChange: (vector: [number, number]) => void;
  color?: string;
}

export const VirtualJoystick: React.FC<VirtualJoystickProps> = ({
  size = 150,
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
      className="relative rounded-full bg-slate-900/90 border-2 border-slate-700/80 shadow-2xl flex items-center justify-center cursor-pointer select-none"
    >
      {/* Inner Guide Crosshair */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
        <div className="w-full h-px bg-slate-400" />
        <div className="h-full w-px bg-slate-400 absolute" />
      </div>

      {/* Movable Knob */}
      <div
        style={{
          width: knobSize,
          height: knobSize,
          transform: `translate(${knobPosition.x}px, ${knobPosition.y}px)`,
          borderColor: color,
        }}
        className="rounded-full bg-gradient-to-br from-slate-700 to-slate-800 border-2 shadow-lg flex items-center justify-center transition-transform duration-75 pointer-events-none"
      >
        <div
          style={{ backgroundColor: color }}
          className="w-4 h-4 rounded-full shadow-md opacity-80"
        />
      </div>
    </div>
  );
};
