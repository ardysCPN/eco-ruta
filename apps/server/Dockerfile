# ==============================================================================
# ECO-RUTA Quibdó - Dockerfile para Backend (Fastify + Socket.io + PostGIS)
# ==============================================================================

# Etapa 1: Build de dependencias y TypeScript
FROM node:20-alpine AS builder
WORKDIR /app

# Instalar dependencias globales necesarias
RUN apk add --no-cache python3 make g++

# Copiar manifiestos de paquetes monorepo
COPY package.json package-lock.json ./
COPY packages/shared/package.json ./packages/shared/
COPY apps/server/package.json ./apps/server/

# Instalar todas las dependencias para compilar
RUN npm ci

# Copiar código fuente
COPY tsconfig.json ./
COPY packages/shared ./packages/shared
COPY apps/server ./apps/server

# Compilar librerías compartidas y servidor
RUN npm run build --workspace=@eco-ruta/shared
RUN npm run build --workspace=@eco-ruta/server

# Podar dependencias de desarrollo para aligerar la imagen
RUN npm prune --omit=dev

# Etapa 2: Imagen Final Ligera para Producción
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3005
ENV HOST=0.0.0.0

# Crear usuario sin privilegios root
RUN addgroup -S ecoruta && adduser -S ecoruta -G ecoruta

# Copiar archivos compilados y node_modules optimizados
COPY --from=builder /app/package.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages/shared/dist ./packages/shared/dist
COPY --from=builder /app/packages/shared/package.json ./packages/shared/package.json
COPY --from=builder /app/apps/server/dist ./apps/server/dist
COPY --from=builder /app/apps/server/package.json ./apps/server/package.json
COPY --from=builder /app/apps/server/src/infrastructure/db/schema.sql ./apps/server/dist/infrastructure/db/schema.sql

# Asignar permisos
RUN chown -R ecoruta:ecoruta /app
USER ecoruta

EXPOSE 3005

HEALTHCHECK --interval=15s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://127.0.0.1:3005/api/health || exit 1

CMD ["node", "apps/server/dist/index.js"]
