import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export async function sendBookingConfirmation({ patientEmail, patientName, doctorName, date, timeSlot, appointmentId }) {
  const mailOptions = {
    from: `"Sanjeevni" <${process.env.EMAIL_USER}>`,
    to: patientEmail,
    subject: '✅ Appointment Confirmed — Sanjeevni',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background:#f8fafc; padding: 32px; border-radius: 12px;">
        <div style="background: linear-gradient(135deg, #0ea5e9, #06b6d4); padding: 24px; border-radius: 8px; text-align:center; margin-bottom:24px;">
          <h1 style="color:white; margin:0; font-size:24px;">🏥 Sanjeevni</h1>
          <p style="color:rgba(255,255,255,0.9); margin:8px 0 0;">Your Health, One Click Away</p>
        </div>
        <h2 style="color:#1e293b;">Appointment Confirmed!</h2>
        <p style="color:#475569;">Hi <strong>${patientName}</strong>, your appointment has been booked successfully.</p>
        <div style="background:white; border-radius:8px; padding:20px; margin: 20px 0; border-left: 4px solid #0ea5e9;">
          <p style="margin:8px 0; color:#334155;"><strong>👨‍⚕️ Doctor:</strong> Dr. ${doctorName}</p>
          <p style="margin:8px 0; color:#334155;"><strong>📅 Date:</strong> ${date}</p>
          <p style="margin:8px 0; color:#334155;"><strong>⏰ Time:</strong> ${timeSlot}</p>
          <p style="margin:8px 0; color:#334155;"><strong>🔖 Appointment ID:</strong> #${appointmentId}</p>
        </div>
        <p style="color:#475569;">Please log in to your Sanjeevni dashboard to join the video consultation at the scheduled time.</p>
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/patient" 
           style="display:inline-block; background:linear-gradient(135deg,#0ea5e9,#06b6d4); color:white; padding:12px 24px; border-radius:8px; text-decoration:none; font-weight:bold; margin-top:16px;">
          View Dashboard →
        </a>
        <p style="color:#94a3b8; font-size:12px; margin-top:32px;">© 2024 Sanjeevni. All rights reserved.</p>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
}

export async function sendPasswordResetEmail({ email, name, resetUrl }) {
  const mailOptions = {
    from: `"Sanjeevni" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: '🔒 Password Reset Request — Sanjeevni',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background:#f8fafc; padding: 32px; border-radius: 12px;">
        <div style="background: linear-gradient(135deg, #0ea5e9, #06b6d4); padding: 24px; border-radius: 8px; text-align:center; margin-bottom:24px;">
          <h1 style="color:white; margin:0; font-size:24px;">🏥 Sanjeevni</h1>
          <p style="color:rgba(255,255,255,0.9); margin:8px 0 0;">Password Reset</p>
        </div>
        <h2 style="color:#1e293b;">Hello ${name},</h2>
        <p style="color:#475569;">You are receiving this email because a password reset request was made for your account.</p>
        <p style="color:#475569;">Click the button below to choose a new password. This link will expire in 10 minutes.</p>
        
        <div style="text-align: center; margin: 32px 0;">
          <a href="${resetUrl}" 
             style="display:inline-block; background:linear-gradient(135deg,#0ea5e9,#06b6d4); color:white; padding:14px 28px; border-radius:8px; text-decoration:none; font-weight:bold; font-size:16px;">
            Reset Password
          </a>
        </div>
        
        <p style="color:#475569; font-size: 14px;">If you did not request a password reset, you can safely ignore this email.</p>
        <p style="color:#94a3b8; font-size:12px; margin-top:32px; border-top: 1px solid #cbd5e1; padding-top: 16px;">© 2024 Sanjeevni. All rights reserved.</p>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
}
