import { headers } from 'next/headers';

export async function getApiBaseUrl() {
  // In standard local dev (npm run dev + npm run dev:api), use the separate Go API server.
  // Under "vercel dev", VERCEL env var is set and Go functions are served on the same port,
  // so we must NOT redirect to localhost:4000.
  if (process.env.NODE_ENV === 'development' && !process.env.VERCEL) {
    return process.env.GO_API_BASE_URL || 'http://localhost:4000';
  }

  const vercelUrl = process.env.VERCEL_URL;
  const isLocalVercelUrl =
    !vercelUrl ||
    vercelUrl.includes('localhost') ||
    vercelUrl.includes('127.0.0.1');

  if (!isLocalVercelUrl) {
    return `https://${vercelUrl}`;
  }

  const headerStore = await headers();
  const host = headerStore.get('x-forwarded-host') || headerStore.get('host') || 'localhost:3000';
  const proto =
    headerStore.get('x-forwarded-proto') ||
    (host.includes('localhost') || host.includes('127.0.0.1') ? 'http' : 'https');

  return `${proto}://${host}`;
}
