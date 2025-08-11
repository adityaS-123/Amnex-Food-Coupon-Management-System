# --- Step 1: Build stage ---
FROM node:18-alpine AS base

# Set timezone in the container
RUN apk add --no-cache tzdata
ENV TZ=Asia/Kolkata

# Install dependencies only when needed
FROM base AS deps
WORKDIR /app

# Copy package.json and package-lock.json
COPY package.json package-lock.json* ./

# Clean install with fallback
RUN npm ci --verbose || npm install --verbose
RUN npm cache clean --force

# Development dependencies for build
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Create data directory and uploads directory for local file storage
RUN mkdir -p /app/data /app/uploads/menus

# Set build-time environment variables
ENV NODE_ENV=production

# Build the application with error checking
RUN npm run build

# --- Step 2: Production stage ---
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

# Create a non-root user to run the application
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy package.json and install only production dependencies
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev --verbose || npm install --production --verbose
RUN npm cache clean --force

# Create necessary directories with proper permissions
RUN mkdir -p /app/data /app/.next/cache /app/uploads/menus
RUN chown -R nextjs:nodejs /app

# Copy necessary files
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next
COPY --from=builder --chown=nextjs:nodejs /app/data ./data
COPY --from=builder --chown=nextjs:nodejs /app/uploads ./uploads

# Switch to non-root user
USER nextjs

# Expose the listening port
EXPOSE 3000

# Set runtime environment variables
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
ENV UPLOAD_DIR="/app/uploads/menus"

# Start the application
CMD ["npm", "run dev"]
