# =============================================================================
# Stage 1: Build the Vite React application
# =============================================================================
FROM node:20-alpine AS builder

WORKDIR /app

# Copy dependency manifests first for better layer caching
COPY package.json package-lock.json ./

# Install dependencies (ci = clean install, deterministic)
RUN npm ci --ignore-scripts

# Copy source code and build assets
COPY . .

# Build the production bundle
RUN npm run build

# =============================================================================
# Stage 2: Serve with Nginx (production runtime)
# =============================================================================
FROM nginx:1.27-alpine AS runtime

# Labels for OpenShift and container metadata
LABEL maintainer="gambleshi-team" \
      app.kubernetes.io/name="gambleshi" \
      app.kubernetes.io/component="frontend" \
      app.kubernetes.io/part-of="gambleshi" \
      io.openshift.tags="nginx,react,vite" \
      io.openshift.expose-services="8080:http"

# Remove default nginx config and static files
RUN rm -rf /etc/nginx/conf.d/default.conf /usr/share/nginx/html/*

# Copy custom nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Copy built assets from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# OpenShift runs containers as an arbitrary UID in the root group (GID 0).
# We must make directories writable by group 0.
RUN chown -R 1001:0 /usr/share/nginx/html && \
    chmod -R g=u /usr/share/nginx/html && \
    # Nginx needs to write pid, cache, logs — make them group-writable
    mkdir -p /var/cache/nginx /var/run /var/log/nginx && \
    chown -R 1001:0 /var/cache/nginx /var/run /var/log/nginx && \
    chmod -R g=u /var/cache/nginx /var/run /var/log/nginx && \
    # Also fix the nginx config directory permissions
    chown -R 1001:0 /etc/nginx && \
    chmod -R g=u /etc/nginx

# Expose non-privileged port (OpenShift requirement: no ports < 1024)
EXPOSE 8080

# Run as non-root user
USER 1001

# Healthcheck for container runtime
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD wget -qO- http://localhost:8080/healthz || exit 1

# Start nginx in foreground
CMD ["nginx", "-g", "daemon off;"]
