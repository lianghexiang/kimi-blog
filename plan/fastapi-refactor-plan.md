# KimiBlog 后端 API 重构计划：Hono + tRPC → FastAPI

## 一、可行性结论

**完全可行。**

- 前端 React SPA 与后端通过 HTTP 交互，技术栈替换对页面渲染无影响。
- FastAPI 完全支持异步 MySQL（通过 `SQLAlchemy 2.0` + `asyncmy`/`aiomysql`）、JWT 认证、OAuth 回调、Cookie 操作等当前后端所有功能。
- 现有 MySQL 数据库 schema 可直接复用，无需重建数据。

**核心代价**：前端当前深度依赖 tRPC（类型安全的 React Query hooks），后端改为 FastAPI REST API 后，**前端必须重写所有 API 调用层**。UI 组件、页面结构、样式、路由可完整保留。

---

## 二、目标架构（重构后）

```
┌─────────────────┐         ┌─────────────────────────────┐
│   React SPA     │ ◄─────► │      FastAPI (Python)       │
│  (Vite build)   │  REST   │  - OAuth / Auth             │
│                 │  JSON   │  - CRUD Routers             │
│  React Query    │         │  - JWT Session (Cookie)     │
│  (保留)         │         │  - SQLAlchemy 2.0 (async)   │
└─────────────────┘         │  - Alembic Migrations       │
                            └─────────────────────────────┘
                                          │
                                          ▼
                                    ┌────────────┐
                                    │   MySQL    │
                                    └────────────┘
```

### 技术选型

| 层级 | 当前 | 重构后 |
|------|------|--------|
| 后端框架 | Hono 4 | **FastAPI** |
| API 协议 | tRPC 11 (私有协议) | **REST + OpenAPI** |
| 数据校验 | Zod | **Pydantic v2** |
| ORM | Drizzle ORM | **SQLAlchemy 2.0 (async)** |
| DB 驱动 | mysql2 | **asyncmy** |
| 迁移工具 | drizzle-kit | **Alembic** |
| 认证 JWT | jose (Node) | **python-jose** |
| 部署入口 | Node ESM (`dist/boot.js`) | **Uvicorn ASGI** |

---

## 三、后端重构详细步骤

### 步骤 1：创建 Python 后端项目结构

在 `app/` 同级或内部新建 `backend/` 目录（建议最终项目根目录调整为包含前后端两个子目录，或保持 `app/` 为前端、`backend/` 为后端）。

推荐结构：

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py              # FastAPI 入口，注册路由、中间件
│   ├── config.py            # 环境变量与配置（Pydantic Settings）
│   ├── database.py          # SQLAlchemy async engine + sessionmaker
│   ├── models.py            # ORM 模型（6 张表）
│   ├── schemas.py           # Pydantic DTO（Request / Response）
│   ├── dependencies.py      # 依赖注入：get_db, get_current_user, require_admin
│   ├── auth/
│   │   ├── oauth.py         # Kimi OAuth 交换 + JWKS 验证
│   │   ├── session.py       # JWT 签发/验证
│   │   └── router.py        # /api/auth/me, /api/auth/logout
│   └── routers/
│       ├── posts.py         # /api/posts
│       ├── images.py        # /api/images
│       ├── tags.py          # /api/tags
│       └── contacts.py      # /api/contacts
├── alembic/
│   └── versions/            # 迁移文件
├── alembic.ini
├── requirements.txt / pyproject.toml
└── Dockerfile               # Python 多阶段构建
```

### 步骤 2：ORM 模型设计（SQLAlchemy 2.0）

将现有 Drizzle schema 映射为 SQLAlchemy declarative models：

- `User`：id, union_id(uniq), name, email, avatar, role(enum), created_at, updated_at, last_sign_in_at
- `Post`：id, title, content, type(enum), slug(uniq), cover_image, status(enum), created_at, updated_at
- `Image`：id, title, description, url, album, sort_order, created_at
- `Tag`：id, name(uniq), color, created_at
- `PostTag`：post_id(FK), tag_id(FK) —— 多对多关联表
- `Contact`：id, name, email, message, created_at

关系定义：
- `Post.tags` ↔ `Tag.posts`（many-to-many via `PostTag`）

### 步骤 3：复现认证体系

#### 3.1 Kimi OAuth Callback (`GET /api/oauth/callback`)
1. 接收 query：`code`, `state`, `error`
2. 若 `error=access_denied`，302 重定向到 `/`
3. `state` base64 解码为 `redirect_uri`
4. 向 Kimi token endpoint 发送 `POST`（`application/x-www-form-urlencoded`）
   - body: `grant_type=authorization_code`, `code`, `client_id`, `redirect_uri`, `client_secret`
5. 使用远程 JWKS（`${KIMI_AUTH_URL}/api/.well-known/jwks.json`）验证 `access_token`
6. 调用 Kimi Open API `GET /v1/users/me/profile` 获取用户信息
7. **Upsert 用户**：`INSERT ... ON DUPLICATE KEY UPDATE`（通过 SQLAlchemy 的 `insert().on_duplicate_key_update` 或先查后插）
   - 若 `union_id == OWNER_UNION_ID`，自动设置 `role = "admin"`
   - 更新 `last_sign_in_at`
8. 签发 session JWT（`python-jose`，HS256，有效期 1 年，payload: `{union_id, client_id}`）
9. 设置 `kimi_sid` cookie（httpOnly, path=/, sameSite=Lax/None, secure 按环境）
10. 302 重定向到 `/`

#### 3.2 Session JWT (`api/auth/session.py`)
- `sign_session(payload: SessionPayload) -> str`
- `verify_session(token: str) -> SessionPayload | None`

#### 3.3 依赖注入 (`api/dependencies.py`)
- `get_current_user(request: Request, db: AsyncSession) -> User | None`
  - 从 cookie 读 `kimi_sid`
  - verify_session
  - db 查询用户
- `require_auth(user: User = Depends(get_current_user)) -> User`
  - 未登录抛 401
- `require_admin(user: User = Depends(require_auth)) -> User`
  - 非 admin 抛 403

### 步骤 4：REST API 端点设计

所有端点前缀保持 `/api`，与当前前端同源部署策略兼容。

| 方法 | 路径 | 认证 | 说明 |
|------|------|------|------|
| GET | `/api/ping` | 公开 | 健康检查 |
| GET | `/api/oauth/callback` | 公开 | OAuth 回调 |
| GET | `/api/auth/me` | 需登录 | 获取当前用户 |
| POST | `/api/auth/logout` | 需登录 | 清除 cookie |
| GET | `/api/posts` | 公开 | 列表（query: type, status, limit, offset） |
| GET | `/api/posts/{slug}` | 公开 | 单篇文章（含 tags） |
| POST | `/api/posts` | admin | 创建文章 |
| PUT | `/api/posts/{id}` | admin | 更新文章 |
| DELETE | `/api/posts/{id}` | admin | 删除文章 |
| GET | `/api/images` | 公开 | 列表（query: album） |
| POST | `/api/images` | admin | 添加图片 |
| DELETE | `/api/images/{id}` | admin | 删除图片 |
| GET | `/api/tags` | 公开 | 所有标签 |
| POST | `/api/tags` | admin | 创建标签 |
| POST | `/api/contacts` | 公开 | 提交留言 |
| GET | `/api/contacts` | admin | 留言列表 |

**关键数据格式约束**：
- 时间字段返回 ISO 8601 字符串，前端 `new Date()` 可正常解析。
- `PostResponse` 包含嵌套的 `tags: list[TagResponse]`，与当前 tRPC 返回结构一致。
- 所有枚举字段（`type`, `status`, `role`）返回字符串值。

### 步骤 5：CORS 与中间件

- 开发环境：FastAPI 开启 `CORSMiddleware`，允许 `http://localhost:3000`，`credentials: true`
- 生产环境：若前后端同源（FastAPI 服务静态文件），可关闭 CORS
- 全局请求体大小限制：50 MB（FastAPI 默认无此限制，需用 `Request` 中间件或 Nginx 控制）

### 步骤 6：生产环境静态文件服务

FastAPI 中挂载 `StaticFiles`：
```python
app.mount("/", StaticFiles(directory="dist/public", html=True), name="static")
```
- 非 API 路由回退到 `index.html`（SPA 路由）。
- 当前端构建产物放在 `dist/public/` 时，与现有 Vite `build.outDir` 一致。

### 步骤 7：数据库迁移（Alembic）

1. 初始化 Alembic：`alembic init alembic`
2. 配置 `alembic.ini` 与 `env.py` 使用 async URL
3. 根据 SQLAlchemy models 生成第一个 migration：`alembic revision --autogenerate -m "init"`
4. 由于现有数据库已由 Drizzle 创建，**不需要执行 `alembic upgrade`**，只需确保模型与现有 schema 一致即可。后续 schema 变更再用 Alembic 管理。

---

## 四、前端适配详细步骤

前端页面（React 组件、路由、Tailwind 样式）**完整保留**。仅需替换数据层。

### 步骤 1：移除 tRPC 依赖

删除以下文件：
- `src/providers/trpc.tsx`
- `src/hooks/useAuth.ts`（需重写）

删除 npm 依赖（可选，也可保留不引）：
- `@trpc/client`, `@trpc/react-query`, `@trpc/server`

### 步骤 2：新建 API Client 层

新建 `src/lib/api.ts`，基于 `fetch` 封装：

```typescript
// 所有 API 调用统一入口
const API_BASE = "/api";  // 开发环境可配置 proxy

async function apiFetch<T>(
  path: string,
  options?: RequestInit
): Promise<T> { ... }

export const api = {
  ping: () => apiFetch<{ok: boolean; ts: number}>("/ping"),
  auth: {
    me: () => apiFetch<User>("/auth/me", { credentials: "include" }),
    logout: () => apiFetch<{success: true}>("/auth/logout", { method: "POST", credentials: "include" }),
  },
  posts: {
    list: (params?: PostListParams) => apiFetch<Post[]>(`/posts?${qs(params)}`),
    getBySlug: (slug: string) => apiFetch<Post & {tags: Tag[]}>(`/posts/${slug}`),
    create: (data: CreatePostInput) => apiFetch<Post>("/posts", { method: "POST", body: JSON.stringify(data) }),
    update: (id: number, data: UpdatePostInput) => apiFetch<Post>(`/posts/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    delete: (id: number) => apiFetch<{success: true}>(`/posts/${id}`, { method: "DELETE" }),
  },
  // ... image, tag, contact 同理
};
```

所有请求均携带 `credentials: "include"` 以发送 cookie。

### 步骤 3：重写 useAuth Hook

新建 `src/hooks/useAuth.ts`，改用 React Query + api client：

```typescript
export function useAuth(options?: UseAuthOptions) {
  const utils = useQueryClient();
  const navigate = useNavigate();

  const { data: user, isLoading, error, refetch } = useQuery({
    queryKey: ["auth", "me"],
    queryFn: () => api.auth.me(),
    staleTime: 1000 * 60 * 5,
    retry: false,
  });

  const logoutMutation = useMutation({
    mutationFn: () => api.auth.logout(),
    onSuccess: () => {
      utils.invalidateQueries();  // 清空所有缓存
      navigate(redirectPath);
    },
  });
  // ...
}
```

### 步骤 4：重写所有页面中的数据调用

所有 `trpc.xxx.useQuery` → `useQuery({ queryKey: [...], queryFn: () => api.xxx(...) })`
所有 `trpc.xxx.useMutation` → `useMutation({ mutationFn: api.xxx, onSuccess: ... })`
所有 `trpc.useUtils()` → `useQueryClient()`

**受影响文件清单**：
- `src/pages/Admin.tsx` — 大量 query/mutation
- `src/pages/Blog.tsx` — post.list, tag.list
- `src/pages/BlogPost.tsx` — post.getBySlug
- `src/pages/Journal.tsx` — post.list
- `src/pages/Thoughts.tsx` — post.list
- `src/pages/GalleryPage.tsx` — image.list
- `src/sections/Gallery.tsx` — image.list
- `src/sections/Footer.tsx` — contact.submit
- `src/pages/Login.tsx` — 可能涉及 OAuth URL 构造（仅前端逻辑，无需改动）

### 步骤 5：React Query Provider

移除 `TRPCProvider`，在 `main.tsx` 中直接使用 `QueryClientProvider`：

```tsx
<QueryClientProvider client={queryClient}>
  <BrowserRouter>
    <App />
  </BrowserRouter>
</QueryClientProvider>
```

### 步骤 6：Vite 配置调整

`vite.config.ts` 中：
- 移除 `@hono/vite-dev-server` 插件及相关配置
- 增加开发代理，将 `/api` 请求转发到 FastAPI：

```typescript
server: {
  port: 3000,
  proxy: {
    "/api": {
      target: "http://localhost:8000",
      changeOrigin: true,
    },
  },
},
```

这样开发时前端跑在 3000，后端跑在 8000，前端通过 proxy 无 CORS 调用后端。

### 步骤 7：类型定义补充

由于失去 tRPC 的自动生成类型，需要在前端手动维护 API DTO 类型。建议在 `src/types/api.ts` 中定义所有接口类型，与后端 Pydantic schemas 保持一致。

---

## 五、开发与生产工作流

### 开发环境启动

```bash
# 终端 1：启动 FastAPI 后端
cd backend
uvicorn app.main:app --reload --port 8000

# 终端 2：启动前端 Vite dev server
cd app
npm run dev          # port 3000，/api 代理到 8000
```

### 生产构建与部署

```bash
# 1. 构建前端
cd app
npm run build        # 输出到 app/dist/public

# 2. 将构建产物复制到后端可访问路径，或保持现有目录结构
cp -r app/dist/public backend/static

# 3. 启动 FastAPI
cd backend
uvicorn app.main:app --host 0.0.0.0 --port 3000
```

FastAPI 配置为从 `dist/public` 服务静态文件，所有 `/api/*` 请求由 API 路由处理，其他请求回退 `index.html`。

### Docker（可选）

可编写多阶段 Dockerfile：
1. Node 阶段：构建前端
2. Python 阶段：安装依赖，复制前端构建产物，启动 Uvicorn

---

## 六、环境变量映射

FastAPI 后端使用与当前 Node 后端**相同的环境变量名**，无需改动 `.env`：

| 变量名 | FastAPI 读取方式 | 用途 |
|--------|-----------------|------|
| `APP_ID` | `os.getenv` / Pydantic Settings | Kimi OAuth app ID |
| `APP_SECRET` | `os.getenv` | JWT 签名密钥 + OAuth client secret |
| `DATABASE_URL` | `os.getenv` | MySQL 连接串（需转为 `mysql+asyncmy://...`） |
| `KIMI_AUTH_URL` | `os.getenv` | Kimi OAuth 基础 URL |
| `KIMI_OPEN_URL` | `os.getenv` | Kimi Open API 基础 URL |
| `OWNER_UNION_ID` | `os.getenv` | 自动赋予 admin 的 unionId |

前端环境变量（`VITE_*`）无需改动。

---

## 七、数据兼容性

- **零数据迁移**：现有 MySQL 数据库可直接被 SQLAlchemy 连接使用。
- **唯一注意点**：Drizzle 的 `timestamp` 与 SQLAlchemy 的 `DateTime` 行为需对齐（都使用 `datetime` 类型）。
- **PostTag 关联表**：Drizzle 中无显式主键，SQLAlchemy 模型也应映射为无主键的关联表，或增加复合主键 `(post_id, tag_id)` 以避免重复关联（推荐增加唯一约束，但需确认现有数据）。

---

## 八、风险与注意事项

| 风险点 | 影响 | 缓解措施 |
|--------|------|----------|
| 前端 API 调用全部重写 | 中等，约 15-20 处调用 | 按模块逐步替换，每改一个页面即测试 |
| 失去 tRPC 类型安全 | 前端需手动维护 DTO 类型 | 使用 OpenAPI Generator 或手动同步 Pydantic schema |
| 开发工作流改变 | 需同时启动两个服务 | Vite proxy 配置解决跨域，体验接近原有 devServer |
| Session JWT 库差异 | Node `jose` vs Python `python-jose` | 确保 HS256、payload 结构、过期时间完全一致 |
| Cookie SameSite/Secure | 本地 vs 生产行为差异 | 完全复现现有 `cookies.ts` 中的条件逻辑 |
| 时间序列化 | tRPC/superjson 自动处理 Date | FastAPI 默认返回 ISO 字符串，前端 `new Date()` 兼容 |
| React Query 缓存键 | tRPC 内部自动生成 queryKey | 手动指定 queryKey，确保与 invalidate 逻辑匹配 |

---

## 九、实施优先级建议

按以下顺序逐步实施，每个阶段可独立验证：

1. **Phase 1：FastAPI 基础骨架**
   - 搭建 `backend/` 项目结构
   - 配置 SQLAlchemy + Alembic
   - 实现 `GET /api/ping` 和 `/api/posts`（公开端点，无需认证）

2. **Phase 2：认证体系**
   - 实现 OAuth callback
   - 实现 JWT session 签发/验证
   - 实现 `/api/auth/me` 和 `/api/auth/logout`

3. **Phase 3：全部 API 端点**
   - 完成 posts, images, tags, contacts 的 CRUD
   - 使用 Postman / curl 完整测试

4. **Phase 4：前端迁移**
   - 移除 tRPC，建立 api client
   - 重写 useAuth
   - 逐个页面替换数据调用（Admin → Blog → BlogPost → 其他）

5. **Phase 5：整合与部署**
   - 调整 Vite proxy / 静态文件服务
   - 生产环境联调
   - Dockerfile 更新
