import React, { useEffect, useState, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import {
  PlayerSession,
  Room,
  GameId,
  ControllerInputPayload,
  JoinRoomResponse,
  ControllerButton,
  GameStateSnapshot,
  ZombieSurvivalSnapshot,
  PlatformFighterSnapshot,
  RacingGameSnapshot,
} from '@multipal/shared-types';
import { VirtualJoystick } from './components/VirtualJoystick';
import { GameBoyDpad } from './components/GameBoyDpad';
import { GameBoyButton } from './components/GameBoyButton';
import { GameBoyScreen } from './components/GameBoyScreen';
import { PixelBloomBorder, BloomState } from './components/PixelBloomBorder';
import {
  ControllerSettingsModal,
  ShellTheme,
  SHELL_THEMES,
} from './components/ControllerSettingsModal';
import { Button, Card, Badge, Input } from './components/ui/8bit';
import { AlertCircle, Settings, Volume2, VolumeX } from 'lucide-react';
import { retroAudio } from './lib/retro-audio';
import { haptics } from './lib/haptics';

const isDedicatedDevPort =
  typeof window !== 'undefined' &&
  (window.location.port === '5200' || window.location.port === '5201');
const SERVER_URL =
  import.meta.env.VITE_SERVER_URL ||
  (isDedicatedDevPort
    ? `http://${window.location.hostname}:3001`
    : typeof window !== 'undefined'
    ? window.location.origin
    : '');

export default function App() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [roomCode, setRoomCode] = useState('');
  const [nickname, setNickname] = useState('');
  const [player, setPlayer] = useState<PlayerSession | null>(null);
  const [room, setRoom] = useState<Room | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);

  // Controller Settings & Themes
  const [currentTheme, setCurrentTheme] = useState<ShellTheme>('dmg-classic');
  const [useJoystick, setUseJoystick] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isMuted, setIsMuted] = useState(retroAudio.isSoundMuted());
  const [ping, setPing] = useState(12);

  // Live Ambient Pixel Bloom State ('idle' | 'hit' | 'win' | 'fail' | 'powerup')
  const [bloomState, setBloomState] = useState<BloomState>('idle');
  const bloomTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Live Game Snapshot state telemetry for screen HUD
  const [hudData, setHudData] = useState<{
    hp?: number;
    maxHp?: number;
    ammo?: number;
    wave?: number;
    isDowned?: boolean;
    stocks?: number;
    damagePercent?: number;
    lap?: number;
    maxLaps?: number;
    rank?: number | null;
    speed?: number;
    vector?: [number, number];
    buttonsMask?: number;
    ping?: number;
  }>({});

  const prevHpRef = useRef<number | null>(null);
  const prevDamageRef = useRef<number | null>(null);
  const prevStocksRef = useRef<number | null>(null);
  const prevDownedRef = useRef<boolean>(false);

  const inputVectorRef = useRef<[number, number]>([0, 0]);
  const aimVectorRef = useRef<[number, number]>([1, 0]);
  const buttonsMaskRef = useRef<number>(0);
  const seqRef = useRef<number>(0);

  // Load saved theme & preferences
  useEffect(() => {
    const savedTheme = localStorage.getItem('multipal_shell_theme') as ShellTheme;
    if (savedTheme && SHELL_THEMES[savedTheme]) {
      setCurrentTheme(savedTheme);
    }
    const savedControl = localStorage.getItem('multipal_use_joystick');
    if (savedControl) {
      setUseJoystick(savedControl === 'true');
    }

    const pathParts = window.location.pathname.split('/');
    const joinIndex = pathParts.indexOf('join');
    if (joinIndex !== -1 && pathParts[joinIndex + 1]) {
      setRoomCode(pathParts[joinIndex + 1].toUpperCase());
    }

    const savedName = localStorage.getItem('multipal_nickname');
    if (savedName) setNickname(savedName);
  }, []);

  const [previewedRoom, setPreviewedRoom] = useState<{ selectedGameId: GameId; playerCount: number } | null>(null);

  // Fetch room preview when 4-letter room code is typed/detected
  useEffect(() => {
    if (roomCode.length === 4) {
      fetch(`${SERVER_URL}/api/room/${roomCode}`)
        .then((r) => r.json())
        .then((data) => {
          if (data.ok && data.room) {
            setPreviewedRoom(data.room);
          } else {
            setPreviewedRoom(null);
          }
        })
        .catch(() => setPreviewedRoom(null));
    } else {
      setPreviewedRoom(null);
    }
  }, [roomCode]);

  const triggerBloom = useCallback((state: BloomState, durationMs: number = 1600) => {
    if (bloomTimeoutRef.current) clearTimeout(bloomTimeoutRef.current);
    setBloomState(state);
    bloomTimeoutRef.current = setTimeout(() => {
      setBloomState('idle');
    }, durationMs);
  }, []);

  const playerRef = useRef<PlayerSession | null>(null);
  playerRef.current = player;

  // Socket setup (Single stable connection lifecycle)
  useEffect(() => {
    const s = io(SERVER_URL, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 20,
    });

    s.on('connect', () => {
      setConnected(true);
      setErrorMsg(null);

      // Periodic ping
      const pingInterval = setInterval(() => {
        const start = Date.now();
        s.emit('ping:check', start, () => {
          setPing(Date.now() - start);
        });
      }, 5000);

      const token = sessionStorage.getItem('multipal_session_token');
      const code = sessionStorage.getItem('multipal_room_code');
      if (token && code) {
        s.emit(
          'room:join',
          { code, nickname: '', sessionToken: token },
          (res: JoinRoomResponse) => {
            if (res.ok && res.player && res.room) {
              setPlayer(res.player);
              setRoom(res.room);
              setIsReady(res.player.isReady);
            }
          }
        );
      }

      return () => clearInterval(pingInterval);
    });

    s.on('disconnect', () => setConnected(false));

    s.on('room:updated', (updatedRoom: Room) => {
      setRoom(updatedRoom);
      const currPlayer = playerRef.current;
      if (currPlayer && updatedRoom.players[currPlayer.id]) {
        setPlayer(updatedRoom.players[currPlayer.id]);
        setIsReady(updatedRoom.players[currPlayer.id].isReady);
      }
    });

    // Listen to Game State Snapshots for dynamic HUD and Bloom event triggers
    s.on('game:state_snapshot', (snapshot: GameStateSnapshot) => {
      const currPlayer = playerRef.current;
      if (!currPlayer) return;

      if (snapshot.gameId === 'zombie-survival') {
        const zSnap = snapshot as ZombieSurvivalSnapshot;
        const myPlayer = zSnap.players.find((p) => p.playerId === currPlayer.id);

        if (myPlayer) {
          // Check for Hit/Damage
          if (prevHpRef.current !== null && myPlayer.hp < prevHpRef.current) {
            triggerBloom('hit');
            retroAudio.playHit();
            haptics.hit();
          }

          // Check for Downed
          if (!prevDownedRef.current && myPlayer.isDowned) {
            triggerBloom('fail');
            retroAudio.playFail();
            haptics.fail();
          }

          prevHpRef.current = myPlayer.hp;
          prevDownedRef.current = myPlayer.isDowned;

          setHudData((prev) => ({
            ...prev,
            hp: myPlayer.hp,
            maxHp: myPlayer.maxHp,
            ammo: myPlayer.ammo,
            wave: zSnap.wave,
            isDowned: myPlayer.isDowned,
            score: myPlayer.score,
          }));
        }

        // Check Victory / Game Over
        if (zSnap.isVictory) {
          triggerBloom('win', 2500);
          retroAudio.playWin();
          haptics.win();
        } else if (zSnap.isGameOver) {
          triggerBloom('fail', 2500);
          retroAudio.playFail();
          haptics.fail();
        }
      } else if (snapshot.gameId === 'platform-fighter') {
        const fSnap = snapshot as PlatformFighterSnapshot;
        const myFighter = fSnap.players.find((p) => p.playerId === currPlayer.id);

        if (myFighter) {
          // Check Damage increase
          if (prevDamageRef.current !== null && myFighter.damagePercent > prevDamageRef.current) {
            triggerBloom('hit');
            retroAudio.playHit();
            haptics.hit();
          }

          // Check Stocks loss
          if (prevStocksRef.current !== null && myFighter.stocks < prevStocksRef.current) {
            triggerBloom('fail');
            retroAudio.playFail();
            haptics.fail();
          }

          prevDamageRef.current = myFighter.damagePercent;
          prevStocksRef.current = myFighter.stocks;

          setHudData((prev) => ({
            ...prev,
            stocks: myFighter.stocks,
            damagePercent: myFighter.damagePercent,
            isEliminated: myFighter.isEliminated,
          }));
        }

        // Check Winner
        if (fSnap.isGameOver) {
          if (fSnap.winnerSlotIndex === currPlayer.slotIndex) {
            triggerBloom('win', 2500);
            retroAudio.playWin();
            haptics.win();
          } else {
            triggerBloom('fail', 2500);
            retroAudio.playFail();
            haptics.fail();
          }
        }
      } else if (snapshot.gameId === 'racing') {
        const rSnap = snapshot as RacingGameSnapshot;
        const myKart = rSnap.karts.find((k) => k.playerId === currPlayer.id);

        if (myKart) {
          setHudData((prev) => ({
            ...prev,
            lap: myKart.currentLap,
            maxLaps: myKart.maxLaps,
            rank: myKart.finishRank,
            speed: myKart.speed,
          }));
        }

        if (rSnap.isRaceOver) {
          if (rSnap.winnerPlayerId === currPlayer.id) {
            triggerBloom('win', 2500);
            retroAudio.playWin();
            haptics.win();
          }
        }
      }
    });

    s.on('room:closed', (reason: string) => {
      sessionStorage.removeItem('multipal_session_token');
      sessionStorage.removeItem('multipal_room_code');
      setPlayer(null);
      setRoom(null);
      setErrorMsg(`ROOM CLOSED: ${reason}`);
      triggerBloom('fail');
      retroAudio.playFail();
    });

    setSocket(s);

    return () => {
      s.disconnect();
    };
  }, [triggerBloom]);

  // 30Hz Fixed Simulation Network Input Loop
  useEffect(() => {
    if (!socket || !player || !connected) return;

    const interval = setInterval(() => {
      seqRef.current++;
      const payload: ControllerInputPayload = {
        seq: seqRef.current,
        timestamp: Date.now(),
        vector: inputVectorRef.current,
        aimVector: aimVectorRef.current,
        buttons: buttonsMaskRef.current,
      };

      socket.emit('player:input', payload);

      // Keep test arena HUD in sync
      if (room?.selectedGameId === 'test-arena') {
        setHudData((prev) => ({
          ...prev,
          vector: inputVectorRef.current,
          buttonsMask: buttonsMaskRef.current,
          ping,
        }));
      }
    }, 1000 / 30);

    return () => clearInterval(interval);
  }, [socket, player, connected, room?.selectedGameId, ping]);

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!socket || !connected) return;

    const cleanCode = roomCode.trim().toUpperCase();
    const cleanNick = nickname.trim().toUpperCase() || 'HERO';

    localStorage.setItem('multipal_nickname', cleanNick);
    setErrorMsg(null);
    retroAudio.playClick();
    haptics.tap();

    const savedToken = sessionStorage.getItem('multipal_session_token') || undefined;

    socket.emit(
      'room:join',
      { code: cleanCode, nickname: cleanNick, sessionToken: savedToken },
      (res: JoinRoomResponse) => {
        if (res.ok && res.player && res.room) {
          setPlayer(res.player);
          setRoom(res.room);
          setIsReady(res.player.isReady);
          sessionStorage.setItem('multipal_session_token', res.player.sessionToken);
          sessionStorage.setItem('multipal_room_code', cleanCode);
          triggerBloom('powerup');
          retroAudio.playAction('jump');
        } else {
          setErrorMsg(res.error || 'FAILED TO JOIN ROOM');
          triggerBloom('fail');
          retroAudio.playFail();
        }
      }
    );
  };

  const handleJoystickChange = useCallback((vector: [number, number]) => {
    inputVectorRef.current = vector;
  }, []);

  const handleAimJoystickChange = useCallback((vector: [number, number]) => {
    aimVectorRef.current = vector;
  }, []);

  const handleButtonPress = useCallback((buttonBit: number, isPressed: boolean) => {
    if (isPressed) {
      buttonsMaskRef.current |= buttonBit;
    } else {
      buttonsMaskRef.current &= ~buttonBit;
    }
  }, []);

  const toggleReady = () => {
    if (!socket || !player) return;
    const nextState = !isReady;
    setIsReady(nextState);
    retroAudio.playClick();
    haptics.tap();
    socket.emit('player:ready', { ready: nextState });
  };

  const handleThemeChange = (theme: ShellTheme) => {
    setCurrentTheme(theme);
    localStorage.setItem('multipal_shell_theme', theme);
  };

  const handleToggleJoystick = (enabled: boolean) => {
    setUseJoystick(enabled);
    localStorage.setItem('multipal_use_joystick', enabled ? 'true' : 'false');
  };

  const handleToggleMute = () => {
    const next = retroAudio.toggleMute();
    setIsMuted(next);
  };

  const handleLeaveRoom = () => {
    sessionStorage.removeItem('multipal_session_token');
    sessionStorage.removeItem('multipal_room_code');
    setPlayer(null);
    setRoom(null);
    setIsSettingsOpen(false);
  };

  const activeGame = room?.selectedGameId || 'zombie-survival';
  const playerSlot = player ? room?.slots[player.slotIndex] : null;
  const playerColor = playerSlot?.color.primary || '#245BFF';
  const theme = SHELL_THEMES[currentTheme];

  return (
    <PixelBloomBorder bloomState={bloomState} slotColor={playerColor}>
      <div
        className="flex flex-col h-screen w-screen overflow-hidden select-none touch-none transition-colors duration-300"
        style={{
          backgroundColor: theme.bodyBg,
          color: '#F7F4E8',
        }}
      >
        {!player ? (
          /* Game Boy Join Form Shell */
          <div className="flex-1 flex flex-col justify-center px-4 max-w-sm mx-auto w-full">
            <Card
              className="p-6 border-4 shadow-pixel-lg space-y-5"
              style={{
                backgroundColor: theme.bezelBg,
                borderColor: '#09090F',
              }}
            >
              <div className="text-center space-y-1">
                <img
                  src="/controller/multipal_logo.png"
                  alt="MultiPal Logo"
                  className="w-16 h-16 object-contain pixelated border-4 border-[#09090F] bg-[#09090F] p-1 shadow-pixel mx-auto mb-2"
                />
                <h2 className="text-sm font-black text-[#F7F4E8] font-retro tracking-widest">
                  GAME BOY JOIN
                </h2>
                <p className="text-[10px] text-[#C6D6AF] font-retro">MULTIPAl HANDHELD</p>
              </div>

              {errorMsg && (
                <div className="p-2.5 bg-[#FF4268]/20 border-2 border-[#FF4268] text-[#FF4268] text-[10px] font-bold flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <form onSubmit={handleJoin} className="space-y-4">
                <div>
                  <label className="block text-[10px] text-[#C6D6AF] font-retro font-bold uppercase tracking-wider mb-1">
                    ROOM CODE
                  </label>
                  <Input
                    type="text"
                    maxLength={4}
                    value={roomCode}
                    onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                    placeholder="K9X2"
                    className="w-full text-center text-xl font-black text-[#00E5FF] bg-[#11111B] border-2 border-[#09090F] focus:border-[#8B35FF] font-retro tracking-widest"
                    required
                  />
                  {previewedRoom && (
                    <div className="mt-2 p-2 bg-[#1A1A28] border-2 border-[#00E5FF] shadow-pixel-sm flex items-center justify-between font-retro text-[9px]">
                      <span className="text-[#00E5FF] font-black">
                        JOINING:{' '}
                        {previewedRoom.selectedGameId === 'zombie-survival'
                          ? 'ZOMBIE 4P'
                          : previewedRoom.selectedGameId === 'platform-fighter'
                          ? 'PLATFORM FIGHTER'
                          : previewedRoom.selectedGameId === 'racing'
                          ? 'SPLIT-SCREEN RACER'
                          : 'TEST ARENA'}
                      </span>
                      <span className="text-[#35E58A] font-bold">
                        {previewedRoom.playerCount}/4 IN ROOM
                      </span>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-[10px] text-[#C6D6AF] font-retro font-bold uppercase tracking-wider mb-1">
                    NICKNAME
                  </label>
                  <Input
                    type="text"
                    maxLength={12}
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
                    placeholder="HERO"
                    className="w-full text-center text-xs font-bold text-[#F7F4E8] bg-[#11111B] border-2 border-[#09090F] focus:border-[#8B35FF] font-retro"
                    required
                  />
                </div>

                <Button
                  type="submit"
                  variant="default"
                  size="default"
                  disabled={!connected || !roomCode.trim()}
                  className="w-full text-xs font-black bg-[#8B1E41] hover:bg-[#A8244E] text-[#F7F4E8] border-4 border-[#09090F] shadow-pixel font-retro py-3 cursor-pointer"
                >
                  ★ POWER ON ★
                </Button>
              </form>

              <div className="flex items-center justify-between pt-2 border-t-2 border-[#09090F]">
                <Badge variant={connected ? 'default' : 'destructive'} className="text-[9px] font-retro">
                  {connected ? '● LINK CABLE READY' : '○ CONNECTING...'}
                </Badge>
                <button
                  type="button"
                  onClick={() => setIsSettingsOpen(true)}
                  className="p-1.5 bg-[#222230] hover:bg-[#333345] border-2 border-black text-white shadow-pixel cursor-pointer"
                  title="Settings"
                >
                  <Settings className="w-3.5 h-3.5" />
                </button>
              </div>
            </Card>
          </div>
        ) : (
          /* Connected Game Boy Controller Screen & Physical Controls */
          <div className="flex-1 flex flex-col justify-between p-2 sm:p-4 overflow-hidden">
            {/* Top Bezel: Top Header & Game Boy Screen */}
            <div
              className="p-3 border-4 border-[#09090F] shadow-pixel-sm rounded-md space-y-2"
              style={{ backgroundColor: theme.bezelBg }}
            >
              {/* Bezel Header */}
              <div className="flex items-center justify-between pb-1 text-[8px] font-retro text-[#B7B6C9] tracking-wider uppercase">
                <div className="flex items-center space-x-1.5">
                  <span className="font-black text-white">DOT MATRIX WITH STEREO SOUND</span>
                </div>
                <div className="flex items-center space-x-2">
                  {/* Explicit READY / NOT READY Toggle Button */}
                  <button
                    type="button"
                    onClick={toggleReady}
                    className={`px-2.5 py-1 text-[8px] font-retro font-black border-2 border-black shadow-pixel-sm cursor-pointer transition-all ${
                      isReady
                        ? 'bg-[#35E58A] text-[#09090F] shadow-[0_0_8px_#35E58A]'
                        : 'bg-[#FF4268] text-white animate-pulse'
                    }`}
                  >
                    {isReady ? 'READY ✓' : 'SET READY'}
                  </button>

                  <button
                    type="button"
                    onClick={handleToggleMute}
                    className="p-1 text-white hover:text-[#00E5FF] cursor-pointer"
                    title={isMuted ? 'Unmute' : 'Mute'}
                  >
                    {isMuted ? <VolumeX className="w-3.5 h-3.5 text-[#FF4268]" /> : <Volume2 className="w-3.5 h-3.5" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      retroAudio.playClick();
                      setIsSettingsOpen(true);
                    }}
                    className="p-1 bg-[#151520] border border-black text-white hover:text-[#00E5FF] shadow-pixel-sm cursor-pointer"
                    title="Settings"
                  >
                    <Settings className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Dot Matrix LCD Screen */}
              <GameBoyScreen
                player={player}
                roomCode={room?.code || ''}
                activeGame={activeGame}
                connected={connected}
                playerColor={playerColor}
                gameData={{
                  ...hudData,
                  vector: inputVectorRef.current,
                  buttonsMask: buttonsMaskRef.current,
                  ping,
                }}
              />
            </div>

            {/* Middle Section: Dynamic Controls per Game Mode */}
            <div className="flex-1 flex items-center justify-between px-2 sm:px-6 py-2 gap-4">
              {/* Left Control: Game Boy D-Pad or Virtual Joystick */}
              <div className="flex flex-col items-center">
                {useJoystick ? (
                  <VirtualJoystick
                    size={150}
                    knobSize={56}
                    onChange={handleJoystickChange}
                    color={playerColor}
                  />
                ) : (
                  <GameBoyDpad
                    size={160}
                    onChange={handleJoystickChange}
                    accentColor="#222230"
                  />
                )}
                <span className="text-[8px] font-retro text-[#09090F] font-black uppercase tracking-widest mt-1">
                  {useJoystick ? 'JOYSTICK' : 'D-PAD'}
                </span>
              </div>

              {/* GAME MODE 1: Zombie Survival (Twin Stick / Nuke / Fire) */}
              {activeGame === 'zombie-survival' && (
                <div className="flex items-center space-x-4 sm:space-x-8">
                  {/* Center Action: Nuke / Bomb Button */}
                  <div className="flex flex-col items-center">
                    <GameBoyButton
                      buttonBit={ControllerButton.B}
                      label="NUKE"
                      subLabel="500 PTS"
                      color="#FF6B00"
                      activeColor="#D95500"
                      textColor="#09090F"
                      size={60}
                      shape="round"
                      soundType="nuke"
                      isHeavy
                      onPress={handleButtonPress}
                    />
                  </div>

                  {/* Right Aim / Fire Joystick or Fire Buttons */}
                  <div className="flex flex-col items-center">
                    <VirtualJoystick
                      size={150}
                      knobSize={56}
                      onChange={handleAimJoystickChange}
                      color="#FF4268"
                    />
                    <span className="text-[8px] font-retro text-[#FF4268] font-black uppercase tracking-widest mt-1">
                      AIM & FIRE
                    </span>
                  </div>
                </div>
              )}

              {/* GAME MODE 2: Platform Fighter (A Jump, B Light, C Smash, D Shield) */}
              {activeGame === 'platform-fighter' && (
                <div className="flex flex-col items-center">
                  <div className="grid grid-cols-2 gap-3 sm:gap-4 items-center">
                    {/* B: Light Attack */}
                    <GameBoyButton
                      buttonBit={ControllerButton.B}
                      label="B"
                      subLabel="LIGHT"
                      color={theme.buttonB}
                      activeColor="#B88B00"
                      size={64}
                      soundType="attack"
                      onPress={handleButtonPress}
                    />

                    {/* A: Jump */}
                    <GameBoyButton
                      buttonBit={ControllerButton.A}
                      label="A"
                      subLabel="JUMP"
                      color={theme.buttonA}
                      activeColor="#680E28"
                      size={64}
                      soundType="jump"
                      onPress={handleButtonPress}
                    />

                    {/* C: Smash Attack */}
                    <GameBoyButton
                      buttonBit={ControllerButton.C}
                      label="C"
                      subLabel="SMASH"
                      color="#D91FFF"
                      activeColor="#B317D4"
                      textColor="#FFFFFF"
                      size={64}
                      soundType="smash"
                      isHeavy
                      onPress={handleButtonPress}
                    />

                    {/* D: Shield / Special */}
                    <GameBoyButton
                      buttonBit={ControllerButton.D}
                      label="D"
                      subLabel="SHIELD"
                      color="#00E5FF"
                      activeColor="#00B4D8"
                      textColor="#09090F"
                      size={64}
                      soundType="click"
                      onPress={handleButtonPress}
                    />
                  </div>
                </div>
              )}

              {/* GAME MODE 3: Split-Screen Racing (Steering / Pedals / Drift) */}
              {activeGame === 'racing' && (
                <div className="flex items-center space-x-3 sm:space-x-5">
                  {/* Brake / Reverse Pedal */}
                  <GameBoyButton
                    buttonBit={ControllerButton.B}
                    label="B"
                    subLabel="BRAKE"
                    color="#FF6B00"
                    activeColor="#D95500"
                    textColor="#09090F"
                    size={64}
                    shape="rect"
                    soundType="brake"
                    onPress={handleButtonPress}
                  />

                  {/* Gas / Accelerate Pedal */}
                  <GameBoyButton
                    buttonBit={ControllerButton.A}
                    label="A"
                    subLabel="GAS"
                    color="#245BFF"
                    activeColor="#1A45C7"
                    textColor="#FFFFFF"
                    size={72}
                    shape="rect"
                    soundType="gas"
                    isHeavy
                    onPress={handleButtonPress}
                  />

                  {/* Drift / Item Action */}
                  <div className="flex flex-col space-y-2">
                    <GameBoyButton
                      buttonBit={ControllerButton.C}
                      label="C"
                      subLabel="DRIFT"
                      color="#00E5FF"
                      activeColor="#00B4D8"
                      textColor="#09090F"
                      size={52}
                      soundType="click"
                      onPress={handleButtonPress}
                    />
                    <GameBoyButton
                      buttonBit={ControllerButton.D}
                      label="D"
                      subLabel="BOOST"
                      color="#FFD400"
                      activeColor="#D4AF37"
                      textColor="#09090F"
                      size={52}
                      soundType="smash"
                      isHeavy
                      onPress={handleButtonPress}
                    />
                  </div>
                </div>
              )}

              {/* GAME MODE 4: Test Arena Sandbox Pad */}
              {activeGame === 'test-arena' && (
                <div className="grid grid-cols-2 gap-3 sm:gap-4 items-center">
                  <GameBoyButton
                    buttonBit={ControllerButton.B}
                    label="B"
                    subLabel="BTN 2"
                    color={theme.buttonB}
                    size={64}
                    onPress={handleButtonPress}
                  />
                  <GameBoyButton
                    buttonBit={ControllerButton.A}
                    label="A"
                    subLabel="BTN 1"
                    color={theme.buttonA}
                    size={64}
                    onPress={handleButtonPress}
                  />
                  <GameBoyButton
                    buttonBit={ControllerButton.D}
                    label="D"
                    subLabel="BTN 4"
                    color="#FF6B00"
                    size={60}
                    onPress={handleButtonPress}
                  />
                  <GameBoyButton
                    buttonBit={ControllerButton.C}
                    label="C"
                    subLabel="BTN 3"
                    color="#00E5FF"
                    size={60}
                    onPress={handleButtonPress}
                  />
                </div>
              )}
            </div>

            {/* Bottom Section: Authentic Game Boy SELECT, START Pills & Speaker Grills */}
            <div className="relative pt-2 pb-1 border-t-4 border-[#09090F]/20 flex items-center justify-between px-3">
              {/* Left Brand Embossing */}
              <div className="hidden sm:block">
                <span className="font-retro text-[9px] font-black text-[#09090F]/60 tracking-wider">
                  MultiPal™ HANDHELD
                </span>
              </div>

              {/* Center: SELECT and START Rubber Pills */}
              <div className="flex items-center space-x-6 mx-auto">
                {/* SELECT (Settings) Button */}
                <div className="flex flex-col items-center">
                  <button
                    type="button"
                    onClick={() => {
                      retroAudio.playClick();
                      haptics.tap();
                      setIsSettingsOpen(true);
                    }}
                    className="w-14 h-5 bg-[#3B3A45] active:bg-[#202029] border-2 border-[#09090F] shadow-pixel-sm rotate-[-25deg] cursor-pointer"
                  />
                  <span className="font-retro text-[8px] font-black text-[#09090F]/70 tracking-widest mt-2">
                    SELECT
                  </span>
                </div>

                {/* START (Ready) Button */}
                <div className="flex flex-col items-center">
                  <button
                    type="button"
                    onClick={toggleReady}
                    className={`w-14 h-5 border-2 border-[#09090F] shadow-pixel-sm rotate-[-25deg] cursor-pointer transition-colors ${
                      isReady ? 'bg-[#35E58A]' : 'bg-[#3B3A45] active:bg-[#202029]'
                    }`}
                  />
                  <span className="font-retro text-[8px] font-black text-[#09090F]/70 tracking-widest mt-2">
                    {isReady ? 'READY' : 'START'}
                  </span>
                </div>
              </div>

              {/* Right: Authentic Game Boy Angled Speaker Grill Slits */}
              <div className="flex space-x-1.5 rotate-[-25deg] opacity-70">
                <div className="w-1.5 h-8 bg-[#09090F] rounded-full shadow-pixel-inset" />
                <div className="w-1.5 h-8 bg-[#09090F] rounded-full shadow-pixel-inset" />
                <div className="w-1.5 h-8 bg-[#09090F] rounded-full shadow-pixel-inset" />
                <div className="w-1.5 h-8 bg-[#09090F] rounded-full shadow-pixel-inset" />
              </div>
            </div>
          </div>
        )}

        {/* Controller Settings Modal Drawer */}
        <ControllerSettingsModal
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
          currentTheme={currentTheme}
          onThemeChange={handleThemeChange}
          useJoystick={useJoystick}
          onToggleJoystick={handleToggleJoystick}
          ping={ping}
          onLeaveRoom={player ? handleLeaveRoom : undefined}
          nickname={player?.nickname || nickname}
          onNicknameChange={(newNick) => {
            setNickname(newNick);
            localStorage.setItem('multipal_nickname', newNick);
          }}
        />
      </div>
    </PixelBloomBorder>
  );
}
