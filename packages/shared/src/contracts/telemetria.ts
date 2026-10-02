import { z } from 'zod';

export const TelemetriaPosicionSchema = z.object({
  turno_id: z.string().uuid(),
  vehiculo_id: z.string().min(1),
  ruta_id: z.string().min(1),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  velocidad_kmh: z.number().nonnegative(),
  rumbo_grados: z.number().min(0).max(360),
  bateria_nivel: z.number().min(0).max(100).optional().default(100),
  timestamp: z.number().int().positive()
});

export type TelemetriaPosicionDto = z.infer<typeof TelemetriaPosicionSchema>;

export const TelemetriaBatchSchema = z.object({
  turno_id: z.string().uuid(),
  posiciones: z.array(TelemetriaPosicionSchema).min(1).max(200)
});

export type TelemetriaBatchDto = z.infer<typeof TelemetriaBatchSchema>;
