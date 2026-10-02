-- Extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- Tabla de Usuarios y Empleados (Ciudadanos, Conductores, Cuadrillas EPQ, Despacho y Alcaldía)
CREATE TABLE IF NOT EXISTS usuarios (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    numero_documento VARCHAR(30) UNIQUE,
    nombre VARCHAR(100) NOT NULL,
    apellidos VARCHAR(100) NOT NULL,
    telefono VARCHAR(30) UNIQUE NOT NULL,
    email VARCHAR(120) UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    rol VARCHAR(20) DEFAULT 'ciudadano',
    cargo VARCHAR(50),
    licencia_conduccion VARCHAR(30),
    estado VARCHAR(20) DEFAULT 'activo',
    pin_conductor VARCHAR(10),
    barrio VARCHAR(100),
    comuna VARCHAR(50),
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_usuarios_documento ON usuarios(numero_documento);
CREATE INDEX IF NOT EXISTS idx_usuarios_telefono ON usuarios(telefono);
CREATE INDEX IF NOT EXISTS idx_usuarios_email ON usuarios(email);
CREATE INDEX IF NOT EXISTS idx_usuarios_rol ON usuarios(rol);
CREATE INDEX IF NOT EXISTS idx_usuarios_cargo ON usuarios(cargo);

-- Tabla de Rutas Oficiales (Micro-rutas de Quibdó)
CREATE TABLE IF NOT EXISTS rutas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre VARCHAR(100) NOT NULL,
    municipio VARCHAR(50) NOT NULL DEFAULT 'Quibdó',
    comuna VARCHAR(50) NOT NULL DEFAULT 'Comuna 1',
    dias_operacion VARCHAR(100) DEFAULT 'Lunes, Miércoles, Viernes',
    horario_estimado VARCHAR(100) DEFAULT '19:00 - 22:30',
    trazado_oficial GEOMETRY(LineString, 4326) NOT NULL,
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_rutas_trazado ON rutas USING GIST (trazado_oficial);

-- Tabla de Puntos de Acopio Obligatorios (Paradas de 2 a 5 minutos)
CREATE TABLE IF NOT EXISTS puntos_acopio (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ruta_id UUID REFERENCES rutas(id) ON DELETE CASCADE,
    nombre VARCHAR(100) NOT NULL,
    direccion VARCHAR(150),
    punto GEOMETRY(Point, 4326) NOT NULL,
    tiempo_parada_min INT DEFAULT 3,
    orden INT DEFAULT 1,
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_puntos_acopio_punto ON puntos_acopio USING GIST (punto);

-- Tabla de Vehículos / Compactadores (Aguas del Atrato - Quibdó)
CREATE TABLE IF NOT EXISTS vehiculos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    codigo VARCHAR(30) UNIQUE NOT NULL,
    placa VARCHAR(10) NOT NULL,
    capacidad_ton NUMERIC(4,2) DEFAULT 12.50,
    estado VARCHAR(20) DEFAULT 'disponible',
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de Turnos de Recolección Operativa
CREATE TABLE IF NOT EXISTS turnos_recoleccion (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ruta_id UUID REFERENCES rutas(id) ON DELETE CASCADE,
    vehiculo_id UUID REFERENCES vehiculos(id) ON DELETE CASCADE,
    conductor_nombre VARCHAR(100) DEFAULT 'Operador Principal',
    conductor_id UUID REFERENCES usuarios(id) ON DELETE SET NULL,
    ayudante_1 VARCHAR(100) DEFAULT 'Carlos Perea (Recolector)',
    ayudante_2 VARCHAR(100) DEFAULT 'Marlon Córdoba (Recolector)',
    barrendero VARCHAR(100) DEFAULT 'Leider Mena (Barrido)',
    fecha_programada DATE DEFAULT CURRENT_DATE,
    hora_inicio TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    hora_fin TIMESTAMP WITH TIME ZONE,
    estado VARCHAR(20) DEFAULT 'activo',
    motivo_pausa VARCHAR(50),
    observaciones TEXT
);
CREATE INDEX IF NOT EXISTS idx_turnos_estado ON turnos_recoleccion(estado);
CREATE INDEX IF NOT EXISTS idx_turnos_conductor ON turnos_recoleccion(conductor_id, fecha_programada);

-- Tabla de Telemetría de Posiciones GPS (Alta Frecuencia)
CREATE TABLE IF NOT EXISTS telemetria_posiciones (
    id BIGSERIAL PRIMARY KEY,
    turno_id UUID REFERENCES turnos_recoleccion(id) ON DELETE CASCADE,
    punto GEOMETRY(Point, 4326) NOT NULL,
    velocidad NUMERIC(5,2) DEFAULT 0,
    rumbo NUMERIC(5,2) DEFAULT 0,
    bateria_nivel NUMERIC(3,0) DEFAULT 100,
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_telemetria_punto ON telemetria_posiciones USING GIST (punto);
CREATE INDEX IF NOT EXISTS idx_telemetria_turno_creado ON telemetria_posiciones(turno_id, creado_en DESC);

-- Tabla de Inmuebles Ciudadanos (Casas / Negocios registrados 100% privados por usuario)
CREATE TABLE IF NOT EXISTS inmuebles_ciudadanos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    usuario_id UUID REFERENCES usuarios(id) ON DELETE CASCADE,
    etiqueta VARCHAR(100) NOT NULL,
    direccion VARCHAR(200),
    ubicacion GEOMETRY(Point, 4326) NOT NULL,
    ruta_id UUID REFERENCES rutas(id) ON DELETE SET NULL,
    minutos_preaviso INT DEFAULT 10,
    silenciado_hasta TIMESTAMP WITH TIME ZONE,
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_inmuebles_ubicacion ON inmuebles_ciudadanos USING GIST (ubicacion);
CREATE INDEX IF NOT EXISTS idx_inmuebles_usuario ON inmuebles_ciudadanos(usuario_id);

-- Tabla de PQRS Cívico (Reportes Ciudadanos con GPS forzado y foto)
CREATE TABLE IF NOT EXISTS reportes_pqrs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    usuario_id UUID REFERENCES usuarios(id) ON DELETE SET NULL,
    turno_id UUID REFERENCES turnos_recoleccion(id) ON DELETE SET NULL,
    tipo_incidencia VARCHAR(50) NOT NULL,
    descripcion TEXT NOT NULL,
    foto_url TEXT,
    punto GEOMETRY(Point, 4326) NOT NULL,
    estado VARCHAR(20) DEFAULT 'recibida',
    cuadrilla_asignada VARCHAR(100),
    respuesta_operativa TEXT,
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_pqrs_punto ON reportes_pqrs USING GIST (punto);
CREATE INDEX IF NOT EXISTS idx_pqrs_usuario ON reportes_pqrs(usuario_id);

-- Tabla de Novedades de Vía en Tiempo Real (Cabina Conductor)
CREATE TABLE IF NOT EXISTS novedades_via (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    turno_id UUID REFERENCES turnos_recoleccion(id) ON DELETE SET NULL,
    vehiculo_id UUID REFERENCES vehiculos(id) ON DELETE SET NULL,
    tipo_novedad VARCHAR(50) NOT NULL,
    descripcion TEXT,
    punto GEOMETRY(Point, 4326) NOT NULL,
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_novedades_punto ON novedades_via USING GIST (punto);

-- Tabla de Alertas de Cuencas y Prevención de Inundaciones (La Yesca, Caraño)
CREATE TABLE IF NOT EXISTS alertas_cuencas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    quebrada VARCHAR(50) NOT NULL,
    nivel_riesgo VARCHAR(30) DEFAULT 'precaucion',
    descripcion TEXT NOT NULL,
    punto GEOMETRY(Point, 4326) NOT NULL,
    foto_url TEXT,
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_cuencas_punto ON alertas_cuencas USING GIST (punto);

-- Tabla de Material Aprovechable (Reciclaje Comunitario)
CREATE TABLE IF NOT EXISTS material_aprovechable (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    usuario_id UUID REFERENCES usuarios(id) ON DELETE SET NULL,
    tipo_material VARCHAR(50) NOT NULL,
    cantidad_aprox VARCHAR(100) NOT NULL,
    contacto VARCHAR(100) NOT NULL,
    direccion VARCHAR(200) NOT NULL,
    punto GEOMETRY(Point, 4326) NOT NULL,
    estado VARCHAR(20) DEFAULT 'disponible',
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_reciclaje_punto ON material_aprovechable USING GIST (punto);

-- Tabla de División Territorial Oficial de Quibdó (6 Comunas Urbanas, Corregimientos, Barrios y Sectores)
CREATE TABLE IF NOT EXISTS territorio_quibdo (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tipo VARCHAR(30) NOT NULL DEFAULT 'comuna_urbana', -- comuna_urbana | corregimiento_rural
    comuna VARCHAR(100) NOT NULL,
    nombre_zona VARCHAR(150) NOT NULL,
    barrio VARCHAR(120) NOT NULL,
    sector VARCHAR(120),
    lat NUMERIC(10, 6) NOT NULL,
    lng NUMERIC(10, 6) NOT NULL,
    punto GEOMETRY(Point, 4326),
    descripcion TEXT,
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_territorio_comuna ON territorio_quibdo(comuna);
CREATE INDEX IF NOT EXISTS idx_territorio_barrio ON territorio_quibdo(barrio);
CREATE INDEX IF NOT EXISTS idx_territorio_punto ON territorio_quibdo USING GIST (punto);

