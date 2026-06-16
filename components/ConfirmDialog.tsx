import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ReactNode } from 'react';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm?: () => void | Promise<void>;
  title: string;
  description?: ReactNode;
  icon?: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  isLoading?: boolean;
  variant?: 'destructive' | 'default';
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  icon,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  isLoading = false,
  variant = 'default'
}: ConfirmDialogProps) {
  const isDestructive = variant === 'destructive';
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={`w-[92%] max-w-[425px] rounded-2xl glass dark:glass-dark max-h-[92dvh] flex flex-col p-0 overflow-y-auto ${
        isDestructive ? 'border-destructive/20 shadow-destructive/10' : 'border-border/50'
      }`}>
        <div className="p-5 sm:p-6">
          <DialogHeader>
            {icon && (
              <div className={`mx-auto w-12 h-12 rounded-full flex items-center justify-center mb-4 ${
                isDestructive ? 'bg-destructive/10' : 'bg-primary/10'
              }`}>
                {icon}
              </div>
            )}
            <DialogTitle className="text-center text-lg sm:text-xl font-extrabold tracking-tight">{title}</DialogTitle>
            {description && (
              <DialogDescription asChild>
                <div className="text-center text-xs sm:text-sm mt-2 text-muted-foreground/95 font-medium leading-relaxed">
                  {description}
                </div>
              </DialogDescription>
            )}
          </DialogHeader>
        </div>
        <DialogFooter className="gap-2 p-5 sm:p-6 pt-0 border-t border-border/10 bg-muted/5 flex-col sm:flex-row-reverse sm:justify-center">
          {onConfirm ? (
            <>
              <Button 
                onClick={onConfirm} 
                className={`w-full rounded-xl font-bold sm:w-auto h-11 ${
                  isDestructive 
                    ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90' 
                    : 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-md shadow-primary/25'
                }`}
                disabled={isLoading}
              >
                {confirmLabel}
              </Button>
              <Button 
                variant="ghost" 
                onClick={onClose} 
                className="w-full rounded-xl font-semibold sm:w-auto h-11"
                disabled={isLoading}
              >
                {cancelLabel}
              </Button>
            </>
          ) : (
            <Button 
              onClick={onClose} 
              className="w-full rounded-xl px-8 sm:w-auto h-11 font-bold" 
              variant="outline"
            >
              {cancelLabel}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
