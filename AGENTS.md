# KimiBlog — Agent Context

> This file is auto-generated for AI coding agents. It describes the project structure, technology stack, conventions, and commands you need to know before modifying code.

---

## Project Overview

KimiBlog (internally named "Tide & Glimmer" / 潮光微录) is a full-stack personal blog application. It features a React SPA frontend and a Hono + tRPC backend, both written in TypeScript and living inside the `app/` directory. The app uses Kimi OAuth for authentication, MySQL (via Drizzle ORM) for persistence, and is styled with Tailwind CSS in a neo-brutalism aesthetic.

Key content types:
- **Blog posts** (`blog`), **journal entries** (`journal`), and **short thoughts** (`thought`)
- **Image gallery** with album grouping
- **Tags** for categorizing posts
- **Contact messages** submitted by visitors
- **Admin dashboard** (`/admin`) for content management

All UI text is in Chinese.

---

## Technology Stack

| Layer | Tech |
|-------|------|
| Frontend | React 19, TypeScript, Vite 7, React Router 7, Tailwind CSS 3.4 |
| UI Components | shadcn/ui (40+ Radix-based components in `src/components/ui`) |
| Animation | GSAP |
| Backend | Hono 4 (web framework), tRPC 11 (type-safe API), SuperJSON |
| Auth | Kimi OAuth 2.0 + custom session JWT (`jose`) |
| Database | MySQL, Drizzle ORM (PlanetScale mode), `mysql2` driver |
| Build | Vite (frontend), esbuild (backend bundle) |
| Testing | Vitest (Node environment) |
| Lint / Format | ESLint 9 + `typescript-eslint` + Prettier 3 |

---

## Directory Structure

```
app/
├── api/                    # Backend source
│   ├── boot.ts             # Hono app entry + tRPC adapter mount
│   ├── router.ts           # tRPC root router
│   ├── auth-router.ts      # tRPC auth sub-router (me, logout)
│   ├── context.ts          # tRPC context builder (reads session cookie)
│   ├── middleware.ts       # tRPC middleware: public, authed, admin procedures
│   ├── kimi/               # Kimi platform integration
│   │   ├── auth.ts         # OAuth callback handler, request auth
│   │   ├── platform.ts     # Kimi Open API wrappers
│   │   ├── session.ts      # Session JWT sign/verify
│   │   └── types.ts        # Shared types for Kimi APIs
│   ├── lib/                # Backend utilities
│   │   ├── env.ts          # Environment variable loader
│   │   ├── cookies.ts      # Session cookie options (secure vs localhost)
│   │   ├── http.ts         # HTTP helpers
│   │   └── vite.ts         # Static file serving for production
│   ├── queries/            # Database query helpers
│   │   ├── connection.ts   # Drizzle DB singleton
│   │   └── users.ts        # User lookup / upsert
│   └── routers/            # tRPC domain routers
│       ├── post.ts
│       ├── image.ts
│       ├── tag.ts
│       └── contact.ts
├── contracts/              # Shared code between frontend and backend
│   ├── constants.ts        # Cookie names, paths, error messages
│   ├── errors.ts           # AppError factory
│   └── types.ts            # Re-exports from db/schema + errors
├── db/                     # Database schema and tools
│   ├── schema.ts           # Drizzle table definitions
│   ├── relations.ts        # Drizzle relations
│   ├── migrations/         # Drizzle Kit generated migrations
│   ├── seed.ts             # Seed script with demo data
│   └── drop-tables.ts      # Helper to drop tables
├── src/                    # Frontend source
│   ├── main.tsx            # React entry (StrictMode + BrowserRouter + TRPCProvider)
│   ├── App.tsx             # React Router routes
│   ├── const.ts            # Frontend constants (LOGIN_PATH)
│   ├── index.css           # Global styles + Tailwind directives
│   ├── pages/              # Route-level page components
│   ├── sections/           # Homepage sections (Hero, About, Notes, Gallery, Footer)
│   ├── components/         # Reusable components + UI primitives
│   ├── hooks/              # Custom hooks (useAuth, use-mobile)
│   ├── providers/          # Context providers (trpc.tsx)
│   └── lib/                # Frontend utilities (cn helper)
├── public/                 # Static assets (images, favicon)
├── package.json
├── vite.config.ts
├── tsconfig.json           # Root project references
├── tsconfig.app.json       # Frontend TS config
├── tsconfig.server.json    # Backend TS config
├── tsconfig.node.json      # Tooling TS config
├── drizzle.config.ts
├── vitest.config.ts
├── tailwind.config.js
├── postcss.config.js
├── eslint.config.js
├── .prettierrc
├── Dockerfile
└── .env.example
```

---

## Build & Development Commands

All commands are run from the `app/` directory.

```bash
# Development — Vite dev server on port 3000
# Hono backend is served via @hono/vite-dev-server (entry: api/boot.ts)
npm run dev

# Type check
npm run check

# Build for production
# 1. Vite builds frontend to dist/public/
# 2. esbuild bundles api/boot.ts to dist/boot.js (Node ESM)
npm run build

# Start production server
npm run start

# Lint
npm run lint

# Format
npm run format

# Tests
npm run test

# Database — requires DATABASE_URL in .env
npm run db:generate   # Generate Drizzle migrations
npm run db:migrate    # Run migrations
npm run db:push       # Push schema changes (dev only)

# Seed data (one-off Node script)
npx tsx db/seed.ts
```

---

## Path Aliases

Configured in `vite.config.ts` and `tsconfig.json`:

| Alias | Points to |
|-------|-----------|
| `@/*` | `./src/*` |
| `@contracts/*` | `./contracts/*` |
| `@db/*` | `./db/*` |

The backend build also supports `db` as a direct alias to `./db` (used in some imports).

---

## Code Style Guidelines

- **Formatter**: Prettier with the following key settings (see `.prettierrc`):
  - `semi: true`
  - `singleQuote: false` (double quotes)
  - `trailingComma: "es5"`
  - `printWidth: 80`
  - `tabWidth: 2` (spaces)
  - `endOfLine: "lf"`
- **Linter**: ESLint 9 flat config. Rules cover TypeScript recommended, React Hooks, and React Refresh.
- **TypeScript**: Strict mode enabled. Unused locals and parameters are errors (`noUnusedLocals`, `noUnusedParameters`).
- **Imports**: Prefer explicit type imports where possible (`verbatimModuleSyntax` in frontend config).
- **Naming**: React components use PascalCase. tRPC routers use camelCase. Database schemas use camelCase TypeScript identifiers with snake_case SQL column names.

---

## Testing Instructions

- **Framework**: Vitest with Node environment.
- **Test files**: `api/**/*.test.ts` or `api/**/*.spec.ts`.
- **Run**: `npm run test` (uses `vitest run`).
- There are currently no frontend-specific test configurations; Vitest is focused on backend/API logic.

---

## Database Schema

Uses Drizzle ORM with MySQL dialect (PlanetScale mode).

| Table | Purpose |
|-------|---------|
| `users` | OAuth users (`unionId`, name, email, avatar, role: `user`/`admin`) |
| `posts` | Articles (`type`: blog/journal/thought, `status`: published/draft, slug, coverImage) |
| `images` | Gallery photos (title, description, url, album, sortOrder) |
| `tags` | Post tags (name, color hex) |
| `post_tags` | Many-to-many junction between posts and tags |
| `contacts` | Visitor contact form submissions (name, email, message) |

- Relations are defined in `db/relations.ts`.
- Migrations live in `db/migrations/`.
- Seed script (`db/seed.ts`) creates demo posts, journal entries, thoughts, tags, and gallery images.

---

## Authentication & Authorization

### OAuth Flow (Kimi)
1. User clicks "Sign in with Kimi" on `/login`.
2. Frontend constructs OAuth URL using `VITE_KIMI_AUTH_URL` and `VITE_APP_ID`.
3. Callback hits `/api/oauth/callback` (handled by `api/kimi/auth.ts`).
4. Backend exchanges code for access token, verifies it via JWKS, fetches user profile from Kimi Open API, upserts user in DB.
5. A session JWT is signed (`api/kimi/session.ts`) and stored in an HTTP-only cookie named `kimi_sid`.

### Session
- Cookie name: `kimi_sid`
- Max age: 1 year
- Secure on non-localhost; SameSite=`Lax` on localhost, `None` otherwise.

### Roles
- `user`: Default for all logged-in users.
- `admin`: Granted automatically to the user whose `unionId` matches `OWNER_UNION_ID` on first login.

### tRPC Middleware
- `publicQuery`: No auth required.
- `authedQuery`: Requires valid session (returns 401 otherwise).
- `adminQuery`: Requires `role === "admin"` (returns 403 otherwise).

---

## API Architecture

- **Hono** handles raw HTTP (OAuth callback, body limit, static files in prod).
- **tRPC** handles all data API under `/api/trpc/*`.
- Routers are organized by domain: `auth`, `post`, `image`, `tag`, `contact`.
- Context (`api/context.ts`) resolves the current user from the session cookie for every tRPC request.
- Input validation uses **Zod** schemas inside tRPC procedures.

---

## Frontend Architecture

- **SPA** with `BrowserRouter`.
- **tRPC + React Query** for server state (`@tanstack/react-query`).
- **Custom hook `useAuth`** wraps `trpc.auth.me` and handles logout + optional redirect logic.
- **shadcn/ui** components are located in `src/components/ui/` and imported via `@/components/ui/<name>`.
- **Sections** (`src/sections/`) are large homepage blocks (Hero, About, Notes, Gallery, Footer).
- **Pages** (`src/pages/`) map 1:1 to routes defined in `App.tsx`.

### Routes
| Path | Page |
|------|------|
| `/` | Home (Hero + sections) |
| `/blog` | Blog listing |
| `/blog/:slug` | Individual blog post |
| `/journal` | Journal listing |
| `/thoughts` | Thoughts listing |
| `/gallery` | Gallery page |
| `/admin` | Admin dashboard (admin-only UI) |
| `/login` | Login page |

---

## Environment Variables

Copy `.env.example` to `.env` and fill in values.

```bash
# Backend
APP_ID=                   # Kimi OAuth app ID
APP_SECRET=               # JWT signing secret + OAuth client secret
DATABASE_URL=             # mysql://user:pass@host:port/db

# Frontend (Vite exposes VITE_* vars to browser)
VITE_KIMI_AUTH_URL=       # Kimi OAuth authorize endpoint base URL
VITE_APP_ID=              # Same as APP_ID

# Backend auth endpoints
KIMI_AUTH_URL=            # Same as VITE_KIMI_AUTH_URL (backend side)
KIMI_OPEN_URL=            # Kimi Open Platform base URL

# Admin
OWNER_UNION_ID=           # First user with this unionId gets admin role
```

> In development, Vite loads `.env` automatically. In production, the backend reads them via `dotenv/config`.

---

## Deployment

A `Dockerfile` is provided with a multi-stage build:
1. `deps` — installs dependencies with npm ci.
2. `build` — runs `npm run build`.
3. `production` — copies `node_modules`, `dist/`, `package.json`, and `.env`, then runs `npm start`.

The production server:
- Serves static files from `dist/public/` via Hono's `serveStatic`.
- Falls back to `index.html` for unknown non-API routes (SPA behavior).
- Listens on port `3000` (or `$PORT`).

---

## Security Considerations

- **Session cookies** are `httpOnly`. Secure flag is enabled outside localhost.
- **Body limit** is set to 50 MB on Hono (`hono/body-limit`).
- **OAuth state** is base64-encoded redirect URI; consider adding a CSRF token if state needs stronger protection.
- **Admin routes** are protected server-side by `adminQuery` middleware; frontend only hides UI.
- **Secrets**: `APP_SECRET` is used both as OAuth client secret and JWT signing key. Keep it private.
- **CORS / Credentials**: tRPC client is configured with `credentials: "include"` so cookies are sent with every request.

---

## Notes for Agents

- The project root for all development work is `app/`. Do not create files outside this directory unless asked.
- When adding a new tRPC router, register it in `api/router.ts`.
- When adding a new database table, define it in `db/schema.ts`, add relations in `db/relations.ts`, and run `npm run db:generate` followed by `npm run db:migrate`.
- shadcn/ui components are pre-installed; add new ones by placing them in `src/components/ui/` following the existing patterns.
- UI copy is in Chinese; keep new user-facing text in Chinese unless explicitly asked otherwise.
- The frontend uses custom Tailwind classes like `neo-border` and `neo-shadow`; these are defined in `src/index.css`.
