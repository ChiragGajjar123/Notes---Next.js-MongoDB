'use client';

import { useState, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, ShieldAlert, KeyRound } from 'lucide-react';
import { Header } from '@/components/Header';
import { BackgroundBlobs } from '@/components/BackgroundBlobs';
import { PasswordInput } from '@/components/PasswordInput';
import { PasswordStrengthIndicator } from '@/components/PasswordStrengthIndicator';
import { resetPasswordAction } from '@/app/actions';

import { PASSWORD_REQUIREMENTS } from '@/lib/validations';

export function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const token = searchParams.get('token');
  const email = searchParams.get('email');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const allRequirementsMet = useMemo(
    () => PASSWORD_REQUIREMENTS.every((r) => r.test(password)),
    [password]
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
      const result = await resetPasswordAction({
        token,
        email,
        password,
      });

      if (result.ok) {
        setSuccess(result.data.message || 'Your password has been successfully reset.');
        setPassword('');
        setConfirmPassword('');
      } else {
        setError(result.error || 'Failed to reset password.');
      }
    } catch {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const hasParams = token && email;

  return (
    <>
      <Header isAuthPage={true} />
      <div className="min-h-[calc(100vh-76px)] flex items-start justify-center bg-background px-3 py-4 sm:px-4 sm:py-6 pt-16 sm:pt-16 relative overflow-hidden">
        <BackgroundBlobs />

        <Card className="w-full max-w-md shadow-2xl border-border/40 bg-card/75 dark:bg-card/45 backdrop-blur-xl relative z-10 rounded-2xl sm:rounded-3xl transition-all duration-300">
          <CardHeader className="text-center space-y-2 px-4 py-5 sm:px-8 sm:py-7">
            <CardTitle className="text-2xl sm:text-3xl font-extrabold tracking-tight bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent flex items-center justify-center gap-2">
              <KeyRound className="h-6 w-6 text-primary shrink-0 animate-pulse" />
              Reset Password
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm text-muted-foreground/90 font-medium">
              {hasParams
                ? 'Enter your new password below to regain access to your account.'
                : 'Invalid or missing password reset parameters.'}
            </CardDescription>
          </CardHeader>
          <CardContent className="px-4 pb-5 sm:px-8 sm:pb-8">
            {!hasParams ? (
              <div className="space-y-4">
                <div className="rounded-xl bg-destructive/10 border border-destructive/20 p-4 text-center">
                  <ShieldAlert className="h-10 w-10 text-destructive mx-auto mb-2" />
                  <p className="text-destructive font-bold text-sm">
                    Invalid Reset Link
                  </p>
                  <p className="text-muted-foreground text-xs mt-1 leading-relaxed">
                    This password reset URL is incomplete or invalid. Please request a new link from the Sign In page.
                  </p>
                </div>
                <Button
                  onClick={() => router.push('/auth/signin')}
                  className="w-full h-11 text-sm font-semibold rounded-xl"
                  variant="outline"
                >
                  Back to Sign In
                </Button>
              </div>
            ) : success ? (
              <div className="space-y-4">
                <div className="rounded-xl bg-green-500/10 border border-green-500/20 p-4 text-center">
                  <ShieldAlert className="h-10 w-10 text-green-600 dark:text-green-400 mx-auto mb-2" />
                  <p className="text-green-600 dark:text-green-400 font-bold text-sm">
                    Password Reset Complete
                  </p>
                  <p className="text-muted-foreground text-xs mt-1 leading-relaxed">
                    {success}
                  </p>
                </div>
                <Button
                  onClick={() => router.push('/auth/signin')}
                  className="w-full h-11 text-sm font-bold rounded-xl shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all"
                >
                  Go to Sign In
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="email-static" className="text-xs font-semibold text-muted-foreground tracking-wider uppercase pl-1">Email</Label>
                  <Input
                    id="email-static"
                    type="email"
                    value={email}
                    disabled
                    className="bg-muted/50 text-muted-foreground cursor-not-allowed opacity-80 h-11"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="password" className="text-xs font-semibold text-muted-foreground tracking-wider uppercase pl-1">New Password</Label>
                  <PasswordInput
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter new password"
                    autoComplete="new-password"
                    required
                  />

                  {/* Password Strength Indicator */}
                  <PasswordStrengthIndicator password={password} />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="confirmPassword" className="text-xs font-semibold text-muted-foreground tracking-wider uppercase pl-1">Confirm Password</Label>
                  <PasswordInput
                    id="confirmPassword"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                    autoComplete="new-password"
                    required
                  />
                </div>

                {error && (
                  <div className="rounded-xl bg-destructive/10 border border-destructive/20 px-4 py-3 animate-in fade-in duration-200">
                    <p className="text-destructive text-xs sm:text-sm text-center font-semibold leading-relaxed">
                      {error}
                    </p>
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full h-11 sm:h-12 text-sm sm:text-base font-bold rounded-xl shadow-lg hover:shadow-primary/25 hover:scale-[1.02] active:scale-[0.98] transition-all bg-primary text-primary-foreground whitespace-normal"
                  disabled={isLoading || (password.length > 0 && !allRequirementsMet) || confirmPassword.length === 0}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4.5 w-4.5 mr-2 animate-spin" />
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
