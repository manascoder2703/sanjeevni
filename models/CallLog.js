import mongoose from 'mongoose';

const CallLogSchema = new mongoose.Schema({
  doctorUserId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  patientUserId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  doctorProfileId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Doctor', 
    required: true 
  },
  initiatorId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  initiatorRole: { 
    type: String, 
    enum: ['doctor', 'patient'], 
    required: true 
  },
  status: { 
    type: String, 
    enum: ['completed', 'missed', 'rejected', 'declined'], 
    default: 'completed' 
  },
  duration: { 
    type: Number, 
    default: 0 
  }, // in seconds
  startTime: { 
    type: Date, 
    default: Date.now 
  },
  endTime: { 
    type: Date 
  },
  conversationId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Conversation' 
  }
}, { timestamps: true });

// Indexes for faster lookups in portals
CallLogSchema.index({ doctorUserId: 1, createdAt: -1 });
CallLogSchema.index({ patientUserId: 1, createdAt: -1 });

export default mongoose.models.CallLog || mongoose.model('CallLog', CallLogSchema);
