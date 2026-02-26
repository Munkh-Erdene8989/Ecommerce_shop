# AGENTS.md

## Cursor Cloud specific instructions

### Overview

AZ Beauty is a single Next.js 16 application (not a monorepo) for a Korean beauty e-commerce store targeting the Mongolian market. Frontend, backend API routes, and GraphQL all live in one codebase at the workspace root.

### Running the app

```bash
npm run dev        # http://localhost:3000
```

The dev server starts quickly (~1s). All API routes are at `/api/*`, GraphQL at `/api/graphql`, health check at `/api/health`.

### Environment variables

All secrets are injected as environment variables by the Cloud Agent VM. A `.env.local` file must exist at the workspace root for Next.js to pick them up. Create it by expanding the injected env vars (see the setup session for the template). Required: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_ANON_KEY`. Optional: `QPAY_*`, `RESEND_API_KEY`, `EMAIL_FROM`.

### Known issues

- **Lint**: `npm run lint` (which calls `next lint`) does not work because Next.js 16 removed the `lint` CLI command. The `.eslintrc.json` config also causes a circular reference error with the `eslint-config-next@16` + `eslint@8` combination. This is a pre-existing issue in the codebase.
- **Middleware deprecation warning**: Next.js 16 shows `"middleware" file convention is deprecated` — this is cosmetic and does not affect functionality.

### Database

The app uses a cloud-hosted Supabase project (Postgres + Auth + Storage). There is no local database setup or Docker dependency. Migrations are in `supabase/migrations/` and can be run via Supabase CLI or Dashboard SQL Editor.

### Testing

No automated test suite is configured in the root `package.json` (the README references `npm run test -w packages/shared` but this is a monorepo-era artifact — no `packages/shared` workspace exists). Manual testing via the browser is the primary verification method. Key flows: browse products, add to cart, checkout (requires QPay credentials).
