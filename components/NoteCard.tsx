'use client';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Pin, Archive, Trash2, Edit, MoreVertical } from 'lucide-react';
import { format } from 'date-fns';
import { Note } from '@/types';

interface NoteCardProps {
  note: Note;
  onEdit: (note: Note) => void;
  onDelete: (noteId: string) => void;
  onTogglePin: (noteId: string) => void;
  onToggleArchive: (noteId: string) => void;
}

export function NoteCard({ note, onEdit, onDelete, onTogglePin, onToggleArchive }: NoteCardProps) {
  return (
    <Card 
      className="p-4 hover:shadow-md transition-shadow cursor-pointer relative group"
      style={{ backgroundColor: note.color }}
    >
      <div className="flex justify-between items-start mb-2">
        <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100 line-clamp-2">
          {note.title}
        </h3>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={(e) => {
              e.stopPropagation();
              onTogglePin(note._id);
            }}
          >
            <Pin className={`h-4 w-4 ${note.isPinned ? 'fill-current' : ''}`} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={(e) => {
              e.stopPropagation();
              onEdit(note);
            }}
          >
            <Edit className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      <p className="text-gray-600 dark:text-gray-300 mb-3 line-clamp-3">
        {note.content}
      </p>
      
      <div className="flex justify-between items-center">
        <div className="flex gap-2">
          {note.category && (
            <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full dark:bg-blue-900 dark:text-blue-200">
              {note.category}
            </span>
          )}
          {note.tags.slice(0, 2).map((tag, index) => (
            <span key={index} className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-full dark:bg-gray-700 dark:text-gray-200">
              {tag}
            </span>
          ))}
        </div>
        
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={(e) => {
              e.stopPropagation();
              onToggleArchive(note._id);
            }}
          >
            <Archive className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 hover:text-red-600"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(note._id);
            }}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">
        {format(new Date(note.createdAt), 'MMM d, yyyy')}
      </div>
    </Card>
  );
}
