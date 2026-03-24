import Conversation from '@/models/Conversation';
import Appointment from '@/models/Appointment';
import Doctor from '@/models/Doctor';

function toIdString(value) {
  if (!value) return '';
  return value.toString();
}

function buildPatientReferenceCode(idValue) {
  const raw = toIdString(idValue).replace(/[^a-fA-F0-9]/g, '').slice(-6);
  const numeric = parseInt(raw || '10482', 16);
  return (numeric % 90000) + 10000;
}

function chooseConversationFallback(viewerRole) {
  return viewerRole === 'doctor'
    ? 'No messages yet. Start guiding this patient here.'
    : 'No messages yet. Start chatting with your doctor here.';
}

function buildDisplayMessagePreview(conversation, viewerRole) {
  return conversation.lastMessageText || chooseConversationFallback(viewerRole);
}

function isActiveConversation(conversation) {
  return conversation.latestAppointmentStatus === 'confirmed';
}

export async function syncPortalConversationsForUser(user) {
  if (!user?.userId || !['doctor', 'patient'].includes(user.role)) return;

  if (user.role === 'doctor') {
    const doctorProfile = await Doctor.findOne({ userId: user.userId })
      .select('_id userId')
      .lean();

    if (!doctorProfile?._id) return;

    const appointments = await Appointment.find({ doctorId: doctorProfile._id })
      .select('patientId status roomId scheduledDateTime updatedAt createdAt')
      .sort({ updatedAt: -1, createdAt: -1 })
      .lean();

    const latestByPatient = new Map();
    appointments.forEach((appointment) => {
      const patientId = toIdString(appointment.patientId);
      if (patientId && !latestByPatient.has(patientId)) {
        latestByPatient.set(patientId, appointment);
      }
    });

    if (latestByPatient.size === 0) return;

    // Doctor sync: only update EXISTING conversations that are NOT deleted.
    // Never upsert — this prevents recreating a conversation the doctor deleted.
    const operations = Array.from(latestByPatient.values()).map((appointment) => ({
      updateOne: {
        filter: {
          doctorUserId: user.userId,
          patientUserId: appointment.patientId,
          deletedByDoctor: { $ne: true }, // Never touch deleted conversations
        },
        update: {
          $set: {
            doctorProfileId: doctorProfile._id,
            latestAppointmentId: appointment._id,
            latestAppointmentStatus: appointment.status || '',
            latestRoomId: appointment.roomId || '',
            latestScheduledDateTime: appointment.scheduledDateTime || null,
          },
        },
        upsert: false, // Never recreate from the doctor side
      },
    }));

    if (operations.length > 0) {
      await Conversation.bulkWrite(operations, { ordered: false }).catch(() => {});
    }

    return;
  }

  // ── Patient side sync ──────────────────────────────────────────────────────
  // Only sync confirmed appointments.
  // If deletedByDoctor: true exists on the document, only restore it when
  // the patient has a NEW confirmed appointment created after deletedAt.

  const confirmedAppointments = await Appointment.find({
    patientId: user.userId,
    status: 'confirmed',
  })
    .select('doctorId status roomId scheduledDateTime updatedAt createdAt')
    .sort({ createdAt: -1 })
    .lean();

  if (confirmedAppointments.length === 0) return;

  const latestConfirmedByDoctor = new Map();
  confirmedAppointments.forEach((appointment) => {
    const doctorProfileId = toIdString(appointment.doctorId);
    if (doctorProfileId && !latestConfirmedByDoctor.has(doctorProfileId)) {
      latestConfirmedByDoctor.set(doctorProfileId, appointment);
    }
  });

  const doctorProfileIds = Array.from(latestConfirmedByDoctor.keys());
  const approvedDoctors = await Doctor.find({
    _id: { $in: doctorProfileIds },
    isApproved: true,
  })
    .select('_id userId')
    .lean();

  if (approvedDoctors.length === 0) return;

  // Load existing conversation docs to check deletedByDoctor + deletedAt
  const existingConversations = await Conversation.find({
    patientUserId: user.userId,
    doctorUserId: { $in: approvedDoctors.map((d) => d.userId) },
  })
    .select('doctorUserId deletedByDoctor deletedAt')
    .lean();

  const existingByDoctorUserId = new Map();
  existingConversations.forEach((conv) => {
    existingByDoctorUserId.set(toIdString(conv.doctorUserId), conv);
  });

  const operations = [];

  for (const doctorProfile of approvedDoctors) {
    const doctorProfileId = toIdString(doctorProfile._id);
    const doctorUserId = toIdString(doctorProfile.userId);
    const appointment = latestConfirmedByDoctor.get(doctorProfileId);
    const existingConv = existingByDoctorUserId.get(doctorUserId);

    if (existingConv?.deletedByDoctor) {
      // Conversation was deleted by doctor.
      // Only restore if there is a confirmed appointment created AFTER deletedAt.
      const deletedAt = existingConv.deletedAt ? new Date(existingConv.deletedAt) : null;
      const isNewAppointment = appointment && deletedAt &&
        new Date(appointment.createdAt) > deletedAt;

      if (!isNewAppointment) {
        // No new appointment after deletion — do not restore, skip entirely.
        continue;
      }

      // New confirmed appointment exists after deletion — restore the conversation.
      operations.push({
        updateOne: {
          filter: {
            doctorUserId: doctorProfile.userId,
            patientUserId: user.userId,
          },
          update: {
            $set: {
              doctorProfileId: doctorProfile._id,
              latestAppointmentId: appointment._id,
              latestAppointmentStatus: 'confirmed',
              latestRoomId: appointment.roomId || '',
              latestScheduledDateTime: appointment.scheduledDateTime || null,
              deletedByDoctor: false,
              deletedAt: null,
              messages: [],
              lastMessageText: '',
              lastMessageAt: null,
              doctorUnreadCount: 0,
              patientUnreadCount: 0,
            },
          },
        },
      });
      continue;
    }

    // Normal upsert — no deletion flag, proceed as usual.
    operations.push({
      updateOne: {
        filter: {
          doctorUserId: doctorProfile.userId,
          patientUserId: user.userId,
        },
        update: {
          $setOnInsert: {
            doctorUserId: doctorProfile.userId,
            patientUserId: user.userId,
          },
          $set: {
            doctorProfileId: doctorProfile._id,
            latestAppointmentId: appointment._id,
            latestAppointmentStatus: 'confirmed',
            latestRoomId: appointment.roomId || '',
            latestScheduledDateTime: appointment.scheduledDateTime || null,
          },
        },
        upsert: true,
      },
    });
  }

  if (operations.length > 0) {
    await Conversation.bulkWrite(operations, { ordered: false }).catch(() => {});
  }
}

export function serializeConversationForViewer(conversation, viewer) {
  const viewerRole = viewer.role;
  const counterpartUser =
    viewerRole === 'doctor'
      ? conversation.patientUserId
      : conversation.doctorUserId;

  const counterpartId = toIdString(counterpartUser?._id || counterpartUser);
  const unreadCount =
    viewerRole === 'doctor'
      ? conversation.doctorUnreadCount || 0
      : conversation.patientUnreadCount || 0;

  return {
    _id: toIdString(conversation._id),
    urgent: !!conversation.urgent,
    unreadCount,
    active: isActiveConversation(conversation),
    deletedByDoctor: !!conversation.deletedByDoctor,
    lastMessageText: buildDisplayMessagePreview(conversation, viewerRole),
    lastMessageAt: conversation.lastMessageAt || conversation.updatedAt || conversation.createdAt,
    latestAppointmentId: toIdString(conversation.latestAppointmentId),
    latestAppointmentStatus: conversation.latestAppointmentStatus || '',
    latestRoomId: conversation.latestRoomId || '',
    latestScheduledDateTime: conversation.latestScheduledDateTime || null,
    counterpart: {
      id: counterpartId,
      role: viewerRole === 'doctor' ? 'patient' : 'doctor',
      name: counterpartUser?.name || (viewerRole === 'doctor' ? 'Patient' : 'Doctor'),
      avatar: counterpartUser?.avatar || '',
      email: counterpartUser?.email || '',
      phone: counterpartUser?.phone || '',
      specialization: conversation.doctorProfileId?.specialization || '',
      hospital: conversation.doctorProfileId?.hospital || '',
      initialOnline: viewerRole === 'patient' ? !!conversation.doctorProfileId?.isOnline : false,
      referenceCode: viewerRole === 'doctor' ? buildPatientReferenceCode(counterpartId) : null,
    },
  };
}

export function serializeConversationDetailForViewer(conversation, viewer) {
  const viewerRole = viewer.role;
  const counterpartUser =
    viewerRole === 'doctor'
      ? conversation.patientUserId
      : conversation.doctorUserId;
  const selfUser =
    viewerRole === 'doctor'
      ? conversation.doctorUserId
      : conversation.patientUserId;

  return {
    ...serializeConversationForViewer(conversation, viewer),
    self: {
      id: toIdString(selfUser?._id || selfUser),
      name: selfUser?.name || viewer.name || '',
      avatar: selfUser?.avatar || '',
      email: selfUser?.email || viewer.email || '',
      role: viewerRole,
    },
    counterpart: {
      ...serializeConversationForViewer(conversation, viewer).counterpart,
      role: viewerRole === 'doctor' ? 'patient' : 'doctor',
    },
    messages: (conversation.messages || []).map((message) => ({
      _id: toIdString(message._id),
      senderId: toIdString(message.senderId),
      senderRole: message.senderRole,
      text: message.text,
      kind: message.kind || 'text',
      voiceDuration: message.voiceDuration || 0,
      createdAt: message.createdAt,
      deliveredAt: message.deliveredAt,
      readAt: message.readAt,
      mine: toIdString(message.senderId) === toIdString(viewer.userId),
    })),
  };
}

export function getConversationAccessFilter(user) {
  return user.role === 'doctor'
    ? { doctorUserId: user.userId }
    : { patientUserId: user.userId };
}

export function getConversationParticipantIds(conversation) {
  return [
    toIdString(conversation.doctorUserId?._id || conversation.doctorUserId),
    toIdString(conversation.patientUserId?._id || conversation.patientUserId),
  ].filter(Boolean);
}