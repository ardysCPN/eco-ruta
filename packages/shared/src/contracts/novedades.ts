import { z } from 'zod';
import { TipoNovedadVia } from '../domain/enums.js';

export const CrearNovedadViaSchema = z.object({
  turno_id: z.string().uuid().optional(),
  vehiculo_id: z.string().uuid().optional(),
  tipo_novedad: z.nativeEnum(TipoNovedadVia),
  descripcion: z.string().max(300).optional(),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180)
});

export type CrearNovedadViaDto = z.infer<typeof CrearNovedadViaSchema>;

export interface NovedadViaResponse {
  id: string;
  turno_id?: string;
  vehiculo_id?: string;
  tipo_novedad: TipoNovedadVia;
  descripcion?: string;
  lat: number;
  lng: number;
  creado_en: string;
}
