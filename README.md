# ECO-RUTA: Plataforma de Telemetría y Gestión de Residuos Sólidos en Tiempo Real

Ecosistema digital especializado para **Empresas Públicas de Quibdó (EPQ)**, **Aguas del Atrato** y **Alcaldías Municipales**, diseñado bajo principios de Clean Architecture, PostGIS espacial de alto rendimiento, WebSockets para telemetría continua y PWA multi-rol con resiliencia offline.

---

## 🚀 Arquitectura del Sistema

```
eco-ruta/
├── docker-compose.yml              # Orquestación integral: PostGIS 16 + Server API + Web Nginx
├── .env.example                    # Plantilla de variables para Docker Cloud / Clúster
├── maestro-eco-ruta.ini            # Especificación técnica original
├── package.json                    # Workspace Monorepo
├── packages/
│   └── shared/                     # Contratos Zod, Enums y Eventos WebSocket
└── apps/
    ├── server/                     # Backend Fastify + TypeScript + PostGIS
    │   ├── Dockerfile              # Multi-stage build para producción
    │   ├── src/
    │   │   ├── infrastructure/     # Repositorios espaciales PostGIS, Socket.io, Migraciones
    │   │   └── presentation/       # Rutas REST Fastify y WebSocket Handlers
    └── web/                        # Frontend PWA Unificado (Vite + React + Leaflet)
        ├── Dockerfile              # Multi-stage build Nginx Alpine
        ├── nginx.conf              # Reverse proxy para API & WebSockets con SPA routing
        └── src/
            ├── modules/
            │   ├── conductor/      # PWA Cabina Móvil (Previsualización de ruta, Modo Retorno Cabí)
            │   ├── ciudadano/      # Portal Vecino (Mapa Leaflet en vivo, Alertas con sonido y vibración)
            │   └── admin/          # Torre de Control EPQ (Flota, Despacho, Playback, Incidencias)
            └── shared/             # Mapa interactivo Leaflet, Hooks y Servicios
```

---

## 🛠️ Requisitos Previos

- **Node.js**: v20+
- **Docker & Docker Compose**: Para despliegue local o en clúster (Docker Cloud / Swarm / Kubernetes)
- **Navegador Moderno**: Con soporte para Geolocation, Web Audio y Wake Lock API

---

## 🐳 Despliegue en Docker Cloud / Clúster con Docker Compose

La plataforma cuenta con soporte nativo para **Docker Cloud**, **Docker Compose** y clústeres de contenedores mediante parametrización por variables de entorno:

### 1. Configurar Variables de Entorno
Copia la plantilla `.env.example` o configura las variables en el panel de tu orquestador / Docker Cloud:

```bash
cp .env.example .env
```

| Variable | Descripción | Valor por Defecto |
|---|---|---|
| `NODE_ENV` | Modo de ejecución de Node.js | `production` |
| `POSTGRES_DB` | Nombre de base de datos PostGIS | `eco_ruta_db` |
| `POSTGRES_USER` | Usuario administrador de PostgreSQL | `eco_admin` |
| `POSTGRES_PASSWORD` | Contraseña de PostgreSQL | `eco_secure_password_2026` |
| `POSTGRES_PORT` | Puerto público mapeado a PostGIS | `5435` |
| `SERVER_PORT` | Puerto de escucha del backend | `3005` |
| `SERVER_HOST` | Host de enlace del servidor | `0.0.0.0` |
| `DATABASE_URL` | Cadena de conexión PostGIS | `postgresql://eco_admin:eco_secure_password_2026@postgres:5432/eco_ruta_db` |
| `CORS_ORIGIN` | Dominios permitidos para CORS | `*` |
| `WEB_PORT` | Puerto expuesto del frontend (Nginx) | `80` |
| `BACKEND_HOST` | Host del servicio backend en la red Docker | `server` |

### 2. Desplegar los Servicios
```bash
docker compose up -d --build
```

Esto levantará automáticamente en la red `eco_net`:
1. `eco_ruta_postgis`: Base de datos PostgreSQL 16 con extensión PostGIS 3.4 inicializada con DDL espacial.
2. `eco_ruta_server`: Backend Node 20 en Fastify con Socket.io, endpoints REST y runner de telemetría.
3. `eco_ruta_web`: Servidor Nginx Alpine sirviendo la SPA compilada con reverse-proxy integrado hacia `/api` y `/socket.io`.

---

## ⚡ Puesta en Marcha en Desarrollo Local

### 1. Iniciar Base de Datos PostGIS
```bash
docker compose up -d postgres
```

### 2. Ejecutar Migraciones y Datos de Siembra
```bash
# Migraciones DDL espaciales
npm run db:migrate --workspace=@eco-ruta/server

# Siembra con rutas reales de Quibdó (Comunas 1 a 6)
npm run db:seed --workspace=@eco-ruta/server
```

### 3. Iniciar Backend y Frontend en Desarrollo
```bash
# Terminal 1: Backend API (Puerto 3005)
npm run dev:server

# Terminal 2: Frontend Web (Puerto 3010)
npm run dev:web
```

- **Frontend:** http://localhost:3010
- **Backend API:** http://localhost:3005
- **WebSocket Gateway:** ws://localhost:3005

---

## 📋 Módulos Principales

### 1. Conductor (Cabina Móvil)
- **Previsualización de Ruta**: Al seleccionar la micro-ruta asignada, el mapa encuadra el recorrido con marcadores `INICIO` y `FIN RUTA`.
- **Modo Retorno a Patio Cabí**: Al concluir la recolección, el conductor pulsa `Finalizar Recolección & Retorno a Patio`. El vehículo pasa a **Seguimiento Silencioso** hacia el Relleno Sanitario Cabí (no se emiten alertas ciudadanas).
- **Wake Lock API & Cola Offline**: Mantiene la pantalla encendida y almacena puntos en caso de pérdida de cobertura 4G.

### 2. Ciudadano (Cliente / Vecino)
- **Experiencia InDrive**: Tarjeta flotante colapsable con ETA en vivo y estado del compactador.
- **Alertas Sonoras y Táctiles**: Chime polifónico Web Audio y vibración en dispositivos móviles ante aproximación a la cuadra.
- **Aislamiento en Retorno**: Cuando el camión concluye la ruta y regresa al relleno, desaparece limpiamente del mapa y se suprimen las notificaciones.
- **PQRS Cívico**: Registro georreferenciado de puntos críticos con fotografía en directo.

### 3. Torre de Control EPQ / Alcaldía de Quibdó
- **Despacho y Flota en Vivo**: Monitoreo de compactadores en recolección y en viaje de retorno a base.
- **Control de Velocidad y Cumplimiento**: Auditoría de corredores viales y tiempos de servicio.
- **Métricas SSPD & PGIRS**: Indicadores de cobertura para entes de control.
