import React, { useEffect, useState, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import {
  PlayerSession,
  Room,
  ControllerInputPayload,
  JoinRoomResponse,
  ControllerButton,
} from '@multipal/shared-types';
import { VirtualJoystick } from './components/VirtualJoystick';
import { Button, Card, Badge, Input } from './components/ui/8bit';
import { AlertCircle } from 'lucide-react';

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

  const inputVectorRef = useRef<[number, number]>([0, 0]);
  const aimVectorRef = useRef<[number, number]>([1, 0]);
  const buttonsMaskRef = useRef<number>(0);
  const seqRef = useRef<number>(0);

  useEffect(() => {
    const pathParts = window.location.pathname.split('/');
    const joinIndex = pathParts.indexOf('join');
    if (joinIndex !== -1 && pathParts[joinIndex + 1]) {
      setRoomCode(pathParts[joinIndex + 1].toUpperCase());
    }

    const savedName = localStorage.getItem('multipal_nickname');
    if (savedName) setNickname(savedName);
  }, []);

  useEffect(() => {
    const s = io(SERVER_URL, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 20,
    });

    s.on('connect', () => {
      setConnected(true);
      setErrorMsg(null);

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
    });

    s.on('disconnect', () => setConnected(false));

    s.on('room:updated', (updatedRoom: Room) => {
      setRoom(updatedRoom);
      if (player && updatedRoom.players[player.id]) {
        setPlayer(updatedRoom.players[player.id]);
        setIsReady(updatedRoom.players[player.id].isReady);
      }
    });

    s.on('room:closed', (reason: string) => {
      sessionStorage.removeItem('multipal_session_token');
      sessionStorage.removeItem('multipal_room_code');
      setPlayer(null);
      setRoom(null);
      setErrorMsg(`ROOM CLOSED: ${reason}`);
    });

    setSocket(s);

    return () => {
      s.disconnect();
    };
  }, []);

  // 30Hz input loop
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
    }, 1000 / 30);

    return () => clearInterval(interval);
  }, [socket, player, connected]);

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!socket || !connected) return;

    const cleanCode = roomCode.trim().toUpperCase();
    const cleanNick = nickname.trim().toUpperCase() || 'HERO';

    localStorage.setItem('multipal_nickname', cleanNick);
    setErrorMsg(null);

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
        } else {
          setErrorMsg(res.error || 'FAILED TO JOIN ROOM');
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

  const handleButtonPress = (buttonBit: number, isPressed: boolean) => {
    if (isPressed) {
      buttonsMaskRef.current |= buttonBit;
      try {
        navigator.vibrate?.(15);
      } catch {}
    } else {
      buttonsMaskRef.current &= ~buttonBit;
    }
  };

  const toggleReady = () => {
    if (!socket || !player) return;
    const nextState = !isReady;
    setIsReady(nextState);
    socket.emit('player:ready', { ready: nextState });
  };

  const activeGame = room?.selectedGameId || 'zombie-survival';

  return (
    <div className="flex flex-col h-screen w-screen bg-[#09090F] text-[#F7F4E8] overflow-hidden select-none touch-none">
      {!player ? (
        /* Dark Arcade Join Room Form */
        <div className="flex-1 flex flex-col justify-center px-4 max-w-sm mx-auto w-full">
          <Card className="p-6 bg-[#11111B] border-4 border-[#29293A] shadow-pixel-purple space-y-5">
            <div className="text-center space-y-1">
              <img
                src="/controller/multipal_logo.png"
                alt="MultiPal Logo"
                className="w-16 h-16 object-contain pixelated border-4 border-[#39394F] bg-[#09090F] p-1 shadow-pixel mx-auto mb-2"
              />
              <h2 className="text-sm font-black text-[#F7F4E8] font-retro tracking-widest">
                JOIN GAME
              </h2>
              <p className="text-[10px] text-[#B7B6C9]">8-BIT MOBILE CONTROLLER</p>
            </div>

            {errorMsg && (
              <div className="p-2.5 bg-[#FF4268]/20 border-2 border-[#FF4268] text-[#FF4268] text-[10px] font-bold flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleJoin} className="space-y-4">
              <div>
                <label className="block text-[10px] text-[#B7B6C9] font-bold uppercase tracking-wider mb-1">
                  ROOM CODE
                </label>
                <Input
                  type="text"
                  maxLength={4}
                  value={roomCode}
                  onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                  placeholder="K9X2"
                  className="w-full text-center text-xl font-black text-[#00E5FF] bg-[#1A1A28] border-2 border-[#39394F] focus:border-[#8B35FF] font-retro tracking-widest"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] text-[#B7B6C9] font-bold uppercase tracking-wider mb-1">
                  NICKNAME
                </label>
                <Input
                  type="text"
                  maxLength={12}
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  placeholder="HERO"
                  className="w-full text-center text-xs font-bold text-[#F7F4E8] bg-[#1A1A28] border-2 border-[#39394F] focus:border-[#8B35FF]"
                  required
                />
              </div>

              <Button
                type="submit"
                variant="default"
                size="default"
                disabled={!connected || !roomCode.trim()}
                className="w-full text-xs font-black bg-[#8B35FF] text-[#F7F4E8] hover:bg-[#7222E5] border-2 border-[#09090F] shadow-pixel-cyan font-retro py-3"
              >
                ★ JOIN GAME ★
              </Button>
            </form>

            <div className="text-center pt-2 border-t-2 border-[#29293A]">
              <Badge variant={connected ? 'default' : 'destructive'} className="text-[9px]">
                {connected ? '● READY TO CONNECT' : '○ CONNECTING...'}
              </Badge>
            </div>
          </Card>
        </div>
      ) : (
        /* Connected Dark Arcade Gamepad */
        <div className="flex-1 flex flex-col justify-between p-3 overflow-hidden bg-[#09090F]">
          {/* Header */}
          <header className="flex items-center justify-between pb-2 border-b-4 border-[#29293A] bg-[#11111B] p-2.5 shadow-pixel-sm">
            <div className="flex items-center space-x-2.5">
              <img
                src="/controller/multipal_logo.png"
                alt="Logo"
                className="w-7 h-7 object-contain pixelated border-2 border-[#39394F] bg-[#09090F] p-0.5"
              />
              <div
                className="w-7 h-7 border-2 border-[#09090F] shadow-pixel-sm flex items-center justify-center font-black text-[10px] text-white font-retro"
                style={{
                  backgroundColor:
                    room?.slots[player.slotIndex]?.color.primary || '#245BFF',
                }}
              >
                P{player.slotIndex + 1}
              </div>
              <div>
                <p className="text-[12px] font-bold text-[#F7F4E8] leading-tight">
                  {player.nickname}
                </p>
                <p className="text-[9px] text-[#B7B6C9] font-retro">
                  ROOM: <span className="text-[#00E5FF]">{room?.code}</span> • {activeGame.toUpperCase()}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Button
                variant={isReady ? 'default' : 'secondary'}
                size="sm"
                onClick={toggleReady}
                className={`text-[9px] font-retro ${
                  isReady ? 'bg-[#35E58A] text-[#09090F] border-2 border-[#09090F]' : 'bg-[#1A1A28] text-[#F7F4E8] border border-[#39394F]'
                }`}
              >
                {isReady ? 'READY' : 'NOT READY'}
              </Button>

              <span
                className={`w-2.5 h-2.5 border border-[#09090F] ${
                  connected ? 'bg-[#35E58A]' : 'bg-[#FF4268]'
                }`}
              />
            </div>
          </header>

          {/* Dynamic Controller Layouts */}
          {activeGame === 'zombie-survival' && (
            /* Twin-Stick Zombie Controls (Red, Green, Orange Accents) */
            <div className="flex-1 flex items-center justify-between px-2 sm:px-6 py-2 gap-4">
              {/* Left: Movement Stick */}
              <div className="flex flex-col items-center">
                <VirtualJoystick
                  size={140}
                  knobSize={54}
                  onChange={handleJoystickChange}
                  color={room?.slots[player.slotIndex]?.color.primary || '#245BFF'}
                />
                <span className="text-[9px] text-[#B7B6C9] font-bold uppercase tracking-widest mt-2 font-retro">
                  MOVE
                </span>
              </div>

              {/* Center Action: Nuke / Bomb (Orange Accent) */}
              <div className="flex flex-col items-center space-y-2">
                <button
                  onPointerDown={(e) => {
                    e.preventDefault();
                    handleButtonPress(ControllerButton.B, true);
                  }}
                  onPointerUp={(e) => {
                    e.preventDefault();
                    handleButtonPress(ControllerButton.B, false);
                  }}
                  onPointerCancel={(e) => {
                    e.preventDefault();
                    handleButtonPress(ControllerButton.B, false);
                  }}
                  className="w-14 h-14 bg-[#FF6B00] active:bg-[#D95500] border-4 border-[#09090F] shadow-pixel active:translate-x-1 active:translate-y-1 active:shadow-none flex items-center justify-center font-black text-xs text-[#09090F] font-retro select-none touch-none cursor-pointer"
                >
                  NUKE
                </button>
                <span className="text-[8px] text-[#FFD400] font-retro font-bold">500 PTS</span>
              </div>

              {/* Right: Aiming Stick / Fire Trigger (Danger Red Accent) */}
              <div className="flex flex-col items-center">
                <VirtualJoystick
                  size={140}
                  knobSize={54}
                  onChange={handleAimJoystickChange}
                  color="#FF4268"
                />
                <span className="text-[9px] text-[#FF4268] font-bold uppercase tracking-widest mt-2 font-retro">
                  AIM & FIRE
                </span>
              </div>
            </div>
          )}

          {activeGame === 'platform-fighter' && (
            /* Platform Fighter Controls (Magenta, Cyan, Yellow Accents) */
            <div className="flex-1 flex items-center justify-between px-2 sm:px-6 py-2 gap-4">
              {/* Left: Horizontal Move / Jump Stick */}
              <div className="flex flex-col items-center">
                <VirtualJoystick
                  size={140}
                  knobSize={54}
                  onChange={handleJoystickChange}
                  color={room?.slots[player.slotIndex]?.color.primary || '#245BFF'}
                />
                <span className="text-[9px] text-[#B7B6C9] font-bold uppercase tracking-widest mt-2 font-retro">
                  MOVE
                </span>
              </div>

              {/* Right: Arcade Fighter Buttons */}
              <div className="grid grid-cols-2 gap-3 items-center">
                {/* Button A: Jump (Cyan) */}
                <button
                  onPointerDown={(e) => {
                    e.preventDefault();
                    handleButtonPress(ControllerButton.A, true);
                  }}
                  onPointerUp={(e) => {
                    e.preventDefault();
                    handleButtonPress(ControllerButton.A, false);
                  }}
                  onPointerCancel={(e) => {
                    e.preventDefault();
                    handleButtonPress(ControllerButton.A, false);
                  }}
                  className="w-16 h-16 bg-[#00E5FF] active:bg-[#00B4D8] border-4 border-[#09090F] shadow-pixel active:translate-x-1 active:translate-y-1 active:shadow-none flex items-center justify-center font-black text-xs text-[#09090F] font-retro select-none touch-none cursor-pointer"
                >
                  JUMP
                </button>

                {/* Button B: Light Attack (Yellow) */}
                <button
                  onPointerDown={(e) => {
                    e.preventDefault();
                    handleButtonPress(ControllerButton.B, true);
                  }}
                  onPointerUp={(e) => {
                    e.preventDefault();
                    handleButtonPress(ControllerButton.B, false);
                  }}
                  onPointerCancel={(e) => {
                    e.preventDefault();
                    handleButtonPress(ControllerButton.B, false);
                  }}
                  className="w-16 h-16 bg-[#FFD400] active:bg-[#D4AF37] border-4 border-[#09090F] shadow-pixel active:translate-x-1 active:translate-y-1 active:shadow-none flex items-center justify-center font-black text-xs text-[#09090F] font-retro select-none touch-none cursor-pointer"
                >
                  LIGHT
                </button>

                {/* Button C: Heavy Smash (Magenta) */}
                <button
                  onPointerDown={(e) => {
                    e.preventDefault();
                    handleButtonPress(ControllerButton.C, true);
                  }}
                  onPointerUp={(e) => {
                    e.preventDefault();
                    handleButtonPress(ControllerButton.C, false);
                  }}
                  onPointerCancel={(e) => {
                    e.preventDefault();
                    handleButtonPress(ControllerButton.C, false);
                  }}
                  className="w-16 h-16 bg-[#D91FFF] active:bg-[#B317D4] border-4 border-[#09090F] shadow-pixel active:translate-x-1 active:translate-y-1 active:shadow-none flex items-center justify-center font-black text-xs text-white font-retro select-none touch-none cursor-pointer col-span-2 mx-auto"
                >
                  SMASH
                </button>
              </div>
            </div>
          )}

          {activeGame === 'racing' && (
            /* Split-Screen Racing Controls (Orange, Blue, Cyan Accents) */
            <div className="flex-1 flex items-center justify-between px-2 sm:px-6 py-2 gap-4">
              {/* Left: Steering Stick */}
              <div className="flex flex-col items-center">
                <VirtualJoystick
                  size={140}
                  knobSize={54}
                  onChange={handleJoystickChange}
                  color="#00E5FF"
                />
                <span className="text-[9px] text-[#00E5FF] font-bold uppercase tracking-widest mt-2 font-retro">
                  STEER
                </span>
              </div>

              {/* Right: Pedals */}
              <div className="flex items-center space-x-4">
                {/* Brake / Reverse (Orange Accent) */}
                <div className="flex flex-col items-center space-y-1">
                  <button
                    onPointerDown={(e) => {
                      e.preventDefault();
                      handleButtonPress(ControllerButton.B, true);
                    }}
                    onPointerUp={(e) => {
                      e.preventDefault();
                      handleButtonPress(ControllerButton.B, false);
                    }}
                    onPointerCancel={(e) => {
                      e.preventDefault();
                      handleButtonPress(ControllerButton.B, false);
                    }}
                    className="w-16 h-20 bg-[#FF6B00] active:bg-[#D95500] border-4 border-[#09090F] shadow-pixel active:translate-x-1 active:translate-y-1 active:shadow-none flex items-center justify-center font-black text-xs text-[#09090F] font-retro select-none touch-none cursor-pointer"
                  >
                    BRAKE
                  </button>
                  <span className="text-[8px] text-[#B7B6C9] font-bold">REVERSE</span>
                </div>

                {/* Gas / Accelerate (Blue Accent) */}
                <div className="flex flex-col items-center space-y-1">
                  <button
                    onPointerDown={(e) => {
                      e.preventDefault();
                      handleButtonPress(ControllerButton.A, true);
                    }}
                    onPointerUp={(e) => {
                      e.preventDefault();
                      handleButtonPress(ControllerButton.A, false);
                    }}
                    onPointerCancel={(e) => {
                      e.preventDefault();
                      handleButtonPress(ControllerButton.A, false);
                    }}
                    className="w-20 h-24 bg-[#245BFF] active:bg-[#1A45C7] border-4 border-[#09090F] shadow-pixel active:translate-x-1 active:translate-y-1 active:shadow-none flex items-center justify-center font-black text-sm text-[#F7F4E8] font-retro select-none touch-none cursor-pointer"
                  >
                    GAS
                  </button>
                  <span className="text-[8px] text-[#00E5FF] font-bold">DRIVE</span>
                </div>
              </div>
            </div>
          )}

          {activeGame === 'test-arena' && (
            /* Test Arena Pad */
            <div className="flex-1 flex items-center justify-between px-2 sm:px-6 py-2 gap-4">
              <div className="flex flex-col items-center">
                <VirtualJoystick
                  size={140}
                  knobSize={54}
                  onChange={handleJoystickChange}
                  color={room?.slots[player.slotIndex]?.color.primary || '#245BFF'}
                />
                <span className="text-[9px] text-[#B7B6C9] font-bold uppercase tracking-widest mt-2 font-retro">
                  MOVE
                </span>
              </div>

              <div className="flex items-center space-x-4">
                <button
                  onPointerDown={(e) => {
                    e.preventDefault();
                    handleButtonPress(ControllerButton.B, true);
                  }}
                  onPointerUp={(e) => {
                    e.preventDefault();
                    handleButtonPress(ControllerButton.B, false);
                  }}
                  className="w-18 h-18 bg-[#FFD400] active:bg-[#D4AF37] border-4 border-[#09090F] shadow-pixel flex items-center justify-center font-black text-2xl text-[#09090F] font-retro select-none touch-none cursor-pointer"
                >
                  B
                </button>
                <button
                  onPointerDown={(e) => {
                    e.preventDefault();
                    handleButtonPress(ControllerButton.A, true);
                  }}
                  onPointerUp={(e) => {
                    e.preventDefault();
                    handleButtonPress(ControllerButton.A, false);
                  }}
                  className="w-20 h-20 bg-[#8B35FF] active:bg-[#7222E5] border-4 border-[#09090F] shadow-pixel flex items-center justify-center font-black text-3xl text-[#F7F4E8] font-retro select-none touch-none cursor-pointer"
                >
                  A
                </button>
              </div>
            </div>
          )}

          {/* Footer */}
          <footer className="text-center text-[9px] text-[#77778D] py-1 border-t border-[#29293A]">
            MULTIPAl ARCADE • 30HZ FIXED SIMULATION
          </footer>
        </div>
      )}
    </div>
  );
}
