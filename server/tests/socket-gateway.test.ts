import { describe, expect, it } from 'vitest';
import { SocketGateway } from '../src/realtime/socket-gateway';
import { RoomManager } from '../src/rooms/room-manager';

class FakeSocket {
  public handlers = new Map<string, (...args: any[]) => void>();
  public joinedRooms: string[] = [];

  constructor(public id: string) {}

  on(event: string, handler: (...args: any[]) => void): void {
    this.handlers.set(event, handler);
  }

  join(roomName: string): void {
    this.joinedRooms.push(roomName);
  }

  emitToHandler(event: string, ...args: any[]): void {
    const handler = this.handlers.get(event);
    if (!handler) throw new Error(`Missing socket handler for ${event}`);
    handler(...args);
  }
}

class FakeIo {
  public connectionHandler: ((socket: FakeSocket) => void) | null = null;
  public emitted: Array<{ roomName: string; event: string; payload: any }> = [];

  on(event: string, handler: (socket: FakeSocket) => void): void {
    if (event === 'connection') this.connectionHandler = handler;
  }

  to(roomName: string): { emit: (event: string, payload: any) => void } {
    return {
      emit: (event: string, payload: any) => {
        this.emitted.push({ roomName, event, payload });
      },
    };
  }

  connect(socket: FakeSocket): void {
    if (!this.connectionHandler) throw new Error('SocketGateway did not register connection handler');
    this.connectionHandler(socket);
  }
}

describe('SocketGateway room join wiring', () => {
  it('maps joined controllers to their actual socket id and preserves nickname/session token', () => {
    const io = new FakeIo();
    const roomManager = new RoomManager();
    new SocketGateway(io as any, roomManager);

    const host = new FakeSocket('host-socket');
    io.connect(host);

    let createdRoom: any;
    host.emitToHandler('room:create', (res: any) => {
      createdRoom = res.room;
    });

    const controller = new FakeSocket('controller-socket');
    io.connect(controller);

    let joinResponse: any;
    controller.emitToHandler(
      'room:join',
      {
        code: createdRoom.code,
        nickname: 'RETRO_BOY',
        avatarId: 'avatar-1',
        sessionToken: 'token-1',
      },
      (res: any) => {
        joinResponse = res;
      }
    );

    expect(joinResponse.ok).toBe(true);
    expect(joinResponse.player.nickname).toBe('RETRO_BOY');
    expect(joinResponse.player.avatarId).toBe('avatar-1');
    expect(joinResponse.player.sessionToken).toBe('token-1');

    controller.emitToHandler('player:ready', { ready: true });

    const room = roomManager.getRoomByCode(createdRoom.code);
    const player = room?.players[joinResponse.player.id];
    expect(player?.isReady).toBe(true);
  });
});
