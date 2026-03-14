import mongoose from 'mongoose';

const DoctorSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    specialization: { type: String, required: true },
    bio: { type: String, default: '' },
    fee: { type: Number, required: true, default: 500 },
    experience: { type: Number, default: 1 },
    isApproved: { type: Boolean, default: false },
    availability: [
      {
        day: { type: String }, // e.g. "Monday"
        slots: [String],       // e.g. ["09:00 AM", "10:00 AM"]
      },
    ],
    rating: { type: Number, default: 0 },
    totalReviews: { type: Number, default: 0 },
    qualifications: [String],
    hospital: { type: String, default: '' },
    // Extended professional profile fields
    languages: { type: [String], default: ['English'] },
    consultationType: { type: String, enum: ['Online', 'In-person', 'Both'], default: 'Both' },
    clinicAddress: { type: String, default: '' },
    isOnline: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.models.Doctor || mongoose.model('Doctor', DoctorSchema);
