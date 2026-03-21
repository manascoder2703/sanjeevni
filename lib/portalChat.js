import Conversation from '@/models/Conversation';
import Appointment from '@/models/Appointment';
import Doctor from '@/models/Doctor';

const ACTIVE_CHAT_APPOINTMENT_STATUSES = new Set(['pending', 'confirmed']);

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

function isActiveConversation(conversation, viewerRole) {
  const unreadCount = viewerRole === 'doctor'
    ? conversation.doctorUnreadCount
    : conversation.patientUnreadCount;

  return (
    conversation.urgent ||
    unreadCount > 0 ||
    ACTIVE_CHAT_APPOINTMENT_STATUSES.has(conversation.latestAppointmentStatus)
  );
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

    const operations = Array.from(latestByPatient.values()).map((appointment) => ({
      updateOne: {
        filter: {
          doctorUserId: user.userId,
          patientUserId: appointment.patientId,
        },
        update: {
          $setOnInsert: {
            doctorUserId: user.userId,
            patientUserId: appointment.patientId,
          },
          $set: {
            doctorProfileId: doctorProfile._id,
            latestAppointmentId: appointment._id,
            latestAppointmentStatus: appointment.status || '',
            latestRoomId: appointment.roomId || '',
            latestScheduledDateTime: appointment.scheduledDateTime || null,
          },
        },
        upsert: true,
      },
    }));

    if (operations.length > 0) {
      await Conversation.bulkWrite(operations, { ordered: false }).catch(() => {});
    }

    return;
  }

  const appointments = await Appointment.find({ patientId: user.userId })
    .select('doctorId status roomId scheduledDateTime updatedAt createdAt')
    .sort({ updatedAt: -1, createdAt: -1 })
    .lean();

  const latestByDoctorProfile = new Map();
  appointments.forEach((appointment) => {
    const doctorProfileId = toIdString(appointment.doctorId);
    if (doctorProfileId && !latestByDoctorProfile.has(doctorProfileId)) {
      latestByDoctorProfile.set(doctorProfileId, appointment);
    }
  });

  const allApprovedDoctors = await Doctor.find({ isApproved: true })
    .select('_id userId')
    .lean();

  const operations = allApprovedDoctors.map((doctorProfile) => {
    const doctorProfileId = toIdString(doctorProfile._id);
    const appointment = latestByDoctorProfile.get(doctorProfileId);
    
    return {
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
            latestAppointmentId: appointment?._id || null,
            latestAppointmentStatus: appointment?.status || '',
            latestRoomId: appointment?.roomId || '',
            latestScheduledDateTime: appointment?.scheduledDateTime || null,
          },
        },
        upsert: true,
      },
    };
  });

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
    active: isActiveConversation(conversation, viewerRole),
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
