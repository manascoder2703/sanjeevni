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
      console.log('🔄 All doctors reset to offline status');
    } catch (err) {
      console.error('❌ Failed to reset doctor statuses:', err);
    }
  })
  .catch(err => console.error('❌ MongoDB connection error:', err));

const rooms = new Map(); // roomId -> { participants: Map(socketId -> { userId, userName, role }), startTime: number }
const onlineDoctors = new Map(); // userId -> Set of socketIds

io.on('connection', (socket) => {
  console.log(`✅ Client connected: ${socket.id}`);

  // Join personal room for notifications
  socket.on('identify', ({ userId }) => {
    if (userId) {
      socket.join(userId);
      console.log(`👤 User ${userId} joined their personal notification room`);
    }
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

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`🚀 Socket.io signaling server running on port ${PORT}`);
});
