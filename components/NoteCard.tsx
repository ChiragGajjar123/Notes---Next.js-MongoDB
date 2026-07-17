'use client';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Pin, Archive, Trash2, Edit, Calendar, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { Note } from '@/types';
import { useNotes } from '@/context/notes-context';

interface NoteCardProps {
  note: Note;
}

export function NoteCard({ note }: NoteCardProps) {
  const {
    handleEditNote: onEdit,
    handleDeleteNoteTrigger: onDelete,
    handleTogglePin: onTogglePin,
    handleToggleArchive: onToggleArchive,
    pinningNoteId,
    archivingNoteId,
    isDeletingNoteId,
  } = useNotes();

  const isPinning = pinningNoteId === note._id;
  const isArchiving = archivingNoteId === note._id;
  const isDeleting = isDeletingNoteId === note._id;

  // Strip HTML tags for clean preview
  const plainTextContent = note.content.replace(/<[^>]+>/g, ' ');
  const isDisabled = isPinning || isArchiving || isDeleting;

  const hasCustomColor = note.color && note.color !== '#ffffff' && note.color !== '#000000';
  
  // Create alpha-tinted versions of hex colors
  const parsedBorderColor = hasCustomColor && note.color.startsWith('#') && note.color.length === 7 
    ? `${note.color}35` 
    : undefined;
    
  const parsedBgColor = hasCustomColor && note.color.startsWith('#') && note.color.length === 7 
    ? `linear-gradient(to bottom right, ${note.color}0a, hsl(var(--card) / 0.95))` 
    : undefined;

  const hoverShadow = hasCustomColor && note.color.startsWith('#') && note.color.length === 7
    ? `0 12px 30px -8px ${note.color}20, 0 4px 12px -5px ${note.color}15`
    : undefined;

  return (
    <Card 
      className={`p-4 sm:p-6 h-full flex flex-col group cursor-pointer transition-all duration-300 hover:-translate-y-1.5 hover:shadow-2xl border border-border/50 bg-card/80 backdrop-blur-xl dark:bg-card/40 overflow-hidden relative rounded-2xl ${isDisabled ? 'opacity-70 pointer-events-none' : ''}`}
      onClick={() => !isDisabled && onEdit(note)}
      style={{ 
        borderColor: parsedBorderColor,
        background: parsedBgColor,
      }}
      onMouseEnter={(e) => {
        if (hoverShadow) {
          e.currentTarget.style.boxShadow = hoverShadow;
          if (parsedBorderColor) e.currentTarget.style.borderColor = `${note.color}60`;
        } else {
          e.currentTarget.style.boxShadow = '0 15px 30px -10px rgba(0, 0, 0, 0.08)';
        }
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = '';
        e.currentTarget.style.borderColor = parsedBorderColor || '';
      }}
    >
      {/* Colored Top Lip Accent */}
      {note.color && note.color !== '#ffffff' && note.color !== '#000000' && (
        <div 
          className="absolute top-0 left-0 right-0 h-1.5 opacity-90"
          style={{ backgroundColor: note.color }}
        />
      )}

      {/* Floating Actions (visible on hover / active on touch) */}
      <div className="absolute top-2.5 right-2.5 sm:top-4 sm:right-4 flex gap-1.5 z-10 bg-background/90 dark:bg-card/90 backdrop-blur-md rounded-full shadow-md border border-border/40 p-1 sm:opacity-0 sm:group-hover:opacity-100 transition-all duration-250 scale-95 sm:scale-100">
        <Button
          variant="ghost"
          size="icon"
          disabled={isDisabled}
          className="h-7 w-7 sm:h-8 sm:w-8 rounded-full hover:bg-primary/15 hover:text-primary transition-all active:scale-90"
          onClick={(e) => {
            e.stopPropagation();
            onTogglePin(note._id);
          }}
          aria-label={note.isPinned ? 'Unpin note' : 'Pin note'}
        >
          {isPinning ? (
            <Loader2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 animate-spin text-primary" />
          ) : (
            <Pin className={`h-3.5 w-3.5 sm:h-4 sm:w-4 ${note.isPinned ? 'fill-primary text-primary rotate-45' : 'text-muted-foreground/60'}`} />
          )}
        </Button>
        <Button
          variant="ghost"
          size="icon"
          disabled={isDisabled}
          className="h-7 w-7 sm:h-8 sm:w-8 rounded-full hover:bg-primary/15 hover:text-primary transition-all active:scale-90"
          onClick={(e) => {
            e.stopPropagation();
            onEdit(note);
          }}
          aria-label="Edit note"
        >
          <Edit className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground/60 hover:text-foreground" />
        </Button>
      </div>

      <div className="flex-1 min-w-0 pr-12 sm:pr-8">
        <h3 className="font-extrabold text-lg sm:text-xl text-foreground mb-2 sm:mb-2.5 pr-8 sm:pr-4 line-clamp-2 leading-tight break-words tracking-tight group-hover:text-primary transition-colors">
          {note.title}
        </h3>
        
        <p className="text-muted-foreground mb-4 sm:mb-6 line-clamp-3 text-xs sm:text-sm leading-relaxed break-words font-medium">
          {plainTextContent || 'Empty note...'}
        </p>
      </div>
      
      <div className="mt-auto pt-3.5 sm:pt-4 border-t border-border/40">
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:justify-between sm:items-end sm:gap-4">
          <div className="flex min-w-0 flex-wrap gap-1.5">
            {note.category && !['all', 'other'].includes((note.category as string).toLowerCase()) && (
              <span className="px-2.5 py-0.5 bg-primary/10 text-primary border border-primary/20 text-[10px] sm:text-xs font-bold rounded-full uppercase tracking-wider shrink-0">
                {note.category}
              </span>
            )}
            {note.tags.slice(0, 2).map((tag, index) => (
              <span 
                key={index} 
                className="px-2.5 py-0.5 bg-secondary/40 text-muted-foreground border border-border/50 text-[10px] sm:text-xs font-semibold rounded-full hover:bg-secondary/60 hover:text-foreground transition-all cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation();
                }}
              >
                #{tag}
              </span>
            ))}
            {note.tags.length > 2 && (
              <span className="px-2 py-0.5 bg-muted/30 text-muted-foreground text-[10px] sm:text-xs font-bold rounded-full border border-border/30 shrink-0">
                +{note.tags.length - 2}
              </span>
            )}
          </div>
          
          <div className="flex items-center justify-between gap-2 border-t border-border/10 pt-2.5 sm:pt-0 sm:border-t-0 w-full sm:w-auto">
            <div className="flex min-w-0 items-center text-[10px] sm:text-[11px] text-muted-foreground/80 font-bold uppercase tracking-wider">
              <Calendar className="h-3 w-3 mr-1 text-muted-foreground/50 shrink-0" />
              {format(new Date(note.createdAt), 'MMM d, yyyy')}
            </div>
            
            <div className="flex shrink-0 gap-1.5 ml-2">
              <Button
                variant="ghost"
                size="icon"
                disabled={isDisabled}
                className="h-6 w-6 sm:h-7 sm:w-7 rounded-md hover:bg-secondary transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleArchive(note._id);
                }}
                aria-label={note.isArchived ? 'Activate note' : 'Archive note'}
              >
                {isArchiving ? (
                  <Loader2 className="h-3 w-3 sm:h-3.5 sm:w-3.5 animate-spin text-primary" />
                ) : (
                  <Archive className={`h-3.5 w-3.5 ${note.isArchived ? 'text-primary fill-primary/20' : 'text-muted-foreground/60'}`} />
                )}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                disabled={isDisabled}
                className="h-6 w-6 sm:h-7 sm:w-7 rounded-md hover:bg-destructive/15 hover:text-destructive transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(note._id);
                }}
                aria-label="Delete note"
              >
                {isDeleting ? (
                  <Loader2 className="h-3 w-3 sm:h-3.5 sm:w-3.5 animate-spin text-destructive" />
                ) : (
                  <Trash2 className="h-3.5 w-3.5 text-muted-foreground/60 hover:text-destructive" />
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
