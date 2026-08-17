# =============================================================================
# Dockerfile for Game Event Handler (Serverless Function)
# =============================================================================
FROM node:22-alpine

WORKDIR /app

# Copy dependency manifests
COPY package.json package-lock.json* ./

# Install production dependencies only
RUN npm ci --omit=dev 2>/dev/null || npm install --omit=dev

# Copy function source
COPY handler.js .

# Non-root user for OpenShift
RUN chown -R 1001:0 /app && chmod -R g=u /app
USER 1001

EXPOSE 8080

CMD ["node", "handler.js"]
