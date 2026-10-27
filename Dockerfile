FROM node:24.19.0-bookworm-slim AS base
WORKDIR /app
ENV REDOCLY_TELEMETRY=off
ENV REDOCLY_SUPPRESS_UPDATE_NOTICE=true
ENV HUSKY=0
RUN npm install --global npm@12.0.0

FROM base AS build
COPY package.json package-lock.json ./
COPY .husky/install.ts .husky/install.ts
RUN npm ci --no-audit --no-fund
COPY . .
RUN npm run build

FROM base AS runtime
ENV NODE_ENV=production
ENV HOST=0.0.0.0
COPY package.json package-lock.json ./
COPY .husky/install.ts .husky/install.ts
RUN npm ci --omit=dev --no-audit --no-fund && npm cache clean --force
COPY --from=build --chown=node:node /app/dist ./dist
COPY --from=build --chown=node:node /app/docs/api/openapi.yaml ./docs/api/openapi.yaml
USER node
EXPOSE 3000
CMD ["node", "--enable-source-maps", "dist/bin/www.js"]
