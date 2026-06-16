import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface RenameCategoryDialogProps {
  isOpen: boolean;
  onClose: () => void;
  categoryToRename: string | null;
  onSuccess: (newName: string) => Promise<void> | void;
}

export function RenameCategoryDialog({ isOpen, onClose, categoryToRename, onSuccess }: RenameCategoryDialogProps) {
  const [newCategoryName, setNewCategoryName] = useState(categoryToRename || '');
  const [isRenaming, setIsRenaming] = useState(false);

  const handleRenameCategorySubmit = async () => {
    if (!categoryToRename || !newCategoryName.trim()) return;
    setIsRenaming(true);
    try {
      const response = await fetch('/api/categories', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ oldName: categoryToRename, newName: newCategoryName.trim() })
      });
      if (response.ok) {
        await onSuccess(newCategoryName.trim());
        onClose();
      }
    } catch (error) {
      console.error('Failed to rename category:', error);
    } finally {
      setIsRenaming(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[92%] max-w-[425px] rounded-2xl glass dark:glass-dark border-border/50 max-h-[92dvh] flex flex-col p-0 overflow-y-auto">
        <div className="p-5 sm:p-6">
          <DialogHeader>
            <DialogTitle className="font-extrabold text-lg sm:text-xl">Rename Category</DialogTitle>
            <DialogDescription className="text-xs sm:text-sm mt-1.5 text-muted-foreground">
              This will update the category string internally for all notes currently inside this folder.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Input
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              placeholder="e.g. Project Specs"
              className="rounded-xl border-border bg-background/50 h-11 text-sm sm:text-base font-semibold"
              autoFocus
            />
          </div>
        </div>
        <DialogFooter className="gap-2 p-5 sm:p-6 pt-0 border-t border-border/10 bg-muted/5 flex-col sm:flex-row-reverse">
          <Button 
            onClick={handleRenameCategorySubmit} 
            className="w-full rounded-xl font-bold shadow-md shadow-primary/25 sm:w-auto h-11" 
            disabled={isRenaming || !newCategoryName.trim()}
          >
            {isRenaming ? 'Saving...' : 'Save Category'}
          </Button>
          <Button 
            variant="ghost" 
            onClick={onClose} 
            className="w-full rounded-xl font-semibold sm:w-auto h-11" 
            disabled={isRenaming}
          >
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
