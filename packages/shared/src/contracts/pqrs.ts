import { z } from 'zod';
import { CategoriaPQRS, EstadoPQRS } from '../domain/enums.js';

export const CrearPqrsSchema = z.object({
  usuario_id: z.string().uuid().optional(),
  turno_id: z.string().uuid().optional(),
  tipo_incidencia: z.nativeEnum(CategoriaPQRS),
  descripcion: z.string().min(5).max(1000),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  foto_base64: z.string().optional(),
  foto_url: z.string().url().optional()
});

export type CrearPqrsDto = z.infer<typeof CrearPqrsSchema>;

export interface PqrsResponse {
  id: string;
  usuario_id?: string;
  turno_id?: string;
  tipo_incidencia: CategoriaPQRS;
  descripcion: string;
  foto_url?: string;
  lat: number;
  lng: number;
  estado: EstadoPQRS;
  creado_en: string;
}
