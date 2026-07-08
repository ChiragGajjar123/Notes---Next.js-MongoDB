# Project Rules

- **Git Pushes:** Never run `git push` or push changes to any remote repository directly without the user's explicit permission.

# Project Documentation & Commands

## Environment Configuration (`.env.local`)
A `.env.local` file is required in the root directory with the following variables:
*   `INTERNAL_API_KEY`: Secret shared between Next.js and the Go API to sign internal requests.
*   `MONGODB_URI`: Connection string for MongoDB (e.g. `mongodb://localhost:27017/` for local dev).
*   `MONGODB_DB`: MongoDB database name (defaults to `notes-app`).
*   `NEXTAUTH_SECRET`: Secret used for signing session tokens.
*   `RESEND_API_KEY`: Resend service token (optional, used for sending password reset emails).

## Development Commands
*   **Unified Local Dev Environment:** Runs the local Go API server on port 4000 and Next.js frontend on port 3000 concurrently.
    ```bash
    powershell -File ./scripts/dev-all.ps1
    ```
*   **Vercel Dev Server Simulation:** Run Vercel CLI to compile Go serverless functions and serve the frontend/API together on port 3000 (requires linking project via Vercel CLI).
    ```bash
    npm run dev:vercel
    ```
*   **Separate Next.js Dev Server:**
    ```bash
    npm run dev
    ```
*   **Separate Go API Server:**
    ```bash
    npm run dev:api
    ```

## Key Architectures
*   **Routing (`lib/api-base.ts`):** Resolves base API URL dynamically. If running Next.js separately in local dev (`process.env.VERCEL` is empty), it defaults to the Go server on port 4000. Under `vercel dev` or production, it resolves to the proxied server host/port using the incoming headers (`x-forwarded-host`).
*   **Server Actions & Go API:** Next.js Server Actions authenticate internally using the `INTERNAL_API_KEY` header before proxying client auth requests to Go serverless endpoints (`/api/signup`, `/api/signin`, etc.).
