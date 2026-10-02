import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { pool, query } from './connection.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function seed() {
  console.log('🌱 Iniciando siembra oficial de territorio y flota para Quibdó, Chocó...');
  try {
    // 1. Asegurar esquema DDL
    const schemaSql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf-8');
    await query(schemaSql);
    console.log('📦 Esquema relacional y geoespacial PostGIS verificado.');

    // 2. Ejecutar script de territorio y usuarios base
    const seedSql = fs.readFileSync(path.join(__dirname, '03-seed-quibdo.sql'), 'utf-8');
    await query(seedSql);
    console.log('✅ División territorial (6 Comunas + Corregimientos), flota y usuarios sembrados con éxito.');
    console.log('🚚 Rutas oficiales permanecen en 0 para creación personalizada en vivo.');
  } catch (err: any) {
    console.error('❌ Error durante la siembra de datos:', err);
  } finally {
    await pool.end();
  }
}

seed();
