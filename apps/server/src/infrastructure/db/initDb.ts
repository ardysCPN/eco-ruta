import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { query } from './connection.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function ensureDatabaseReady() {
  console.log('🔍 Verificando conectividad con base de datos PostGIS...');
  
  // Reintentar conexión hasta 15 veces (30 segundos max)
  let connected = false;
  for (let i = 1; i <= 15; i++) {
    try {
      await query('SELECT 1');
      connected = true;
      console.log('✅ Conexión con PostgreSQL / PostGIS establecida.');
      break;
    } catch (err: any) {
      console.warn(`⏳ Esperando disponibilidad de PostgreSQL (Intento ${i}/15)...`);
      await new Promise((res) => setTimeout(res, 2000));
    }
  }

  if (!connected) {
    throw new Error('❌ No fue posible conectar con PostgreSQL después de 30 segundos.');
  }

  // 1. Verificar si las tablas existen
  try {
    const tableCheck = await query(`
      SELECT to_regclass('public.rutas') as exists_rutas,
             to_regclass('public.territorio_quibdo') as exists_territorio;
    `);

    const hasTables = tableCheck.rows[0]?.exists_rutas !== null && tableCheck.rows[0]?.exists_territorio !== null;

    if (!hasTables) {
      console.log('📦 Tablas no encontradas. Ejecutando estructura DDL inicial (schema.sql)...');
      const possiblePaths = [
        path.join(__dirname, 'schema.sql'),
        path.join(__dirname, '../../../../src/infrastructure/db/schema.sql'),
        path.join(__dirname, '../../../apps/server/src/infrastructure/db/schema.sql'),
        path.join(__dirname, '../../../../infra/init-db/02-schema.sql')
      ];

      let schemaSql = '';
      for (const p of possiblePaths) {
        if (fs.existsSync(p)) {
          schemaSql = fs.readFileSync(p, 'utf-8');
          break;
        }
      }

      if (schemaSql) {
        await query(schemaSql);
        console.log('✅ Esquema espacial PostGIS y tablas creadas exitosamente.');
      } else {
        console.warn('⚠️ No se encontró schema.sql físico, se asume inicialización por docker-entrypoint.');
      }
    } else {
      console.log('✅ Esquema y tablas de PostGIS ya inicializados.');
    }

    // 2. Verificar y sembrar división territorial completa de Quibdó (6 Comunas + Corregimientos)
    const terrCheck = await query(`SELECT count(*) as total FROM territorio_quibdo`);
    const totalTerritorio = Number(terrCheck.rows[0]?.total || 0);

    if (totalTerritorio === 0) {
      console.log('🌱 Sembrando división territorial completa de Quibdó (6 Comunas + Corregimientos)...');
      const seedPaths = [
        path.join(__dirname, '03-seed-quibdo.sql'),
        path.join(__dirname, '../../../../infra/init-db/03-seed-quibdo.sql'),
        path.join(__dirname, '../../../infra/init-db/03-seed-quibdo.sql'),
        path.join(__dirname, '../../../../apps/server/src/infrastructure/db/03-seed-quibdo.sql')
      ];

      let seedSql = '';
      for (const sp of seedPaths) {
        if (fs.existsSync(sp)) {
          seedSql = fs.readFileSync(sp, 'utf-8');
          break;
        }
      }

      if (seedSql) {
        await query(seedSql);
        console.log('✅ Territorio de Quibdó, flota de compactadores y usuarios base sembrados.');
        console.log('🚚 Rutas oficiales permanecen en 0 para registro manual dinámico.');
      } else {
        console.warn('⚠️ No se encontró 03-seed-quibdo.sql.');
      }
    } else {
      console.log(`✅ Territorio de Quibdó activo (${totalTerritorio} barrios y sectores).`);
    }
  } catch (err: any) {
    console.warn('⚠️ Nota sobre verificación de esquema y siembra:', err.message);
  }
}
