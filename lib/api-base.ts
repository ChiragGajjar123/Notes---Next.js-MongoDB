import { headers } from 'next/headers';

export async function getApiBaseUrl() {
  // In local dev (npm run dev), use the local Go API server or the configured URL.
  if (process.env.NODE_ENV === 'development' && !process.env.VERCEL) {
    return process.env.GO_API_URL || 'http://localhost:4000';
  }

  // In production (or vercel dev), use the explicitly configured Go backend URL.
  // Set GO_API_URL to your deployed Go backend Vercel URL, e.g.:
  //   https://notes-go-backend.vercel.app
  if (process.env.GO_API_URL) {
    return process.env.GO_API_URL;
  }

  // Fallback: derive from current Vercel deployment URL (only if Go backend is on same deployment)
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
