import { z } from 'zod';

export const CrearInmuebleSchema = z.object({
  usuario_id: z.string().uuid().optional(),
  etiqueta: z.string().min(2).max(100),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  direccion: z.string().max(200).optional(),
  ruta_id: z.string().uuid().optional(),
  minutos_preaviso: z.number().int().min(5).max(30).default(10)
});

export type CrearInmuebleDto = z.infer<typeof CrearInmuebleSchema>;

export interface InmuebleResponse {
  id: string;
  usuario_id?: string;
  etiqueta: string;
  lat: number;
  lng: number;
  direccion?: string;
  ruta_id?: string;
  minutos_preaviso: number;
  silenciado_hasta?: string | null;
  creado_en: string;
}

export interface AlertaProximidadPayload {
  inmueble_id: string;
  inmueble_etiqueta: string;
  usuario_id?: string;
  turno_id: string;
  vehiculo_placa: string;
  distancia_metros: number;
  tiempo_estimado_minutos: number;
  mensaje: string;
  timestamp: number;
}
