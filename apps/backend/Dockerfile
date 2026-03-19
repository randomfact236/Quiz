FROM node:20-alpine AS builder
RUN apk add --no-cache python3 make g++ libc6-compat
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY src ./src
COPY tsconfig*.json ./
COPY scripts ./scripts/
RUN npm run build

FROM node:20-alpine AS production
RUN apk add --no-cache ca-certificates curl
RUN addgroup -g 1001 -S nodejs && adduser -S nestjs -u 1001
WORKDIR /app
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/src ./src
USER nestjs
EXPOSE 3012
CMD ["node", "dist/main.js"]
