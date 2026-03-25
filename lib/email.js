import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export async function sendBookingReceivedToPatient({ patientEmail, patientName, doctorName, date, timeSlot, appointmentId }) {
  await transporter.sendMail({
    from: `"Sanjeevni" <${process.env.EMAIL_USER}>`,
    to: patientEmail,
    subject: 'Appointment Request Received - Sanjeevni',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background:#f8fafc; padding: 32px; border-radius: 12px;">
        <div style="background: linear-gradient(135deg, #6366f1, #4f46e5); padding: 24px; border-radius: 8px; text-align:center; margin-bottom:24px;">
          <h1 style="color:white; margin:0; font-size:24px;">Sanjeevni</h1>
          <p style="color:rgba(255,255,255,0.9); margin:8px 0 0;">Booking Request</p>
        </div>
        <h2 style="color:#1e293b;">We've received your request!</h2>
        <p style="color:#475569;">Hi <strong>${patientName}</strong>, your appointment request with <strong>Dr. ${doctorName}</strong> has been received and is currently <strong>pending approval</strong>.</p>
        <div style="background:white; border-radius:8px; padding:20px; margin: 20px 0; border-left: 4px solid #6366f1;">
          <p style="margin:8px 0; color:#334155;"><strong>Doctor:</strong> Dr. ${doctorName}</p>
          <p style="margin:8px 0; color:#334155;"><strong>Date:</strong> ${date}</p>
          <p style="margin:8px 0; color:#334155;"><strong>Time:</strong> ${timeSlot}</p>
          <p style="margin:8px 0; color:#334155;"><strong>Ref ID:</strong> #${appointmentId}</p>
        </div>
        <p style="color:#475569;">You will receive another email once the doctor confirms your appointment.</p>
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/patient" 
           style="display:inline-block; background:linear-gradient(135deg,#6366f1,#4f46e5); color:white; padding:12px 24px; border-radius:8px; text-decoration:none; font-weight:bold; margin-top:16px;">
          Check Status
        </a>
      </div>
    `,
  });
}

export async function sendPendingReminderToDoctor({ doctorEmail, doctorName, patientName, date, timeSlot }) {
  await transporter.sendMail({
    from: `"Sanjeevni" <${process.env.EMAIL_USER}>`,
    to: doctorEmail,
    subject: 'ACTION REQUIRED: Pending Appointment Reminder - Sanjeevni',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background:#fefce8; padding: 32px; border-radius: 12px; border: 1px solid #fef08a;">
        <div style="background: linear-gradient(135deg, #eab308, #ca8a04); padding: 24px; border-radius: 8px; text-align:center; margin-bottom:24px;">
          <h1 style="color:white; margin:0; font-size:24px;">Sanjeevni</h1>
          <p style="color:rgba(255,255,255,0.9); margin:8px 0 0;">Priority Reminder</p>
        </div>
        <h2 style="color:#854d0e;">Pending Appointment Today</h2>
        <p style="color:#713f12;">Hi <strong>Dr. ${doctorName}</strong>, you have a pending appointment request starting in less than 1 hour.</p>
        <div style="background:white; border-radius:8px; padding:20px; margin: 20px 0; border-left: 4px solid #eab308;">
          <p style="margin:8px 0; color:#334155;"><strong>Patient:</strong> ${patientName}</p>
          <p style="margin:8px 0; color:#334155;"><strong>Date:</strong> ${date}</p>
          <p style="margin:8px 0; color:#334155;"><strong>Time:</strong> ${timeSlot}</p>
        </div>
        <p style="color:#713f12;">Please confirm or reschedule this appointment as soon as possible to ensure patient care continuity.</p>
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/doctor" 
           style="display:inline-block; background:linear-gradient(135deg,#eab308,#ca8a04); color:white; padding:12px 24px; border-radius:8px; text-decoration:none; font-weight:bold; margin-top:16px;">
          Go to Dashboard
        </a>
      </div>
    `,
  });
}

export async function sendAppointmentConfirmedToPatient({ patientEmail, patientName, doctorName, date, timeSlot, appointmentId }) {
  await transporter.sendMail({
    from: `"Sanjeevni" <${process.env.EMAIL_USER}>`,
    to: patientEmail,
    subject: 'Appointment CONFIRMED - Sanjeevni',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background:#f0fdf4; padding: 32px; border-radius: 12px; border: 1px solid #bbf7d0;">
        <div style="background: linear-gradient(135deg, #22c55e, #16a34a); padding: 24px; border-radius: 8px; text-align:center; margin-bottom:24px;">
          <h1 style="color:white; margin:0; font-size:24px;">Sanjeevni</h1>
        </div>
        <h2 style="color:#166534;">Great News!</h2>
        <p style="color:#166534;">Hi <strong>${patientName}</strong>, your appointment with <strong>Dr. ${doctorName}</strong> has been confirmed by the doctor.</p>
        <div style="background:white; border-radius:8px; padding:20px; margin: 20px 0; border-left: 4px solid #22c55e;">
          <p style="margin:8px 0; color:#334155;"><strong>Doctor:</strong> Dr. ${doctorName}</p>
          <p style="margin:8px 0; color:#334155;"><strong>Date:</strong> ${date}</p>
          <p style="margin:8px 0; color:#334155;"><strong>Time:</strong> ${timeSlot}</p>
        </div>
        <p style="color:#166534;">You can now join the session from your dashboard 10 minutes before the scheduled time.</p>
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" 
           style="display:inline-block; background:linear-gradient(135deg,#22c55e,#16a34a); color:white; padding:12px 24px; border-radius:8px; text-decoration:none; font-weight:bold; margin-top:16px;">
          View Appointment
        </a>
      </div>
    `,
  });
}

export async function sendJoinSessionNotification({ email, name, otherPartyName, role, date, timeSlot }) {
  const isDoctor = role === 'doctor';
  await transporter.sendMail({
    from: `"Sanjeevni" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: `Session with ${otherPartyName} is LIVE!`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background:#f0f9ff; padding: 32px; border-radius: 12px; border: 1px solid #bae6fd;">
        <div style="background: linear-gradient(135deg, #0ea5e9, #2563eb); padding: 24px; border-radius: 8px; text-align:center; margin-bottom:24px;">
          <h1 style="color:white; margin:0; font-size:24px;">Sanjeevni</h1>
          <p style="color:rgba(255,255,255,0.9); margin:8px 0 0;">Telemedicine Portal</p>
        </div>
        <h2 style="color:#0369a1;">Time to Join!</h2>
        <p style="color:#0369a1;">Hi <strong>${name}</strong>, your session with <strong>${isDoctor ? '' : 'Dr. '}${otherPartyName}</strong> is ready to start.</p>
        <div style="background:white; border-radius:8px; padding:20px; margin: 12px 0; border: 1px solid #bae6fd;">
          <p style="margin:0; text-align:center; font-size:18px; color:#1e40af;"><strong>${timeSlot}</strong></p>
        </div>
        <div style="text-align:center; padding: 32px 0;">
          <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/${role}" 
             style="display:inline-block; background:#2563eb; color:white; padding:16px 42px; border-radius:99px; text-decoration:none; font-weight:900; font-size:16px; box-shadow: 0 4px 15px rgba(37,99,235,0.3);">
            JOIN SESSION NOW
          </a>
        </div>
        <p style="color:#0369a1; font-size:14px;">The virtual consultation room is now open. Please ensure you have a stable internet connection.</p>
      </div>
    `,
  });
}

export function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * BACKWARD COMPATIBILITY ALIAS
 * Added to resolve persistent stale caches in Next.js Turbopack version 16.x
 */
export const sendBookingConfirmation = sendBookingReceivedToPatient;
