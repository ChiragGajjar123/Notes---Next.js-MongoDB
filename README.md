# Professional Notes App

A feature-rich, professional notes application built with Next.js, MongoDB, and TypeScript. Features include rich text editing, categories, tags, search functionality, and a beautiful responsive UI with dark mode support.

## Features

- **Rich Text Editor** - Full-featured text editor with formatting options
- **Categories & Tags** - Organize notes with custom categories and tags
- **Search Functionality** - Full-text search across titles, content, and tags
- **Archive System** - Archive old notes for clean organization
- **Pin Important Notes** - Keep important notes at the top
- **Dark Mode** - Beautiful dark/light theme toggle
- **Responsive Design** - Works perfectly on desktop, tablet, and mobile
- **Authentication** - Secure user authentication with NextAuth.js
- **MongoDB Integration** - Scalable database solution
- **Professional UI** - Built with shadcn/ui components

## Tech Stack

- **Frontend**: Next.js 16, React 19, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, NextAuth.js
- **Database**: MongoDB with Mongoose ODM
- **UI Components**: shadcn/ui, Radix UI, Lucide Icons
- **Rich Text**: TipTap editor
- **Deployment**: Vercel optimized

## Prerequisites

- Node.js 18+ 
- MongoDB instance (local or cloud)
- npm or yarn package manager

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd notes-app
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   
   Create a `.env.local` file in the root directory:
   ```env
   # MongoDB
   MONGODB_URI="mongodb://localhost:27017/notes-app"
   
   # NextAuth.js
   NEXTAUTH_URL="http://localhost:3000"
   NEXTAUTH_SECRET="your-secret-key-here"
   ```
   
   To generate a secure secret:
   ```bash
   openssl rand -base64 32
   ```

4. **Start MongoDB**
   
   Make sure MongoDB is running on your system or use a cloud service like MongoDB Atlas.

5. **Run the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   
   Navigate to [http://localhost:3000](http://localhost:3000)

## Usage

### Getting Started

1. **Sign Up / Sign In** - Create an account or sign in with your credentials
2. **Create Your First Note** - Click the "New Note" button
3. **Organize with Categories** - Assign categories like Personal, Work, Ideas, etc.
4. **Add Tags** - Use tags for better organization and search
5. **Search Notes** - Use the search bar to find notes quickly
6. **Archive Old Notes** - Keep your workspace clean by archiving
7. **Pin Important Notes** - Keep crucial notes at the top

### Features Overview

- **Rich Text Editing**: Bold, italic, lists, quotes, and more
- **Color Coding**: Assign custom colors to notes for visual organization
- **Responsive Layout**: Works seamlessly on all devices
- **Dark Mode**: Toggle between light and dark themes
- **Real-time Updates**: All changes are saved instantly

## Deployment

### Vercel Deployment (Recommended)

1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Initial commit"
   git push origin main
   ```

2. **Deploy on Vercel**
   - Connect your GitHub repository to Vercel
   - Add environment variables in Vercel dashboard:
     - `MONGODB_URI`: Your MongoDB connection string
     - `NEXTAUTH_URL`: Your deployed app URL (e.g., `https://your-app.vercel.app`)
     - `NEXTAUTH_SECRET`: Generate a new secret for production

3. **Environment Variables for Production**
   ```env
   MONGODB_URI="mongodb+srv://username:password@cluster.mongodb.net/notes-app"
   NEXTAUTH_URL="https://your-app.vercel.app"
   NEXTAUTH_SECRET="your-production-secret"
   ```

### Manual Deployment

1. **Build the application**
   ```bash
   npm run build
   ```

2. **Start production server**
   ```bash
   npm start
   ```

## Project Structure

```
notes-app/
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   │   ├── auth/          # Authentication endpoints
│   │   └── notes/         # Notes CRUD endpoints
│   ├── auth/              # Authentication pages
│   └── globals.css        # Global styles
├── components/            # React components
│   ├── ui/               # shadcn/ui components
│   ├── NoteCard.tsx      # Note card component
│   ├── NoteEditor.tsx    # Rich text editor
│   └── providers/        # Context providers
├── lib/                   # Utility libraries
│   ├── models/           # Mongoose models
│   ├── mongodb.ts        # MongoDB connection
│   └── utils.ts          # Utility functions
├── types/                 # TypeScript type definitions
└── public/               # Static assets
```

## API Endpoints

### Authentication
- `POST /api/auth/signin` - User sign in
- `POST /api/auth/signup` - User registration

### Notes
- `GET /api/notes` - Fetch user notes
- `POST /api/notes` - Create new note
- `PUT /api/notes/[id]` - Update note
- `DELETE /api/notes/[id]` - Delete note

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

If you encounter any issues or have questions, please open an issue on GitHub or contact the development team.
