'use client';

import { useState, useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';

import { Bold, Italic, List, ListOrdered, Quote, Redo, Undo, Palette, Tag, Folder, ChevronDown, Loader2, X, Plus } from 'lucide-react';
import { Note } from '@/types';

interface NoteEditorProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (note: Partial<Note>) => Promise<void>;
  note?: Note | null;
  existingCategories: string[];
  defaultCategory?: string;
}

const PRESET_COLORS = [
  { name: 'Default', value: '#ffffff' },
  { name: 'Lavender', value: '#e0e7ff' },
  { name: 'Teal', value: '#ccfbf1' },
  { name: 'Rose', value: '#ffe4e6' },
  { name: 'Amber', value: '#fef3c7' },
  { name: 'Mint', value: '#dcfce7' },
  { name: 'Sky', value: '#e0f2fe' },
  { name: 'Violet', value: '#f3e8ff' },
];

export function NoteEditor({ isOpen, onClose, onSave, note, existingCategories, defaultCategory = 'other' }: NoteEditorProps) {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<Note['category']>('other');
  const [tagList, setTagList] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [color, setColor] = useState('#ffffff');
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [isMounted, setIsMounted] = useState(false);
  const categoryOptions = existingCategories.length > 0 ? existingCategories : ['All'];
  const displayedCategory = existingCategories.length === 0 && category === 'other' ? 'All' : category;

  useEffect(() => {
    Promise.resolve().then(() => {
      setIsMounted(true);
    });
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
    
    Promise.resolve().then(() => {
      if (note) {
        setTitle(note.title);
        setCategory(note.category);
        setTagList(note.tags || []);
        setTagInput('');
        setColor(note.color || '#ffffff');
        setTimeout(() => editor?.commands.setContent(note.content), 0);
      } else {
        setTitle('');
        setCategory(defaultCategory);
        setTagList([]);
        setTagInput('');
        setColor('#ffffff');
        setTimeout(() => editor?.commands.clearContent(), 0);
      }
    });
  }, [note, isOpen, defaultCategory, editor]);

  const handleSave = async () => {
    if (!title.trim() || !editor || isSaving) return;

    // Add any remaining tag in tagInput if user forgot to press Enter
    const finalTags = [...tagList];
    const finalInputVal = tagInput.trim().toLowerCase().replace(/#/g, '');
    if (finalInputVal && !finalTags.includes(finalInputVal)) {
      finalTags.push(finalInputVal);
    }

    const noteData: Partial<Note> = {
      title: title.trim(),
      content: editor.getHTML(),
      category: category === 'All' ? 'other' : category,
      tags: finalTags,
      color,
    };

    if (note) {
      noteData._id = note._id;
    }

    setIsSaving(true);
    try {
      await onSave(noteData);
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  const handleKeyDownTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const val = tagInput.trim().toLowerCase().replace(/#/g, '');
      if (val && !tagList.includes(val)) {
        setTagList(prev => [...prev, val]);
      }
      setTagInput('');
    }
  };

  const handleAddTagClick = () => {
    const val = tagInput.trim().toLowerCase().replace(/#/g, '');
    if (val && !tagList.includes(val)) {
      setTagList(prev => [...prev, val]);
    }
    setTagInput('');
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTagList(prev => prev.filter(t => t !== tagToRemove));
  };

  if (!editor || !isMounted) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[calc(100vw-1rem)] sm:w-[95vw] sm:max-w-4xl rounded-2xl p-0 overflow-hidden border border-border/70 shadow-2xl bg-card max-h-[96dvh] sm:max-h-[85vh] flex flex-col gap-0 [&>button]:top-2 sm:[&>button]:top-2.5 [&>button]:right-3 sm:[&>button]:right-5 [&>button]:z-[60] [&>button]:h-8 [&>button]:w-8 [&>button]:rounded-full [&>button]:bg-background/80 [&>button]:backdrop-blur-sm">
        <div 
          className="h-2 w-full flex-shrink-0 transition-all duration-300 bg-primary" 
          style={{ backgroundColor: color !== '#ffffff' && color !== '#000000' ? color : undefined }}
        />
        <DialogHeader className="sticky top-0 z-20 px-4 pr-12 sm:px-8 sm:pr-16 py-3 sm:py-4 border-b border-border/40 flex-shrink-0 bg-card/95 backdrop-blur-md overflow-hidden">
          <DialogTitle className="m-0 text-[10px] sm:text-xs font-bold uppercase tracking-wider text-muted-foreground/80">
            {note ? '✏️ Edit Note' : '✨ Create New Note'}
          </DialogTitle>
          <DialogDescription className="sr-only">
            Fill out the form below to save your note.
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto px-4 sm:px-8 py-4 sm:py-6 space-y-4 sm:space-y-6">
          <div className="space-y-4 sm:space-y-6">
            {/* Distraction-Free Title */}
            <div>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Give your note a title..."
                className="text-2xl sm:text-3xl md:text-4xl font-extrabold leading-tight min-h-[40px] sm:min-h-[48px] bg-transparent border-none shadow-none focus-visible:ring-0 px-0 h-auto py-0 placeholder:text-muted-foreground/30 text-foreground tracking-tight"
              />
            </div>

            {/* Note Meta Settings Panel */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 bg-secondary/20 p-4 sm:p-5 rounded-2xl border border-border/50">
              <div className="space-y-1.5">
                <Label htmlFor="category-input" className="flex items-center text-xs font-bold text-muted-foreground/80 uppercase tracking-wider pl-1">
                  <Folder className="h-3.5 w-3.5 mr-2 text-primary" /> Category
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
                    value={displayedCategory}
                    readOnly
                    onClick={() => setIsCategoryDropdownOpen(!isCategoryDropdownOpen)}
                    onFocus={() => setIsCategoryDropdownOpen(true)}
                    placeholder="Select category..."
                    className="w-full bg-background rounded-xl border border-border/80 h-10 sm:h-11 text-sm sm:text-base font-semibold transition-all pr-10 cursor-pointer focus:ring-primary/25"
                    autoComplete="off"
                  />
                  <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none opacity-50 transition-transform group-focus-within:rotate-180" />
                  
                  {isCategoryDropdownOpen && (
                    <div className="absolute z-50 w-full mt-2 bg-card border border-border/80 rounded-xl shadow-xl max-h-60 overflow-y-auto animate-in fade-in zoom-in-95 flex flex-col">
                      {categoryOptions.map((cat) => (
                        <button
                          type="button"
                          key={cat}
                          className="px-4 py-3 text-left hover:bg-primary/10 hover:text-primary cursor-pointer text-xs sm:text-sm font-semibold transition-colors border-b border-border/40 last:border-0"
                          onMouseDown={(e) => {
                            e.preventDefault();
                            setCategory(cat === 'All' ? 'other' : cat);
                            setIsCategoryDropdownOpen(false);
                          }}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Interactive Tags Input */}
              <div className="space-y-1.5">
                <Label htmlFor="tags" className="flex items-center text-xs font-bold text-muted-foreground/80 uppercase tracking-wider pl-1">
                  <Tag className="h-3.5 w-3.5 mr-2 text-primary" /> Tags
                </Label>
                <div className="relative flex items-center">
                  <Input
                    id="tags"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={handleKeyDownTag}
                    placeholder="Press enter to add tags..."
                    className="rounded-xl border border-border/80 bg-background h-10 sm:h-11 text-sm sm:text-base placeholder:text-muted-foreground/45 font-semibold transition-all pr-10"
                  />
                  <button
                    type="button"
                    onClick={handleAddTagClick}
                    disabled={!tagInput.trim()}
                    className="absolute right-2.5 h-6.5 w-6.5 rounded-lg bg-primary/10 hover:bg-primary text-primary hover:text-primary-foreground flex items-center justify-center transition-all disabled:opacity-0"
                    aria-label="Add tag"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>

                {/* Displayed tags list */}
                {tagList.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2 pl-0.5">
                    {tagList.map((t) => (
                      <span 
                        key={t} 
                        className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-primary/10 text-primary border border-primary/20 rounded-full text-[10px] sm:text-xs font-bold uppercase tracking-wider animate-in fade-in zoom-in-95"
                      >
                        #{t}
                        <button
                          type="button"
                          onClick={() => handleRemoveTag(t)}
                          className="hover:text-destructive text-primary/60 transition-colors shrink-0 ml-0.5 active:scale-90"
                          aria-label={`Remove tag ${t}`}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
              
              {/* Premium Color Presets */}
              <div className="space-y-1.5">
                <Label htmlFor="color-picker-input" className="flex items-center text-xs font-bold text-muted-foreground/80 uppercase tracking-wider pl-1">
                  <Palette className="h-3.5 w-3.5 mr-2 text-primary" /> Note Theme
                </Label>
                <div className="flex flex-col gap-2">
                  {/* Row of Circle Presets */}
                  <div className="flex items-center flex-wrap gap-1.5 h-10 sm:h-11 py-1">
                    {PRESET_COLORS.map((item) => (
                      <button
                        type="button"
                        key={item.value}
                        onClick={() => setColor(item.value)}
                        style={{ backgroundColor: item.value }}
                        className={`h-6.5 w-6.5 rounded-full border transition-all hover:scale-110 active:scale-95 ${color.toLowerCase() === item.value.toLowerCase() ? 'border-primary ring-2 ring-primary/20 scale-105 shadow-sm' : 'border-border/60'}`}
                        title={item.name}
                      />
                    ))}
                    
                    {/* Custom Color trigger */}
                    <div className="relative h-6.5 w-6.5 rounded-full border border-border/80 flex items-center justify-center bg-background hover:scale-110 active:scale-95 cursor-pointer shadow-sm">
                      <Plus className="h-3.5 w-3.5 text-muted-foreground" />
                      <Input
                        id="color-picker-input"
                        type="color"
                        value={color}
                        onChange={(e) => setColor(e.target.value)}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        title="Choose custom color"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Prose Editor Frame */}
            <div className="flex-1 flex flex-col group rounded-2xl border border-border/80 bg-background/50 transition-all overflow-hidden duration-300">
              <div className="flex flex-wrap items-center gap-1 sm:gap-1.5 p-1.5 sm:p-2 bg-secondary/30 border-b border-border/50 sticky top-0 z-10 transition-colors group-focus-within:bg-secondary/40">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => editor.chain().focus().toggleBold().run()}
                  className={`rounded-lg h-7 w-7 sm:h-8 sm:w-8 transition-colors ${editor.isActive('bold') ? 'bg-primary/10 text-primary shadow-sm' : 'text-muted-foreground hover:bg-background hover:text-foreground'}`}
                  aria-label="Toggle bold"
                >
                  <Bold className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => editor.chain().focus().toggleItalic().run()}
                  className={`rounded-lg h-7 w-7 sm:h-8 sm:w-8 transition-colors ${editor.isActive('italic') ? 'bg-primary/10 text-primary shadow-sm' : 'text-muted-foreground hover:bg-background hover:text-foreground'}`}
                  aria-label="Toggle italic"
                >
                  <Italic className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                </Button>
                
                <div className="w-px h-4 sm:h-5 bg-border/80 mx-0.5 sm:mx-1 my-auto" />
                
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => editor.chain().focus().toggleBulletList().run()}
                  className={`rounded-lg h-7 w-7 sm:h-8 sm:w-8 transition-colors ${editor.isActive('bulletList') ? 'bg-primary/10 text-primary shadow-sm' : 'text-muted-foreground hover:bg-background hover:text-foreground'}`}
                  aria-label="Toggle bullet list"
                >
                  <List className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => editor.chain().focus().toggleOrderedList().run()}
                  className={`rounded-lg h-7 w-7 sm:h-8 sm:w-8 transition-colors ${editor.isActive('orderedList') ? 'bg-primary/10 text-primary shadow-sm' : 'text-muted-foreground hover:bg-background hover:text-foreground'}`}
                  aria-label="Toggle ordered list"
                >
                  <ListOrdered className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => editor.chain().focus().toggleBlockquote().run()}
                  className={`rounded-lg h-7 w-7 sm:h-8 sm:w-8 transition-colors ${editor.isActive('blockquote') ? 'bg-primary/10 text-primary shadow-sm' : 'text-muted-foreground hover:bg-background hover:text-foreground'}`}
                  aria-label="Toggle blockquote"
                >
                  <Quote className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                </Button>
                
                <div className="min-w-2 flex-1 basis-full sm:basis-auto" />
                
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => editor.chain().focus().undo().run()}
                  disabled={!editor.can().undo()}
                  className="rounded-lg h-7 w-7 sm:h-8 sm:w-8 text-muted-foreground hover:bg-background hover:text-foreground disabled:opacity-30"
                  aria-label="Undo"
                >
                  <Undo className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => editor.chain().focus().redo().run()}
                  disabled={!editor.can().redo()}
                  className="rounded-lg h-7 w-7 sm:h-8 sm:w-8 text-muted-foreground hover:bg-background hover:text-foreground disabled:opacity-30"
                  aria-label="Redo"
                >
                  <Redo className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                </Button>
              </div>
              
              <EditorContent 
                editor={editor} 
                className="flex-1 bg-background text-sm sm:text-base cursor-text"
                onClick={() => editor.chain().focus().run()}
              />
            </div>
          </div>
        </div>

        {/* Modal footer controls */}
        <div className="sticky bottom-0 z-20 p-4 sm:px-8 sm:py-4 bg-card/95 backdrop-blur-md border-t border-border/80 flex flex-col-reverse justify-end gap-2 sm:flex-row sm:gap-3 sm:items-center flex-shrink-0">
          <Button variant="ghost" onClick={onClose} className="w-full rounded-xl px-4 sm:w-auto sm:px-5 hover:bg-destructive/10 hover:text-destructive font-bold text-sm sm:text-base h-11">
            Cancel
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={!title.trim() || isSaving}
            className="w-full rounded-xl px-5 sm:w-auto sm:px-6 font-extrabold shadow-md shadow-primary/20 hover:shadow-primary/40 hover:-translate-y-0.5 active:translate-y-0 transition-all text-sm sm:text-base h-11"
          >
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : note ? (
              'Save Changes'
            ) : (
              'Publish Note'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
