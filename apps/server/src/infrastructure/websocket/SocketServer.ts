import { Server as SocketIOServer, Socket } from 'socket.io';
import { Server as HttpServer } from 'http';
import { 
  SOCKET_CHANNELS, 
  TelemetriaPosicionSchema, 
  TelemetriaBatchSchema 
} from '@eco-ruta/shared';
import { PostgisRepository } from '../repositories/PostgisRepository.js';

export class SocketServer {
  private io: SocketIOServer;
  private repository: PostgisRepository;
  // Registro de hitos notificados por turno y predio para evitar spam repetitivo
  private hitosNotificados: Map<string, Set<string>> = new Map();

  constructor(httpServer: HttpServer, repository: PostgisRepository) {
    this.repository = repository;
    this.io = new SocketIOServer(httpServer, {
      cors: {
        origin: '*',
        methods: ['GET', 'POST']
      }
    });

    this.setupEvents();
  }

  private setupEvents() {
    this.io.on('connection', (socket: Socket) => {
      console.log(`🔌 Cliente conectado al socket: ${socket.id}`);

      // Suscripción a una ruta específica (Ciudadano o Conductor)
      socket.on(SOCKET_CHANNELS.UNIRSE_RUTA, (rutaId: string) => {
        socket.join(`ruta:${rutaId}`);
        console.log(`📡 Cliente ${socket.id} suscrito a ruta: ${rutaId}`);
      });

      // Salir de una ruta
      socket.on(SOCKET_CHANNELS.DEJAR_RUTA, (rutaId: string) => {
        socket.leave(`ruta:${rutaId}`);
        console.log(`🚪 Cliente ${socket.id} desuscrito de ruta: ${rutaId}`);
      });

      // Suscribirse al canal maestro de supervisión de flota (Aguas del Atrato / Alcaldía de Quibdó)
      socket.on('flota:suscribir', () => {
        socket.join('flota:global');
        console.log(`🏢 Cliente ${socket.id} suscrito a la torre de control de Quibdó.`);
      });

      // Recepción de telemetría continua del conductor (cada 5s)
      socket.on(SOCKET_CHANNELS.TELEMETRIA_ENVIAR, async (data: unknown) => {
        await this.handleTelemetria(data);
      });

      // Recepción de ráfaga offline sincronizada desde IndexedDB
      socket.on(SOCKET_CHANNELS.TELEMETRIA_BATCH, async (data: unknown) => {
        const parsed = TelemetriaBatchSchema.safeParse(data);
        if (!parsed.success) {
          console.warn('⚠️ Payload batch inválido recibido:', parsed.error.message);
          return;
        }

        console.log(`📦 Procesando ráfaga offline de ${parsed.data.posiciones.length} posiciones...`);
        for (const pos of parsed.data.posiciones) {
          await this.handleTelemetria(pos, true);
        }
      });

      socket.on('disconnect', () => {
        console.log(`❌ Cliente desconectado: ${socket.id}`);
      });
    });
  }

  public async handleTelemetria(raw: unknown, isBatch: boolean = false) {
    const parseResult = TelemetriaPosicionSchema.safeParse(raw);
    if (!parseResult.success) {
      console.warn('⚠️ Telemetría inválida descartada:', parseResult.error.message);
      return;
    }

    const pos = parseResult.data;

    try {
      // 1. Guardar en base de datos PostGIS
      const saved = await this.repository.registrarPosicion(pos);

      // 2. Calcular porcentaje de avance de ruta oficial si aplica
      let porcentajeAvance = 0;
      if (pos.ruta_id) {
        porcentajeAvance = await this.repository.calcularAvanceRuta(pos.ruta_id, pos.lat, pos.lng);
      }

      // 3. Verificar anti-desvío (>150m fuera de la línea de ruta)
      let desvioInfo = { distancia_metros: 0, esta_desviado: false };
      if (pos.ruta_id) {
        desvioInfo = await this.repository.verificarDesvioRuta(pos.ruta_id, pos.lat, pos.lng);
      }

      const broadcastPayload = {
        ...pos,
        id: saved.id,
        porcentaje_avance: Number(porcentajeAvance),
        distancia_desvio: desvioInfo.distancia_metros,
        esta_desviado: desvioInfo.esta_desviado,
        servidor_timestamp: Date.now()
      };

      // Si está desviado (>150m), disparar alarma
      if (desvioInfo.esta_desviado) {
        this.io.emit('conductor:alarma_desvio', {
          turno_id: pos.turno_id,
          vehiculo_id: pos.vehiculo_id,
          distancia: desvioInfo.distancia_metros,
          mensaje: `⚠️ ¡Alerta de desvío de ruta! Te has alejado ${desvioInfo.distancia_metros} metros del corredor oficial de Quibdó.`
        });
      }

      // 4. Emitir a los ciudadanos suscritos a la ruta (SOLO si NO está en retorno a patio)
      if (!(pos as any).is_retorno) {
        this.io.to(`ruta:${pos.ruta_id}`).emit(SOCKET_CHANNELS.TELEMETRIA_ACTUALIZACION, broadcastPayload);
      } else {
        // En retorno silencioso, emitir solo a la cabina del conductor
        this.io.emit('conductor:telemetria_retorno', broadcastPayload);
      }

      // 5. Emitir al canal de la torre de control de Aguas del Atrato / Alcaldía (Seguimiento Silencioso)
      this.io.to('flota:global').emit('flota:actualizada', {
        ...broadcastPayload,
        is_retorno: (pos as any).is_retorno || false,
        estado_operativo: (pos as any).is_retorno ? 'RETORNO A PATIO CABÍ' : 'EN RECOLECCIÓN'
      });

      // 6. Inteligencia Geoespacial: Consultar inmuebles cercanos (PostGIS ST_DWithin)
      // Se dispara ÚNICAMENTE en hitos clave y NUNCA durante el retorno a patio
      if (!isBatch && !(pos as any).is_retorno) {
        const cercanos = await this.repository.buscarInmueblesCercanos(pos.lat, pos.lng, 900);
        if (cercanos.length > 0) {
          for (const inm of cercanos) {
            const velKmh = pos.velocidad_kmh > 5 ? pos.velocidad_kmh : 15;
            const minutosEstimados = Math.max(1, Math.round((inm.distancia_metros / (velKmh * 1000 / 60))));

            // Clave única para deduplicación por ciclo de ruta
            const claveInmueble = `${pos.turno_id || pos.ruta_id}_${inm.inmueble_id}`;
            if (!this.hitosNotificados.has(claveInmueble)) {
              this.hitosNotificados.set(claveInmueble, new Set());
            }
            const hitosSet = this.hitosNotificados.get(claveInmueble)!;

            // Determinar si corresponde a uno de los 3 hitos oficiales:
            let hito: '10_MIN' | '5_MIN' | 'LLEGADA' | null = null;
            let mensajeHito = '';

            if (inm.distancia_metros <= 100) {
              hito = 'LLEGADA';
              mensajeHito = `🚛 ¡El compactador (${pos.vehiculo_id}) está pasando por tu calle ahora!`;
            } else if (minutosEstimados <= 5 || inm.distancia_metros <= 450) {
              hito = '5_MIN';
              mensajeHito = `⏳ ¡Faltan aprox. 5 minutos (${inm.distancia_metros}m)! Saca tus bolsas al punto de acopio.`;
            } else if (minutosEstimados <= 10 && inm.distancia_metros > 450) {
              hito = '10_MIN';
              mensajeHito = `🔔 El compactador se aproxima. Faltan aprox. 10 minutos (${inm.distancia_metros}m).`;
            }

            // Emitir SOLO si no se ha notificado este hito en este turno
            if (hito && !hitosSet.has(hito)) {
              hitosSet.add(hito);

              const alerta = {
                inmueble_id: inm.inmueble_id,
                usuario_id: inm.usuario_id,
                inmueble_etiqueta: inm.etiqueta,
                turno_id: pos.turno_id,
                vehiculo_placa: pos.vehiculo_id,
                distancia_metros: inm.distancia_metros,
                tiempo_estimado_minutos: minutosEstimados,
                hito: hito,
                mensaje: mensajeHito,
                timestamp: Date.now()
              };

              this.io.to(`ruta:${pos.ruta_id}`).emit(SOCKET_CHANNELS.ALERTA_PROXIMIDAD, alerta);
            }
          }
        }
      }
    } catch (err: any) {
      console.error('❌ Error al procesar telemetría:', err.message);
    }
  }

  public notificarCambioEstadoTurno(payload: any) {
    this.io.emit(SOCKET_CHANNELS.TURNO_CAMBIO_ESTADO, payload);
    this.io.to('flota:global').emit('flota:refrescar', {});
  }

  public getIO() {
    return this.io;
  }
}
