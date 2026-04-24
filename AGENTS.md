# KimiBlog — Agent Context

> This file is auto-generated for AI coding agents. It describes the project structure, technology stack, conventions, and commands you need to know before modifying code.

---

## Project Overview

KimiBlog (internally named "Tide & Glimmer" / 潮光微录) is a full-stack personal blog application. It features a React SPA frontend and a **FastAPI** backend, both living inside the project directory. The app uses Kimi OAuth for authentication, MySQL (via SQLAlchemy async ORM) for persistence, and is styled with Tailwind CSS in a neo-brutalism aesthetic.

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
| Backend | **FastAPI** (Python), Pydantic v2, SQLAlchemy 2.0 (async), asyncmy |
| Auth | Kimi OAuth 2.0 + custom session JWT (`python-jose`) |
| Database | MySQL, SQLAlchemy 2.0 ORM (async), Alembic migrations |
| Build | Vite (frontend), Uvicorn ASGI (backend) |
| Testing | Vitest (Node environment) |
| Lint / Format | ESLint 9 + `typescript-eslint` + Prettier 3 |

---

## Directory Structure

```
app/                        # Frontend source
├── src/                    # React SPA source
│   ├── main.tsx            # React entry (StrictMode + BrowserRouter + QueryClientProvider)
│   ├── App.tsx             # React Router routes
│   ├── const.ts            # Frontend constants (LOGIN_PATH)
│   ├── index.css           # Global styles + Tailwind directives
│   ├── lib/api.ts          # REST API client (fetch wrapper)
│   ├── types/api.ts        # Frontend TypeScript DTO types
│   ├── hooks/useAuth.ts    # useAuth hook (React Query + api client)
│   ├── pages/              # Route-level page components
│   ├── sections/           # Homepage sections (Hero, About, Notes, Gallery, Footer)
│   ├── components/         # Reusable components + UI primitives
│   └── providers/          # (removed tRPC provider)
├── public/                 # Static assets (images, favicon)
├── package.json
├── vite.config.ts          # Vite dev server with /api proxy to FastAPI
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
│   ├── main.py             # FastAPI entry, register routers, static files
│   ├── config.py           # Pydantic Settings, reads backend/.env
│   ├── database.py         # SQLAlchemy async engine + sessionmaker
│   ├── models.py           # ORM models (6 tables)
│   ├── schemas.py          # Pydantic DTO (Request / Response)
│   ├── dependencies.py     # get_db, get_current_user, require_auth, require_admin
│   ├── auth/
│   │   ├── oauth.py        # Kimi OAuth callback + cookie handling
│   │   ├── session.py      # JWT sign/verify (HS256)
│   │   └── router.py       # /api/auth/me, /api/auth/logout
│   └── routers/
│       ├── posts.py        # /api/posts
│       ├── images.py       # /api/images
│       ├── tags.py         # /api/tags
│       └── contacts.py     # /api/contacts
├── alembic/                # Alembic migrations
├── alembic.ini
├── requirements.txt
└── venv/                   # Python virtual environment

db/                         # Legacy Drizzle schema (kept for reference)
contracts/                  # Shared constants/errors (legacy)
```

---

## Build & Development Commands

### Frontend

All frontend commands are run from the `app/` directory.

```bash
cd app

# Development — Vite dev server on port 3000
# /api requests are proxied to FastAPI on port 8000
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

# Production
uvicorn app.main:app --host 0.0.0.0 --port 3000
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

> Note: The existing database was created by Drizzle. Alembic migrations are for future schema changes only.

---

## Path Aliases

Configured in `vite.config.ts` and `tsconfig.json`:

| Alias | Points to |
|-------|-----------|
| `@/*` | `./src/*` |
| `@contracts/*` | `./contracts/*` |
| `@db/*` | `./db/*` |

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
- **Naming**: React components use PascalCase. FastAPI routers use snake_case. Database schemas use snake_case SQL column names.

---

## Testing Instructions

- **Framework**: Vitest with Node environment.
- **Test files**: `api/**/*.test.ts` or `api/**/*.spec.ts` (legacy Node backend tests).
- **Run**: `npm run test` (uses `vitest run`).

---

## Database Schema

Uses SQLAlchemy 2.0 ORM with MySQL dialect (asyncmy driver).

| Table | Purpose |
|-------|---------|
| `users` | OAuth users (`union_id`, name, email, avatar, role: `user`/`admin`) |
| `posts` | Articles (`type`: blog/journal/thought, `status`: published/draft, slug, cover_image) |
| `images` | Gallery photos (title, description, url, album, sort_order) |
| `tags` | Post tags (name, color hex) |
| `post_tags` | Many-to-many junction between posts and tags (composite PK: post_id + tag_id) |
| `contacts` | Visitor contact form submissions (name, email, message) |

---

## Authentication & Authorization

### OAuth Flow (Kimi)
1. User clicks "Sign in with Kimi" on `/login`.
2. Frontend constructs OAuth URL using `VITE_KIMI_AUTH_URL` and `VITE_APP_ID`.
3. Callback hits `/api/oauth/callback` (handled by `backend/app/auth/oauth.py`).
4. Backend exchanges code for access token, verifies it via JWKS, fetches user profile from Kimi Open API, upserts user in DB.
5. A session JWT is signed (`backend/app/auth/session.py`) and stored in an HTTP-only cookie named `kimi_sid`.

### Session
- Cookie name: `kimi_sid`
- Max age: 1 year
- Secure on non-localhost; SameSite=`Lax` on localhost, `None` otherwise.

### Roles
- `user`: Default for all logged-in users.
- `admin`: Granted automatically to the user whose `union_id` matches `OWNER_UNION_ID` on first login.

### FastAPI Dependencies
- `get_current_user`: Reads `kimi_sid` cookie, verifies JWT, queries DB. Returns `User | None`.
- `require_auth`: Depends on `get_current_user`. Returns 401 if not logged in.
- `require_admin`: Depends on `require_auth`. Returns 403 if role != admin.

---

## API Architecture

- **FastAPI** handles all HTTP routes under `/api/*`.
- Routers are organized by domain: `auth`, `posts`, `images`, `tags`, `contacts`.
- Input validation uses **Pydantic v2** schemas.
- All API responses use camelCase JSON keys (via Pydantic `alias_generator`).

### REST Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/ping` | public | Health check |
| GET | `/api/oauth/callback` | public | OAuth callback (302 redirect) |
| GET | `/api/auth/me` | authed | Current user |
| POST | `/api/auth/logout` | authed | Clear session cookie |
| GET | `/api/posts` | public | List posts |
| GET | `/api/posts/{slug}` | public | Single post with tags |
| POST | `/api/posts` | admin | Create post |
| PUT | `/api/posts/{id}` | admin | Update post |
| DELETE | `/api/posts/{id}` | admin | Delete post |
| GET | `/api/images` | public | List images |
| POST | `/api/images` | admin | Create image |
| DELETE | `/api/images/{id}` | admin | Delete image |
| GET | `/api/tags` | public | List tags |
| POST | `/api/tags` | admin | Create tag |
| POST | `/api/contacts` | public | Submit contact |
| GET | `/api/contacts` | admin | List contacts |

---

## Frontend Architecture

- **SPA** with `BrowserRouter`.
- **React Query** for server state (`@tanstack/react-query`).
- **Custom hook `useAuth`** wraps `api.auth.me` query and logout mutation + optional redirect logic.
- **shadcn/ui** components are located in `src/components/ui/` and imported via `@/components/ui/<name>`.
- **Sections** (`src/sections/`) are large homepage blocks (Hero, About, Notes, Gallery, Footer).
- **Pages** (`src/pages/`) map 1:1 to routes defined in `App.tsx`.
- **API Client** (`src/lib/api.ts`) is a thin `fetch` wrapper with `credentials: "include"` for cookie-based auth.

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

Copy `backend/.env.example` to `backend/.env` and `app/.env.example` to `app/.env`, then fill in values.

#### Backend (`backend/.env`)

```bash
APP_ID=                   # Kimi OAuth app ID
APP_SECRET=               # JWT signing secret + OAuth client secret
DATABASE_URL=             # mysql://user:pass@host:port/db
KIMI_AUTH_URL=            # Kimi OAuth authorize endpoint base URL
KIMI_OPEN_URL=            # Kimi Open Platform base URL
OWNER_UNION_ID=           # First user with this unionId gets admin role
```

#### Frontend (`app/.env`)

```bash
VITE_KIMI_AUTH_URL=       # Kimi OAuth authorize endpoint base URL
VITE_APP_ID=              # Same as APP_ID
```

> FastAPI reads `.env` from `backend/.env`. The `DATABASE_URL` must use `mysql://` scheme; FastAPI automatically converts it to `mysql+asyncmy://` internally.

---

## Deployment

### Production Build

```bash
# 1. Build frontend
cd app
npm run build        # Output to app/dist/public

# 2. Start FastAPI (serves static files from app/dist/public)
cd ../backend
source venv/bin/activate
uvicorn app.main:app --host 0.0.0.0 --port 3000
```

FastAPI production server:
- Serves static files from `app/dist/public/` via `StaticFiles` mount.
- Falls back to `index.html` for unknown non-API routes (SPA behavior).
- Listens on port `3000` (or `$PORT`).

### Docker (Optional)

A multi-stage Dockerfile can be created:
1. Node stage: build frontend
2. Python stage: install dependencies, copy frontend build, start Uvicorn

---

## Security Considerations

- **Session cookies** are `httpOnly`. Secure flag is enabled outside localhost.
- **Body limit** should be controlled at reverse proxy level (Nginx) or via FastAPI middleware.
- **OAuth state** is base64-encoded redirect URI; consider adding a CSRF token if state needs stronger protection.
- **Admin routes** are protected server-side by `require_admin` dependency; frontend only hides UI.
- **Secrets**: `APP_SECRET` is used both as OAuth client secret and JWT signing key. Keep it private.
- **CORS / Credentials**: Development CORS allows `http://localhost:3000` with `credentials: true`.

---

## Notes for Agents

- The project root for frontend work is `app/`. Backend work is in `backend/`.
- When adding a new FastAPI router, register it in `backend/app/main.py`.
- When adding a new database table, define it in `backend/app/models.py`, then generate an Alembic migration.
- shadcn/ui components are pre-installed; add new ones by placing them in `src/components/ui/` following the existing patterns.
- UI copy is in Chinese; keep new user-facing text in Chinese unless explicitly asked otherwise.
- The frontend uses custom Tailwind classes like `neo-border` and `neo-shadow`; these are defined in `src/index.css`.
- When modifying this file (`AGENTS.md`), keep it in sync with actual code changes.
