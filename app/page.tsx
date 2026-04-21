'use client';

import { useState, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { NoteCard } from '@/components/NoteCard';
import { NoteEditor } from '@/components/NoteEditor';
import { Plus, Search, LogOut, Archive, FileText, Moon, Sun, Sparkles, Pencil, Trash2, AlertTriangle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Note } from '@/types';

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();
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

  const categories = ['all', ...Array.from(new Set([...savedCategories, ...notes.map(n => n.category)])).filter(c => c && c.toLowerCase() !== 'all')];

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

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    }
  }, [status, router]);

  useEffect(() => {
    if (session) {
      fetchCategories();
      fetchNotes();
    }
  }, [session, showArchived]);

  useEffect(() => {
    filterNotes();
  }, [notes, searchQuery, selectedCategory]);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const fetchNotes = async () => {
    try {
      const params = new URLSearchParams();
      if (showArchived) params.append('archived', 'true');
      if (searchQuery) params.append('search', searchQuery);
      if (selectedCategory !== 'all') params.append('category', selectedCategory);
      params.append('t', Date.now().toString());

      const response = await fetch(`/api/notes?${params}`, {
        cache: 'no-store',
        headers: { 'Pragma': 'no-cache' }
      });
      if (response.ok) {
        const data = await response.json();
        setNotes(data);
      }
    } catch (error) {
      console.error('Error fetching notes:', error);
    }
  };

  const filterNotes = () => {
    let filtered = notes;

    if (searchQuery) {
      filtered = filtered.filter(note =>
        note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        note.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        note.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(note => note.category === selectedCategory);
    }

    setFilteredNotes(filtered);
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
    if (!newCreatedCategory.trim()) return;
    setIsCreatingCategory(true);
    try {
      const response = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newCreatedCategory.trim() })
      });
      if (response.ok) {
        await fetchCategories();
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

      if (response.ok) {
        fetchNotes();
      }
    } catch (error) {
      console.error('Error saving note:', error);
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

  if (status === 'loading') {
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
    <div className="min-h-screen bg-background relative overflow-hidden transition-colors duration-500">
      {/* Abstract Background Decoration */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-primary/20 blur-3xl rounded-full pointer-events-none transition-all" />
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-primary/10 blur-3xl rounded-full pointer-events-none transition-all" />

      <header className="sticky top-0 z-40 w-full glass dark:glass-dark border-b border-border/40 shadow-sm transition-all duration-300">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Sparkles className="h-6 w-6 text-primary animate-pulse" />
                <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                  Notes
                </h1>
              </div>
              <div className="hidden md:flex items-center ml-6 gap-2">
                <Button
                  variant={showArchived ? 'secondary' : 'ghost'}
                  size="sm"
                  onClick={() => setShowArchived(!showArchived)}
                  className="rounded-full transition-all"
                >
                  <Archive className="h-4 w-4 mr-2" />
                  {showArchived ? 'Active' : 'Archived'}
                </Button>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <span className="text-sm font-medium text-muted-foreground hidden sm:block">
                Welcome back, <span className="text-foreground">{session.user?.name}</span>
              </span>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsDarkMode(!isDarkMode)}
                className="rounded-full hover:bg-muted/50 transition-all"
              >
                {isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </Button>
              <Button variant="outline" size="sm" onClick={() => signOut()} className="rounded-full hover:bg-destructive/10 hover:text-destructive border-transparent hover:border-destructive/30 transition-all">
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 relative z-10">
        <div className="flex flex-col lg:flex-row gap-8">
          <aside className="lg:w-72 flex-shrink-0">
            <div className="sticky top-28 space-y-6 glass dark:glass-dark p-6 rounded-2xl shadow-sm border border-border/50">
              <Button
                onClick={handleCreateNote}
                className="w-full h-12 text-base font-semibold rounded-xl shadow-lg hover:shadow-primary/25 hover:scale-[1.02] active:scale-[0.98] transition-all bg-primary text-primary-foreground"
              >
                <Plus className="h-5 w-5 mr-2" />
                Create New Note
              </Button>

              <div className="relative group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground transition-colors" />
                <Input
                  placeholder="Search your notes..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 bg-background/50 border-border shadow-inner rounded-xl transition-all"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-3 px-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Folders</h3>
                  <Button variant="ghost" size="icon" className="h-6 w-6 rounded-md hover:bg-primary/20 hover:text-primary transition-colors" onClick={() => setIsCreateCategoryOpen(true)}>
                    <Plus className="h-3.5 w-3.5" />
                  </Button>
                </div>
                <div className="space-y-1">
                  {categories.map((category) => (
                    <div key={category} className="group relative flex items-center">
                      <Button
                        variant={selectedCategory === category ? 'secondary' : 'ghost'}
                        className={`flex-1 justify-start capitalize rounded-xl transition-all ${selectedCategory === category ? 'bg-primary/10 text-primary font-medium' : 'text-muted-foreground hover:bg-muted/50'}`}
                        onClick={() => setSelectedCategory(category)}
                      >
                        <FileText className={`h-4 w-4 mr-3 flex-shrink-0 ${selectedCategory === category ? 'text-primary' : 'text-muted-foreground'}`} />
                        <span className="truncate pr-10">{category}</span>
                      </Button>

                      {category !== 'all' && (
                        <div className="absolute right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 rounded-lg hover:bg-background shadow-sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              setCategoryToRename(category);
                              setNewCategoryName(category);
                              setIsRenameOpen(true);
                            }}
                          >
                            <Pencil className="h-3 w-3 text-muted-foreground" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 rounded-lg hover:bg-destructive/10 hover:text-destructive shadow-sm"
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
                            <Trash2 className="h-3 w-3" />
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
              <div className="flex flex-col items-center justify-center p-12 glass dark:glass-dark rounded-3xl border border-border/50 text-center animate-in fade-in zoom-in duration-500">
                <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mb-6">
                  <FileText className="h-10 w-10 text-primary" />
                </div>
                <h3 className="text-2xl font-bold text-foreground mb-3">
                  {showArchived ? 'No archived notes' : 'No notes found'}
                </h3>
                <p className="text-muted-foreground max-w-sm mb-8 text-lg">
                  {showArchived
                    ? 'Archive some notes to keep your workspace clean and organized.'
                    : 'Start capturing your ideas, tasks, and important thoughts today.'
                  }
                </p>
                {!showArchived && (
                  <Button onClick={handleCreateNote} size="lg" className="rounded-xl shadow-lg hover:shadow-primary/25 hover:scale-105 transition-all">
                    <Plus className="h-5 w-5 mr-2" />
                    Write your first note
                  </Button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6">
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
        existingCategories={categories.filter(c => c !== 'all')}
      />

      <Dialog open={isCreateCategoryOpen} onOpenChange={setIsCreateCategoryOpen}>
        <DialogContent className="sm:max-w-[425px] rounded-2xl glass dark:glass-dark border-border/50">
          <DialogHeader>
            <DialogTitle>Create New Category</DialogTitle>
            <DialogDescription className="sr-only">
              Enter a name for your new persistent folder.
            </DialogDescription>
          </DialogHeader>
          <div className="py-2">
            <Input
              value={newCreatedCategory}
              onChange={(e) => setNewCreatedCategory(e.target.value)}
              placeholder="e.g. Brainstorms, Finance"
              className="rounded-xl border-border/80 bg-background/50 h-11"
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsCreateCategoryOpen(false)} className="rounded-xl" disabled={isCreatingCategory}>Cancel</Button>
            <Button onClick={handleCreateCategorySubmit} className="rounded-xl font-bold shadow-md shadow-primary/20" disabled={isCreatingCategory || !newCreatedCategory.trim()}>
              {isCreatingCategory ? 'Adding...' : 'Add Category'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isRenameOpen} onOpenChange={setIsRenameOpen}>
        <DialogContent className="sm:max-w-[425px] rounded-2xl glass dark:glass-dark border-border/50">
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
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsRenameOpen(false)} className="rounded-xl" disabled={isRenaming}>Cancel</Button>
            <Button onClick={handleRenameCategorySubmit} className="rounded-xl font-bold shadow-md shadow-primary/20" disabled={isRenaming || !newCategoryName.trim()}>
              {isRenaming ? 'Saving...' : 'Save Category'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isDeleteWarnOpen} onOpenChange={setIsDeleteWarnOpen}>
        <DialogContent className="sm:max-w-[425px] rounded-2xl glass dark:glass-dark border-destructive/20 shadow-destructive/10">
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
          <DialogFooter className="sm:justify-center">
            <Button onClick={() => setIsDeleteWarnOpen(false)} className="rounded-xl px-8" variant="outline">Understand</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
