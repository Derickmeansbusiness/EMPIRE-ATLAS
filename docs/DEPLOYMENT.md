# Deployment

Empire Atlas is a Next.js 16 server application. It needs a Node runtime and a Postgres database. The embedded
PGlite engine is for local development and tests only: serverless platforms do not keep its files between
requests, so a deployed instance must set `DATABASE_URL`.

## Vercel + Supabase (recommended)

1. **Database.** Create a Supabase project (or any Postgres 15+). Copy the connection string (use the pooled
   connection string with `?sslmode=require` on Vercel).
2. **Vercel project.** Import the GitHub repository `Derickmeansbusiness/EMPIRE-ATLAS`, branch
   `claude/magical-cannon-um6vja` (or `main` after merging). Framework preset: Next.js. Install command
   `pnpm install`, build command `pnpm build`.
3. **Environment variables** (Project → Settings → Environment Variables):
   - `DATABASE_URL` — the Postgres connection string.
   - `ATLAS_SESSION_SECRET` — at least 32 random characters
     (`node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"`).
   - `ATLAS_SIGNUP_MODE` — `open` (anyone may create a Student account) or `closed`.
   - Optional for the first seed only: `ATLAS_FOUNDER_EMAIL`, `ATLAS_FOUNDER_PASSWORD`, `ATLAS_FOUNDER_NAME`.
4. **Migrate and seed once** from any machine that can reach the database:
   ```bash
   DATABASE_URL=... ATLAS_FOUNDER_EMAIL=you@example.com ATLAS_FOUNDER_PASSWORD='a long passphrase' pnpm db:seed
   ```
   Migrations also run automatically on the server's first database connection, so `pnpm db:migrate` is optional;
   the seed is what loads the research content and creates Researcher 001.
5. **Deploy.** Vercel builds on push. Open the deployment URL, sign in with the founder credentials.

Remove `ATLAS_FOUNDER_PASSWORD` from the environment after seeding; it is only read by the seed script.

## Any Node host (Railway, Render, Fly, a VM)

```bash
pnpm install --frozen-lockfile
pnpm build
DATABASE_URL=... ATLAS_SESSION_SECRET=... pnpm db:seed   # first time
DATABASE_URL=... ATLAS_SESSION_SECRET=... pnpm start -p 3000
```

## Checks before going live
- `pnpm typecheck && pnpm lint && pnpm test` pass on the commit you deploy.
- `ATLAS_SESSION_SECRET` is set (the app refuses to start in production without it).
- The founder account exists and public sign-up mode is what you intend.
- HTTPS is on (the session cookie is `secure` in production).
