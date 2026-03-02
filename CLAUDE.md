# AzzeroCO2 Energy - Project Conventions

## Scope
- Package scope: `@azzeroco2/*`
- Monorepo managed with Turborepo + pnpm workspaces

## Language
- Code: English (variable names, comments, docs)
- Communication with user: Italian
- UI strings: Italian (with i18n support planned)

## Import Conventions
- `@/` alias for `apps/web/src/` (Next.js internal imports)
- `@azzeroco2/shared` for shared types, validators, constants
- `@azzeroco2/db` for database client and schema
- `@azzeroco2/config` for shared configs

## Database
- ORM: Drizzle ORM — NEVER use raw SQL queries
- Migrations: `drizzle-kit` generate + migrate
- Always use RLS policies in Supabase for multi-tenant isolation

## Authentication
- Provider: Supabase Auth — NEVER implement custom auth
- Use `@supabase/ssr` for server-side auth in Next.js
- Protect API routes with Supabase middleware

## Styling
- Framework: Tailwind CSS + Shadcn/UI components
- NEVER use inline CSS or CSS modules
- Use design tokens from `@azzeroco2/shared` constants (BRAND_COLORS)
- Dark mode is the default theme

## State Management
- Client state: Zustand stores
- Server state: React Query or Supabase Realtime subscriptions
- NEVER use React Context for global state (use Zustand)

## Code Quality
- TypeScript strict mode everywhere
- Zod for runtime validation at system boundaries
- ESLint with shared config from `@azzeroco2/config`

## Git
- Branch naming: `feat/`, `fix/`, `refactor/`, `docs/`
- Commit messages: conventional commits in English
- NEVER commit `.env` files

## Project Structure
```
apps/
  web/          → Next.js 15 frontend (App Router)
  optimizer/    → Python FastAPI optimization engine
packages/
  config/       → Shared TypeScript and ESLint configs
  shared/       → Types, Zod validators, constants
  db/           → Drizzle ORM schema and client
```
