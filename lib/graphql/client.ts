interface GqlResponse<T> {
  data?: T;
  errors?: { message: string }[];
}

/**
 * Lightweight GraphQL client that always POSTs to /api/graphql.
 * Throws an Error if the response contains GraphQL errors.
 */
export async function gqlFetch<T = unknown>(
  query: string,
  variables?: Record<string, unknown>
): Promise<T> {
  const res = await fetch('/api/graphql', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, variables }),
  });

  const json: GqlResponse<T> = await res.json();

  if (json.errors?.length) {
    throw new Error(json.errors[0].message);
  }

  if (!json.data) {
    throw new Error('No data returned from GraphQL');
  }

  return json.data;
}
