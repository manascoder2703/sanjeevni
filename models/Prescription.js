import mongoose from 'mongoose';

const MedicineSchema = new mongoose.Schema({
  name:         { type: String, required: true },
  dosage:       { type: String, default: '' },
  frequency:    { type: String, default: '' },
  duration:     { type: String, default: '' },
  instructions: { type: String, default: '' },
  refillsAllowed: { type: Number, default: 0 },
}, { _id: true });

const PrescriptionSchema = new mongoose.Schema({
  patientUserId:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  doctorUserId:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  doctorProfileId: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', required: true },
  appointmentId:   { type: mongoose.Schema.Types.ObjectId, ref: 'Appointment', default: null },

  rxNumber:  { type: String, unique: true },
  diagnosis: { type: String, required: true },
  medicines: { type: [MedicineSchema], default: [] },
  doctorNotes: { type: String, default: '' },

  patientSnapshot: {
    name:               { type: String },
    age:                { type: Number },
    gender:             { type: String },
    bloodGroup:         { type: String },
    weight:             { type: String },
    allergies:          [String],
    currentMedications: [String],
    conditions:         [String],
  },

  status: {
    type: String,
    enum: ['draft', 'issued', 'cancelled'],
    default: 'issued',
  },

  validUntil:      { type: Date },
  issuedAt:        { type: Date, default: Date.now },

  isPaid:          { type: Boolean, default: false },
  paymentId:       { type: String, default: null },
  consultationFee: { type: Number, default: 0 },
  pdfUrl:          { type: String, default: null },
}, { timestamps: true });

PrescriptionSchema.index({ patientUserId: 1, createdAt: -1 });
PrescriptionSchema.index({ doctorUserId: 1, createdAt: -1 });

function generateRxNumber() {
  const year = new Date().getFullYear();
  const ts = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).substr(2, 4).toUpperCase();
  return `RX-${year}-${ts}${rand}`;
}

PrescriptionSchema.pre('save', function () {
  if (!this.rxNumber) {
    this.rxNumber = generateRxNumber();
  }
  if (!this.validUntil) {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    this.validUntil = d;
  }
});

export default mongoose.models.Prescription || mongoose.model('Prescription', PrescriptionSchema);