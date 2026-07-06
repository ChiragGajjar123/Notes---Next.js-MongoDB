import { createYoga, createSchema } from 'graphql-yoga';
import { NextResponse } from 'next/server';
import { typeDefs } from '@/lib/graphql/schema';
import { resolvers } from '@/lib/graphql/resolvers';
import { createContext } from '@/lib/graphql/context';

const yoga = createYoga({
  schema: createSchema({ typeDefs, resolvers }),
  context: ({ request }) => createContext(request),
  graphiql: process.env.NODE_ENV === 'development',
  graphqlEndpoint: '/api/graphql',
  fetchAPI: { Response },
});

export async function GET(request: Request) {
  try {
    const response = yoga.handleRequest(request, {});
    return response;
  } catch (error) {
    console.error('[GraphQL GET Error]', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : undefined },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const response = yoga.handleRequest(request, {});
    return response;
  } catch (error) {
    console.error('[GraphQL POST Error]', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : undefined },
      { status: 500 }
    );
  }
}
