import { Server as SocketIOServer, Socket } from 'socket.io';
import { RoomManager } from '../rooms/room-manager';
import { TestArenaEngine } from '../games/test-arena-engine';
import { ZombieSurvivalEngine } from '../games/zombie-survival-engine';
import { PlatformFighterEngine } from '../games/platform-fighter-engine';
import { SplitScreenRacingEngine } from '../games/racing-engine';
import { GameTicker, IGameServerEngine } from '@multipal/game-runtime';
import {
  ControllerInputPayload,
  GameId,
  JoinRoomPayload,
  Room,
} from '@multipal/shared-types';

interface ActiveRoomSession {
  room: Room;
  currentEngine: IGameServerEngine<ControllerInputPayload, any>;
  ticker: GameTicker;
}

export class SocketGateway {
  private activeSessions = new Map<string, ActiveRoomSession>();

  constructor(
    private io: SocketIOServer,
    private roomManager: RoomManager
  ) {
    this.setupSocketHandlers();
  }

  private createEngineForGame(
    gameId: GameId,
    room: Room
  ): IGameServerEngine<ControllerInputPayload, any> {
    const config = {
      roomId: room.id,
      onSnapshot: () => {},
      onEvent: () => {},
      onGameEnd: () => {},
    };

    switch (gameId) {
      case 'zombie-survival':
        return new ZombieSurvivalEngine(config);
      case 'platform-fighter':
        return new PlatformFighterEngine(config);
      case 'racing':
        return new SplitScreenRacingEngine(config);
      case 'test-arena':
      default:
        return new TestArenaEngine(config);
    }
  }

  private setupSocketHandlers(): void {
    this.io.on('connection', (socket: Socket) => {
      // 1. Host creates a room
      socket.on('room:create', (ack) => {
        try {
          const room = this.roomManager.createRoom(socket.id);
          const socketRoomName = `room:${room.id}`;
          socket.join(socketRoomName);

          const engine = this.createEngineForGame(room.selectedGameId, room);
          engine.init(Object.values(room.players));

          // Run tick loop at 30Hz
          const ticker = new GameTicker(30, (dt) => {
            const result = engine.tick(dt);
            this.io.to(socketRoomName).emit('game:state_snapshot', result.snapshot);
          });
          ticker.start();

          this.activeSessions.set(room.id, {
            room,
            currentEngine: engine,
            ticker,
          });

          if (typeof ack === 'function') {
            ack({ ok: true, room });
          }
        } catch (err: any) {
          if (typeof ack === 'function') {
            ack({ ok: false, error: err.message || 'Failed to create room' });
          }
        }
      });

      // 2. Player joins room from phone
      socket.on('room:join', (payload: JoinRoomPayload, ack) => {
        try {
          if (!payload?.code) {
            if (typeof ack === 'function') ack({ ok: false, error: 'Room code is required' });
            return;
          }

          const result = this.roomManager.joinRoom(
            payload.code,
            payload.nickname,
            socket.id,
            payload.avatarId,
            payload.sessionToken
          );

          if (!result.ok || !result.player || !result.room) {
            if (typeof ack === 'function') {
              ack({ ok: false, error: result.error || 'Failed to join room' });
            }
            return;
          }

          const { room, player } = result;
          const socketRoomName = `room:${room.id}`;
          socket.join(socketRoomName);

          // Add player to active game engine
          const session = this.activeSessions.get(room.id);
          if (session) {
            if ('addPlayer' in session.currentEngine) {
              (session.currentEngine as any).addPlayer(player);
            }
          }

          // Broadcast room update to everyone (host and players)
          this.io.to(socketRoomName).emit('room:updated', room);
          this.io.to(socketRoomName).emit('player:joined', player);

          if (typeof ack === 'function') {
            ack({
              ok: true,
              player,
              room,
            });
          }
        } catch (err: any) {
          if (typeof ack === 'function') {
            ack({ ok: false, error: err.message || 'Failed to join room' });
          }
        }
      });

      // 3. Player ready toggle
      socket.on('player:ready', (data: { ready: boolean }) => {
        const result = this.roomManager.setPlayerReady(socket.id, !!data?.ready);
        if (result) {
          const { room } = result;
          this.io.to(`room:${room.id}`).emit('room:updated', room);

          // Auto-start check: If all connected players are ready (and >= 1 connected player) and room is in LOBBY
          const connectedPlayers = Object.values(room.players).filter((p) => p.connected);
          const allReady = connectedPlayers.length > 0 && connectedPlayers.every((p) => p.isReady);

          if (allReady && room.status === 'LOBBY') {
            this.roomManager.setRoomStatus(room.id, 'STARTING');
            this.io.to(`room:${room.id}`).emit('room:updated', room);
            this.io.to(`room:${room.id}`).emit('game:starting', 3);

            setTimeout(() => {
              const currentRoom = this.roomManager.getRoomById(room.id);
              if (!currentRoom || currentRoom.status === 'CLOSED') return;

              this.roomManager.setRoomStatus(room.id, 'PLAYING');
              this.io.to(`room:${room.id}`).emit('room:updated', currentRoom);
              this.io.to(`room:${room.id}`).emit('game:started', currentRoom.selectedGameId);

              const session = this.activeSessions.get(room.id);
              if (session) {
                session.currentEngine.init(Object.values(currentRoom.players));
                session.currentEngine.start();
              }
            }, 3000);
          }
        }
      });

      // 4. Controller inputs streamed from mobile phone
      socket.on('player:input', (input: ControllerInputPayload) => {
        const data = this.roomManager.getPlayerBySocket(socket.id);
        if (!data || !input) return;

        const session = this.activeSessions.get(data.room.id);
        if (session) {
          session.currentEngine.processInput(data.player.id, input);
        }
      });

      // 5. Host selects game
      socket.on('game:select', (data: { gameId: GameId }) => {
        const room = this.roomManager.getRoomByHostSocket(socket.id);
        if (!room) return;

        this.roomManager.setSelectedGame(room.id, data.gameId);

        // Switch live engine in session if exists
        const session = this.activeSessions.get(room.id);
        if (session) {
          session.ticker.stop();
          session.currentEngine.destroy();

          const newEngine = this.createEngineForGame(data.gameId, room);
          newEngine.init(Object.values(room.players));
          session.currentEngine = newEngine;

          const socketRoomName = `room:${room.id}`;
          session.ticker = new GameTicker(30, (dt) => {
            const result = newEngine.tick(dt);
            this.io.to(socketRoomName).emit('game:state_snapshot', result.snapshot);
          });
          session.ticker.start();
        }

        this.io.to(`room:${room.id}`).emit('room:updated', room);
      });

      // 6. Host starts game
      socket.on('game:start', () => {
        const room = this.roomManager.getRoomByHostSocket(socket.id);
        if (!room) return;

        this.roomManager.setRoomStatus(room.id, 'STARTING');
        this.io.to(`room:${room.id}`).emit('room:updated', room);
        this.io.to(`room:${room.id}`).emit('game:starting', 3);

        setTimeout(() => {
          this.roomManager.setRoomStatus(room.id, 'PLAYING');
          this.io.to(`room:${room.id}`).emit('room:updated', room);
          this.io.to(`room:${room.id}`).emit('game:started', room.selectedGameId);

          const session = this.activeSessions.get(room.id);
          if (session) {
            session.currentEngine.init(Object.values(room.players));
            session.currentEngine.start();
          }
        }, 3000);
      });

      // 7. Ping / diagnostic latency check
      socket.on('ping:check', (clientTimestamp: number, ack) => {
        if (typeof ack === 'function') {
          ack(Date.now());
        }
      });

      // 8. Disconnection handling
      socket.on('disconnect', () => {
        // A. Is host disconnecting?
        const closedRoom = this.roomManager.removeHost(socket.id);
        if (closedRoom) {
          const session = this.activeSessions.get(closedRoom.id);
          if (session) {
            session.ticker.stop();
            session.currentEngine.destroy();
            this.activeSessions.delete(closedRoom.id);
          }
          this.io.to(`room:${closedRoom.id}`).emit('room:closed', 'Host has disconnected.');
          return;
        }

        // B. Is mobile player disconnecting?
        const playerResult = this.roomManager.handlePlayerDisconnect(socket.id);
        if (playerResult) {
          const { room, player } = playerResult;
          this.io.to(`room:${room.id}`).emit('player:disconnected', player.id);
          this.io.to(`room:${room.id}`).emit('room:updated', room);
        }
      });
    });
  }
}
