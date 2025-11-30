# Use Node.js 20 Alpine as base image
FROM node:20-alpine AS base

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm cache clean --force && \
    npm install --legacy-peer-deps

# Copy application source code
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build TypeScript to JavaScript
RUN npm run build

# Production stage
FROM node:20-alpine AS production

WORKDIR /app

# Copy package.json only (not package-lock.json to avoid conflicts)
COPY package.json ./

# Install production dependencies
RUN npm cache clean --force && \
    npm install --legacy-peer-deps --omit=dev

# Copy built files from build stage
COPY --from=build /app/dist ./dist
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/node_modules/.prisma ./node_modules/.prisma

# Expose port (Render will override this with its own PORT)
EXPOSE 10000

# Run migrations and start server
CMD npx prisma migrate deploy && node dist/index.js
