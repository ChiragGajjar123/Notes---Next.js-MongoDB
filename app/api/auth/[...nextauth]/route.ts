import NextAuth from 'next-auth';
import { MongoDBAdapter } from '@auth/mongodb-adapter';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import clientPromise from '@/lib/mongodb';
import connectDB from '@/lib/mongoose';
import User from '@/lib/models/User';

const MIN_PASSWORD_LENGTH = 8;
const MAX_NAME_LENGTH = 100;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const authOptions = {
  adapter: MongoDBAdapter(clientPromise),
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
        name: { label: 'Name', type: 'text' },
        mode: { label: 'Mode', type: 'text' }
      },
      async authorize(credentials) {
        const email = credentials?.email?.trim().toLowerCase();
        const password = credentials?.password;
        const name = credentials?.name?.trim();
        const mode = credentials?.mode === 'signup' ? 'signup' : 'signin';

        if (!email || !EMAIL_PATTERN.test(email) || !password) {
          return null;
        }

        await connectDB();
        
        const user = await User.findOne({ email });

        if (mode === 'signin') {
          if (!user?.password) {
            return null;
          }

          const isPasswordValid = await bcrypt.compare(password, user.password);

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

        if (user) {
          throw new Error('Account already exists. Please sign in.');
        }

        if (
          !name ||
          name.length > MAX_NAME_LENGTH ||
          name.toLowerCase() === 'undefined' ||
          password.trim().length < MIN_PASSWORD_LENGTH
        ) {
          return null;
        }

        try {
          const hashedPassword = await bcrypt.hash(password, 12);
          const newUser = await User.create({
            email,
            name,
            password: hashedPassword
          });
          
          return {
            id: newUser._id.toString(),
            email: newUser.email,
            name: newUser.name,
            image: newUser.image
          };
        } catch (error) {
          if (
            error &&
            typeof error === 'object' &&
            'code' in error &&
            error.code === 11000
          ) {
            throw new Error('Account already exists. Please sign in.');
          }
          throw error;
        }
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
