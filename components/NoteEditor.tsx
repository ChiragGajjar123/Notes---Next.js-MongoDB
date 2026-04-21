'use client';

import { useState, useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Bold, Italic, List, ListOrdered, Quote, Redo, Undo } from 'lucide-react';
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
        placeholder: 'Start writing your note...',
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
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{note ? 'Edit Note' : 'Create New Note'}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter note title..."
              className="mt-1"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="category">Category</Label>
              <select
                id="category"
                value={category}
                onChange={(e) => setCategory(e.target.value as Note['category'])}
                className="mt-1 w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="personal">Personal</option>
                <option value="work">Work</option>
                <option value="ideas">Ideas</option>
                <option value="tasks">Tasks</option>
                <option value="other">Other</option>
              </select>
            </div>
            
            <div>
              <Label htmlFor="color">Color</Label>
              <div className="flex gap-2 mt-1">
                <Input
                  id="color"
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="h-10 w-20"
                />
                <Input
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  placeholder="#ffffff"
                  className="flex-1"
                />
              </div>
            </div>
          </div>

          <div>
            <Label htmlFor="tags">Tags (comma-separated)</Label>
            <Input
              id="tags"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="tag1, tag2, tag3..."
              className="mt-1"
            />
          </div>

          <div>
            <Label>Content</Label>
            <div className="border rounded-md mt-1">
              <div className="flex gap-1 p-2 border-b bg-gray-50 dark:bg-gray-800">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => editor.chain().focus().toggleBold().run()}
                  className={editor.isActive('bold') ? 'bg-gray-200 dark:bg-gray-700' : ''}
                >
                  <Bold className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => editor.chain().focus().toggleItalic().run()}
                  className={editor.isActive('italic') ? 'bg-gray-200 dark:bg-gray-700' : ''}
                >
                  <Italic className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => editor.chain().focus().toggleBulletList().run()}
                  className={editor.isActive('bulletList') ? 'bg-gray-200 dark:bg-gray-700' : ''}
                >
                  <List className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => editor.chain().focus().toggleOrderedList().run()}
                  className={editor.isActive('orderedList') ? 'bg-gray-200 dark:bg-gray-700' : ''}
                >
                  <ListOrdered className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => editor.chain().focus().toggleBlockquote().run()}
                  className={editor.isActive('blockquote') ? 'bg-gray-200 dark:bg-gray-700' : ''}
                >
                  <Quote className="h-4 w-4" />
                </Button>
                <div className="flex-1" />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => editor.chain().focus().undo().run()}
                  disabled={!editor.can().undo()}
                >
                  <Undo className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => editor.chain().focus().redo().run()}
                  disabled={!editor.can().redo()}
                >
                  <Redo className="h-4 w-4" />
                </Button>
              </div>
              <EditorContent 
                editor={editor} 
                className="prose dark:prose-invert max-w-none p-4 min-h-[200px] focus:outline-none"
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!title.trim()}>
            {note ? 'Update' : 'Create'} Note
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
