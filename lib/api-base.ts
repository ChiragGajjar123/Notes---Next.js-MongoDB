import { headers } from 'next/headers';

export async function getApiBaseUrl() {
  if (process.env.NODE_ENV === 'development') {
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
  const host = headerStore.get('host') || 'localhost:3000';
  const proto =
    headerStore.get('x-forwarded-proto') ||
    (host.includes('localhost') || host.includes('127.0.0.1') ? 'http' : 'https');

  return `${proto}://${host}`;
}
