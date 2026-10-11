import Fastify from 'fastify';
import cors from '@fastify/cors';
import { Server as SocketIOServer } from 'socket.io';
import { RoomManager } from './rooms/room-manager';
import { SocketGateway } from './realtime/socket-gateway';

async function bootstrap() {
  const fastify = Fastify({ logger: true });

  await fastify.register(cors, {
    origin: '*',
    methods: ['GET', 'POST'],
  });

  fastify.get('/health', async () => {
    return { status: 'ok', timestamp: Date.now() };
  });

  const PORT = Number(process.env.PORT) || 3001;
  const HOST = process.env.HOST || '0.0.0.0';

  await fastify.ready();

  const io = new SocketIOServer(fastify.server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
    transports: ['websocket', 'polling'],
  });

  const roomManager = new RoomManager();
  new SocketGateway(io, roomManager);

  await fastify.listen({ port: PORT, host: HOST });
  console.log(`[MultiPal Server] Listening on http://${HOST}:${PORT}`);
}

bootstrap().catch((err) => {
  console.error('[MultiPal Server] Startup failure:', err);
  process.exit(1);
});
