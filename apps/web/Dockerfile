# ==============================================================================
# ECO-RUTA Quibdó - Dockerfile para Frontend Web (React + Vite + Nginx)
# ==============================================================================

# Etapa 1: Compilación de la SPA y paquetes del monorepo
FROM node:20-alpine AS builder
WORKDIR /app

# Copiar manifiestos de paquetes
COPY package.json package-lock.json ./
COPY packages/shared/package.json ./packages/shared/
COPY apps/web/package.json ./apps/web/

# Instalar dependencias
RUN npm ci

# Copiar código fuente
COPY tsconfig.json ./
COPY packages/shared ./packages/shared
COPY apps/web ./apps/web

# Compilar librería compartida y la aplicación web
RUN npm run build --workspace=@eco-ruta/shared
RUN npm run build --workspace=@eco-ruta/web

# Etapa 2: Servidor Nginx de Alto Rendimiento
FROM nginx:alpine AS runner

# Copiar configuración de Nginx con soporte para plantillas de variables de entorno
COPY apps/web/nginx.conf /etc/nginx/templates/default.conf.template

# Copiar la compilación de la SPA
COPY --from=builder /app/apps/web/dist /usr/share/nginx/html

# Variables por defecto para Docker Cloud / Docker Compose
ENV BACKEND_HOST=server
ENV BACKEND_PORT=3005

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
