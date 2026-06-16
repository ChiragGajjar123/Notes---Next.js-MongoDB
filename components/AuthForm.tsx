'use client';

import { useState, useMemo, useEffect } from 'react';
import { signIn, getSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LogIn, UserPlus, Loader2 } from 'lucide-react';
import { Header } from './Header';
import { BackgroundBlobs } from './BackgroundBlobs';
import { PasswordInput } from './PasswordInput';
import { PasswordStrengthIndicator } from './PasswordStrengthIndicator';

import { PASSWORD_REQUIREMENTS } from '@/lib/validations';

const MAX_NAME_LENGTH = 100;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function AuthForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [isForgot, setIsForgot] = useState(false);
  const [forgotSuccess, setForgotSuccess] = useState('');
  const [resetUrl, setResetUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  // Prefetch the dashboard resources to eliminate lag after successful login
  useEffect(() => {
    router.prefetch('/');
  }, [router]);

  const allRequirementsMet = useMemo(
    () => PASSWORD_REQUIREMENTS.every((r) => r.test(password)),
    [password]
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedEmail = email.trim().toLowerCase();
    if (!EMAIL_PATTERN.test(trimmedEmail)) {
      setError('Please enter a valid email address.');
      return;
    }

    if (isForgot) {
      setIsLoading(true);
      setError('');
      setForgotSuccess('');
      setResetUrl('');

      try {
        const response = await fetch('/api/auth/forgot-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: trimmedEmail }),
        });
        const data = await response.json();
        if (response.ok) {
          setForgotSuccess(data.message);
          if (data.resetUrl) {
            setResetUrl(data.resetUrl);
          }
        } else {
          setError(data.error || 'Failed to send reset link.');
        }
      } catch {
        setError('An unexpected error occurred. Please try again.');
      } finally {
        setIsLoading(false);
      }
      return;
    }

    const trimmedName = name.trim();

    if (!password.trim()) {
      setError('Please enter your password.');
      return;
    }

    if (isSignUp && !allRequirementsMet) {
      setError('Password does not meet all requirements.');
      return;
    }

    if (isSignUp && (!trimmedName || trimmedName.toLowerCase() === 'undefined')) {
      setError('Please enter your name.');
      return;
    }

    if (isSignUp && trimmedName.length > MAX_NAME_LENGTH) {
      setError(`Name must be ${MAX_NAME_LENGTH} characters or fewer.`);
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const result = await signIn('credentials', {
        email: trimmedEmail,
        password,
        name: isSignUp ? trimmedName : '',
        mode: isSignUp ? 'signup' : 'signin',
        redirect: false,
      });

      if (result?.error) {
        setError(getAuthErrorMessage(result.error, isSignUp));
        setIsLoading(false);
      } else {
        await getSession();
        router.replace(result?.url || '/');
        router.refresh();
      }
    } catch {
      setError('An unexpected error occurred. Please try again.');
      setIsLoading(false);
    }
  };

  const getAuthErrorMessage = (authError: string, signingUp: boolean) => {
    if (authError.includes('Account already exists')) {
      return 'An account with this email already exists. Please sign in.';
    }
    if (authError.includes('Account is locked')) {
      return authError;
    }
    if (signingUp) {
      // Show specific validation errors from Zod
      if (
        authError.includes('uppercase') ||
        authError.includes('lowercase') ||
        authError.includes('number') ||
        authError.includes('special')
      ) {
        return authError;
      }
      return 'Could not create account. Please check your details and try again.';
    }
    return 'Invalid email or password. Please try again.';
  };

  return (
    <>
      <Header isAuthPage={true} />
      <div className="min-h-[calc(100vh-76px)] flex items-start justify-center bg-background px-3 py-4 sm:px-4 sm:py-6 pt-16 sm:pt-16 relative overflow-hidden">
        <BackgroundBlobs />

        <Card className="w-full max-w-md shadow-2xl border-border/40 bg-card/75 dark:bg-card/45 backdrop-blur-xl relative z-10 rounded-2xl sm:rounded-3xl transition-all duration-300">
          <CardHeader className="text-center space-y-2 px-4 py-5 sm:px-8 sm:py-7">
            <CardTitle className="text-2xl sm:text-3xl font-extrabold tracking-tight bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              {isForgot ? 'Reset Password' : isSignUp ? 'Create Account' : 'Sign In'}
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm text-muted-foreground/90 font-medium">
              {isForgot
                ? 'Enter your email address to receive a password reset link'
                : isSignUp
                  ? 'Create a new account to start taking notes'
                  : 'Sign in to your account to access your notes'
              }
            </CardDescription>
          </CardHeader>
          <CardContent className="px-4 pb-5 sm:px-8 sm:pb-8">
            <form onSubmit={handleSubmit} className="space-y-4">
              {isSignUp && !isForgot && (
                <div className="space-y-1.5">
                  <Label htmlFor="name" className="text-xs font-semibold text-muted-foreground tracking-wider uppercase pl-1">Name</Label>
                  <Input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your name"
                    autoComplete="name"
                    maxLength={MAX_NAME_LENGTH}
                    required={isSignUp}
                    className="bg-background/40 h-11 border-border/80"
                  />
                </div>
              )}

              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-xs font-semibold text-muted-foreground tracking-wider uppercase pl-1">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  autoComplete="email"
                  required
                  className="bg-background/40 h-11 border-border/80"
                />
              </div>

              {!isForgot && (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between pl-1">
                    <Label htmlFor="password" className="text-xs font-semibold text-muted-foreground tracking-wider uppercase">Password</Label>
                    {!isSignUp && (
                      <button
                        type="button"
                        onClick={() => {
                          setIsForgot(true);
                          setError('');
                          setForgotSuccess('');
                          setResetUrl('');
                        }}
                        className="text-xs text-primary hover:text-primary/80 transition-colors hover:underline font-semibold"
                      >
                        Forgot password?
                      </button>
                    )}
                  </div>
                  <PasswordInput
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    autoComplete={isSignUp ? 'new-password' : 'current-password'}
                    required={!isForgot}
                  />

                  {/* Password Strength Indicator (signup only) */}
                  {isSignUp && (
                    <PasswordStrengthIndicator password={password} />
                  )}
                </div>
              )}

              {error && (
                <div className="rounded-xl bg-destructive/10 border border-destructive/20 px-4 py-3 animate-in fade-in duration-200">
                  <p className="text-destructive text-xs sm:text-sm text-center font-semibold leading-relaxed">
                    {error}
                  </p>
                </div>
              )}

              {forgotSuccess && (
                <div className="rounded-xl bg-green-500/10 border border-green-500/20 px-4 py-3 animate-in fade-in duration-200">
                  <p className="text-green-600 dark:text-green-400 text-xs sm:text-sm text-center font-medium leading-relaxed">
                    {forgotSuccess}
                  </p>
                  {resetUrl && (
                    <div className="mt-3 text-center">
                      <a
                        href={resetUrl}
                        className="inline-flex items-center gap-1 text-xs text-primary font-bold hover:underline bg-primary/10 px-3.5 py-2 rounded-xl border border-primary/20 transition-all hover:scale-105"
                      >
                        Reset Password (Test Link)
                      </a>
                    </div>
                  )}
                </div>
              )}

              <Button
                type="submit"
                className="w-full h-11 sm:h-12 text-sm sm:text-base font-bold rounded-xl shadow-lg hover:shadow-primary/25 hover:scale-[1.02] active:scale-[0.98] transition-all bg-primary text-primary-foreground whitespace-normal"
                disabled={isLoading || (!isForgot && isSignUp && password.length > 0 && !allRequirementsMet)}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4.5 w-4.5 mr-2 animate-spin" />
                    Please wait...
                  </>
                ) : (
                  <>
                    {isForgot ? (
                      <>
                        <LogIn className="h-4.5 w-4.5 mr-2" />
                        Send Reset Link
                      </>
                    ) : isSignUp ? (
                      <>
                        <UserPlus className="h-4.5 w-4.5 mr-2" />
                        Create Account
                      </>
                    ) : (
                      <>
                        <LogIn className="h-4.5 w-4.5 mr-2" />
                        Sign In
                      </>
                    )}
                  </>
                )}
              </Button>
            </form>

            <div className="mt-5 text-center">
              {isForgot ? (
                <button
                  type="button"
                  onClick={() => {
                    setIsForgot(false);
                    setError('');
                    setForgotSuccess('');
                    setResetUrl('');
                  }}
                  className="text-xs sm:text-sm text-primary hover:text-primary/80 font-bold transition-all animate-in fade-in duration-300"
                >
                  Back to Sign In
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setIsSignUp(!isSignUp);
                    setError('');
                    setPassword('');
                  }}
                  className="text-xs sm:text-sm text-primary hover:text-primary/80 font-bold transition-all"
                >
                  {isSignUp
                    ? 'Already have an account? Sign in'
                    : "Don't have an account? Sign up"
                  }
                </button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
