'use client';

import { useState } from 'react';
import { Sparkles, Archive, Sun, Moon, LogOut, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSession, signOut } from 'next-auth/react';

interface HeaderProps {
  isAuthPage?: boolean;
  showArchived?: boolean;
  setShowArchived?: (show: boolean) => void;
  isDarkMode?: boolean;
  toggleDarkMode?: () => void;
  isChangingTheme?: boolean;
}

export function Header({
  isAuthPage = false,
  showArchived,
  setShowArchived,
  isDarkMode,
  toggleDarkMode,
  isChangingTheme = false,
}: HeaderProps) {
  const { data: session } = useSession();
  const [isSigningOut, setIsSigningOut] = useState(false);

  const handleSignOut = async () => {
    setIsSigningOut(true);
    try {
      await signOut();
    } catch (error) {
      console.error('Sign out error:', error);
      setIsSigningOut(false);
    }
  };

  return (
    <header className="sticky inset-x-0 top-0 z-40 w-full bg-background/60 backdrop-blur-xl border-b border-border/40 shadow-sm transition-all duration-300">
      <div className="container mx-auto px-3 sm:px-6 py-3 sm:py-4">
        <div className="flex flex-wrap items-center justify-between gap-2 sm:gap-3">
          <div className="flex min-w-0 flex-wrap items-center gap-2 sm:gap-3">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <Sparkles className="h-5 w-5 sm:h-6 sm:w-6 text-primary animate-pulse" />
              <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                Notes
              </h1>
            </div>
            {!isAuthPage && setShowArchived && (
              <Button
                variant={showArchived ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setShowArchived(!showArchived)}
                aria-label={showArchived ? 'Show active notes' : 'Show archived notes'}
                className="h-8 w-8 rounded-full px-0 text-xs transition-all sm:h-9 sm:w-auto sm:px-3 sm:text-sm"
              >
                <Archive className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4 sm:mr-2" />
                <span className="hidden sm:inline">{showArchived ? 'Active' : 'Archived'}</span>
              </Button>
            )}
          </div>

          {!isAuthPage && session && (
            <div className="flex min-w-0 flex-1 items-center justify-end gap-1.5 sm:gap-3">
              <span className="min-w-0 truncate text-xs font-medium text-muted-foreground sm:text-sm">
                Hi, <span className="text-foreground">{session.user?.name}</span>
              </span>
              {toggleDarkMode && (
                <Button
                  variant="ghost"
                  size="icon"
                  disabled={isChangingTheme || isSigningOut}
                  onClick={toggleDarkMode}
                  className="h-8 w-8 shrink-0 rounded-full hover:bg-muted/50 transition-all sm:h-10 sm:w-10"
                >
                  {isChangingTheme ? (
                    <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 animate-spin" />
                  ) : isDarkMode ? (
                    <Sun className="h-4 w-4 sm:h-5 sm:w-5" />
                  ) : (
                    <Moon className="h-4 w-4 sm:h-5 sm:w-5" />
                  )}
                </Button>
              )}
              <Button 
                variant="outline" 
                size="sm" 
                disabled={isChangingTheme || isSigningOut}
                onClick={handleSignOut}
                className="h-8 shrink-0 rounded-full border-transparent px-2 text-xs transition-all hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30 sm:h-10 sm:px-3 sm:text-sm"
              >
                {isSigningOut ? (
                  <Loader2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 animate-spin mr-1 sm:mr-2" />
                ) : (
                  <LogOut className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                )}
                {isSigningOut ? 'Signing out...' : 'Sign Out'}
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
