import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const UserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, minlength: 6 },
    role: { type: String, enum: ['patient', 'doctor', 'admin'], default: 'patient' },
    avatar: { type: String, default: '' },
    phone: { type: String, default: '' },
    // Patient profile fields
    dob: { type: Date },
    gender: { type: String, enum: ['male', 'female', 'other', ''] , default: '' },
    bloodGroup: { type: String, default: '' },
    address: { type: String, default: '' },
    allergies: { type: String, default: '' },
    // Auth/security
    resetPasswordToken: String,
    resetPasswordExpire: Date,
  },
  { timestamps: true }
);

UserSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 12);
});

UserSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

export default mongoose.models.User || mongoose.model('User', UserSchema);
