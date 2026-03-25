import mongoose from 'mongoose';
import { OCCUPYING_APPOINTMENT_STATUSES } from '@/lib/appointmentStatus';

const AppointmentSchema = new mongoose.Schema(
  {
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', required: true },
    date: { type: String, required: true },    // "2024-03-15"
    timeSlot: { type: String, required: true }, // "10:00 AM"
    slotKeys: { type: [String], default: [] }, // ["10:00", "10:15", "10:30", "10:45"]
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'completed', 'cancelled', 'rejected'],
      default: 'pending',
    },
    notes: { type: String, default: '' },
    roomId: { type: String, default: '' }, // for WebRTC video room
    scheduledDateTime: { type: Date }, // Computed ISO date+time
    isReviewed: { type: Boolean, default: false },
    doctorReminderSent: { type: Boolean, default: false },
    joinReminderSent: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Protect against concurrent double-booking of overlapping doctor slots.
AppointmentSchema.index(
  { doctorId: 1, date: 1, slotKeys: 1 },
  {
    unique: true,
    partialFilterExpression: {
      status: { $in: OCCUPYING_APPOINTMENT_STATUSES },
    },
  }
);

// Prevent a patient from holding two overlapping active appointments.
AppointmentSchema.index(
  { patientId: 1, date: 1, slotKeys: 1 },
  {
    unique: true,
    partialFilterExpression: {
      status: { $in: OCCUPYING_APPOINTMENT_STATUSES },
    },
  }
);

AppointmentSchema.index({ doctorId: 1, date: 1, timeSlot: 1 });
AppointmentSchema.index({ patientId: 1, date: 1, timeSlot: 1 });

export default mongoose.models.Appointment || mongoose.model('Appointment', AppointmentSchema);
