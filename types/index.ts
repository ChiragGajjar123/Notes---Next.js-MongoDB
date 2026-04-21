export interface Note {
  _id: string;
  title: string;
  content: string;
  category: 'personal' | 'work' | 'ideas' | 'tasks' | 'other';
  tags: string[];
  isPinned: boolean;
  isArchived: boolean;
  color: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  image?: string;
}
