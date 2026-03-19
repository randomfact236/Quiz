FROM node:20-alpine AS builder
RUN apk add --no-cache python3 make g++ libc6-compat
WORKDIR /app
COPY package.json package-lock.json* ./
COPY apps/backend/package*.json ./apps/backend/
RUN npm ci
COPY apps/backend ./apps/backend
RUN cd apps/backend && npm run build

FROM node:20-alpine AS production
RUN apk add --no-cache ca-certificates curl
RUN addgroup -g 1001 -S nodejs && adduser -S nestjs -u 1001
WORKDIR /app
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/backend/dist ./apps/backend/dist
COPY --from=builder /app/apps/backend/package*.json ./apps/backend/
COPY --from=builder /app/apps/backend/src ./apps/backend/src
USER nestjs
EXPOSE 3012
CMD ["node", "apps/backend/dist/main.js"]
