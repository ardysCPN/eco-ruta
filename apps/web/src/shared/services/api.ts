const API_BASE = '/api';

export async function fetchJson<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const token = localStorage.getItem('eco_token');
  const headers: Record<string, string> = {
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...(options?.headers as Record<string, string> || {})
  };

  if (options?.body) {
    if (!headers['Content-Type']) {
      headers['Content-Type'] = 'application/json';
    }
  }

  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers
  });

  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}));
    throw new Error(errorBody.error || errorBody.message || `Error ${res.status}: ${res.statusText}`);
  }

  return res.json();
}

export const api = {
  // Auth
  registro: (data: any) =>
    fetchJson<{ data: any; token: string }>('/auth/register', { method: 'POST', body: JSON.stringify(data) }),
  login: (data: { identificador: string; password: string }) =>
    fetchJson<{ data: any; token: string }>('/auth/login', { method: 'POST', body: JSON.stringify(data) }),
  loginConductorPin: (data: { pin: string; vehiculo_id: string }) =>
    fetchJson<{ data: any; token: string }>('/auth/conductor-pin', { method: 'POST', body: JSON.stringify(data) }),

  // Rutas & Puntos de Acopio
  getRutas: () => fetchJson<{ data: any[] }>('/rutas'),
  getRutaById: (id: string) => fetchJson<{ data: any }>(`/rutas/${id}`),
  getPuntosAcopio: (rutaId?: string) => 
    fetchJson<{ data: any[] }>(`/puntos-acopio${rutaId ? `?ruta_id=${rutaId}` : ''}`),

  // Vehículos
  getVehiculos: () => fetchJson<{ data: any[] }>('/vehiculos'),

  // Turnos
  getTurnosActivos: () => fetchJson<{ data: any[] }>('/turnos/activos'),
  getTurnosConductor: (conductorId: string) => fetchJson<{ data: any[] }>(`/turnos/conductor/${conductorId}`),
  getTurnosPlanificados: (fecha?: string) => 
    fetchJson<{ data: any[] }>(`/turnos/planificados${fecha ? `?fecha=${fecha}` : ''}`),
  planificarTurno: (data: {
    ruta_id: string;
    vehiculo_id: string;
    conductor_nombre: string;
    conductor_id?: string;
    ayudante_1?: string;
    ayudante_2?: string;
    barrendero?: string;
    fecha_programada: string;
    observaciones?: string;
  }) => fetchJson<{ data: any }>('/turnos/planificar', { method: 'POST', body: JSON.stringify(data) }),
  getFlotaDetallada: () => fetchJson<{ data: any[] }>('/flota/detallada'),
  calcularTrazadoRuta: (waypoints: Array<[number, number]>) =>
    fetchJson<{ data: { trazado_geojson: any; distancia_km: number; duracion_min: number } }>('/rutas/calcular-trazado', { method: 'POST', body: JSON.stringify({ waypoints }) }),
  crearRuta: (data: {
    nombre: string;
    comuna: string;
    horario_estimado?: string;
    dias_servicio?: string;
    trazado_geojson: any;
    puntos_acopio?: any[];
  }) => fetchJson<{ data: any }>('/rutas', { method: 'POST', body: JSON.stringify(data) }),
  iniciarTurno: (data: { vehiculo_id: string; ruta_id: string; conductor_nombre?: string; conductor_id?: string }) =>
    fetchJson<{ data: any }>('/turnos/iniciar', { method: 'POST', body: JSON.stringify(data) }),
  pausarTurno: (data: { turno_id: string; motivo: string; descripcion?: string }) =>
    fetchJson<{ data: any }>('/turnos/pausar', { method: 'POST', body: JSON.stringify(data) }),
  reanudarTurno: (data: { turno_id: string }) =>
    fetchJson<{ data: any }>('/turnos/reanudar', { method: 'POST', body: JSON.stringify(data) }),
  finalizarTurno: (data: { turno_id: string; observaciones?: string }) =>
    fetchJson<{ data: any }>('/turnos/finalizar', { method: 'POST', body: JSON.stringify(data) }),
  iniciarRetorno: (turnoId: string) =>
    fetchJson<{ status: string; mensaje: string; data: any }>('/turnos/iniciar-retorno', { method: 'POST', body: JSON.stringify({ turno_id: turnoId }) }),
  getHistorialTurno: (turnoId: string) => fetchJson<{ data: any[] }>(`/turnos/${turnoId}/historial`),

  // Inmuebles Privados
  getInmuebles: (usuarioId?: string) => 
    fetchJson<{ data: any[] }>(`/inmuebles${usuarioId ? `?usuario_id=${usuarioId}` : ''}`),
  crearInmueble: (data: { etiqueta: string; lat: number; lng: number; direccion?: string; ruta_id?: string; minutos_preaviso?: number; usuario_id?: string }) =>
    fetchJson<{ data: any }>('/inmuebles', { method: 'POST', body: JSON.stringify(data) }),
  silenciarInmueble: (id: string, horas: number = 12) =>
    fetchJson<{ data: any; mensaje: string }>(`/inmuebles/${id}/silenciar`, { method: 'POST', body: JSON.stringify({ horas }) }),

  // PQRS
  getPqrs: (usuarioId?: string) => 
    fetchJson<{ data: any[] }>(`/pqrs${usuarioId ? `?usuario_id=${usuarioId}` : ''}`),
  crearPqrs: (data: { tipo_incidencia: string; descripcion: string; lat: number; lng: number; foto_base64?: string; usuario_id?: string }) =>
    fetchJson<{ data: any }>('/pqrs', { method: 'POST', body: JSON.stringify(data) }),
  actualizarEstadoPqrs: (id: string, estado: string, cuadrilla?: string, respuesta?: string) =>
    fetchJson<{ data: any }>(`/pqrs/${id}/estado`, { method: 'PATCH', body: JSON.stringify({ estado, cuadrilla, respuesta }) }),

  // Novedades de Vía
  getNovedades: () => fetchJson<{ data: any[] }>('/novedades'),
  crearNovedad: (data: { tipo_novedad: string; descripcion?: string; lat: number; lng: number; vehiculo_id?: string; turno_id?: string }) =>
    fetchJson<{ data: any }>('/novedades', { method: 'POST', body: JSON.stringify(data) }),

  // Ambiental & Cuencas
  getAlertasCuencas: () => fetchJson<{ data: any[] }>('/ambiental/cuencas'),
  crearAlertaCuenca: (data: { quebrada: string; nivel_riesgo: string; descripcion: string; lat: number; lng: number; foto_url?: string }) =>
    fetchJson<{ data: any }>('/ambiental/cuencas', { method: 'POST', body: JSON.stringify(data) }),
  getMaterialReciclaje: () => fetchJson<{ data: any[] }>('/ambiental/reciclaje'),
  crearMaterialReciclaje: (data: { tipo_material: string; cantidad_aprox: string; contacto: string; direccion: string; lat: number; lng: number; usuario_id?: string }) =>
    fetchJson<{ data: any }>('/ambiental/reciclaje', { method: 'POST', body: JSON.stringify(data) }),

  // Alcaldía
  getAlcaldiaCobertura: () => fetchJson<{ data: any[] }>('/alcaldia/cobertura'),
  getAlcaldiaHeatmap: () => fetchJson<{ data: any[] }>('/alcaldia/heatmap'),
  exportarPgirs: () => fetchJson<any>('/alcaldia/export-pgirs'),

  // Simulador Quibdó
  iniciarSimulador: (data?: { turno_id?: string; ruta_id?: string }) =>
    fetchJson<{ status: string; mensaje: string; turno_id: string }>('/simulador/iniciar', { method: 'POST', body: JSON.stringify(data || {}) }),
  detenerSimulador: () =>
    fetchJson<{ status: string }>('/simulador/detener', { method: 'POST', body: JSON.stringify({}) }),

  // Comunas Oficiales Quibdó
  getComunas: () => fetchJson<{ data: any[] }>('/comunas'),

  // Empleados y Cuadrillas EPQ
  getEmpleados: (filtros?: { cargo?: string; estado?: string; busqueda?: string }) => {
    const params = new URLSearchParams();
    if (filtros?.cargo) params.append('cargo', filtros.cargo);
    if (filtros?.estado) params.append('estado', filtros.estado);
    if (filtros?.busqueda) params.append('busqueda', filtros.busqueda);
    const qs = params.toString();
    return fetchJson<{ data: any[] }>(`/empleados${qs ? `?${qs}` : ''}`);
  },
  crearEmpleado: (data: {
    nombre: string;
    apellidos: string;
    numero_documento: string;
    cargo: string;
    telefono?: string;
    email?: string;
    licencia_conduccion?: string;
    password?: string;
  }) => fetchJson<{ data: any }>('/empleados', { method: 'POST', body: JSON.stringify(data) }),
  actualizarEmpleado: (id: string, data: {
    nombre?: string;
    apellidos?: string;
    cargo?: string;
    telefono?: string;
    email?: string;
    licencia_conduccion?: string;
    estado?: string;
    password?: string;
  }) => fetchJson<{ data: any }>(`/empleados/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  cargaMasivaEmpleados: (empleados: Array<{
    nombre: string;
    apellidos: string;
    numero_documento: string;
    cargo: string;
    telefono?: string;
    email?: string;
    licencia_conduccion?: string;
    password?: string;
  }>) => fetchJson<{ insertados: number; data: any[] }>('/empleados/carga-masiva', { method: 'POST', body: JSON.stringify({ empleados }) })
};
