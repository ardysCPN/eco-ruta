-- ==============================================================================
-- ECO-RUTA Quibdó - Script de Siembra Inicial Oficial (División Territorial y Base)
-- ==============================================================================

-- 1. LIMPIEZA INICIAL DE TABLAS TERRITORIALES Y BASE
TRUNCATE TABLE territorio_quibdo CASCADE;
TRUNCATE TABLE vehiculos CASCADE;
TRUNCATE TABLE material_aprovechable CASCADE;
-- NOTA: Rutas, puntos de acopio y turnos permanecen en CERO (0) para creación manual en vivo.

-- 2. INSERCIÓN DE LA DIVISIÓN TERRITORIAL COMPLETA DE QUIBDÓ (6 COMUNAS + CORREGIMIENTOS)
INSERT INTO territorio_quibdo (tipo, comuna, nombre_zona, barrio, sector, lat, lng, punto, descripcion) VALUES
-- COMUNA 1: Centro Histórico & Ribera del Atrato
('comuna_urbana', 'Comuna 1', 'Comuna 1 - Centro Histórico & Ribera del Atrato', 'Centro', 'Sector Institucional / Alcaldía', 5.6940, -76.6580, ST_SetSRID(ST_MakePoint(-76.6580, 5.6940), 4326), 'Eje administrativo, Catedral San Francisco y Parque Central'),
('comuna_urbana', 'Comuna 1', 'Comuna 1 - Centro Histórico & Ribera del Atrato', 'Malecón del Atrato', 'Ribera Río Atrato', 5.6955, -76.6605, ST_SetSRID(ST_MakePoint(-76.6605, 5.6955), 4326), 'Paseo turístico y fluvial Jota Mario Flores'),
('comuna_urbana', 'Comuna 1', 'Comuna 1 - Centro Histórico & Ribera del Atrato', 'Barrio Roma', 'Sector Residencial Antiguo', 5.6925, -76.6565, ST_SetSRID(ST_MakePoint(-76.6565, 5.6925), 4326), 'Zona tradicional residencial del centro'),
('comuna_urbana', 'Comuna 1', 'Comuna 1 - Centro Histórico & Ribera del Atrato', 'Alameda Reyes', 'Sector Carrera 1 a 3', 5.6912, -76.6578, ST_SetSRID(ST_MakePoint(-76.6578, 5.6912), 4326), 'Corredor histórico de Quibdó'),
('comuna_urbana', 'Comuna 1', 'Comuna 1 - Centro Histórico & Ribera del Atrato', 'Yesca Grande', 'Cuenca Baja Quebrada La Yesca', 5.6901, -76.6550, ST_SetSRID(ST_MakePoint(-76.6550, 5.6901), 4326), 'Sector comercial y de comercio minorista'),
('comuna_urbana', 'Comuna 1', 'Comuna 1 - Centro Histórico & Ribera del Atrato', 'La Yesquita', 'Sector Puente La Yesquita', 5.6918, -76.6535, ST_SetSRID(ST_MakePoint(-76.6535, 5.6918), 4326), 'Sector densamente poblado junto al afluente'),
('comuna_urbana', 'Comuna 1', 'Comuna 1 - Centro Histórico & Ribera del Atrato', 'César Conto', 'Sector Calle 24 a 28', 5.6885, -76.6570, ST_SetSRID(ST_MakePoint(-76.6570, 5.6885), 4326), 'Barrio tradicional residencial'),
('comuna_urbana', 'Comuna 1', 'Comuna 1 - Centro Histórico & Ribera del Atrato', 'Cristo Rey', 'Sector Capilla Cristo Rey', 5.6865, -76.6582, ST_SetSRID(ST_MakePoint(-76.6582, 5.6865), 4326), 'Zona de transición al sur céntrico'),
('comuna_urbana', 'Comuna 1', 'Comuna 1 - Centro Histórico & Ribera del Atrato', 'San José', 'Sector San José Centro', 5.6895, -76.6600, ST_SetSRID(ST_MakePoint(-76.6600, 5.6895), 4326), 'Viviendas frente al río y comercio portuario'),
('comuna_urbana', 'Comuna 1', 'Comuna 1 - Centro Histórico & Ribera del Atrato', 'El Silencio (Centro)', 'Sector Carrera 5', 5.6930, -76.6540, ST_SetSRID(ST_MakePoint(-76.6540, 5.6930), 4326), 'Sector céntrico de alto flujo vehicular'),
('comuna_urbana', 'Comuna 1', 'Comuna 1 - Centro Histórico & Ribera del Atrato', 'Bahía Solano (El Pindo)', 'Sector Puerto Fluvial El Pindo', 5.6965, -76.6590, ST_SetSRID(ST_MakePoint(-76.6590, 5.6965), 4326), 'Zona ribereña portuaria de Quibdó'),

-- COMUNA 2: Norte & Cuenca La Yesca (Huapango / San Vicente)
('comuna_urbana', 'Comuna 2', 'Comuna 2 - Norte & Cuenca La Yesca', 'Huapango', 'Sector Principal / Cancha', 5.7010, -76.6540, ST_SetSRID(ST_MakePoint(-76.6540, 5.7010), 4326), 'Barrio tradicional norte de Quibdó'),
('comuna_urbana', 'Comuna 2', 'Comuna 2 - Norte & Cuenca La Yesca', 'Huapango La Aurora', 'Sector La Aurora', 5.7025, -76.6525, ST_SetSRID(ST_MakePoint(-76.6525, 5.7025), 4326), 'Zona alta de Huapango'),
('comuna_urbana', 'Comuna 2', 'Comuna 2 - Norte & Cuenca La Yesca', 'San Vicente', 'Sector Iglesia San Vicente', 5.6980, -76.6530, ST_SetSRID(ST_MakePoint(-76.6530, 5.6980), 4326), 'Comunidad residencial norte'),
('comuna_urbana', 'Comuna 2', 'Comuna 2 - Norte & Cuenca La Yesca', 'Santa Ana', 'Sector Cancha Santa Ana', 5.6995, -76.6505, ST_SetSRID(ST_MakePoint(-76.6505, 5.6995), 4326), 'Zona residencial de alta afluencia'),
('comuna_urbana', 'Comuna 2', 'Comuna 2 - Norte & Cuenca La Yesca', 'El Porvenir', 'Sector Escuela El Porvenir', 5.7030, -76.6560, ST_SetSRID(ST_MakePoint(-76.6560, 5.7030), 4326), 'Sector colindante con ribera norte'),
('comuna_urbana', 'Comuna 2', 'Comuna 2 - Norte & Cuenca La Yesca', 'Tomás Pérez', 'Sector Principal', 5.7045, -76.6545, ST_SetSRID(ST_MakePoint(-76.6545, 5.7045), 4326), 'Sector norte de expansión urbana'),
('comuna_urbana', 'Comuna 2', 'Comuna 2 - Norte & Cuenca La Yesca', 'Las Américas', 'Sector Polideportivo', 5.7060, -76.6520, ST_SetSRID(ST_MakePoint(-76.6520, 5.7060), 4326), 'Sector residencial norte'),
('comuna_urbana', 'Comuna 2', 'Comuna 2 - Norte & Cuenca La Yesca', 'Pandeyuca', 'Sector Carrera 7 Norte', 5.7015, -76.6495, ST_SetSRID(ST_MakePoint(-76.6495, 5.7015), 4326), 'Sector comercial y residencial'),
('comuna_urbana', 'Comuna 2', 'Comuna 2 - Norte & Cuenca La Yesca', 'Buenos Aires Norte', 'Sector Límite Comuna 2', 5.7050, -76.6480, ST_SetSRID(ST_MakePoint(-76.6480, 5.7050), 4326), 'Zona alta del norte'),
('comuna_urbana', 'Comuna 2', 'Comuna 2 - Norte & Cuenca La Yesca', 'Samper', 'Sector Vía Principal', 5.7075, -76.6500, ST_SetSRID(ST_MakePoint(-76.6500, 5.7075), 4326), 'Sector residencial y talleres'),
('comuna_urbana', 'Comuna 2', 'Comuna 2 - Norte & Cuenca La Yesca', 'El Silencio Norte', 'Sector Colina Norte', 5.6970, -76.6515, ST_SetSRID(ST_MakePoint(-76.6515, 5.6970), 4326), 'Zona residencial intermedia'),
('comuna_urbana', 'Comuna 2', 'Comuna 2 - Norte & Cuenca La Yesca', 'Chamblum', 'Sector Ribereño Norte', 5.7000, -76.6585, ST_SetSRID(ST_MakePoint(-76.6585, 5.7000), 4326), 'Asentamiento costanero del Atrato'),
('comuna_urbana', 'Comuna 2', 'Comuna 2 - Norte & Cuenca La Yesca', 'Los Álamos Norte', 'Sector Límite Nororiente', 5.7085, -76.6465, ST_SetSRID(ST_MakePoint(-76.6465, 5.7085), 4326), 'Sector residencial'),

-- COMUNA 3: Occidente / Medrano & Kennedy
('comuna_urbana', 'Comuna 3', 'Comuna 3 - Occidente / Medrano & Kennedy', 'Medrano', 'Sector Central Medrano', 5.6890, -76.6660, ST_SetSRID(ST_MakePoint(-76.6660, 5.6890), 4326), 'Corredor occidental principal'),
('comuna_urbana', 'Comuna 3', 'Comuna 3 - Occidente / Medrano & Kennedy', 'Medrano La Trocha', 'Sector La Trocha', 5.6875, -76.6690, ST_SetSRID(ST_MakePoint(-76.6690, 5.6875), 4326), 'Vía conectora hacia el occidente'),
('comuna_urbana', 'Comuna 3', 'Comuna 3 - Occidente / Medrano & Kennedy', 'Barrio Kennedy', 'Sector Cancha Kennedy', 5.6850, -76.6650, ST_SetSRID(ST_MakePoint(-76.6650, 5.6850), 4326), 'Sector populoso residencial'),
('comuna_urbana', 'Comuna 3', 'Comuna 3 - Occidente / Medrano & Kennedy', 'La Esmeralda', 'Sector Parque Esmeralda', 5.6870, -76.6625, ST_SetSRID(ST_MakePoint(-76.6625, 5.6870), 4326), 'Zona residencial y comercial'),
('comuna_urbana', 'Comuna 3', 'Comuna 3 - Occidente / Medrano & Kennedy', 'Los Álamos', 'Sector Los Álamos Central', 5.6910, -76.6640, ST_SetSRID(ST_MakePoint(-76.6640, 5.6910), 4326), 'Barrio residencial consolidado'),
('comuna_urbana', 'Comuna 3', 'Comuna 3 - Occidente / Medrano & Kennedy', 'Minuto de Dios', 'Sector Capilla Minuto de Dios', 5.6840, -76.6675, ST_SetSRID(ST_MakePoint(-76.6675, 5.6840), 4326), 'Vivienda social y comunitaria'),
('comuna_urbana', 'Comuna 3', 'Comuna 3 - Occidente / Medrano & Kennedy', 'Chambacú', 'Sector Puente Chambacú', 5.6930, -76.6620, ST_SetSRID(ST_MakePoint(-76.6620, 5.6930), 4326), 'Sector colindante con zona céntrica'),
('comuna_urbana', 'Comuna 3', 'Comuna 3 - Occidente / Medrano & Kennedy', 'San Pedro', 'Sector San Pedro Occidente', 5.6900, -76.6610, ST_SetSRID(ST_MakePoint(-76.6610, 5.6900), 4326), 'Sector habitacional'),
('comuna_urbana', 'Comuna 3', 'Comuna 3 - Occidente / Medrano & Kennedy', 'La Gloria', 'Sector Loma La Gloria', 5.6820, -76.6695, ST_SetSRID(ST_MakePoint(-76.6695, 5.6820), 4326), 'Zona alta occidental'),
('comuna_urbana', 'Comuna 3', 'Comuna 3 - Occidente / Medrano & Kennedy', 'La Cascorva', 'Sector Cascorva', 5.6810, -76.6660, ST_SetSRID(ST_MakePoint(-76.6660, 5.6810), 4326), 'Sector occidental de ladera'),
('comuna_urbana', 'Comuna 3', 'Comuna 3 - Occidente / Medrano & Kennedy', 'Simón Bolívar', 'Sector Cancha Simón Bolívar', 5.6835, -76.6630, ST_SetSRID(ST_MakePoint(-76.6630, 5.6835), 4326), 'Sector residencial'),
('comuna_urbana', 'Comuna 3', 'Comuna 3 - Occidente / Medrano & Kennedy', 'El Futuro', 'Sector El Futuro', 5.6860, -76.6710, ST_SetSRID(ST_MakePoint(-76.6710, 5.6860), 4326), 'Zona de crecimiento urbano'),
('comuna_urbana', 'Comuna 3', 'Comuna 3 - Occidente / Medrano & Kennedy', 'Villa España', 'Sector Residencial Villa España', 5.6895, -76.6685, ST_SetSRID(ST_MakePoint(-76.6685, 5.6895), 4326), 'Conjunto y viviendas residenciales'),
('comuna_urbana', 'Comuna 3', 'Comuna 3 - Occidente / Medrano & Kennedy', 'Robledo', 'Sector Robledo Quibdó', 5.6920, -76.6670, ST_SetSRID(ST_MakePoint(-76.6670, 5.6920), 4326), 'Sector colindante con Medrano'),

-- COMUNA 4: Sur & Ribera (El Niño Jesús & Playita)
('comuna_urbana', 'Comuna 4', 'Comuna 4 - Sur / El Niño Jesús & Playita', 'El Niño Jesús', 'Sector Parte Alta', 5.6810, -76.6570, ST_SetSRID(ST_MakePoint(-76.6570, 5.6810), 4326), 'Comunidad emblemática sur de Quibdó'),
('comuna_urbana', 'Comuna 4', 'Comuna 4 - Sur / El Niño Jesús & Playita', 'El Niño Jesús Bajo', 'Sector Ribera Niño Jesús', 5.6825, -76.6590, ST_SetSRID(ST_MakePoint(-76.6590, 5.6825), 4326), 'Sector bajo junto al río Atrato'),
('comuna_urbana', 'Comuna 4', 'Comuna 4 - Sur / El Niño Jesús & Playita', 'Playita', 'Sector Ribereño y Cancha', 5.6840, -76.6605, ST_SetSRID(ST_MakePoint(-76.6605, 5.6840), 4326), 'Sector pesquero y ribereño tradicional'),
('comuna_urbana', 'Comuna 4', 'Comuna 4 - Sur / El Niño Jesús & Playita', 'Alfonso López', 'Sector Alfonso López Central', 5.6795, -76.6550, ST_SetSRID(ST_MakePoint(-76.6550, 5.6795), 4326), 'Zona residencial del sur'),
('comuna_urbana', 'Comuna 4', 'Comuna 4 - Sur / El Niño Jesús & Playita', 'Las Margaritas', 'Sector Escolar Las Margaritas', 5.6780, -76.6535, ST_SetSRID(ST_MakePoint(-76.6535, 5.6780), 4326), 'Sector de viviendas familiares'),
('comuna_urbana', 'Comuna 4', 'Comuna 4 - Sur / El Niño Jesús & Playita', 'San Judas Tadeo 1', 'Sector Etapa 1', 5.6765, -76.6560, ST_SetSRID(ST_MakePoint(-76.6560, 5.6765), 4326), 'Urbanización popular sur'),
('comuna_urbana', 'Comuna 4', 'Comuna 4 - Sur / El Niño Jesús & Playita', 'San Judas Tadeo 2', 'Sector Etapa 2', 5.6750, -76.6575, ST_SetSRID(ST_MakePoint(-76.6575, 5.6750), 4326), 'Extensión residencial'),
('comuna_urbana', 'Comuna 4', 'Comuna 4 - Sur / El Niño Jesús & Playita', 'Mis Esfuerzos', 'Sector Central', 5.6740, -76.6540, ST_SetSRID(ST_MakePoint(-76.6540, 5.6740), 4326), 'Asentamiento popular sur'),
('comuna_urbana', 'Comuna 4', 'Comuna 4 - Sur / El Niño Jesús & Playita', 'Subachoque', 'Sector Vía Subachoque', 5.6770, -76.6590, ST_SetSRID(ST_MakePoint(-76.6590, 5.6770), 4326), 'Sector ribereño meridional'),
('comuna_urbana', 'Comuna 4', 'Comuna 4 - Sur / El Niño Jesús & Playita', 'La Victoria', 'Sector La Victoria Sur', 5.6725, -76.6555, ST_SetSRID(ST_MakePoint(-76.6555, 5.6725), 4326), 'Sector residencial'),
('comuna_urbana', 'Comuna 4', 'Comuna 4 - Sur / El Niño Jesús & Playita', 'Las Palmas', 'Sector Las Palmas', 5.6755, -76.6520, ST_SetSRID(ST_MakePoint(-76.6520, 5.6755), 4326), 'Zona residencial'),
('comuna_urbana', 'Comuna 4', 'Comuna 4 - Sur / El Niño Jesús & Playita', 'Las Colinas', 'Sector Colinas del Sur', 5.6730, -76.6505, ST_SetSRID(ST_MakePoint(-76.6505, 5.6730), 4326), 'Zona alta del extremo sur'),

-- COMUNA 5: Suroriente / El Jardín, Reposo & Cabí
('comuna_urbana', 'Comuna 5', 'Comuna 5 - Suroriente / El Jardín, Reposo & Cabí', 'El Jardín', 'Sector 1 / Parque Principal', 5.6820, -76.6450, ST_SetSRID(ST_MakePoint(-76.6450, 5.6820), 4326), 'Barrio neurálgico del suroriente'),
('comuna_urbana', 'Comuna 5', 'Comuna 5 - Suroriente / El Jardín, Reposo & Cabí', 'El Jardín Sector 2', 'Sector 2 El Jardín', 5.6805, -76.6435, ST_SetSRID(ST_MakePoint(-76.6435, 5.6805), 4326), 'Zona residencial y comercial'),
('comuna_urbana', 'Comuna 5', 'Comuna 5 - Suroriente / El Jardín, Reposo & Cabí', 'El Jardín Sector 3', 'Sector 3 El Jardín', 5.6790, -76.6420, ST_SetSRID(ST_MakePoint(-76.6420, 5.6790), 4326), 'Zona residencial'),
('comuna_urbana', 'Comuna 5', 'Comuna 5 - Suroriente / El Jardín, Reposo & Cabí', 'Cabí (Sector Urbano)', 'Entrada Vía Cabí', 5.6750, -76.6400, ST_SetSRID(ST_MakePoint(-76.6400, 5.6750), 4326), 'Corredor vial hacia el relleno sanitario Cabí'),
('comuna_urbana', 'Comuna 5', 'Comuna 5 - Suroriente / El Jardín, Reposo & Cabí', 'Reposo 1', 'Sector Reposo 1 Principal', 5.6840, -76.6400, ST_SetSRID(ST_MakePoint(-76.6400, 5.6840), 4326), 'Sector popular suroriental'),
('comuna_urbana', 'Comuna 5', 'Comuna 5 - Suroriente / El Jardín, Reposo & Cabí', 'Reposo 2', 'Sector Reposo 2 Cancha', 5.6825, -76.6380, ST_SetSRID(ST_MakePoint(-76.6380, 5.6825), 4326), 'Sector residencial de alta densidad'),
('comuna_urbana', 'Comuna 5', 'Comuna 5 - Suroriente / El Jardín, Reposo & Cabí', 'Reposo 3', 'Sector Reposo 3 Alto', 5.6810, -76.6360, ST_SetSRID(ST_MakePoint(-76.6360, 5.6810), 4326), 'Expansión suroriental'),
('comuna_urbana', 'Comuna 5', 'Comuna 5 - Suroriente / El Jardín, Reposo & Cabí', 'Obregón', 'Sector Obregón', 5.6860, -76.6420, ST_SetSRID(ST_MakePoint(-76.6420, 5.6860), 4326), 'Zona residencial'),
('comuna_urbana', 'Comuna 5', 'Comuna 5 - Suroriente / El Jardín, Reposo & Cabí', 'Buenos Aires Sur', 'Sector Buenos Aires Sur', 5.6775, -76.6450, ST_SetSRID(ST_MakePoint(-76.6450, 5.6775), 4326), 'Barrio del suroriente'),
('comuna_urbana', 'Comuna 5', 'Comuna 5 - Suroriente / El Jardín, Reposo & Cabí', 'Ciudadela Mía', 'Megaproyecto Habitacional', 5.6720, -76.6370, ST_SetSRID(ST_MakePoint(-76.6370, 5.6720), 4326), 'Ciudadela de vivienda de interés prioritario'),
('comuna_urbana', 'Comuna 5', 'Comuna 5 - Suroriente / El Jardín, Reposo & Cabí', 'El Diamante', 'Sector El Diamante', 5.6740, -76.6425, ST_SetSRID(ST_MakePoint(-76.6425, 5.6740), 4326), 'Sector habitacional'),
('comuna_urbana', 'Comuna 5', 'Comuna 5 - Suroriente / El Jardín, Reposo & Cabí', 'Paraíso', 'Sector Paraíso Sur', 5.6760, -76.6440, ST_SetSRID(ST_MakePoint(-76.6440, 5.6760), 4326), 'Zona residencial'),
('comuna_urbana', 'Comuna 5', 'Comuna 5 - Suroriente / El Jardín, Reposo & Cabí', 'La Aurora Sur', 'Sector La Aurora Sur', 5.6795, -76.6470, ST_SetSRID(ST_MakePoint(-76.6470, 5.6795), 4326), 'Barrio residencial'),
('comuna_urbana', 'Comuna 5', 'Comuna 5 - Suroriente / El Jardín, Reposo & Cabí', 'Nuevo Horizonte', 'Sector Nuevo Horizonte', 5.6710, -76.6390, ST_SetSRID(ST_MakePoint(-76.6390, 5.6710), 4326), 'Expansión suroriental'),
('comuna_urbana', 'Comuna 5', 'Comuna 5 - Suroriente / El Jardín, Reposo & Cabí', 'Villa Hermosa', 'Sector Villa Hermosa', 5.6730, -76.6460, ST_SetSRID(ST_MakePoint(-76.6460, 5.6730), 4326), 'Barrio residencial'),

-- COMUNA 6: Oriental / El Caraño & Vía Medellín
('comuna_urbana', 'Comuna 6', 'Comuna 6 - Oriental / El Caraño & Vía Medellín', 'El Caraño', 'Sector Entrada Principal', 5.6920, -76.6400, ST_SetSRID(ST_MakePoint(-76.6400, 5.6920), 4326), 'Corredor vial aeroportuario'),
('comuna_urbana', 'Comuna 6', 'Comuna 6 - Oriental / El Caraño & Vía Medellín', 'Aeropuerto El Caraño', 'Terminal Aérea Álvaro Rey Zúñiga', 5.6910, -76.6380, ST_SetSRID(ST_MakePoint(-76.6380, 5.6910), 4326), 'Aeropuerto y Centro Comercial El Caraño'),
('comuna_urbana', 'Comuna 6', 'Comuna 6 - Oriental / El Caraño & Vía Medellín', 'Los Ángeles', 'Sector Los Ángeles', 5.6945, -76.6420, ST_SetSRID(ST_MakePoint(-76.6420, 5.6945), 4326), 'Barrio residencial oriental'),
('comuna_urbana', 'Comuna 6', 'Comuna 6 - Oriental / El Caraño & Vía Medellín', 'Sector Universidad UTCH', 'Ciudadela Universitaria UTCH', 5.6970, -76.6440, ST_SetSRID(ST_MakePoint(-76.6440, 5.6970), 4326), 'Campus Universidad Tecnológica del Chocó'),
('comuna_urbana', 'Comuna 6', 'Comuna 6 - Oriental / El Caraño & Vía Medellín', 'Zona Franca / Vía Medellín', 'Sector Salida a Medellín', 5.6900, -76.6340, ST_SetSRID(ST_MakePoint(-76.6340, 5.6900), 4326), 'Corredor logístico y de transporte'),
('comuna_urbana', 'Comuna 6', 'Comuna 6 - Oriental / El Caraño & Vía Medellín', 'Sector Base Aérea', 'Base Aérea / Policía', 5.6885, -76.6360, ST_SetSRID(ST_MakePoint(-76.6360, 5.6885), 4326), 'Sector militar y de seguridad'),
('comuna_urbana', 'Comuna 6', 'Comuna 6 - Oriental / El Caraño & Vía Medellín', 'Los Castillos', 'Sector Los Castillos', 5.6960, -76.6390, ST_SetSRID(ST_MakePoint(-76.6390, 5.6960), 4326), 'Sector residencial'),
('comuna_urbana', 'Comuna 6', 'Comuna 6 - Oriental / El Caraño & Vía Medellín', 'Las Brisas', 'Sector Las Brisas Oriente', 5.6980, -76.6410, ST_SetSRID(ST_MakePoint(-76.6410, 5.6980), 4326), 'Zona residencial'),
('comuna_urbana', 'Comuna 6', 'Comuna 6 - Oriental / El Caraño & Vía Medellín', 'Villa del Río', 'Sector Villa del Río Oriente', 5.6935, -76.6370, ST_SetSRID(ST_MakePoint(-76.6370, 5.6935), 4326), 'Sector habitacional'),
('comuna_urbana', 'Comuna 6', 'Comuna 6 - Oriental / El Caraño & Vía Medellín', 'La Platina', 'Sector Vía Tutunendo Antigua', 5.7000, -76.6380, ST_SetSRID(ST_MakePoint(-76.6380, 5.7000), 4326), 'Sector de talleres y vivienda'),

-- CORREGIMIENTOS & ZONA RURAL DE QUIBDÓ
('corregimiento_rural', 'Zona Rural', 'Corregimiento Tutunendo', 'Tutunendo (Caserío)', 'Poblado Principal', 5.7520, -76.5340, ST_SetSRID(ST_MakePoint(-76.5340, 5.7520), 4326), 'Principal corregimiento ecoturístico y fluvial'),
('corregimiento_rural', 'Zona Rural', 'Corregimiento Tutunendo', 'Tutunendo (Borrascosa / Piedra Lisa)', 'Balnearios Borrascosa & Piedra Lisa', 5.7580, -76.5290, ST_SetSRID(ST_MakePoint(-76.5290, 5.7580), 4326), 'Zona turística y gastronómica sobre el río Tutunendo'),
('corregimiento_rural', 'Zona Rural', 'Corregimiento Pacurita', 'Pacurita', 'Caserío y Balneario Pacurita', 5.6780, -76.6020, ST_SetSRID(ST_MakePoint(-76.6020, 5.6780), 4326), 'Corregimiento tradicional de esparcimiento'),
('corregimiento_rural', 'Zona Rural', 'Corregimiento San Francisco de Ichó', 'San Francisco de Ichó', 'Caserío Ichó', 5.6420, -76.5890, ST_SetSRID(ST_MakePoint(-76.5890, 5.6420), 4326), 'Comunidad sobre la cuenca del río Ichó'),
('corregimiento_rural', 'Zona Rural', 'Corregimiento Cabí Rural', 'Cabí Rural (Relleno Sanitario)', 'Relleno Sanitario Cabí EPQ', 5.6580, -76.6380, ST_SetSRID(ST_MakePoint(-76.6380, 5.6580), 4326), 'Punto oficial de disposición final de residuos sólidos'),
('corregimiento_rural', 'Zona Rural', 'Corregimiento Tagachí', 'Tagachí', 'Caserío Fluvial Río Atrato', 5.8920, -76.7120, ST_SetSRID(ST_MakePoint(-76.7120, 5.8920), 4326), 'Corregimiento ribereño al norte sobre el Atrato'),
('corregimiento_rural', 'Zona Rural', 'Corregimiento Neguá', 'Neguá', 'Poblado Cuenca Neguá', 5.7890, -76.6120, ST_SetSRID(ST_MakePoint(-76.6120, 5.7890), 4326), 'Corregimiento rural agrícola'),
('corregimiento_rural', 'Zona Rural', 'Corregimiento Guayabal', 'Guayabal', 'Caserío Guayabal', 5.6210, -76.6450, ST_SetSRID(ST_MakePoint(-76.6450, 5.6210), 4326), 'Comunidad rural meridional'),
('corregimiento_rural', 'Zona Rural', 'Corregimiento Beté', 'Beté / Villa Conto', 'Poblado Rural', 5.8450, -76.6890, ST_SetSRID(ST_MakePoint(-76.6890, 5.8450), 4326), 'Corregimiento sobre el río Atrato'),
('corregimiento_rural', 'Zona Rural', 'Corregimiento La Troje', 'La Troje', 'Vía Quibdó - Tutunendo km 8', 5.7250, -76.5920, ST_SetSRID(ST_MakePoint(-76.5920, 5.7250), 4326), 'Sector rural de paso'),
('corregimiento_rural', 'Zona Rural', 'Corregimiento Boca de Tanando', 'Boca de Tanando', 'Río Tanando', 5.6980, -76.5680, ST_SetSRID(ST_MakePoint(-76.5680, 5.6980), 4326), 'Comunidad rural'),
('corregimiento_rural', 'Zona Rural', 'Corregimiento Bella Vista', 'Bella Vista', 'Caserío Bella Vista', 5.6130, -76.6320, ST_SetSRID(ST_MakePoint(-76.6320, 5.6130), 4326), 'Comunidad rural'),
('corregimiento_rural', 'Zona Rural', 'Corregimiento San Antonio', 'San Antonio de los Managrús', 'Poblado Managrús', 5.6310, -76.6150, ST_SetSRID(ST_MakePoint(-76.6150, 5.6310), 4326), 'Comunidad rural'),
('corregimiento_rural', 'Zona Rural', 'Corregimiento San Martín', 'San Martín de Purré', 'Sector Purré', 5.7410, -76.5510, ST_SetSRID(ST_MakePoint(-76.5510, 5.7410), 4326), 'Sector rural');

-- 3. VEHÍCULOS OFICIALES PARA OPERACIÓN EN QUIBDÓ
INSERT INTO vehiculos (id, codigo, placa, capacidad_ton, estado) VALUES
('b1000000-0000-0000-0000-000000000001', 'COMP-01', 'QBD-101', 12.50, 'disponible'),
('b1000000-0000-0000-0000-000000000002', 'COMP-02', 'QBD-102', 12.50, 'disponible'),
('b1000000-0000-0000-0000-000000000003', 'COMP-03', 'QBD-103', 8.50, 'disponible'),
('b1000000-0000-0000-0000-000000000004', 'SUP-01', 'EPQ-201', 2.50, 'disponible'),
('b1000000-0000-0000-0000-000000000005', 'MOTO-01', 'MC-301', 1.20, 'disponible');

-- 4. USUARIOS OFICIALES PARA PRUEBAS Y OPERACIÓN
-- Limpiar usuarios existentes para evitar duplicados en la siembra
DELETE FROM usuarios WHERE email IN (
  'ardis.diaz@aguasdelatrato.com',
  'katerine.renteria@gmail.com',
  'admin@aguasdelatrato.com',
  'alcaldia@quibdo-choco.gov.co'
) OR telefono IN ('3134445566', '3125551234', '3100000001', '3100000002');

INSERT INTO usuarios (id, numero_documento, nombre, apellidos, telefono, email, password_hash, rol, cargo, licencia_conduccion, estado, pin_conductor, barrio, comuna) VALUES
-- Ardis Díaz: Conductor Titular / Operador de ruta (Prueba de conducción desde Oficina a Casa)
('d1000000-0000-0000-0000-000000000004', '1077112233', 'Ardis', 'Díaz', '3134445566', 'ardis.diaz@aguasdelatrato.com', '123456', 'conductor', 'conductor', 'C2', 'activo', '1234', 'El Jardín', 'Comuna 5'),
-- Katerine Rentería: Ciudadana en Casa (Para recibir alerta sonora y ver el camión en tiempo real)
('d1000000-0000-0000-0000-000000000001', '1118889901', 'Katerine', 'Rentería Córdoba', '3125551234', 'katerine.renteria@gmail.com', '123456', 'ciudadano', NULL, NULL, 'activo', NULL, 'Huapango', 'Comuna 2'),
-- Despacho y Torre de Control EPQ / Aguas del Atrato
('d1000000-0000-0000-0000-000000000010', '1077000001', 'Despacho Operativo', 'EPQ Quibdó', '3100000001', 'admin@aguasdelatrato.com', 'admin123', 'admin', 'despachador', NULL, 'activo', NULL, 'Centro', 'Comuna 1'),
-- Secretaría de Servicios y Medio Ambiente - Alcaldía de Quibdó
('d1000000-0000-0000-0000-000000000020', '1077000002', 'Supervisión PGIRS', 'Alcaldía de Quibdó', '3100000002', 'alcaldia@quibdo-choco.gov.co', 'alcaldia123', 'alcaldia', 'interventor', NULL, 'activo', NULL, 'Centro', 'Comuna 1');

-- 5. GUÍA EDUCATIVA DE RECICLAJE Y MATERIAL APROVECHABLE
INSERT INTO material_aprovechable (tipo_material, cantidad_aprox, contacto, direccion, punto, estado) VALUES
('Plástico PET y Envases', 'Bolsas blancas limpias', 'Asociación de Recicladores del Atrato', 'Centro de Acopio Malecón', ST_SetSRID(ST_MakePoint(-76.6590, 5.6950), 4326), 'disponible'),
('Cartón y Papel Seco', 'Cajas plegadas y papel archivo', 'Asociación de Recicladores del Atrato', 'Sector Alameda Reyes', ST_SetSRID(ST_MakePoint(-76.6570, 5.6910), 4326), 'disponible'),
('Vidrio y Botellas', 'Frascos y botellas sin romper', 'Punto Verde Huapango', 'Cancha Huapango', ST_SetSRID(ST_MakePoint(-76.6540, 5.7010), 4326), 'disponible'),
('Metales y Chatarra', 'Latas de aluminio y metales', 'Punto Limpio El Jardín', 'El Jardín Sector 1', ST_SetSRID(ST_MakePoint(-76.6450, 5.6820), 4326), 'disponible');

-- Finalización: Rutas oficiales y turnos quedan en 0 registros para registro manual dinámico en producción.
