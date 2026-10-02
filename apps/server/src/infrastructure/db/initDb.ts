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

  // Verificar si las tablas existen
  try {
    const tableCheck = await query(`
      SELECT to_regclass('public.rutas') as exists_rutas;
    `);

    const hasTables = tableCheck.rows[0]?.exists_rutas !== null;

    if (!hasTables) {
      console.log('📦 Tablas no encontradas. Ejecutando migraciones iniciales (schema.sql)...');
      // Buscar schema.sql en varias rutas relativas posibles
      const possiblePaths = [
        path.join(__dirname, 'schema.sql'),
        path.join(__dirname, '../../../../src/infrastructure/db/schema.sql'),
        path.join(__dirname, '../../../apps/server/src/infrastructure/db/schema.sql')
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
  } catch (err: any) {
    console.warn('⚠️ Nota sobre verificación de esquema:', err.message);
  }
}
