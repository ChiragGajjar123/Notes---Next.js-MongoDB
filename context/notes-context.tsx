'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Note } from '@/types';
import {
  deleteCategoryAction,
  deleteNoteAction,
  getCategoriesAction,
  getNotesAction,
  saveNoteAction,
  updateThemeAction,
} from '@/app/actions';

interface SessionUser {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
}

interface NotesContextType {
  // State
  notes: Note[];
  isEditorOpen: boolean;
  editingNote: Note | null;
  searchQuery: string;
  selectedCategory: string;
  showArchived: boolean;
  isDarkMode: boolean;
  categoryToRename: string | null;
  isDeleteWarnOpen: boolean;
  savedCategories: string[];
  isCreateCategoryOpen: boolean;
  isDeletingNoteId: string | null;
  pinningNoteId: string | null;
  archivingNoteId: string | null;
  deletingCategoryName: string | null;
  isChangingTheme: boolean;
  isInitialLoading: boolean;
  isFetchingNotes: boolean;
  viewMode: 'grid' | 'list';
  noteIdToDelete: string | null;
  sessionUser: SessionUser;

  // Derived selectors
  categories: string[];
  activeCategory: string;
  filteredNotes: Note[];
  pinnedNotes: Note[];
  unpinnedNotes: Note[];
  editorCategories: string[];
  editorDefaultCategory: string;

  // Basic Setters
  setNotes: (val: Note[] | ((prev: Note[]) => Note[])) => void;
  setIsEditorOpen: (val: boolean) => void;
  setEditingNote: (val: Note | null) => void;
  setSearchQuery: (val: string) => void;
  setSelectedCategory: (val: string) => void;
  setShowArchived: (val: boolean | ((prev: boolean) => boolean)) => void;
  setIsDarkMode: (val: boolean) => void;
  setCategoryToRename: (val: string | null) => void;
  setIsDeleteWarnOpen: (val: boolean) => void;
  setSavedCategories: (val: string[] | ((prev: string[]) => string[])) => void;
  setIsCreateCategoryOpen: (val: boolean) => void;
  setIsDeletingNoteId: (val: string | null) => void;
  setPinningNoteId: (val: string | null) => void;
  setArchivingNoteId: (val: string | null) => void;
  setDeletingCategoryName: (val: string | null) => void;
  setIsChangingTheme: (val: boolean) => void;
  setViewMode: (val: 'grid' | 'list') => void;
  setNoteIdToDelete: (val: string | null) => void;

  // Actions
  fetchNotes: (isInitial?: boolean) => Promise<void>;
  fetchCategories: () => Promise<void>;
  handleExecuteDeleteEmptyCategory: (name: string) => Promise<void>;
  handleCreateNote: () => void;
  handleEditNote: (note: Note) => void;
  handleSaveNote: (noteData: Partial<Note>) => Promise<void>;
  handleDeleteNoteTrigger: (noteId: string) => void;
  executeDeleteNote: () => Promise<void>;
  handleTogglePin: (noteId: string) => Promise<void>;
  handleToggleArchive: (noteId: string) => Promise<void>;
  toggleDarkMode: () => Promise<void>;
  getNoteCount: (categoryName: string) => number;
}

const NotesContext = createContext<NotesContextType | undefined>(undefined);

interface NotesProviderProps {
  children: React.ReactNode;
  initialNotes: Note[];
  initialCategories: string[];
  initialTheme: string;
  sessionUser: SessionUser;
}

export function NotesProvider({
  children,
  initialNotes,
  initialCategories,
  initialTheme,
  sessionUser,
}: NotesProviderProps) {
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
    isFetchingNotes: false,
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
    isFetchingNotes,
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
  
  const setNotes = (val: Note[] | ((prev: Note[]) => Note[])) => {
    setState(prev => ({
      ...prev,
      notes: typeof val === 'function' ? (val as (prev: Note[]) => Note[])(prev.notes) : val
    }));
  };
  
  const setIsEditorOpen = (val: boolean) => setState(prev => ({ ...prev, isEditorOpen: val }));
  const setEditingNote = (val: Note | null) => setState(prev => ({ ...prev, editingNote: val }));
  const setSearchQuery = (val: string) => setState(prev => ({ ...prev, searchQuery: val }));
  const setSelectedCategory = (val: string) => setState(prev => ({ ...prev, selectedCategory: val }));
  const setIsDarkMode = (val: boolean) => setState(prev => ({ ...prev, isDarkMode: val }));
  
  const setSavedCategories = (val: string[] | ((prev: string[]) => string[])) => {
    setState(prev => ({
      ...prev,
      savedCategories: typeof val === 'function' ? (val as (prev: string[]) => string[])(prev.savedCategories) : val
    }));
  };
  
  const setIsDeletingNoteId = (val: string | null) => setState(prev => ({ ...prev, isDeletingNoteId: val }));
  const setPinningNoteId = (val: string | null) => setState(prev => ({ ...prev, pinningNoteId: val }));
  const setArchivingNoteId = (val: string | null) => setState(prev => ({ ...prev, archivingNoteId: val }));
  const setDeletingCategoryName = (val: string | null) => setState(prev => ({ ...prev, deletingCategoryName: val }));
  const setIsChangingTheme = (val: boolean) => setState(prev => ({ ...prev, isChangingTheme: val }));
  const setIsFetchingNotes = (val: boolean) => setState(prev => ({ ...prev, isFetchingNotes: val }));
  const setViewMode = (val: 'grid' | 'list') => setState(prev => ({ ...prev, viewMode: val }));
  const setNoteIdToDelete = (val: string | null) => setState(prev => ({ ...prev, noteIdToDelete: val }));
  const setCategoryToRename = (val: string | null) => setState(prev => ({ ...prev, categoryToRename: val }));
  const setIsDeleteWarnOpen = (val: boolean) => setState(prev => ({ ...prev, isDeleteWarnOpen: val }));
  const setIsCreateCategoryOpen = (val: boolean) => setState(prev => ({ ...prev, isCreateCategoryOpen: val }));

  const fetchNotes = useCallback(async (isInitial = false) => {
    if (isInitial) {
      setIsInitialLoading(true);
    } else {
      setIsFetchingNotes(true);
    }
    try {
      const result = await getNotesAction(showArchived);
      if (result.ok) setNotes(result.data);
    } catch (error) {
      console.error('Error fetching notes:', error);
    } finally {
      if (isInitial) {
        setIsInitialLoading(false);
      } else {
        setIsFetchingNotes(false);
      }
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

  const pinnedNotes = useMemo(() => filteredNotes.filter(note => note.isPinned), [filteredNotes]);
  const unpinnedNotes = useMemo(() => filteredNotes.filter(note => !note.isPinned), [filteredNotes]);

  const isMounted = useRef(false);

  // Hydration-safe: read localStorage in useEffect, not in state initializer
  useEffect(() => {
    const saved = localStorage.getItem('notes-view-mode');
    if (saved === 'list' || saved === 'grid') {
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
        setSavedCategories(prev => prev.filter(c => c !== name));
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

      const savedNote = result.data;
      setNotes(prevNotes => {
        if (savedNote.isArchived !== showArchived) {
          return prevNotes.filter(n => n._id !== savedNote._id);
        }

        const nextNotes = [...prevNotes];
        const index = nextNotes.findIndex(n => n._id === savedNote._id);
        if (index > -1) {
          nextNotes[index] = savedNote;
        } else {
          nextNotes.push(savedNote);
        }
        
        // Sort: isPinned desc, then updatedAt desc (matches MongoDB sort)
        return nextNotes.sort((a, b) => {
          if (a.isPinned !== b.isPinned) {
            return a.isPinned ? -1 : 1;
          }
          return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
        });
      });
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
        setNotes(prevNotes => prevNotes.filter(n => n._id !== noteIdToDelete));
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
    setIsChangingTheme(true);
    
    try {
      const result = await updateThemeAction(newMode ? 'dark' : 'light');
      if (result.ok) {
        setIsDarkMode(newMode);
      }
    } catch (error) {
      console.error('Failed to save theme preference:', error);
    } finally {
      setIsChangingTheme(false);
    }
  };

  const getNoteCount = (categoryName: string) => {
    if (categoryName === 'all') {
      return notes.length;
    }
    return notes.filter(n => n.category === categoryName).length;
  };

  const value: NotesContextType = {
    // State
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
    isFetchingNotes,
    viewMode,
    noteIdToDelete,
    sessionUser,

    // Derived selectors
    categories,
    activeCategory,
    filteredNotes,
    pinnedNotes,
    unpinnedNotes,
    editorCategories,
    editorDefaultCategory,

    // Basic Setters
    setNotes,
    setIsEditorOpen,
    setEditingNote,
    setSearchQuery,
    setSelectedCategory,
    setShowArchived,
    setIsDarkMode,
    setCategoryToRename,
    setIsDeleteWarnOpen,
    setSavedCategories,
    setIsCreateCategoryOpen,
    setIsDeletingNoteId,
    setPinningNoteId,
    setArchivingNoteId,
    setDeletingCategoryName,
    setIsChangingTheme,
    setViewMode,
    setNoteIdToDelete,

    // Actions
    fetchNotes,
    fetchCategories,
    handleExecuteDeleteEmptyCategory,
    handleCreateNote,
    handleEditNote,
    handleSaveNote,
    handleDeleteNoteTrigger,
    executeDeleteNote,
    handleTogglePin,
    handleToggleArchive,
    toggleDarkMode,
    getNoteCount,
  };

  return <NotesContext.Provider value={value}>{children}</NotesContext.Provider>;
}

export function useNotes() {
  const context = useContext(NotesContext);
  if (context === undefined) {
    throw new Error('useNotes must be used within a NotesProvider');
  }
  return context;
}

export function useOptionalNotes() {
  return useContext(NotesContext);
}
