# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start all dev servers (frontend + backend) |
| `turbo run dev` | Same as `pnpm dev` — starts both apps |
| `pnpm build` | Build all apps for production |
| `pnpm build:staging` | Build staging environment |
| `pnpm preview` | Preview production build |
| `pnpm typecheck` | Run TypeScript type checking across all apps |
| `pnpm lint` | Run ESLint + Prettier + Stylelint |
| `pnpm clean` | Remove dist/ across all apps |
| `pnpm format` | Format all files with Prettier |

### Backend (`apps/server`)

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start backend with tsx watch (port 8080) |
| `pnpm build` | Compile TypeScript to `dist/` |
| `pnpm start` | Run compiled backend from `dist/` |
| `cd apps/server && npx drizzle-kit generate` | Generate SQL migration from schema changes |
| `cd apps/server && npx drizzle-kit push` | Push schema to MySQL without migration files |

### Frontend (`apps/web`)

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start Vite dev server (port 8848, proxies `/api` → `8080`) |
| `pnpm build` | Full production build with version file generation |
| `pnpm build:staging` | Staging build (`--mode staging`) |
| `pnpm typecheck` | TypeScript type checking with `vue-tsc` |
| `pnpm lint:eslint` | ESLint with cache |
| `pnpm lint:prettier` | Prettier formatting |
| `pnpm lint:stylelint` | CSS/SCSS linting |

### Database

```bash
# Start MySQL (init.sql auto-executes on first container start via Dockerfile.db)
docker compose -f docker/docker-compose.yml up -d

# If schema or seed data changed and you need a fresh database:
docker compose -f docker/docker-compose.yml down -v && docker compose -f docker/docker-compose.yml up -d

# Direct connection:
mysql -h 127.0.0.1 -uroot -proot123 pureadmin
```

- **Host**: `127.0.0.1:3306` (Docker container `pureadmin-db`)
- **Database**: `pureadmin` / **User**: `root` / **Password**: `root123`
- **Schema**: Drizzle ORM in `apps/server/src/db/schema/*.ts` — edit these, then run `drizzle-kit push` or `drizzle-kit generate`
- **init.sql**: `docker/init.sql` — Complete schema + indexes + seed data (auto-loaded by `docker/Dockerfile.db` via MySQL's `docker-entrypoint-initdb.d` on first start)
- **Default passwords**: Both `admin` and `common` use `admin123` (bcrypt-hashed)

---

## Architecture

### Monorepo layout

```
AICustomerServiceAdmin/
├── apps/
│   ├── web/            # Vue 3 frontend (port 8848)
│   └── server/         # Hono backend API (port 8080)
├── packages/
│   └── config/         # Shared ESLint & TypeScript configs
├── docker-compose.yml  # MySQL 8.0 (container: pureadmin-db) — 已移至 docker/
├── Dockerfile.db       # MySQL image with init.sql auto-load — 已移至 docker/
├── .mcp.json           # MySQL MCP server (read-write, configured in .mcp.json)
└── docker/             # MySQL Docker config + init.sql (schema + seed data)
```

### Backend: adding a new module

New route modules follow a consistent three-file pattern inside `apps/server/src/routes/<name>/`:

```
routes/<name>/
├── <name>.routes.ts    # OpenAPI route definitions (Zod + hono/zod-openapi)
├── <name>.handlers.ts  # Route registration on the module router + handler functions
└── <name>.schemas.ts   # Zod schemas for request/response validation
```

Then register the module router in `apps/server/src/routes/app.route.ts`. Business logic goes in `apps/server/src/service/<name>.service.ts`.

### Backend structure (`apps/server/src/`)

```
src/
├── bootstrap.ts              # Entry point — starts Hono server on :8080
├── routes/
│   ├── app.route.ts          # Root router — mounts all modules, applies middleware
│   ├── auth/                 # Login, refresh token (no auth required)
│   ├── user/                 # User CRUD (protected)
│   ├── role/                 # Role CRUD + permission assignment (protected)
│   ├── menu/                 # Menu/route management (protected)
│   ├── dashboard/            # Dashboard stats & card data (protected)
│   └── monitor/              # All log types (protected)
├── service/                  # Business logic — one file per domain
│   ├── auth.service.ts       # Login with bcrypt, JWT generation, refresh
│   ├── user.service.ts
│   ├── role.service.ts
│   ├── menu.service.ts       # Menu tree building, role-menu mapping
│   ├── dashboard.service.ts
│   └── monitor.service.ts
├── middlewares/
│   ├── auth.ts               # JWT verification — extract user from Bearer token
│   └── error.ts              # Global error handler (ApiException → JSON response)
├── db/
│   ├── index.ts              # Drizzle client (mysql2 pool, lazy singleton)
│   └── schema/               # Drizzle table definitions
│       ├── index.ts          # Re-exports all tables + TypeScript types
│       ├── users.ts
│       ├── roles.ts
│       ├── pages.ts          # Menus/pages with hierarchical structure
│       ├── logs.ts           # 6 log table definitions
│       └── configs.ts
└── common/
    ├── exception.ts          # ApiException hierarchy (10001=params, 10002=auth, 10003=not found)
    ├── schemas.ts            # Shared Zod schemas
    ├── validator.ts          # Validation utilities
    └── openapi.ts            # Scalar docs at /docs
```

**Routing pattern** — each module has three files: `.routes.ts` (OpenAPI route definitions), `.handlers.ts` (route registration + handler functions), `.schemas.ts` (Zod schemas for that module).

**Backend API base**: `/api`. OpenAPI docs at `/docs` (via Scalar). Auth: JWT with 24h access token + 7d refresh token.

| Endpoint | Auth | Description |
|----------|------|-------------|
| `POST /api/login` | No | Login with username/password |
| `POST /api/refresh-token` | No | Refresh access token |
| `GET /api/mine` | Yes | Current user profile |
| `GET /api/get-async-routes` | Yes | Dynamic routes for current user's roles |
| `GET /api/list-all-role` | Yes | All roles |
| `GET /api/list-role-ids` | Yes | Role IDs for a user |

**Error codes**: `10001` = bad request, `10002` = unauthorized, `10003` = not found, `10004` = 404 endpoint, `-1` = internal.

### Frontend structure (`apps/web/src/`)

```
src/
├── main.ts                    # App bootstrap — installs plugins, directives, components
├── router/
│   ├── index.ts               # Vue Router — static routes + dynamic init from /api/get-async-routes
│   ├── modules/               # Static route modules (auto-imported via import.meta.glob)
│   │   ├── home.ts            # Home/welcome route
│   │   ├── remaining.ts       # Routes not shown in menu (login, 403, 404, redirect)
│   │   └── error.ts           # Error pages
│   └── utils.ts               # Route helpers — flattening, sorting, filtering
├── store/
│   ├── modules/
│   │   ├── user.ts            # Auth state — login, logout, token refresh, user info
│   │   ├── permission.ts      # Route/menu state — static + dynamic routes, cache pages
│   │   ├── multiTags.ts       # Tab navigation state (open/close/refresh tabs)
│   │   ├── settings.ts        # App settings (layout mode, theme, sidebar, etc.)
│   │   ├── app.ts             # Generic app state
│   │   └── epTheme.ts         # Element-Plus theme color
│   └── index.ts               # Pinia setup
├── api/                       # API call modules (axios wrappers)
│   ├── user.ts                # Login, refresh, user info APIs
│   ├── routes.ts              # Async routes API
│   ├── system.ts              # User/role/menu management APIs
│   └── list.ts                # List/dashboard data APIs
├── views/                     # Page components by feature
│   ├── system/                # User/Role/Menu management pages
│   ├── monitor/               # Online users, login/operation/system logs
│   ├── login/                 # Login page
│   ├── welcome/               # Welcome/dashboard page
│   └── ...                    # Demo pages (table, editor, flow-chart, etc.)
├── components/                # Reusable `Re*` components
│   ├── ReAuth/                # Button-level auth component
│   ├── RePerms/               # Permission check component
│   ├── ReDialog/              # Dialog wrapper
│   ├── ReIcon/                # Iconify + local iconfont
│   └── ...                    # 30+ utility components
├── layout/                    # Main layout — sidebar, navbar, tags view, footer
│   ├── index.vue              # Primary layout shell
│   └── hooks/                 # Layout hooks (theme, nav, tags, i18n, multi-frame)
├── utils/
│   ├── http/index.ts          # Axios instance with interceptors (auto-attach token, refresh)
│   ├── auth.ts                # Token storage/removal utilities
│   ├── responsive.ts          # Responsive storage injection
│   └── tree.ts                # Tree data helpers
└── plugins/                   # Plugin setup (Element-Plus, i18n, echarts, vxe-table)
```

**Key frontend patterns**:
- Router uses `import.meta.glob(["./modules/**/*.ts", "!./modules/**/remaining.ts"], { eager: true })` to auto-import static routes. Adding a new `.ts` file in `router/modules/` auto-registers it; to exclude a module from auto-import, add it to the glob's negative patterns in `router/index.ts`
- Dynamic routes are fetched from `/api/get-async-routes` after login, merged with static routes in Pinia permission store. These are defined in `sys_pages` database table and assigned to roles via `sys_role_pages`
- API calls use Axios wrapper at `src/utils/http/` with automatic token refresh interceptor
- Store modules export both `useXxxStore` (inside Vue setup) and `useXxxStoreHook` (outside setup, for router/layout hooks)
- `@pureadmin/utils` provides many utilities (`isUrl`, `cloneDeep`, `storageLocal`, etc.)
- i18n via `vue-i18n` with Chinese as default locale

### Database schema

All tables use `sys_` prefix. Key tables:
- `sys_users` — username, bcrypt password, nickname, avatar, phone, email, status
- `sys_roles` — name, unique code, status
- `sys_user_roles` — many-to-many join
- `sys_pages` — hierarchical menus (0=menu, 1=button), tree via `parent_id`
- `sys_role_pages` — role-page permissions many-to-many
- `sys_configs` — key-value app settings (layout, theme, i18n, etc.)
- Log tables: `sys_login_logs`, `sys_operation_logs`, `sys_system_logs`, `sys_system_log_details`, `sys_online_users`, `sys_mine_logs`

### Seed data

- **admin** (role: admin) and **common** (role: common) users — password `admin123`
- admin has full menu access; common has only home
- Sample logs, configs, and menus pre-populated
