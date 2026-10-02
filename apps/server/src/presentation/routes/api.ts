import { FastifyInstance } from 'fastify';
import { 
  IniciarTurnoSchema, 
  PausarTurnoSchema, 
  ReanudarTurnoSchema, 
  FinalizarTurnoSchema, 
  CrearInmuebleSchema, 
  CrearPqrsSchema,
  RegistroUsuarioSchema,
  LoginUsuarioSchema,
  LoginConductorPinSchema,
  CrearNovedadViaSchema,
  CrearAlertaCuencaSchema,
  CrearMaterialReciclajeSchema,
  CrearEmpleadoSchema,
  ActualizarEmpleadoSchema,
  COMUNAS_QUIBDO,
  EstadoPQRS,
  SOCKET_CHANNELS
} from '@eco-ruta/shared';
import { PostgisRepository } from '../../infrastructure/repositories/PostgisRepository.js';
import { SocketServer } from '../../infrastructure/websocket/SocketServer.js';

interface ApiRoutesOptions {
  repository: PostgisRepository;
  socketServer: SocketServer;
}

export const registerApiRoutes = async (fastify: FastifyInstance, opts: ApiRoutesOptions) => {
  const { repository, socketServer } = opts;

  // Healthcheck
  fastify.get('/health', async () => {
    return { 
      status: 'ok', 
      servicio: 'ECO-RUTA Quibdó Telemetry Backend', 
      municipio: 'Quibdó, Chocó',
      timestamp: new Date().toISOString() 
    };
  });

  // ==================== AUTH & USUARIOS ====================
  fastify.get('/comunas', async () => {
    return { data: COMUNAS_QUIBDO };
  });

  fastify.get<{ Querystring: { comuna?: string } }>('/territorio', async (req) => {
    const data = await repository.listarTerritorio(req.query.comuna);
    return { data };
  });

  fastify.post('/auth/register', async (req, reply) => {
    const parsed = RegistroUsuarioSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: parsed.error.format() });
    }
    try {
      const user = await repository.registrarUsuario(parsed.data);
      return { data: user, token: 'mock-token-' + user.id };
    } catch (err: any) {
      return reply.status(400).send({ error: err.message || 'Error al registrar usuario' });
    }
  });

  fastify.post('/auth/login', async (req, reply) => {
    const parsed = LoginUsuarioSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: parsed.error.format() });
    }
    const user = await repository.buscarUsuarioPorIdentificador(parsed.data.identificador);
    if (!user) {
      return reply.status(401).send({ error: 'Número de documento, celular o correo no registrado en Quibdó.' });
    }
    if (user.password_hash !== parsed.data.password) {
      return reply.status(401).send({ error: 'Contraseña incorrecta.' });
    }
    if (user.estado === 'inactivo') {
      return reply.status(403).send({ error: 'Esta cuenta se encuentra inactiva. Comunícate con el administrador de EPQ.' });
    }
    return {
      data: {
        id: user.id,
        numero_documento: user.numero_documento,
        nombre: user.nombre,
        apellidos: user.apellidos,
        telefono: user.telefono,
        email: user.email,
        rol: user.rol,
        cargo: user.cargo,
        licencia_conduccion: user.licencia_conduccion,
        estado: user.estado,
        barrio: user.barrio,
        comuna: user.comuna
      },
      token: 'mock-token-' + user.id
    };
  });

  fastify.post('/auth/conductor-pin', async (req, reply) => {
    const parsed = LoginConductorPinSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: parsed.error.format() });
    }
    const auth = await repository.validarConductorPin(parsed.data.pin, parsed.data.vehiculo_id);
    if (!auth || !auth.conductor) {
      return reply.status(401).send({ error: 'PIN de 4 dígitos inválido o no autorizado para el camión seleccionado.' });
    }
    return {
      data: {
        conductor: auth.conductor,
        vehiculo: auth.vehiculo
      },
      token: 'mock-conductor-token-' + auth.conductor.id
    };
  });

  // ==================== GESTIÓN DE EMPLEADOS & CUADRILLAS EPQ ====================
  fastify.get<{ Querystring: { cargo?: string; estado?: string; search?: string } }>('/empleados', async (req) => {
    const empleados = await repository.listarEmpleados(req.query);
    return { data: empleados };
  });

  fastify.post('/empleados', async (req, reply) => {
    const parsed = CrearEmpleadoSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: parsed.error.format() });
    }
    try {
      const nuevo = await repository.crearEmpleado(parsed.data as any);
      return { data: nuevo };
    } catch (err: any) {
      return reply.status(400).send({ error: err.message });
    }
  });

  fastify.patch<{ Params: { id: string } }>('/empleados/:id', async (req, reply) => {
    const parsed = ActualizarEmpleadoSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: parsed.error.format() });
    }
    try {
      const actualizado = await repository.actualizarEmpleado(req.params.id, parsed.data as any);
      return { data: actualizado };
    } catch (err: any) {
      return reply.status(400).send({ error: err.message });
    }
  });

  fastify.post<{ Body: { empleados: any[] } }>('/empleados/carga-masiva', async (req, reply) => {
    if (!req.body?.empleados || !Array.isArray(req.body.empleados)) {
      return reply.status(400).send({ error: 'Se requiere un arreglo de empleados para la carga masiva.' });
    }
    try {
      const resultado = await repository.cargaMasivaEmpleados(req.body.empleados);
      return { data: resultado };
    } catch (err: any) {
      return reply.status(400).send({ error: err.message });
    }
  });

  // ==================== RUTAS & PUNTOS DE ACOPIO ====================
  fastify.get('/rutas', async () => {
    const rutas = await repository.listarRutas();
    return { data: rutas };
  });

  fastify.get<{ Params: { id: string } }>('/rutas/:id', async (req) => {
    const ruta = await repository.obtenerRutaPorId(req.params.id);
    if (!ruta) return { error: 'Ruta no encontrada' };
    return { data: ruta };
  });

  fastify.get<{ Querystring: { ruta_id?: string } }>('/puntos-acopio', async (req) => {
    const puntos = await repository.listarPuntosAcopio(req.query.ruta_id);
    return { data: puntos };
  });

  // ==================== VEHÍCULOS ====================
  fastify.get('/vehiculos', async () => {
    const vehiculos = await repository.listarVehiculos();
    return { data: vehiculos };
  });

  // ==================== TURNOS ====================
  // ==================== RUNNER DE TELEMETRÍA EN VIVO POR TURNO ====================
  interface ActiveTurnoRunner {
    turnoId: string;
    rutaId: string;
    vehiculoCodigo: string;
    puntos: Array<{ lat: number; lng: number; rumbo: number; vel: number }>;
    indice: number;
    interval: NodeJS.Timeout | null;
    pausado: boolean;
    enRetorno: boolean;
  }

  const activeTurnoRunners = new Map<string, ActiveTurnoRunner>();

  // Trazado base en Quibdó por si la ruta no tiene trazado GeoJSON
  const puntosRutaQuibdoFallback = [
    { lat: 5.689711, lng: -76.660473, rumbo: 284, vel: 18 },
    { lat: 5.689804, lng: -76.660857, rumbo: 280, vel: 18 },
    { lat: 5.688559, lng: -76.661941, rumbo: 301, vel: 16 },
    { lat: 5.688735, lng: -76.662230, rumbo: 19, vel: 16 },
    { lat: 5.688975, lng: -76.662147, rumbo: 15, vel: 16 },
    { lat: 5.690028, lng: -76.661803, rumbo: 10, vel: 20 },
    { lat: 5.690379, lng: -76.661744, rumbo: 9, vel: 22 },
    { lat: 5.690808, lng: -76.661673, rumbo: 9, vel: 20 },
    { lat: 5.691442, lng: -76.661567, rumbo: 12, vel: 20 },
    { lat: 5.692216, lng: -76.661400, rumbo: 10, vel: 18 },
    { lat: 5.692709, lng: -76.661312, rumbo: 85, vel: 14 },
    { lat: 5.693472, lng: -76.661158, rumbo: 95, vel: 14 },
    { lat: 5.693295, lng: -76.660302, rumbo: 95, vel: 12 },
    { lat: 5.692962, lng: -76.660357, rumbo: 95, vel: 12 },
    { lat: 5.692887, lng: -76.659990, rumbo: 90, vel: 15 },
    { lat: 5.693184, lng: -76.659770, rumbo: 90, vel: 16 },
    { lat: 5.693098, lng: -76.659356, rumbo: 85, vel: 16 },
    { lat: 5.693852, lng: -76.658509, rumbo: 85, vel: 16 },
    { lat: 5.693702, lng: -76.657770, rumbo: 15, vel: 14 },
    { lat: 5.694544, lng: -76.657596, rumbo: 12, vel: 18 },
    { lat: 5.695631, lng: -76.657346, rumbo: 12, vel: 20 },
    { lat: 5.696389, lng: -76.657189, rumbo: 12, vel: 18 },
    { lat: 5.696620, lng: -76.657140, rumbo: 96, vel: 16 },
    { lat: 5.696547, lng: -76.656495, rumbo: 90, vel: 16 }
  ];

  // Corredor de Retorno hacia el Relleno Sanitario y Patio Operativo en Cabí
  const puntosRetornoCabi = [
    { lat: 5.696547, lng: -76.656495, rumbo: 180, vel: 25 },
    { lat: 5.694544, lng: -76.657596, rumbo: 180, vel: 28 },
    { lat: 5.692216, lng: -76.661400, rumbo: 195, vel: 30 },
    { lat: 5.688735, lng: -76.662230, rumbo: 190, vel: 26 },
    { lat: 5.684120, lng: -76.663140, rumbo: 185, vel: 32 },
    { lat: 5.679500, lng: -76.661500, rumbo: 175, vel: 35 },
    { lat: 5.674200, lng: -76.658200, rumbo: 165, vel: 30 },
    { lat: 5.670800, lng: -76.654100, rumbo: 155, vel: 24 }, // Entrada Patio Operativo Cabí
    { lat: 5.669500, lng: -76.652800, rumbo: 150, vel: 12 }  // Báscula y Relleno Cabí
  ];

  async function startTurnoTelemetry(turno: any) {
    stopTurnoTelemetry(turno.id);

    try {
      const ruta = await repository.obtenerRutaPorId(turno.ruta_id);
      const vehiculos = await repository.listarVehiculos();
      const vehiculo = vehiculos.find((v: any) => v.id === turno.vehiculo_id);
      const vehiculoCodigo = vehiculo ? `${vehiculo.codigo} (${vehiculo.placa})` : 'COMP-01 (CHO-101)';

      let puntos: Array<{ lat: number; lng: number; rumbo: number; vel: number }> = [];

      if (ruta && ruta.trazado_geojson && Array.isArray(ruta.trazado_geojson.coordinates) && ruta.trazado_geojson.coordinates.length > 1) {
        const coords = ruta.trazado_geojson.coordinates;
        puntos = coords.map((c: [number, number], i: number) => {
          const next = coords[(i + 1) % coords.length];
          const dLng = next[0] - c[0];
          const dLat = next[1] - c[1];
          let rumbo = Math.round((Math.atan2(dLng, dLat) * 180) / Math.PI);
          if (rumbo < 0) rumbo += 360;
          return {
            lat: c[1],
            lng: c[0],
            rumbo: rumbo || 45,
            vel: 16 + Math.floor(Math.random() * 4)
          };
        });
      }

      if (puntos.length === 0) {
        puntos = puntosRutaQuibdoFallback;
      }

      const runner: ActiveTurnoRunner = {
        turnoId: turno.id,
        rutaId: turno.ruta_id,
        vehiculoCodigo,
        puntos,
        indice: 0,
        interval: null,
        pausado: false,
        enRetorno: false
      };

      // Emitir posición inicial
      const primerPunto = runner.puntos[0];
      const primerPayload = {
        turno_id: runner.turnoId,
        vehiculo_id: runner.vehiculoCodigo,
        ruta_id: runner.rutaId,
        lat: primerPunto.lat,
        lng: primerPunto.lng,
        velocidad_kmh: primerPunto.vel,
        rumbo_grados: primerPunto.rumbo,
        bateria_nivel: 92,
        is_retorno: false,
        timestamp: Date.now()
      };
      socketServer.getIO().emit('simulador:tick', primerPayload);
      await (socketServer as any).handleTelemetria(primerPayload);

      runner.indice = 1;
      runner.interval = setInterval(async () => {
        if (runner.pausado) return;
        const punto = runner.puntos[runner.indice];
        const payload = {
          turno_id: runner.turnoId,
          vehiculo_id: runner.vehiculoCodigo,
          ruta_id: runner.rutaId,
          lat: punto.lat,
          lng: punto.lng,
          velocidad_kmh: punto.vel,
          rumbo_grados: punto.rumbo,
          bateria_nivel: 92,
          is_retorno: runner.enRetorno,
          timestamp: Date.now()
        };

        socketServer.getIO().emit('simulador:tick', payload);
        await (socketServer as any).handleTelemetria(payload);

        runner.indice = (runner.indice + 1) % runner.puntos.length;
      }, 3500);

      activeTurnoRunners.set(turno.id, runner);
      console.log(`🚛 Telemetría en vivo iniciada para Turno ${turno.id} en Ruta ${turno.ruta_id}`);
    } catch (err: any) {
      console.error('Error al iniciar telemetría de turno:', err.message);
    }
  }

  function setTurnoReturnMode(turnoId: string) {
    const runner = activeTurnoRunners.get(turnoId);
    if (runner) {
      runner.enRetorno = true;
      runner.puntos = puntosRetornoCabi;
      runner.indice = 0;
      runner.pausado = false;
      console.log(`🚛 Turno ${turnoId} entró en Modo Retorno Silencioso a Patio Cabí.`);
    }
  }

  function pauseTurnoTelemetry(turnoId: string) {
    const runner = activeTurnoRunners.get(turnoId);
    if (runner) {
      runner.pausado = true;
      console.log(`⏸️ Telemetría pausada para Turno ${turnoId}`);
    }
  }

  function resumeTurnoTelemetry(turnoId: string) {
    const runner = activeTurnoRunners.get(turnoId);
    if (runner) {
      runner.pausado = false;
      console.log(`▶️ Telemetría reanudada para Turno ${turnoId}`);
    }
  }

  function stopTurnoTelemetry(turnoId: string) {
    const runner = activeTurnoRunners.get(turnoId);
    if (runner) {
      if (runner.interval) clearInterval(runner.interval);
      activeTurnoRunners.delete(turnoId);
      socketServer.getIO().emit('simulador:detenido', { turno_id: turnoId, ruta_id: runner.rutaId });
      console.log(`⏹️ Telemetría finalizada para Turno ${turnoId}`);
    }
  }

  fastify.get('/turnos/activos', async () => {
    const turnos = await repository.listarTurnosActivos();
    return { data: turnos };
  });

  // Retorno a Patio Central / Cabí (Seguimiento Silencioso)
  fastify.post<{ Body: { turno_id: string } }>('/turnos/iniciar-retorno', async (req, reply) => {
    const { turno_id } = req.body || {};
    if (!turno_id) {
      return reply.status(400).send({ error: 'turno_id es requerido' });
    }

    try {
      const turno = await repository.pausarTurno(turno_id, 'mantenimiento' as any, 'Retorno silencioso a Patio / Cabí');
      socketServer.notificarCambioEstadoTurno({ tipo: 'finalizacion_ciudadano', turno });
      setTurnoReturnMode(turno_id);
      return { 
        status: 'en_retorno', 
        mensaje: 'Modo Retorno a Patio Cabí activado. Notificaciones a ciudadanos finalizadas. Seguimiento silencioso activo para Torre de Control EPQ.',
        data: turno 
      };
    } catch (err: any) {
      return reply.status(500).send({ error: err.message });
    }
  });

  fastify.post('/turnos/iniciar', async (req, reply) => {
    const parsed = IniciarTurnoSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: parsed.error.format() });
    }

    try {
      const turno = await repository.iniciarTurno(
        parsed.data.vehiculo_id,
        parsed.data.ruta_id,
        parsed.data.conductor_nombre
      );
      // Iniciar automáticamente la transmisión de telemetría de la ruta asignada
      await startTurnoTelemetry(turno);
      socketServer.notificarCambioEstadoTurno({ tipo: 'inicio', turno });
      return { data: turno };
    } catch (err: any) {
      return reply.status(500).send({ error: err.message });
    }
  });

  fastify.post('/turnos/pausar', async (req, reply) => {
    const parsed = PausarTurnoSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: parsed.error.format() });
    }

    try {
      const turno = await repository.pausarTurno(
        parsed.data.turno_id,
        parsed.data.motivo,
        parsed.data.descripcion
      );
      pauseTurnoTelemetry(parsed.data.turno_id);
      socketServer.notificarCambioEstadoTurno({ tipo: 'pausa', turno });
      return { data: turno };
    } catch (err: any) {
      return reply.status(500).send({ error: err.message });
    }
  });

  fastify.post('/turnos/reanudar', async (req, reply) => {
    const parsed = ReanudarTurnoSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: parsed.error.format() });
    }

    try {
      const turno = await repository.reanudarTurno(parsed.data.turno_id);
      resumeTurnoTelemetry(parsed.data.turno_id);
      socketServer.notificarCambioEstadoTurno({ tipo: 'reanudacion', turno });
      return { data: turno };
    } catch (err: any) {
      return reply.status(500).send({ error: err.message });
    }
  });

  fastify.post('/turnos/finalizar', async (req, reply) => {
    const parsed = FinalizarTurnoSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: parsed.error.format() });
    }

    try {
      const turno = await repository.finalizarTurno(parsed.data.turno_id, parsed.data.observaciones);
      stopTurnoTelemetry(parsed.data.turno_id);
      socketServer.notificarCambioEstadoTurno({ tipo: 'finalizacion', turno });
      return { data: turno };
    } catch (err: any) {
      return reply.status(500).send({ error: err.message });
    }
  });

  fastify.get<{ Params: { id: string } }>('/turnos/:id/historial', async (req) => {
    const historial = await repository.obtenerHistorialTurno(req.params.id);
    return { data: historial };
  });

  // Turnos asignados a un conductor específico
  fastify.get<{ Params: { conductorId: string } }>('/turnos/conductor/:conductorId', async (req) => {
    const turnos = await repository.listarTurnosConductor(req.params.conductorId);
    return { data: turnos };
  });

  // Planificador de turnos y cuadrillas (hasta 30 días)
  fastify.get<{ Querystring: { fecha?: string } }>('/turnos/planificados', async (req) => {
    const turnos = await repository.listarTurnosPlanificados(req.query.fecha);
    return { data: turnos };
  });

  fastify.post<{ Body: any }>('/turnos/planificar', async (req, reply) => {
    try {
      const turno = await repository.planificarTurno(req.body as any);
      socketServer.notificarCambioEstadoTurno({ tipo: 'planificado', turno });
      return { data: turno };
    } catch (err: any) {
      return reply.status(400).send({ error: err.message });
    }
  });

  // Flota detallada completa para Mapa Maestro de EPQ
  fastify.get('/flota/detallada', async () => {
    const flota = await repository.listarFlotaDetallada();
    return { data: flota };
  });

  // Generador/Calculador de trazado vial sugerido por calles de Quibdó (Snapping OSRM)
  fastify.post<{ Body: { waypoints?: Array<[number, number]>; puntos?: Array<[number, number]> } }>('/rutas/calcular-trazado', async (req, reply) => {
    const waypoints = req.body?.waypoints || req.body?.puntos;
    if (!waypoints || waypoints.length < 2) {
      return reply.status(400).send({ error: 'Se requieren al menos 2 puntos (origen y destino)' });
    }

    try {
      // OSRM espera {lng},{lat}; si vienen como [lat, lng] (lat > 0 en Quibdó ~ 5.69, lng < 0 ~ -76.66)
      const coordString = waypoints.map((p) => {
        const lat = p[0] > 0 ? p[0] : p[1];
        const lng = p[0] > 0 ? p[1] : p[0];
        return `${lng},${lat}`;
      }).join(';');

      const url = `http://router.project-osrm.org/route/v1/driving/${coordString}?overview=full&geometries=geojson`;
      
      const response = await fetch(url, { signal: AbortSignal.timeout(5000) });
      if (response.ok) {
        const json: any = await response.json();
        if (json.routes && json.routes.length > 0) {
          const route = json.routes[0];
          return {
            data: {
              trazado_geojson: route.geometry,
              distancia_km: Number((route.distance / 1000).toFixed(2)),
              duracion_min: Math.round(route.duration / 60)
            }
          };
        }
      }
    } catch (e: any) {
      console.warn('⚠️ OSRM fallback a interpolación directa en Quibdó:', e.message);
    }

    const geojsonCoords = waypoints.map((p) => {
      const lat = p[0] > 0 ? p[0] : p[1];
      const lng = p[0] > 0 ? p[1] : p[0];
      return [lng, lat];
    });

    return {
      data: {
        trazado_geojson: {
          type: 'LineString',
          coordinates: geojsonCoords
        },
        distancia_km: 2.4,
        duracion_min: 14
      }
    };
  });

  // Guardar nueva micro-ruta diseñada
  fastify.post<{ Body: any }>('/rutas', async (req, reply) => {
    try {
      const ruta = await repository.crearRuta(req.body as any);
      return { data: ruta };
    } catch (err: any) {
      return reply.status(400).send({ error: err.message });
    }
  });

  // ==================== INMUEBLES PRIVADOS CIUDADANOS ====================
  fastify.get<{ Querystring: { usuario_id?: string } }>('/inmuebles', async (req) => {
    const usuarioId = req.query.usuario_id || 'd1000000-0000-0000-0000-000000000001';
    const inmuebles = await repository.listarInmueblesPorUsuario(usuarioId);
    return { data: inmuebles };
  });

  fastify.post('/inmuebles', async (req, reply) => {
    const parsed = CrearInmuebleSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: parsed.error.format() });
    }

    try {
      const usuarioId = parsed.data.usuario_id || 'd1000000-0000-0000-0000-000000000001';
      const inmueble = await repository.registrarInmueble(
        usuarioId,
        parsed.data.etiqueta,
        parsed.data.lat,
        parsed.data.lng,
        parsed.data.direccion,
        parsed.data.ruta_id,
        parsed.data.minutos_preaviso || 10
      );
      return { data: inmueble };
    } catch (err: any) {
      return reply.status(400).send({ error: err.message });
    }
  });

  fastify.post<{ Params: { id: string }; Body: { horas?: number } }>('/inmuebles/:id/silenciar', async (req) => {
    const horas = req.body?.horas || 12;
    const res = await repository.silenciarInmueble(req.params.id, horas);
    return { data: res, mensaje: `Alertas silenciadas por ${horas} horas.` };
  });

  // ==================== PQRS CÍVICO ====================
  fastify.get<{ Querystring: { usuario_id?: string } }>('/pqrs', async (req) => {
    const pqrs = await repository.listarPqrs(req.query.usuario_id);
    return { data: pqrs };
  });

  fastify.post('/pqrs', async (req, reply) => {
    const parsed = CrearPqrsSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: parsed.error.format() });
    }

    try {
      const nuevo = await repository.registrarPqrs(
        parsed.data.tipo_incidencia,
        parsed.data.descripcion,
        parsed.data.lat,
        parsed.data.lng,
        parsed.data.foto_base64
      );

      socketServer.getIO().to('flota:global').emit('pqrs:nuevo', nuevo);
      return { data: nuevo };
    } catch (err: any) {
      return reply.status(500).send({ error: err.message });
    }
  });

  fastify.patch<{ Params: { id: string }; Body: { estado: EstadoPQRS; cuadrilla?: string; respuesta?: string } }>('/pqrs/:id/estado', async (req) => {
    const actualizado = await repository.actualizarEstadoPqrs(
      req.params.id,
      req.body.estado,
      req.body.cuadrilla,
      req.body.respuesta
    );
    socketServer.getIO().to('flota:global').emit('pqrs:actualizado', actualizado);
    return { data: actualizado };
  });

  // ==================== NOVEDADES DE VÍA ====================
  fastify.get('/novedades', async () => {
    const novedades = await repository.listarNovedadesVia();
    return { data: novedades };
  });

  fastify.post('/novedades', async (req, reply) => {
    const parsed = CrearNovedadViaSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: parsed.error.format() });
    }
    const novedad = await repository.registrarNovedadVia(
      parsed.data.tipo_novedad,
      parsed.data.descripcion || '',
      parsed.data.lat,
      parsed.data.lng,
      parsed.data.vehiculo_id,
      parsed.data.turno_id
    );

    socketServer.getIO().emit('novedad:nueva', novedad);
    return { data: novedad };
  });

  // ==================== AMBIENTAL & CUENCAS ====================
  fastify.get('/ambiental/cuencas', async () => {
    const alertas = await repository.listarAlertasCuencas();
    return { data: alertas };
  });

  fastify.post('/ambiental/cuencas', async (req, reply) => {
    const parsed = CrearAlertaCuencaSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: parsed.error.format() });
    }
    const alerta = await repository.registrarAlertaCuenca(
      parsed.data.quebrada,
      parsed.data.nivel_riesgo,
      parsed.data.descripcion,
      parsed.data.lat,
      parsed.data.lng,
      parsed.data.foto_url
    );
    socketServer.getIO().emit('cuenca:alerta', alerta);
    return { data: alerta };
  });

  fastify.get('/ambiental/reciclaje', async () => {
    const items = await repository.listarMaterialReciclaje();
    return { data: items };
  });

  fastify.post('/ambiental/reciclaje', async (req, reply) => {
    const parsed = CrearMaterialReciclajeSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: parsed.error.format() });
    }
    const item = await repository.registrarMaterialReciclaje(
      parsed.data.tipo_material,
      parsed.data.cantidad_aprox,
      parsed.data.contacto,
      parsed.data.direccion,
      parsed.data.lat,
      parsed.data.lng,
      parsed.data.usuario_id
    );
    socketServer.getIO().emit('reciclaje:nuevo', item);
    return { data: item };
  });

  // ==================== ALCALDÍA & SUPERVISIÓN ====================
  fastify.get('/alcaldia/cobertura', async () => {
    const metricas = await repository.obtenerMetricasCoberturaComunas();
    return { data: metricas };
  });

  fastify.get('/alcaldia/heatmap', async () => {
    const puntos = await repository.obtenerPuntosCalorIncidencias();
    return { data: puntos };
  });

  fastify.get('/alcaldia/export-pgirs', async () => {
    return {
      municipio: 'Quibdó, Chocó',
      operador: 'Aguas del Atrato E.S.P.',
      fecha_reporte: new Date().toISOString(),
      indicadores: {
        cobertura_urbana_pct: 94.8,
        adherencia_rutas_pct: 91.2,
        tiempo_respuesta_pqrs_horas: 3.4,
        residuos_compactados_ton: 48.6,
        toneladas_reciclaje_aprovechado: 6.2,
        alertas_cuencas_atendidas: 2
      },
      comunas: [
        { comuna: 'Comuna 1 Centro', cumplimiento: '98%', estado: 'Optimo' },
        { comuna: 'Comuna 2 Huapango', cumplimiento: '92%', estado: 'Normal' },
        { comuna: 'Comuna 3 Medrano', cumplimiento: '89%', estado: 'Precaución' },
        { comuna: 'Comuna 4 Kennedy', cumplimiento: '91%', estado: 'Normal' },
        { comuna: 'Comuna 5 Jardín', cumplimiento: '87%', estado: 'Supervisión' }
      ]
    };
  });

  // ==================== SIMULADOR GPS EN VIVO QUIBDÓ (API COMPATIBILIDAD) ====================
  fastify.post<{ Body: { turno_id?: string; ruta_id?: string } }>('/simulador/iniciar', async (req) => {
    let turnoId = req.body?.turno_id;
    let rutaId = req.body?.ruta_id;

    let targetTurno: any = null;

    if (turnoId) {
      const activos = await repository.listarTurnosActivos();
      targetTurno = activos.find((t: any) => t.id === turnoId);
    }

    if (!targetTurno) {
      const activos = await repository.listarTurnosActivos();
      if (activos.length > 0) {
        targetTurno = activos[0];
      } else {
        const rutas = await repository.listarRutas();
        const vehiculos = await repository.listarVehiculos();
        if (rutas.length > 0 && vehiculos.length > 0) {
          targetTurno = await repository.iniciarTurno(vehiculos[0].id, rutaId || rutas[0].id, 'Conductor Aguas del Atrato');
        }
      }
    }

    if (!targetTurno) {
      return { error: 'No se pudo inicializar el turno. Por favor ejecuta el seed primero.' };
    }

    await startTurnoTelemetry(targetTurno);

    return { 
      status: 'simulador_iniciado', 
      mensaje: 'Telemetría GPS en vivo transmitiendo por la ruta asignada en Quibdó.',
      turno_id: targetTurno.id,
      ruta_id: targetTurno.ruta_id
    };
  });

  fastify.post('/simulador/detener', async () => {
    for (const [id] of activeTurnoRunners.entries()) {
      stopTurnoTelemetry(id);
    }
    return { status: 'simulador_detenido' };
  });
};
