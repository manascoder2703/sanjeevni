import mongoose from 'mongoose';

const AppointmentSchema = new mongoose.Schema(
  {
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', required: true },
    date: { type: String, required: true },    // "2024-03-15"
    timeSlot: { type: String, required: true }, // "10:00 AM"
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'completed', 'cancelled'],
      default: 'pending',
    },
    notes: { type: String, default: '' },
    roomId: { type: String, default: '' }, // for WebRTC video room
    scheduledDateTime: { type: Date }, // Computed ISO date+time
  },
  { timestamps: true }
);

export default mongoose.models.Appointment || mongoose.model('Appointment', AppointmentSchema);
