-- Habilitar extensión PostGIS y extensiones de soporte
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";
CREATE EXTENSION IF NOT EXISTS "postgis_topology";

-- Verificar versión de PostGIS
SELECT PostGIS_Version();
