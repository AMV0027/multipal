import React, { useState, useRef } from 'react';
import { retroAudio } from '../lib/retro-audio';
import { haptics } from '../lib/haptics';

interface GameBoyButtonProps {
  buttonBit: number;
  label: string;
  subLabel?: string;
  color?: string;
  activeColor?: string;
  textColor?: string;
  size?: number;
  shape?: 'round' | 'rect';
  soundType?: 'click' | 'jump' | 'attack' | 'smash' | 'nuke' | 'gas' | 'brake';
  isHeavy?: boolean;
  onPress: (buttonBit: number, isPressed: boolean) => void;
  className?: string;
}

export const GameBoyButton: React.FC<GameBoyButtonProps> = ({
  buttonBit,
  label,
  subLabel,
  color = '#8A1538', // Classic Game Boy Ruby / Burgundy
  activeColor = '#680E28',
  textColor = '#F7F4E8',
  size = 68,
  shape = 'round',
  soundType = 'click',
  isHeavy = false,
  onPress,
  className = '',
}) => {
  const [isPressed, setIsPressed] = useState(false);
  const pointerIdRef = useRef<number | null>(null);

  const handlePointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (pointerIdRef.current !== null) return;

    pointerIdRef.current = e.pointerId;
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);

    setIsPressed(true);
    onPress(buttonBit, true);

    // Audio & Haptics
    if (soundType === 'click') {
      retroAudio.playClick(isHeavy ? 0.8 : 1.1);
    } else {
      retroAudio.playAction(soundType);
    }

    if (isHeavy) {
      haptics.heavy();
    } else {
      haptics.tap();
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (e.pointerId !== pointerIdRef.current) return;
    e.preventDefault();
    e.stopPropagation();

    pointerIdRef.current = null;
    setIsPressed(false);
    onPress(buttonBit, false);
  };

  return (
    <div className={`flex flex-col items-center select-none touch-none ${className}`}>
      {/* Molded Bevel Base behind Button */}
      <div
        className={`relative flex items-center justify-center p-1.5 bg-[#14141F] border-4 border-[#09090F] shadow-pixel-inset ${
          shape === 'round' ? 'rounded-full' : 'rounded-md'
        }`}
      >
        <button
          type="button"
          onPointerDown={handlePointerDown}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          style={{
            width: size,
            height: size,
            backgroundColor: isPressed ? activeColor : color,
            color: textColor,
          }}
          className={`relative border-4 border-[#09090F] flex flex-col items-center justify-center font-retro cursor-pointer select-none touch-none transition-all duration-75 ${
            shape === 'round' ? 'rounded-full' : 'rounded'
          } ${
            isPressed
              ? 'translate-x-1 translate-y-1 shadow-none brightness-90'
              : 'shadow-pixel hover:brightness-110'
          }`}
        >
          {/* Top highlight glare */}
          <div
            className={`absolute top-1 left-2 right-2 h-1.5 bg-white/20 pointer-events-none ${
              shape === 'round' ? 'rounded-full' : 'rounded-sm'
            }`}
          />

          {/* Main Button Letter */}
          <span className="text-base sm:text-lg font-black tracking-wider leading-none drop-shadow-[1px_1px_0_#09090F]">
            {label}
          </span>
        </button>
      </div>

      {/* Sub-label function tag */}
      {subLabel && (
        <span className="mt-1.5 text-[8px] sm:text-[9px] font-retro font-black uppercase tracking-widest text-[#B7B6C9] drop-shadow-[1px_1px_0_#09090F]">
          {subLabel}
        </span>
      )}
    </div>
  );
};
