# ═══════════════════════════════════════════════════════════════
# KimiBlog — Multi-stage Dockerfile
# Stage 1: Node.js build frontend
# Stage 2: Python runtime with FastAPI
# ═══════════════════════════════════════════════════════════════

# ── Stage 1: Build Frontend ──
FROM docker.m.daocloud.io/library/node:20-alpine AS frontend-build
WORKDIR /build

COPY app/package.json app/package-lock.json ./
RUN npm config set registry https://registry.npmmirror.com \
    && npm ci --prefer-offline --no-audit

COPY app/ ./
ARG VITE_KIMI_AUTH_URL
ARG VITE_APP_ID
ENV VITE_KIMI_AUTH_URL=${VITE_KIMI_AUTH_URL}
ENV VITE_APP_ID=${VITE_APP_ID}
RUN npm run build

# ── Stage 2: Python Runtime ──
FROM docker.m.daocloud.io/library/python:3.12-slim AS production
WORKDIR /app

# Install build tools (for bcrypt wheel compilation fallback)
RUN apt-get update \
    && apt-get install -y --no-install-recommends gcc \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY backend/requirements.txt ./
RUN pip config set global.index-url https://pypi.tuna.tsinghua.edu.cn/simple \
    && pip install --no-cache-dir -r requirements.txt

# Copy backend source
COPY backend/ ./backend/

# Copy built frontend static files
COPY --from=frontend-build /build/dist/public ./app/dist/public

# Copy frontend uploads directory (for image uploads persistence mount point)
RUN mkdir -p /app/app/public/uploads

# Working directory for uvicorn imports
WORKDIR /app/backend

ENV PYTHONPATH=/app/backend
ENV PORT=3000

EXPOSE 5000

CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT}"]
