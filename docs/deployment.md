# KimiBlog Docker 部署指南

> 本文档描述如何通过 Docker Compose 在 Linux 服务器上部署 KimiBlog 全栈应用。

---

## 架构概览

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Nginx / CDN   │────▶│   kimiblog-app  │────▶│   kimiblog-db   │
│  (可选反向代理)  │     │  FastAPI + SPA  │     │   MySQL 8.0     │
└─────────────────┘     └─────────────────┘     └─────────────────┘
        │                       │
        ▼                       ▼
   80/443 端口             3000 端口
```

| 容器 | 镜像 | 端口 | 说明 |
|------|------|------|------|
| `kimiblog-app` | 本地构建 | `3000` | FastAPI 后端 + React SPA 前端 |
| `kimiblog-db` | `mysql:8.0` | `3307` | 数据持久化存储 |

---

## 前置条件

- Linux 服务器（Ubuntu 22.04+ / Debian 12+ / CentOS 9+ 等）
- Docker Engine >= 24.0
- Docker Compose >= 2.20
- 至少 2GB 内存、10GB 磁盘空间

安装 Docker（如未安装）：

```bash
# Ubuntu / Debian
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
newgrp docker
```

---

## 快速开始

### 1. 克隆代码

```bash
git clone <your-repo-url> KimiBlog
cd KimiBlog
```

### 2. 配置环境变量

在项目根目录创建 `.env` 文件：

```bash
cp backend/.env.example .env
cp app/.env.example .env.frontend
```

编辑 `.env`（根目录）：

```env
# ═══════════════════════════════════════════════════════════════
# 必填项
# ═══════════════════════════════════════════════════════════════

# 应用安全（JWT 签名 + OAuth）
APP_SECRET=your-strong-secret-key-at-least-32-chars

# 数据库（Docker 内使用服务名 db，端口 3306）
DATABASE_URL=mysql://kimiblog:kimiblog_pass@db:3306/kimi_blog

# Kimi OAuth（如使用 Kimi 登录）
APP_ID=your-kimi-app-id
KIMI_AUTH_URL=https://auth.kimi.com
KIMI_OPEN_URL=https://open.kimi.com

# 管理员设置
OWNER_UNION_ID=your-kimi-union-id

# ═══════════════════════════════════════════════════════════════
# 前端构建参数（Docker build 时使用）
# ═══════════════════════════════════════════════════════════════
VITE_KIMI_AUTH_URL=https://auth.kimi.com
VITE_APP_ID=your-kimi-app-id

# ═══════════════════════════════════════════════════════════════
# MySQL Docker 配置（首次启动时生效）
# ═══════════════════════════════════════════════════════════════
MYSQL_ROOT_PASSWORD=kimiblog_root
MYSQL_DATABASE=kimi_blog
MYSQL_USER=kimiblog
MYSQL_PASSWORD=kimiblog_pass

# ═══════════════════════════════════════════════════════════════
# 生产环境 CORS（可选，多域名用逗号分隔）
# ═══════════════════════════════════════════════════════════════
# CORS_ORIGINS=https://your-domain.com,https://www.your-domain.com
```

> **注意**：`APP_SECRET` 必须足够复杂且保密，它是 JWT 会话签名和 OAuth 客户端密钥。

### 3. 启动服务

#### 生产环境（推荐）

```bash
# 构建并启动（首次）
docker compose -f docker-compose.yml up --build -d

# 仅重启（修改 .env 后）
docker compose -f docker-compose.yml restart app

# 查看日志
docker compose -f docker-compose.yml logs -f app
```

> 生产部署使用 `-f docker-compose.yml` 明确指定，避免加载开发用的 `docker-compose.override.yml`。

#### 开发环境

```bash
# 同时启动后端（Docker）和数据库
docker compose up -d

# 前端在宿主机运行（热重载）
cd app && npm run dev
```

开发模式下：
- 后端 API：`http://localhost:8000`（Docker 内，代码挂载 + `--reload`）
- 前端 dev server：`http://localhost:5000`（宿主机上 `npm run dev`）
- 数据库：`localhost:3307`

首次启动时，`app` 容器会等待数据库健康检查通过后再启动。数据库表结构和默认数据会自动创建。

### 4. 验证部署

```bash
# 检查容器状态
docker compose ps

# 测试 API
curl http://localhost:3000/api/ping
# 期望输出: {"ok":true,"ts":...}

# 查看默认管理员账号
docker compose logs app | grep "Created default admin user"
# 默认: admin / admin123
```

浏览器访问 `http://<服务器IP>:3000`。

---

## 常用运维命令

### 查看日志

```bash
# 全部日志
docker compose logs -f

# 仅应用日志（最近 100 行）
docker compose logs --tail=100 -f app

# 仅错误日志
docker compose logs app | grep ERROR
```

### 重启与更新

```bash
# 修改代码后重新构建并重启（生产）
docker compose -f docker-compose.yml up --build -d app

# 修改 .env 后重启即可（无需重建镜像）
docker compose -f docker-compose.yml restart app

# 拉取最新代码后完整重建
git pull
docker compose -f docker-compose.yml down
docker compose -f docker-compose.yml up --build -d

# 仅重启某个服务
docker compose -f docker-compose.yml restart app
```

### 数据库备份与恢复

```bash
# 备份
mkdir -p backups
docker exec kimiblog-db mysqldump -u root -p"${MYSQL_ROOT_PASSWORD}" kimi_blog \
  > backups/kimiblog_$(date +%Y%m%d_%H%M%S).sql

# 恢复
docker exec -i kimiblog-db mysql -u root -p"${MYSQL_ROOT_PASSWORD}" kimi_blog \
  < backups/kimiblog_20260101_000000.sql
```

### 进入容器排查

```bash
# 进入应用容器（生产）
docker exec -it kimiblog-app bash

# 进入应用容器（开发）
docker exec -it kimiblog-app sh

# 进入数据库容器
docker exec -it kimiblog-db mysql -u root -p

# 查看数据库连接
docker exec -it kimiblog-app python -c "
from app.database import async_engine
import asyncio
async def check():
    async with async_engine.connect() as conn:
        result = await conn.execute(text('SELECT 1'))
        print(result.scalar())
asyncio.run(check())
"
```

---

## 生产环境配置

### 1. 使用 Nginx 反向代理（推荐）

在宿主机安装 Nginx，配置 SSL：

```nginx
# /etc/nginx/sites-available/kimiblog
server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    client_max_body_size 20M;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

启用配置后修改 `.env`：

```env
CORS_ORIGINS=https://your-domain.com
```

然后重启应用：

```bash
docker compose restart app
```

### 2. 关闭外部数据库端口（安全）

编辑 `docker-compose.yml`，注释掉 `db` 服务的 `ports`：

```yaml
services:
  db:
    # ports:
    #   - "3307:3306"
```

这样 MySQL 只对内网容器暴露，不映射到宿主机。

### 3. 修改默认管理员密码

首次登录后，立即在后台「用户管理」中修改 `admin` 账号的密码，或删除默认账号。

---

## 数据持久化

Docker Compose 定义了两个命名卷：

| 卷名 | 挂载点 | 说明 |
|------|--------|------|
| `db_data` | `/var/lib/mysql` | MySQL 数据文件 |
| `uploads_data` | `/app/app/public/uploads` | 用户上传的图片 |

**不要直接删除这两个卷**，否则数据会丢失。

如需彻底清理并重新部署：

```bash
# ⚠️ 警告：这会删除所有数据！
docker compose down -v
```

---

## 故障排查

| 现象 | 排查方法 |
|------|----------|
| `app` 容器不断重启 | `docker compose logs app` 查看报错；通常是数据库连接失败，检查 `DATABASE_URL` |
| 数据库连接失败 | 确认 `db` 容器健康状态：`docker compose ps`；检查 `.env` 中的密码是否与 `docker-compose.yml` 一致 |
| 前端页面空白 | 检查 `app/dist/public` 是否存在静态文件；确认构建阶段未报错 |
| 图片上传失败 | 检查 `uploads_data` 卷权限；宿主机目录是否可写 |
| CORS 错误 | 配置 `CORS_ORIGINS` 为实际域名，重启 `app` 容器 |
| 端口被占用 | `lsof -i :3000` 或 `lsof -i :3307` 找到占用进程并停止 |

---

## 目录结构参考

```
KimiBlog/
├── Dockerfile              # 多阶段构建文件
├── docker-compose.yml      # 服务编排
├── .dockerignore           # 构建忽略规则
├── .env                    # 环境变量（生产机密，不提交 Git）
├── app/                    # React 前端
│   ├── src/
│   ├── public/
│   └── dist/public/        # 构建输出（Docker 内生成）
├── backend/                # FastAPI 后端
│   ├── app/
│   ├── alembic/
│   └── requirements.txt
└── docs/
    └── deployment.md       # 本文档
```

---

## 附录：手动构建（不使用 Docker Compose）

```bash
# 1. 构建镜像
docker build \
  --build-arg VITE_KIMI_AUTH_URL=https://auth.kimi.com \
  --build-arg VITE_APP_ID=your-app-id \
  -t kimiblog:latest .

# 2. 运行 MySQL
docker run -d \
  --name kimiblog-db \
  -e MYSQL_ROOT_PASSWORD=kimiblog_root \
  -e MYSQL_DATABASE=kimi_blog \
  -e MYSQL_USER=kimiblog \
  -e MYSQL_PASSWORD=kimiblog_pass \
  -v kimiblog_db:/var/lib/mysql \
  mysql:8.0

# 3. 运行应用
docker run -d \
  --name kimiblog-app \
  --link kimiblog-db:db \
  -e APP_SECRET=your-secret \
  -e DATABASE_URL=mysql://kimiblog:kimiblog_pass@db:3306/kimi_blog \
  -e APP_ID=your-app-id \
  -p 3000:3000 \
  -v kimiblog_uploads:/app/app/public/uploads \
  kimiblog:latest
```
