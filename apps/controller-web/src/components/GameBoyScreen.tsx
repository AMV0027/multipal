import React from 'react';
import { GameId, PlayerSession } from '@multipal/shared-types';

interface GameBoyScreenProps {
  player: PlayerSession;
  roomCode: string;
  activeGame: GameId;
  connected: boolean;
  playerColor?: string;
  // Live snapshot game data
  gameData?: {
    // Zombie Survival
    hp?: number;
    maxHp?: number;
    ammo?: number;
    wave?: number;
    isDowned?: boolean;
    score?: number;
    // Platform Fighter
    stocks?: number;
    damagePercent?: number;
    isEliminated?: boolean;
    // Racing
    lap?: number;
    maxLaps?: number;
    rank?: number | null;
    speed?: number;
    // Test Arena / Telemetry
    vector?: [number, number];
    buttonsMask?: number;
    ping?: number;
  };
  className?: string;
}

export const GameBoyScreen: React.FC<GameBoyScreenProps> = ({
  player,
  roomCode,
  activeGame,
  connected,
  playerColor = '#245BFF',
  gameData = {},
  className = '',
}) => {
  return (
    <div
      className={`relative bg-[#1A1E14] border-4 border-[#0F120C] rounded-md p-2.5 shadow-pixel-inset font-retro select-none ${className}`}
      style={{
        boxShadow: 'inset 3px 3px 0 0 #0D100A, inset -3px -3px 0 0 #2A3020',
      }}
    >
      {/* Screen Glare reflection overlay */}
      <div className="absolute top-0 right-0 w-24 h-full bg-gradient-to-l from-white/5 to-transparent pointer-events-none" />

      {/* Screen Header Bar */}
      <div className="flex items-center justify-between pb-1.5 border-b-2 border-[#2E3622] text-[9px] text-[#8C9E73]">
        <div className="flex items-center space-x-1.5">
          {/* Power / Signal LED */}
          <span
            className={`w-2 h-2 rounded-full inline-block border border-black ${
              connected ? 'bg-[#35E58A] shadow-[0_0_6px_#35E58A]' : 'bg-[#FF4268] animate-pulse'
            }`}
          />
          {/* Player Badge */}
          <span
            className="px-1.5 py-0.5 text-black font-black rounded-sm text-[8px]"
            style={{ backgroundColor: playerColor }}
          >
            P{player.slotIndex + 1}
          </span>
          <span className="font-bold text-[#C6D6AF] truncate max-w-[70px]">
            {player.nickname}
          </span>
        </div>

        <div className="flex items-center space-x-2 text-[8px]">
          <span className="px-1.5 py-0.5 bg-[#2E3622] text-[#E2EEC8] font-bold">
            {activeGame === 'zombie-survival'
              ? 'ZOMBIE 4P'
              : activeGame === 'platform-fighter'
              ? 'FIGHTER'
              : activeGame === 'racing'
              ? 'RACER 2X2'
              : 'TEST ARENA'}
          </span>
          <span
            className={`px-1.5 py-0.5 font-bold ${
              player.isReady ? 'bg-[#35E58A] text-black' : 'bg-[#E63946] text-white'
            }`}
          >
            {player.isReady ? 'READY' : 'NOT READY'}
          </span>
        </div>
      </div>

      {/* Dynamic Game-Specific Display */}
      <div className="pt-2 text-[#A8B88E] text-[10px] min-h-[36px] flex items-center justify-between">
        {activeGame === 'zombie-survival' && (
          <div className="w-full flex items-center justify-between">
            {/* Wave & Health */}
            <div className="flex flex-col space-y-1">
              <span className="text-[8px] text-[#7A8A62]">
                WAVE: <strong className="text-[#E2EEC8]">{gameData.wave ?? 1}</strong>
              </span>
              <div className="flex items-center space-x-1">
                <span className="text-[8px]">HP:</span>
                <div className="w-16 h-2 bg-[#0D100A] border border-[#2E3622] overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${
                      (gameData.hp ?? 100) > 30 ? 'bg-[#8CA860]' : 'bg-[#E63946] animate-pulse'
                    }`}
                    style={{
                      width: `${Math.max(0, Math.min(100, ((gameData.hp ?? 100) / (gameData.maxHp ?? 100)) * 100))}%`,
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Ammo & Status */}
            <div className="flex flex-col items-end space-y-1">
              <span className="text-[8px] text-[#7A8A62]">
                AMMO: <strong className="text-[#E2EEC8]">{gameData.ammo ?? '∞'}</strong>
              </span>
              {gameData.isDowned ? (
                <span className="px-1.5 py-0.5 bg-[#E63946] text-black font-black text-[7px] animate-pulse">
                  REVIVE ME!
                </span>
              ) : (
                <span className="text-[8px] text-[#8CA860]">SURVIVING</span>
              )}
            </div>
          </div>
        )}

        {activeGame === 'platform-fighter' && (
          <div className="w-full flex items-center justify-between">
            {/* Stocks */}
            <div className="flex flex-col space-y-1">
              <span className="text-[8px] text-[#7A8A62]">STOCKS:</span>
              <div className="flex items-center space-x-1">
                {Array.from({ length: 3 }).map((_, i) => (
                  <span
                    key={i}
                    className={`text-xs ${
                      i < (gameData.stocks ?? 3) ? 'text-[#8CA860]' : 'text-[#2E3622]'
                    }`}
                  >
                    ♥
                  </span>
                ))}
              </div>
            </div>

            {/* Damage % */}
            <div className="flex flex-col items-end space-y-1">
              <span className="text-[8px] text-[#7A8A62]">DAMAGE:</span>
              <span
                className={`text-xs font-black ${
                  (gameData.damagePercent ?? 0) > 100
                    ? 'text-[#E63946] animate-pulse'
                    : (gameData.damagePercent ?? 0) > 50
                    ? 'text-[#F1C40F]'
                    : 'text-[#E2EEC8]'
                }`}
              >
                {Math.round(gameData.damagePercent ?? 0)}%
              </span>
            </div>
          </div>
        )}

        {activeGame === 'racing' && (
          <div className="w-full flex items-center justify-between">
            {/* Lap */}
            <div className="flex flex-col space-y-1">
              <span className="text-[8px] text-[#7A8A62]">
                LAP: <strong className="text-[#E2EEC8]">{gameData.lap ?? 1}/{gameData.maxLaps ?? 3}</strong>
              </span>
              <div className="flex items-center space-x-1">
                <span className="text-[7px]">SPD:</span>
                <div className="w-14 h-1.5 bg-[#0D100A] border border-[#2E3622]">
                  <div
                    className="h-full bg-[#8CA860]"
                    style={{ width: `${Math.min(100, (gameData.speed ?? 0) / 4)}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Position Rank */}
            <div className="flex flex-col items-end space-y-1">
              <span className="text-[8px] text-[#7A8A62]">RANK:</span>
              <span className="px-1.5 py-0.5 bg-[#8CA860] text-black font-black text-[9px]">
                {gameData.rank ? `${gameData.rank}${['ST', 'ND', 'RD', 'TH'][Math.min(gameData.rank - 1, 3)]}` : 'RACE'}
              </span>
            </div>
          </div>
        )}

        {activeGame === 'test-arena' && (
          <div className="w-full flex items-center justify-between text-[8px]">
            <div>
              <span>VEC: </span>
              <span className="text-[#E2EEC8]">
                [{gameData.vector?.[0]?.toFixed(1) ?? '0.0'}, {gameData.vector?.[1]?.toFixed(1) ?? '0.0'}]
              </span>
            </div>
            <div>
              <span>BTN: </span>
              <span className="text-[#E2EEC8]">
                {gameData.buttonsMask !== undefined ? `0x${gameData.buttonsMask.toString(16)}` : '0x0'}
              </span>
            </div>
            <div>
              <span>PING: </span>
              <span className="text-[#8CA860]">{gameData.ping ?? 12}ms</span>
            </div>
          </div>
        )}
      </div>

      {/* Subtle Dot Matrix Scanlines */}
      <div
        className="absolute inset-0 pointer-events-none opacity-15"
        style={{
          backgroundImage:
            'repeating-linear-gradient(0deg, transparent, transparent 2px, #000 3px)',
        }}
      />
    </div>
  );
};
