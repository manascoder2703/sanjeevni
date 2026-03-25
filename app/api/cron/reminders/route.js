import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Appointment from '@/models/Appointment';
import Doctor from '@/models/Doctor';
import User from '@/models/User';
import { sendPendingReminderToDoctor, sendJoinSessionNotification } from '@/lib/email';

/**
 * GET /api/cron/reminders
 * 
 * Background task to:
 * 1. Notify doctors of PENDING appointments starting in < 1 hour.
 * 2. Notify both parties of CONFIRMED appointments where 'Join' window is open (approx 10 mins before).
 * 
 * SECURITY: In a production environment, you should protect this route with a secret key
 * in the headers (e.g. from Vercel/GitHub actions).
 */
export async function GET(request) {
  try {
    // 🔒 Security: Check for Cron Secret
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const now = new Date();
    const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);
    const tenMinutesLater = new Date(now.getTime() + 10 * 60 * 1000);

    // ─── 1. DOCTOR REMINDERS (PENDING) ───────────────────────────────────────────
    // Find pending appointments starting within the next hour that haven't been reminded
    const pendingToNotify = await Appointment.find({
      status: 'pending',
      scheduledDateTime: { $gt: now, $lte: oneHourLater },
      doctorReminderSent: { $ne: true }
    }).populate('patientId', 'name').populate({ path: 'doctorId', populate: { path: 'userId', select: 'name email' } });

    for (const appt of pendingToNotify) {
      try {
        const doctorUser = appt.doctorId?.userId;
        if (doctorUser?.email) {
          await sendPendingReminderToDoctor({
            doctorEmail: doctorUser.email,
            doctorName: doctorUser.name,
            patientName: appt.patientId?.name || 'Patient',
            date: appt.date,
            timeSlot: appt.timeSlot
          });
          appt.doctorReminderSent = true;
          await appt.save();
        }
      } catch (err) {
        console.error(`Failed to send 1h reminder for appt ${appt._id}:`, err.message);
      }
    }

    // ─── 2. JOIN SESSION NOTIFICATIONS (CONFIRMED) ──────────────────────────────
    // Find confirmed appointments starting within the next 10 minutes (Join window opens -10 mins)
    const activeToNotify = await Appointment.find({
      status: 'confirmed',
      scheduledDateTime: { $gt: now, $lte: tenMinutesLater },
      joinReminderSent: { $ne: true }
    }).populate('patientId', 'name email').populate({ path: 'doctorId', populate: { path: 'userId', select: 'name email' } });

    for (const appt of activeToNotify) {
      try {
        const patient = appt.patientId;
        const doctorUser = appt.doctorId?.userId;

        // Send to Patient
        if (patient?.email) {
          await sendJoinSessionNotification({
            email: patient.email,
            name: patient.name,
            otherPartyName: doctorUser?.name || 'Doctor',
            role: 'patient',
            date: appt.date,
            timeSlot: appt.timeSlot
          });
        }

        // Send to Doctor
        if (doctorUser?.email) {
          await sendJoinSessionNotification({
            email: doctorUser.email,
            name: doctorUser.name,
            otherPartyName: patient?.name || 'Patient',
            role: 'doctor',
            date: appt.date,
            timeSlot: appt.timeSlot
          });
        }

        appt.joinReminderSent = true;
        await appt.save();
      } catch (err) {
        console.error(`Failed to send Join reminder for appt ${appt._id}:`, err.message);
      }
    }

    return NextResponse.json({ 
      success: true, 
      processedReminders: pendingToNotify.length,
      processedJoins: activeToNotify.length 
    });
  } catch (error) {
    console.error('Reminder CRON failed:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
