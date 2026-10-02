import { z } from 'zod';
import { EstadoTurno, MotivoPausa } from '../domain/enums.js';

export const IniciarTurnoSchema = z.object({
  vehiculo_id: z.string().uuid(),
  ruta_id: z.string().uuid(),
  conductor_id: z.string().uuid().optional(),
  conductor_nombre: z.string().min(2).optional()
});

export type IniciarTurnoDto = z.infer<typeof IniciarTurnoSchema>;

export const PausarTurnoSchema = z.object({
  turno_id: z.string().uuid(),
  motivo: z.nativeEnum(MotivoPausa),
  descripcion: z.string().max(255).optional()
});

export type PausarTurnoDto = z.infer<typeof PausarTurnoSchema>;

export const ReanudarTurnoSchema = z.object({
  turno_id: z.string().uuid()
});

export type ReanudarTurnoDto = z.infer<typeof ReanudarTurnoSchema>;

export const FinalizarTurnoSchema = z.object({
  turno_id: z.string().uuid(),
  kilometraje_final: z.number().nonnegative().optional(),
  observaciones: z.string().max(500).optional()
});

export type FinalizarTurnoDto = z.infer<typeof FinalizarTurnoSchema>;

export interface TurnoActivoResponse {
  id: string;
  ruta_id: string;
  ruta_nombre: string;
  vehiculo_id: string;
  vehiculo_placa: string;
  conductor_nombre?: string;
  estado: EstadoTurno;
  hora_inicio: string;
  hora_fin?: string | null;
  ultima_posicion?: {
    lat: number;
    lng: number;
    velocidad_kmh: number;
    rumbo_grados: number;
    timestamp: number;
  } | null;
}
