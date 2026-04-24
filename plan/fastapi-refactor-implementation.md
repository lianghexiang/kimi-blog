# KimiBlog 后端重构实施文档：Hono + tRPC → FastAPI

> 本文档记录从 Hono + tRPC (Node) 迁移到 FastAPI (Python) 的完整实施过程。
> 创建时间：2026-04-24

---

## 一、重构目标

将后端技术栈从 **Hono 4 + tRPC 11 + Drizzle ORM** 替换为 **FastAPI + SQLAlchemy 2.0 (async)**，同时保留：

- 前端 React SPA 的所有页面、组件、样式、路由
- 现有的 MySQL 数据库（零数据迁移）
- Kimi OAuth 2.0 认证体系
- 同域部署策略（`/api/*` 走后端，其余走前端 SPA）

**核心代价**：前端数据层从 tRPC 类型安全的 React Query hooks 迁移为基于 `fetch` 的 REST API 调用。

---

## 二、架构对比

### 重构前

```
React SPA ──tRPC/SuperJSON──► Hono + tRPC (Node)
                                    │
                                    ▼
                              Drizzle ORM + mysql2
                                    │
                                    ▼
                                  MySQL
```

### 重构后

```
React SPA ────REST/JSON─────► FastAPI (Python)
   │                                │
   │  React Query                   │  SQLAlchemy 2.0 (async)
   │                                │  asyncmy
   │                                ▼
   │                              MySQL
   │
   └── Vite dev server (port 3000)
        proxy /api → localhost:8000
```

### 技术选型映射

| 层级 | 重构前 | 重构后 |
|------|--------|--------|
| 后端框架 | Hono 4 | **FastAPI 0.136+** |
| API 协议 | tRPC 11 (私有协议) | **REST + OpenAPI** |
| 数据校验 | Zod | **Pydantic v2** |
| ORM | Drizzle ORM | **SQLAlchemy 2.0 (async)** |
| DB 驱动 | mysql2 | **asyncmy** |
| 迁移工具 | drizzle-kit | **Alembic** |
| 认证 JWT | jose (Node) | **python-jose** |
| 部署入口 | Node ESM (`dist/boot.js`) | **Uvicorn ASGI** |

---

## 三、后端实现详情

### 3.1 项目结构

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py              # FastAPI 入口，注册路由、中间件、静态文件
│   ├── config.py            # Pydantic Settings，读取 ../app/.env
│   ├── database.py          # SQLAlchemy async engine + AsyncSessionLocal
│   ├── models.py            # ORM 模型（6 张表）
│   ├── schemas.py           # Pydantic DTO（Request / Response）
│   ├── dependencies.py      # get_db, get_current_user, require_auth, require_admin
│   ├── auth/
│   │   ├── __init__.py
│   │   ├── oauth.py         # Kimi OAuth 交换 + JWKS 验证 + callback handler
│   │   ├── session.py       # JWT 签发/验证（HS256）
│   │   └── router.py        # /api/auth/me, /api/auth/logout
│   └── routers/
│       ├── __init__.py
│       ├── posts.py         # /api/posts
│       ├── images.py        # /api/images
│       ├── tags.py          # /api/tags
│       └── contacts.py      # /api/contacts
├── alembic/
│   ├── env.py               # 配置 async URL
│   ├── README
│   ├── script.py.mako
│   └── versions/            # 迁移文件
├── alembic.ini
├── requirements.txt
└── venv/                    # Python 虚拟环境
```

### 3.2 ORM 模型（SQLAlchemy 2.0）

| 模型 | 表名 | 关键字段 | 备注 |
|------|------|---------|------|
| `User` | `users` | id, unionId, name, email, avatar, role, createdAt, updatedAt, lastSignInAt | role: enum(user, admin) |
| `Post` | `posts` | id, title, content, type, slug, cover_image, status, created_at, updated_at | type: enum(blog, journal, thought); status: enum(published, draft) |
| `Image` | `images` | id, title, description, url, album, sort_order, created_at | |
| `Tag` | `tags` | id, name, color | name 唯一 |
| `post_tags` | `post_tags` | post_id, tag_id | 复合主键 (post_id, tag_id) |
| `Contact` | `contacts` | id, name, email, message, created_at | |

> **Schema 兼容性**：现有数据库由 Drizzle 创建，SQLAlchemy 模型与之完全兼容。唯一的改进是给 `post_tags` 增加了复合主键（防止重复关联），但不影响现有数据。

### 3.3 认证体系

#### OAuth Callback (`GET /api/oauth/callback`)

1. 接收 query：`code`, `state`, `error`
2. 若 `error=access_denied` → 302 重定向到 `/`
3. `state` base64 解码为 `redirect_uri`
4. POST `${KIMI_AUTH_URL}/api/oauth/token`，`application/x-www-form-urlencoded`
5. 使用 `python-jose` + 远程 JWKS（`${KIMI_AUTH_URL}/api/.well-known/jwks.json`）验证 `access_token`
6. GET `${KIMI_OPEN_URL}/v1/users/me/profile` 获取用户信息
7. Upsert 用户：若 `union_id == OWNER_UNION_ID` 则 `role = "admin"`，更新 `last_sign_in_at`
8. 签发 session JWT：`python-jose` HS256，payload `{ "union_id": ..., "client_id": ... }`，有效期 1 年
9. 设置 `kimi_sid` cookie：
   - `httpOnly: True`
   - `path: "/"`
   - `sameSite: "Lax"`（localhost）/ `"None"`（生产）
   - `secure: not localhost`
   - `max_age: 31536000`（1 年）
10. 302 重定向到 `/`

#### Session JWT (`auth/session.py`)

- `sign_session(payload: dict) -> str`
- `verify_session(token: str) -> dict | None`
- 与 Node 端完全对齐：alg=HS256，secret=`APP_SECRET`（UTF-8 bytes）

#### 依赖注入 (`dependencies.py`)

| 依赖 | 功能 | 未满足时 |
|------|------|---------|
| `get_current_user` | 从 cookie 读 `kimi_sid` → verify → DB 查询 | 返回 `None` |
| `require_auth` | 依赖 `get_current_user` | 抛 401 |
| `require_admin` | 依赖 `require_auth`，检查 `role == "admin"` | 抛 403 |

### 3.4 REST API 端点

| 方法 | 路径 | 认证 | 说明 |
|------|------|------|------|
| GET | `/api/ping` | 公开 | `{ ok: true, ts: <unix_ms> }` |
| GET | `/api/oauth/callback` | 公开 | OAuth 回调（302 重定向） |
| GET | `/api/auth/me` | 需登录 | 返回当前用户 JSON（camelCase keys） |
| POST | `/api/auth/logout` | 需登录 | 清除 `kimi_sid` cookie |
| GET | `/api/posts` | 公开 | query: `type`, `status`, `limit`(default 20), `offset`(default 0) |
| GET | `/api/posts/{slug}` | 公开 | 单篇文章，含嵌套 `tags` |
| POST | `/api/posts` | admin | 创建文章（含 tagIds 全量替换） |
| PUT | `/api/posts/{id}` | admin | 更新文章 |
| DELETE | `/api/posts/{id}` | admin | 删除文章（先删 post_tags） |
| GET | `/api/images` | 公开 | query: `album` |
| POST | `/api/images` | admin | 添加图片 |
| DELETE | `/api/images/{id}` | admin | 删除图片 |
| GET | `/api/tags` | 公开 | 所有标签 |
| POST | `/api/tags` | admin | 创建标签 |
| POST | `/api/contacts` | 公开 | 提交留言 |
| GET | `/api/contacts` | admin | 留言列表（按 created_at desc） |

**响应格式约束**：
- 时间字段返回 ISO 8601 字符串
- 枚举字段返回字符串值
- JSON key 使用 camelCase（Pydantic `alias_generator` 自动转换）

### 3.5 静态文件与 SPA Fallback

生产环境 FastAPI 配置：
- `app.mount("/", StaticFiles(directory="app/dist/public"), name="static")`
- catch-all 路由 `/{full_path:path}` 排除 `/api/*` 后返回 `index.html`

---

## 四、前端迁移详情

### 4.1 新建文件

| 文件 | 职责 |
|------|------|
| `src/types/api.ts` | 手动维护的 TypeScript DTO 类型（User, Post, Tag, Image, Contact 及请求参数类型） |
| `src/lib/api.ts` | 基于 `fetch` 的统一 API 客户端，所有请求携带 `credentials: "include"` |

### 4.2 重写文件

| 文件 | 变更内容 |
|------|---------|
| `src/hooks/useAuth.ts` | 从 `trpc.auth.me.useQuery` 迁移到 `useQuery({ queryKey: ["auth", "me"], queryFn: api.auth.me })`；logout 改用 `useMutation` + `queryClient.invalidateQueries()` |
| `src/main.tsx` | 移除 `TRPCProvider`，直接使用 `QueryClientProvider` |

### 4.3 修改的页面与组件

| 文件 | 原 tRPC 调用 | 替换后 |
|------|-------------|--------|
| `src/pages/Admin.tsx` | `trpc.post.list/create/update/delete`, `trpc.image.list/create/delete`, `trpc.tag.list/create`, `trpc.contact.list` | `api.posts.*`, `api.images.*`, `api.tags.*`, `api.contacts.*`，所有 mutation 成功后调用 `queryClient.invalidateQueries({ queryKey: [...] })` |
| `src/pages/Blog.tsx` | `trpc.post.list({ type: "blog", status: "published" })`, `trpc.tag.list()` | `useQuery` + `api.posts.list()`, `api.tags.list()` |
| `src/pages/BlogPost.tsx` | `trpc.post.getBySlug.useQuery({ slug })` | `useQuery` + `api.posts.getBySlug(slug)` |
| `src/pages/Journal.tsx` | `trpc.post.list({ type: "journal", status: "published" })` | `useQuery` + `api.posts.list()` |
| `src/pages/Thoughts.tsx` | `trpc.post.list({ type: "thought", status: "published" })` | `useQuery` + `api.posts.list()` |
| `src/pages/GalleryPage.tsx` | `trpc.image.list.useQuery()` | `useQuery` + `api.images.list()` |
| `src/sections/Gallery.tsx` | `trpc.image.list.useQuery()` | `useQuery` + `api.images.list()` |
| `src/sections/Footer.tsx` | `trpc.contact.submit.useMutation()` | `useMutation` + `api.contacts.submit()` |

### 4.4 删除的文件

- `src/providers/trpc.tsx`（tRPC Provider + httpBatchLink + SuperJSON 配置）

### 4.5 配置变更

#### `vite.config.ts`
- **移除**：`@hono/vite-dev-server` 插件及 `api/boot.ts` 入口配置
- **新增**：开发代理
  ```typescript
  proxy: {
    "/api": {
      target: "http://localhost:8000",
      changeOrigin: true,
    },
  }
  ```

#### `package.json`
- `build` 脚本从 `vite build && esbuild api/boot.ts ...` 简化为 `vite build`
- `start` 脚本改为提示使用 `backend/` 启动 FastAPI

#### `tsconfig.json`
- 移除了 `tsconfig.server.json` 的引用（后端不再使用 TypeScript）

---

## 五、环境变量

FastAPI 复用现有 `app/.env` 文件，变量名完全不变：

| 变量名 | FastAPI 读取方式 | 用途 |
|--------|-----------------|------|
| `APP_ID` | Pydantic Settings | Kimi OAuth app ID |
| `APP_SECRET` | Pydantic Settings | JWT 签名密钥 + OAuth client secret |
| `DATABASE_URL` | Pydantic Settings | MySQL 连接串（`mysql://...`，自动转为 `mysql+asyncmy://...`） |
| `KIMI_AUTH_URL` | Pydantic Settings | Kimi OAuth 基础 URL |
| `KIMI_OPEN_URL` | Pydantic Settings | Kimi Open API 基础 URL |
| `OWNER_UNION_ID` | Pydantic Settings | 自动赋予 admin 的 unionId |

前端 `VITE_*` 变量无需改动。

---

## 六、开发与生产工作流

### 开发环境

```bash
# 终端 1：FastAPI 后端
cd backend
source venv/bin/activate
uvicorn app.main:app --reload --port 8000

# 终端 2：前端 Vite dev server
cd app
npm run dev          # port 3000，/api 代理到 8000
```

### 生产构建与部署

```bash
# 1. 构建前端
cd app
npm run build        # 输出到 app/dist/public

# 2. 启动 FastAPI（配置为从 app/dist/public 服务静态文件）
cd ../backend
source venv/bin/activate
uvicorn app.main:app --host 0.0.0.0 --port 3000
```

FastAPI 生产服务器：
- 所有 `/api/*` 请求由 API 路由处理
- 静态文件从 `app/dist/public/` 服务
- 非 API 非静态文件路由回退到 `index.html`（SPA 行为）

---

## 七、数据兼容性

- **零数据迁移**：现有 MySQL 数据库可直接被 SQLAlchemy 连接使用。
- **时间字段**：Drizzle 的 `timestamp` 与 SQLAlchemy 的 `DateTime` 在 MySQL 中都映射为 `datetime`，FastAPI 默认返回 ISO 字符串，前端 `new Date()` 兼容。
- **post_tags 关联表**：FastAPI 模型增加了复合主键 `(post_id, tag_id)`，但此变更不影响现有数据（仅防止未来重复关联）。

---

## 八、风险与注意事项

| 风险点 | 影响 | 缓解措施 |
|--------|------|----------|
| 前端 API 调用全部重写 | 中等，约 15-20 处调用 | 已按模块逐步替换，每改一个页面即检查 |
| 失去 tRPC 类型安全 | 前端需手动维护 DTO 类型 | `src/types/api.ts` 手动同步；可考虑后续引入 OpenAPI Generator |
| 开发工作流改变 | 需同时启动两个服务 | Vite proxy 配置解决跨域，体验接近原有 devServer |
| Session JWT 库差异 | Node `jose` vs Python `python-jose` | 确保 alg=HS256、secret=APP_SECRET UTF-8 bytes、payload 结构 `{union_id, client_id}` 完全一致 |
| Cookie SameSite/Secure | 本地 vs 生产行为差异 | 完全复现现有 `cookies.ts` 中的 localhost 检测逻辑 |
| 时间序列化 | tRPC/superjson 自动处理 Date | FastAPI 默认返回 ISO 字符串，前端 `new Date()` 兼容 |
| React Query 缓存键 | tRPC 内部自动生成 queryKey | 手动指定 queryKey，确保与 invalidate 逻辑匹配 |
| Admin 表单缺少 tagIds | 当前 Admin 创建/编辑文章不支持标签 | 保持现状，重构不改变 UI 行为 |

---

## 九、后续可优化项

1. **OpenAPI 代码生成**：使用 `openapi-typescript` 从 FastAPI 自动生成的 OpenAPI schema 同步前端类型，减少手动维护 `src/types/api.ts` 的工作量。
2. **Dockerfile 更新**：编写多阶段 Dockerfile（Node 构建前端 → Python 安装依赖并运行 Uvicorn）。
3. **后端测试**：为 FastAPI 路由添加 pytest + httpx / TestClient 测试。
4. **依赖清理**：从 `app/package.json` 中移除不再使用的 `@trpc/*`, `superjson`, `hono`, `@hono/*`, `drizzle-orm`, `drizzle-kit`, `mysql2`, `jose`, `cookie`, `esbuild` 等依赖。
5. **API 分页增强**：当前 `post.list` 仅支持 limit/offset，可考虑增加 cursor-based 分页。
