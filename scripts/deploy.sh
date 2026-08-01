#!/bin/bash
set -euo pipefail

# ═══════════════════════════════════════════════════════════════
# KimiBlog 自动化部署脚本
# 由 GitHub Actions 通过 SSH 调用
# ═══════════════════════════════════════════════════════════════

DEPLOY_DIR="${DEPLOY_DIR:-/root/kimi-blog}"
HEALTH_URL="${HEALTH_URL:-http://localhost:3030/api/ping}"
TIMEOUT="${TIMEOUT:-120}"

echo "========================================"
echo "  KimiBlog Deployment Script"
echo "========================================"
echo ""

# ── 1. 进入部署目录 ──
echo "[1/5] Entering deploy directory: $DEPLOY_DIR"
cd "$DEPLOY_DIR" || {
  echo "❌ Deploy directory not found: $DEPLOY_DIR"
  exit 1
}

# ── 2. 拉取最新代码 ──
echo "[2/5] Pulling latest code..."
git fetch origin main --prune
git reset --hard origin/main
echo "✅ Code updated"
echo ""

# ── 3. 读取环境变量 ──
echo "[3/5] Loading environment variables..."
if [ -f .env ]; then
  set -a
  . ./.env
  set +a
  echo "✅ .env loaded"
else
  echo "⚠️  .env not found, using docker-compose defaults"
fi
echo ""

# ── 4. 构建并重启服务 ──
echo "[4/5] Building and restarting containers..."
docker compose -f docker-compose.yml down
docker compose -f docker-compose.yml up --build -d --remove-orphans
echo "✅ Containers started"
echo ""

# ── 5. 健康检查 ──
echo "[5/5] Health check..."
echo "      Waiting for service to be ready (max ${TIMEOUT}s)..."

for ((i=1; i<=TIMEOUT; i++)); do
  if curl -sf --max-time 5 "$HEALTH_URL" > /dev/null 2>&1; then
    echo "✅ Health check passed: $HEALTH_URL"
    echo ""
    echo "========================================"
    echo "  🎉 Deployment successful!"
    echo "========================================"
    exit 0
  fi
  sleep 1
done

echo ""
echo "❌ Health check failed after ${TIMEOUT}s"
echo "      URL: $HEALTH_URL"
echo ""
echo "Recent logs:"
docker compose -f docker-compose.yml logs --tail=20 app
echo ""
exit 1
