'use client';

import { useState, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Eye, EyeOff, Check, X, ShieldAlert, KeyRound } from 'lucide-react';
import { Header } from '@/components/Header';

const MIN_PASSWORD_LENGTH = 8;

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

export function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const token = searchParams.get('token');
  const email = searchParams.get('email');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

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

    if (!token || !email) {
      setError('Missing token or email from the password reset URL.');
      return;
    }

    if (!password.trim()) {
      setError('Please enter your new password.');
      return;
    }

    if (!allRequirementsMet) {
      setError('Password does not meet all complexity requirements.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          email,
          password
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(data.message || 'Your password has been successfully reset.');
        setPassword('');
        setConfirmPassword('');
      } else {
        setError(data.error || 'Failed to reset password.');
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const hasParams = token && email;

  return (
    <>
      <Header isAuthPage={true} />
      <div className="min-h-screen flex items-start justify-center bg-background px-3 py-4 sm:px-4 sm:py-6 pt-[12vh] sm:pt-[15vh]">
        <Card className="w-full max-w-md shadow-xl border-border/50">
          <CardHeader className="text-center space-y-2 px-3 py-4 sm:px-6 sm:py-6">
            <CardTitle className="text-xl sm:text-2xl font-bold tracking-tight flex items-center justify-center gap-2">
              <KeyRound className="h-6 w-6 text-primary" />
              Reset Your Password
            </CardTitle>
            <CardDescription className="text-sm">
              {hasParams
                ? 'Enter your new password below to regain access to your account.'
                : 'Invalid or missing password reset parameters.'}
            </CardDescription>
          </CardHeader>
          <CardContent className="px-3 pb-4 sm:px-6 sm:pb-6">
            {!hasParams ? (
              <div className="space-y-4">
                <div className="rounded-md bg-destructive/10 border border-destructive/20 p-4 text-center">
                  <ShieldAlert className="h-10 w-10 text-destructive mx-auto mb-2" />
                  <p className="text-destructive font-semibold text-sm">
                    Invalid Reset Link
                  </p>
                  <p className="text-muted-foreground text-xs mt-1">
                    This password reset URL is incomplete or invalid. Please request a new link from the Sign In page.
                  </p>
                </div>
                <Button
                  onClick={() => router.push('/auth/signin')}
                  className="w-full"
                  variant="outline"
                >
                  Back to Sign In
                </Button>
              </div>
            ) : success ? (
              <div className="space-y-4">
                <div className="rounded-md bg-green-500/10 border border-green-500/20 p-4 text-center">
                  <Check className="h-10 w-10 text-green-600 dark:text-green-400 mx-auto mb-2" />
                  <p className="text-green-600 dark:text-green-400 font-semibold text-sm">
                    Password Reset Complete
                  </p>
                  <p className="text-muted-foreground text-xs mt-1">
                    {success}
                  </p>
                </div>
                <Button
                  onClick={() => router.push('/auth/signin')}
                  className="w-full"
                >
                  Go to Sign In
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-3.5 sm:space-y-4">
                <div>
                  <Label htmlFor="email-static">Email</Label>
                  <Input
                    id="email-static"
                    type="email"
                    value={email}
                    disabled
                    className="bg-muted text-muted-foreground cursor-not-allowed opacity-80"
                  />
                </div>

                <div>
                  <Label htmlFor="password">New Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter new password"
                      autoComplete="new-password"
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

                  {/* Password Strength Indicator */}
                  {password.length > 0 && (
                    <div className="mt-2.5 space-y-2 animate-in fade-in slide-in-from-top-1 duration-200">
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

                <div>
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm new password"
                      autoComplete="new-password"
                      required
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      tabIndex={-1}
                      aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
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
                  disabled={isLoading || (password.length > 0 && !allRequirementsMet) || confirmPassword.length === 0}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Please wait...
                    </>
                  ) : (
                    <>
                      Reset Password
                    </>
                  )}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
