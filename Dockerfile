# Multi-stage build for CertIntel AI Certificate Validator
# Stage 1: Build stage
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json ./
COPY tsconfig.json ./

# Install dependencies
RUN npm ci --only=production --silent && \
    npm cache clean --force

# Copy development dependencies for building
COPY package.json ./
RUN npm install --silent

# Copy source code
COPY src/ ./src/
COPY data/ ./data/
COPY public/ ./public/
COPY db/ ./db/

# Build the TypeScript application
RUN npm run build

# Stage 2: Production stage
FROM node:18-alpine AS production

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S certintel -u 1001

# Set working directory
WORKDIR /app

# Copy package.json for production dependencies
COPY package.json ./

# Install only production dependencies
RUN npm ci --only=production --silent && \
    npm cache clean --force && \
    rm -rf ~/.npm

# Copy built application from builder stage
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/public ./public
COPY --from=builder /app/data ./data
COPY --from=builder /app/db ./db

# Change ownership to non-root user
RUN chown -R certintel:nodejs /app
USER certintel

# Expose the application port
EXPOSE 8800

# Add health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:8800/health || exit 1

# Set environment variables
ENV NODE_ENV=production
ENV PORT=8800

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start the application
CMD ["node", "dist/server.js"]