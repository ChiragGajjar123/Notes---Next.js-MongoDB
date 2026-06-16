'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { createCategoryAction, renameCategoryAction } from '@/app/actions';

interface CategoryDialogProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'create' | 'rename';
  categoryToRename?: string | null;
  onSuccess: (categoryName: string) => Promise<void> | void;
}

export function CategoryDialog({ isOpen, onClose, mode, categoryToRename, onSuccess }: CategoryDialogProps) {
  const [state, setState] = useState({
    categoryName: '',
    isLoading: false,
  });
  const { categoryName, isLoading } = state;

  // Sync state with props when dialog opens/changes mode
  useEffect(() => {
    if (isOpen) {
      if (mode === 'rename' && categoryToRename) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setState(prev => ({ ...prev, categoryName: categoryToRename }));
      } else {
         
        setState(prev => ({ ...prev, categoryName: '' }));
      }
    }
  }, [isOpen, mode, categoryToRename]);

  const handleSubmit = async () => {
    const trimmedName = categoryName.trim();
    if (!trimmedName) return;
    
    setState(prev => ({ ...prev, isLoading: true }));
    try {
      const result = mode === 'create'
        ? await createCategoryAction(trimmedName)
        : categoryToRename
          ? await renameCategoryAction(categoryToRename, trimmedName)
          : { ok: false, error: 'Missing category name.' };

      if (result.ok) {
        await onSuccess(trimmedName);
        onClose();
      } else {
        console.error(`Failed to ${mode} category:`, result.error);
      }
    } catch (e) {
      console.error(`Failed to ${mode} category:`, e);
    } finally {
      setState(prev => ({ ...prev, isLoading: false }));
    }
  };

  const isCreate = mode === 'create';
  const titleText = isCreate ? 'Create New Category' : 'Rename Category';
  const descText = isCreate
    ? 'Add a new folder to organize your notes. You can drag and drop notes into this folder later.'
    : 'This will update the category string internally for all notes currently inside this folder.';
  const placeholderText = isCreate ? 'e.g. Work, Personal, Ideas' : 'e.g. Project Specs';
  const buttonText = isCreate
    ? (isLoading ? 'Creating...' : 'Create Folder')
    : (isLoading ? 'Saving...' : 'Save Category');

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[92%] max-w-[425px] rounded-2xl glass dark:glass-dark border-border/50 max-h-[92dvh] flex flex-col p-0 overflow-y-auto">
        <div className="p-5 sm:p-6">
          <DialogHeader>
            <DialogTitle className="font-extrabold text-lg sm:text-xl">{titleText}</DialogTitle>
            <DialogDescription className="text-xs sm:text-sm mt-1.5 text-muted-foreground">
              {descText}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Input
              value={categoryName}
              onChange={(e) => setState(prev => ({ ...prev, categoryName: e.target.value }))}
              placeholder={placeholderText}
              className="rounded-xl border-border bg-background/50 h-11 text-sm sm:text-base font-semibold"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter' && categoryName.trim() && !isLoading) {
                  handleSubmit();
                }
              }}
            />
          </div>
        </div>
        <DialogFooter className="gap-2 p-5 sm:p-6 pt-0 border-t border-border/10 bg-muted/5 flex-col sm:flex-row-reverse">
          <Button 
            onClick={handleSubmit} 
            className="w-full rounded-xl font-bold shadow-md shadow-primary/25 sm:w-auto h-11" 
            disabled={isLoading || !categoryName.trim()}
          >
            {buttonText}
          </Button>
          <Button 
            variant="ghost" 
            onClick={onClose} 
            className="w-full rounded-xl font-semibold sm:w-auto h-11" 
            disabled={isLoading}
          >
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
