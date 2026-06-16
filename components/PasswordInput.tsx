'use client';

import { useState } from 'react';
import { Input, type InputProps } from '@/components/ui/input';
import { Eye, EyeOff } from 'lucide-react';

export function PasswordInput({ className, ...props }: Omit<InputProps, 'type'>) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="relative">
      <Input
        type={showPassword ? 'text' : 'password'}
        className={`pr-11 bg-background/40 h-11 border-border/80 ${className || ''}`}
        {...props}
      />
      <button
        type="button"
        onClick={() => setShowPassword(!showPassword)}
        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/60 hover:text-foreground transition-colors"
        tabIndex={-1}
        aria-label={showPassword ? 'Hide password' : 'Show password'}
      >
        {showPassword ? (
          <EyeOff className="h-4.5 w-4.5" />
        ) : (
          <Eye className="h-4.5 w-4.5" />
        )}
      </button>
    </div>
  );
}
