import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongoose';

export interface GraphQLContext {
  session: Awaited<ReturnType<typeof getServerSession>>;
  userId: string | null;
}

export async function createContext(_request: Request): Promise<GraphQLContext> {
  // Connect to DB on every request (mongoose caches the connection)
  await connectDB();

  // getServerSession works in App Router route handlers without explicit request passing
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id ?? null;

  return { session, userId };
}
