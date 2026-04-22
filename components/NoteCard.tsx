'use client';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Pin, Archive, Trash2, Edit, Calendar, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { Note } from '@/types';

interface NoteCardProps {
  note: Note;
  onEdit: (note: Note) => void;
  onDelete: (noteId: string) => void;
  onTogglePin: (noteId: string) => void;
  onToggleArchive: (noteId: string) => void;
  isPinning?: boolean;
  isArchiving?: boolean;
  isDeleting?: boolean;
}

export function NoteCard({ 
  note, 
  onEdit, 
  onDelete, 
  onTogglePin, 
  onToggleArchive,
  isPinning = false,
  isArchiving = false,
  isDeleting = false
}: NoteCardProps) {
  // Strip HTML tags for clean preview
  const plainTextContent = note.content.replace(/<[^>]+>/g, ' ');
  const isDisabled = isPinning || isArchiving || isDeleting;

  return (
    <Card 
      className={`p-3 sm:p-6 h-full flex flex-col group cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-primary/10 border border-border/50 bg-card/80 backdrop-blur-xl dark:bg-card/40 overflow-hidden relative rounded-xl sm:rounded-2xl ${isDisabled ? 'opacity-70 pointer-events-none' : ''}`}
      onClick={() => !isDisabled && onEdit(note)}
    >
      {/* Optional Note Color Accent */}
      {note.color && note.color !== '#ffffff' && note.color !== '#000000' && (
        <div 
          className="absolute top-0 left-0 right-0 h-1"
          style={{ backgroundColor: note.color }}
        />
      )}

      {/* Floating Actions (visible on hover) */}
      <div className="absolute top-2 right-2 sm:top-4 sm:right-4 flex gap-1 z-10 bg-background/80 backdrop-blur-md rounded-full shadow-sm p-1">
        <Button
          variant="ghost"
          size="icon"
          disabled={isDisabled}
          className="h-7 w-7 sm:h-8 sm:w-8 rounded-full hover:bg-primary/20 hover:text-primary transition-colors"
          onClick={(e) => {
            e.stopPropagation();
            onTogglePin(note._id);
          }}
        >
          {isPinning ? (
            <Loader2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 animate-spin text-primary" />
          ) : (
            <Pin className={`h-3.5 w-3.5 sm:h-4 sm:w-4 ${note.isPinned ? 'fill-primary text-primary' : ''}`} />
          )}
        </Button>
        <Button
          variant="ghost"
          size="icon"
          disabled={isDisabled}
          className="h-7 w-7 sm:h-8 sm:w-8 rounded-full hover:bg-primary/20 hover:text-primary transition-colors"
          onClick={(e) => {
            e.stopPropagation();
            onEdit(note);
          }}
        >
          <Edit className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
        </Button>
      </div>

      <div className="flex-1">
        <h3 className="font-bold text-base sm:text-xl text-foreground mb-2 sm:mb-3 pr-20 sm:pr-8 line-clamp-2 leading-tight break-words">
          {note.title}
        </h3>
        
        <p className="text-muted-foreground mb-3 sm:mb-6 line-clamp-3 text-xs sm:text-sm leading-relaxed break-words">
          {plainTextContent || 'Empty note...'}
        </p>
      </div>
      
      <div className="mt-auto pt-3 sm:pt-4 border-t border-border/40">
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:justify-between sm:items-end sm:gap-4">
          <div className="flex min-w-0 flex-wrap gap-1.5 sm:gap-2">
            {note.category && !['all', 'other'].includes((note.category as string).toLowerCase()) && (
              <span className="px-2 py-0.5 sm:px-2.5 sm:py-1 bg-primary/10 text-primary text-[10px] sm:text-xs font-semibold rounded-md uppercase tracking-wider">
                {note.category}
              </span>
            )}
            {note.tags.slice(0, 2).map((tag, index) => (
              <span key={index} className="px-2 py-0.5 sm:px-2.5 sm:py-1 bg-muted/50 text-muted-foreground text-[10px] sm:text-xs font-medium rounded-md border border-border/50">
                #{tag}
              </span>
            ))}
            {note.tags.length > 2 && (
              <span className="px-1.5 py-0.5 text-muted-foreground text-[10px] sm:text-xs font-medium">
                +{note.tags.length - 2}
              </span>
            )}
          </div>
          
          <div className="flex items-center justify-between gap-1.5 sm:gap-2">
            <div className="flex min-w-0 items-center text-[9px] sm:text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
              <Calendar className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-1 opacity-70" />
              {format(new Date(note.createdAt), 'MMM d, yyyy')}
            </div>
            
            <div className="flex shrink-0 gap-1 ml-1 sm:ml-2">
              <Button
                variant="ghost"
                size="icon"
                disabled={isDisabled}
                className="h-6 w-6 sm:h-7 sm:w-7 rounded-md hover:bg-secondary transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleArchive(note._id);
                }}
              >
                {isArchiving ? (
                  <Loader2 className="h-3 w-3 sm:h-3.5 sm:w-3.5 animate-spin text-primary" />
                ) : (
                  <Archive className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-muted-foreground" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                disabled={isDisabled}
                className="h-6 w-6 sm:h-7 sm:w-7 rounded-md hover:bg-destructive/10 hover:text-destructive transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(note._id);
                }}
              >
                {isDeleting ? (
                  <Loader2 className="h-3 w-3 sm:h-3.5 sm:w-3.5 animate-spin text-destructive" />
                ) : (
                  <Trash2 className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
