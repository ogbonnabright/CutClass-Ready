# Production Dockerfile for CutClass on Google Cloud Run
FROM node:22-alpine AS builder

WORKDIR /app

# Install all dependencies required for building client and server bundles
COPY package*.json ./
RUN npm ci || npm install

# Copy application sources
COPY . .

# Run production build (vite build for client -> dist/, esbuild for server -> dist-server/)
RUN npm run build

# Production runtime container
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Install production runtime dependencies
COPY package*.json ./
RUN npm ci --omit=dev || npm install --omit=dev

# Copy compiled frontend and backend bundles from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/dist-server ./dist-server

# Cloud Run binds to 0.0.0.0:$PORT
EXPOSE 3000

CMD ["node", "dist-server/server.js"]
