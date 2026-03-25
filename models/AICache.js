import mongoose from 'mongoose';

const AICacheSchema = new mongoose.Schema({
  prompt: {
    type: String,
    required: true,
    index: true,
    lowercase: true,
    trim: true,
  },
  role: {
    type: String,
    required: true,
    index: true,
  },
  response: {
    type: mongoose.Schema.Types.Mixed,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 86400, // Cache expires in 24 hours (86400 seconds)
  },
});

// Compound index for efficient lookup
AICacheSchema.index({ prompt: 1, role: 1 });

export default mongoose.models.AICache || mongoose.model('AICache', AICacheSchema);
