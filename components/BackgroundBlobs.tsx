export function BackgroundBlobs() {
  return (
    <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
      <div className="absolute top-[-10%] left-[-10%] w-[55%] h-[55%] rounded-full bg-primary/10 blur-[80px] sm:blur-[120px] animate-blob-float-1" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[55%] h-[55%] rounded-full bg-primary/8 blur-[80px] sm:blur-[120px] animate-blob-float-2" />
      <div className="absolute top-[40%] left-[25%] w-[40%] h-[40%] rounded-full bg-indigo-500/5 blur-[70px] sm:blur-[100px] animate-blob-float-3" />
    </div>
  );
}
