'use client';

import { useState, useMemo, useEffect } from 'react';
import { signIn, getSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LogIn, UserPlus, Loader2, Eye, EyeOff, Check, X } from 'lucide-react';
import { Header } from './Header';

const MIN_PASSWORD_LENGTH = 8;
const MAX_NAME_LENGTH = 100;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface PasswordRequirement {
  label: string;
  test: (password: string) => boolean;
}

const PASSWORD_REQUIREMENTS: PasswordRequirement[] = [
  { label: 'At least 8 characters', test: (p) => p.length >= MIN_PASSWORD_LENGTH },
  { label: 'One uppercase letter', test: (p) => /[A-Z]/.test(p) },
  { label: 'One lowercase letter', test: (p) => /[a-z]/.test(p) },
  { label: 'One number', test: (p) => /[0-9]/.test(p) },
  { label: 'One special character', test: (p) => /[^a-zA-Z0-9]/.test(p) },
];

function getPasswordStrength(password: string): { score: number; label: string; color: string } {
  if (!password) return { score: 0, label: '', color: '' };

  const passed = PASSWORD_REQUIREMENTS.filter((r) => r.test(password)).length;
  const total = PASSWORD_REQUIREMENTS.length;
  const ratio = passed / total;

  if (ratio <= 0.2) return { score: ratio * 100, label: 'Very Weak', color: 'bg-red-500' };
  if (ratio <= 0.4) return { score: ratio * 100, label: 'Weak', color: 'bg-orange-500' };
  if (ratio <= 0.6) return { score: ratio * 100, label: 'Fair', color: 'bg-yellow-500' };
  if (ratio <= 0.8) return { score: ratio * 100, label: 'Good', color: 'bg-blue-500' };
  return { score: 100, label: 'Strong', color: 'bg-green-500' };
}

export function AuthForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  // Prefetch the dashboard resources to eliminate lag after successful login
  useEffect(() => {
    router.prefetch('/');
  }, [router]);

  const passwordStrength = useMemo(
    () => getPasswordStrength(password),
    [password]
  );

  const requirementsMet = useMemo(
    () => PASSWORD_REQUIREMENTS.map((r) => ({ ...r, met: r.test(password) })),
    [password]
  );

  const allRequirementsMet = useMemo(
    () => requirementsMet.every((r) => r.met),
    [requirementsMet]
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedEmail = email.trim().toLowerCase();
    const trimmedName = name.trim();

    if (!EMAIL_PATTERN.test(trimmedEmail)) {
      setError('Please enter a valid email address.');
      return;
    }

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
        router.push('/');
      }
    } catch (error) {
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
      <div className="min-h-screen flex items-start justify-center bg-background px-3 py-4 sm:px-4 sm:py-6 pt-[12vh] sm:pt-[15vh]">
        <Card className="w-full max-w-md shadow-xl border-border/50">
          <CardHeader className="text-center space-y-2 px-3 py-4 sm:px-6 sm:py-6">
            <CardTitle className="text-xl sm:text-2xl font-bold tracking-tight">
              {isSignUp ? 'Create Account' : 'Sign In'}
            </CardTitle>
            <CardDescription className="text-sm">
              {isSignUp
                ? 'Create a new account to start taking notes'
                : 'Sign in to your account to access your notes'
              }
            </CardDescription>
          </CardHeader>
          <CardContent className="px-3 pb-4 sm:px-6 sm:pb-6">
            <form onSubmit={handleSubmit} className="space-y-3.5 sm:space-y-4">
              {isSignUp && (
                <div>
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your name"
                    autoComplete="name"
                    maxLength={MAX_NAME_LENGTH}
                    required={isSignUp}
                  />
                </div>
              )}

              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  autoComplete="email"
                  required
                />
              </div>

              <div>
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    autoComplete={isSignUp ? 'new-password' : 'current-password'}
                    required
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    tabIndex={-1}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>

                {/* Password Strength Indicator (signup only) */}
                {isSignUp && password.length > 0 && (
                  <div className="mt-2.5 space-y-2">
                    {/* Strength Bar */}
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${passwordStrength.color}`}
                          style={{ width: `${passwordStrength.score}%` }}
                        />
                      </div>
                      <span className="text-xs font-medium text-muted-foreground min-w-[4.5rem] text-right">
                        {passwordStrength.label}
                      </span>
                    </div>

                    {/* Requirements Checklist */}
                    <div className="grid grid-cols-1 gap-0.5">
                      {requirementsMet.map((req) => (
                        <div
                          key={req.label}
                          className={`flex items-center gap-1.5 text-xs transition-colors duration-200 ${
                            req.met
                              ? 'text-green-600 dark:text-green-400'
                              : 'text-muted-foreground'
                          }`}
                        >
                          {req.met ? (
                            <Check className="h-3 w-3 shrink-0" />
                          ) : (
                            <X className="h-3 w-3 shrink-0" />
                          )}
                          <span>{req.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {error && (
                <div className="rounded-md bg-destructive/10 border border-destructive/20 px-3 py-2">
                  <p className="text-destructive text-sm text-center font-medium">
                    {error}
                  </p>
                </div>
              )}

              <Button
                type="submit"
                className="w-full min-h-10 whitespace-normal"
                disabled={isLoading || (isSignUp && password.length > 0 && !allRequirementsMet)}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Please wait...
                  </>
                ) : (
                  <>
                    {isSignUp ? (
                      <>
                        <UserPlus className="h-4 w-4 mr-2" />
                        Create Account
                      </>
                    ) : (
                      <>
                        <LogIn className="h-4 w-4 mr-2" />
                        Sign In
                      </>
                    )}
                  </>
                )}
              </Button>
            </form>

            <div className="mt-4 text-center">
              <button
                type="button"
                onClick={() => {
                  setIsSignUp(!isSignUp);
                  setError('');
                  setPassword('');
                  setShowPassword(false);
                }}
                className="text-sm text-primary hover:underline"
              >
                {isSignUp
                  ? 'Already have an account? Sign in'
                  : "Don't have an account? Sign up"
                }
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
