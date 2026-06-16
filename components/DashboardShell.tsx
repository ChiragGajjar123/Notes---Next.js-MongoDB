import { ReactNode } from 'react';

interface DashboardShellProps {
  children: ReactNode;
}

/**
 * Server Component — renders the static outer layout shell for the dashboard.
 * All interactive content is passed via `children` (client components).
 */
export function DashboardShell({ children }: DashboardShellProps) {
  return (
    <div className="min-h-screen bg-background relative transition-colors duration-500">
      {children}
    </div>
  );
}
