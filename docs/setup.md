# Setup

## Prerequisites
- Node.js 20+
- pnpm 9+
- PostgreSQL
- environment variable management
- Android Studio for Capacitor Android builds

## Suggested Stack
- frontend: React + Vite + TypeScript
- UI: shadcn/ui + Tailwind CSS
- backend: Express + TypeScript
- ORM: Prisma or Drizzle
- validation: Zod
- tests: Vitest + Playwright
- mobile export: Capacitor

## Initial Workspace Setup
```bash
pnpm init
pnpm install
```

Create a root `.env` file from `.env.example` and make sure `DATABASE_URL` matches a real local PostgreSQL user, password, host, port, and database before starting the API.

If you want the database to run in Docker for development, use the repo's Compose file and keep `DATABASE_URL` aligned with the container defaults from `.env.example`.

For a monorepo setup, one practical starting point is:
```text
apps/web
apps/api
packages/shared
packages/ui
```

## Frontend Setup Direction
Main concerns:
- routing
- auth flow
- study session UI
- responsive layouts
- API client layer
- shadcn/ui initialization
- Tailwind theme tokens

## Backend Setup Direction
Main concerns:
- Express app bootstrap
- route modules
- validation middleware
- service layer
- ORM schema and migrations
- auth/session strategy
- LLM adapter module

## Environment Variables
Typical variables may include:
```env
DATABASE_URL=
LLM_API_KEY=
LLM_MODEL=
SESSION_SECRET=
API_BASE_URL=
```

## Database
Early database goals:
- user identity
- study items
- progress records
- session history
- review scheduling
- tutor interactions if retained

### Development Database with Docker Compose
Start PostgreSQL in Docker:
```bash
pnpm dev:db:up
```

The development Compose file exposes PostgreSQL on `localhost:${DEV_DB_PORT}` and defaults to:
- database: `${DEV_DB_NAME}`
- user: `${DEV_DB_USER}`
- password: `${DEV_DB_PASSWORD}`

With the default example values, `DATABASE_URL` should be:
```env
DATABASE_URL=postgresql://grammarian:grammarian@localhost:5433/grammarian
```

Then apply the schema:
```bash
pnpm --filter @grammarian/api db:migrate
```

If you want to carry over the old JSON-backed development data once:
```bash
pnpm --filter @grammarian/api db:import-dev-store
```

When you're done:
```bash
pnpm dev:db:down
```

If you need a clean database volume:
```bash
pnpm dev:db:reset
```

Current repository scripts for the API:
```bash
pnpm --filter @grammarian/api db:generate
pnpm --filter @grammarian/api db:migrate
pnpm --filter @grammarian/api db:import-dev-store
```

Use `db:migrate` to apply committed SQL migrations to PostgreSQL.

Use `db:import-dev-store` once if you want to copy the old JSON development data into the database after migrating.

## LLM Module Setup
Keep LLM setup isolated in one backend area. That module should expose application-friendly interfaces instead of raw provider calls.

## Capacitor
When the web app matures enough for mobile packaging:
- add Capacitor to the frontend app
- verify navigation and asset loading
- test auth flows on Android
- validate keyboard and layout behavior during study sessions

## Recommended First Milestones
1. bootstrap monorepo or dual-app repo
2. set up frontend shell and backend shell
3. define initial database schema
4. implement authentication
5. build first study session flow
6. add deterministic correction for simple exercises
7. add LLM-backed correction and tutor flows
8. prepare responsive/mobile adjustments for Capacitor
