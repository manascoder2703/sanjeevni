const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.local' });

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
  },
});

// MongoDB Connection for Status Tracking
mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    console.log('✅ Socket server connected to MongoDB');
    // Reset all doctors to offline on startup to prevent "zombie" online statuses
    try {
      const db = mongoose.connection.db;
      await db.collection('doctors').updateMany({}, { $set: { isOnline: false } });
      await syncAppointmentExpiryTimers();
      console.log('🔄 All doctors reset to offline status');
    } catch (err) {
      console.error('❌ Failed to reset doctor statuses:', err);
    }
  })
  .catch(err => console.error('❌ MongoDB connection error:', err));

const rooms = new Map(); // roomId -> { participants: Map(socketId -> { userId, userName, role }), startTime: number }
const onlineDoctors = new Map(); // userId -> Set of socketIds
const onlineUsers = new Map(); // userId -> Set of socketIds
const lockTimers = new Map();
const appointmentExpiryTimers = new Map();
const APPOINTMENT_WINDOW_MS = 60 * 60 * 1000;
const MAX_TIMEOUT_MS = 2147483647;

function clearManagedTimer(map, key) {
  const timer = map.get(key);
  if (timer) {
    clearTimeout(timer);
    map.delete(key);
  }
}

function addOnlineUser(userId, socketId) {
  const normalizedUserId = String(userId || '');
  if (!normalizedUserId) return;

  if (!onlineUsers.has(normalizedUserId)) {
    onlineUsers.set(normalizedUserId, new Set());
  }

  const sockets = onlineUsers.get(normalizedUserId);
  const wasOffline = sockets.size === 0;
  sockets.add(socketId);

  if (wasOffline) {
    io.emit('presence:changed', { userId: normalizedUserId, isOnline: true });
  }
}

function removeOnlineUser(userId, socketId) {
  const normalizedUserId = String(userId || '');
  if (!normalizedUserId || !onlineUsers.has(normalizedUserId)) return;

  const sockets = onlineUsers.get(normalizedUserId);
  sockets.delete(socketId);

  if (sockets.size === 0) {
    onlineUsers.delete(normalizedUserId);
    io.emit('presence:changed', { userId: normalizedUserId, isOnline: false });
  }
}

function parseLegacyScheduledDateTime(date, timeSlot) {
  if (!date || !timeSlot) return null;

  try {
    let hours;
    let minutes;

    if (timeSlot.includes(' ')) {
      const [time, modifier] = timeSlot.split(' ');
      [hours, minutes] = time.split(':').map(Number);
      if (hours === 12) hours = 0;
      if (modifier === 'PM') hours += 12;
    } else {
      [hours, minutes] = timeSlot.split(':').map(Number);
    }

    const parsed = new Date(`${date}T${String(hours).padStart(2, '0')}:${String(minutes || 0).padStart(2, '0')}:00`);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  } catch {
    return null;
  }
}

function getAppointmentExpiryAt(appointment) {
  const scheduled =
    appointment?.scheduledDateTime
      ? new Date(appointment.scheduledDateTime)
      : parseLegacyScheduledDateTime(appointment?.date, appointment?.timeSlot);

  if (!scheduled || Number.isNaN(scheduled.getTime())) return null;
  return new Date(scheduled.getTime() + APPOINTMENT_WINDOW_MS);
}

async function expireAppointmentNow(appointmentId) {
  clearManagedTimer(appointmentExpiryTimers, appointmentId);

  try {
    const db = mongoose.connection.db;
    const objectId = new mongoose.Types.ObjectId(appointmentId);
    const appointment = await db.collection('appointments').findOne({ _id: objectId });
    if (!appointment) return;

    let nextStatus = null;
    if (appointment.status === 'pending') nextStatus = 'cancelled';
    if (appointment.status === 'confirmed') nextStatus = 'completed';
    if (!nextStatus) return;

    const result = await db.collection('appointments').updateOne(
      { _id: objectId, status: appointment.status },
      { $set: { status: nextStatus } }
    );

    if (result.modifiedCount > 0) {
      console.log(`Appointment ${appointmentId} auto-updated from ${appointment.status} to ${nextStatus}.`);
    }
  } catch (error) {
    console.error(`Failed to auto-expire appointment ${appointmentId}:`, error);
  }
}

function scheduleAppointmentExpiry(appointment) {
  const appointmentId = String(appointment?._id || '');
  if (!appointmentId) return false;

  if (!['pending', 'confirmed'].includes(appointment.status)) {
    clearManagedTimer(appointmentExpiryTimers, appointmentId);
    return false;
  }

  const expiryAt = getAppointmentExpiryAt(appointment);
  if (!expiryAt) return false;

  clearManagedTimer(appointmentExpiryTimers, appointmentId);

  const scheduleNextSlice = () => {
    const remainingMs = expiryAt.getTime() - Date.now();
    if (remainingMs <= 0) {
      expireAppointmentNow(appointmentId);
      return;
    }

    const nextDelay = Math.min(remainingMs, MAX_TIMEOUT_MS);
    const timeoutId = setTimeout(scheduleNextSlice, nextDelay);
    appointmentExpiryTimers.set(appointmentId, timeoutId);
  };

  scheduleNextSlice();
  return true;
}

async function syncAppointmentExpiryTimers() {
  try {
    const db = mongoose.connection.db;
    const appointments = await db.collection('appointments')
      .find({ status: { $in: ['pending', 'confirmed'] } })
      .project({ _id: 1, status: 1, scheduledDateTime: 1, date: 1, timeSlot: 1 })
      .toArray();

    appointments.forEach(scheduleAppointmentExpiry);
    console.log(`Synced ${appointments.length} appointment expiry timers.`);
  } catch (error) {
    console.error('Failed to sync appointment expiry timers:', error);
  }
}

io.on('connection', (socket) => {
  console.log(`✅ Client connected: ${socket.id}`);

  // Join personal room for notifications
  socket.on('identify', ({ userId }) => {
    if (userId) {
      const normalizedUserId = String(userId);
      socket.identifiedUserId = normalizedUserId;
      socket.join(normalizedUserId);
      addOnlineUser(normalizedUserId, socket.id);
      console.log(`👤 User ${userId} joined their personal notification room`);
    }
  });

  socket.on('presence:query', ({ userIds = [] }) => {
    const presence = {};
    userIds.forEach((userId) => {
      const normalizedUserId = String(userId || '');
      if (!normalizedUserId) return;
      presence[normalizedUserId] = onlineUsers.has(normalizedUserId);
    });
    socket.emit('presence:snapshot', { presence });
  });

  // Doctor identifies themselves on dashboard entry
  socket.on('doctor-online', async ({ userId }) => {
    socket.isDoctor = true;
    socket.userId = userId;

    if (!onlineDoctors.has(userId)) {
      onlineDoctors.set(userId, new Set());
      try {
        const db = mongoose.connection.db;
        await db.collection('doctors').updateOne(
          { userId: new mongoose.Types.ObjectId(userId) },
          { $set: { isOnline: true } }
        );
        console.log(`📡 Doctor ${userId} is now ONLINE`);
      } catch (err) {
        console.error('❌ Error setting doctor online:', err);
      }
    }
    onlineDoctors.get(userId).add(socket.id);
  });

  socket.on('join-room', ({ roomId, userId, userName }) => {
    socket.join(roomId);
    socket.activeRoomId = roomId;

    if (!rooms.has(roomId)) {
      rooms.set(roomId, { participants: new Map(), startTime: null, chatHistory: [] });
    }
    
    const room = rooms.get(roomId);
    
    // ONE SOCKET PER USER RULE: Remove existing stale connections for SAME user in this room
    if (userId) {
      for (const [sId, info] of room.participants.entries()) {
        if (String(info.userId) === String(userId) && sId !== socket.id) {
          console.log(`🧹 Cleaning up ghost connection for user ${userId} (Socket: ${sId})`);
          const oldSocket = io.sockets.sockets.get(sId);
          if (oldSocket) {
            oldSocket.leave(roomId);
            oldSocket.disconnect(true);
          }
          room.participants.delete(sId);
        }
      }
    }

    room.participants.set(socket.id, { userId, userName });

    const roomSize = room.participants.size;
    console.log(`🚪 ${userName || socket.id} joined room ${roomId} (Room members: ${roomSize})`);

    // Sync Chat History
    if (room.chatHistory.length > 0) {
      socket.emit('chat-history', { history: room.chatHistory });
    }

    // Handle Start Time Sync
    if (roomSize >= 2) {
      if (!room.startTime) {
        room.startTime = Date.now();
        io.to(roomId).emit('call-started', { startTime: room.startTime });
      } else {
        // Person joining existing call
        socket.emit('call-started', { startTime: room.startTime });
      }

      // Notify the newcomer about EVERYONE else in the room
      const others = Array.from(room.participants.entries())
        .filter(([id]) => id !== socket.id)
        .map(([id, info]) => info);
      
      if (others.length > 0) {
        // For 1v1, we just take the first one
        socket.emit('room-info', {
          remoteUserName: others[0].userName,
          remoteUserId: others[0].userId
        });
      }

      // Notify others about the newcomer
      socket.to(roomId).emit('user-joined', { 
        socketId: socket.id,
        userId,
        userName
      });
    }
  });

  socket.on('offer', ({ roomId, offer }) => {
    socket.to(roomId).emit('offer', { offer, from: socket.id });
  });

  socket.on('answer', ({ roomId, answer }) => {
    socket.to(roomId).emit('answer', { answer, from: socket.id });
  });

  socket.on('ice-candidate', ({ roomId, candidate }) => {
    socket.to(roomId).emit('ice-candidate', { candidate, from: socket.id });
  });

  socket.on('chat-message', (data) => {
    const { roomId, message } = data;
    const room = rooms.get(roomId);
    if (room && message) {
      room.chatHistory.push({ message });
    }
    socket.to(roomId).emit('chat-message', { message });
  });

  socket.on('chat:join', ({ conversationId }) => {
    if (!conversationId) return;
    socket.join(`conversation:${conversationId}`);
  });

  socket.on('chat:leave', ({ conversationId }) => {
    if (!conversationId) return;
    socket.leave(`conversation:${conversationId}`);
  });

  socket.on('chat:typing', ({ conversationId, userId, userName, isTyping }) => {
    if (!conversationId || !userId) return;
    socket.to(`conversation:${conversationId}`).emit('chat:typing', {
      conversationId,
      userId: String(userId),
      userName,
      isTyping: !!isTyping,
    });
  });

  socket.on('disconnect', async () => {
    const roomId = socket.activeRoomId;
    if (roomId && rooms.has(roomId)) {
      const room = rooms.get(roomId);
      room.participants.delete(socket.id);
      
      if (room.participants.size === 0) {
        rooms.delete(roomId);
      } else {
        socket.to(roomId).emit('user-left', { socketId: socket.id });
      }
    }

    if (socket.identifiedUserId) {
      removeOnlineUser(socket.identifiedUserId, socket.id);
    }

    if (socket.isDoctor && socket.userId) {
      const doctorId = socket.userId;
      if (onlineDoctors.has(doctorId)) {
        onlineDoctors.get(doctorId).delete(socket.id);
        if (onlineDoctors.get(doctorId).size === 0) {
          onlineDoctors.delete(doctorId);
          try {
            const db = mongoose.connection.db;
            await db.collection('doctors').updateOne(
              { userId: new mongoose.Types.ObjectId(doctorId) },
              { $set: { isOnline: false } }
            );
            console.log(`💤 Doctor ${doctorId} is now OFFLINE`);
          } catch (err) {
            console.error('❌ Error setting doctor offline:', err);
          }
        }
      }
    }
    console.log(`❌ Client disconnected: ${socket.id}`);
  });
});

const bodyParser = require('body-parser');
app.use(bodyParser.json());

// Health Check for Render
app.get('/healthz', (req, res) => {
  res.status(200).send('OK');
});

// Internal notification endpoint
app.post('/internal/notify', (req, res) => {
  const { userId, notification } = req.body;
  if (!userId || !notification) {
    return res.status(400).json({ error: 'userId and notification required' });
  }

  // Generate an ID for the notification if not provided
  const notificationId = notification.id || Math.random().toString(36).substr(2, 9);
  const finalNotification = {
    ...notification,
    id: notificationId,
    timestamp: new Date().toISOString()
  };

  io.to(userId).emit('new-notification', finalNotification);
  console.log(`🔔 Notification sent to user ${userId}: ${notification.title}`);
  res.json({ success: true, notification: finalNotification });
});

app.post('/internal/chat-message', (req, res) => {
  const { conversationId, userIds = [], message } = req.body;
  if (!conversationId || !message) {
    return res.status(400).json({ error: 'conversationId and message required' });
  }

  io.to(`conversation:${conversationId}`).emit('chat:message', { conversationId, message });
  io.to(`conversation:${conversationId}`).emit('chat:conversation-updated', { conversationId });
  userIds.forEach((userId) => io.to(String(userId)).emit('chat:conversation-updated', { conversationId }));

  res.json({ success: true });
});

app.post('/internal/chat-conversation', (req, res) => {
  const { conversationId, userIds = [] } = req.body;
  if (!conversationId) {
    return res.status(400).json({ error: 'conversationId required' });
  }

  io.to(`conversation:${conversationId}`).emit('chat:conversation-updated', { conversationId });
  userIds.forEach((userId) => io.to(String(userId)).emit('chat:conversation-updated', { conversationId }));

  res.json({ success: true });
});

app.post('/internal/chat-read', (req, res) => {
  const { conversationId, userIds = [], messageIds = [], readByUserId } = req.body;
  if (!conversationId || !readByUserId) {
    return res.status(400).json({ error: 'conversationId and readByUserId required' });
  }

  const payload = {
    conversationId,
    messageIds,
    readByUserId: String(readByUserId),
  };

  io.to(`conversation:${conversationId}`).emit('chat:read', payload);
  io.to(`conversation:${conversationId}`).emit('chat:conversation-updated', { conversationId });
  userIds.forEach((userId) => {
    io.to(String(userId)).emit('chat:read', payload);
    io.to(String(userId)).emit('chat:conversation-updated', { conversationId });
  });

  res.json({ success: true });
});

// Internal lock timer endpoint
app.post('/internal/lock-timer', (req, res) => {
  const { userId, doctorId, date, timeSlot, expiresAt } = req.body;
  if (!userId || !expiresAt) return res.status(400).json({ error: 'Missing fields' });

  const timerKey = `${userId}-${doctorId}-${date}-${timeSlot}`;
  
  // Clear existing timer if any
  clearManagedTimer(lockTimers, timerKey);

  const delay = new Date(expiresAt).getTime() - Date.now();
  if (delay > 0) {
    console.log(`⏳ Setting server-side timer for user ${userId} (${delay/1000}s)`);
    const timerId = setTimeout(() => {
      io.to(userId).emit('lock-expired', { doctorId, date, timeSlot });
      clearManagedTimer(lockTimers, timerKey);
      console.log(`⏰ Timer expired for user ${userId} (Slot: ${timeSlot})`);
    }, delay);
    lockTimers.set(timerKey, timerId);
  }

  res.json({ success: true });
});

app.post('/internal/cancel-lock-timer', (req, res) => {
  const { userId, doctorId, date, timeSlot } = req.body;
  const timerKey = `${userId}-${doctorId}-${date}-${timeSlot}`;
  if (lockTimers.has(timerKey)) {
    clearManagedTimer(lockTimers, timerKey);
    console.log(`🛑 Timer cancelled for user ${userId} (Slot: ${timeSlot})`);
  }
  res.json({ success: true });
});

app.post('/internal/schedule-appointment-expiry', (req, res) => {
  const { appointment } = req.body;
  if (!appointment?._id) {
    return res.status(400).json({ error: 'appointment required' });
  }

  const scheduled = scheduleAppointmentExpiry(appointment);
  res.json({ success: true, scheduled });
});

app.post('/internal/cancel-appointment-expiry', (req, res) => {
  const { appointmentId } = req.body;
  if (!appointmentId) {
    return res.status(400).json({ error: 'appointmentId required' });
  }

  clearManagedTimer(appointmentExpiryTimers, String(appointmentId));
  res.json({ success: true });
});

// Internal broadcast endpoint
app.post('/internal/broadcast', (req, res) => {
  const { event, data } = req.body;
  if (!event || !data) {
    return res.status(400).json({ error: 'event and data required' });
  }

  io.emit(event, data);
  console.log(`📢 Global broadcast: ${event}`);
  res.json({ success: true });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`🚀 Socket.io signaling server running on port ${PORT}`);
});
