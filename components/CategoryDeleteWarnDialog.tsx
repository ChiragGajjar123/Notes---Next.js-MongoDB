import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';

interface CategoryDeleteWarnDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CategoryDeleteWarnDialog({ isOpen, onClose }: CategoryDeleteWarnDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[92%] max-w-[425px] rounded-2xl glass dark:glass-dark border-destructive/20 shadow-destructive/10 max-h-[92dvh] flex flex-col p-0 overflow-y-auto">
        <div className="p-5 sm:p-6">
          <DialogHeader>
            <div className="mx-auto w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
              <AlertTriangle className="h-6 w-6 text-destructive" />
            </div>
            <DialogTitle className="text-center font-extrabold text-lg sm:text-xl">Cannot Delete Category</DialogTitle>
            <DialogDescription className="sr-only">
              Information about why this category cannot be deleted yet.
            </DialogDescription>
          </DialogHeader>
          <div className="text-center py-4 text-xs sm:text-sm text-muted-foreground/90 leading-relaxed font-semibold">
            Categories cannot be deleted while they still contain notes.
            <br /><br />
            Please edit your notes to place them in a different category, or delete them first. Once empty, this category will automatically be cleared from your sidebar.
          </div>
        </div>
        <DialogFooter className="sm:justify-center p-5 sm:p-6 pt-0 border-t border-border/10 bg-muted/5">
          <Button onClick={onClose} className="w-full rounded-xl px-8 sm:w-auto h-11 font-bold" variant="outline">Understand</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
