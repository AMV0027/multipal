import React, { useEffect, useState, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import {
  PlayerSession,
  Room,
  ControllerInputPayload,
  JoinRoomResponse,
} from '@multipal/shared-types';
import { VirtualJoystick } from './components/VirtualJoystick';
import { Button, Card, Badge, Input } from './components/ui/8bit';
import { Gamepad2, AlertCircle } from 'lucide-react';

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

  const inputVectorRef = useRef<[number, number]>([0, 0]);
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
        buttons: buttonsMaskRef.current,
      };
      socket.emit('player:input', payload);
    }, 1000 / 30);

    return () => clearInterval(interval);
  }, [socket, player, connected]);

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!socket || !roomCode.trim()) return;

    const cleanCode = roomCode.trim().toUpperCase();
    const cleanNick = nickname.trim().toUpperCase() || 'PLAYER';

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
    <div className="flex flex-col h-screen w-screen bg-[#0D0E15] text-slate-100 overflow-hidden font-retro select-none touch-none">
      {!player ? (
        /* 8-bit Join Room Form */
        <div className="flex-1 flex flex-col justify-center px-4 max-w-sm mx-auto w-full">
          <Card className="space-y-4">
            <div className="text-center space-y-1">
              <div className="w-12 h-12 bg-[#2563EB] border-4 border-black shadow-pixel text-white mx-auto flex items-center justify-center mb-2">
                <Gamepad2 className="w-6 h-6" />
              </div>
              <h2 className="text-sm font-black text-[#FACC15] tracking-widest">
                JOIN GAME
              </h2>
              <p className="text-[9px] text-slate-400">8-BIT CONTROLLER</p>
            </div>

            {errorMsg && (
              <div className="p-2.5 bg-[#DC2626] border-2 border-black text-white text-[9px] flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleJoin} className="space-y-3">
              <div>
                <label className="block text-[9px] text-slate-400 uppercase tracking-wider mb-1">
                  ROOM CODE
                </label>
                <Input
                  type="text"
                  maxLength={4}
                  value={roomCode}
                  onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                  placeholder="K9X2"
                  className="w-full text-center text-xl font-black text-[#FACC15] tracking-widest"
                  required
                />
              </div>

              <div>
                <label className="block text-[9px] text-slate-400 uppercase tracking-wider mb-1">
                  NICKNAME
                </label>
                <Input
                  type="text"
                  maxLength={12}
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  placeholder="HERO"
                  className="w-full text-center text-xs"
                  required
                />
              </div>

              <Button
                type="submit"
                variant="warning"
                size="md"
                disabled={!connected || !roomCode.trim()}
                className="w-full text-xs font-black"
              >
                ★ JOIN GAME ★
              </Button>
            </form>

            <div className="text-center pt-2 border-t-2 border-black">
              <Badge variant={connected ? 'green' : 'red'}>
                {connected ? '● READY' : '○ CONNECTING...'}
              </Badge>
            </div>
          </Card>
        </div>
      ) : (
        /* Connected 8-Bit Arcade Gamepad */
        <div className="flex-1 flex flex-col justify-between p-3 overflow-hidden">
          {/* Header */}
          <header className="flex items-center justify-between pb-2 border-b-4 border-black">
            <div className="flex items-center space-x-2">
              <div
                className="w-7 h-7 border-2 border-black shadow-pixel-sm flex items-center justify-center font-black text-[10px] text-white"
                style={{
                  backgroundColor:
                    room?.slots[player.slotIndex]?.color.primary || '#3B82F6',
                }}
              >
                P{player.slotIndex + 1}
              </div>
              <div>
                <p className="text-[11px] font-black text-[#FACC15] leading-tight">
                  {player.nickname}
                </p>
                <p className="text-[8px] text-slate-400">
                  ROOM: {room?.code}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Button
                variant={isReady ? 'success' : 'secondary'}
                size="sm"
                onClick={toggleReady}
              >
                {isReady ? 'READY' : 'NOT READY'}
              </Button>

              <span
                className={`w-2.5 h-2.5 border border-black ${
                  connected ? 'bg-emerald-400' : 'bg-rose-400'
                }`}
              />
            </div>
          </header>

          {/* Gamepad Controls */}
          <div className="flex-1 flex items-center justify-between px-2 sm:px-6 py-2 gap-4">
            {/* Left Hand: 8-Bit Virtual Joystick */}
            <div className="flex flex-col items-center">
              <VirtualJoystick
                size={150}
                knobSize={58}
                onChange={handleJoystickChange}
                color={
                  room?.slots[player.slotIndex]?.color.primary || '#3B82F6'
                }
              />
              <span className="text-[8px] text-slate-500 uppercase tracking-widest mt-2">
                MOVE
              </span>
            </div>

            {/* Right Hand: 8-Bit Arcade Buttons */}
            <div className="flex items-center space-x-4">
              {/* Button B: Pulse / Jump */}
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
                  className="w-18 h-18 sm:w-20 sm:h-20 bg-[#FACC15] active:bg-[#CA8A04] border-4 border-black shadow-pixel active:translate-x-1 active:translate-y-1 active:shadow-none flex items-center justify-center font-black text-2xl text-black transition-transform select-none touch-none cursor-pointer"
                >
                  B
                </button>
                <span className="text-[8px] text-slate-500 uppercase">PULSE</span>
              </div>

              {/* Button A: Action / Dash / Fire */}
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
                  className="w-20 h-20 sm:w-22 sm:h-22 bg-[#EF4444] active:bg-[#B91C1C] border-4 border-black shadow-pixel active:translate-x-1 active:translate-y-1 active:shadow-none flex items-center justify-center font-black text-3xl text-white transition-transform select-none touch-none cursor-pointer"
                >
                  A
                </button>
                <span className="text-[8px] text-slate-500 uppercase">ACTION</span>
              </div>
            </div>
          </div>

          {/* Footer */}
          <footer className="text-center text-[8px] text-slate-600 py-0.5">
            MULTIP<span className="text-[#FACC15]">AL</span> 8-BIT CONTROLLER
          </footer>
        </div>
      )}
    </div>
  );
}
