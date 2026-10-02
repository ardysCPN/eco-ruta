import { z } from 'zod';
import { RolUsuario, CargoEmpleado } from '../domain/enums.js';

export const RegistroUsuarioSchema = z.object({
  numero_documento: z.string().min(5, 'El número de documento debe tener al menos 5 dígitos').max(30),
  nombre: z.string().min(2, 'El nombre debe tener al menos 2 caracteres').max(100),
  apellidos: z.string().min(2, 'Los apellidos deben tener al menos 2 caracteres').max(100),
  telefono: z.string().min(7, 'El número celular debe tener al menos 7 dígitos').max(20),
  email: z.string().email('Ingresa un correo electrónico válido'),
  password: z.string().min(4, 'La contraseña debe tener al menos 4 caracteres'),
  barrio: z.string().optional(),
  comuna: z.string().optional(),
  rol: z.nativeEnum(RolUsuario).default(RolUsuario.CIUDADANO)
});

export type RegistroUsuarioDto = z.infer<typeof RegistroUsuarioSchema>;

export const LoginUsuarioSchema = z.object({
  identificador: z.string().min(3, 'Ingresa tu número de documento, celular o correo'), // Documento, Celular o Email
  password: z.string().min(4, 'Ingresa tu contraseña')
});

export type LoginUsuarioDto = z.infer<typeof LoginUsuarioSchema>;

export const LoginConductorPinSchema = z.object({
  pin: z.string().length(4),
  vehiculo_id: z.string().uuid()
});

export type LoginConductorPinDto = z.infer<typeof LoginConductorPinSchema>;

// Contratos de Gestión de Personal / Empleados (EPQ)
export const CrearEmpleadoSchema = z.object({
  numero_documento: z.string().min(5).max(30),
  nombre: z.string().min(2).max(100),
  apellidos: z.string().min(2).max(100),
  telefono: z.string().min(7).max(20),
  email: z.string().email().optional().or(z.literal('')),
  cargo: z.enum(['conductor', 'ayudante', 'barrendero', 'supervisor']),
  licencia_conduccion: z.string().optional().or(z.literal('')),
  estado: z.enum(['activo', 'inactivo']).default('activo'),
  password: z.string().optional()
});

export type CrearEmpleadoDto = z.infer<typeof CrearEmpleadoSchema>;

export const ActualizarEmpleadoSchema = z.object({
  cargo: z.enum(['conductor', 'ayudante', 'barrendero', 'supervisor']).optional(),
  licencia_conduccion: z.string().optional(),
  estado: z.enum(['activo', 'inactivo']).optional(),
  telefono: z.string().optional(),
  email: z.string().optional(),
  password: z.string().optional()
});

export type ActualizarEmpleadoDto = z.infer<typeof ActualizarEmpleadoSchema>;

export interface UsuarioResponse {
  id: string;
  numero_documento?: string | null;
  nombre: string;
  apellidos: string;
  telefono: string;
  email?: string | null;
  rol: RolUsuario;
  cargo?: string | null;
  licencia_conduccion?: string | null;
  estado?: string | null;
  barrio?: string | null;
  comuna?: string | null;
  creado_en: string;
}
