import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { getUserFromRequest } from '@/lib/auth';
import Prescription from '@/models/Prescription';
import Appointment from '@/models/Appointment';
import Doctor from '@/models/Doctor';
import User from '@/models/User';

// GET — doctor fetches all confirmed patients + their health info
export async function GET(request) {
  try {
    await connectDB();
    const user = await getUserFromRequest(request);
    if (!user || user.role !== 'doctor') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const doctorProfile = await Doctor.findOne({ userId: user.userId }).lean();
    if (!doctorProfile) {
      return NextResponse.json({ error: 'Doctor profile not found' }, { status: 404 });
    }

    // Get all unique confirmed patients for this doctor
    const appointments = await Appointment.find({
      doctorId: doctorProfile._id,
      status: { $in: ['confirmed', 'completed'] },
    })
      .select('patientId')
      .lean();

    const uniquePatientIds = [...new Set(appointments.map(a => a.patientId.toString()))];

    const patients = await User.find({
      _id: { $in: uniquePatientIds },
    })
      .select('name email avatar gender dob bloodGroup allergies currentMedications conditions weight phone')
      .lean();

    // For each patient, also fetch their latest prescription from this doctor
    const patientData = await Promise.all(patients.map(async (patient) => {
      const latestRx = await Prescription.findOne({
        patientUserId: patient._id,
        doctorUserId: user.userId,
      })
        .sort({ createdAt: -1 })
        .populate('doctorUserId', 'name')
        .populate('doctorProfileId', 'specialization')
        .lean();

      const age = patient.dob
        ? Math.floor((Date.now() - new Date(patient.dob)) / (365.25 * 24 * 60 * 60 * 1000))
        : null;

      return {
        _id: patient._id,
        name: patient.name,
        email: patient.email,
        avatar: patient.avatar,
        gender: patient.gender,
        age,
        bloodGroup: patient.bloodGroup || '',
        allergies: patient.allergies ? patient.allergies.split(',').map(s => s.trim()).filter(Boolean) : [],
        currentMedications: patient.currentMedications || [],
        conditions: Array.isArray(patient.conditions) ? patient.conditions.filter(Boolean) : (patient.conditions ? patient.conditions.split(',').map(s => s.trim()).filter(Boolean) : []),
        weight: patient.weight || '',
        phone: patient.phone || '',
        latestRx,
      };
    }));

    return NextResponse.json({ patients: patientData, doctorProfile });
  } catch (error) {
    console.error('GET prescriptions error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// POST — doctor creates a prescription
export async function POST(request) {
  try {
    await connectDB();
    const user = await getUserFromRequest(request);
    if (!user || user.role !== 'doctor') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { patientUserId, diagnosis, medicines, doctorNotes, appointmentId } = body;

    if (!patientUserId || !diagnosis || !medicines?.length) {
      return NextResponse.json({ error: 'Patient, diagnosis and at least one medicine are required' }, { status: 400 });
    }

    const doctorProfile = await Doctor.findOne({ userId: user.userId }).lean();
    if (!doctorProfile) {
      return NextResponse.json({ error: 'Doctor profile not found' }, { status: 404 });
    }

    // Fetch patient for snapshot
    const patient = await User.findById(patientUserId)
      .select('name gender dob bloodGroup allergies currentMedications conditions weight')
      .lean();

    if (!patient) {
      return NextResponse.json({ error: 'Patient not found' }, { status: 404 });
    }

    const age = patient.dob
      ? Math.floor((Date.now() - new Date(patient.dob)) / (365.25 * 24 * 60 * 60 * 1000))
      : null;

    const prescription = new Prescription({
      patientUserId,
      doctorUserId: user.userId,
      doctorProfileId: doctorProfile._id,
      appointmentId: appointmentId || null,
      diagnosis,
      medicines,
      doctorNotes: doctorNotes || '',
      consultationFee: doctorProfile.fee || 0,
      patientSnapshot: {
        name: patient.name,
        age,
        gender: patient.gender,
        bloodGroup: patient.bloodGroup || '',
        weight: patient.weight || '',
        allergies: patient.allergies ? patient.allergies.split(',').map(s => s.trim()).filter(Boolean) : [],
        currentMedications: patient.currentMedications || [],
        conditions: Array.isArray(patient.conditions) ? patient.conditions.filter(Boolean) : (patient.conditions ? patient.conditions.split(',').map(s => s.trim()).filter(Boolean) : []),
      },
    });
    await prescription.save();

    return NextResponse.json({ prescription }, { status: 201 });
  } catch (error) {
  console.error('GET prescriptions error:', error.message, error.stack);
  return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
}
}