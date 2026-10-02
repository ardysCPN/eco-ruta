export enum EstadoVehiculo {
  DISPONIBLE = 'disponible',
  EN_RUTA = 'en_ruta',
  MANTENIMIENTO = 'mantenimiento',
  FUERA_SERVICIO = 'fuera_servicio'
}

export enum EstadoTurno {
  ACTIVO = 'activo',
  PAUSADO = 'pausado',
  FINALIZADO = 'finalizado'
}

export enum MotivoPausa {
  TRAFICO = 'trafico',
  FALLA_MECANICA = 'falla_mecanica',
  DESCARGA_RELLENO = 'descarga_relleno',
  ALMUERZO = 'almuerzo',
  OTRO = 'otro'
}

export enum CategoriaPQRS {
  CAMION_NO_PASO = 'camion_no_paso',
  BASURA_DISPERSA = 'basura_dispersa',
  ESCOMBROS_CLANDESTINOS = 'escombros_clandestinos',
  PUNTO_CRITICO = 'punto_critico',
  OTRO = 'otro'
}

export enum EstadoPQRS {
  RECIBIDA = 'recibida',
  EN_VERIFICACION = 'en_verificacion',
  CUADRILLA_ASIGNADA = 'cuadrilla_asignada',
  RESUELTA = 'resuelta',
  RECHAZADA = 'rechazada'
}

export enum RolUsuario {
  CIUDADANO = 'ciudadano',
  CONDUCTOR = 'conductor',
  OPERACIONES = 'operaciones',
  ALCALDIA = 'alcaldia',
  EMPLEADO = 'empleado'
}

export enum CargoEmpleado {
  CONDUCTOR = 'conductor',
  AYUDANTE_RECOLECCION = 'ayudante',
  BARRENDERO = 'barrendero',
  SUPERVISOR = 'supervisor'
}

export enum TipoNovedadVia {
  CALLE_INUNDADA = 'calle_inundada',
  VIA_BLOQUEADA = 'via_bloqueada',
  FALLA_MECANICA = 'falla_mecanica',
  TRASLADO_BOTADERO = 'traslado_botadero',
  OBRA_CIVIL = 'obra_civil'
}

export enum QuebradaMonitoreada {
  LA_YESCA = 'la_yesca',
  CARANO = 'carano',
  AURORA = 'aurora'
}

export enum NivelRiesgoCuenca {
  NORMAL = 'normal',
  PRECAUCION = 'precaucion',
  ALERTA_CRITICA = 'alerta_critica'
}

export enum TipoMaterialReciclaje {
  CARTON_PAPEL = 'carton_papel',
  PLASTICO = 'plastico',
  METALES_CHATARRA = 'metales_chatarra',
  VIDRIO = 'vidrio'
}
