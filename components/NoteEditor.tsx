'use client';

import { useState, useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Bold, Italic, List, ListOrdered, Quote, Redo, Undo, Palette, Tag, Folder } from 'lucide-react';
import { Note } from '@/types';

interface NoteEditorProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (note: Partial<Note>) => void;
  note?: Note | null;
}

export function NoteEditor({ isOpen, onClose, onSave, note }: NoteEditorProps) {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<Note['category']>('other');
  const [tags, setTags] = useState('');
  const [color, setColor] = useState('#ffffff');

  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder: 'Start writing your brilliance...',
      }),
    ],
    content: '',
    editable: true,
    immediatelyRender: false,
  });

  useEffect(() => {
    if (note) {
      setTitle(note.title);
      setCategory(note.category);
      setTags(note.tags.join(', '));
      setColor(note.color);
      editor?.commands.setContent(note.content);
    } else {
      setTitle('');
      setCategory('other');
      setTags('');
      setColor('#ffffff');
      editor?.commands.setContent('');
    }
  }, [note, editor]);

  const handleSave = () => {
    if (!title.trim() || !editor) return;

    const noteData: Partial<Note> = {
      title: title.trim(),
      content: editor.getHTML(),
      category,
      tags: tags.split(',').map(tag => tag.trim()).filter(Boolean),
      color,
    };

    if (note) {
      noteData._id = note._id;
    }

    onSave(noteData);
    onClose();
  };

  if (!editor || !isMounted) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl rounded-2xl p-0 overflow-hidden border border-border/80 shadow-2xl bg-card sm:max-h-[85vh] flex flex-col">
        {/* Dynamic header accent line */}
        <div 
          className="h-1.5 w-full bg-gradient-to-r from-primary to-primary/50" 
          style={{ backgroundColor: color !== '#ffffff' && color !== '#000000' ? color : undefined }}
        />
        
        <div className="flex-1 overflow-y-auto px-8 py-6 space-y-6">
          <DialogHeader className="mb-2">
            <DialogTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground/80">
              {note ? 'Edit Note' : 'Create New Note'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Title Input */}
            <div>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Give your note a title..."
                className="text-3xl md:text-4xl font-extrabold bg-transparent border-none shadow-none focus-visible:ring-0 px-0 h-auto placeholder:text-muted-foreground/40 text-foreground"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-secondary/30 p-5 rounded-2xl border border-border/50">
              <div className="space-y-2">
                <Label htmlFor="category" className="flex items-center text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  <Folder className="h-4 w-4 mr-1.5" /> Category
                </Label>
                <select
                  id="category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value as Note['category'])}
                  className="w-full rounded-xl border border-border/80 bg-background px-3 py-2.5 text-sm font-medium focus:ring-2 focus:ring-primary/40 focus:border-primary/60 outline-none transition-all shadow-sm"
                >
                  <option value="personal">Personal</option>
                  <option value="work">Work</option>
                  <option value="ideas">Ideas</option>
                  <option value="tasks">Tasks</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="tags" className="flex items-center text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  <Tag className="h-4 w-4 mr-1.5" /> Tags
                </Label>
                <Input
                  id="tags"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  placeholder="e.g. urgent, project, draft"
                  className="rounded-xl border border-border/80 bg-background py-5 placeholder:text-muted-foreground/40 font-medium transition-all focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:border-primary/60 shadow-sm"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="color" className="flex items-center text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  <Palette className="h-4 w-4 mr-1.5" /> Accent Color
                </Label>
                <div className="flex gap-3 h-10">
                  <div className="relative group rounded-xl overflow-hidden shadow-sm flex-shrink-0 w-12 h-full border border-border/80">
                    <Input
                      id="color"
                      type="color"
                      value={color}
                      onChange={(e) => setColor(e.target.value)}
                      className="absolute -top-4 -left-4 w-20 h-20 cursor-pointer border-0"
                    />
                  </div>
                  <div className="flex-1 rounded-xl border border-border/80 bg-background flex items-center justify-center font-mono text-sm shadow-sm opacity-80 pointer-events-none">
                    {color.toUpperCase()}
                  </div>
                </div>
              </div>
            </div>

            {/* Rich Text Editor */}
            <div className="flex-1 flex flex-col group rounded-2xl border border-border/80 bg-background shadow-sm focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary/50 transition-all overflow-hidden duration-300">
              <div className="flex flex-wrap items-center gap-1.5 p-2 bg-secondary/40 border-b border-border/60 sticky top-0 z-10 transition-colors group-focus-within:bg-secondary/60">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => editor.chain().focus().toggleBold().run()}
                  className={`rounded-lg h-8 w-8 transition-colors ${editor.isActive('bold') ? 'bg-primary/10 text-primary shadow-sm' : 'text-muted-foreground hover:bg-background hover:text-foreground'}`}
                >
                  <Bold className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => editor.chain().focus().toggleItalic().run()}
                  className={`rounded-lg h-8 w-8 transition-colors ${editor.isActive('italic') ? 'bg-primary/10 text-primary shadow-sm' : 'text-muted-foreground hover:bg-background hover:text-foreground'}`}
                >
                  <Italic className="h-4 w-4" />
                </Button>
                
                <div className="w-px h-5 bg-border mx-1 my-auto" />
                
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => editor.chain().focus().toggleBulletList().run()}
                  className={`rounded-lg h-8 w-8 transition-colors ${editor.isActive('bulletList') ? 'bg-primary/10 text-primary shadow-sm' : 'text-muted-foreground hover:bg-background hover:text-foreground'}`}
                >
                  <List className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => editor.chain().focus().toggleOrderedList().run()}
                  className={`rounded-lg h-8 w-8 transition-colors ${editor.isActive('orderedList') ? 'bg-primary/10 text-primary shadow-sm' : 'text-muted-foreground hover:bg-background hover:text-foreground'}`}
                >
                  <ListOrdered className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => editor.chain().focus().toggleBlockquote().run()}
                  className={`rounded-lg h-8 w-8 transition-colors ${editor.isActive('blockquote') ? 'bg-primary/10 text-primary shadow-sm' : 'text-muted-foreground hover:bg-background hover:text-foreground'}`}
                >
                  <Quote className="h-4 w-4" />
                </Button>
                
                <div className="flex-1" />
                
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => editor.chain().focus().undo().run()}
                  disabled={!editor.can().undo()}
                  className="rounded-lg h-8 w-8 text-muted-foreground hover:bg-background hover:text-foreground disabled:opacity-30"
                >
                  <Undo className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => editor.chain().focus().redo().run()}
                  disabled={!editor.can().redo()}
                  className="rounded-lg h-8 w-8 text-muted-foreground hover:bg-background hover:text-foreground disabled:opacity-30"
                >
                  <Redo className="h-4 w-4" />
                </Button>
              </div>
              
              <EditorContent 
                editor={editor} 
                className="flex-1 bg-background"
              />
            </div>
          </div>
        </div>

        <div className="p-5 bg-card border-t border-border/80 flex justify-end gap-3 items-center">
          <Button variant="ghost" onClick={onClose} className="rounded-xl px-5 hover:bg-destructive/10 hover:text-destructive font-semibold">
            Cancel
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={!title.trim()}
            className="rounded-xl px-6 font-bold shadow-md shadow-primary/20 hover:shadow-primary/40 transition-all hover:-translate-y-0.5 active:translate-y-0"
          >
            {note ? 'Save Changes' : 'Publish Note'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
