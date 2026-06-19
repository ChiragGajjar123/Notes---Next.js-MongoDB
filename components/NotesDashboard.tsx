'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { NoteCard } from '@/components/NoteCard';
import dynamic from 'next/dynamic';
import { Plus, Search, FileText, Pencil, Trash2, Loader2, LayoutGrid, List, Pin, AlertTriangle } from 'lucide-react';
import { Note } from '@/types';
import { Header } from '@/components/Header';
import { CategoryDialog } from '@/components/CategoryDialog';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import {
  deleteCategoryAction,
  deleteNoteAction,
  getCategoriesAction,
  getNotesAction,
  saveNoteAction,
  updateThemeAction,
} from '@/app/actions';

const NoteEditor = dynamic(() => import('@/components/NoteEditor').then(mod => mod.NoteEditor), {
  ssr: false
});

interface NotesDashboardProps {
  initialNotes: Note[];
  initialCategories: string[];
  initialTheme: string;
  sessionUser: {
    id: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
}

export function NotesDashboard({
  initialNotes,
  initialCategories,
  initialTheme,
  sessionUser,
}: NotesDashboardProps) {
  const { status } = useSession();
  const [state, setState] = useState({
    notes: initialNotes,
    isEditorOpen: false,
    editingNote: null as Note | null,
    searchQuery: '',
    selectedCategory: 'all',
    showArchived: false,
    isDarkMode: initialTheme === 'dark',
    categoryToRename: null as string | null,
    isDeleteWarnOpen: false,
    savedCategories: initialCategories,
    isCreateCategoryOpen: false,
    isDeletingNoteId: null as string | null,
    pinningNoteId: null as string | null,
    archivingNoteId: null as string | null,
    deletingCategoryName: null as string | null,
    isChangingTheme: false,
    isInitialLoading: false,
    viewMode: 'grid' as 'grid' | 'list',
    noteIdToDelete: null as string | null,
  });
  const {
    notes,
    isEditorOpen,
    editingNote,
    searchQuery,
    selectedCategory,
    showArchived,
    isDarkMode,
    categoryToRename,
    isDeleteWarnOpen,
    savedCategories,
    isCreateCategoryOpen,
    isDeletingNoteId,
    pinningNoteId,
    archivingNoteId,
    deletingCategoryName,
    isChangingTheme,
    isInitialLoading,
    viewMode,
    noteIdToDelete,
  } = state;

  const setShowArchived = (val: boolean | ((prev: boolean) => boolean)) => {
    setState(prev => ({
      ...prev,
      showArchived: typeof val === 'function' ? (val as (prev: boolean) => boolean)(prev.showArchived) : val
    }));
  };

  const setIsInitialLoading = (val: boolean) => setState(prev => ({ ...prev, isInitialLoading: val }));
  const setNotes = (val: Note[]) => setState(prev => ({ ...prev, notes: val }));
  const setIsEditorOpen = (val: boolean) => setState(prev => ({ ...prev, isEditorOpen: val }));
  const setEditingNote = (val: Note | null) => setState(prev => ({ ...prev, editingNote: val }));
  const setSearchQuery = (val: string) => setState(prev => ({ ...prev, searchQuery: val }));
  const setSelectedCategory = (val: string) => setState(prev => ({ ...prev, selectedCategory: val }));
  const setIsDarkMode = (val: boolean) => setState(prev => ({ ...prev, isDarkMode: val }));
  const setSavedCategories = (val: string[]) => setState(prev => ({ ...prev, savedCategories: val }));
  const setIsDeletingNoteId = (val: string | null) => setState(prev => ({ ...prev, isDeletingNoteId: val }));
  const setPinningNoteId = (val: string | null) => setState(prev => ({ ...prev, pinningNoteId: val }));
  const setArchivingNoteId = (val: string | null) => setState(prev => ({ ...prev, archivingNoteId: val }));
  const setDeletingCategoryName = (val: string | null) => setState(prev => ({ ...prev, deletingCategoryName: val }));
  const setIsChangingTheme = (val: boolean) => setState(prev => ({ ...prev, isChangingTheme: val }));
  const setViewMode = (val: 'grid' | 'list') => setState(prev => ({ ...prev, viewMode: val }));
  const setNoteIdToDelete = (val: string | null) => setState(prev => ({ ...prev, noteIdToDelete: val }));
  const setCategoryToRename = (val: string | null) => setState(prev => ({ ...prev, categoryToRename: val }));
  const setIsDeleteWarnOpen = (val: boolean) => setState(prev => ({ ...prev, isDeleteWarnOpen: val }));
  const setIsCreateCategoryOpen = (val: boolean) => setState(prev => ({ ...prev, isCreateCategoryOpen: val }));

  const fetchNotes = useCallback(async (isInitial = false) => {
    if (isInitial) setIsInitialLoading(true);
    try {
      const result = await getNotesAction(showArchived);
      if (result.ok) setNotes(result.data);
    } catch (error) {
      console.error('Error fetching notes:', error);
    } finally {
      if (isInitial) setIsInitialLoading(false);
    }
  }, [showArchived]);

  const fetchCategories = useCallback(async () => {
    try {
      const result = await getCategoriesAction();
      if (result.ok) setSavedCategories(result.data);
    } catch (e) {
      console.error(e);
    }
  }, []);

  const categories = useMemo(() => [
    'all',
    ...Array.from(new Set([...savedCategories, ...notes.map(n => n.category)]))
      .filter(c => c && !['all', 'other'].includes(c.toLowerCase()))
  ], [savedCategories, notes]);

  const activeCategory = useMemo(() => {
    return categories.includes(selectedCategory) ? selectedCategory : 'all';
  }, [categories, selectedCategory]);

  const filteredNotes = useMemo(() => {
    let filtered = notes;

    if (searchQuery) {
      const normalizedSearch = searchQuery.toLowerCase();
      filtered = filtered.filter(note =>
        note.title.toLowerCase().includes(normalizedSearch) ||
        note.content.toLowerCase().includes(normalizedSearch) ||
        note.tags.some(tag => tag.toLowerCase().includes(normalizedSearch))
      );
    }

    if (activeCategory !== 'all') {
      filtered = filtered.filter(note => note.category === activeCategory);
    }

    return filtered;
  }, [notes, searchQuery, activeCategory]);

  const editorCategories = useMemo(() => {
    return savedCategories.filter(category => !['all', 'other'].includes(category.toLowerCase()));
  }, [savedCategories]);

  const editorDefaultCategory = useMemo(() => {
    return activeCategory === 'all'
      ? (editorCategories[0] || 'other')
      : activeCategory;
  }, [activeCategory, editorCategories]);

  const isMounted = useRef(false);

  // Hydration-safe: read localStorage in useEffect, not in state initializer
  useEffect(() => {
    const saved = localStorage.getItem('notes-view-mode');
    if (saved === 'list' || saved === 'grid') {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setViewMode(saved);
    }
  }, []);

  useEffect(() => {
    if (!isMounted.current) {
      isMounted.current = true;
      return;
    }
    fetchNotes(false);
  }, [showArchived, fetchNotes]);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const handleExecuteDeleteEmptyCategory = async (name: string) => {
    setDeletingCategoryName(name);
    try {
      const result = await deleteCategoryAction(name);
      if (result.ok) {
        await fetchCategories();
        await fetchNotes();
      }
    } catch (e) { 
      console.error(e); 
    } finally {
      setDeletingCategoryName(null);
    }
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
      const result = await saveNoteAction(noteData);
      if (!result.ok) throw new Error(result.error);

      await fetchNotes();
      await fetchCategories();
    } catch (error) {
      console.error('Error saving note:', error);
      throw error;
    }
  };

  const handleDeleteNoteTrigger = (noteId: string) => {
    setNoteIdToDelete(noteId);
  };

  const executeDeleteNote = async () => {
    if (!noteIdToDelete) return;
    setIsDeletingNoteId(noteIdToDelete);
    try {
      const result = await deleteNoteAction(noteIdToDelete);
      if (result.ok) {
        await fetchNotes();
      }
    } catch (error) {
      console.error('Error deleting note:', error);
    } finally {
      setIsDeletingNoteId(null);
      setNoteIdToDelete(null);
    }
  };

  const handleTogglePin = async (noteId: string) => {
    setPinningNoteId(noteId);
    try {
      const note = notes.find(n => n._id === noteId);
      if (note) {
        await handleSaveNote({ ...note, isPinned: !note.isPinned });
      }
    } catch (error) {
      console.error('Error toggling pin:', error);
    } finally {
      setPinningNoteId(null);
    }
  };

  const handleToggleArchive = async (noteId: string) => {
    setArchivingNoteId(noteId);
    try {
      const note = notes.find(n => n._id === noteId);
      if (note) {
        await handleSaveNote({ ...note, isArchived: !note.isArchived });
      }
    } catch (error) {
      console.error('Error toggling archive:', error);
    } finally {
      setArchivingNoteId(null);
    }
  };

  const toggleDarkMode = async () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    setIsChangingTheme(true);
    
    try {
      await updateThemeAction(newMode ? 'dark' : 'light');
    } catch (error) {
      console.error('Failed to save theme preference:', error);
    } finally {
      setIsChangingTheme(false);
    }
  };

  if (isInitialLoading) {
    return (
      <div className="min-h-screen bg-background relative transition-colors duration-500">
        <Header isAuthPage={false} sessionUser={sessionUser} />
        
        <main className="container mx-auto px-3 sm:px-6 pb-4 pt-6 sm:pb-8 sm:pt-8 relative z-10 animate-pulse">
          <div className="flex flex-col lg:flex-row gap-4 sm:gap-8">
            {/* Sidebar Skeleton */}
            <aside className="lg:w-72 flex-shrink-0">
              <div className="glass dark:glass-dark p-4 sm:p-6 rounded-2xl shadow-sm border border-border/50 space-y-6">
                <div className="h-12 bg-muted rounded-xl w-full" />
                <div className="h-10 bg-muted rounded-xl w-full" />
                <div className="space-y-3 pt-2">
                  <div className="h-4 bg-muted rounded-md w-1/3" />
                  <div className="h-10 bg-muted rounded-xl w-full" />
                  <div className="h-10 bg-muted rounded-xl w-full" />
                  <div className="h-10 bg-muted rounded-xl w-full" />
                </div>
              </div>
            </aside>

            {/* Grid content Skeleton */}
            <div className="flex-1 space-y-6">
              <div className="flex items-center justify-between pb-2 border-b border-border/30">
                <div className="h-7 bg-muted rounded-md w-1/4" />
                <div className="h-8 bg-muted rounded-md w-16" />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-5 sm:gap-6">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="p-5 sm:p-6 bg-card/85 dark:bg-card/40 border border-border/50 rounded-2xl h-48 space-y-4">
                    <div className="h-5 bg-muted rounded-md w-2/3" />
                    <div className="space-y-2">
                      <div className="h-4 bg-muted rounded-md w-full" />
                      <div className="h-4 bg-muted rounded-md w-5/6" />
                    </div>
                    <div className="pt-4 border-t border-border/40 flex justify-between">
                      <div className="h-4 bg-muted rounded-md w-16" />
                      <div className="h-4 bg-muted rounded-md w-20" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return null;
  }

  const getNoteCount = (categoryName: string) => {
    if (categoryName === 'all') {
      return notes.length;
    }
    return notes.filter(n => n.category === categoryName).length;
  };

  const renderNoteGrid = (notesList: Note[]) => {
    return (
      <div className={viewMode === 'grid' 
        ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-5 sm:gap-6" 
        : "flex flex-col gap-4"
      }>
        {notesList.map((note) => (
          <div key={note._id} className="animate-in fade-in zoom-in duration-300">
            <NoteCard
              note={note}
              onEdit={handleEditNote}
              onDelete={handleDeleteNoteTrigger}
              onTogglePin={handleTogglePin}
              onToggleArchive={handleToggleArchive}
              isPinning={pinningNoteId === note._id}
              isArchiving={archivingNoteId === note._id}
              isDeleting={isDeletingNoteId === note._id}
            />
          </div>
        ))}
      </div>
    );
  };

  const pinnedNotes = filteredNotes.filter(note => note.isPinned);
  const unpinnedNotes = filteredNotes.filter(note => !note.isPinned);

  return (
    <div className="min-h-screen bg-background relative transition-colors duration-500">
      <Header
        showArchived={showArchived}
        setShowArchived={setShowArchived}
        isDarkMode={isDarkMode}
        toggleDarkMode={toggleDarkMode}
        isChangingTheme={isChangingTheme}
        sessionUser={sessionUser}
      />

      <main className="container mx-auto px-3 sm:px-6 pb-6 pt-6 sm:pb-8 sm:pt-8 relative z-10">
        <div className="flex flex-col lg:flex-row gap-6 sm:gap-8">
          <aside className="lg:w-72 flex-shrink-0">
            <div className="sticky top-24 space-y-4 sm:top-28 sm:space-y-6 glass dark:glass-dark p-4 sm:p-5 rounded-2xl shadow-sm border border-border/50">
              <Button
                onClick={handleCreateNote}
                className="w-full h-11 sm:h-12 text-sm sm:text-base font-bold rounded-xl shadow-lg hover:shadow-primary/25 hover:scale-[1.02] active:scale-[0.98] transition-all bg-primary text-primary-foreground"
              >
                <Plus className="h-4.5 w-4.5 sm:h-5 sm:w-5 mr-2" />
                Create New Note
              </Button>

              <div className="relative group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-muted-foreground/60 transition-colors group-focus-within:text-primary" />
                <Input
                  placeholder="Search your notes..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 bg-background/50 border-border/80 shadow-inner rounded-xl transition-all h-10.5 sm:h-11 text-sm sm:text-base"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-3 px-1 sm:px-2">
                  <h3 className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-muted-foreground/80">Folders</h3>
                  <Button variant="ghost" size="icon" className="h-6 w-6 rounded-md hover:bg-primary/15 hover:text-primary transition-all" onClick={() => setIsCreateCategoryOpen(true)}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="space-y-1">
                  {categories.map((category) => (
                    <div key={category} className="group relative flex items-center">
                      <Button
                        variant={activeCategory === category ? 'secondary' : 'ghost'}
                        className={`flex-1 justify-start capitalize rounded-xl transition-all h-9.5 sm:h-10 text-xs sm:text-sm relative pl-9.5 pr-14 ${activeCategory === category ? 'bg-primary/10 text-primary font-bold shadow-sm' : 'text-muted-foreground hover:bg-muted/50'}`}
                        onClick={() => setSelectedCategory(category)}
                      >
                        <FileText className={`h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 flex-shrink-0 ${activeCategory === category ? 'text-primary' : 'text-muted-foreground/60'}`} />
                        <span className="truncate w-full text-left">{category}</span>
                        <span className={`absolute right-3.5 top-1/2 -translate-y-1/2 text-[10px] font-bold px-1.5 py-0.5 rounded-full border transition-all shrink-0 duration-200 lg:group-hover:opacity-0 ${activeCategory === category ? 'bg-primary/20 text-primary border-primary/20' : 'bg-muted text-muted-foreground/80 border-border'}`}>
                          {getNoteCount(category)}
                        </span>
                      </Button>

                      {category !== 'all' && (
                        <div className="absolute right-1.5 sm:right-2 flex gap-0.5 opacity-100 transition-opacity sm:gap-1 lg:opacity-0 lg:group-hover:opacity-100 duration-200">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6.5 w-6.5 rounded-lg hover:bg-background shadow-sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              setCategoryToRename(category);
                            }}
                          >
                            <Pencil className="h-3 w-3 text-muted-foreground/75 hover:text-foreground" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            disabled={deletingCategoryName === category}
                            className="h-6.5 w-6.5 rounded-lg hover:bg-destructive/15 hover:text-destructive shadow-sm"
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
                            {deletingCategoryName === category ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <Trash2 className="h-3 w-3" />
                            )}
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </aside>

          <div className="flex-1 space-y-6">
            {/* Toolbar Header for notes grid/list */}
            <div className="flex items-center justify-between pb-2.5 border-b border-border/30 gap-4">
              <div className="min-w-0">
                <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight capitalize text-foreground flex items-center gap-2">
                  <span>{activeCategory === 'all' ? (showArchived ? 'Archived Notes' : 'All Notes') : activeCategory}</span>
                  <span className="text-[10px] sm:text-xs font-bold px-2 py-0.5 bg-muted text-muted-foreground rounded-full border border-border/40 shrink-0">
                    {filteredNotes.length}
                  </span>
                </h2>
              </div>
              
              <div className="flex items-center gap-2 shrink-0">
                {/* View switcher toggle */}
                <div className="flex bg-secondary/50 border border-border/40 p-0.5 rounded-xl shadow-sm">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setViewMode('grid');
                      localStorage.setItem('notes-view-mode', 'grid');
                    }}
                    className={`h-7.5 w-7.5 rounded-lg p-0 transition-all active:scale-95 ${viewMode === 'grid' ? 'bg-background text-primary shadow-sm' : 'text-muted-foreground/60 hover:text-foreground'}`}
                    title="Grid View"
                  >
                    <LayoutGrid className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setViewMode('list');
                      localStorage.setItem('notes-view-mode', 'list');
                    }}
                    className={`h-7.5 w-7.5 rounded-lg p-0 transition-all active:scale-95 ${viewMode === 'list' ? 'bg-background text-primary shadow-sm' : 'text-muted-foreground/60 hover:text-foreground'}`}
                    title="List View"
                  >
                    <List className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            {filteredNotes.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-6 sm:p-16 glass dark:glass-dark rounded-2xl sm:rounded-3xl border border-border/50 text-center animate-in fade-in zoom-in duration-500 shadow-sm">
                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-primary/10 rounded-full flex items-center justify-center mb-4 sm:mb-6">
                  <FileText className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl sm:text-2xl font-extrabold text-foreground mb-2">
                  {showArchived ? 'No archived notes' : 'No notes found'}
                </h3>
                <p className="text-muted-foreground max-w-sm mb-6 sm:mb-8 text-xs sm:text-sm leading-relaxed font-medium">
                  {showArchived
                    ? 'Archive some notes to keep your workspace clean and organized.'
                    : 'Start capturing your ideas, tasks, and important thoughts today.'
                  }
                </p>
                {!showArchived && (
                  <Button onClick={handleCreateNote} size="lg" className="h-11 sm:h-12 rounded-xl shadow-lg hover:shadow-primary/25 hover:scale-[1.03] active:scale-[0.98] transition-all text-sm px-6 font-bold">
                    <Plus className="h-4.5 w-4.5 mr-2" />
                    Write your first note
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-8">
                {/* Pinned Notes Grid */}
                {pinnedNotes.length > 0 && (
                  <div className="space-y-4">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground/80 flex items-center gap-1.5 pl-1">
                      <Pin className="h-3 w-3 fill-primary text-primary rotate-45" /> Pinned Notes ({pinnedNotes.length})
                    </h3>
                    {renderNoteGrid(pinnedNotes)}
                  </div>
                )}

                {/* Other/Unpinned Notes Grid */}
                {unpinnedNotes.length > 0 && (
                  <div className="space-y-4">
                    {pinnedNotes.length > 0 && (
                      <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground/80 flex items-center gap-1.5 pl-1 pt-2">
                        Other Notes ({unpinnedNotes.length})
                      </h3>
                    )}
                    {renderNoteGrid(unpinnedNotes)}
                  </div>
                )}
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

      <CategoryDialog
        isOpen={isCreateCategoryOpen}
        onClose={() => setIsCreateCategoryOpen(false)}
        mode="create"
        onSuccess={async (categoryName) => {
          await fetchCategories();
          setSelectedCategory(categoryName);
        }}
      />

      <CategoryDialog
        isOpen={categoryToRename !== null}
        onClose={() => setCategoryToRename(null)}
        mode="rename"
        categoryToRename={categoryToRename}
        onSuccess={async (newName) => {
          if (selectedCategory === categoryToRename) {
            setSelectedCategory(newName);
          }
          await fetchNotes();
          await fetchCategories();
        }}
      />

      <ConfirmDialog
        isOpen={isDeleteWarnOpen}
        onClose={() => setIsDeleteWarnOpen(false)}
        title="Cannot Delete Category"
        icon={<AlertTriangle className="h-6 w-6 text-destructive" />}
        description={
          <>
            Categories cannot be deleted while they still contain notes.
            <br /><br />
            Please edit your notes to place them in a different category, or delete them first. Once empty, this category will automatically be cleared from your sidebar.
          </>
        }
        cancelLabel="Understand"
      />

      <ConfirmDialog
        isOpen={noteIdToDelete !== null}
        onClose={() => setNoteIdToDelete(null)}
        onConfirm={executeDeleteNote}
        isLoading={isDeletingNoteId !== null}
        title="Delete Note"
        icon={<Trash2 className="h-6 w-6 text-destructive animate-pulse" />}
        description="Are you sure you want to delete this note? This action is permanent and cannot be undone."
        confirmLabel="Delete Note"
        cancelLabel="Cancel"
        variant="destructive"
      />
    </div>
  );
}
