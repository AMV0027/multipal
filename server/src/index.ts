import Fastify from 'fastify';
import cors from '@fastify/cors';
import fastifyStatic from '@fastify/static';
import path from 'node:path';
import fs from 'node:fs';
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

  // Candidate paths whether run from repo root or server workspace directory
  const candidatePlatform = [
    path.resolve(process.cwd(), 'apps/platform-web/dist'),
    path.resolve(process.cwd(), '../apps/platform-web/dist'),
    path.resolve(__dirname, '../../apps/platform-web/dist'),
  ];
  const candidateController = [
    path.resolve(process.cwd(), 'apps/controller-web/dist'),
    path.resolve(process.cwd(), '../apps/controller-web/dist'),
    path.resolve(__dirname, '../../apps/controller-web/dist'),
  ];

  const platformDist = candidatePlatform.find((p) => fs.existsSync(p)) || candidatePlatform[0];
  const controllerDist = candidateController.find((p) => fs.existsSync(p)) || candidateController[0];

  console.log(`[MultiPal Server] Platform dist: ${platformDist} (exists: ${fs.existsSync(platformDist)})`);
  console.log(`[MultiPal Server] Controller dist: ${controllerDist} (exists: ${fs.existsSync(controllerDist)})`);

  // Register production frontend static bundles if present
  if (fs.existsSync(controllerDist)) {
    await fastify.register(fastifyStatic, {
      root: controllerDist,
      prefix: '/controller/',
      decorateReply: false,
    });

    fastify.get('/join', async (_req, reply) => {
      return reply.type('text/html').send(fs.readFileSync(path.join(controllerDist, 'index.html'), 'utf8'));
    });

    fastify.get('/join/*', async (_req, reply) => {
      return reply.type('text/html').send(fs.readFileSync(path.join(controllerDist, 'index.html'), 'utf8'));
    });
  }

  if (fs.existsSync(platformDist)) {
    await fastify.register(fastifyStatic, {
      root: platformDist,
      prefix: '/',
      decorateReply: true,
    });

    // SPA fallback
    fastify.setNotFoundHandler((req, reply) => {
      const url = req.raw.url || '';
      if (url.startsWith('/join') || url.startsWith('/controller')) {
        if (fs.existsSync(controllerDist)) {
          return reply.type('text/html').send(fs.readFileSync(path.join(controllerDist, 'index.html'), 'utf8'));
        }
      }
      return reply.type('text/html').send(fs.readFileSync(path.join(platformDist, 'index.html'), 'utf8'));
    });
  }

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
