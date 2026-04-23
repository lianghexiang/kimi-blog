# KimiBlog 项目结构文档

## 一、项目概述

**KimiBlog** 是一个基于 **React 19 + TypeScript + Vite** 构建的个人博客/内容管理系统。采用前后端一体化的 monorepo 架构：

- **前端**：React Router 进行页面路由，tRPC + TanStack Query 进行数据请求
- **后端**：Hono + tRPC 提供类型安全的 API 服务
- **数据库**：MySQL，通过 Drizzle ORM 进行数据管理
- **认证**：接入 Kimi OAuth 2.0 开放平台

---

## 二、技术栈总览

| 层级 | 技术选型 |
|------|---------|
| **前端框架** | React 19 + TypeScript |
| **构建工具** | Vite 7 + esbuild |
| **路由** | React Router v7 |
| **状态管理 / 请求** | tRPC + TanStack Query (React Query) |
| **UI 组件库** | Radix UI + Tailwind CSS + shadcn/ui (40+ 组件) |
| **动画** | GSAP |
| **后端框架** | Hono (轻量级 Web 框架) |
| **API 方案** | tRPC (端到端类型安全) |
| **数据库** | MySQL + Drizzle ORM |
| **认证** | Kimi OAuth 2.0 + JWT (jose) |
| **对象存储** | AWS S3 |
| **测试** | Vitest |

---

## 三、目录结构详解

```
KimiBlog/app/
├── api/                          # 后端 API 服务 (Hono + tRPC)
│   ├── boot.ts                   # 服务器入口：注册中间件、路由、启动服务
│   ├── router.ts                 # tRPC 根路由聚合器
│   ├── context.ts                # tRPC 上下文构建 (认证、请求信息)
│   ├── middleware.ts             # tRPC 中间件 (public/authed/admin 权限控制)
│   ├── auth-router.ts            # 认证路由 (me / logout)
│   ├── kimi/                     # Kimi 平台 OAuth 集成
│   │   ├── auth.ts               # OAuth 回调、Token 交换、请求认证
│   │   ├── platform.ts           # Kimi 用户资料 API
│   │   ├── session.ts            # Session Token 签发与校验
│   │   └── types.ts              # Kimi API 类型定义
│   ├── lib/                      # 后端工具库
│   │   ├── env.ts                # 环境变量管理
│   │   ├── cookies.ts            # Cookie 配置工具
│   │   ├── http.ts               # HTTP 工具
│   │   └── vite.ts               # 生产环境静态文件服务
│   ├── queries/                  # 数据库查询层
│   │   ├── connection.ts         # Drizzle DB 连接实例
│   │   └── users.ts              # 用户相关查询
│   └── routers/                  # 业务路由 (tRPC sub-routers)
│       ├── post.ts               # 文章 CRUD (博客/日记/随想)
│       ├── image.ts              # 图库管理
│       ├── tag.ts                # 标签管理
│       └── contact.ts            # 留言/联系表单
│
├── contracts/                    # 前后端共享约定
│   ├── constants.ts              # 常量 (Session 配置、错误消息、路径)
│   ├── errors.ts                 # 错误类型定义
│   └── types.ts                  # 共享类型导出 (复用 db/schema)
│
├── db/                           # 数据库层 (Drizzle ORM)
│   ├── schema.ts                 # 数据库表结构定义 (users/posts/images/tags/contacts)
│   ├── relations.ts              # 表关系定义
│   ├── migrations/               # 数据库迁移文件目录
│   ├── seed.ts                   # 数据库种子数据
│   └── drop-tables.ts            # 删表脚本
│
├── src/                          # 前端源码
│   ├── main.tsx                  # React 应用入口
│   ├── App.tsx                   # 根组件：定义全局路由表
│   ├── App.css                   # 应用级样式
│   ├── index.css                 # 全局样式 / Tailwind 导入
│   ├── const.ts                  # 前端常量 (LOGIN_PATH 等)
│   │
│   ├── components/               # 组件层
│   │   ├── ui/                   # shadcn/ui 基础组件 (40+)
│   │   ├── Navbar.tsx            # 导航栏
│   │   ├── AuthLayout.tsx        # 认证布局
│   │   ├── AuthLayoutSkeleton.tsx# 认证加载骨架屏
│   │   └── CustomCursor.tsx      # 自定义鼠标光标
│   │
│   ├── pages/                    # 页面级组件 (对应路由)
│   │   ├── Home.tsx              # 首页 (聚合 Hero/About/Notes/Gallery/Footer)
│   │   ├── Blog.tsx              # 博客列表页
│   │   ├── BlogPost.tsx          # 博客详情页
│   │   ├── Journal.tsx           # 日记页
│   │   ├── Thoughts.tsx          # 随想页
│   │   ├── GalleryPage.tsx       # 图库页
│   │   ├── Admin.tsx             # 管理后台
│   │   ├── Login.tsx             # 登录页
│   │   └── NotFound.tsx          # 404 页
│   │
│   ├── sections/                 # 首页区块组件
│   │   ├── Hero.tsx              # 首屏大图
│   │   ├── About.tsx             # 关于我
│   │   ├── Notes.tsx             # 笔记/文章预览
│   │   ├── Gallery.tsx           # 精选图库
│   │   └── Footer.tsx            # 页脚
│   │
│   ├── hooks/                    # 自定义 Hooks
│   │   ├── useAuth.ts            # 认证状态管理 (查询用户/登出/重定向)
│   │   └── use-mobile.ts         # 移动端检测
│   │
│   ├── providers/                # React Context Providers
│   │   └── trpc.tsx              # tRPC + QueryClient Provider 配置
│   │
│   └── lib/                      # 前端工具库
│       └── utils.ts              # cn() 等通用工具函数
│
├── public/                       # 静态资源
│   ├── avatar-girl.png
│   ├── bg-desk.jpg
│   └── photo-*.jpg/png           # 示例图片资源
│
├── docs/                         # 项目文档
│   └── project-structure.md      # 本文档
│
├── 配置文件
│   ├── vite.config.ts            # Vite 配置 (含 Hono dev server 插件)
│   ├── tsconfig.json             # TypeScript 项目引用配置
│   ├── tsconfig.app.json         # 前端 TS 配置
│   ├── tsconfig.server.json      # 后端 TS 配置
│   ├── tailwind.config.js        # Tailwind 主题配置
│   ├── postcss.config.js         # PostCSS 配置
│   ├── drizzle.config.ts         # Drizzle ORM 配置
│   ├── eslint.config.js          # ESLint 配置
│   ├── vitest.config.ts          # 测试配置
│   └── Dockerfile                # 容器化部署配置
│
└── package.json                  # 项目依赖与脚本
```

---

## 四、核心架构说明

### 1. 前后端一体化架构
- **开发模式**：Vite 通过 `@hono/vite-dev-server` 插件同时启动前端 dev server 和后端 API 服务，请求以 `/api/*` 透传给 Hono。
- **生产模式**：`npm run build` 先构建前端产物到 `dist/public/`，再用 esbuild 打包后端入口 `api/boot.ts` 为 `dist/boot.js`，最后通过 `node dist/boot.js` 启动服务，Hono 同时 serving 静态文件和 API。

### 2. 类型安全通信
- 全栈使用 **tRPC** + **Zod** 进行端到端类型安全的 API 调用，前端通过 `@trpc/react-query` 自动获得类型提示和缓存管理。
- 前后端共享 `contracts/` 和 `db/schema.ts` 中的类型定义。

### 3. 权限控制层级
后端通过三个中间件实现细粒度权限：
- `publicQuery`：公开接口
- `authedQuery`：需登录（校验 Session Cookie）
- `adminQuery`：需管理员角色

### 4. 数据库模型 (db/schema.ts)

| 表名 | 用途 |
|------|------|
| `users` | 用户资料 (unionId, name, avatar, role) |
| `posts` | 内容文章 (blog/journal/thought) |
| `images` | 图库照片 |
| `tags` | 文章标签 |
| `post_tags` | 文章-标签关联表 |
| `contacts` | 访客留言 |

### 5. 认证流程 (Kimi OAuth)
1. 用户点击登录 → 跳转 Kimi 授权页
2. 授权成功后回调 `/api/oauth/callback`
3. 后端用 `code` 换取 `access_token`
4. 验证 JWT 并获取用户资料
5. 签发 Session Cookie (`kimi_sid`) 写入浏览器
6. 后续请求携带 Cookie，`authenticateRequest` 校验 Session

---

## 五、关键脚本命令

| 命令 | 作用 |
|------|------|
| `npm run dev` | 启动 Vite 开发服务器 (前后端同端口 3000) |
| `npm run build` | 构建前端 + 打包后端 |
| `npm run start` | 生产环境启动 Node 服务 |
| `npm run db:generate` | 生成 Drizzle 迁移文件 |
| `npm run db:migrate` | 执行数据库迁移 |
| `npm run db:push` | 推送 schema 变更到数据库 |
| `npm run check` | TypeScript 类型检查 |
| `npm run lint` | ESLint 代码检查 |
| `npm run test` | Vitest 运行测试 |

---

## 六、项目特色总结

1. **现代全栈技术栈**：React 19 + Vite + Hono + tRPC + Drizzle，紧跟社区主流。
2. **一体化开发体验**：单个仓库、同构 TypeScript、共享类型，开发效率高。
3. **丰富的 UI 能力**：基于 Radix + Tailwind 的 shadcn/ui 提供 40+ 无障碍组件。
4. **内容多态管理**：一套 `posts` 表通过 `type` 字段区分博客、日记、随想三种内容形态。
5. **OAuth 集成**：内置 Kimi 开放平台登录，适合国内生态。
6. **生产就绪**：包含 Docker 支持、环境变量管理、静态文件服务、Cookie 安全策略。
