# Étape 1 : compilation TypeScript avec toutes les dépendances
FROM node:24-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/
RUN npm ci --workspace=@byte/api
COPY tsconfig.base.json ./
COPY apps/api apps/api
RUN npm run build --workspace=@byte/api

# Étape 2 : image d'exécution légère (dépendances de production + JS compilé + migrations)
FROM node:24-alpine
ENV NODE_ENV=production
WORKDIR /app
COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/
RUN npm ci --omit=dev --workspace=@byte/api && npm cache clean --force
COPY --from=build /app/apps/api/dist apps/api/dist
COPY apps/api/migrations apps/api/migrations
WORKDIR /app/apps/api
USER node
EXPOSE 4000
CMD ["sh", "-c", "node dist/db/migrate-cli.js && node dist/server.js"]
