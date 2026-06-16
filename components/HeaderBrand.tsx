import { Sparkles } from 'lucide-react';

/**
 * Server Component — renders the static brand/logo portion of the header.
 * No hooks, no state, no event handlers — pure static markup.
 */
export function HeaderBrand() {
  return (
    <div className="flex items-center gap-1.5 sm:gap-2">
      <Sparkles className="h-5 w-5 sm:h-6 sm:w-6 text-primary animate-pulse" />
      <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
        Notes
      </h1>
    </div>
  );
}
