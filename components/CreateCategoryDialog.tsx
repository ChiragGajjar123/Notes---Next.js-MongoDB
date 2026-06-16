import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface CreateCategoryDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (categoryName: string) => Promise<void> | void;
}

export function CreateCategoryDialog({ isOpen, onClose, onSuccess }: CreateCategoryDialogProps) {
  const [newCreatedCategory, setNewCreatedCategory] = useState('');
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);

  const handleCreateCategorySubmit = async () => {
    const categoryName = newCreatedCategory.trim();
    if (!categoryName) return;
    setIsCreatingCategory(true);
    try {
      const response = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: categoryName })
      });
      if (response.ok) {
        await onSuccess(categoryName);
        setNewCreatedCategory('');
        onClose();
      }
    } catch (e) {
      console.error('Failed to create category:', e);
    } finally {
      setIsCreatingCategory(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[92%] max-w-[425px] rounded-2xl glass dark:glass-dark border-border/50 max-h-[92dvh] flex flex-col p-0 overflow-y-auto">
        <div className="p-5 sm:p-6">
          <DialogHeader>
            <DialogTitle className="font-extrabold text-lg sm:text-xl">Create New Category</DialogTitle>
            <DialogDescription className="text-xs sm:text-sm mt-1.5 text-muted-foreground">
              Add a new folder to organize your notes. You can drag and drop notes into this folder later.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Input
              value={newCreatedCategory}
              onChange={(e) => setNewCreatedCategory(e.target.value)}
              placeholder="e.g. Work, Personal, Ideas"
              className="rounded-xl border-border bg-background/50 h-11 text-sm sm:text-base font-semibold"
              autoFocus
            />
          </div>
        </div>
        <DialogFooter className="gap-2 p-5 sm:p-6 pt-0 border-t border-border/10 bg-muted/5 flex-col sm:flex-row-reverse">
          <Button 
            onClick={handleCreateCategorySubmit} 
            className="w-full rounded-xl font-bold shadow-md shadow-primary/25 sm:w-auto h-11" 
            disabled={isCreatingCategory || !newCreatedCategory.trim()}
          >
            {isCreatingCategory ? 'Creating...' : 'Create Folder'}
          </Button>
          <Button 
            variant="ghost" 
            onClick={onClose} 
            className="w-full rounded-xl font-semibold sm:w-auto h-11" 
            disabled={isCreatingCategory}
          >
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
