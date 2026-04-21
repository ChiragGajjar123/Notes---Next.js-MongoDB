import mongoose from 'mongoose';

const NoteSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  content: {
    type: String,
    required: true,
    default: ''
  },
  category: {
    type: String,
    enum: ['personal', 'work', 'ideas', 'tasks', 'other'],
    default: 'other'
  },
  tags: [{
    type: String,
    trim: true,
    maxlength: 50
  }],
  isPinned: {
    type: Boolean,
    default: false
  },
  isArchived: {
    type: Boolean,
    default: false
  },
  color: {
    type: String,
    default: '#ffffff',
    match: /^#[0-9A-F]{6}$/i
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

NoteSchema.index({ userId: 1, createdAt: -1 });
NoteSchema.index({ userId: 1, title: 'text', content: 'text' });
NoteSchema.index({ userId: 1, category: 1 });
NoteSchema.index({ userId: 1, tags: 1 });

export default mongoose.models.Note || mongoose.model('Note', NoteSchema);
