import { z } from 'zod';
import { QuebradaMonitoreada, NivelRiesgoCuenca, TipoMaterialReciclaje } from '../domain/enums.js';

export const CrearAlertaCuencaSchema = z.object({
  quebrada: z.nativeEnum(QuebradaMonitoreada),
  nivel_riesgo: z.nativeEnum(NivelRiesgoCuenca).default(NivelRiesgoCuenca.PRECAUCION),
  descripcion: z.string().min(5).max(400),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  foto_url: z.string().optional()
});

export type CrearAlertaCuencaDto = z.infer<typeof CrearAlertaCuencaSchema>;

export const CrearMaterialReciclajeSchema = z.object({
  usuario_id: z.string().uuid().optional(),
  tipo_material: z.nativeEnum(TipoMaterialReciclaje),
  cantidad_aprox: z.string().max(100),
  contacto: z.string().max(100),
  direccion: z.string().max(200),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180)
});

export type CrearMaterialReciclajeDto = z.infer<typeof CrearMaterialReciclajeSchema>;

export interface AlertaCuencaResponse {
  id: string;
  quebrada: QuebradaMonitoreada;
  nivel_riesgo: NivelRiesgoCuenca;
  descripcion: string;
  lat: number;
  lng: number;
  foto_url?: string;
  creado_en: string;
}

export interface MaterialReciclajeResponse {
  id: string;
  usuario_id?: string;
  tipo_material: TipoMaterialReciclaje;
  cantidad_aprox: string;
  contacto: string;
  direccion: string;
  lat: number;
  lng: number;
  estado: 'disponible' | 'recolectado';
  creado_en: string;
}
