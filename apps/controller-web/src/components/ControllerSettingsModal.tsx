import React, { useState } from 'react';
import { retroAudio } from '../lib/retro-audio';
import { haptics } from '../lib/haptics';
import { Volume2, VolumeX, Smartphone, Vibrate, Palette, Wrench, X, RefreshCw } from 'lucide-react';

export type ShellTheme = 'dmg-classic' | 'atomic-purple' | 'color-berry' | 'pocket-yellow' | 'stealth-noir';

export interface ThemeColors {
  name: string;
  bodyBg: string;
  bodyBorder: string;
  bezelBg: string;
  accent: string;
  buttonA: string;
  buttonB: string;
}

export const SHELL_THEMES: Record<ShellTheme, ThemeColors> = {
  'dmg-classic': {
    name: '1989 DMG Classic',
    bodyBg: '#D1CDC0',
    bodyBorder: '#A39F92',
    bezelBg: '#7A7A85',
    accent: '#8B1E41',
    buttonA: '#8B1E41',
    buttonB: '#8B1E41',
  },
  'atomic-purple': {
    name: 'Atomic Purple',
    bodyBg: '#4A2B68',
    bodyBorder: '#351C4D',
    bezelBg: '#211330',
    accent: '#00E5FF',
    buttonA: '#FF2E88',
    buttonB: '#00E5FF',
  },
  'color-berry': {
    name: 'Color Berry',
    bodyBg: '#D62260',
    bodyBorder: '#9E1343',
    bezelBg: '#400D1E',
    accent: '#FFD400',
    buttonA: '#FFD400',
    buttonB: '#245BFF',
  },
  'pocket-yellow': {
    name: 'Pocket Yellow',
    bodyBg: '#F3B700',
    bodyBorder: '#B88B00',
    bezelBg: '#1C1917',
    accent: '#FF6B00',
    buttonA: '#1C1917',
    buttonB: '#1C1917',
  },
  'stealth-noir': {
    name: 'Stealth Noir',
    bodyBg: '#12121A',
    bodyBorder: '#29293A',
    bezelBg: '#09090F',
    accent: '#245BFF',
    buttonA: '#245BFF',
    buttonB: '#FF4268',
  },
};

interface ControllerSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTheme: ShellTheme;
  onThemeChange: (theme: ShellTheme) => void;
  useJoystick: boolean;
  onToggleJoystick: (useJoystick: boolean) => void;
  ping?: number;
  onLeaveRoom?: () => void;
  nickname: string;
  onNicknameChange?: (newNick: string) => void;
}

export const ControllerSettingsModal: React.FC<ControllerSettingsModalProps> = ({
  isOpen,
  onClose,
  currentTheme,
  onThemeChange,
  useJoystick,
  onToggleJoystick,
  ping = 12,
  onLeaveRoom,
  nickname,
  onNicknameChange,
}) => {
  const [volume, setVolumeState] = useState(retroAudio.getVolume());
  const [isMuted, setIsMuted] = useState(retroAudio.isSoundMuted());
  const [hapticsEnabled, setHapticsEnabled] = useState(haptics.isEnabled());
  const [editNick, setEditNick] = useState(nickname);

  if (!isOpen) return null;

  const handleVolumeSlider = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolumeState(val);
    retroAudio.setVolume(val);
    if (val > 0 && isMuted) {
      retroAudio.setMuted(false);
      setIsMuted(false);
    }
  };

  const handleToggleMute = () => {
    const next = !isMuted;
    setIsMuted(next);
    retroAudio.setMuted(next);
    if (!next) retroAudio.playClick();
  };

  const handleToggleHaptics = () => {
    const next = !hapticsEnabled;
    setHapticsEnabled(next);
    haptics.setEnabled(next);
    if (next) haptics.tap();
  };

  const handleSoundTest = (type: 'click' | 'jump' | 'attack' | 'smash' | 'hit' | 'win' | 'fail') => {
    if (type === 'click') retroAudio.playClick();
    else if (type === 'hit') retroAudio.playHit();
    else if (type === 'win') retroAudio.playWin();
    else if (type === 'fail') retroAudio.playFail();
    else retroAudio.playAction(type);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-xs font-retro select-none">
      <div className="w-full max-w-md max-h-[92vh] flex flex-col bg-[#14141F] border-4 border-[#29293A] shadow-pixel-lg text-[#F7F4E8] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-3 border-b-4 border-[#29293A] bg-[#0E0E17]">
          <div className="flex items-center space-x-2">
            <Wrench className="w-4 h-4 text-[#00E5FF]" />
            <h3 className="text-xs font-black tracking-widest text-[#00E5FF]">
              CONTROLLER SETTINGS
            </h3>
          </div>
          <button
            onClick={() => {
              retroAudio.playClick();
              onClose();
            }}
            className="w-7 h-7 bg-[#FF4268] active:bg-[#D93050] text-[#09090F] border-2 border-black flex items-center justify-center cursor-pointer shadow-pixel"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-5 text-[10px]">
          {/* Section 1: Audio & Sound */}
          <div className="space-y-2 border-2 border-[#29293A] p-3 bg-[#1A1A28]">
            <div className="flex items-center justify-between">
              <span className="font-bold flex items-center space-x-1.5 text-[#FFD400]">
                {isMuted ? <VolumeX className="w-3.5 h-3.5 text-[#FF4268]" /> : <Volume2 className="w-3.5 h-3.5" />}
                <span>8-BIT SOUND SFX</span>
              </span>
              <button
                type="button"
                onClick={handleToggleMute}
                className={`px-2 py-1 text-[8px] border-2 border-black cursor-pointer shadow-pixel font-black ${
                  isMuted ? 'bg-[#FF4268] text-black' : 'bg-[#35E58A] text-black'
                }`}
              >
                {isMuted ? 'MUTED' : 'ON'}
              </button>
            </div>

            <div className="pt-2 flex items-center space-x-3">
              <span className="text-[8px] text-[#B7B6C9]">VOL:</span>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={isMuted ? 0 : volume}
                onChange={handleVolumeSlider}
                className="flex-1 accent-[#FFD400] cursor-pointer"
              />
              <span className="text-[8px] w-8 text-right font-black">
                {isMuted ? '0%' : `${Math.round(volume * 100)}%`}
              </span>
            </div>

            {/* Sound Test Panel */}
            <div className="pt-2">
              <span className="text-[8px] text-[#77778D] block mb-1">TEST SFX:</span>
              <div className="grid grid-cols-4 gap-1.5">
                {(['click', 'jump', 'smash', 'hit', 'win', 'fail'] as const).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => handleSoundTest(s)}
                    className="py-1 px-1 bg-[#222235] hover:bg-[#2F2F4A] active:bg-[#FFD400] active:text-black border border-black text-[7px] text-[#F7F4E8] font-retro text-center uppercase cursor-pointer"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Section 2: Haptic Vibration */}
          <div className="space-y-2 border-2 border-[#29293A] p-3 bg-[#1A1A28]">
            <div className="flex items-center justify-between">
              <span className="font-bold flex items-center space-x-1.5 text-[#35E58A]">
                <Vibrate className="w-3.5 h-3.5" />
                <span>HAPTIC VIBRATION</span>
              </span>
              <button
                type="button"
                onClick={handleToggleHaptics}
                className={`px-2 py-1 text-[8px] border-2 border-black cursor-pointer shadow-pixel font-black ${
                  hapticsEnabled ? 'bg-[#35E58A] text-black' : 'bg-[#FF4268] text-black'
                }`}
              >
                {hapticsEnabled ? 'ENABLED' : 'DISABLED'}
              </button>
            </div>
            <p className="text-[8px] text-[#B7B6C9]">
              Tactile vibration pulses on button clicks, directional turns, and hit events.
            </p>
          </div>

          {/* Section 3: Control Input Style (D-Pad vs Joystick) */}
          <div className="space-y-2 border-2 border-[#29293A] p-3 bg-[#1A1A28]">
            <div className="flex items-center justify-between">
              <span className="font-bold flex items-center space-x-1.5 text-[#00E5FF]">
                <Smartphone className="w-3.5 h-3.5" />
                <span>MOVEMENT CONTROL</span>
              </span>
              <div className="flex space-x-1">
                <button
                  type="button"
                  onClick={() => {
                    retroAudio.playClick();
                    onToggleJoystick(false);
                  }}
                  className={`px-2 py-1 text-[8px] border-2 border-black cursor-pointer shadow-pixel font-black ${
                    !useJoystick ? 'bg-[#00E5FF] text-black' : 'bg-[#222235] text-[#B7B6C9]'
                  }`}
                >
                  D-PAD
                </button>
                <button
                  type="button"
                  onClick={() => {
                    retroAudio.playClick();
                    onToggleJoystick(true);
                  }}
                  className={`px-2 py-1 text-[8px] border-2 border-black cursor-pointer shadow-pixel font-black ${
                    useJoystick ? 'bg-[#00E5FF] text-black' : 'bg-[#222235] text-[#B7B6C9]'
                  }`}
                >
                  STICK
                </button>
              </div>
            </div>
            <p className="text-[8px] text-[#B7B6C9]">
              Toggle between classic 8-way Game Boy cross D-Pad or smooth analog virtual joystick.
            </p>
          </div>

          {/* Section 4: Game Boy Shell Themes */}
          <div className="space-y-2 border-2 border-[#29293A] p-3 bg-[#1A1A28]">
            <span className="font-bold flex items-center space-x-1.5 text-[#FF2E88]">
              <Palette className="w-3.5 h-3.5" />
              <span>SHELL COLOR THEME</span>
            </span>
            <div className="grid grid-cols-2 gap-2 pt-1">
              {(Object.keys(SHELL_THEMES) as ShellTheme[]).map((themeKey) => {
                const item = SHELL_THEMES[themeKey];
                const isSelected = currentTheme === themeKey;
                return (
                  <button
                    key={themeKey}
                    type="button"
                    onClick={() => {
                      retroAudio.playClick();
                      onThemeChange(themeKey);
                    }}
                    className={`p-2 border-2 text-left flex items-center space-x-2 cursor-pointer transition-all ${
                      isSelected
                        ? 'border-[#00E5FF] bg-[#2A2A40] shadow-pixel-cyan'
                        : 'border-[#29293A] bg-[#14141F] hover:bg-[#1E1E2E]'
                    }`}
                  >
                    <span
                      className="w-4 h-4 border border-black inline-block flex-shrink-0"
                      style={{ backgroundColor: item.bodyBg }}
                    />
                    <span className="text-[8px] font-bold truncate text-[#F7F4E8]">
                      {item.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 5: Diagnostics & Room Actions */}
          <div className="space-y-2 border-2 border-[#29293A] p-3 bg-[#1A1A28]">
            <div className="flex items-center justify-between text-[8px] text-[#B7B6C9]">
              <span>NETWORK PING:</span>
              <strong className="text-[#35E58A]">{ping}ms</strong>
            </div>

            {onNicknameChange && (
              <div className="pt-1 flex items-center space-x-2">
                <input
                  type="text"
                  maxLength={12}
                  value={editNick}
                  onChange={(e) => setEditNick(e.target.value.toUpperCase())}
                  className="flex-1 bg-[#11111B] border-2 border-[#39394F] px-2 py-1 text-[9px] text-[#00E5FF] font-retro text-center"
                />
                <button
                  type="button"
                  onClick={() => {
                    retroAudio.playClick();
                    onNicknameChange(editNick.trim() || 'HERO');
                  }}
                  className="px-2 py-1 bg-[#8B35FF] active:bg-[#7222E5] text-white border-2 border-black text-[8px] font-bold shadow-pixel cursor-pointer"
                >
                  SAVE
                </button>
              </div>
            )}

            {onLeaveRoom && (
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => {
                    retroAudio.playClick();
                    onLeaveRoom();
                  }}
                  className="w-full py-2 bg-[#FF4268]/20 hover:bg-[#FF4268]/30 active:bg-[#FF4268] text-[#FF4268] hover:text-white border-2 border-[#FF4268] text-[8px] font-retro font-bold text-center cursor-pointer"
                >
                  LEAVE ROOM / DISCONNECT
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 border-t-4 border-[#29293A] bg-[#0E0E17] text-center">
          <button
            type="button"
            onClick={() => {
              retroAudio.playClick();
              onClose();
            }}
            className="w-full py-2 bg-[#35E58A] active:bg-[#28B86E] text-[#09090F] border-2 border-black font-retro text-[9px] font-black tracking-widest shadow-pixel cursor-pointer"
          >
            DONE
          </button>
        </div>
      </div>
    </div>
  );
};
