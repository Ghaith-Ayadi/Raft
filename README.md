# Shame

A personal habit tracker. Create a few habits (title, emoji, color), tap one to
log it, and see them on a monthly calendar.

- **App**: Vite + React + Untitled UI (from Genesis), hosted on Vercel.
  Local-first: Dexie in the browser, so logging is instant and works offline.
  Installable as a PWA.
- **Backend**: PocketBase, schema and hooks in [`pb/`](pb/), deploy files in
  [`deploy/`](deploy/). Google sign-in only.

## Develop

```bash
cp .env.example .env      # VITE_PB_URL
npm install
npm run dev
npm run typecheck
```

Local PocketBase (0.40.x) with this repo's schema:

```bash
pocketbase serve --automigrate=false --migrationsDir pb/pb_migrations --hooksDir pb/pb_hooks
# then VITE_PB_URL=http://127.0.0.1:8090 npm run dev
```

Without Google credentials in the environment, the instance falls back to
password auth, which is handy for local testing.

## Deploy the backend

On the box, from a checkout of this repo:

1. `sudo install -d -o deploy -g deploy /srv/shame/pb_data`
2. `/srv/shame/.env` (mode 600) from [`deploy/.env.example`](deploy/.env.example).
   Superuser password: `openssl rand -base64 30 | tr -d '/+=' | cut -c1-32`;
   `PB_ENCRYPTION_KEY`: `openssl rand -hex 16`.
3. `cd deploy && docker compose up -d`, then `docker logs pocketbase-shame`.
4. Put [`deploy/shame.caddy`](deploy/shame.caddy) where the reverse proxy reads
   its sites (with the real Vercel alias) once DNS for `shame.ayadighaith.com`
   exists, and reload the proxy.
5. Google OAuth client: add `https://shame.ayadighaith.com/api/oauth2-redirect`.

Schema changes: add a file to `pb/pb_migrations/`, pull on the box, `docker
compose restart`.

## Deploy the app

Vercel project on this repo, env `VITE_PB_URL=https://shame.ayadighaith.com`.
`vercel.json` rewrites deep links to the SPA.
