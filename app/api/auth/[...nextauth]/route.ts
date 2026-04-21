import NextAuth from 'next-auth';
import { MongoDBAdapter } from '@auth/mongodb-adapter';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import clientPromise from '@/lib/mongodb';
import connectDB from '@/lib/mongoose';
import User from '@/lib/models/User';

export const authOptions = {
  adapter: MongoDBAdapter(clientPromise),
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
        name: { label: 'Name', type: 'text' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        await connectDB();
        
        const user = await User.findOne({ email: credentials.email.toLowerCase() });

        if (!user) {
          const hashedPassword = await bcrypt.hash(credentials.password, 12);
          const newUser = await User.create({
            email: credentials.email.toLowerCase(),
            name: credentials.name || 'New User',
            password: hashedPassword
          });
          
          return {
            id: newUser._id.toString(),
            email: newUser.email,
            name: newUser.name,
            image: newUser.image
          };
        }

        const isPasswordValid = await bcrypt.compare(credentials.password, user.password || '');
        
        if (!isPasswordValid) {
          return null;
        }

        return {
          id: user._id.toString(),
          email: user.email,
          name: user.name,
          image: user.image
        };
      }
    })
  ],
  session: {
    strategy: 'jwt' as const
  },
  callbacks: {
    async jwt({ token, user }: any) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }: any) {
      if (token) {
        session.user.id = token.id as string;
      }
      return session;
    }
  },
  pages: {
    signIn: '/auth/signin',
    signUp: '/auth/signup'
  }
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
