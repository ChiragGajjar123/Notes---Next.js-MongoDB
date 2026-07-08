import { redirect } from 'next/navigation';
import { NotesDashboard } from '@/components/NotesDashboard';
import { goApi } from '@/lib/api-client';
import { getSessionUserId } from '@/lib/session';
import type { Note as NoteType } from '@/types';

interface UserSettingsResponse {
  name: string;
  email: string;
  theme: string;
  categories: string[];
}

export default async function Home() {
  const userId = await getSessionUserId();

  if (!userId) {
    redirect('/auth/signin');
  }

  let initialNotes: NoteType[] = [];
  let initialCategories: string[] = [];
  let initialTheme = 'light';
  let userName = '';
  let userEmail = '';

  try {
    // Fetch non-archived notes on SSR using the Go API
    initialNotes = await goApi<NoteType[]>('/api/notes?archived=false');

    // Fetch user profile and settings from Go API in one single request
    const settings = await goApi<UserSettingsResponse>('/api/settings');
    initialTheme = settings.theme || 'light';
    initialCategories = settings.categories || [];
    userName = settings.name || '';
    userEmail = settings.email || '';
  } catch (error) {
    console.error('Failed to load initial SSR data from Go backend:', error);
  }

  const sessionUser = {
    id: userId,
    name: userName || null,
    email: userEmail || null,
    image: null,
  };

  return (
    <NotesDashboard
      initialNotes={initialNotes}
      initialCategories={initialCategories}
      initialTheme={initialTheme}
      sessionUser={sessionUser}
    />
  );
}
