import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { pool, query } from './connection.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runMigrations() {
  console.log('🔄 Ejecutando migraciones de PostGIS...');
  try {
    const schemaPath = path.join(__dirname, 'schema.sql');
    const sql = fs.readFileSync(schemaPath, 'utf-8');
    await query(sql);
    console.log('✅ Migraciones de PostGIS ejecutadas con éxito.');
  } catch (err: any) {
    console.error('❌ Error al ejecutar migraciones:', err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runMigrations();
