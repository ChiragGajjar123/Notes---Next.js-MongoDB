'use client';

import { useState, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { NoteCard } from '@/components/NoteCard';
import { NoteEditor } from '@/components/NoteEditor';
import { Plus, Search, LogOut, Archive, FileText, Moon, Sun } from 'lucide-react';
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

  const categories = ['all', 'personal', 'work', 'ideas', 'tasks', 'other'];

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    }
  }, [status, router]);

  useEffect(() => {
    if (session) {
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

      const response = await fetch(`/api/notes?${params}`);
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-bold text-foreground">Notes App</h1>
              <div className="flex items-center gap-2">
                <Button
                  variant={showArchived ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setShowArchived(!showArchived)}
                >
                  <Archive className="h-4 w-4 mr-2" />
                  {showArchived ? 'Active' : 'Archived'}
                </Button>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground">
                {session.user?.name}
              </span>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsDarkMode(!isDarkMode)}
              >
                {isDarkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </Button>
              <Button variant="outline" onClick={() => signOut()}>
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        <div className="flex flex-col lg:flex-row gap-6">
          <aside className="lg:w-64">
            <div className="space-y-4">
              <div>
                <Button
                  onClick={handleCreateNote}
                  className="w-full"
                  size="lg"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  New Note
                </Button>
              </div>

              <div>
                <Input
                  placeholder="Search notes..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full"
                />
              </div>

              <div>
                <h3 className="font-semibold mb-2 text-foreground">Categories</h3>
                <div className="space-y-1">
                  {categories.map((category) => (
                    <Button
                      key={category}
                      variant={selectedCategory === category ? 'default' : 'ghost'}
                      className="w-full justify-start capitalize"
                      onClick={() => setSelectedCategory(category)}
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      {category}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </aside>

          <div className="flex-1">
            {filteredNotes.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  {showArchived ? 'No archived notes' : 'No notes found'}
                </h3>
                <p className="text-muted-foreground mb-4">
                  {showArchived 
                    ? 'Archive some notes to see them here'
                    : 'Create your first note to get started'
                  }
                </p>
                {!showArchived && (
                  <Button onClick={handleCreateNote}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Note
                  </Button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {filteredNotes.map((note) => (
                  <NoteCard
                    key={note._id}
                    note={note}
                    onEdit={handleEditNote}
                    onDelete={handleDeleteNote}
                    onTogglePin={handleTogglePin}
                    onToggleArchive={handleToggleArchive}
                  />
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
      />
    </div>
  );
}
