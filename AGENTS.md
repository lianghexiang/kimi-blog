# KimiBlog — Agent Context

> This file is auto-generated for AI coding agents. It describes the project structure, technology stack, conventions, and commands you need to know before modifying code.

---

## Project Overview

KimiBlog (internally named "Tide & Glimmer" / 潮光微录) is a full-stack personal blog application. It features a React SPA frontend and a **FastAPI** backend, both living inside the project directory. The app uses **local username/password authentication** (bcrypt hashing + JWT session cookie), **RBAC** (users → roles → permissions) for authorization, MySQL (via SQLAlchemy async ORM) for persistence, and **MinIO** (S3-compatible) for object storage. The UI is styled with Tailwind CSS in a neo-brutalism aesthetic.

Key content types:
- **Blog posts** (`blog`), **journal entries** (`journal`), and **short thoughts** (`thought`)
- **Image gallery** with album grouping (`albums` + `images`)
- **Tags** for categorizing posts (with color + usage stats)
- **Contact messages** submitted by visitors
- **Site-wide config** (`site_configs`) driving the Hero section and the built-in music player
- **About page carousel** (`about_carousel`)
- **Admin dashboard** (`/admin`) with 9 management tabs (posts, images, tags, users, roles, permissions, contacts, site config, about carousel)

All UI text is in Chinese.

---

## Technology Stack

| Layer | Tech |
|-------|------|
| Frontend | React 19, TypeScript, Vite 7, React Router 7, Tailwind CSS 3.4 |
| UI Components | shadcn/ui (40+ Radix-based components in `src/components/ui`) |
| Rich Text | Tiptap 3 editor (table, task list, image upload, Markdown via `tiptap-markdown`), mammoth (.docx import), Turndown |
| State / Forms | TanStack Query, react-hook-form, zod |
| Animation | GSAP |
| Backend | **FastAPI** (Python), Pydantic v2, SQLAlchemy 2.0 (async), asyncmy |
| Auth | Local register/login, bcrypt (`passlib`), JWT session (`python-jose`), RBAC |
| Object Storage | **MinIO** (S3-compatible) — image uploads AND post markdown bodies |
| Database | MySQL, SQLAlchemy 2.0 ORM (async), Alembic migrations (future changes) |
| Build | Vite (frontend), Uvicorn ASGI (backend) |
| Testing | Vitest (Node environment, `src/**/*.test.ts(x)` / `*.spec.ts(x)`) |
| Lint / Format | ESLint 9 + `typescript-eslint` + Prettier 3 |
| Deploy | Docker Compose (MySQL + MinIO + app), GitHub Actions + SSH deploy script |

---

## Directory Structure

```
app/                        # Frontend source
├── src/                    # React SPA source
│   ├── main.tsx            # React entry (StrictMode + BrowserRouter + QueryClientProvider)
│   ├── App.tsx             # React Router routes + global MusicPlayer
│   ├── const.ts            # Frontend constants (LOGIN_PATH)
│   ├── index.css           # Global styles + Tailwind directives (neo-border, neo-shadow)
│   ├── lib/
│   │   ├── api.ts          # REST API client (fetch wrapper, grouped by domain)
│   │   ├── toc.ts          # Table-of-contents extraction helpers
│   │   └── utils.ts        # cn() helper
│   ├── types/
│   │   ├── api.ts          # Frontend TypeScript DTO types
│   │   └── music.ts        # Music player types (MusicTrack, MusicPlayerConfig)
│   ├── hooks/
│   │   ├── useAuth.ts      # useAuth hook (React Query + api client + logout)
│   │   ├── useMusicPlayer.ts # audio playback state machine
│   │   ├── useActiveHeading.ts # scroll-spy for TOC highlight
│   │   └── use-mobile.ts   # shadcn responsive helper
│   ├── pages/              # Route-level page components
│   │   └── admin/          # Admin dashboard (9 tabs)
│   ├── sections/           # Homepage sections (Hero, About, Notes, Gallery, Footer)
│   ├── components/
│   │   ├── editor/         # Tiptap rich-text editor (TiptapEditor, toolbar, bubble/floating menus, ImageUpload)
│   │   └── ui/             # shadcn/ui primitives
│   ├── MarkdownContent.tsx # react-markdown renderer (GFM + raw HTML + slug headings)
│   ├── TableOfContents.tsx # post TOC sidebar
│   ├── MusicPlayer.tsx     # floating music player
│   ├── Navbar.tsx, TagBadge.tsx, TagFilter.tsx, TagMultiSelect.tsx,
│   ├── ImageLightbox.tsx, AuthLayout.tsx, AuthLayoutSkeleton.tsx
├── public/                 # Static assets (images, favicon)
├── package.json
├── vite.config.ts          # Vite dev server (port 3090, /api proxy → localhost:3030)
├── vitest.config.ts        # Vitest config (node env)
├── tsconfig.json           # Root project references
├── tsconfig.app.json       # Frontend TS config
├── tsconfig.node.json      # Tooling TS config
├── tailwind.config.js
├── postcss.config.js
├── eslint.config.js
├── .prettierrc
├── .env.example
└── ...

backend/                    # FastAPI backend (Python)
├── app/
│   ├── main.py             # FastAPI entry, lifespan (create_all + seed), routers, static files
│   ├── config.py           # Pydantic Settings, reads backend/.env
│   ├── database.py         # SQLAlchemy async engine + sessionmaker
│   ├── models.py           # ORM models (13 tables)
│   ├── schemas.py          # Pydantic DTO (camelCase via alias_generator)
│   ├── dependencies.py     # get_current_user, require_auth, require_permission, require_role
│   ├── seed.py             # ensure_defaults: permissions, roles, site configs, admin user
│   ├── storage.py          # MinIO client wrapper (put/get/remove object, bucket policy)
│   ├── auth/
│   │   ├── password.py     # bcrypt hash / verify
│   │   ├── session.py      # JWT sign/verify (HS256, 1 year)
│   │   └── router.py       # /api/auth/register, /login, /me, /logout
│   └── routers/
│       ├── posts.py        # /api/posts (markdown body persisted in MinIO)
│       ├── images.py       # /api/images (+ multipart /upload)
│       ├── albums.py       # /api/albums
│       ├── tags.py         # /api/tags (+ /stats)
│       ├── contacts.py     # /api/contacts
│       ├── users.py        # /api/users
│       ├── roles.py        # /api/roles (+ /permissions)
│       ├── site_configs.py # /api/site-configs
│       └── about_carousel.py # /api/about-carousel (+ /upload, /reorder)
├── alembic/                # Alembic migrations (for future schema changes)
├── alembic.ini
├── requirements.txt
└── .env.example

docs/                       # deployment guide, sample music playlist
plan/                       # design/refactor notes (historical)
scripts/deploy.sh           # SSH deployment script (invoked by GitHub Actions)
Dockerfile                  # Multi-stage build (Node build → Python runtime)
docker-compose.yml          # Production compose (db, app, minio)
docker-compose.override.yml # Dev override (port 8000 + hot reload)
.github/workflows/deploy.yml # CI/CD: deploy on push to main
```

---

## Build & Development Commands

### Frontend

All frontend commands are run from the `app/` directory.

```bash
cd app

# Development — Vite dev server on port 3090
# /api requests are proxied to FastAPI on localhost:3030 (vite.config.ts)
npm run dev

# Type check
npm run check

# Build for production
npm run build        # Outputs to app/dist/public/

# Lint
npm run lint

# Format
npm run format

# Tests
npm run test
```

### Backend

All backend commands are run from the `backend/` directory.

```bash
cd backend

# Activate virtual environment
source venv/bin/activate

# Development — Uvicorn with auto-reload on port 8000
uvicorn app.main:app --reload --port 8000

# Production (serves the SPA from app/dist/public)
uvicorn app.main:app --host 0.0.0.0 --port 3000
```

### Docker (recommended for MySQL + MinIO)

```bash
# Start MySQL + MinIO + backend (dev override: backend on 8000 with reload)
docker compose up -d

# Production
docker compose -f docker-compose.yml up --build -d
```

### Database

Requires `DATABASE_URL` in `backend/.env`.

```bash
cd backend
source venv/bin/activate

# Generate Alembic migration
alembic revision --autogenerate -m "description"

# Run migrations
alembic upgrade head
```

> On startup the app auto-creates all tables (`Base.metadata.create_all`) and seeds defaults. Alembic migrations exist for future schema changes only.

---

## Path Aliases

Configured in `vite.config.ts` and `tsconfig*.json`:

| Alias | Points to |
|-------|-----------|
| `@/*` | `./src/*` |

---

## Code Style Guidelines

- **Formatter**: Prettier (see `.prettierrc`):
  - `semi: true`
  - `singleQuote: false` (double quotes)
  - `trailingComma: "es5"`
  - `printWidth: 80`
  - `tabWidth: 2` (spaces)
  - `arrowParens: "avoid"`
  - `endOfLine: "lf"`
- **Linter**: ESLint 9 flat config. Rules cover TypeScript recommended, React Hooks, and React Refresh.
- **TypeScript**: Strict mode enabled. Unused locals and parameters are errors (`noUnusedLocals`, `noUnusedParameters`).
- **Imports**: Prefer explicit type imports where possible (`verbatimModuleSyntax` in frontend config).
- **Naming**: React components use PascalCase. FastAPI routers use snake_case. Database models use snake_case Python attributes (some keep legacy camelCase column names via explicit `Column("camelName", ...)`).
- **Backend conventions**: Pydantic response schemas use camelCase aliases (`CamelModel` base class in `schemas.py`). Permission-protected routes use `Depends(require_permission("resource:action"))`.

---

## Testing Instructions

- **Framework**: Vitest with Node environment (`vitest.config.ts`).
- **Test files**: `src/**/*.test.ts(x)` or `src/**/*.spec.ts(x)` (frontend; configured under `app/`).
- **Run**: `npm run test` (uses `vitest run`).

---

## Database Schema

Uses SQLAlchemy 2.0 ORM with MySQL dialect (asyncmy driver). 13 tables total (3 junction tables).

| Table | Purpose |
|-------|---------|
| `users` | Local accounts (`username`, `password_hash`, email, avatar, is_active, last_sign_in_at) |
| `roles` | RBAC roles (`admin`, `user`) |
| `permissions` | Fine-grained permissions (`resource` + `action`, e.g. `posts:create`) |
| `user_roles` | Many-to-many junction: users ↔ roles |
| `role_permissions` | Many-to-many junction: roles ↔ permissions |
| `posts` | Post metadata (`type`: blog/journal/thought, `status`, slug, cover_image; `content` column stores the MinIO object path `posts/{slug}.md`, NOT the body) |
| `albums` | Gallery album categories |
| `images` | Gallery photos (title, description, url → MinIO, album, sort_order) |
| `tags` | Post tags (name, color hex) |
| `post_tags` | Many-to-many junction: posts ↔ tags (composite PK: post_id + tag_id) |
| `contacts` | Visitor contact form submissions (name, email, message) |
| `site_configs` | KV site configuration (Hero copy/colors, `music_playlist` JSON, etc.) |
| `about_carousel` | About page carousel items (image_url, caption, sort_order) |

---

## Authentication & Authorization

### Local Account Flow (no longer Kimi OAuth)

1. User registers or logs in via `POST /api/auth/register` / `POST /api/auth/login`.
2. Passwords are hashed with bcrypt (`app/auth/password.py`).
3. On success a session JWT is signed (`app/auth/session.py`) and stored in an HTTP-only cookie named `kimi_sid` (legacy name — kept for compatibility).
4. New registrations are assigned the `user` role. The seed script creates a default `admin / admin123` account on first startup.

### Session
- Cookie name: `kimi_sid`
- Max age: 1 year; `httpOnly`; `secure` only over HTTPS; `SameSite=Lax`.

### RBAC Model
- Users have many roles; roles have many permissions (see `user_roles` / `role_permissions`).
- Default roles: `admin` (all permissions) and `user`.
- Permissions are named `resource:action` (e.g. `posts:create`, `users:read`). The full list is defined in `backend/app/seed.py` (`DEFAULT_PERMISSIONS`).

### FastAPI Dependencies (`app/dependencies.py`)
- `get_current_user`: Reads `kimi_sid` cookie, verifies JWT, loads user with roles+permissions. Returns `User | None`.
- `require_auth`: Depends on `get_current_user`. Returns 401 if not logged in.
- `require_permission("resource:action")`: Depends on `require_auth`. Returns 403 if the user's roles lack the permission.
- `require_role("admin")`: Depends on `require_auth`. Returns 403 if the user lacks the role.

---

## API Architecture

- **FastAPI** handles all HTTP routes under `/api/*`.
- Routers are organized by domain: `auth`, `posts`, `images`, `albums`, `tags`, `contacts`, `users`, `roles`, `site_configs`, `about_carousel`.
- Input validation uses **Pydantic v2** schemas.
- All API responses use camelCase JSON keys (via Pydantic `alias_generator` on `CamelModel`).

### REST Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/ping` | public | Health check |
| POST | `/api/auth/register` | public | Register account |
| POST | `/api/auth/login` | public | Login, sets `kimi_sid` cookie |
| GET | `/api/auth/me` | authed | Current user (roles + permissions) |
| POST | `/api/auth/logout` | authed | Clear session cookie |
| GET | `/api/users` | `users:read` | List users |
| GET | `/api/users/{id}` | authed | Get user (self or admin) |
| POST | `/api/users` | `users:create` | Create user |
| PUT | `/api/users/{id}` | authed | Update user (self or admin) |
| DELETE | `/api/users/{id}` | `users:delete` | Delete user |
| GET | `/api/roles` | `roles:read` | List roles |
| GET | `/api/roles/permissions` | `roles:read` | List all permissions |
| POST | `/api/roles` | `roles:create` | Create role |
| PUT | `/api/roles/{id}` | `roles:update` | Update role |
| DELETE | `/api/roles/{id}` | `roles:delete` | Delete role |
| GET | `/api/posts?type&status&tag&limit&offset` | public | List posts (markdown body omitted) |
| GET | `/api/posts/{slug}` | public | Single post with tags + markdown body |
| POST | `/api/posts` | `posts:create` | Create post (writes markdown to MinIO) |
| PUT | `/api/posts/{id}` | `posts:update` | Update post |
| DELETE | `/api/posts/{id}` | `posts:delete` | Delete post |
| GET | `/api/images?album=` | public | List images |
| GET | `/api/images/albums` | public | Distinct album names |
| POST | `/api/images/upload` | `images:create` | Multipart image upload → MinIO |
| POST | `/api/images` | `images:create` | Create image record (existing URL) |
| DELETE | `/api/images/{id}` | `images:delete` | Delete image |
| GET | `/api/albums` | public | List albums |
| POST | `/api/albums` | `images:create` | Create album |
| DELETE | `/api/albums/{id}` | `images:delete` | Delete album |
| GET | `/api/tags` | public | List tags |
| GET | `/api/tags/stats` | public | Post count per tag |
| POST | `/api/tags` | `tags:create` | Create tag |
| PUT | `/api/tags/{id}` | `tags:create` | Update tag |
| DELETE | `/api/tags/{id}` | `tags:create` | Delete tag |
| POST | `/api/contacts` | public | Submit contact message |
| GET | `/api/contacts` | `contacts:read` | List contacts |
| GET | `/api/site-configs` | public | List site configs (auto-creates missing defaults) |
| PUT | `/api/site-configs` | `site_configs:update` | Upsert configs (JSON body `{ configs: { key: value } }`) |
| GET | `/api/about-carousel` | public | List carousel items (ordered) |
| POST | `/api/about-carousel` | `about_carousel:create` | Create carousel item |
| POST | `/api/about-carousel/upload` | `about_carousel:create` | Multipart image upload |
| PUT | `/api/about-carousel/{id}` | `about_carousel:update` | Update carousel item |
| PUT | `/api/about-carousel/reorder` | `about_carousel:update` | Batch reorder |
| DELETE | `/api/about-carousel/{id}` | `about_carousel:delete` | Delete carousel item |

> Upload endpoints (`/images/upload`, `/about-carousel/upload`) accept only `jpg/jpeg/png/webp/gif`, max 5MB.

---

## Object Storage (MinIO)

- All image uploads and post markdown bodies are stored in MinIO (`backend/app/storage.py`).
- Object layout: `images/{uuid}.{ext}` for gallery photos, `posts/{slug}.md` for post bodies, `about-carousel/{uuid}.{ext}` for carousel images.
- The bucket is auto-created with a public-read policy on first upload; public URLs are generated from `MINIO_PUBLIC_URL` or `endpoint/bucket/object`.
- Frontend uses `@aws-sdk/client-s3` for presigned S3 URLs where needed.

---

## Frontend Architecture

- **SPA** with `BrowserRouter` + `QueryClientProvider` (see `main.tsx`).
- **React Query** for server state (`@tanstack/react-query`).
- **Custom hook `useAuth`** wraps `api.auth.me` query, logout mutation, optional redirect logic, and exposes `isAdmin` (checks the `admin` role).
- **shadcn/ui** components are located in `src/components/ui/` and imported via `@/components/ui/<name>`.
- **Sections** (`src/sections/`) are large homepage blocks (Hero, About, Notes, Gallery, Footer).
- **Pages** (`src/pages/`) map 1:1 to routes defined in `App.tsx`.
- **API Client** (`src/lib/api.ts`) is a thin `fetch` wrapper with `credentials: "include"` (cookie auth), grouped by domain (auth, users, roles, posts, images, albums, tags, contacts, siteConfigs, aboutCarousel).
- **Hero section** reads its text/colors from `site_configs`; the global **MusicPlayer** reads the `music_playlist` site config (JSON).
- Post rendering uses `MarkdownContent` (react-markdown + GFM + rehype-slug) with a scroll-spy `TableOfContents`.
- The admin editor is a **Tiptap** rich-text editor with Markdown import/export (`tiptap-markdown`), Word `.docx` import (`mammoth`), and image upload.

### Routes
| Path | Page |
|------|------|
| `/` | Home (Hero + sections) |
| `/blog` | Blog listing |
| `/blog/:slug` | Individual blog post |
| `/journal` | Journal listing |
| `/thoughts` | Thoughts listing |
| `/gallery` | Gallery page |
| `/tags` | Tag index page |
| `/admin` | Admin dashboard (admin-only UI; server enforces permissions) |
| `/login` | Login page |

---

## Environment Variables

Copy `backend/.env.example` to `backend/.env` (and `app/.env.example` to `app/.env` if needed), then fill in values. `config.py` reads from `backend/.env`.

#### Backend (`backend/.env` / `app/config.py`)

```bash
APP_SECRET=               # REQUIRED — JWT signing secret
DATABASE_URL=             # REQUIRED — mysql://user:pass@host:port/db
APP_ID=                   # Legacy Kimi OAuth app ID (unused by current auth)
KIMI_AUTH_URL=            # Legacy Kimi OAuth base URL (unused)
KIMI_OPEN_URL=            # Legacy Kimi Open Platform base URL (unused)
OWNER_UNION_ID=           # Legacy owner union ID (unused; admin is seeded instead)
ADMIN_USERNAME=           # Default admin username (config; seed uses hardcoded "admin")
ADMIN_PASSWORD=           # Default admin password (config; seed uses hardcoded "admin123")
CORS_ORIGINS=             # Comma-separated allowed origins (defaults to localhost:3000/5000)
MINIO_ENDPOINT=           # e.g. localhost:9000
MINIO_ACCESS_KEY=         # e.g. minioadmin
MINIO_SECRET_KEY=
MINIO_BUCKET=             # default blog-uploads
MINIO_SECURE=             # false for local http
MINIO_PUBLIC_URL=         # optional public base URL for MinIO objects
```

#### Frontend (`app/.env`)

```bash
VITE_KIMI_AUTH_URL=       # Legacy (unused — auth is local username/password now)
VITE_APP_ID=              # Legacy (unused)
```

> FastAPI reads `.env` from `backend/.env`. The `DATABASE_URL` must use the `mysql://` scheme; `database.py` automatically converts it to `mysql+asyncmy://` internally.

---

## Deployment

### Docker Compose (recommended)

`docker-compose.yml` orchestrates three services:

| Service | Image | Host port | Purpose |
|---------|-------|-----------|---------|
| `db` | `mysql:8.0` | `3307:3306` | Persistence |
| `minio` | `minio/minio` | `9005:9000`, `9006:9001` | Object storage |
| `app` | built from `Dockerfile` | `3030:5000` | FastAPI + SPA (production) |

Production deploy:

```bash
cp backend/.env.example .env   # then fill in values at the repo root
docker compose -f docker-compose.yml up --build -d
```

- Tables and seed data (permissions, roles, site configs, admin account) are created automatically on first startup — no manual migration step needed.
- FastAPI serves the built SPA from `app/dist/public/` and falls back to `index.html` for unknown non-API routes (SPA routing).
- The app container listens on `$PORT` (default 3000; Compose sets 5000).

### CI/CD

`.github/workflows/deploy.yml` runs on every push to `main`: it SSHs into the production server and executes `scripts/deploy.sh` (git pull → load `.env` → `docker compose up --build -d` → health check on `/api/ping`). Requires secrets: `SERVER_SSH_KEY`, `SERVER_HOST`, `SERVER_USER`.

### Manual (no Docker)

```bash
cd app && npm run build                              # → app/dist/public
cd ../backend && source venv/bin/activate
uvicorn app.main:app --host 0.0.0.0 --port 3000      # serves SPA + API
```

---

## Security Considerations

- **Session cookie** (`kimi_sid`) is `httpOnly`; `secure` is only set over HTTPS.
- **Passwords** are bcrypt-hashed; never log or store plaintext.
- **Authorization** is enforced server-side via `require_permission`; the frontend only hides UI.
- **Default admin** `admin / admin123` is seeded on first startup — change the password immediately after first login (via 用户管理).
- **Uploads** are restricted to image types (jpg/jpeg/png/webp/gif) and 5MB; the MinIO bucket is set to public-read, so do not upload sensitive data.
- **Body limit** should be controlled at the reverse proxy level (Nginx) or via FastAPI middleware.
- **Secrets**: `APP_SECRET` is the JWT signing key. Keep it private and strong (≥32 chars).
- **CORS**: development defaults allow `localhost`; configure `CORS_ORIGINS` for production domains.
- Some legacy Kimi OAuth configuration remains (env vars, cookie name, Docker build args) but the OAuth flow itself has been removed — do not rely on it.

---

## Notes for Agents

- The project root for frontend work is `app/`. Backend work is in `backend/`.
- When adding a new FastAPI router, register it in `backend/app/main.py`.
- When adding a new database table, define it in `backend/app/models.py`; startup `create_all` + `seed.py` will apply it, and a matching Alembic migration should be generated for consistency.
- When adding a new permission, add it to `DEFAULT_PERMISSIONS` in `backend/app/seed.py` (admin role picks up new permissions automatically on next startup).
- Post bodies are **not** stored in the `posts.content` DB column — that column holds the MinIO object path. Read/write markdown through `app/storage.py` helpers (`_read_markdown` / `_write_markdown` in `posts.py`).
- Site-wide copy (Hero text/colors, music playlist) lives in the `site_configs` table, editable from 站点配置 tab — do not hardcode these in components.
- shadcn/ui components are pre-installed; add new ones by placing them in `src/components/ui/` following the existing patterns.
- UI copy is in Chinese; keep new user-facing text in Chinese unless explicitly asked otherwise.
- The frontend uses custom Tailwind classes like `neo-border` and `neo-shadow`; these are defined in `src/index.css`.
- When modifying this file (`AGENTS.md`), keep it in sync with actual code changes.
