import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: false,
    select: false // Don't include password in queries by default
  },
  image: {
    type: String,
    default: null
  },
  emailVerified: {
    type: Date,
    default: null
  },
  categories: {
    type: [String],
    default: []
  },
  theme: {
    type: String,
    enum: ['light', 'dark'],
    default: 'light'
  },
  // ── Security Fields ──────────────────────────────────
  failedLoginAttempts: {
    type: Number,
    default: 0,
    select: false // Don't expose in normal queries
  },
  lockedUntil: {
    type: Date,
    default: null,
    select: false // Don't expose in normal queries
  },
  lastLoginAt: {
    type: Date,
    default: null
  },
  passwordChangedAt: {
    type: Date,
    default: null
  },
  resetPasswordToken: {
    type: String,
    default: null,
    select: false
  },
  resetPasswordExpires: {
    type: Date,
    default: null,
    select: false
  }
}, {
  timestamps: true
});

// Force schema recompilation for Next.js HMR
delete mongoose.models.User;

export default mongoose.model('User', UserSchema);
