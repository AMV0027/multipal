import React from 'react';

export type BloomState = 'idle' | 'hit' | 'win' | 'fail' | 'powerup';

interface PixelBloomBorderProps {
  bloomState: BloomState;
  slotColor?: string;
  children: React.ReactNode;
  className?: string;
}

export const PixelBloomBorder: React.FC<PixelBloomBorderProps> = ({
  bloomState,
  slotColor = '#245BFF',
  children,
  className = '',
}) => {
  // Compute style variables based on bloomState
  const getBloomConfig = () => {
    switch (bloomState) {
      case 'hit':
        return {
          glowColor: '#FF2E55',
          secondaryColor: '#FF8800',
          animation: 'animate-pixel-hit',
          borderColor: '#FF2E55',
          bannerText: '⚡ DAMAGE HIT! ⚡',
        };
      case 'win':
        return {
          glowColor: '#FFD700',
          secondaryColor: '#00FFA3',
          animation: 'animate-pixel-win',
          borderColor: '#FFD700',
          bannerText: '★ VICTORY! ★',
        };
      case 'fail':
        return {
          glowColor: '#E60039',
          secondaryColor: '#7A0026',
          animation: 'animate-pixel-fail',
          borderColor: '#E60039',
          bannerText: '☠ DOWNED / KO ☠',
        };
      case 'powerup':
        return {
          glowColor: '#00FFA3',
          secondaryColor: '#00E5FF',
          animation: 'animate-pixel-powerup',
          borderColor: '#00FFA3',
          bannerText: '▲ POWER UP! ▲',
        };
      case 'idle':
      default:
        return {
          glowColor: slotColor,
          secondaryColor: `${slotColor}88`,
          animation: '',
          borderColor: '#29293A',
          bannerText: null,
        };
    }
  };

  const config = getBloomConfig();

  return (
    <div
      className={`relative w-full h-full overflow-hidden transition-all duration-200 ${
        bloomState === 'hit' ? 'animate-shake' : ''
      } ${className}`}
      style={{
        boxShadow:
          bloomState !== 'idle'
            ? `inset 0 0 0 4px ${config.borderColor}, inset 0 0 0 8px ${config.secondaryColor}, 0 0 20px 2px ${config.glowColor}`
            : `inset 0 0 0 2px ${config.borderColor}`,
      }}
    >
      {/* 8-Bit Pixel Corner Ornaments */}
      <div
        className="absolute top-0 left-0 w-4 h-4 pointer-events-none z-30 transition-colors duration-200"
        style={{
          boxShadow: `inset 4px 4px 0 0 ${config.glowColor}`,
        }}
      />
      <div
        className="absolute top-0 right-0 w-4 h-4 pointer-events-none z-30 transition-colors duration-200"
        style={{
          boxShadow: `inset -4px 4px 0 0 ${config.glowColor}`,
        }}
      />
      <div
        className="absolute bottom-0 left-0 w-4 h-4 pointer-events-none z-30 transition-colors duration-200"
        style={{
          boxShadow: `inset 4px -4px 0 0 ${config.glowColor}`,
        }}
      />
      <div
        className="absolute bottom-0 right-0 w-4 h-4 pointer-events-none z-30 transition-colors duration-200"
        style={{
          boxShadow: `inset -4px -4px 0 0 ${config.glowColor}`,
        }}
      />

      {/* Repeating Pixel Rim Dots */}
      <div className="absolute inset-x-0 top-0 h-1 z-20 pointer-events-none flex justify-between px-6 overflow-hidden">
        {Array.from({ length: 16 }).map((_, i) => (
          <div
            key={i}
            className="w-1.5 h-1 transition-colors duration-200"
            style={{
              backgroundColor: bloomState !== 'idle' ? config.glowColor : 'transparent',
              opacity: (i % 2 === 0 ? 0.9 : 0.4),
            }}
          />
        ))}
      </div>
      <div className="absolute inset-x-0 bottom-0 h-1 z-20 pointer-events-none flex justify-between px-6 overflow-hidden">
        {Array.from({ length: 16 }).map((_, i) => (
          <div
            key={i}
            className="w-1.5 h-1 transition-colors duration-200"
            style={{
              backgroundColor: bloomState !== 'idle' ? config.glowColor : 'transparent',
              opacity: (i % 2 === 0 ? 0.9 : 0.4),
            }}
          />
        ))}
      </div>

      {/* Dynamic Event Banner Overlay */}
      {config.bannerText && (
        <div
          className="absolute top-2 left-1/2 -translate-x-1/2 z-40 pointer-events-none px-3 py-1 font-retro text-[10px] tracking-widest font-black uppercase shadow-pixel border-2 animate-bounce"
          style={{
            backgroundColor: config.glowColor,
            borderColor: '#09090F',
            color: '#09090F',
          }}
        >
          {config.bannerText}
        </div>
      )}

      {/* Main Content inside Border */}
      {children}
    </div>
  );
};
