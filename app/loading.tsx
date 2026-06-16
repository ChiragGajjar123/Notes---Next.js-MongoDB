import { Loader2, Sparkles } from 'lucide-react';

export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden">
      {/* Background ambient glow matching the premium design */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl -z-10 animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl -z-10" />

      <div className="flex flex-col items-center gap-5 p-6 text-center animate-in fade-in zoom-in-95 duration-500">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="h-7 w-7 text-primary animate-pulse" />
          <h2 className="text-3xl font-extrabold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            Notes
            </h2>
        </div>
        
        <div className="relative flex items-center justify-center">
          <div className="w-14 h-14 border-4 border-muted rounded-full"></div>
          <Loader2 className="absolute h-8 w-8 text-primary animate-spin" />
        </div>

        <div className="space-y-1 mt-2">
          <p className="text-lg font-semibold text-foreground">Preparing your notes</p>
          <p className="text-sm text-muted-foreground">Setting up your personal workspace...</p>
        </div>
      </div>
    </div>
  );
}
