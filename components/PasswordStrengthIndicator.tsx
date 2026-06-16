'use client';

import { useMemo } from 'react';
import { Check, X } from 'lucide-react';
import { PASSWORD_REQUIREMENTS, getPasswordStrength } from '@/lib/validations';

interface PasswordStrengthIndicatorProps {
  password: string;
}

export function PasswordStrengthIndicator({ password }: PasswordStrengthIndicatorProps) {
  const passwordStrength = useMemo(
    () => getPasswordStrength(password),
    [password]
  );

  const requirementsMet = useMemo(
    () => PASSWORD_REQUIREMENTS.map((r) => ({ ...r, met: r.test(password) })),
    [password]
  );

  if (!password) return null;

  return (
    <div className="mt-2.5 space-y-2.5 p-3 rounded-xl bg-secondary/20 border border-border/40 animate-in fade-in slide-in-from-top-1 duration-200">
      {/* Strength Bar */}
      <div className="flex items-center gap-2">
        <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-300 ${passwordStrength.color}`}
            style={{ width: `${passwordStrength.score}%` }}
          />
        </div>
        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground min-w-[4.5rem] text-right">
          {passwordStrength.label}
        </span>
      </div>

      {/* Requirements Checklist */}
      <div className="grid grid-cols-1 gap-1">
        {requirementsMet.map((req) => (
          <div
            key={req.label}
            className={`flex items-center gap-1.5 text-xs transition-colors duration-200 ${
              req.met
                ? 'text-green-600 dark:text-green-400 font-medium'
                : 'text-muted-foreground/70'
            }`}
          >
            {req.met ? (
              <Check className="h-3.5 w-3.5 shrink-0 text-green-500" />
            ) : (
              <X className="h-3.5 w-3.5 shrink-0 text-muted-foreground/40" />
            )}
            <span>{req.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
