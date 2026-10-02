import Fastify from 'fastify';
import cors from '@fastify/cors';
import dotenv from 'dotenv';
import { PostgisRepository } from './infrastructure/repositories/PostgisRepository.js';
import { SocketServer } from './infrastructure/websocket/SocketServer.js';
import { registerApiRoutes } from './presentation/routes/api.js';

dotenv.config();

const port = Number(process.env.PORT) || 3001;
const host = process.env.HOST || '0.0.0.0';

async function bootstrap() {
  const isDev = process.env.NODE_ENV !== 'production';
  const fastify = Fastify({
    logger: isDev ? {
      transport: {
        target: 'pino-pretty',
        options: {
          colorize: true
        }
      }
    } : true
  });

  // CORS
  await fastify.register(cors, {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS']
  });

  // Manejar cuerpos application/json vacíos o no enviados sin lanzar 400 Bad Request
  fastify.addContentTypeParser('application/json', { parseAs: 'string' }, (req, body, done) => {
    try {
      const json = (body && typeof body === 'string' && body.trim().length > 0) ? JSON.parse(body) : {};
      done(null, json);
    } catch (err: any) {
      err.statusCode = 400;
      done(err, undefined);
    }
  });

  // Repositorio e infraestructura
  const repository = new PostgisRepository();

  // Instanciar Socket.io sobre el servidor HTTP de Fastify
  const socketServer = new SocketServer(fastify.server, repository);

  // Registrar rutas de la API
  await fastify.register(registerApiRoutes, { 
    prefix: '/api',
    repository,
    socketServer
  });

  // Iniciar servidor
  try {
    await fastify.ready();
    console.log('📌 Rutas registradas:\n' + fastify.printRoutes());
    await fastify.listen({ port, host });
    console.log(`🚀 Servidor ECO-RUTA Backend escuchando en http://${host}:${port}`);
    console.log(`📡 WebSocket Gateway listo para telemetría continua.`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
}

bootstrap();
