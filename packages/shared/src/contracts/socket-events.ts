import { TelemetriaPosicionDto, TelemetriaBatchDto } from './telemetria.js';
import { AlertaProximidadPayload } from './inmuebles.js';
import { EstadoTurno } from '../domain/enums.js';

export const SOCKET_CHANNELS = {
  // Client to Server
  TELEMETRIA_ENVIAR: 'telemetria:posicion',
  TELEMETRIA_BATCH: 'telemetria:batch',
  UNIRSE_RUTA: 'ruta:suscribir',
  DEJAR_RUTA: 'ruta:desuscribir',
  
  // Server to Client
  TELEMETRIA_ACTUALIZACION: 'telemetria:actualizada',
  TURNO_CAMBIO_ESTADO: 'turno:estado_cambiado',
  ALERTA_PROXIMIDAD: 'alerta:proximidad',
  FLOTA_ACTUALIZADA: 'flota:actualizada'
} as const;

export interface TurnoEstadoCambiadoPayload {
  turno_id: string;
  vehiculo_id: string;
  estado: EstadoTurno;
  motivo_pausa?: string;
  timestamp: number;
}
