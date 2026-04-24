# KimiBlog / 潮光微录

全栈个人博客系统。前端为 React SPA，后端为 FastAPI，使用 Kimi OAuth 认证，MySQL 持久化。

---

## 目录

- [技术栈](#技术栈)
- [目录结构](#目录结构)
- [快速开始](#快速开始)
- [环境变量](#环境变量)
- [数据库迁移](#数据库迁移)
- [生产部署](#生产部署)
- [API 概览](#api-概览)
- [维护与故障排查](#维护与故障排查)

---

## 技术栈

| 层级 | 技术 |
|------|------|
| 前端 | React 19, TypeScript, Vite 7, React Router 7, Tailwind CSS 3.4 |
| UI 组件 | shadcn/ui (Radix UI) |
| 动画 | GSAP |
| 状态管理 | React Query (@tanstack/react-query) |
| 后端 | FastAPI (Python), Pydantic v2, SQLAlchemy 2.0 (async), asyncmy |
| 认证 | Kimi OAuth 2.0 + JWT Session (python-jose, HS256) |
| 数据库 | MySQL |
| 迁移工具 | Alembic |
| 构建 | Vite (前端), Uvicorn ASGI (后端) |

---

## 目录结构

```
├── app/                        # 前端（React SPA）
│   ├── src/
│   │   ├── main.tsx            # 入口
│   │   ├── App.tsx             # 路由
│   │   ├── lib/api.ts          # REST API 客户端
│   │   ├── types/api.ts        # DTO 类型
│   │   ├── hooks/useAuth.ts    # 认证 Hook
│   │   ├── pages/              # 页面组件
│   │   ├── sections/           # 首页区块
│   │   └── components/         # 公共组件 + UI 组件
│   ├── public/                 # 静态资源
│   ├── .env.example            # 环境变量模板
│   └── package.json
│
├── backend/                    # 后端（FastAPI）
│   ├── app/
│   │   ├── main.py             # FastAPI 入口
│   │   ├── config.py           # 环境配置（Pydantic Settings）
│   │   ├── database.py         # SQLAlchemy async 引擎
│   │   ├── models.py           # ORM 模型
│   │   ├── schemas.py          # Pydantic DTO
│   │   ├── dependencies.py     # 依赖注入（认证/权限）
│   │   ├── auth/               # 认证模块（OAuth / JWT / 路由）
│   │   └── routers/            # 业务路由（posts / images / tags / contacts）
│   ├── alembic/                # 数据库迁移
│   ├── requirements.txt
│   └── venv/                   # Python 虚拟环境
│
├── db/                         # 历史 Drizzle schema（参考用）
├── contracts/                  # 共享常量（历史）
├── plan/                       # 项目计划与实施文档
│   ├── fastapi-refactor-plan.md
│   └── fastapi-refactor-implementation.md
└── AGENTS.md                   # AI Agent 上下文指南
```

---

## 快速开始

### 前置依赖

- **Node.js** 20+（前端构建需要）
- **Python** 3.12+（后端运行需要）
- **MySQL** 5.7+ 或兼容数据库（如 TiDB、PlanetScale）

### 1. 克隆与配置

```bash
git clone <repo-url>
cd <project-dir>

# 配置环境变量
# 后端
cd backend
cp .env.example .env
# 编辑 backend/.env，填写后端必填项

# 前端
cd ../app
cp .env.example .env
# 编辑 app/.env，填写前端必填项
```

### 2. 启动后端

```bash
cd backend

# 创建虚拟环境（如尚未创建）
python3 -m venv venv
source venv/bin/activate

# 安装依赖
pip install -r requirements.txt

# 启动开发服务器（端口 8000，自动重载）
uvicorn app.main:app --reload --port 8000
```

### 3. 启动前端

```bash
cd app

# 安装依赖
npm install

# 启动 Vite 开发服务器（端口 3000）
# /api 请求自动代理到 localhost:8000
npm run dev
```

### 4. 验证

- 前端：`http://localhost:3000`
- 后端健康检查：`http://localhost:8000/api/ping`
- API 文档（Swagger UI）：`http://localhost:8000/docs`

---

## 环境变量

前后端环境变量分开管理：
- 后端配置放在 `backend/.env`，FastAPI 会自动读取。
- 前端配置放在 `app/.env`，Vite 会自动读取并以 `VITE_` 前缀注入浏览器。

### 必填项

| 变量 | 说明 | 示例 |
|------|------|------|
| `APP_ID` | Kimi OAuth 应用 ID | `my-app-id` |
| `APP_SECRET` | 应用密钥（同时用于 JWT 签名） | `long-random-string` |
| `DATABASE_URL` | MySQL 连接串 | `mysql://user:pass@localhost:3306/kimiblog` |
| `VITE_KIMI_AUTH_URL` | Kimi OAuth 授权页基础 URL | `https://auth.kimi.com` |
| `VITE_APP_ID` | 前端可见的 App ID（通常与 `APP_ID` 相同） | `my-app-id` |
| `KIMI_AUTH_URL` | 后端使用的 Kimi OAuth URL | `https://auth.kimi.com` |
| `KIMI_OPEN_URL` | Kimi Open API 基础 URL | `https://open.kimi.com` |
| `OWNER_UNION_ID` | 首次登录自动设为 admin 的用户 unionId | `union_12345` |

### 说明

- `DATABASE_URL` 使用 `mysql://` 方案即可，FastAPI 会自动转换为 `mysql+asyncmy://`。
- `VITE_*` 前缀的变量会被 Vite 注入到浏览器端，**不要**在其中存放密钥。
- `APP_SECRET` 同时承担 OAuth client secret 和 JWT signing key 的职责，务必保密。

---

## 数据库迁移

### 现有数据库

当前数据库 schema 最初由 Drizzle ORM 创建。SQLAlchemy 模型已与之对齐，**无需运行历史迁移**即可直接连接现有数据库。

### 未来 schema 变更

```bash
cd backend
source venv/bin/activate

# 1. 修改 app/models.py 中的模型

# 2. 自动生成迁移脚本
alembic revision --autogenerate -m "add xxx column"

# 3. 查看生成的脚本（位于 alembic/versions/）
# 确认无误后执行迁移
alembic upgrade head

# 回滚（如需要）
# alembic downgrade -1
```

### Alembic 配置

- `alembic.ini` 与 `alembic/env.py` 已配置为异步模式（`mysql+asyncmy://`）。
- 若数据库 URL 变更，Alembic 会从 `backend/.env` 的 `DATABASE_URL` 自动读取，无需手动修改 `alembic.ini`。

---

## 生产部署

### 构建前端

```bash
cd app
npm run build
# 产物输出到 app/dist/public/
```

### 启动生产服务

```bash
cd backend
source venv/bin/activate

# 生产模式启动（建议配合 systemd / supervisord / docker）
uvicorn app.main:app --host 0.0.0.0 --port 3000
```

FastAPI 在生产模式下会：
- 从 `app/dist/public/` 服务静态文件
- 将未知非 API 路由回退到 `index.html`（支持 SPA 路由）
- 在 `/api/*` 上处理所有 REST 端点

### 推荐部署架构

```
                    ┌─────────────┐
    用户请求 ──────►│  Nginx/ CDN │──────► 静态文件缓存 / HTTPS 终结
                    └──────┬──────┘
                           │
                    ┌──────┴──────┐
                    │   Uvicorn   │  (FastAPI, port 3000)
                    │  (backend)  │
                    └──────┬──────┘
                           │
                         MySQL
```

**Nginx 配置要点**：
- 静态资源（JS/CSS/图片）可直接由 Nginx 代理到 `app/dist/public/`
- API 请求和 SPA fallback 路由到 Uvicorn
- 配置 `client_max_body_size`（如需要上传大文件，建议 ≥ 50MB）

### Docker（可选）

可编写多阶段 Dockerfile：
1. **Node 阶段**：`npm ci && npm run build`
2. **Python 阶段**：`pip install -r requirements.txt`，复制前端产物，启动 Uvicorn

---

## API 概览

所有端点前缀为 `/api`，返回 JSON 使用 camelCase 键名。

| 方法 | 路径 | 认证 | 功能 |
|------|------|------|------|
| GET | `/api/ping` | 公开 | 健康检查 |
| GET | `/api/oauth/callback` | 公开 | Kimi OAuth 回调 |
| GET | `/api/auth/me` | 需登录 | 当前用户信息 |
| POST | `/api/auth/logout` | 需登录 | 退出登录（清除 cookie） |
| GET | `/api/posts` | 公开 | 文章列表（支持 type/status/limit/offset） |
| GET | `/api/posts/{slug}` | 公开 | 单篇文章（含 tags） |
| POST | `/api/posts` | admin | 创建文章 |
| PUT | `/api/posts/{id}` | admin | 更新文章 |
| DELETE | `/api/posts/{id}` | admin | 删除文章 |
| GET | `/api/images` | 公开 | 图片列表（支持 album） |
| POST | `/api/images` | admin | 添加图片 |
| DELETE | `/api/images/{id}` | admin | 删除图片 |
| GET | `/api/tags` | 公开 | 标签列表 |
| POST | `/api/tags` | admin | 创建标签 |
| POST | `/api/contacts` | 公开 | 提交留言 |
| GET | `/api/contacts` | admin | 留言列表 |

完整 OpenAPI 文档可在后端启动后访问 `/docs`（Swagger UI）或 `/redoc`。

---

## 维护与故障排查

### 常见问题

#### 后端启动报错 `Could not parse SQLAlchemy URL`
- **原因**：`DATABASE_URL` 为空或格式不正确。
- **解决**：检查 `backend/.env` 中的 `DATABASE_URL` 是否已填写且以 `mysql://` 开头。

#### 前端请求 401 Unauthorized
- **原因**：`kimi_sid` cookie 未正确传递。
- **解决**：
  1. 确认 `apiFetch` 中设置了 `credentials: "include"`
  2. 开发环境确认 Vite proxy 配置正确（`changeOrigin: true`）
  3. 生产环境确认前后端同域，或 CORS 配置允许来源并开启 `allow_credentials`

#### OAuth 回调失败
- **原因**：`APP_ID`、`APP_SECRET`、`KIMI_AUTH_URL`、`KIMI_OPEN_URL` 配置错误。
- **解决**：检查 `backend/.env` 中的 OAuth 相关变量，确保与 Kimi 开放平台后台配置一致。

#### 数据库连接超时（asyncmy）
- **原因**：MySQL 未启动、网络不通、或连接串错误。
- **解决**：使用 `mysql` CLI 工具测试连接：`mysql -u user -p -h host dbname`

### 日志位置

- **后端**：Uvicorn 默认输出到 stdout/stderr，建议通过 systemd 或 docker 收集。
- **前端**：浏览器 DevTools Network 面板查看 API 请求与响应。

### 依赖更新

```bash
# 前端
cd app
npm update

# 后端
cd backend
source venv/bin/activate
pip install -U -r requirements.txt
```

### 清理旧数据（开发环境）

```bash
# 直接操作 MySQL 即可
mysql -u root -p -e "DROP DATABASE kimiblog; CREATE DATABASE kimiblog;"
# 然后重新运行 Alembic 迁移（如需要）
```

---

## 相关文档

- [AGENTS.md](./AGENTS.md) — AI Agent 上下文指南（项目结构、代码规范、命令速查）
- [plan/fastapi-refactor-implementation.md](./plan/fastapi-refactor-implementation.md) — 重构实施详细记录
- [plan/fastapi-refactor-plan.md](./plan/fastapi-refactor-plan.md) — 原始重构计划

---

## License

MIT
