'use client';

import { useState, useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';

import { Bold, Italic, List, ListOrdered, Quote, Redo, Undo, Palette, Tag, Folder, ChevronDown, Plus } from 'lucide-react';
import { Note } from '@/types';

interface NoteEditorProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (note: Partial<Note>) => void;
  note?: Note | null;
  existingCategories: string[];
}

export function NoteEditor({ isOpen, onClose, onSave, note, existingCategories }: NoteEditorProps) {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<Note['category']>('other');
  const [tags, setTags] = useState('');
  const [color, setColor] = useState('#ffffff');
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);

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
    if (!isOpen) return;
    
    if (note) {
      setTitle(note.title);
      setCategory(note.category);
      setTags(note.tags.join(', '));
      setColor(note.color);
      setTimeout(() => editor?.commands.setContent(note.content), 0);
    } else {
      setTitle('');
      setCategory(existingCategories.length > 0 ? existingCategories[0] : 'All');
      setTags('');
      setColor('#ffffff');
      setTimeout(() => editor?.commands.clearContent(), 0);
    }
  }, [note, isOpen, existingCategories, editor]);

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
      <DialogContent className="max-w-4xl rounded-2xl p-0 overflow-hidden border border-border/80 shadow-2xl bg-card sm:max-h-[85vh] flex flex-col gap-0 [&>button]:top-5 [&>button]:right-6">
        {/* Dynamic header accent line */}
        <div 
          className="h-1.5 w-full bg-gradient-to-r from-primary to-primary/50 flex-shrink-0" 
          style={{ backgroundColor: color !== '#ffffff' && color !== '#000000' ? color : undefined }}
        />
        
        <DialogHeader className="px-8 py-3.5 border-b border-border/40 flex-shrink-0 bg-card">
          <DialogTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground/80">
            {note ? 'Edit Note' : 'Create New Note'}
          </DialogTitle>
          <DialogDescription className="sr-only">
            Fill out the form below to save your note.
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto px-8 py-5 space-y-5">
          <div className="space-y-5">
            {/* Title Input */}
            <div>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Give your note a title..."
                className="text-3xl md:text-4xl font-extrabold leading-loose min-h-[50px] bg-transparent border-none shadow-none focus-visible:ring-0 px-0 h-auto pt-0 pb-2 placeholder:text-muted-foreground/40 text-foreground"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-secondary/30 p-5 rounded-2xl border border-border/50">
              <div className="space-y-2">
                <Label htmlFor="category-input" className="flex items-center text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                  <Folder className="h-4 w-4 mr-1.5" /> Category
                </Label>
                <div 
                  className="relative group" 
                  onBlur={(e) => {
                    if (!e.currentTarget.contains(e.relatedTarget)) {
                      setIsCategoryDropdownOpen(false);
                    }
                  }}
                >
                  <Input
                    id="category-input"
                    value={category}
                    readOnly
                    onClick={() => setIsCategoryDropdownOpen(!isCategoryDropdownOpen)}
                    onFocus={() => setIsCategoryDropdownOpen(true)}
                    placeholder="Select category..."
                    className="w-full bg-background rounded-xl border border-border/80 h-[42px] font-medium transition-all pr-10 cursor-pointer focus:ring-primary/20"
                    autoComplete="off"
                  />
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none opacity-50" />
                  
                  {isCategoryDropdownOpen && (
                    <div className="absolute z-50 w-full mt-2 bg-card border border-border/80 rounded-xl shadow-xl max-h-60 overflow-y-auto animate-in fade-in zoom-in-95 flex flex-col">
                      {Array.from(new Set(['All', ...existingCategories])).map((cat) => (
                        <div
                          key={cat}
                          className="px-4 py-3 hover:bg-primary/10 hover:text-primary cursor-pointer text-sm font-medium transition-colors border-b border-border/40 last:border-0"
                          onMouseDown={(e) => {
                            e.preventDefault();
                            setCategory(cat);
                            setIsCategoryDropdownOpen(false);
                          }}
                        >
                          {cat}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
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
                  className="rounded-xl border border-border/80 bg-background py-5 placeholder:text-muted-foreground/40 font-medium transition-all"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="color" className="flex items-center text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  <Palette className="h-4 w-4 mr-1.5" /> Accent Color
                </Label>
                <div className="flex gap-3 h-[42px]">
                  <div className="relative group rounded-xl overflow-hidden shadow-sm flex-shrink-0 w-[42px] h-full border border-border/80">
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
            <div className="flex-1 flex flex-col group rounded-2xl border border-border/80 bg-background transition-all overflow-hidden duration-300">
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

        {/* Fixed Footer */}
        <div className="p-5 bg-card border-t border-border/80 flex justify-end gap-3 items-center flex-shrink-0">
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
