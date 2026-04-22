'use client';

import { useState, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { NoteCard } from '@/components/NoteCard';
import { NoteEditor } from '@/components/NoteEditor';
import { Plus, Search, LogOut, Archive, FileText, Moon, Sun, Sparkles, Pencil, Trash2, AlertTriangle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Note } from '@/types';

export function NotesDashboard() {
  const { data: session, status } = useSession();
  const [notes, setNotes] = useState<Note[]>([]);
  const [filteredNotes, setFilteredNotes] = useState<Note[]>([]);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showArchived, setShowArchived] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);

  const [isRenameOpen, setIsRenameOpen] = useState(false);
  const [categoryToRename, setCategoryToRename] = useState<string | null>(null);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [isDeleteWarnOpen, setIsDeleteWarnOpen] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);

  const [savedCategories, setSavedCategories] = useState<string[]>([]);
  const [isCreateCategoryOpen, setIsCreateCategoryOpen] = useState(false);
  const [newCreatedCategory, setNewCreatedCategory] = useState('');
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  const categories = [
    'all',
    ...Array.from(new Set([...savedCategories, ...notes.map(n => n.category)]))
      .filter(c => c && !['all', 'other'].includes(c.toLowerCase()))
  ];
  const editorCategories = savedCategories.filter(category => !['all', 'other'].includes(category.toLowerCase()));
  const editorDefaultCategory = selectedCategory === 'all'
    ? (editorCategories[0] || 'other')
    : selectedCategory;

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/categories?t=' + Date.now(), {
        cache: 'no-store',
        headers: { 'Pragma': 'no-cache' }
      });
      if (response.ok) {
        const data = await response.json();
        setSavedCategories(data.categories || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchUserSettings = async () => {
    try {
      const response = await fetch('/api/user/settings');
      if (response.ok) {
        const data = await response.json();
        if (data.theme) {
          setIsDarkMode(data.theme === 'dark');
        }
      }
    } catch (e) {
      console.error('Failed to fetch user settings:', e);
    }
  };

  useEffect(() => {
    if (session) {
      const init = async () => {
        setIsInitialLoading(true);
        await Promise.all([
          fetchCategories(),
          fetchNotes(false), // don't set internal loading here, we handle it in this wrapper
          fetchUserSettings()
        ]);
        setIsInitialLoading(false);
      };
      init();
    }
  }, [session, showArchived]);

  useEffect(() => {
    filterNotes();
  }, [notes, searchQuery, selectedCategory]);

  useEffect(() => {
    if (selectedCategory !== 'all' && !categories.includes(selectedCategory)) {
      setSelectedCategory('all');
    }
  }, [categories, selectedCategory]);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const fetchNotes = async (isInitial = false) => {
    if (isInitial) setIsInitialLoading(true);
    try {
      const params = new URLSearchParams();
      if (showArchived) params.append('archived', 'true');
      params.append('t', Date.now().toString());

      const response = await fetch(`/api/notes?${params}`, {
        cache: 'no-store',
        headers: { 'Pragma': 'no-cache' }
      });
      if (response.ok) {
        const data = await response.json();
        setNotes(data);
        setFilteredNotes(getFilteredNotes(data, searchQuery, selectedCategory));
      }
    } catch (error) {
      console.error('Error fetching notes:', error);
    } finally {
      if (isInitial) setIsInitialLoading(false);
    }
  };

  const getFilteredNotes = (sourceNotes: Note[], search: string, category: string) => {
    let filtered = sourceNotes;

    if (search) {
      const normalizedSearch = search.toLowerCase();
      filtered = filtered.filter(note =>
        note.title.toLowerCase().includes(normalizedSearch) ||
        note.content.toLowerCase().includes(normalizedSearch) ||
        note.tags.some(tag => tag.toLowerCase().includes(normalizedSearch))
      );
    }

    if (category !== 'all') {
      filtered = filtered.filter(note => note.category === category);
    }

    return filtered;
  };

  const filterNotes = () => {
    setFilteredNotes(getFilteredNotes(notes, searchQuery, selectedCategory));
  };

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
        if (selectedCategory === categoryToRename) {
          setSelectedCategory(newCategoryName.trim());
        }
        await fetchNotes();
        await fetchCategories();
        setIsRenameOpen(false);
      }
    } catch (error) {
      console.error('Failed to rename category:', error);
    } finally {
      setIsRenaming(false);
    }
  };

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
        await fetchCategories();
        setSelectedCategory(categoryName);
        setIsCreateCategoryOpen(false);
        setNewCreatedCategory('');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsCreatingCategory(false);
    }
  };

  const handleExecuteDeleteEmptyCategory = async (name: string) => {
    try {
      const response = await fetch(`/api/categories?name=${encodeURIComponent(name)}`, { method: 'DELETE' });
      if (response.ok) {
        await fetchCategories();
        await fetchNotes();
      }
    } catch (e) { console.error(e); }
  };

  const handleCreateNote = () => {
    setEditingNote(null);
    setIsEditorOpen(true);
  };

  const handleEditNote = (note: Note) => {
    setEditingNote(note);
    setIsEditorOpen(true);
  };

  const handleSaveNote = async (noteData: Partial<Note>) => {
    try {
      const url = noteData._id ? `/api/notes/${noteData._id}` : '/api/notes';
      const method = noteData._id ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(noteData),
      });

      if (!response.ok) {
        throw new Error('Failed to save note');
      }

      await fetchNotes();
      await fetchCategories();
    } catch (error) {
      console.error('Error saving note:', error);
      throw error;
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    if (confirm('Are you sure you want to delete this note?')) {
      try {
        const response = await fetch(`/api/notes/${noteId}`, {
          method: 'DELETE',
        });

        if (response.ok) {
          fetchNotes();
        }
      } catch (error) {
        console.error('Error deleting note:', error);
      }
    }
  };

  const handleTogglePin = async (noteId: string) => {
    try {
      const note = notes.find(n => n._id === noteId);
      if (note) {
        await handleSaveNote({ ...note, isPinned: !note.isPinned });
      }
    } catch (error) {
      console.error('Error toggling pin:', error);
    }
  };

  const handleToggleArchive = async (noteId: string) => {
    try {
      const note = notes.find(n => n._id === noteId);
      if (note) {
        await handleSaveNote({ ...note, isArchived: !note.isArchived });
      }
    } catch (error) {
      console.error('Error toggling archive:', error);
    }
  };

  const toggleDarkMode = async () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    
    try {
      await fetch('/api/user/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ theme: newMode ? 'dark' : 'light' })
      });
    } catch (error) {
      console.error('Failed to save theme preference:', error);
    }
  };

  if (status === 'loading' || (session && isInitialLoading)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <div className="text-lg font-medium text-muted-foreground">Loading your workspace...</div>
        </div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background relative transition-colors duration-500">
      <header className="fixed inset-x-0 top-0 z-40 w-full glass dark:glass-dark border-b border-border/40 shadow-sm transition-all duration-300">
        <div className="container mx-auto px-3 sm:px-6 py-3 sm:py-4">
          <div className="flex flex-wrap items-center justify-between gap-2 sm:gap-3">
            <div className="flex min-w-0 flex-wrap items-center gap-2 sm:gap-3">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <Sparkles className="h-5 w-5 sm:h-6 sm:w-6 text-primary animate-pulse" />
                <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                  Notes
                </h1>
              </div>
              <Button
                variant={showArchived ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setShowArchived(!showArchived)}
                aria-label={showArchived ? 'Show active notes' : 'Show archived notes'}
                className="h-8 w-8 rounded-full px-0 text-xs transition-all sm:h-9 sm:w-auto sm:px-3 sm:text-sm"
              >
                <Archive className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4 sm:mr-2" />
                <span className="hidden sm:inline">{showArchived ? 'Active' : 'Archived'}</span>
              </Button>
            </div>

            <div className="flex min-w-0 flex-1 items-center justify-end gap-1.5 sm:gap-3">
              <span className="min-w-0 truncate text-xs font-medium text-muted-foreground sm:text-sm">
                Hi, <span className="text-foreground">{session.user?.name}</span>
              </span>
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleDarkMode}
                className="h-8 w-8 shrink-0 rounded-full hover:bg-muted/50 transition-all sm:h-10 sm:w-10"
              >
                {isDarkMode ? <Sun className="h-4 w-4 sm:h-5 sm:w-5" /> : <Moon className="h-4 w-4 sm:h-5 sm:w-5" />}
              </Button>
              <Button variant="outline" size="sm" onClick={() => signOut()} className="h-8 shrink-0 rounded-full border-transparent px-2 text-xs transition-all hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30 sm:h-10 sm:px-3 sm:text-sm">
                <LogOut className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-3 sm:px-6 pb-4 pt-24 sm:pb-8 sm:pt-28 relative z-10">
        <div className="flex flex-col lg:flex-row gap-4 sm:gap-8">
          <aside className="lg:w-72 flex-shrink-0">
            <div className="sticky top-24 space-y-4 sm:top-28 sm:space-y-6 glass dark:glass-dark p-3 sm:p-6 rounded-xl sm:rounded-2xl shadow-sm border border-border/50">
              <Button
                onClick={handleCreateNote}
                className="w-full h-11 sm:h-12 text-sm sm:text-base font-semibold rounded-xl shadow-lg hover:shadow-primary/25 hover:scale-[1.02] active:scale-[0.98] transition-all bg-primary text-primary-foreground"
              >
                <Plus className="h-4.5 w-4.5 sm:h-5 sm:w-5 mr-2" />
                Create New Note
              </Button>

              <div className="relative group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground transition-colors" />
                <Input
                  placeholder="Search your notes..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 sm:pl-10 bg-background/50 border-border shadow-inner rounded-xl transition-all h-10 sm:h-11 text-sm sm:text-base"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-3 px-1 sm:px-2">
                  <h3 className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-muted-foreground">Folders</h3>
                  <Button variant="ghost" size="icon" className="h-6 w-6 rounded-md hover:bg-primary/20 hover:text-primary transition-colors" onClick={() => setIsCreateCategoryOpen(true)}>
                    <Plus className="h-3.5 w-3.5" />
                  </Button>
                </div>
                <div className="space-y-1">
                  {categories.map((category) => (
                    <div key={category} className="group relative flex items-center">
                      <Button
                        variant={selectedCategory === category ? 'secondary' : 'ghost'}
                        className={`flex-1 justify-start capitalize rounded-xl transition-all h-9 sm:h-10 text-xs sm:text-sm ${selectedCategory === category ? 'bg-primary/10 text-primary font-medium' : 'text-muted-foreground hover:bg-muted/50'}`}
                        onClick={() => setSelectedCategory(category)}
                      >
                        <FileText className={`h-3.5 w-3.5 sm:h-4 sm:w-4 mr-2 sm:mr-3 flex-shrink-0 ${selectedCategory === category ? 'text-primary' : 'text-muted-foreground'}`} />
                        <span className="truncate pr-8 sm:pr-10">{category}</span>
                      </Button>

                      {category !== 'all' && (
                        <div className="absolute right-1 sm:right-2 flex gap-0.5 opacity-100 transition-opacity sm:gap-1 lg:opacity-0 lg:group-hover:opacity-100">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 sm:h-7 sm:w-7 rounded-lg hover:bg-background shadow-sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              setCategoryToRename(category);
                              setNewCategoryName(category);
                              setIsRenameOpen(true);
                            }}
                          >
                            <Pencil className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-muted-foreground" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 sm:h-7 sm:w-7 rounded-lg hover:bg-destructive/10 hover:text-destructive shadow-sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              const hasNotes = notes.some(n => n.category === category);
                              if (hasNotes) {
                                setIsDeleteWarnOpen(true);
                              } else {
                                handleExecuteDeleteEmptyCategory(category);
                              }
                            }}
                          >
                            <Trash2 className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </aside>

          <div className="flex-1">
            {filteredNotes.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-5 sm:p-12 glass dark:glass-dark rounded-2xl sm:rounded-3xl border border-border/50 text-center animate-in fade-in zoom-in duration-500">
                <div className="w-16 h-16 sm:w-24 sm:h-24 bg-primary/10 rounded-full flex items-center justify-center mb-4 sm:mb-6">
                  <FileText className="h-8 w-8 sm:h-10 sm:w-10 text-primary" />
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-foreground mb-2 sm:mb-3">
                  {showArchived ? 'No archived notes' : 'No notes found'}
                </h3>
                <p className="text-muted-foreground max-w-sm mb-6 sm:mb-8 text-base sm:text-lg">
                  {showArchived
                    ? 'Archive some notes to keep your workspace clean and organized.'
                    : 'Start capturing your ideas, tasks, and important thoughts today.'
                  }
                </p>
                {!showArchived && (
                  <Button onClick={handleCreateNote} size="lg" className="h-11 sm:h-12 rounded-xl shadow-lg hover:shadow-primary/25 hover:scale-105 transition-all text-sm sm:text-base px-5 sm:px-6">
                    <Plus className="h-4.5 w-4.5 sm:h-5 sm:w-5 mr-2" />
                    Write your first note
                  </Button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-5 sm:gap-6">
                {filteredNotes.map((note) => (
                  <div key={note._id} className="animate-in fade-in zoom-in duration-300">
                    <NoteCard
                      note={note}
                      onEdit={handleEditNote}
                      onDelete={handleDeleteNote}
                      onTogglePin={handleTogglePin}
                      onToggleArchive={handleToggleArchive}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      <NoteEditor
        isOpen={isEditorOpen}
        onClose={() => setIsEditorOpen(false)}
        onSave={handleSaveNote}
        note={editingNote}
        existingCategories={editorCategories}
        defaultCategory={editorDefaultCategory}
      />

      <Dialog open={isCreateCategoryOpen} onOpenChange={setIsCreateCategoryOpen}>
        <DialogContent className="w-[92%] max-w-[425px] rounded-xl sm:rounded-2xl glass dark:glass-dark border-border/50 max-h-[92dvh] flex flex-col p-0 overflow-y-auto">
          <div className="p-4 sm:p-6">
            <DialogHeader>
              <DialogTitle>Create New Category</DialogTitle>
              <DialogDescription>
                Add a new folder to organize your notes. You can drag and drop notes into this folder later.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <Input
                value={newCreatedCategory}
                onChange={(e) => setNewCreatedCategory(e.target.value)}
                placeholder="e.g. Work, Personal, Ideas"
                className="rounded-xl border-border/80 bg-background/50 h-11"
                autoFocus
              />
            </div>
          </div>
          <DialogFooter className="gap-2 p-4 sm:p-6 pt-0 border-t border-border/10 bg-muted/5">
            <Button variant="ghost" onClick={() => setIsCreateCategoryOpen(false)} className="w-full rounded-xl sm:w-auto" disabled={isCreatingCategory}>Cancel</Button>
            <Button onClick={handleCreateCategorySubmit} className="w-full rounded-xl font-bold shadow-md shadow-primary/20 sm:w-auto" disabled={isCreatingCategory || !newCreatedCategory.trim()}>
              {isCreatingCategory ? 'Creating...' : 'Create Folder'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isRenameOpen} onOpenChange={setIsRenameOpen}>
        <DialogContent className="w-[92%] max-w-[425px] rounded-xl sm:rounded-2xl glass dark:glass-dark border-border/50 max-h-[92dvh] flex flex-col p-0 overflow-y-auto">
          <div className="p-4 sm:p-6">
            <DialogHeader>
              <DialogTitle>Rename Category</DialogTitle>
              <DialogDescription>
                This will update the category string internally for all notes currently inside this folder.
              </DialogDescription>
            </DialogHeader>
            <div className="py-2">
              <Input
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="e.g. Project Specs"
                className="rounded-xl border-border/80 bg-background/50 h-11"
                autoFocus
              />
            </div>
          </div>
          <DialogFooter className="gap-2 p-4 sm:p-6 pt-0 border-t border-border/10 bg-muted/5">
            <Button variant="ghost" onClick={() => setIsRenameOpen(false)} className="w-full rounded-xl sm:w-auto" disabled={isRenaming}>Cancel</Button>
            <Button onClick={handleRenameCategorySubmit} className="w-full rounded-xl font-bold shadow-md shadow-primary/20 sm:w-auto" disabled={isRenaming || !newCategoryName.trim()}>
              {isRenaming ? 'Saving...' : 'Save Category'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isDeleteWarnOpen} onOpenChange={setIsDeleteWarnOpen}>
        <DialogContent className="w-[92%] max-w-[425px] rounded-xl sm:rounded-2xl glass dark:glass-dark border-destructive/20 shadow-destructive/10 max-h-[92dvh] flex flex-col p-0 overflow-y-auto">
          <div className="p-4 sm:p-6">
            <DialogHeader>
              <div className="mx-auto w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
                <AlertTriangle className="h-6 w-6 text-destructive" />
              </div>
              <DialogTitle className="text-center text-xl">Cannot Delete Category</DialogTitle>
              <DialogDescription className="sr-only">
                Information about why this category cannot be deleted yet.
              </DialogDescription>
            </DialogHeader>
            <div className="text-center py-4 text-muted-foreground leading-relaxed">
              Categories cannot be deleted while they still contain notes.
              <br /><br />
              Please edit your notes to place them in a different category, or delete them first. Once empty, this category will automatically be cleared from your sidebar.
            </div>
          </div>
          <DialogFooter className="sm:justify-center p-4 sm:p-6 pt-0 border-t border-border/10 bg-muted/5">
            <Button onClick={() => setIsDeleteWarnOpen(false)} className="w-full rounded-xl px-8 sm:w-auto" variant="outline">Understand</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
