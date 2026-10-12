import React, { useEffect, useState, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { QRCodeSVG } from 'qrcode.react';
import {
  Room,
  PlayerSlot,
  GameId,
  GameStateSnapshot,
  ZombieSurvivalSnapshot,
  PlatformFighterSnapshot,
  RacingGameSnapshot,
  TestArenaSnapshot,
} from '@multipal/shared-types';

// Official 8bitcn UI components and blocks
import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Badge,
} from './components/ui/8bit';
import Hero3 from './components/ui/8bit/blocks/hero3';
import Feature1, { FeatureItem } from './components/ui/8bit/blocks/feature1';
import GameTeam1, { PartyMember } from './components/ui/8bit/blocks/game-team1';
import SocialProof1, { SocialStat } from './components/ui/8bit/blocks/social-proof1';
import FAQ1, { FAQItem } from './components/ui/8bit/blocks/faq1';
import Footer1 from './components/ui/8bit/blocks/footer1';
import GameCTA1 from './components/ui/8bit/blocks/game-cta1';

import {
  Maximize2,
  Minimize2,
  Copy,
  Check,
  Play,
  Tv,
  Smartphone,
  Flame,
} from 'lucide-react';
import { assetManager } from './lib/asset-manager';

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
  const [room, setRoom] = useState<Room | null>(null);
  const [gameSnapshot, setGameSnapshot] = useState<GameStateSnapshot | null>(null);
  const [copied, setCopied] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const prevSnapshotRef = useRef<GameStateSnapshot | null>(null);

  const currentOrigin = typeof window !== 'undefined' ? window.location.origin : '';
  const controllerUrl = room
    ? (isDedicatedDevPort
        ? `http://${window.location.hostname}:5201/join/${room.code}`
        : `${currentOrigin}/join/${room.code}`)
    : (isDedicatedDevPort
        ? `http://${window.location.hostname}:5201`
        : `${currentOrigin}/join`);

  useEffect(() => {
    const s = io(SERVER_URL, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 10,
    });

    s.on('connect', () => setConnected(true));
    s.on('disconnect', () => setConnected(false));
    s.on('room:updated', (updatedRoom: Room) => setRoom(updatedRoom));
    s.on('game:state_snapshot', (snapshot: GameStateSnapshot) => setGameSnapshot(snapshot));

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

    setSocket(s);

    // Preload game sprites, character animations, tilesets, and sound effects
    assetManager.preloadAll();

    return () => {
      s.disconnect();
    };
  }, []);

  // Multi-Game Canvas Rendering Loop (Themed with Dark Arcade & Game-Specific Accents)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !gameSnapshot) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.imageSmoothingEnabled = false;

    // 1. ZOMBIE SURVIVAL RENDERER (Dark Foundation #09090F, Danger Red #FF4268, Toxic Green #35E58A, Orange #FF6B00)
    if (gameSnapshot.gameId === 'zombie-survival') {
      const snap = gameSnapshot as ZombieSurvivalSnapshot;

      // Dark apocalyptic concrete arena
      ctx.fillStyle = '#09090F';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Arena grid & subtle borders
      ctx.strokeStyle = '#1A1A28';
      ctx.lineWidth = 1.5;
      for (let x = 0; x < canvas.width; x += 50) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }
      for (let y = 0; y < canvas.height; y += 50) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }

      // Border barricades (#FF4268 & #29293A)
      ctx.strokeStyle = '#FF4268';
      ctx.lineWidth = 4;
      ctx.strokeRect(2, 2, canvas.width - 4, canvas.height - 4);

      // Drops (Ammo #FF6B00, Health #35E58A, Speed #00E5FF)
      snap.drops.forEach((d) => {
        ctx.fillStyle = d.type === 'health' ? '#35E58A' : d.type === 'ammo' ? '#FF6B00' : '#00E5FF';
        ctx.fillRect(d.x - 8, d.y - 8, 16, 16);
        ctx.strokeStyle = '#09090F';
        ctx.lineWidth = 2;
        ctx.strokeRect(d.x - 8, d.y - 8, 16, 16);
        ctx.fillStyle = '#09090F';
        ctx.font = '8px "Press Start 2P"';
        ctx.textAlign = 'center';
        ctx.fillText(d.type === 'health' ? '+' : 'A', d.x, d.y + 3);
      });

      // Bullets (Electric Yellow #FFD400)
      ctx.fillStyle = '#FFD400';
      snap.bullets.forEach((b) => {
        ctx.fillRect(b.x - 3, b.y - 3, 6, 6);
      });

      // Zombies with Authentic Sprite Assets
      snap.zombies.forEach((z) => {
        const spriteKey =
          z.type === 'boss'
            ? 'zombie_boss'
            : z.type === 'brute'
            ? 'zombie_brute'
            : z.type === 'runner'
            ? 'zombie_runner'
            : 'zombie_walker';

        const img = assetManager.getImage(spriteKey);
        const size = z.type === 'boss' ? 52 : z.type === 'brute' ? 40 : 32;

        ctx.save();
        ctx.translate(z.x, z.y);

        if (img && img.complete) {
          ctx.drawImage(img, -size / 2, -size / 2, size, size);
        } else {
          ctx.fillStyle = z.type === 'boss' ? '#FF4268' : z.type === 'brute' ? '#D91FFF' : z.type === 'runner' ? '#FF6B00' : '#35E58A';
          ctx.fillRect(-size / 2, -size / 2, size, size);
          ctx.strokeStyle = '#09090F';
          ctx.lineWidth = 3;
          ctx.strokeRect(-size / 2, -size / 2, size, size);
        }
        ctx.restore();

        // Zombie HP bar
        const hpPercent = Math.max(0, z.hp / z.maxHp);
        ctx.fillStyle = '#1A1A28';
        ctx.fillRect(z.x - size / 2, z.y - size / 2 - 8, size, 4);
        ctx.fillStyle = '#FF4268';
        ctx.fillRect(z.x - size / 2, z.y - size / 2 - 8, size * hpPercent, 4);
      });

      // Players with Authentic Survivor Sprites & Aim Rotation
      snap.players.forEach((p) => {
        // Shadow
        ctx.fillStyle = 'rgba(9,9,15,0.7)';
        ctx.fillRect(p.x - 14, p.y - 14, 28, 28);

        const colorKeys = ['blue', 'red', 'green', 'yellow'];
        const colorName = colorKeys[p.slotIndex % 4];
        const survivorKey = p.isDowned ? `survivor_${colorName}_stand` : `survivor_${colorName}_gun`;
        const img = assetManager.getImage(survivorKey);

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.aimAngle);

        if (img && img.complete) {
          ctx.drawImage(img, -20, -20, 40, 40);
        } else {
          ctx.fillStyle = p.isDowned ? '#77778D' : p.color;
          ctx.fillRect(-14, -14, 28, 28);
          ctx.strokeStyle = '#09090F';
          ctx.lineWidth = 3;
          ctx.strokeRect(-14, -14, 28, 28);

          if (!p.isDowned) {
            ctx.strokeStyle = '#00E5FF';
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(22, 0);
            ctx.stroke();
          }
        }
        ctx.restore();

        // Nickname & Health Bar
        ctx.font = '9px "Press Start 2P"';
        ctx.fillStyle = '#F7F4E8';
        ctx.textAlign = 'center';
        ctx.fillText(p.nickname, p.x, p.y - 24);

        // Health Bar
        ctx.fillStyle = '#11111B';
        ctx.fillRect(p.x - 16, p.y - 20, 32, 4);
        ctx.fillStyle = p.isDowned ? '#FF6B00' : '#35E58A';
        ctx.fillRect(p.x - 16, p.y - 20, 32 * (p.hp / p.maxHp), 4);

        if (p.isDowned) {
          ctx.fillStyle = '#FF4268';
          ctx.fillText(`REVIVE ${p.reviveProgress}%`, p.x, p.y + 24);
        }
      });

      // HUD overlay
      ctx.font = '12px "Press Start 2P"';
      ctx.fillStyle = '#F7F4E8';
      ctx.textAlign = 'left';
      ctx.fillText(`WAVE: ${snap.wave}/10`, 20, 30);
      ctx.fillStyle = '#00E5FF';
      ctx.fillText(snap.isWaveIntermission ? 'PREPARE SQUAD' : `TIMER: ${snap.waveTimeRemaining}s`, 20, 50);
      ctx.fillStyle = '#FF4268';
      ctx.fillText(`ZOMBIES: ${snap.zombies.length}`, 20, 70);

      if (snap.isGameOver) {
        ctx.fillStyle = 'rgba(9,9,15,0.9)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#FF4268';
        ctx.font = '24px "Press Start 2P"';
        ctx.textAlign = 'center';
        ctx.fillText('SQUAD ELIMINATED', canvas.width / 2, canvas.height / 2);
      } else if (snap.isVictory) {
        ctx.fillStyle = 'rgba(9,9,15,0.9)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#35E58A';
        ctx.font = '24px "Press Start 2P"';
        ctx.textAlign = 'center';
        ctx.fillText('MISSION SURVIVED!', canvas.width / 2, canvas.height / 2);
      }
    }

    // 2. PLATFORM FIGHTER RENDERER (Magenta #D91FFF, Cyan #00E5FF, Yellow #FFD400)
    else if (gameSnapshot.gameId === 'platform-fighter') {
      const snap = gameSnapshot as PlatformFighterSnapshot;

      // Dark cyber sky background with authentic Parallax Image Backdrop
      const skyImg = assetManager.getImage('fighter_sky_bg');
      if (skyImg && skyImg.complete) {
        ctx.drawImage(skyImg, 0, 0, canvas.width, canvas.height);
      } else {
        ctx.fillStyle = '#09090F';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#11111B';
        ctx.fillRect(0, 480, canvas.width, 120);
      }

      // Floating Platforms (#1A1A28 with #D91FFF border & #00E5FF neon edge)
      snap.platforms.forEach((plat) => {
        ctx.fillStyle = '#1A1A28';
        ctx.fillRect(plat.x, plat.y, plat.width, plat.height);
        ctx.strokeStyle = '#D91FFF';
        ctx.lineWidth = 3;
        ctx.strokeRect(plat.x, plat.y, plat.width, plat.height);

        // Platform neon edge
        ctx.fillStyle = '#00E5FF';
        ctx.fillRect(plat.x, plat.y, plat.width, 3);
      });

      // Fighters with Full Character Archetype Animation Poses
      // P1: Swift (Adventurer), P2: Heavy (Soldier), P3: Balanced (Player), P4: Ranger (Zombie/Female)
      const archetypes = ['swift', 'heavy', 'balanced', 'ranger'];

      snap.players.forEach((p) => {
        if (p.isEliminated) return;

        // Invincible flash
        if (p.invincibleFrames > 0 && Math.floor(p.invincibleFrames / 4) % 2 === 0) {
          ctx.globalAlpha = 0.4;
        }

        const arch = archetypes[p.slotIndex % 4];
        let pose = 'idle';

        // Select animated pose based on player state
        if (!p.isGrounded) {
          pose = p.isAttacking ? 'kick' : 'jump';
        } else if (p.isAttacking) {
          pose = p.attackType === 'heavy' ? 'action2' : 'action1';
        } else if (Math.abs(p.vx) > 20) {
          // Walk animation cycle (alternates based on game tick)
          pose = Math.floor(snap.tick / 6) % 2 === 0 ? 'walk1' : 'walk2';
        }

        const spriteKey = `${arch}_${pose}`;
        const img = assetManager.getImage(spriteKey);

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.scale(p.facing, 1); // Flip sprite horizontally to face direction

        if (img && img.complete) {
          ctx.drawImage(img, -24, -30, 48, 48);
        } else {
          // Fallback colored pixel character
          ctx.fillStyle = p.color;
          ctx.fillRect(-14, -18, 28, 36);
          ctx.strokeStyle = '#09090F';
          ctx.lineWidth = 3;
          ctx.strokeRect(-14, -18, 28, 36);

          if (p.isAttacking) {
            ctx.fillStyle = '#FF2E88';
            ctx.fillRect(12, -14, 20, 28);
          }
        }
        ctx.restore();

        // Attack slash particle effect
        if (p.isAttacking) {
          ctx.fillStyle = '#FF2E88';
          const slashX = p.facing === 1 ? p.x + 14 : p.x - 38;
          ctx.fillRect(slashX, p.y - 12, 24, 24);
        }

        // Nickname
        ctx.font = '9px "Press Start 2P"';
        ctx.fillStyle = '#F7F4E8';
        ctx.textAlign = 'center';
        ctx.fillText(p.nickname, p.x, p.y - 28);

        ctx.globalAlpha = 1.0;
      });

      // Stock & Damage HUD at bottom
      snap.players.forEach((p, idx) => {
        const hudX = 100 + idx * 160;
        const hudY = 540;

        ctx.fillStyle = '#1A1A28';
        ctx.fillRect(hudX - 50, hudY - 30, 100, 50);
        ctx.strokeStyle = p.color;
        ctx.lineWidth = 2;
        ctx.strokeRect(hudX - 50, hudY - 30, 100, 50);

        // Stocks
        ctx.fillStyle = '#FFD400';
        ctx.font = '8px "Press Start 2P"';
        ctx.textAlign = 'center';
        ctx.fillText(`STOCKS: ${'● '.repeat(p.stocks)}`, hudX, hudY - 14);

        // Damage %
        const dmgColor = p.damagePercent > 120 ? '#FF4268' : p.damagePercent > 60 ? '#FF6B00' : '#F7F4E8';
        ctx.fillStyle = dmgColor;
        ctx.font = '14px "Press Start 2P"';
        ctx.fillText(`${p.damagePercent}%`, hudX, hudY + 12);
      });

      // Match timer
      ctx.font = '12px "Press Start 2P"';
      ctx.fillStyle = '#00E5FF';
      ctx.textAlign = 'center';
      ctx.fillText(`TIME: ${snap.timeRemainingSec}s`, canvas.width / 2, 35);

      if (snap.isGameOver) {
        ctx.fillStyle = 'rgba(9,9,15,0.9)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#FFD400';
        ctx.font = '24px "Press Start 2P"';
        ctx.textAlign = 'center';
        ctx.fillText(`WINNER: PLAYER ${(snap.winnerSlotIndex || 0) + 1}`, canvas.width / 2, canvas.height / 2);
      }
    }

    // 3. SPLIT-SCREEN RACING RENDERER (Orange #FF6B00, Blue #245BFF, Cyan #00E5FF)
    else if (gameSnapshot.gameId === 'racing') {
      const snap = gameSnapshot as RacingGameSnapshot;

      // Clear Canvas to dark secondary
      ctx.fillStyle = '#09090F';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const viewports = [
        { x: 0, y: 0, w: 400, h: 300 },
        { x: 400, y: 0, w: 400, h: 300 },
        { x: 0, y: 300, w: 400, h: 300 },
        { x: 400, y: 300, w: 400, h: 300 },
      ];

      // Draw each player's viewport
      snap.karts.forEach((kart, idx) => {
        const vp = viewports[idx];
        if (!vp) return;

        ctx.save();
        ctx.beginPath();
        ctx.rect(vp.x, vp.y, vp.w, vp.h);
        ctx.clip();

        // Asphalt Track Surface
        ctx.fillStyle = '#11111B';
        ctx.fillRect(vp.x, vp.y, vp.w, vp.h);

        // Draw Waypoint Circuit Line (#1A1A28)
        ctx.strokeStyle = '#1A1A28';
        ctx.lineWidth = 44;
        ctx.beginPath();
        snap.waypoints.forEach((wp, wIdx) => {
          if (wIdx === 0) ctx.moveTo(wp.x, wp.y);
          else ctx.lineTo(wp.x, wp.y);
        });
        ctx.closePath();
        ctx.stroke();

        // Curbs (#FF6B00 & #245BFF)
        ctx.strokeStyle = '#29293A';
        ctx.lineWidth = 46;
        ctx.stroke();

        // Finish Line (#00E5FF)
        const wp0 = snap.waypoints[0];
        if (wp0) {
          ctx.strokeStyle = '#00E5FF';
          ctx.lineWidth = 8;
          ctx.strokeRect(wp0.x - 20, wp0.y - 20, 40, 40);
        }

        // Draw all karts inside viewport with Authentic Vehicle Sprites
        snap.karts.forEach((k) => {
          ctx.save();
          ctx.translate(k.x, k.y);
          ctx.rotate(k.angle);

          const carColors = ['car_blue', 'car_red', 'car_green', 'car_yellow'];
          const carKey = carColors[k.slotIndex % 4];
          const img = assetManager.getImage(carKey);

          if (img && img.complete) {
            ctx.drawImage(img, -20, -12, 40, 24);
          } else {
            // Fallback Kart chassis
            ctx.fillStyle = k.color;
            ctx.fillRect(-14, -8, 28, 16);
            ctx.strokeStyle = '#09090F';
            ctx.lineWidth = 2;
            ctx.strokeRect(-14, -8, 28, 16);

            // Wheels
            ctx.fillStyle = '#09090F';
            ctx.fillRect(-12, -11, 8, 4);
            ctx.fillRect(6, -11, 8, 4);
            ctx.fillRect(-12, 7, 8, 4);
            ctx.fillRect(6, 7, 8, 4);
          }

          ctx.restore();
        });

        // Viewport Border (Active Player Color)
        ctx.strokeStyle = kart.color;
        ctx.lineWidth = 4;
        ctx.strokeRect(vp.x, vp.y, vp.w, vp.h);

        // Viewport HUD
        ctx.font = '9px "Press Start 2P"';
        ctx.fillStyle = '#F7F4E8';
        ctx.textAlign = 'left';
        ctx.fillText(`P${kart.slotIndex + 1} ${kart.nickname}`, vp.x + 12, vp.y + 20);
        ctx.fillStyle = '#FFD400';
        ctx.fillText(`LAP ${kart.currentLap}/${kart.maxLaps}`, vp.x + 12, vp.y + 36);
        ctx.fillStyle = '#00E5FF';
        ctx.fillText(`${kart.speed} KM/H`, vp.x + 12, vp.y + 52);

        if (kart.isFinished) {
          ctx.fillStyle = '#35E58A';
          ctx.font = '14px "Press Start 2P"';
          ctx.fillText(`RANK #${kart.finishRank}`, vp.x + 80, vp.y + 150);
        }

        ctx.restore();
      });

      // Grid dividers (#29293A)
      ctx.strokeStyle = '#29293A';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(400, 0); ctx.lineTo(400, 600);
      ctx.moveTo(0, 300); ctx.lineTo(800, 300);
      ctx.stroke();

      if (snap.isRaceOver) {
        ctx.fillStyle = 'rgba(9,9,15,0.9)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#FFD400';
        ctx.font = '24px "Press Start 2P"';
        ctx.textAlign = 'center';
        ctx.fillText('CHECKERED FLAG!', canvas.width / 2, canvas.height / 2);
      }
    }

    // 4. TEST ARENA DEFAULT RENDERER
    else {
      const snap = gameSnapshot as TestArenaSnapshot;
      ctx.fillStyle = '#09090F';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.strokeStyle = '#1A1A28';
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

      ctx.strokeStyle = '#8B35FF';
      ctx.lineWidth = 4;
      ctx.strokeRect(2, 2, canvas.width - 4, canvas.height - 4);

      snap.entities?.forEach((p) => {
        ctx.fillStyle = 'rgba(9,9,15,0.6)';
        ctx.fillRect(p.x - 14, p.y - 14, 36, 36);

        ctx.fillStyle = p.color;
        ctx.fillRect(p.x - 16, p.y - 16, 32, 32);

        ctx.strokeStyle = '#09090F';
        ctx.lineWidth = 4;
        ctx.strokeRect(p.x - 16, p.y - 16, 32, 32);

        ctx.font = '10px "Press Start 2P", monospace';
        ctx.fillStyle = '#F7F4E8';
        ctx.textAlign = 'center';
        ctx.fillText(p.nickname || `P${p.slotIndex + 1}`, p.x, p.y - 24);

        if (p.lastButtonMask > 0) {
          ctx.fillStyle = '#FF4268';
          ctx.fillRect(p.x - 20, p.y + 20, 40, 6);
        }
      });

      ctx.font = '12px "Press Start 2P", monospace';
      ctx.fillStyle = '#8B35FF';
      ctx.textAlign = 'left';
      ctx.fillText(`ARENA TICK: ${snap.tick}`, 20, 30);
      ctx.fillStyle = '#00E5FF';
      ctx.fillText(`ACTIVE PLAYERS: ${snap.entities?.length || 0}`, 20, 50);
    }

    // Dynamic Sound Effects Triggering System across All 3 Games
    const prev = prevSnapshotRef.current;
    if (prev && prev.gameId === gameSnapshot.gameId) {
      if (gameSnapshot.gameId === 'zombie-survival' && prev.gameId === 'zombie-survival') {
        const currZ = gameSnapshot as ZombieSurvivalSnapshot;
        const prevZ = prev as ZombieSurvivalSnapshot;

        // Gunshots (new bullets fired)
        if (currZ.bullets.length > prevZ.bullets.length) {
          assetManager.playSound('gunshot', 0.4);
        }
        // Drops collected
        if (currZ.drops.length < prevZ.drops.length) {
          assetManager.playSound('upgrade_pickup', 0.5);
        }
        // Wave progression
        if (currZ.wave > prevZ.wave) {
          assetManager.playSound('wave_start', 0.6);
        } else if (currZ.isWaveIntermission && !prevZ.isWaveIntermission) {
          assetManager.playSound('wave_clear', 0.6);
        }
        // Player damage taken
        const currHpSum = currZ.players.reduce((sum, p) => sum + p.hp, 0);
        const prevHpSum = prevZ.players.reduce((sum, p) => sum + p.hp, 0);
        if (currHpSum < prevHpSum) {
          assetManager.playSound('player_hurt', 0.5);
        }
        // Zombie groan / spawns
        if (currZ.zombies.length > prevZ.zombies.length && Math.random() < 0.4) {
          assetManager.playSound('zombie_groan', 0.35);
        }
        // Game Over / Victory
        if (currZ.isGameOver && !prevZ.isGameOver) {
          assetManager.playSound('game_over', 0.7);
        } else if (currZ.isVictory && !prevZ.isVictory) {
          assetManager.playSound('victory', 0.7);
        }
      } else if (gameSnapshot.gameId === 'platform-fighter' && prev.gameId === 'platform-fighter') {
        const currF = gameSnapshot as PlatformFighterSnapshot;
        const prevF = prev as PlatformFighterSnapshot;

        // Fighter attacks & hits
        currF.players.forEach((p, idx) => {
          const prevP = prevF.players[idx];
          if (!prevP) return;

          // Attack start
          if (p.isAttacking && !prevP.isAttacking) {
            if (p.attackType === 'heavy') {
              assetManager.playSound('impact_heavy', 0.5);
            } else {
              assetManager.playSound('slash_light', 0.4);
            }
          }
          // Jump take-off
          if (!p.isGrounded && prevP.isGrounded && p.vy < 0) {
            assetManager.playSound('jump', 0.35);
          }
          // KO / Stock lost
          if (p.stocks < prevP.stocks) {
            assetManager.playSound('ko_blast', 0.65);
            assetManager.playSound('announcer_ko', 0.8);
          }
          // Launch velocity
          if (Math.abs(p.vx) > 300 && Math.abs(prevP.vx) <= 300) {
            assetManager.playSound('whoosh_launch', 0.5);
          }
        });

        // Game Over announcer
        if (currF.isGameOver && !prevF.isGameOver) {
          assetManager.playSound('announcer_winner', 0.8);
          assetManager.playSound('victory', 0.6);
        }
      } else if (gameSnapshot.gameId === 'racing' && prev.gameId === 'racing') {
        const currR = gameSnapshot as RacingGameSnapshot;
        const prevR = prev as RacingGameSnapshot;

        currR.karts.forEach((k, idx) => {
          const prevK = prevR.karts[idx];
          if (!prevK) return;

          // Checkpoint / Lap completed
          if (k.currentLap > prevK.currentLap) {
            assetManager.playSound('lap_flag', 0.6);
          }
          // Speed acceleration & screech
          if (k.speed > 250 && Math.abs(k.angle - prevK.angle) > 0.08) {
            assetManager.playSound('tire_screech', 0.25);
          }
          // Finished race
          if (k.isFinished && !prevK.isFinished) {
            assetManager.playSound('finish_horn', 0.7);
            assetManager.playSound('finish_fanfare', 0.7);
          }
        });

        if (currR.isRaceOver && !prevR.isRaceOver) {
          assetManager.playSound('finish_fanfare', 0.8);
        }
      }
    }

    prevSnapshotRef.current = gameSnapshot;
  }, [gameSnapshot]);

  const handleCreateRoom = () => {
    if (!socket || !connected) return;
    socket.emit('room:create', (res: { ok: boolean; room: Room }) => {
      if (res.ok && res.room) {
        setRoom(res.room);
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

  // Feature block game items
  const partyGameFeatures: FeatureItem[] = [
    {
      icon: '🧟',
      title: 'Zombie Survival',
      description:
        'Wave-based twin-stick co-op shooter. 4 players barricade chokepoints, unlock weapons, and hold off escalating undead hordes.',
      badge: 'CO-OP 4P',
    },
    {
      icon: '⚔️',
      title: 'Platform Fighter',
      description:
        'Smash-style arena battle. Launch rivals off floating platforms, accumulate knockback percentages, and protect your 3 stocks.',
      badge: 'PVP ARENA',
    },
    {
      icon: '🏎️',
      title: 'Split-Screen Racing',
      description:
        'Arcade 2x2 split-screen racing. Drift corners, pickup boost items, dodge track hazards, and drift across the checkered flag.',
      badge: '2X2 SPLIT',
    },
  ];

  // Party members for GameTeam1 block
  const squadPartyMembers: PartyMember[] = [
    { name: 'PLAYER 1', initials: 'P1', level: 1, hp: 100, mana: 80, xp: 25 },
    { name: 'PLAYER 2', initials: 'P2', level: 1, hp: 100, mana: 70, xp: 20 },
    { name: 'PLAYER 3', initials: 'P3', level: 1, hp: 100, mana: 90, xp: 15 },
    { name: 'PLAYER 4', initials: 'P4', level: 1, hp: 100, mana: 60, xp: 30 },
  ];

  // Social stats for SocialProof1 block
  const partySocialStats: SocialStat[] = [
    { value: '30Hz', label: 'TICK RATE' },
    { value: '4P', label: 'LOCAL SQUAD' },
    { value: '<25ms', label: 'INPUT LAG' },
    { value: '0', label: 'DOWNLOADS' },
  ];

  // FAQ items for FAQ1 block
  const partyFaqItems: FAQItem[] = [
    {
      question: 'HOW DO PLAYERS JOIN THE GAME?',
      answer:
        'Simply display the QR code on your TV or monitor. Players scan it with their phone camera to instantly load the retro 8-bit gamepad with zero app installation required.',
    },
    {
      question: 'WHAT KIND OF PHONES ARE SUPPORTED?',
      answer:
        'Any modern smartphone running iOS (Safari) or Android (Chrome). MultiPal runs entirely in the browser using high-performance WebSockets.',
    },
    {
      question: 'CAN IT RUN ON RENDER OR SINGLE-PORT CLOUDS?',
      answer:
        'Yes! MultiPal is designed with a unified single-service Fastify architecture. The server serves both the host screen and mobile controller on the same port with zero CORS issues.',
    },
    {
      question: 'IS GAME SIMULATION CLIENT OR SERVER AUTHORITATIVE?',
      answer:
        'MultiPal is 100% server-authoritative. The server processes all movement, collisions, weapons, and stock eliminations at a fixed 30Hz simulation rate.',
    },
  ];

  const connectedPlayersCount = room
    ? Object.values(room.players).filter((p) => p.connected).length
    : 0;

  const allPlayersReady = room
    ? connectedPlayersCount > 0 &&
      Object.values(room.players)
        .filter((p) => p.connected)
        .every((p) => p.isReady)
    : false;

  // Render Landing Page if no active room is hosted
  if (!room) {
    return (
      <div className="min-h-screen w-full bg-[#09090F] text-[#F7F4E8] flex flex-col font-sans selection:bg-[#8B35FF] selection:text-white overflow-y-auto">
        {/* Top Dark Arcade Navigation Header */}
        <header className="sticky top-0 z-50 h-16 border-b-4 border-[#29293A] px-6 flex items-center justify-between bg-[#11111B]/95 backdrop-blur shadow-pixel">
          <div className="flex items-center space-x-3">
            <img
              src="/multipal_logo.png"
              alt="MultiPal Logo"
              className="w-10 h-10 object-contain pixelated border-2 border-[#39394F] bg-[#09090F] p-0.5 shadow-pixel-sm"
            />
            <div className="px-2 py-0.5 bg-[#8B35FF] text-[#F7F4E8] border border-[#29293A] font-retro text-[10px] tracking-wider hidden sm:block">
              8-BIT
            </div>
            <div>
              <h1 className="text-sm font-black text-[#F7F4E8] font-retro tracking-widest">
                MULTIP<span className="text-[#00E5FF]">AL</span>
              </h1>
            </div>
          </div>

          <nav className="hidden md:flex items-center space-x-6 text-xs font-semibold text-[#B7B6C9]">
            <a href="#games" className="hover:text-[#00E5FF] transition-colors">
              GAMES
            </a>
            <a href="#how-it-works" className="hover:text-[#00E5FF] transition-colors">
              HOW IT WORKS
            </a>
            <a href="#squad" className="hover:text-[#00E5FF] transition-colors">
              4P SQUAD
            </a>
            <a href="#faq" className="hover:text-[#00E5FF] transition-colors">
              FAQ
            </a>
          </nav>

          <div className="flex items-center space-x-3">
            <Badge
              variant={connected ? 'default' : 'destructive'}
              className={`text-[9px] font-retro ${connected ? 'bg-[#35E58A] text-[#09090F]' : 'bg-[#FF4268] text-white'}`}
            >
              {connected ? '● ONLINE' : '○ OFFLINE'}
            </Badge>

            <Button
              variant="default"
              size="sm"
              onClick={handleCreateRoom}
              disabled={!connected}
              className="bg-[#8B35FF] text-[#F7F4E8] hover:bg-[#7222E5] border-2 border-[#09090F] shadow-pixel-cyan font-retro text-[9px]"
            >
              ★ HOST NOW ★
            </Button>
          </div>
        </header>

        {/* Hero3 8-bit Block */}
        <Hero3
          title="MULTIPAl ARCADE"
          subtitle="YOUR TV IS THE CONSOLE. YOUR PHONE IS THE CONTROLLER."
          description="Host retro 8-bit party game battles on one shared display. Up to 4 players join instantly via QR code on their smartphone with zero app installs."
          actions={[
            {
              label: '★ INSERT COIN TO HOST ★',
              onClick: handleCreateRoom,
              variant: 'default',
            },
          ]}
          stats={[
            { label: 'PLAYERS', value: '1-4P' },
            { label: 'SIMULATION', value: '30Hz' },
            { label: 'DOWNLOADS', value: '0' },
          ]}
        />

        {/* How It Works 3-Step Banner */}
        <section id="how-it-works" className="border-y-4 border-[#29293A] bg-[#11111B] py-12 px-6">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-10">
              <span className="text-xs font-bold text-[#00E5FF] tracking-wider uppercase">
                THREE EASY STEPS
              </span>
              <h2 className="text-xl md:text-2xl font-black text-[#F7F4E8] font-retro mt-1">HOW IT WORKS</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="p-6 bg-[#1A1A28] border-2 border-[#29293A] shadow-pixel text-center space-y-3">
                <div className="w-12 h-12 bg-[#8B35FF] border-2 border-[#09090F] text-white mx-auto flex items-center justify-center">
                  <Tv className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-bold text-[#F7F4E8] font-retro">1. HOST ON SCREEN</h3>
                <p className="text-xs text-[#B7B6C9] leading-relaxed">
                  Open MultiPal on your PC, laptop, or smart TV to display the game room and QR code.
                </p>
              </Card>

              <Card className="p-6 bg-[#1A1A28] border-2 border-[#29293A] shadow-pixel text-center space-y-3">
                <div className="w-12 h-12 bg-[#00E5FF] border-2 border-[#09090F] text-[#09090F] mx-auto flex items-center justify-center">
                  <Smartphone className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-bold text-[#F7F4E8] font-retro">2. SCAN ON PHONE</h3>
                <p className="text-xs text-[#B7B6C9] leading-relaxed">
                  Up to 4 players scan the QR code. Their phones instantly turn into 8-bit touch controllers.
                </p>
              </Card>

              <Card className="p-6 bg-[#1A1A28] border-2 border-[#29293A] shadow-pixel text-center space-y-3">
                <div className="w-12 h-12 bg-[#FF2E88] border-2 border-[#09090F] text-white mx-auto flex items-center justify-center">
                  <Flame className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-bold text-[#F7F4E8] font-retro">3. PLAY TOGETHER</h3>
                <p className="text-xs text-[#B7B6C9] leading-relaxed">
                  Battle in Zombie Survival, Platform Fighter, or Split-Screen Racing at 30Hz server precision.
                </p>
              </Card>
            </div>
          </div>
        </section>

        {/* Feature1 8-bit Block: 3 Party Games */}
        <div id="games">
          <Feature1
            title="THREE RETRO PARTY GAMES"
            description="All built with authoritative server simulation and instant phone controls."
            items={partyGameFeatures}
          />
        </div>

        {/* GameTeam1 8-bit Block: 4-Player Squad */}
        <div id="squad">
          <GameTeam1
            title="FOUR-PLAYER SQUAD"
            description="Up to 4 friends join locally on their mobile devices. Automatic slot assignment with zero setup friction."
            members={squadPartyMembers}
          />
        </div>

        {/* SocialProof1 8-bit Block */}
        <SocialProof1
          title="ARCADE SPECIFICATIONS"
          subtitle="Engineered for instant responsiveness and zero-friction party gameplay"
          stats={partySocialStats}
        />

        {/* GameCTA1 8-bit Block */}
        <GameCTA1
          title="FACE THE MULTIPLAYER BOSS"
          description="Every gaming night faces the same friction. Here is your instant power-up."
          bossTitle="THE HARDWARE PROBLEM"
          bossDescription="Not enough controllers. Expensive game consoles. Giant downloads. Confusing setup. Wasted party time."
          powerUpTitle="MULTIPAl ARCADE"
          powerUpDescription="Zero downloads. Zero hardware purchases. Everyone already has a smartphone in their pocket."
          ctaLabel="★ INSERT COIN TO HOST ★"
          ctaHref="#"
        />

        {/* FAQ1 8-bit Block */}
        <div id="faq">
          <FAQ1
            title="FREQUENTLY ASKED QUESTIONS"
            description="Everything you need to know about setting up your multiplayer party."
            items={partyFaqItems}
          />
        </div>

        {/* Footer1 8-bit Block */}
        <Footer1
          title="MULTIPAl ARCADE"
          description="The browser-based multiplayer party gaming platform built with 8bitcn/ui."
          copyright="2026 MultiPal Arcade Platform. All rights reserved."
        />
      </div>
    );
  }

  // Active Room Screen: Full-screen Game Arena with Left Corner HUD Overlay & Bottom Marquee
  const connectedPlayers = room.slots
    .map((slot) => {
      const p = slot.playerId ? room.players[slot.playerId] : null;
      return { slot, player: p, isConnected: slot.occupied && !!p && p.connected };
    });

  return (
    <div className="flex flex-col h-screen w-screen bg-[#09090F] text-[#F7F4E8] overflow-hidden font-sans select-none relative">
      {/* Top Floating Mini-Nav */}
      <header className="absolute top-0 left-0 right-0 z-30 h-12 px-4 flex items-center justify-between bg-[#11111B]/80 backdrop-blur-sm border-b-2 border-[#29293A]">
        <div className="flex items-center space-x-2">
          <img
            src="/multipal_logo.png"
            alt="MultiPal Logo"
            className="w-7 h-7 object-contain pixelated border border-[#39394F] bg-[#09090F] p-0.5"
          />
          <span className="text-xs font-black text-[#F7F4E8] font-retro tracking-widest">
            MULTIP<span className="text-[#00E5FF]">AL</span>
          </span>
          <Badge
            variant={connected ? 'default' : 'destructive'}
            className={`text-[8px] font-retro ml-2 ${connected ? 'bg-[#35E58A] text-[#09090F]' : 'bg-[#FF4268] text-white'}`}
          >
            {connected ? '● LIVE' : '○ OFFLINE'}
          </Badge>
        </div>

        {/* Quick Game Switcher in Header */}
        <div className="flex items-center space-x-1.5">
          {[
            { id: 'zombie-survival' as GameId, label: 'ZOMBIE 4P' },
            { id: 'platform-fighter' as GameId, label: 'FIGHTER' },
            { id: 'racing' as GameId, label: 'RACER 2X2' },
            { id: 'test-arena' as GameId, label: 'ARENA' },
          ].map((g) => {
            const isSelected = room.selectedGameId === g.id;
            return (
              <Button
                key={g.id}
                variant={isSelected ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleGameSelect(g.id)}
                className={`text-[8px] h-7 px-2 font-retro transition-all ${
                  isSelected
                    ? 'bg-[#8B35FF] text-[#F7F4E8] border border-[#00E5FF] shadow-pixel-sm'
                    : 'bg-[#1A1A28]/80 text-[#B7B6C9] border-[#29293A] hover:bg-[#222235]'
                }`}
              >
                {g.label}
              </Button>
            );
          })}

          <Button
            variant="default"
            size="sm"
            onClick={handleStartGame}
            disabled={connectedPlayersCount === 0 || room.status === 'PLAYING'}
            className={`h-7 px-3 font-retro text-[8px] border shadow-pixel-sm ml-2 transition-all ${
              room.status === 'PLAYING'
                ? 'bg-[#1A1A28] text-[#77778D] border-[#29293A]'
                : countdown !== null
                ? 'bg-[#FFD400] text-[#09090F] border-[#FF6B00] animate-bounce'
                : allPlayersReady
                ? 'bg-[#35E58A] hover:bg-[#2bc473] text-[#09090F] border-[#09090F] animate-pulse shadow-[0_0_10px_#35E58A]'
                : 'bg-[#8B35FF] hover:bg-[#7222E5] text-[#F7F4E8] border-[#00E5FF]'
            }`}
          >
            {room.status === 'PLAYING' ? (
              'IN PLAY'
            ) : countdown !== null ? (
              `STARTING ${countdown}s`
            ) : allPlayersReady ? (
              <span className="flex items-center gap-1 font-black">
                <Play className="w-2.5 h-2.5" /> ALL READY! START
              </span>
            ) : (
              <span className="flex items-center gap-1">
                <Play className="w-2.5 h-2.5" /> START GAME
              </span>
            )}
          </Button>

          <Button
            variant="secondary"
            size="sm"
            onClick={toggleFullscreen}
            title="Toggle Fullscreen"
            className="h-7 w-7 p-0 bg-[#1A1A28] border border-[#29293A] text-[#F7F4E8] hover:bg-[#222235] ml-1"
          >
            {isFullscreen ? <Minimize2 className="w-3 h-3" /> : <Maximize2 className="w-3 h-3" />}
          </Button>
        </div>
      </header>

      {/* Main Full-Screen Game Arena */}
      <main className="flex-1 w-full h-full relative flex items-center justify-center bg-[#09090F] overflow-hidden pt-12 pb-14">
        {/* Fullscreen Responsive Canvas */}
        <canvas
          ref={canvasRef}
          width={800}
          height={600}
          className="w-full h-full object-contain pixelated"
          style={{ imageRendering: 'pixelated' }}
        />

        {/* Compact Floating HUD Overlay (Top-Left Corner) */}
        <div className="absolute top-16 left-4 z-20 flex flex-col space-y-2 pointer-events-auto">
          <Card className="p-2.5 bg-[#11111B]/90 backdrop-blur-md border-2 border-[#29293A] shadow-pixel w-44 space-y-2">
            {/* Header: Room Code + One-Click Copy */}
            <div className="flex items-center justify-between bg-[#1A1A28] border border-[#39394F] px-2 py-1.5">
              <div className="flex flex-col">
                <span className="text-[7px] text-[#77778D] font-retro leading-none">ROOM</span>
                <span className="text-base font-black tracking-widest text-[#00E5FF] font-retro">
                  {room.code}
                </span>
              </div>
              <Button
                variant="secondary"
                size="sm"
                onClick={handleCopyLink}
                title="Copy Controller Link"
                className="h-6 w-6 p-0 bg-[#222235] text-[#F7F4E8] border border-[#39394F] hover:bg-[#2e2e46]"
              >
                {copied ? <Check className="w-3 h-3 text-[#35E58A]" /> : <Copy className="w-3 h-3" />}
              </Button>
            </div>

            {/* Small QR Code */}
            <div className="flex flex-col items-center justify-center py-1 bg-[#1A1A28]/60 border border-[#29293A]">
              <div className="p-1.5 bg-white border-2 border-[#09090F] shadow-pixel-sm inline-block">
                <QRCodeSVG
                  value={controllerUrl}
                  size={84}
                  level="M"
                  includeMargin={false}
                />
              </div>
              <span className="text-[7px] text-[#00E5FF] font-retro mt-1.5 tracking-wider">
                SCAN TO JOIN
              </span>
            </div>
          </Card>
        </div>

        {/* Countdown Overlay */}
        {countdown !== null && (
          <div className="absolute inset-0 bg-[#09090F]/85 flex items-center justify-center z-40 backdrop-blur-sm">
            <div className="text-center space-y-3 animate-bounce">
              <p className="text-xl text-[#00E5FF] font-retro tracking-widest">GET READY!</p>
              <p className="text-8xl font-black text-[#FFD400] font-retro drop-shadow-[0_0_20px_#FFD400]">{countdown}</p>
            </div>
          </div>
        )}
      </main>

      {/* Full-Width (w-full) Bottom Bar with Retro Pixel Marquee Ticker */}
      <footer className="absolute bottom-0 left-0 right-0 z-30 h-14 bg-[#11111B] border-t-4 border-[#29293A] shadow-pixel flex items-center px-4 overflow-hidden">
        {/* Slot Badges Overview (P1 - P4) */}
        <div className="flex items-center space-x-2 shrink-0 border-r-2 border-[#29293A] pr-4 mr-4">
          {room.slots.map((slot) => {
            const player = slot.playerId ? room.players[slot.playerId] : null;
            const isOccupied = slot.occupied && !!player && player.connected;
            return (
              <div
                key={slot.slotIndex}
                className="flex items-center space-x-1 px-2 py-1 border-2 text-[9px] font-retro"
                style={{
                  borderColor: isOccupied ? slot.color.primary : '#29293A',
                  backgroundColor: isOccupied ? '#1A1A28' : '#09090F',
                  color: isOccupied ? slot.color.accent : '#77778D',
                }}
              >
                <span className="font-bold">P{slot.slotIndex + 1}</span>
                <span
                  className="w-1.5 h-1.5 rounded-none"
                  style={{ backgroundColor: isOccupied ? slot.color.primary : '#39394F' }}
                />
              </div>
            );
          })}
        </div>

        {/* Infinite Retro Pixel Marquee of Player Names & Status in Slot Colors */}
        <div className="flex-1 overflow-hidden relative h-full flex items-center">
          <div className="flex items-center space-x-8 whitespace-nowrap animate-marquee">
            {/* Repeated twice for seamless marquee loop */}
            {[0, 1].map((copyIndex) => (
              <div key={copyIndex} className="flex items-center space-x-8">
                {room.slots.map((slot) => {
                  const player = slot.playerId ? room.players[slot.playerId] : null;
                  const isOccupied = slot.occupied && !!player && player.connected;
                  return (
                    <div
                      key={`slot-${slot.slotIndex}-${copyIndex}`}
                      className="inline-flex items-center space-x-2 font-retro text-[10px]"
                    >
                      <span
                        className="px-1.5 py-0.5 border text-[9px] font-bold"
                        style={{
                          borderColor: slot.color.primary,
                          color: slot.color.accent,
                          backgroundColor: `${slot.color.primary}15`,
                        }}
                      >
                        P{slot.slotIndex + 1}
                      </span>
                      {isOccupied && player ? (
                        <span
                          className="font-black tracking-wide"
                          style={{ color: slot.color.primary }}
                        >
                          {player.nickname.toUpperCase()}{' '}
                          <span className="text-[8px] text-[#35E58A] ml-1">
                            [{player.isReady ? 'READY' : 'JOINED'}]
                          </span>
                        </span>
                      ) : (
                        <span className="text-[#77778D] tracking-wider text-[9px]">
                          EMPTY SLOT • SCAN TO JOIN
                        </span>
                      )}
                      <span className="text-[#39394F] font-mono">◆</span>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
