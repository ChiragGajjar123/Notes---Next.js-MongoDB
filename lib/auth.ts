import type { NextAuthOptions } from 'next-auth';
import { MongoDBAdapter } from '@auth/mongodb-adapter';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import clientPromise from '@/lib/mongodb';
import connectDB from '@/lib/mongoose';
import User from '@/lib/models/User';
import { signupSchema, signinSchema } from '@/lib/validations';
import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limit';
import type { RateLimitConfig } from '@/lib/rate-limit';

/** Maximum failed login attempts before account lockout */
const MAX_FAILED_ATTEMPTS = 5;
/** Account lockout duration in minutes */
const LOCKOUT_DURATION_MINUTES = 15;
/** Session/JWT max age in seconds (30 days) */
const SESSION_MAX_AGE = 30 * 24 * 60 * 60;
/** Bcrypt salt rounds */
const BCRYPT_ROUNDS = 12;

async function enforceLimitOrThrow(key: string, config: RateLimitConfig, errorPrefix: string) {
  const result = await checkRateLimit(key, config);
  if (!result.success) {
    const min = Math.ceil((result.resetAt - Date.now()) / 60000);
    throw new Error(`${errorPrefix}. Please try again in ${min} minute(s).`);
  }
}

export const authOptions: NextAuthOptions = {
  debug: process.env.NODE_ENV === 'development',
  adapter: MongoDBAdapter(clientPromise) as NextAuthOptions['adapter'],
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
        name: { label: 'Name', type: 'text' },
        mode: { label: 'Mode', type: 'text' },
      },
      async authorize(credentials, req) {
        const email = credentials?.email?.trim().toLowerCase();
        const password = credentials?.password;
        const name = credentials?.name?.trim();
        const mode = credentials?.mode === 'signup' ? 'signup' : 'signin';

        if (!email || !password) {
          return null;
        }

        // Extract client IP from NextAuth req headers
        const forwarded = req?.headers?.['x-forwarded-for'] as string | undefined;
        const realIp = req?.headers?.['x-real-ip'] as string | undefined;
        const ip = forwarded ? forwarded.split(',')[0].trim() : (realIp || '127.0.0.1');

        await connectDB();

        // ── Sign In ────────────────────────────────────────────
        if (mode === 'signin') {
          // IP-based Rate Limiting for Login
          try {
            await enforceLimitOrThrow(`login:${ip}`, RATE_LIMITS.login, 'Too many login attempts');
          } catch {
            return null;
          }

          const validation = signinSchema.safeParse({ email, password });
          if (!validation.success) {
            return null;
          }

          const user = await User.findOne({ email }).select(
            '+password +failedLoginAttempts +lockedUntil'
          );

          if (!user || !user.password) {
            return null;
          }

          // Check account lockout
          if (user.lockedUntil && user.lockedUntil > new Date()) {
            return null;
          }

          const isPasswordValid = await bcrypt.compare(password, user.password);

          if (!isPasswordValid) {
            // Increment failed attempts
            const failedAttempts = (user.failedLoginAttempts || 0) + 1;
            const updateData: Record<string, unknown> = {
              failedLoginAttempts: failedAttempts,
            };

            // Lock account after too many failures
            if (failedAttempts >= MAX_FAILED_ATTEMPTS) {
              updateData.lockedUntil = new Date(
                Date.now() + LOCKOUT_DURATION_MINUTES * 60 * 1000
              );
            }

            await User.updateOne({ _id: user._id }, { $set: updateData });
            return null;
          }

          // Successful login — reset failed attempts and update lastLoginAt
          await User.updateOne(
            { _id: user._id },
            {
              $set: {
                failedLoginAttempts: 0,
                lockedUntil: null,
                lastLoginAt: new Date(),
              },
            }
          );

          return {
            id: user._id.toString(),
            email: user.email,
            name: user.name,
            image: user.image,
          };
        }

        // ── Sign Up ────────────────────────────────────────────
        // IP-based Rate Limiting for Signup
        try {
          await enforceLimitOrThrow(`signup:${ip}`, RATE_LIMITS.signup, 'Too many signup attempts');
        } catch {
          return null;
        }

        const validation = signupSchema.safeParse({ name, email, password });
        if (!validation.success) {
          return null;
        }

        const existingUser = await User.findOne({ email });
        if (existingUser) {
          return null;
        }

        try {
          const hashedPassword = await bcrypt.hash(password, BCRYPT_ROUNDS);
          const newUser = await User.create({
            email: validation.data.email,
            name: validation.data.name,
            password: hashedPassword,
            lastLoginAt: new Date(),
          });

          return {
            id: newUser._id.toString(),
            email: newUser.email,
            name: newUser.name,
            image: newUser.image,
          };
        } catch (error) {
          if (
            error &&
            typeof error === 'object' &&
            'code' in error &&
            error.code === 11000
          ) {
            return null;
          }
          return null;
        }
      },
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: 'jwt',
    maxAge: SESSION_MAX_AGE,
  },
  jwt: {
    maxAge: SESSION_MAX_AGE,
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id;
      }
      return session;
    },
  },
  pages: {
    signIn: '/auth/signin',
  },
};
