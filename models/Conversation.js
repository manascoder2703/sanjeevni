import mongoose from 'mongoose';

const ConversationMessageSchema = new mongoose.Schema(
  {
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    senderRole: {
      type: String,
      enum: ['doctor', 'patient'],
      required: true,
    },
    text: {
      type: String,
      required: true,
      trim: true,
    },
    kind: {
      type: String,
      enum: ['text', 'quick-action', 'call'],
      default: 'text',
    },
    deliveredAt: {
      type: Date,
      default: Date.now,
    },
    readAt: {
      type: Date,
      default: null,
    },
  },
  {
    _id: true,
    timestamps: { createdAt: true, updatedAt: false },
  }
);

const ConversationSchema = new mongoose.Schema(
  {
    doctorUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    doctorProfileId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Doctor',
      required: true,
    },
    patientUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    latestAppointmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Appointment',
      default: null,
    },
    latestAppointmentStatus: {
      type: String,
      enum: ['pending', 'confirmed', 'completed', 'cancelled', 'rejected', ''],
      default: '',
    },
    latestRoomId: {
      type: String,
      default: '',
    },
    latestScheduledDateTime: {
      type: Date,
      default: null,
    },
    urgent: {
      type: Boolean,
      default: false,
    },
    patientUnreadCount: {
      type: Number,
      default: 0,
    },
    doctorUnreadCount: {
      type: Number,
      default: 0,
    },
    lastMessageText: {
      type: String,
      default: '',
    },
    lastMessageAt: {
      type: Date,
      default: null,
    },
    doctorLastSeenAt: {
      type: Date,
      default: null,
    },
    patientLastSeenAt: {
      type: Date,
      default: null,
    },
    messages: {
      type: [ConversationMessageSchema],
      default: [],
    },
    // Set to true when the doctor deliberately deletes the conversation.
    // syncPortalConversationsForUser will skip recreating it until the
    // patient books a NEW confirmed appointment after deletedAt.
    deletedByDoctor: {
      type: Boolean,
      default: false,
    },
    // Timestamp of when the doctor deleted the conversation.
    // Used to determine if a new appointment was booked after deletion.
    deletedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

ConversationSchema.index({ doctorUserId: 1, patientUserId: 1 }, { unique: true });
ConversationSchema.index({ doctorUserId: 1, lastMessageAt: -1, updatedAt: -1 });
ConversationSchema.index({ patientUserId: 1, lastMessageAt: -1, updatedAt: -1 });

export default mongoose.models.Conversation || mongoose.model('Conversation', ConversationSchema);