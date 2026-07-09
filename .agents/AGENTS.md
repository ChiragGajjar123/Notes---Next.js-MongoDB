# Project Rules

- **Git Pushes:** Never run `git push` or push changes to any remote repository without the user's **explicit approval**. Always show what will be committed and wait for confirmation.
- **Deployments:** Never run `vercel deploy` or `vercel --prod` directly. Vercel deploys automatically when code is pushed to Git.

# Project Documentation & Commands

## Architecture Overview

This workspace has **two separate projects**:

| Project | Location | Repo |
|---|---|---|
| Next.js Frontend | `notes-app/` | `Notes---Next.js-MongoDB.git` |
| Go Backend (standard HTTP server) | `Notes App Go Backend/` | `Notes-App-Go-Backend.git` |

The Go backend is deployed separately on Vercel at `https://notes-app-go-backend.vercel.app`. The Next.js frontend calls it via the `GO_API_URL` environment variable.

## Environment Variables

### Next.js (`notes-app/.env.local`)
- `INTERNAL_API_KEY` — Shared secret with the Go backend (must match)
- `NEXTAUTH_SECRET` — Secret for signing session tokens
- `RESEND_API_KEY` — Resend API key for password reset emails (optional)
- `EMAIL_FROM` — Sender address for password reset emails (optional)
- `GO_API_URL` — URL of the deployed Go backend (e.g. `https://notes-app-go-backend.vercel.app`)

### Go Backend (`Notes App Go Backend/.env.local`)
- `MONGODB_URI` — MongoDB connection string
- `MONGODB_DB` — MongoDB database name (defaults to `notes-app`)
- `INTERNAL_API_KEY` — Shared secret with Next.js frontend (must match)
- `PORT` — Server port (defaults to `4000`)

## Development Commands

### Next.js Frontend
```bash
# Run Next.js dev server (frontend only)
npm run dev
```

### Go Backend (standard Go — NOT serverless)
```bash
# Run Go API server locally (from Notes App Go Backend/)
go run ./cmd/api

# Build Go binary
go build ./...
```

## Key Architecture Notes

- **`lib/api-base.ts`:** Resolves the Go backend URL. In local dev (`NODE_ENV=development` and no `VERCEL` env), uses `GO_API_URL` or falls back to `http://localhost:4000`. In production, uses `GO_API_URL` env var pointing to the deployed Go backend.
- **`INTERNAL_API_KEY`:** Must be the **same value** in both the Next.js and Go backend Vercel projects.
- **Go Backend is a standard HTTP server** (`cmd/api/main.go` with `http.ListenAndServe`). Do NOT restructure it as Vercel serverless functions (`api/*.go` with `func Handler`).
- **Go Backend entrypoint:** `cmd/api/main.go` — Vercel Go preset finds this automatically.
