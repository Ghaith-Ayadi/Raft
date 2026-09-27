# Deploy targets

Each file in this folder is a self-contained runbook Claude can execute
to deploy a Genesis-based project to a specific target.

## Usage

From your project's root, tell Claude:

```
Deploy this to <target>. Follow prompts/deploy/<target>.md.
```

Claude reads the file, runs the steps, and asks you when it needs a
browser click (OAuth consent, account confirmation, etc.).

## Available targets

| Target | File | Notes |
|---|---|---|
| Vercel | [vercel.md](./vercel.md) | Free tier. Git push → auto deploy. Vercel Blob for image uploads. |

## Adding a new target

Create `<target>.md` following the shape of `vercel.md`:

1. **Prerequisites** — what must be true before Claude runs anything
   (CLI tools installed, accounts created, etc.)
2. **Steps** — numbered, CLI-first. Flag each step that needs a
   human (browser OAuth, clicking through a dashboard).
3. **Pitfalls** — known failure modes and fixes. Each one a Claude
   might hit.
4. **Verification** — how to confirm the deploy worked end-to-end.

Keep runbooks **self-contained**: don't link to external docs as the
source of truth. External docs drift; runbooks are versioned with the
template.
