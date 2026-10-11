import React, { useEffect, useState, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import {
  PlayerSession,
  Room,
  ControllerInputPayload,
  JoinRoomResponse,
} from '@multipal/shared-types';
import { VirtualJoystick } from './components/VirtualJoystick';
import {
  Wifi,
  WifiOff,
  Gamepad2,
  CheckCircle2,
  Circle,
  AlertCircle,
  Smartphone,
} from 'lucide-react';

const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:3001';

export default function App() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [roomCode, setRoomCode] = useState('');
  const [nickname, setNickname] = useState('');
  const [player, setPlayer] = useState<PlayerSession | null>(null);
  const [room, setRoom] = useState<Room | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);

  // Active controller input state
  const inputVectorRef = useRef<[number, number]>([0, 0]);
  const buttonsMaskRef = useRef<number>(0);
  const seqRef = useRef<number>(0);

  // Extract room code from URL (e.g. /join/K9X2)
  useEffect(() => {
    const pathParts = window.location.pathname.split('/');
    const joinIndex = pathParts.indexOf('join');
    if (joinIndex !== -1 && pathParts[joinIndex + 1]) {
      setRoomCode(pathParts[joinIndex + 1].toUpperCase());
    }

    const savedName = localStorage.getItem('multipal_nickname');
    if (savedName) setNickname(savedName);
  }, []);

  // Initialize Socket.IO connection
  useEffect(() => {
    const s = io(SERVER_URL, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 20,
    });

    s.on('connect', () => {
      setConnected(true);
      setErrorMsg(null);

      // Check if we have an existing sessionToken to resume
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

    s.on('disconnect', () => {
      setConnected(false);
    });

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
      setErrorMsg(`Room closed: ${reason}`);
    });

    setSocket(s);

    return () => {
      s.disconnect();
    };
  }, []);

  // 30Hz high-frequency input dispatch loop
  useEffect(() => {
    if (!socket || !player || !connected) return;

    const interval = setInterval(() => {
      seqRef.current++;
      const payload: ControllerInputPayload = {
        seq: seqRef.current,
        timestamp: Date.now(),
        vector: inputVectorRef.current,
        buttons: buttonsMaskRef.current,
      };
      socket.emit('player:input', payload);
    }, 1000 / 30); // 30Hz

    return () => clearInterval(interval);
  }, [socket, player, connected]);

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!socket || !roomCode.trim()) return;

    const cleanCode = roomCode.trim().toUpperCase();
    const cleanNick = nickname.trim() || 'Player';

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
          setErrorMsg(res.error || 'Failed to join room');
        }
      }
    );
  };

  const handleJoystickChange = useCallback((vector: [number, number]) => {
    inputVectorRef.current = vector;
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

  return (
    <div className="flex flex-col h-screen w-screen bg-[#0B0F19] text-slate-100 overflow-hidden font-sans select-none touch-none">
      {!player ? (
        /* Join Room Form */
        <div className="flex-1 flex flex-col justify-center px-6 max-w-sm mx-auto w-full">
          <div className="p-6 rounded-2xl border border-slate-800 bg-[#111827] shadow-2xl space-y-5">
            <div className="text-center space-y-1">
              <div className="w-12 h-12 rounded-xl bg-blue-600/10 border border-blue-500/20 text-blue-400 mx-auto flex items-center justify-center mb-2">
                <Smartphone className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-bold tracking-tight">Join Party Room</h2>
              <p className="text-xs text-slate-400">Your phone is your game controller</p>
            </div>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleJoin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Room Code
                </label>
                <input
                  type="text"
                  maxLength={4}
                  value={roomCode}
                  onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                  placeholder="e.g. K9X2"
                  className="w-full text-center text-2xl font-mono font-bold tracking-widest py-3 px-4 rounded-xl bg-slate-900 border border-slate-800 text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 uppercase"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Your Nickname
                </label>
                <input
                  type="text"
                  maxLength={15}
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  placeholder="Enter nickname"
                  className="w-full py-3 px-4 rounded-xl bg-slate-900 border border-slate-800 text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 text-sm"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={!connected || !roomCode.trim()}
                className="w-full py-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:pointer-events-none font-semibold text-white shadow-lg shadow-blue-600/30 transition text-sm flex items-center justify-center space-x-2"
              >
                <Gamepad2 className="w-4 h-4" />
                <span>Join Game</span>
              </button>
            </form>

            <div className="flex items-center justify-center space-x-2 text-xs text-slate-500 pt-2 border-t border-slate-800">
              {connected ? (
                <>
                  <Wifi className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Ready to connect</span>
                </>
              ) : (
                <>
                  <WifiOff className="w-3.5 h-3.5 text-rose-400" />
                  <span>Connecting to game server...</span>
                </>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* Connected Controller Gamepad View */
        <div className="flex-1 flex flex-col justify-between p-4 overflow-hidden">
          {/* Controller Header */}
          <header className="flex items-center justify-between pb-3 border-b border-slate-800/80">
            <div className="flex items-center space-x-2.5">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs text-white shadow"
                style={{
                  backgroundColor:
                    room?.slots[player.slotIndex]?.color.primary || '#3B82F6',
                }}
              >
                P{player.slotIndex + 1}
              </div>
              <div>
                <p className="text-sm font-bold text-slate-100 leading-tight">
                  {player.nickname}
                </p>
                <p className="text-[11px] text-slate-400 font-mono">
                  Room: {room?.code}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <button
                onClick={toggleReady}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition ${
                  isReady
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : 'bg-slate-800 text-slate-400 border border-slate-700'
                }`}
              >
                {isReady ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <Circle className="w-3.5 h-3.5" />
                )}
                <span>{isReady ? 'Ready' : 'Not Ready'}</span>
              </button>

              <div className="flex items-center space-x-1 text-[11px] text-slate-400">
                <span
                  className={`w-2 h-2 rounded-full ${
                    connected ? 'bg-emerald-400' : 'bg-rose-400 animate-ping'
                  }`}
                />
              </div>
            </div>
          </header>

          {/* Gamepad Controls Area */}
          <div className="flex-1 flex items-center justify-between px-2 sm:px-8 py-4 gap-4">
            {/* Left Hand: Virtual Joystick */}
            <div className="flex flex-col items-center">
              <VirtualJoystick
                size={160}
                knobSize={64}
                onChange={handleJoystickChange}
                color={
                  room?.slots[player.slotIndex]?.color.primary || '#3B82F6'
                }
              />
              <span className="text-[10px] text-slate-500 uppercase tracking-widest mt-2">
                Movement
              </span>
            </div>

            {/* Right Hand: Action Buttons */}
            <div className="flex items-center space-x-5">
              {/* Button B: Secondary Action / Jump / Pulse */}
              <div className="flex flex-col items-center space-y-1">
                <button
                  onPointerDown={(e) => {
                    e.preventDefault();
                    handleButtonPress(2, true);
                  }}
                  onPointerUp={(e) => {
                    e.preventDefault();
                    handleButtonPress(2, false);
                  }}
                  onPointerCancel={(e) => {
                    e.preventDefault();
                    handleButtonPress(2, false);
                  }}
                  className="w-18 h-18 sm:w-20 sm:h-20 rounded-full bg-slate-800 active:bg-amber-600 border-2 border-slate-600 active:border-amber-400 active:scale-95 shadow-xl flex items-center justify-center font-black text-xl text-amber-400 active:text-white transition-transform touch-none"
                >
                  B
                </button>
                <span className="text-[10px] text-slate-500 uppercase">Action B</span>
              </div>

              {/* Button A: Primary Action / Dash / Fire */}
              <div className="flex flex-col items-center space-y-1">
                <button
                  onPointerDown={(e) => {
                    e.preventDefault();
                    handleButtonPress(1, true);
                  }}
                  onPointerUp={(e) => {
                    e.preventDefault();
                    handleButtonPress(1, false);
                  }}
                  onPointerCancel={(e) => {
                    e.preventDefault();
                    handleButtonPress(1, false);
                  }}
                  className="w-20 h-20 sm:w-22 sm:h-22 rounded-full bg-blue-600 active:bg-blue-500 border-2 border-blue-400 active:scale-95 shadow-2xl flex items-center justify-center font-black text-2xl text-white transition-transform touch-none"
                >
                  A
                </button>
                <span className="text-[10px] text-slate-500 uppercase">Action A</span>
              </div>
            </div>
          </div>

          {/* Footer Bar */}
          <footer className="text-center text-[10px] text-slate-600 py-1">
            Keep phone awake • MultiPal Controller v1.0
          </footer>
        </div>
      )}
    </div>
  );
}
