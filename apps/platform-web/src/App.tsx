import React, { useEffect, useState, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { QRCodeSVG } from 'qrcode.react';
import {
  Room,
  PlayerSlot,
  GameId,
  TestArenaSnapshot,
} from '@multipal/shared-types';
import { Button, Card, CardHeader, CardTitle, Badge } from './components/ui/8bit';
import {
  Maximize2,
  Minimize2,
  Copy,
  Check,
  Gamepad2,
  Play,
} from 'lucide-react';

const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:3001';
const CONTROLLER_PORT = '5201';

export default function App() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [room, setRoom] = useState<Room | null>(null);
  const [arenaSnapshot, setArenaSnapshot] = useState<TestArenaSnapshot | null>(null);
  const [copied, setCopied] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const currentHost = window.location.hostname;
  const controllerUrl = room
    ? `http://${currentHost}:${CONTROLLER_PORT}/join/${room.code}`
    : '';

  useEffect(() => {
    const s = io(SERVER_URL, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 10,
    });

    s.on('connect', () => setConnected(true));
    s.on('disconnect', () => setConnected(false));
    s.on('room:updated', (updatedRoom: Room) => setRoom(updatedRoom));
    s.on('game:state_snapshot', (snapshot: TestArenaSnapshot) => setArenaSnapshot(snapshot));

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
      alert(`ROOM CLOSED: ${reason}`);
      setRoom(null);
    });

    setSocket(s);

    return () => {
      s.disconnect();
    };
  }, []);

  // Render the retro arcade canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !arenaSnapshot) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Pixel crisp settings
    ctx.imageSmoothingEnabled = false;

    // Dark grid background
    ctx.fillStyle = '#0F0F1B';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Pixel grid
    ctx.strokeStyle = '#1D1E2C';
    ctx.lineWidth = 2;
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

    // Outer pixel border
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 8;
    ctx.strokeRect(4, 4, canvas.width - 8, canvas.height - 8);

    // Inner bright border
    ctx.strokeStyle = '#383A59';
    ctx.lineWidth = 2;
    ctx.strokeRect(8, 8, canvas.width - 16, canvas.height - 16);

    // Render 8-bit avatars
    arenaSnapshot.entities.forEach((entity) => {
      ctx.save();

      const size = 36;
      const half = size / 2;
      const x = Math.round(entity.x);
      const y = Math.round(entity.y);

      // Pixel drop shadow
      ctx.fillStyle = '#000000';
      ctx.fillRect(x - half + 4, y - half + 4, size, size);

      // Main pixel square body
      ctx.fillStyle = entity.color;
      ctx.fillRect(x - half, y - half, size, size);

      // Black outline
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 4;
      ctx.strokeRect(x - half, y - half, size, size);

      // Inner highlight
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 2;
      ctx.strokeRect(x - half + 4, y - half + 4, size - 8, size - 8);

      // Action button A visual pulse (Dash/Fire)
      if (entity.lastButtonMask & 1) {
        ctx.strokeStyle = '#FACC15';
        ctx.lineWidth = 4;
        ctx.strokeRect(x - half - 8, y - half - 8, size + 16, size + 16);
      }

      // Action button B visual pulse (Jump/Pulse)
      if (entity.lastButtonMask & 2) {
        ctx.strokeStyle = '#EF4444';
        ctx.lineWidth = 4;
        ctx.strokeRect(x - half - 14, y - half - 14, size + 28, size + 28);
      }

      // Player Slot Label
      ctx.fillStyle = '#000000';
      ctx.font = 'bold 12px "Press Start 2P", monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`P${entity.slotIndex + 1}`, x + 1, y + 1);
      ctx.fillStyle = '#FFFFFF';
      ctx.fillText(`P${entity.slotIndex + 1}`, x, y);

      // Player Nickname Tag above
      ctx.font = '9px "Press Start 2P", monospace';
      ctx.fillStyle = '#000000';
      ctx.fillText(entity.nickname.toUpperCase(), x + 1, y - 28 + 1);
      ctx.fillStyle = '#FACC15';
      ctx.fillText(entity.nickname.toUpperCase(), x, y - 28);

      ctx.restore();
    });
  }, [arenaSnapshot]);

  const handleCreateRoom = () => {
    if (!socket) return;
    socket.emit('room:create', (res: { ok: boolean; room?: Room; error?: string }) => {
      if (res.ok && res.room) {
        setRoom(res.room);
      } else {
        alert(res.error || 'FAILED TO CREATE ROOM');
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

  const connectedPlayersCount = room
    ? Object.values(room.players).filter((p) => p.connected).length
    : 0;

  return (
    <div className="flex flex-col h-screen w-screen bg-[#0D0E15] text-slate-100 overflow-hidden font-retro select-none">
      {/* 8-bit Top Header Bar */}
      <header className="h-16 border-b-4 border-black px-6 flex items-center justify-between bg-[#181926] shadow-pixel">
        <div className="flex items-center space-x-3">
          <div className="px-3 py-1.5 bg-[#FACC15] text-black border-2 border-black font-black text-xs shadow-pixel-sm tracking-wider">
            8-BIT
          </div>
          <div>
            <h1 className="text-sm font-black text-white tracking-widest">
              MULTIP<span className="text-[#FACC15]">AL</span>
            </h1>
            <p className="text-[9px] text-slate-400">ARCADE PARTY PLATFORM</p>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <Badge variant={connected ? 'green' : 'red'}>
            {connected ? '● SERVER ONLINE' : '○ SERVER OFFLINE'}
          </Badge>

          <Button
            variant="secondary"
            size="sm"
            onClick={toggleFullscreen}
            title="Toggle Fullscreen"
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </Button>
        </div>
      </header>

      {/* Main Screen Content */}
      <main className="flex-1 flex overflow-hidden p-6 gap-6">
        {!room ? (
          /* Initial Screen: Create 8-Bit Party Room */
          <div className="m-auto max-w-md w-full">
            <Card className="text-center space-y-6 p-8">
              <div className="w-16 h-16 bg-[#2563EB] border-4 border-black shadow-pixel mx-auto flex items-center justify-center text-white">
                <Gamepad2 className="w-8 h-8" />
              </div>

              <div className="space-y-2">
                <h2 className="text-base font-black text-[#FACC15] tracking-widest">
                  INSERT COIN TO HOST
                </h2>
                <p className="text-[10px] text-slate-400 leading-relaxed">
                  OPEN THIS ON YOUR TV. UP TO 4 PLAYERS SCAN AND USE THEIR MOBILE PHONES AS RETRO CONTROLLERS.
                </p>
              </div>

              <Button
                variant="warning"
                size="lg"
                onClick={handleCreateRoom}
                disabled={!connected}
                className="w-full text-xs"
              >
                ★ CREATE PARTY ROOM ★
              </Button>

              <div className="grid grid-cols-3 gap-2 pt-4 border-t-4 border-black text-[9px] text-slate-400">
                <div className="p-2 bg-[#0D0E15] border-2 border-black">
                  <p className="text-white font-bold">1. HOST</p>
                  <p className="text-[8px] text-slate-500">4-CHAR CODE</p>
                </div>
                <div className="p-2 bg-[#0D0E15] border-2 border-black">
                  <p className="text-white font-bold">2. SCAN</p>
                  <p className="text-[8px] text-slate-500">QR CODE</p>
                </div>
                <div className="p-2 bg-[#0D0E15] border-2 border-black">
                  <p className="text-white font-bold">3. PLAY</p>
                  <p className="text-[8px] text-slate-500">NO DOWNLOAD</p>
                </div>
              </div>
            </Card>
          </div>
        ) : (
          /* Active Room 8-Bit View */
          <div className="flex-1 flex gap-6 overflow-hidden">
            {/* Left Column: Room Code, QR & Players */}
            <div className="w-80 flex flex-col gap-4 overflow-y-auto">
              {/* Room Code & QR Card */}
              <Card className="space-y-3">
                <CardHeader>
                  <CardTitle>ROOM CODE</CardTitle>
                  <Badge variant="green">{room.status}</Badge>
                </CardHeader>

                <div className="text-3xl font-black text-center py-2 bg-[#0D0E15] border-4 border-black shadow-pixel-inset text-[#FACC15] tracking-widest">
                  {room.code}
                </div>

                {/* 8-bit pixel framed QR code */}
                <div className="p-3 bg-white border-4 border-black shadow-pixel mx-auto w-fit">
                  <QRCodeSVG value={controllerUrl} size={140} level="M" />
                </div>

                <div className="text-center space-y-2 pt-1">
                  <p className="text-[9px] text-slate-400">SCAN PHONE TO JOIN</p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCopyLink}
                    className="w-full text-[9px]"
                  >
                    {copied ? <Check className="w-3 h-3 text-emerald-400 mr-1" /> : <Copy className="w-3 h-3 mr-1" />}
                    <span>{copied ? 'COPIED LINK!' : 'COPY LINK'}</span>
                  </Button>
                </div>
              </Card>

              {/* Player Slots Card */}
              <Card className="flex-1 flex flex-col space-y-3">
                <CardHeader>
                  <CardTitle>PLAYERS ({connectedPlayersCount}/4)</CardTitle>
                </CardHeader>

                <div className="space-y-2 flex-1">
                  {room.slots.map((slot: PlayerSlot) => {
                    const player = slot.playerId ? room.players[slot.playerId] : null;
                    const isOccupied = slot.occupied && player;

                    return (
                      <div
                        key={slot.slotIndex}
                        className={`p-2.5 border-4 border-black shadow-pixel-sm flex items-center justify-between ${
                          isOccupied ? 'bg-[#0D0E15]' : 'bg-[#12131D] opacity-60'
                        }`}
                      >
                        <div className="flex items-center space-x-2.5">
                          <div
                            className="w-4 h-4 border-2 border-black"
                            style={{ backgroundColor: slot.color.primary }}
                          />
                          <div>
                            <p className="text-[10px] font-bold text-white">
                              {isOccupied ? player.nickname : slot.label}
                            </p>
                            <p className="text-[8px] text-slate-500">
                              {isOccupied ? (player.connected ? 'ACTIVE' : 'RECONNECTING') : 'AWAITING...'}
                            </p>
                          </div>
                        </div>

                        {isOccupied && (
                          <Badge variant={player.isReady ? 'green' : 'amber'}>
                            {player.isReady ? 'READY' : 'WAIT'}
                          </Badge>
                        )}
                      </div>
                    );
                  })}
                </div>

                <Button
                  variant="warning"
                  size="md"
                  onClick={handleStartGame}
                  disabled={connectedPlayersCount === 0}
                  className="w-full text-xs font-black"
                >
                  <Play className="w-3.5 h-3.5 mr-1 fill-current" />
                  <span>START MATCH</span>
                </Button>
              </Card>
            </div>

            {/* Right Column: Game Selector & Arcade Screen */}
            <div className="flex-1 flex flex-col gap-4 overflow-hidden">
              {/* 8-bit Game Mode Selector */}
              <div className="p-3 bg-[#181926] border-4 border-black shadow-pixel flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="text-[10px] text-[#FACC15] mr-2">GAME:</span>
                  {[
                    { id: 'test-arena', title: 'INPUT TEST' },
                    { id: 'zombie-survival', title: 'ZOMBIE WAVE' },
                    { id: 'platform-fighter', title: 'FIGHTER' },
                    { id: 'racing', title: 'RACER' },
                  ].map((g) => (
                    <Button
                      key={g.id}
                      variant={room.selectedGameId === g.id ? 'warning' : 'secondary'}
                      size="sm"
                      onClick={() => handleGameSelect(g.id as GameId)}
                    >
                      {g.title}
                    </Button>
                  ))}
                </div>

                <div className="text-[9px] text-slate-400 flex items-center space-x-2">
                  <span className="text-emerald-400">● 30HZ TICK</span>
                </div>
              </div>

              {/* Arcade Screen Viewport */}
              <div className="flex-1 bg-[#0F0F1B] border-4 border-black shadow-pixel-lg relative flex items-center justify-center overflow-hidden">
                {countdown !== null && (
                  <div className="absolute inset-0 bg-black/80 z-20 flex flex-col items-center justify-center">
                    <span className="text-8xl font-black text-[#FACC15] animate-bounce">
                      {countdown}
                    </span>
                    <p className="text-sm font-bold text-white mt-4 tracking-widest">
                      GET READY!
                    </p>
                  </div>
                )}

                <canvas
                  ref={canvasRef}
                  width={800}
                  height={600}
                  className="max-w-full max-h-full object-contain"
                />

                {/* Arcade HUD Bottom Banner */}
                <div className="absolute bottom-3 left-4 right-4 bg-[#181926]/95 border-2 border-black shadow-pixel px-4 py-2 flex items-center justify-between text-[9px] text-slate-300">
                  <span className="text-[#FACC15]">
                    JOYSTICK: MOVE • [A]: DASH/FIRE • [B]: PULSE
                  </span>
                  <span>TICK: {arenaSnapshot?.tick || 0}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
