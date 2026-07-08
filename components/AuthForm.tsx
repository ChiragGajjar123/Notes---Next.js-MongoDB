'use client';

import { useState, useMemo, useEffect } from 'react';
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
import { forgotPasswordAction, signInAction, signUpAction } from '@/app/auth-actions';

import { PASSWORD_REQUIREMENTS } from '@/lib/validations';

const MAX_NAME_LENGTH = 100;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Helper to safely get the current timestamp, avoiding React Compiler purity rule checks on render path
const getNowTimestamp = () => Date.now();

export function AuthForm() {
  const [state, setState] = useState({
    email: '',
    password: '',
    verifyPassword: '',
    name: '',
    isSignUp: false,
    isForgot: false,
    forgotSuccess: '',
    resetUrl: '',
    isLoading: false,
    error: '',
  });
  const {
    email,
    password,
    verifyPassword,
    name,
    isSignUp,
    isForgot,
    forgotSuccess,
    resetUrl,
    isLoading,
    error,
  } = state;
  const router = useRouter();

  const [cooldownSeconds, setCooldownSeconds] = useState(0);

  // Restore cooldown from localStorage on mount
  useEffect(() => {
    const storedEnd = localStorage.getItem('forgotPasswordCooldownEnd');
    if (storedEnd) {
      const timeLeft = Math.ceil((parseInt(storedEnd, 10) - getNowTimestamp()) / 1000);
      if (timeLeft > 0) {
        setTimeout(() => {
          setCooldownSeconds(timeLeft);
        }, 0);
      } else {
        localStorage.removeItem('forgotPasswordCooldownEnd');
      }
    }
  }, []);

  // Cooldown countdown effect
  useEffect(() => {
    if (cooldownSeconds <= 0) return;

    const interval = setInterval(() => {
      const storedEnd = localStorage.getItem('forgotPasswordCooldownEnd');
      if (storedEnd) {
        const timeLeft = Math.ceil((parseInt(storedEnd, 10) - getNowTimestamp()) / 1000);
        if (timeLeft > 0) {
          setCooldownSeconds(timeLeft);
        } else {
          setCooldownSeconds(0);
          localStorage.removeItem('forgotPasswordCooldownEnd');
        }
      } else {
        setCooldownSeconds(prev => (prev > 1 ? prev - 1 : 0));
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [cooldownSeconds]);

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
      setState(prev => ({ ...prev, error: 'Please enter a valid email address.' }));
      return;
    }

    if (isForgot) {
      setState(prev => ({ ...prev, isLoading: true, error: '', forgotSuccess: '', resetUrl: '' }));

      try {
        const result = await forgotPasswordAction(trimmedEmail);
        if (result.ok) {
          setState(prev => ({
            ...prev,
            forgotSuccess: result.data.message,
            resetUrl: result.data.resetUrl || '',
          }));
          const cooldownEnd = getNowTimestamp() + 60000;
          localStorage.setItem('forgotPasswordCooldownEnd', cooldownEnd.toString());
          setCooldownSeconds(60);
        } else {
          setState(prev => ({ ...prev, error: result.error || 'Failed to send reset link.' }));
          if (result.error?.includes('Please wait')) {
            const match = result.error.match(/Please wait (\d+) second/);
            if (match && match[1]) {
              const seconds = parseInt(match[1], 10);
              const cooldownEnd = getNowTimestamp() + seconds * 1000;
              localStorage.setItem('forgotPasswordCooldownEnd', cooldownEnd.toString());
              setCooldownSeconds(seconds);
            }
          }
        }
      } catch {
        setState(prev => ({ ...prev, error: 'An unexpected error occurred. Please try again.' }));
      } finally {
        setState(prev => ({ ...prev, isLoading: false }));
      }
      return;
    }

    const trimmedName = name.trim();

    if (!password.trim()) {
      setState(prev => ({ ...prev, error: 'Please enter your password.' }));
      return;
    }

    if (isSignUp && !allRequirementsMet) {
      setState(prev => ({ ...prev, error: 'Password does not meet all requirements.' }));
      return;
    }

    if (isSignUp && (!trimmedName || trimmedName.toLowerCase() === 'undefined')) {
      setState(prev => ({ ...prev, error: 'Please enter your name.' }));
      return;
    }

    if (isSignUp && trimmedName.length > MAX_NAME_LENGTH) {
      setState(prev => ({ ...prev, error: `Name must be ${MAX_NAME_LENGTH} characters or fewer.` }));
      return;
    }

    if (isSignUp && password !== verifyPassword) {
      setState(prev => ({ ...prev, error: 'Passwords do not match. Please try again.' }));
      return;
    }

    setState(prev => ({ ...prev, isLoading: true, error: '' }));

    try {
      const result = isSignUp
        ? await signUpAction({ name: trimmedName, email: trimmedEmail, password })
        : await signInAction({ email: trimmedEmail, password });

      if (!result.ok) {
        setState(prev => ({
          ...prev,
          error: getAuthErrorMessage(result.error ?? '', isSignUp),
          isLoading: false,
        }));
      } else {
        router.replace('/');
      }
    } catch {
      setState(prev => ({
        ...prev,
        error: 'An unexpected error occurred. Please try again.',
        isLoading: false,
      }));
    }
  };

  const getAuthErrorMessage = (authError: string, signingUp: boolean) => {
    if (authError.includes('Account already exists')) {
      return 'An account with this email already exists. Please sign in.';
    }
    if (authError.includes('Account is locked')) {
      return authError;
    }
    if (authError.includes('User not found')) {
      return 'No account exists with this email. Please create an account to continue.';
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
                    onChange={(e) => setState(prev => ({ ...prev, name: e.target.value }))}
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
                  onChange={(e) => setState(prev => ({ ...prev, email: e.target.value }))}
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
                          setState(prev => ({ ...prev, isForgot: true, error: '', forgotSuccess: '', resetUrl: '' }));
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
                    onChange={(e) => setState(prev => ({ ...prev, password: e.target.value }))}
                    placeholder="Enter your password"
                    autoComplete={isSignUp ? 'new-password' : 'current-password'}
                    required={!isForgot}
                  />

                  {/* Password Strength Indicator (signup only) */}
                  {isSignUp && (
                    <>
                      <PasswordStrengthIndicator password={password} />
                      <div className="space-y-1.5 mt-4">
                        <Label htmlFor="verifyPassword" className="text-xs font-semibold text-muted-foreground tracking-wider uppercase pl-1">
                          Verify Password
                        </Label>
                        <PasswordInput
                          id="verifyPassword"
                          value={verifyPassword}
                          onChange={(e) => setState(prev => ({ ...prev, verifyPassword: e.target.value }))}
                          placeholder="Re-enter your password"
                          autoComplete="new-password"
                          required={isSignUp}
                        />
                      </div>
                    </>
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
                disabled={isLoading || (!isForgot && isSignUp && password.length > 0 && !allRequirementsMet) || (isForgot && cooldownSeconds > 0)}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4.5 w-4.5 mr-2 animate-spin" />
                    Please wait...
                  </>
                ) : (
                  <>
                    {isForgot ? (
                      cooldownSeconds > 0 ? (
                        `Resend in ${cooldownSeconds}s`
                      ) : (
                        <>
                          <LogIn className="h-4.5 w-4.5 mr-2" />
                          Send Reset Link
                        </>
                      )
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
                    setState(prev => ({ ...prev, isForgot: false, error: '', forgotSuccess: '', resetUrl: '' }));
                  }}
                  className="text-xs sm:text-sm text-primary hover:text-primary/80 font-bold transition-all animate-in fade-in duration-300"
                >
                  Back to Sign In
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setState(prev => ({
                      ...prev,
                      isSignUp: !prev.isSignUp,
                      error: '',
                      password: '',
                      verifyPassword: '',
                    }));
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
