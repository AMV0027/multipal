import React, { useEffect, useState, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { QRCodeSVG } from 'qrcode.react';
import {
  Room,
  PlayerSlot,
  GameId,
  TestArenaSnapshot,
} from '@multipal/shared-types';
import {
  Users,
  Maximize2,
  Minimize2,
  Tv,
  Gamepad2,
  Wifi,
  WifiOff,
  Copy,
  Check,
  Play,
  RotateCcw,
} from 'lucide-react';

const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:3001';
const CONTROLLER_PORT = '5174';

export default function App() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [room, setRoom] = useState<Room | null>(null);
  const [arenaSnapshot, setArenaSnapshot] = useState<TestArenaSnapshot | null>(null);
  const [copied, setCopied] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Derive join URL using current browser host address
  const currentHost = window.location.hostname;
  const controllerUrl = room
    ? `http://${currentHost}:${CONTROLLER_PORT}/join/${room.code}`
    : '';

  useEffect(() => {
    const s = io(SERVER_URL, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 10,
    });

    s.on('connect', () => {
      setConnected(true);
    });

    s.on('disconnect', () => {
      setConnected(false);
    });

    s.on('room:updated', (updatedRoom: Room) => {
      setRoom(updatedRoom);
    });

    s.on('game:state_snapshot', (snapshot: TestArenaSnapshot) => {
      setArenaSnapshot(snapshot);
    });

    s.on('game:starting', (seconds: number) => {
      setCountdown(seconds);
      const interval = setInterval(() => {
        setCountdown((prev) => {
          if (prev === null || prev <= 1) {
            clearInterval(interval);
            return null;
          }
          return prev - 1;
        });
      }, 1000);
    });

    s.on('room:closed', (reason: string) => {
      alert(`Room closed: ${reason}`);
      setRoom(null);
    });

    setSocket(s);

    return () => {
      s.disconnect();
    };
  }, []);

  // Render the interactive 800x600 test canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !arenaSnapshot) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear background
    ctx.fillStyle = '#0F172A';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw grid lines
    ctx.strokeStyle = '#1E293B';
    ctx.lineWidth = 1;
    for (let x = 0; x < canvas.width; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }
    for (let y = 0; y < canvas.height; y += 40) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }

    // Draw arena boundary
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 3;
    ctx.strokeRect(4, 4, canvas.width - 8, canvas.height - 8);

    // Draw player entities
    arenaSnapshot.entities.forEach((entity) => {
      ctx.save();

      // Shadow
      ctx.shadowColor = entity.color;
      ctx.shadowBlur = (entity.lastButtonMask & 1) ? 25 : 12;

      // Body circle
      ctx.fillStyle = entity.color;
      ctx.beginPath();
      ctx.arc(entity.x, entity.y, 22, 0, Math.PI * 2);
      ctx.fill();

      // Button press visual feedback
      if (entity.lastButtonMask & 1) { // Button A
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(entity.x, entity.y, 28, 0, Math.PI * 2);
        ctx.stroke();
      }
      if (entity.lastButtonMask & 2) { // Button B
        ctx.strokeStyle = '#FBBF24';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(entity.x, entity.y, 34, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Slot index text on avatar
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 14px system-ui';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`P${entity.slotIndex + 1}`, entity.x, entity.y);

      // Nickname above avatar
      ctx.font = '12px system-ui';
      ctx.fillStyle = '#E2E8F0';
      ctx.fillText(entity.nickname, entity.x, entity.y - 32);

      ctx.restore();
    });
  }, [arenaSnapshot]);

  const handleCreateRoom = () => {
    if (!socket) return;
    socket.emit('room:create', (res: { ok: boolean; room?: Room; error?: string }) => {
      if (res.ok && res.room) {
        setRoom(res.room);
      } else {
        alert(res.error || 'Failed to create room');
      }
    });
  };

  const handleCopyLink = () => {
    if (!controllerUrl) return;
    navigator.clipboard.writeText(controllerUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const handleGameSelect = (gameId: GameId) => {
    if (!socket || !room) return;
    socket.emit('game:select', { gameId });
  };

  const handleStartGame = () => {
    if (!socket || !room) return;
    socket.emit('game:start');
  };

  // Connected players count
  const connectedPlayersCount = room
    ? Object.values(room.players).filter((p) => p.connected).length
    : 0;

  return (
    <div className="flex flex-col h-screen w-screen bg-[#0B0F19] text-slate-100 overflow-hidden font-sans">
      {/* Top Navigation Bar */}
      <header className="h-16 border-b border-slate-800 px-6 flex items-center justify-between bg-[#0F172A]/70 backdrop-blur-md">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center font-black tracking-wider text-white shadow-lg shadow-blue-500/20">
            MP
          </div>
          <div>
            <h1 className="font-bold text-lg leading-tight tracking-tight">MultiPal</h1>
            <p className="text-xs text-slate-400">Shared-Screen Party Platform</p>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2 text-xs px-3 py-1.5 rounded-full border border-slate-800 bg-slate-900/60">
            {connected ? (
              <>
                <Wifi className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-slate-300">Server Connected</span>
              </>
            ) : (
              <>
                <WifiOff className="w-3.5 h-3.5 text-rose-400" />
                <span className="text-rose-400">Server Offline</span>
              </>
            )}
          </div>

          <button
            onClick={toggleFullscreen}
            className="p-2 rounded-lg border border-slate-800 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white transition"
            title="Toggle Fullscreen"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex overflow-hidden p-6 gap-6">
        {!room ? (
          /* Initial Screen: Create Party Room */
          <div className="m-auto max-w-lg w-full text-center space-y-6 p-8 rounded-2xl border border-slate-800 bg-[#111827]/80 shadow-2xl">
            <div className="w-16 h-16 rounded-2xl bg-blue-600/10 border border-blue-500/20 mx-auto flex items-center justify-center text-blue-400">
              <Tv className="w-8 h-8" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-bold tracking-tight">Display Screen Host</h2>
              <p className="text-sm text-slate-400">
                Launch this display on a television or shared monitor. Players join instantly with their mobile phone browsers.
              </p>
            </div>

            <button
              onClick={handleCreateRoom}
              disabled={!connected}
              className="w-full py-4 px-6 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:pointer-events-none font-semibold text-white shadow-lg shadow-blue-600/30 transition flex items-center justify-center space-x-2 text-base"
            >
              <Gamepad2 className="w-5 h-5" />
              <span>Create New Room</span>
            </button>

            <div className="grid grid-cols-3 gap-3 pt-4 border-t border-slate-800 text-xs text-slate-400">
              <div>
                <p className="font-semibold text-slate-200">1. Create Room</p>
                <p>Generates 4-char code</p>
              </div>
              <div>
                <p className="font-semibold text-slate-200">2. Scan QR</p>
                <p>Up to 4 phones join</p>
              </div>
              <div>
                <p className="font-semibold text-slate-200">3. Play Instantly</p>
                <p>No app download</p>
              </div>
            </div>
          </div>
        ) : (
          /* Active Room View */
          <div className="flex-1 flex gap-6 overflow-hidden">
            {/* Left Sidebar: Lobby, QR Code & Player Slots */}
            <div className="w-80 flex flex-col gap-4 overflow-y-auto pr-1">
              {/* Room Code Card */}
              <div className="p-5 rounded-2xl border border-slate-800 bg-[#111827] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs uppercase tracking-wider font-semibold text-slate-400">
                    Room Code
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    {room.status}
                  </span>
                </div>

                <div className="text-4xl font-black tracking-widest text-white text-center py-2 bg-slate-900/80 rounded-xl border border-slate-800 font-mono">
                  {room.code}
                </div>

                {/* QR Code Container */}
                <div className="p-3 bg-white rounded-xl mx-auto w-fit shadow-md">
                  <QRCodeSVG value={controllerUrl} size={150} level="M" />
                </div>

                <div className="space-y-1 text-center">
                  <p className="text-xs text-slate-400">Scan with mobile phone to join</p>
                  <button
                    onClick={handleCopyLink}
                    className="text-xs text-blue-400 hover:text-blue-300 flex items-center justify-center space-x-1 mx-auto transition"
                  >
                    {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copied ? 'Copied Join URL!' : 'Copy Controller Link'}</span>
                  </button>
                </div>
              </div>

              {/* Player Slots (Max 4) */}
              <div className="p-5 rounded-2xl border border-slate-800 bg-[#111827] space-y-3 flex-1 flex flex-col">
                <div className="flex items-center justify-between">
                  <span className="text-xs uppercase tracking-wider font-semibold text-slate-400">
                    Players ({connectedPlayersCount}/4)
                  </span>
                  <Users className="w-4 h-4 text-slate-400" />
                </div>

                <div className="space-y-2 flex-1">
                  {room.slots.map((slot: PlayerSlot) => {
                    const player = slot.playerId ? room.players[slot.playerId] : null;
                    const isOccupied = slot.occupied && player;

                    return (
                      <div
                        key={slot.slotIndex}
                        className={`p-3 rounded-xl border transition flex items-center justify-between ${
                          isOccupied
                            ? 'border-slate-700 bg-slate-900/80'
                            : 'border-dashed border-slate-800/80 bg-slate-900/30'
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <div
                            className="w-4 h-4 rounded-full flex-shrink-0"
                            style={{ backgroundColor: slot.color.primary }}
                          />
                          <div>
                            <p className="text-sm font-semibold text-slate-200">
                              {isOccupied ? player.nickname : slot.label}
                            </p>
                            <p className="text-xs text-slate-500">
                              {isOccupied
                                ? player.connected
                                  ? 'Active Controller'
                                  : 'Disconnected (Holding Slot)'
                                : 'Awaiting player...'}
                            </p>
                          </div>
                        </div>

                        {isOccupied && (
                          <div className="flex items-center space-x-1.5">
                            <span
                              className={`w-2 h-2 rounded-full ${
                                player.connected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
                              }`}
                            />
                            {player.isReady && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 font-medium">
                                Ready
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Host Control Action */}
                <button
                  onClick={handleStartGame}
                  disabled={connectedPlayersCount === 0}
                  className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:pointer-events-none font-semibold text-white shadow-lg shadow-emerald-600/20 transition flex items-center justify-center space-x-2 text-sm"
                >
                  <Play className="w-4 h-4" />
                  <span>Start Match</span>
                </button>
              </div>
            </div>

            {/* Right Stage: Interactive Vertical Slice Canvas & Game Selector */}
            <div className="flex-1 flex flex-col gap-4 overflow-hidden">
              {/* Game Mode Selector Tabs */}
              <div className="p-2 rounded-2xl border border-slate-800 bg-[#111827] flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 px-3">
                    Game:
                  </span>
                  {[
                    { id: 'test-arena', title: 'Input Test Arena' },
                    { id: 'zombie-survival', title: 'Zombie Survival' },
                    { id: 'platform-fighter', title: 'Platform Fighter' },
                    { id: 'racing', title: 'Split-Screen Racing' },
                  ].map((g) => (
                    <button
                      key={g.id}
                      onClick={() => handleGameSelect(g.id as GameId)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                        room.selectedGameId === g.id
                          ? 'bg-blue-600 text-white shadow'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                      }`}
                    >
                      {g.title}
                    </button>
                  ))}
                </div>

                <div className="text-xs text-slate-400 px-3 flex items-center space-x-2">
                  <span>30Hz Tick Rate</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                </div>
              </div>

              {/* Live Canvas / Game Screen */}
              <div className="flex-1 rounded-2xl border border-slate-800 bg-[#0F172A] relative flex items-center justify-center overflow-hidden shadow-inner">
                {countdown !== null && (
                  <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-20 flex flex-col items-center justify-center">
                    <span className="text-8xl font-black text-amber-400 animate-ping">
                      {countdown}
                    </span>
                    <p className="text-lg font-semibold text-slate-300 mt-4">Game Starting...</p>
                  </div>
                )}

                <canvas
                  ref={canvasRef}
                  width={800}
                  height={600}
                  className="rounded-xl shadow-2xl border border-slate-800 max-w-full max-h-full object-contain"
                />

                {/* Overlay Instruction Hint */}
                <div className="absolute bottom-4 left-6 right-6 flex items-center justify-between text-xs text-slate-400 bg-slate-900/80 px-4 py-2 rounded-xl backdrop-blur border border-slate-800">
                  <span>
                    Move your mobile joystick to control your avatar. Press button A/B for action pulses.
                  </span>
                  <span>Tick: {arenaSnapshot?.tick || 0}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
