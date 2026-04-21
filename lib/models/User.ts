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
    required: false
  },
  image: {
    type: String,
    default: null
  },
  emailVerified: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

UserSchema.index({ email: 1 });

export default mongoose.models.User || mongoose.model('User', UserSchema);
