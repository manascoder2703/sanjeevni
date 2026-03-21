import mongoose from 'mongoose';

const BookingLockSchema = new mongoose.Schema(
  {
    doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', required: true },
    date: { type: String, required: true }, // YYYY-MM-DD
    timeSlot: { type: String, required: true }, // e.g. "10:00 AM"
    slotKeys: { type: [String], default: [] }, // 15-minute buckets covered by the held slot
    patientId: { type: String, required: true }, // The user holding the lock
    expiresAt: { type: Date, required: true }, // For TTL index
  },
  { timestamps: true }
);

// Prevent overlapping lock holds for the same doctor/day.
BookingLockSchema.index({ doctorId: 1, date: 1, slotKeys: 1 }, { unique: true });
BookingLockSchema.index({ doctorId: 1, date: 1, timeSlot: 1 });

// TTL index to automatically remove expired locks
BookingLockSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.models.BookingLock || mongoose.model('BookingLock', BookingLockSchema);
