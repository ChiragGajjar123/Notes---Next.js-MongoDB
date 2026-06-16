import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';

interface DeleteConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isDeleting: boolean;
}

export function DeleteConfirmDialog({ isOpen, onClose, onConfirm, isDeleting }: DeleteConfirmDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[92%] max-w-[400px] rounded-2xl glass dark:glass-dark border-destructive/20 shadow-destructive/10 max-h-[92dvh] flex flex-col p-0 overflow-y-auto">
        <div className="p-5 sm:p-6">
          <DialogHeader>
            <div className="mx-auto w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
              <Trash2 className="h-6 w-6 text-destructive animate-pulse" />
            </div>
            <DialogTitle className="text-center text-xl font-extrabold tracking-tight">Delete Note</DialogTitle>
            <DialogDescription className="text-center text-xs sm:text-sm mt-2 text-muted-foreground/95 font-medium leading-relaxed">
              Are you sure you want to delete this note? This action is permanent and cannot be undone.
            </DialogDescription>
          </DialogHeader>
        </div>
        <DialogFooter className="gap-2 p-5 sm:p-6 pt-0 border-t border-border/10 bg-muted/5 flex-col sm:flex-row-reverse">
          <Button 
            onClick={onConfirm} 
            className="w-full rounded-xl font-bold bg-destructive text-destructive-foreground hover:bg-destructive/90 sm:w-auto h-11"
            disabled={isDeleting}
          >
            Delete Note
          </Button>
          <Button 
            variant="ghost" 
            onClick={onClose} 
            className="w-full rounded-xl font-semibold sm:w-auto h-11"
            disabled={isDeleting}
          >
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
