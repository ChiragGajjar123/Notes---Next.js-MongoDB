'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { createCategoryAction, renameCategoryAction } from '@/app/actions';
import { useNotes } from '@/context/notes-context';

interface CategoryDialogProps {
  mode: 'create' | 'rename';
}

export function CategoryDialog({ mode }: CategoryDialogProps) {
  const {
    isCreateCategoryOpen,
    setIsCreateCategoryOpen,
    categoryToRename,
    setCategoryToRename,
    selectedCategory,
    setSelectedCategory,
    setSavedCategories,
    setNotes,
  } = useNotes();

  const isCreate = mode === 'create';
  const isOpen = isCreate ? isCreateCategoryOpen : categoryToRename !== null;
  const onClose = () => isCreate ? setIsCreateCategoryOpen(false) : setCategoryToRename(null);
  const currentCategoryToRename = isCreate ? null : categoryToRename;

  const onSuccess = (newName: string) => {
    if (isCreate) {
      setSavedCategories(prev => {
        if (!prev.includes(newName)) {
          return [...prev, newName];
        }
        return prev;
      });
      setSelectedCategory(newName);
    } else {
      if (categoryToRename) {
        if (selectedCategory === categoryToRename) {
          setSelectedCategory(newName);
        }
        setNotes(prevNotes => 
          prevNotes.map(n => n.category === categoryToRename ? { ...n, category: newName } : n)
        );
        setSavedCategories(prevCats => 
          prevCats.map(c => c === categoryToRename ? newName : c)
        );
      }
    }
  };

  const [state, setState] = useState({
    categoryName: '',
    isLoading: false,
  });
  const { categoryName, isLoading } = state;

  // Sync state with props when dialog opens/changes mode
  useEffect(() => {
    if (isOpen) {
      if (mode === 'rename' && currentCategoryToRename) {
        setState(prev => ({ ...prev, categoryName: currentCategoryToRename }));
      } else {
        setState(prev => ({ ...prev, categoryName: '' }));
      }
    }
  }, [isOpen, mode, currentCategoryToRename]);

  const handleSubmit = async () => {
    const trimmedName = categoryName.trim();
    if (!trimmedName) return;
    
    setState(prev => ({ ...prev, isLoading: true }));
    try {
      const result = mode === 'create'
        ? await createCategoryAction(trimmedName)
        : currentCategoryToRename
          ? await renameCategoryAction(currentCategoryToRename, trimmedName)
          : { ok: false, error: 'Missing category name.' };

      if (result.ok) {
        onSuccess(trimmedName);
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
