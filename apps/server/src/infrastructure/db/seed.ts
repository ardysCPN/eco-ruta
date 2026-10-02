import { pool, query } from './connection.js';

async function seed() {
  console.log('🌱 Iniciando siembra de datos geoespaciales para Quibdó, Chocó (Aguas del Atrato & Alcaldía)...');
  try {
    // 1. Limpiar y sincronizar tablas
    await query(`
      DROP TABLE IF EXISTS material_aprovechable CASCADE;
      DROP TABLE IF EXISTS alertas_cuencas CASCADE;
      DROP TABLE IF EXISTS novedades_via CASCADE;
      DROP TABLE IF EXISTS puntos_acopio CASCADE;
      DROP TABLE IF EXISTS telemetria_posiciones CASCADE;
      DROP TABLE IF EXISTS reportes_pqrs CASCADE;
      DROP TABLE IF EXISTS inmuebles_ciudadanos CASCADE;
      DROP TABLE IF EXISTS turnos_recoleccion CASCADE;
      DROP TABLE IF EXISTS vehiculos CASCADE;
      DROP TABLE IF EXISTS rutas CASCADE;
      DROP TABLE IF EXISTS usuarios CASCADE;
    `);

    // Recrear esquema actualizado
    const fs = await import('fs');
    const path = await import('path');
    const { fileURLToPath } = await import('url');
    const __dirname = path.dirname(fileURLToPath(import.meta.url));
    const schemaSql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf-8');
    await query(schemaSql);
    console.log('📦 Estructura relacional y geoespacial PostGIS recreada exitosamente.');

    // 2. Insertar Usuarios por Rol y Personal de Cuadrillas EPQ
    const usuariosSql = `
      INSERT INTO usuarios (
        id, numero_documento, nombre, apellidos, telefono, email, password_hash, rol, cargo, licencia_conduccion, estado, pin_conductor, barrio, comuna
      )
      VALUES 
        (
          'd1000000-0000-0000-0000-000000000001',
          '1118889901',
          'Katerine',
          'Rentería Córdoba',
          '3125551234',
          'katerine.renteria@gmail.com',
          '123456',
          'ciudadano',
          NULL,
          NULL,
          'activo',
          NULL,
          'Huapango',
          'Comuna 2'
        ),
        (
          'd1000000-0000-0000-0000-000000000002',
          '1077443322',
          'Carlos',
          'Palacios Mosquera',
          '3157774321',
          'carlos.palacios@aguasdelatrato.com',
          '123456',
          'conductor',
          'conductor',
          'C2',
          'activo',
          '1234',
          'Alameda Reyes',
          'Comuna 2'
        ),
        (
          'd1000000-0000-0000-0000-000000000003',
          '1077998877',
          'Yesid',
          'Palacios Mosquera',
          '3182223344',
          'yesid.conductor@aguasdelatrato.com',
          '123456',
          'conductor',
          'conductor',
          'C3',
          'activo',
          '1234',
          'Alameda Reyes',
          'Comuna 2'
        ),
        (
          'd1000000-0000-0000-0000-000000000004',
          '1077112233',
          'Ardis',
          'Díaz',
          '3134445566',
          'ardis.diaz@aguasdelatrato.com',
          '123456',
          'conductor',
          'conductor',
          'C2',
          'activo',
          '1234',
          'El Jardín',
          'Comuna 5'
        ),
        (
          'd1000000-0000-0000-0000-000000000005',
          '1077556677',
          'Hamilton',
          'Rivas',
          '3145556677',
          'hamilton.rivas@aguasdelatrato.com',
          '123456',
          'empleado',
          'ayudante',
          NULL,
          'activo',
          NULL,
          'San Vicente',
          'Comuna 2'
        ),
        (
          'd1000000-0000-0000-0000-000000000006',
          '1077667788',
          'Jhon Jairo',
          'Moreno',
          '3167778899',
          'jhon.moreno@aguasdelatrato.com',
          '123456',
          'empleado',
          'ayudante',
          NULL,
          'activo',
          NULL,
          'Playita',
          'Comuna 4'
        ),
        (
          'd1000000-0000-0000-0000-000000000007',
          '1077778899',
          'Marlon',
          'Córdoba',
          '3178889900',
          'marlon.cordoba@aguasdelatrato.com',
          '123456',
          'empleado',
          'ayudante',
          NULL,
          'activo',
          NULL,
          'Medrano',
          'Comuna 3'
        ),
        (
          'd1000000-0000-0000-0000-000000000008',
          '1077889900',
          'Carmen',
          'Córdoba',
          '3199990011',
          'carmen.cordoba@aguasdelatrato.com',
          '123456',
          'empleado',
          'barrendero',
          NULL,
          'activo',
          NULL,
          'Niño Jesús',
          'Comuna 4'
        ),
        (
          'd1000000-0000-0000-0000-000000000009',
          '1077990011',
          'Leider',
          'Mena',
          '3101112233',
          'leider.mena@aguasdelatrato.com',
          '123456',
          'empleado',
          'barrendero',
          NULL,
          'activo',
          NULL,
          'Barrio Roma',
          'Comuna 1'
        ),
        (
          'd1000000-0000-0000-0000-000000000010',
          '1077001122',
          'Ing. Dairon',
          'Moreno Asprilla',
          '3208889900',
          'despacho@aguasdelatrato.com',
          'admin123',
          'operaciones',
          'supervisor',
          'C2',
          'activo',
          NULL,
          'Centro',
          'Comuna 1'
        ),
        (
          'd1000000-0000-0000-0000-000000000011',
          '1077334455',
          'Dra. Luz Marina',
          'Mena Caicedo',
          '3114445566',
          'medioambiente@quibdo-choco.gov.co',
          'alcaldia123',
          'alcaldia',
          NULL,
          NULL,
          'activo',
          NULL,
          'Medrano',
          'Comuna 3'
        )
      RETURNING *;
    `;
    const usuariosRes = await query(usuariosSql);
    console.log(`👤 ${usuariosRes.rowCount} Usuarios y personal de Aguas del Atrato / EPQ creados.`);

    // 3. Insertar Vehículos Compactadores de Aguas del Atrato
    const vehiculosSql = `
      INSERT INTO vehiculos (id, codigo, placa, capacidad_ton, estado)
      VALUES 
        ('a1000000-0000-0000-0000-000000000001', 'COMP-01', 'CHO-101', 15.0, 'disponible'),
        ('a1000000-0000-0000-0000-000000000002', 'COMP-02', 'CHO-202', 12.5, 'disponible'),
        ('a1000000-0000-0000-0000-000000000003', 'COMP-03', 'CHO-303', 16.0, 'disponible'),
        ('a1000000-0000-0000-0000-000000000004', 'COMP-04', 'CHO-404', 10.0, 'disponible')
      RETURNING *;
    `;
    const vehiculosRes = await query(vehiculosSql);
    console.log(`🚚 ${vehiculosRes.rowCount} Compactadores de Aguas del Atrato registrados.`);

    // 4. Insertar Rutas con Geometría LineString en Quibdó (SRID 4326)
    // Coordenadas reales de Quibdó Centro y Malecón:
    // P1: Malecón Muelle: 5.6912, -76.6618
    // P2: Frente Catedral San Francisco: 5.6934, -76.6601
    // P3: Mercado Central / Calle 24: 5.6948, -76.6578
    // P4: Huapango Cra 4: 5.6965, -76.6552
    // P5: Alameda Reyes: 5.6982, -76.6528
    // 4. Insertar Rutas con Geometría LineString Real de Quibdó (SRID 4326)
    // Trazado exacto calle por calle:
    // Ruta 1: Viene por la Calle 31 -> gira al norte por Cra 1ra (Malecón) -> sube/baja por Calle 24 (entre Cra 1ra y Cra 2da Catedral) -> Cra 4ta hacia Huapango
    const rutasSql = `
      INSERT INTO rutas (id, nombre, municipio, comuna, dias_operacion, horario_estimado, trazado_oficial)
      VALUES 
        (
          'b2000000-0000-0000-0000-000000000001',
          'Ruta 1: Calle 31, Malecón Cra 1ra, Calle 24 & Catedral',
          'Quibdó',
          'Comuna 1',
          'Lunes, Miércoles, Viernes',
          '19:00 - 22:30',
          ST_GeomFromText('LINESTRING(-76.660473 5.689711, -76.660857 5.689804, -76.661575 5.688171, -76.661941 5.688559, -76.662230 5.688735, -76.662147 5.688975, -76.662144 5.688982, -76.661803 5.690028, -76.661744 5.690379, -76.661673 5.690808, -76.661567 5.691442, -76.661400 5.692216, -76.661312 5.692709, -76.661652 5.692771, -76.661652 5.692771, -76.661312 5.692709, -76.661158 5.693472, -76.660302 5.693295, -76.660324 5.693160, -76.660324 5.693160, -76.660357 5.692962, -76.659990 5.692887, -76.660357 5.692962, -76.660324 5.693160, -76.660302 5.693295, -76.659770 5.693184, -76.659356 5.693098, -76.659144 5.693986, -76.658509 5.693852, -76.657798 5.693708, -76.657770 5.693702, -76.657596 5.694544, -76.657346 5.695631, -76.657189 5.696389, -76.657140 5.696620, -76.656495 5.696547)', 4326)
        ),
        (
          'b2000000-0000-0000-0000-000000000002',
          'Ruta 2: Huapango, Cra 4ta & Alameda Reyes',
          'Quibdó',
          'Comuna 2',
          'Martes, Jueves, Sábado',
          '06:00 - 11:30',
          ST_GeomFromText('LINESTRING(-76.657508 5.694488, -76.657596 5.694544, -76.657346 5.695631, -76.657189 5.696389, -76.657140 5.696620, -76.656495 5.696547, -76.656386 5.696535, -76.656396 5.696895, -76.656375 5.697106, -76.656312 5.697491, -76.655761 5.697453, -76.655490 5.697512, -76.655077 5.697548, -76.654889 5.697720, -76.654700 5.697840, -76.654700 5.697840, -76.654486 5.697937, -76.654700 5.697840, -76.654889 5.697720, -76.655077 5.697548, -76.654717 5.697528, -76.654428 5.697534, -76.653972 5.697598, -76.653876 5.697592, -76.653548 5.697523, -76.653336 5.697516, -76.653231 5.697502, -76.653119 5.697464, -76.652888 5.697352, -76.652813 5.697349, -76.652549 5.697399, -76.652555 5.697813, -76.652536 5.697867, -76.652501 5.697919, -76.652438 5.697990, -76.652387 5.698062, -76.652360 5.698115, -76.652676 5.698377, -76.652726 5.698458, -76.652733 5.698509)', 4326)
        ),
        (
          'b2000000-0000-0000-0000-000000000003',
          'Ruta 3: Kennedy & Niño Jesús',
          'Quibdó',
          'Comuna 4',
          'Lunes a Sábado',
          '14:00 - 18:00',
          ST_GeomFromText('LINESTRING(-76.655829 5.686991, -76.655828 5.687015, -76.655809 5.687135, -76.655721 5.687426, -76.655544 5.687489, -76.655467 5.687500, -76.655377 5.687498, -76.655303 5.687486, -76.655067 5.687401, -76.654997 5.687388, -76.654978 5.687394, -76.654958 5.687408, -76.654916 5.687455, -76.654852 5.687523, -76.654803 5.687562, -76.654671 5.687652, -76.654601 5.687717, -76.654495 5.687821, -76.654170 5.687696, -76.654068 5.687690, -76.653947 5.687754, -76.653729 5.688004, -76.653771 5.688048, -76.653909 5.688299, -76.654044 5.688465, -76.654104 5.688539, -76.654236 5.688682, -76.654346 5.688875, -76.654388 5.689033, -76.654489 5.689453, -76.654527 5.689541, -76.654623 5.689735, -76.654588 5.689805, -76.654432 5.689986, -76.654160 5.690085, -76.653899 5.690103, -76.653372 5.690067, -76.653285 5.690059, -76.653213 5.690085, -76.653074 5.690207, -76.652962 5.690319, -76.652875 5.690330, -76.652648 5.690295, -76.652562 5.690303, -76.652464 5.690350, -76.652382 5.690296, -76.652291 5.690269, -76.652122 5.690288, -76.651963 5.690371, -76.651777 5.690636, -76.651684 5.690913, -76.651566 5.691312, -76.651455 5.691523, -76.651311 5.691671, -76.650934 5.691993, -76.650761 5.692076, -76.650456 5.692149, -76.650326 5.692199, -76.650098 5.692321, -76.650126 5.692477, -76.649920 5.692527, -76.649738 5.692592, -76.649637 5.692774, -76.649525 5.692917, -76.649493 5.692989, -76.649447 5.693062, -76.649155 5.692971, -76.648892 5.692888, -76.648667 5.692694, -76.648082 5.692886, -76.647865 5.692732, -76.647191 5.692380, -76.647190 5.692228, -76.647380 5.692078, -76.647663 5.691984, -76.647830 5.691950, -76.648085 5.691938, -76.648351 5.692015, -76.648454 5.692033, -76.648562 5.692020, -76.649171 5.691815, -76.649264 5.692082)', 4326)
        )
      RETURNING *;
    `;
    const rutasRes = await query(rutasSql);
    console.log(`🗺️ ${rutasRes.rowCount} Micro-rutas de Quibdó con trazado PostGIS registradas.`);

    // 5. Insertar Puntos de Acopio Obligatorios en las esquinas reales
    const acopioSql = `
      INSERT INTO puntos_acopio (ruta_id, nombre, direccion, punto, tiempo_parada_min, orden)
      VALUES 
        (
          'b2000000-0000-0000-0000-000000000001',
          'Punto Acopio 1: Calle 31 con Cra 1 (Inicio Malecón)',
          'Esquina Calle 31 con Carrera 1ra',
          ST_SetSRID(ST_MakePoint(-76.662147, 5.688975), 4326),
          4,
          1
        ),
        (
          'b2000000-0000-0000-0000-000000000001',
          'Punto Acopio 2: Malecón del Atrato con Calle 27',
          'Carrera 1ra con Calle 27',
          ST_SetSRID(ST_MakePoint(-76.661673, 5.690808), 4326),
          3,
          2
        ),
        (
          'b2000000-0000-0000-0000-000000000001',
          'Punto Acopio 3: Calle 24 frente a Catedral (Entre 1ra y 2da)',
          'Calle 24 # 1-35 (Atrio Catedral San Francisco)',
          ST_SetSRID(ST_MakePoint(-76.660302, 5.693295), 4326),
          5,
          3
        ),
        (
          'b2000000-0000-0000-0000-000000000001',
          'Punto Acopio 4: Calle 24 con Carrera 4ta (Mercado Central)',
          'Calle 24 con Carrera 4ta',
          ST_SetSRID(ST_MakePoint(-76.657770, 5.693702), 4326),
          3,
          4
        )
      RETURNING *;
    `;
    const acopioRes = await query(acopioSql);
    console.log(`🛑 ${acopioRes.rowCount} Puntos de acopio de parada obligatoria configurados.`);

    // 6. Inmuebles Ciudadanos Privados (Ubicados en las aceras exactas por donde pasa el camión)
    const inmueblesSql = `
      INSERT INTO inmuebles_ciudadanos (id, usuario_id, etiqueta, direccion, ubicacion, ruta_id, minutos_preaviso)
      VALUES 
        (
          'c3000000-0000-0000-0000-000000000001',
          'd1000000-0000-0000-0000-000000000001',
          '🏠 Casa Familiar (Centro Calle 24)',
          'Calle 24 # 1-42 (Frente al Parque y Catedral)',
          ST_SetSRID(ST_MakePoint(-76.660320, 5.693250), 4326),
          'b2000000-0000-0000-0000-000000000001',
          10
        ),
        (
          'c3000000-0000-0000-0000-000000000002',
          'd1000000-0000-0000-0000-000000000001',
          '🏢 Local Comercial (Alameda Reyes)',
          'Carrera 4ta # 28-15 (Alameda Reyes)',
          ST_SetSRID(ST_MakePoint(-76.654889, 5.697720), 4326),
          'b2000000-0000-0000-0000-000000000002',
          15
        ),
        (
          'c3000000-0000-0000-0000-000000000003',
          'd1000000-0000-0000-0000-000000000001',
          '🏡 Casa Materna (Barrio Kennedy)',
          'Calle Principal Kennedy # 14-08',
          ST_SetSRID(ST_MakePoint(-76.653771, 5.688048), 4326),
          'b2000000-0000-0000-0000-000000000003',
          5
        )
      RETURNING *;
    `;
    const inmueblesRes = await query(inmueblesSql);
    console.log(`🏠 ${inmueblesRes.rowCount} Inmuebles privados del ciudadano registrados en Quibdó.`);

    // 7. Novedades de Vía de Prueba (Cabina Conductor)
    const novedadesSql = `
      INSERT INTO novedades_via (vehiculo_id, tipo_novedad, descripcion, punto)
      VALUES 
        (
          'a1000000-0000-0000-0000-000000000001',
          'calle_inundada',
          'Calle anegada por torrencial aguacero frente a desembocadura Quebrada La Yesca.',
          ST_SetSRID(ST_MakePoint(-76.6595, 5.6938), 4326)
        ),
        (
          'a1000000-0000-0000-0000-000000000002',
          'obra_civil',
          'Reparación de alcantarillado en Carrera 5ta, paso restringido a 1 carril.',
          ST_SetSRID(ST_MakePoint(-76.6540, 5.6968), 4326)
        )
      RETURNING *;
    `;
    const novedadesRes = await query(novedadesSql);
    console.log(`⚠️ ${novedadesRes.rowCount} Novedades viales registradas.`);

    // 8. Alertas Preventivas de Cuencas (La Yesca & Caraño)
    const cuencasSql = `
      INSERT INTO alertas_cuencas (quebrada, nivel_riesgo, descripcion, punto)
      VALUES 
        (
          'la_yesca',
          'alerta_critica',
          'Represamiento de residuos sólidos, botellas plásticas y ramas bajo puente de madera de Huapango.',
          ST_SetSRID(ST_MakePoint(-76.6585, 5.6932), 4326)
        ),
        (
          'carano',
          'precaucion',
          'Presencia de escombros de construcción en ribera de la quebrada.',
          ST_SetSRID(ST_MakePoint(-76.6490, 5.6985), 4326)
        )
      RETURNING *;
    `;
    const cuencasRes = await query(cuencasSql);
    console.log(`🌊 ${cuencasRes.rowCount} Alertas de cuencas (La Yesca y Caraño) activas.`);

    // 9. PQRS Cívico Inicial
    const pqrsSql = `
      INSERT INTO reportes_pqrs (usuario_id, tipo_incidencia, descripcion, punto, estado, cuadrilla_asignada)
      VALUES
        (
          'd1000000-0000-0000-0000-000000000001',
          'punto_critico',
          'Acumulación no autorizada de basuras y bolsas rotas por perros en la esquina del Malecón.',
          ST_SetSRID(ST_MakePoint(-76.6612, 5.6920), 4326),
          'cuadrilla_asignada',
          'Cuadrilla Rápida #2 - Aguas del Atrato'
        ),
        (
          'd1000000-0000-0000-0000-000000000001',
          'camion_no_paso',
          'El camión no ingresó al callejón de Alameda Reyes en el horario pactado de la mañana.',
          ST_SetSRID(ST_MakePoint(-76.6535, 5.6975), 4326),
          'recibida',
          NULL
        )
      RETURNING *;
    `;
    const pqrsRes = await query(pqrsSql);
    console.log(`📋 ${pqrsRes.rowCount} Reportes PQRS cívicos de Quibdó sembrados.`);

    // 10. Material Aprovechable (Reciclaje Comunitario)
    const reciclajeSql = `
      INSERT INTO material_aprovechable (usuario_id, tipo_material, cantidad_aprox, contacto, direccion, punto)
      VALUES 
        (
          'd1000000-0000-0000-0000-000000000001',
          'carton_papel',
          '4 cajas grandes de archivo y cartón corrugado',
          'Katerine - Cel 3125551234',
          'Cra 4 # 26-14, Huapango',
          ST_SetSRID(ST_MakePoint(-76.6565, 5.6955), 4326)
        )
      RETURNING *;
    `;
    await query(reciclajeSql);
    console.log(`♻️ Registro de reciclaje comunitario creado.`);

    // 11. Turnos de Recolección y Cuadrillas Planificadas (EPQ)
    const turnosSql = `
      INSERT INTO turnos_recoleccion (
        id, 
        ruta_id, 
        vehiculo_id, 
        conductor_nombre, 
        conductor_id, 
        ayudante_1, 
        ayudante_2, 
        barrendero, 
        fecha_programada, 
        hora_inicio, 
        estado, 
        observaciones
      )
      VALUES 
        (
          'e4000000-0000-0000-0000-000000000001',
          'b2000000-0000-0000-0000-000000000001',
          'a1000000-0000-0000-0000-000000000001',
          'Yesid Palacios Mosquera',
          'd1000000-0000-0000-0000-000000000002',
          'Carlos Perea (Recolector)',
          'Marlon Córdoba (Recolector)',
          'Leider Mena (Barrido)',
          CURRENT_DATE,
          NOW(),
          'activo',
          'Jornada oficial diurna en Comuna 1 Centro & Malecón'
        ),
        (
          'e4000000-0000-0000-0000-000000000002',
          'b2000000-0000-0000-0000-000000000002',
          'a1000000-0000-0000-0000-000000000002',
          'Yesid Palacios Mosquera',
          'd1000000-0000-0000-0000-000000000002',
          'Carlos Perea (Recolector)',
          'Marlon Córdoba (Recolector)',
          'Jhon Fredy Rivas (Barrido)',
          CURRENT_DATE + INTERVAL '1 day',
          NOW() + INTERVAL '1 day',
          'programado',
          'Programación preventiva Comuna 2 Huapango y Alameda'
        ),
        (
          'e4000000-0000-0000-0000-000000000003',
          'b2000000-0000-0000-0000-000000000003',
          'a1000000-0000-0000-0000-000000000003',
          'Harlen Cuesta Rivas',
          'd1000000-0000-0000-0000-000000000002',
          'Everth Mosquera',
          'Duberney Palacios',
          'Américo Caicedo',
          CURRENT_DATE + INTERVAL '2 days',
          NOW() + INTERVAL '2 days',
          'programado',
          'Turno sector Kennedy y Niño Jesús'
        )
      RETURNING *;
    `;
    const turnosRes = await query(turnosSql);
    console.log(`🚚 ${turnosRes.rowCount} Turnos y cuadrillas operativas sembradas.`);

    console.log('✨ Semilla geoespacial de Quibdó (Chocó) completada con éxito.');
  } catch (err: any) {
    console.error('❌ Error durante la siembra de datos:', err);
  } finally {
    await pool.end();
  }
}

seed();
