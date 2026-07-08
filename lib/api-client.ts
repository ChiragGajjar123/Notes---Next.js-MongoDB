import { getSessionUserId } from '@/lib/session';
import { getApiBaseUrl } from '@/lib/api-base';

export async function goApi<T>(
  path: string,
  options?: RequestInit
): Promise<T> {
  const userId = await getSessionUserId();
  if (!userId) {
    throw new Error('Unauthorized. Please sign in.');
  }

  // Ensure INTERNAL_API_KEY is configured
  const internalKey = process.env.INTERNAL_API_KEY;
  if (!internalKey) {
    throw new Error('INTERNAL_API_KEY environment variable is not configured');
  }

  const apiBase = await getApiBaseUrl();

  const res = await fetch(`${apiBase}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'X-User-ID': userId,
      'X-Internal-Key': internalKey,
      ...options?.headers,
    },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `API error ${res.status}`);
  }

  return res.json() as Promise<T>;
}
