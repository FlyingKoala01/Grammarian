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
