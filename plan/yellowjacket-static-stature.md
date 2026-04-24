# 当前 Hono + tRPC 后端实现全面总结

> 基于对 `app/api/` 目录及关联文件的完整分析

---

## 1. 整体架构

后端采用 **Hono** (Web 框架) + **tRPC** (类型安全 API) + **Drizzle ORM** (MySQL) 的三层架构：

- **Hono** 处理原始 HTTP 路由（OAuth 回调、静态文件、body limit）
- **tRPC** 处理所有数据 API，挂载在 `/api/trpc/*`
- **Drizzle ORM** 使用 mysql2 驱动，PlanetScale 模式

### 核心文件结构

```
app/api/
├── boot.ts              # Hono 应用入口 + tRPC adapter 挂载
├── router.ts            # tRPC 根路由器
├── context.ts           # tRPC 上下文构建器
├── middleware.ts        # tRPC 中间件：public/authed/admin
├── auth-router.ts       # tRPC 认证子路由
├── kimi/                # Kimi 平台集成
│   ├── auth.ts          # OAuth 回调处理器、请求认证
│   ├── platform.ts      # Kimi Open API 封装
│   ├── session.ts       # Session JWT 签发/校验
│   └── types.ts         # Kimi API 类型定义
├── lib/                 # 后端工具库
│   ├── env.ts           # 环境变量加载
│   ├── cookies.ts       # Session Cookie 配置
│   ├── http.ts          # HttpClient 工具类
│   └── vite.ts          # 生产环境静态文件服务
├── queries/             # 数据库查询辅助
│   ├── connection.ts    # Drizzle DB 单例
│   └── users.ts         # 用户查找/创建
└── routers/             # tRPC 领域路由
    ├── post.ts
    ├── image.ts
    ├── tag.ts
    └── contact.ts
```

---

## 2. Hono 入口 (api/boot.ts)

```ts
const app = new Hono<{ Bindings: HttpBindings }>();
```

### 中间件/路由注册

| 路由/中间件 | 说明 |
|-----------|------|
| `bodyLimit({ maxSize: 50MB })` | 全局请求体大小限制 |
| `GET /api/oauth/callback` | Kimi OAuth 回调处理 (`createOAuthCallbackHandler()`) |
| `/api/trpc/*` | tRPC fetch adapter，所有数据 API 入口 |
| `/api/*` | 404 兜底 |

### 生产环境启动

```ts
if (env.isProduction) {
  serveStaticFiles(app);  // 静态文件 + SPA fallback
  serve({ fetch: app.fetch, port }, ...);
}
```

---

## 3. tRPC 核心 (api/middleware.ts, context.ts, router.ts)

### 初始化

```ts
const t = initTRPC.context<TrpcContext>().create({ transformer: superjson });
```

使用 **SuperJSON** 作为序列化器，支持 Date、Map、Set 等复杂类型。

### 上下文 (context.ts)

```ts
type TrpcContext = {
  req: Request;
  resHeaders: Headers;
  user?: User;  // 从 session cookie 解析出的当前用户
};
```

`createContext` 从请求头的 `cookie` 中读取 `kimi_sid`，调用 `authenticateRequest()` 解析用户信息。**认证是可选的**——未登录用户也能访问 public 接口。

### 三层中间件 (middleware.ts)

| 中间件 | 说明 | 错误码 |
|-------|------|--------|
| `publicQuery` | 无需认证 | — |
| `authedQuery` | 必须登录 | `UNAUTHORIZED` (401) |
| `adminQuery` | 必须登录且 `role === "admin"` | `FORBIDDEN` (403) |

### 根路由器 (router.ts)

```ts
export const appRouter = createRouter({
  ping: publicQuery.query(() => ({ ok: true, ts: Date.now() })),
  auth: authRouter,
  post: postRouter,
  image: imageRouter,
  tag: tagRouter,
  contact: contactRouter,
});
```

---

## 4. 认证系统 (api/kimi/)

### 4.1 OAuth 流程 (auth.ts)

**完整 OAuth 2.0 + JWT Session 流程：**

1. **前端**构造授权 URL（`VITE_KIMI_AUTH_URL` + `VITE_APP_ID`）
2. **用户授权**后，Kimi 重定向到 `/api/oauth/callback`
3. **后端**提取 `code` 和 `state`（`state` 是 base64 编码的 redirectUri）
4. **换 Token**：`POST /api/oauth/token`（`authorization_code` 模式）
5. **验证 Access Token**：通过远程 JWKS 验证签名，提取 `user_id`（即 `unionId`）
6. **获取用户资料**：`GET /v1/users/me/profile`（含 name, avatar_url）
7. **Upsert 用户**：写入 `users` 表；若 `unionId === OWNER_UNION_ID`，自动设为 `admin`
8. **签发 Session JWT**：使用 `APP_SECRET` + HS256，有效期 1 年
9. **设置 Cookie**：`kimi_sid`，httpOnly，maxAge=1年
10. **重定向**到首页 `/`

### 4.2 请求认证 (auth.ts)

```ts
export async function authenticateRequest(headers: Headers) {
  const token = parseCookie(headers)[Session.cookieName];
  const claim = await verifySessionToken(token);   // HS256 校验
  const user = await findUserByUnionId(claim.unionId);
  return user;
}
```

### 4.3 Session JWT (session.ts)

```ts
type SessionPayload = { unionId: string; clientId: string };

// 签发：HS256，1年有效期
// 校验：算法白名单 [HS256]，检查 unionId/clientId 必填
```

### 4.4 Kimi Open API (platform.ts)

```ts
export const users = {
  getProfile: (token: string) => kimiRequest<UserProfile>("/v1/users/me/profile", token),
};
```

封装了带 Bearer Token 的通用请求方法，基础 URL 为 `KIMI_OPEN_URL`。

### 4.5 Auth Router (auth-router.ts)

| 端点 | 方法 | 权限 | 说明 |
|------|------|------|------|
| `auth.me` | query | authed | 返回当前登录用户对象 |
| `auth.logout` | mutation | authed | 清空 `kimi_sid` cookie（maxAge=0） |

---

## 5. 数据库层

### 5.1 连接 (queries/connection.ts)

```ts
export function getDb() {
  if (!instance) {
    instance = drizzle(env.databaseUrl, {
      mode: "planetscale",
      schema: { ...schema, ...relations },
    });
  }
  return instance;
}
```

使用 **单例模式**，PlanetScale 兼容模式。

### 5.2 用户查询 (queries/users.ts)

| 函数 | 说明 |
|------|------|
| `findUserByUnionId(unionId)` | 按 unionId 查询用户 |
| `upsertUser(data)` | INSERT ... ON DUPLICATE KEY UPDATE；首次创建时若匹配 `OWNER_UNION_ID` 则自动赋 `admin` 角色 |

### 5.3 数据表 (db/schema.ts)

| 表名 | 关键字段 |
|------|---------|
| `users` | `unionId`(唯一), `name`, `email`, `avatar`, `role`(enum: user/admin), `lastSignInAt` |
| `posts` | `title`, `content`, `type`(blog/journal/thought), `slug`(唯一), `coverImage`, `status`(published/draft) |
| `images` | `title`, `description`, `url`, `album`, `sortOrder` |
| `tags` | `name`(唯一), `color`(默认 #3B82F6) |
| `post_tags` | `postId`, `tagId` (多对多关联) |
| `contacts` | `name`, `email`, `message` |

---

## 6. API 端点详情 (tRPC Routers)

### 6.1 Post Router (routers/post.ts)

| 端点 | 方法 | 权限 | 输入 | 说明 |
|------|------|------|------|------|
| `post.list` | query | public | `{ type?, status?, limit?, offset? }` | 列表查询，支持类型和状态过滤 |
| `post.getBySlug` | query | public | `{ slug }` | 按 slug 获取单篇文章，附带关联 tags |
| `post.create` | mutation | admin | `{ title, content, type, slug, coverImage?, status?, tagIds? }` | 创建文章，可指定标签 |
| `post.update` | mutation | admin | `{ id, title?, content?, type?, slug?, coverImage?, status?, tagIds? }` | 更新文章，tagIds 会全量替换 |
| `post.delete` | mutation | admin | `{ id }` | 删除文章及关联标签 |

### 6.2 Image Router (routers/image.ts)

| 端点 | 方法 | 权限 | 输入 | 说明 |
|------|------|------|------|------|
| `image.list` | query | public | `{ album? }` | 图片列表，可按相册过滤 |
| `image.create` | mutation | admin | `{ title, description?, url, album? }` | 创建图片 |
| `image.delete` | mutation | admin | `{ id }` | 删除图片 |

### 6.3 Tag Router (routers/tag.ts)

| 端点 | 方法 | 权限 | 输入 | 说明 |
|------|------|------|------|------|
| `tag.list` | query | public | — | 获取所有标签 |
| `tag.create` | mutation | admin | `{ name, color? }` | 创建标签 |

### 6.4 Contact Router (routers/contact.ts)

| 端点 | 方法 | 权限 | 输入 | 说明 |
|------|------|------|------|------|
| `contact.submit` | mutation | public | `{ name, email, message }` | 提交联系信息 |
| `contact.list` | query | admin | — | 查看所有联系信息 |

### 6.5 Auth Router (auth-router.ts)

| 端点 | 方法 | 权限 | 说明 |
|------|------|------|------|
| `auth.me` | query | authed | 返回当前用户 |
| `auth.logout` | mutation | authed | 退出登录，清除 cookie |

### 6.6 公共端点 (router.ts)

| 端点 | 方法 | 权限 | 说明 |
|------|------|------|------|
| `ping` | query | public | 健康检查，返回 `{ ok: true, ts: number }` |

---

## 7. 工具库 (api/lib/)

### 7.1 env.ts

加载的环境变量：

| 变量名 | 用途 |
|--------|------|
| `APP_ID` | Kimi OAuth App ID |
| `APP_SECRET` | JWT 签名密钥 + OAuth client secret |
| `DATABASE_URL` | MySQL 连接字符串 |
| `KIMI_AUTH_URL` | Kimi OAuth 授权端点 |
| `KIMI_OPEN_URL` | Kimi Open Platform 基础 URL |
| `OWNER_UNION_ID` | 自动授予 admin 角色的 unionId |
| `NODE_ENV` | 生产/开发模式判断 |

**注意**：生产环境下缺失必填变量会抛异常；开发环境允许空值。

### 7.2 cookies.ts

```ts
function getSessionCookieOptions(headers): CookieOptions {
  const localhost = isLocalhost(headers);
  return {
    httpOnly: true,
    path: "/",
    sameSite: localhost ? "Lax" : "None",
    secure: !localhost,
  };
}
```

根据请求头中的 `host` 自动判断是否为 localhost，调整 `sameSite` 和 `secure` 属性。

### 7.3 http.ts

`HttpClient` 类：
- 支持 baseURL、query params、timeout（默认 30s）
- 自动 JSON 序列化请求体
- 自动解析 JSON 响应
- AbortController 超时控制
- 提供 `.get()` / `.post()` 便捷方法

**注意**：当前后端代码中 **没有直接使用** 这个 HttpClient，Kimi 相关请求使用原生 `fetch`。

### 7.4 vite.ts

生产环境静态文件服务：
- `serveStatic({ root: "./dist/public" })` 服务静态资源
- `notFound` 处理器对 HTML 请求返回 `index.html`（SPA fallback）

---

## 8. 安全机制

| 层面 | 实现 |
|------|------|
| Session Cookie | `httpOnly: true`，非 localhost 时 `secure: true` |
| SameSite | localhost 为 `Lax`，其他为 `None` |
| OAuth state | base64 编码的 redirectUri（**无 CSRF token**） |
| Access Token 验证 | 远程 JWKS 公钥验证 |
| Session Token | HS256 对称签名，1年有效期 |
| Body Limit | 50MB |
| 权限控制 | 服务端 `authedQuery` / `adminQuery` 中间件严格校验 |
| 前端路由 | `/admin` 仅隐藏 UI，真正的保护在服务端 |

---

## 9. 关键依赖与配置

### tRPC Client 前端配置

```ts
// 来自 AGENTS.md
credentials: "include"  // 确保 cookie 随请求发送
```

### 路径别名

- `@/*` → `./src/*`
- `@contracts/*` → `./contracts/*`
- `@db/*` → `./db/*`
- `db` → `./db`（后端构建专用）

### 测试

- Vitest，Node 环境
- 测试文件：`api/**/*.test.ts` 或 `api/**/*.spec.ts`
- **当前 api 目录下没有测试文件**

---

## 10. 已知特点与潜在注意点

1. **无分页总数**：`post.list` 返回列表但不返回总条数
2. **tag 无删除/更新端点**：只有 list 和 create
3. **image 无更新端点**：只有 create 和 delete
4. **contact 无删除端点**：只有 submit 和 list
5. **HttpClient 未使用**：api/lib/http.ts 虽然存在但未被引用
6. **OAuth state 安全性**：state 仅为 base64 redirectUri，建议增加随机 CSRF token
7. **APP_SECRET 双重用途**：既是 OAuth client secret 又是 JWT 签名密钥
8. **角色自动提升**：首次 upsert 匹配 `OWNER_UNION_ID` 时设为 admin，但后续不会降级
