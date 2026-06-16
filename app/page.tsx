import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { NotesDashboard } from '@/components/NotesDashboard';
import connectDB from '@/lib/mongoose';
import Note from '@/lib/models/Note';
import User from '@/lib/models/User';

export default async function Home() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/auth/signin');
  }

  await connectDB();

  // Fetch non-archived notes on SSR
  const notesData = await Note.find({
    userId: session.user.id,
    isArchived: false,
  })
    .sort({ isPinned: -1, updatedAt: -1 })
    .lean();

  // Convert MongoDB BSON data (ObjectIds, Dates) into plain JSON format safely
  const initialNotes = JSON.parse(JSON.stringify(notesData));

  // Fetch user settings (categories and theme)
  const userData = await User.findById(session.user.id)
    .select('categories theme')
    .lean();

  const initialCategories = userData?.categories || [];
  const initialTheme = userData?.theme || 'light';

  const sessionUser = {
    id: session.user.id,
    name: session.user.name || null,
    email: session.user.email || null,
    image: session.user.image || null,
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
