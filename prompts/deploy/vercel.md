# Deploy to Vercel

Self-contained runbook. Claude: read top-to-bottom, execute the steps,
stop and ask the user when a step is flagged **[human]**.

## What this gives you

- Live app at `https://<project>-<team-slug>.vercel.app` on every push to `main`
- `/api/upload` + `/api/delete` serverless functions (Node runtime) for
  client-side image uploads to Vercel Blob
- `BLOB_READ_WRITE_TOKEN` encrypted in Vercel env vars, mirrored to
  `.env.local` for `vercel dev`
- Genesis's base template compiles and builds clean — no patching needed

## Prerequisites

- Project already on GitHub, on `main`
- `gh` CLI authed as the repo owner (`gh auth status`)
- A Vercel account; `npx vercel whoami` prints a username

If `gh auth status` shows a different account than the one that owns
the repo, run `gh auth switch` before starting.

## Steps

### 1. Install the Vercel CLI as a devDep

```bash
npm install -D vercel
```

(Global install needs sudo on macOS/Linux. Keep it local.)

### 2. Link the repo to a Vercel project

```bash
npx vercel link --yes --project <project-name>
```

On first link, Vercel tries to connect to the GitHub repo. If this
fails with "Failed to connect ... make sure you have access", the
Vercel GitHub App isn't installed yet on the user's GitHub account.

**[human]** → Ask user to open
`https://github.com/apps/vercel/installations/new` and grant the Vercel
GitHub App access to the repo (or "All repositories"). Wait for
confirmation, then retry `npx vercel git connect`.

### 3. Provision a Vercel Blob store and auto-link it

The Blob store must be linked to the project so its
`BLOB_READ_WRITE_TOKEN` lands in project env vars automatically.

```bash
# Interactive flow — prompts for link confirmation + env selection.
# Use `expect` to drive it non-interactively:
expect <<'EOF'
set timeout 60
spawn npx vercel blob create-store <store-name> --access public
expect "Would you like to link this blob store"
send "y\r"
expect "Select environments"
send "\r"
expect eof
EOF
```

After success, `npx vercel env ls` shows `BLOB_READ_WRITE_TOKEN` in
Production, Preview, and Development. `.env.local` is populated too.

### 4. Add the serverless upload/delete endpoints

Install the SDK:

```bash
npm install @vercel/blob
```

Create `api/upload.ts`:

```ts
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";

// NOTE: no `export const config = { runtime: "edge" }`. @vercel/blob needs
// Node built-ins (stream, crypto, tls). Edge runtime breaks the build.

const ALLOWED_CONTENT_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

export default async function handler(request: Request): Promise<Response> {
    if (request.method !== "POST") {
        return new Response(JSON.stringify({ error: "Method not allowed" }), {
            status: 405,
            headers: { "content-type": "application/json" },
        });
    }

    let body: HandleUploadBody;
    try {
        body = (await request.json()) as HandleUploadBody;
    } catch {
        return new Response(JSON.stringify({ error: "Invalid JSON" }), {
            status: 400,
            headers: { "content-type": "application/json" },
        });
    }

    try {
        const jsonResponse = await handleUpload({
            body,
            request,
            onBeforeGenerateToken: async () => ({
                allowedContentTypes: ALLOWED_CONTENT_TYPES,
                addRandomSuffix: true,
                maximumSizeInBytes: 10 * 1024 * 1024,
            }),
            onUploadCompleted: async () => {},
        });
        return Response.json(jsonResponse);
    } catch (err) {
        const message = err instanceof Error ? err.message : "Upload token generation failed";
        return new Response(JSON.stringify({ error: message }), {
            status: 400,
            headers: { "content-type": "application/json" },
        });
    }
}
```

Create `api/delete.ts`:

```ts
import { del } from "@vercel/blob";

interface DeleteBody { urls: string[] }

export default async function handler(request: Request): Promise<Response> {
    if (request.method !== "POST") {
        return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405 });
    }
    let body: DeleteBody;
    try {
        body = (await request.json()) as DeleteBody;
    } catch {
        return new Response(JSON.stringify({ error: "Invalid JSON" }), { status: 400 });
    }
    if (!Array.isArray(body.urls) || body.urls.length === 0) {
        return new Response(JSON.stringify({ error: "urls must be a non-empty array" }), { status: 400 });
    }
    try {
        await del(body.urls);
        return Response.json({ ok: true, deleted: body.urls.length });
    } catch (err) {
        const message = err instanceof Error ? err.message : "Delete failed";
        return new Response(JSON.stringify({ error: message }), { status: 500 });
    }
}
```

Create `src/utils/image-store.ts` as the client-side abstraction. The
rest of the app treats image refs as opaque URLs — if you ever swap
Vercel Blob for R2 / S3 / local, only this file and `api/*` change.

```ts
import { upload } from "@vercel/blob/client";

export async function uploadImage(file: File, folder: string) {
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "-");
    const result = await upload(`${folder}/${safeName}`, file, {
        access: "public",
        handleUploadUrl: "/api/upload",
        contentType: file.type,
    });
    return { url: result.url, pathname: result.pathname, contentType: file.type };
}

export async function deleteImages(urls: string[]): Promise<void> {
    if (urls.length === 0) return;
    const res = await fetch("/api/delete", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ urls }),
    });
    if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error || `Delete failed (HTTP ${res.status})`);
    }
}

export function isBlobUrl(url: string): boolean {
    return /\.public\.blob\.vercel-storage\.com\//.test(url);
}
```

### 5. First deploy

```bash
git add -A
git commit -m "Add Vercel deploy: api/*, @vercel/blob, image-store"
git push origin main
```

Poll for the deploy:

```bash
npx vercel ls | head -5
```

### 6. Unblock public access

Vercel's free "Deployment Protection" blocks the preview URL with an
SSO login wall. Disable it for hobby projects:

```bash
TOK=$(python3 -c "import json; print(json.load(open(f'{__import__(\"os\").path.expanduser(\"~\")}/Library/Application Support/com.vercel.cli/auth.json'))['token'])")
TEAM=$(python3 -c "import json; print(json.load(open('.vercel/project.json'))['orgId'])")
PROJ=$(python3 -c "import json; print(json.load(open('.vercel/project.json'))['projectId'])")
curl -sS -X PATCH "https://api.vercel.com/v9/projects/$PROJ?teamId=$TEAM" \
  -H "Authorization: Bearer $TOK" \
  -H "Content-Type: application/json" \
  -d '{"ssoProtection": null}' | head -c 200
```

### 7. Give the user the URL

```bash
# Canonical alias — what to share
echo "https://<project>-<team-slug>.vercel.app/"
```

Note: `<project>-<username>-<team-slug>.vercel.app` is a common form
but it can 404. Always verify the one that returns HTTP 200.

## Pitfalls seen in the wild

### "Failed to connect ... access to the repository"

Vercel GitHub App not installed. See step 2 **[human]** callout.

### "The Deployment was blocked because the commit author does not have contributing access"

Git commit author email doesn't resolve (on GitHub) to a GitHub user
associated with the Vercel account. Three possible causes:

1. Git config email differs from the user's Vercel-linked email.
   Fix: `git config user.email <vercel-account-email>`, push again.
2. Git email points to a *different* GitHub account the user owns
   (e.g. old account with the email registered). GitHub attributes
   commits to whichever account has the email. Fix: either delete the
   old GitHub account (frees the email), or use a different email that
   resolves to the main account.
3. Vercel account is linked to one GitHub account, repo is owned by
   another. Fix: in Vercel Account Settings → Login Connections, connect
   the GitHub account that owns the repo.

### Build fails with 4 pre-existing TS errors

Genesis base should have these fixed already. If you're deploying an
older Genesis fork, run `npx tsc -b` and fix the reported issues, or
drop `tsc` from the build command (not recommended).

### `@vercel/blob` upload fails with "unsupported modules: stream, crypto, net, tls..."

`api/upload.ts` or `api/delete.ts` has `export const config = { runtime: "edge" }`.
Remove it — `@vercel/blob` needs Node.js built-ins not available in Edge.

### Site loads but image upload returns HTML error page instead of JSON

Running `npm run dev` instead of `npx vercel dev`. Only `vercel dev`
serves the `/api/*` functions alongside the Vite app. Use `npx vercel dev`
for local testing.

### Exported PNG is blank / 36KB / single color

Not a deploy issue — this is `html-to-image` failing to capture a
cloned node. Fix in `src/utils/export-png.ts`: capture the live node
after setting `transform: none` temporarily, don't clone.

## Verification

1. `curl -sI https://<project>-<team-slug>.vercel.app/` → `HTTP/2 200`
2. `npx vercel env ls` shows `BLOB_READ_WRITE_TOKEN` encrypted in all 3 environments
3. Git push triggers a new deploy visible in `npx vercel ls`
4. `.env.local` exists, is 68+ bytes, is gitignored (`git check-ignore -v .env.local` reports a match)

## Rollback

```bash
# Revert the current deploy to a prior one via dashboard, or:
npx vercel rollback
# Or disconnect git and delete the project
npx vercel git disconnect
npx vercel project rm <project-name>
```
