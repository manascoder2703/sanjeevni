import mongoose from 'mongoose';

const UserAISessionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    messages: [
      {
        role: { type: String, enum: ['user', 'assistant'], required: true },
        content: { type: String, required: true },
        action: { type: mongoose.Schema.Types.Mixed },
        createdAt: { type: Date, default: Date.now }
      }
    ],
    bookingContext: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
  },
  { 
    timestamps: true 
  }
);

// TTL Index: Automatically delete the document 6 hours (21600 seconds) after the last update
UserAISessionSchema.index({ updatedAt: 1 }, { expireAfterSeconds: 21600 });

export default mongoose.models.UserAISession || mongoose.model('UserAISession', UserAISessionSchema);
