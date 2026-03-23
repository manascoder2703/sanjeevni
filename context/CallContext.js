'use client';

import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { useNotifications } from './NotificationContext';
import toast from 'react-hot-toast';

const CallContext = createContext();

export function CallProvider({ children }) {
  const { user } = useAuth();
  const { socket } = useNotifications();

  const [callState, setCallState] = useState('idle'); // 'idle', 'offering', 'ringing', 'connected'
  const [isIncoming, setIsIncoming] = useState(false);
  const [remoteUser, setRemoteUser] = useState(null); // { id, name }
  const [roomId, setRoomId] = useState(null);
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [isMuted, setIsMuted] = useState(false);

  const pcRef = useRef(null);
  const socketRef = useRef(socket);

  useEffect(() => {
    socketRef.current = socket;
  }, [socket]);

  // Clean up WebRTC
  const cleanup = useCallback(() => {
    if (pcRef.current) {
      pcRef.current.close();
      pcRef.current = null;
    }
    if (localStream) {
      localStream.getTracks().forEach(t => t.stop());
    }
    setLocalStream(null);
    setRemoteStream(null);
    setCallState('idle');
    setIsIncoming(false);
    setRemoteUser(null);
    setRoomId(null);
    setIsMuted(false);
  }, [localStream]);

  // Initialize WebRTC PeerConnection
  const createPC = useCallback((stream) => {
    const pc = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
      ],
    });

    stream.getTracks().forEach(track => pc.addTrack(track, stream));

    pc.onicecandidate = (e) => {
      if (e.candidate && roomId) {
        socketRef.current?.emit('ice-candidate', { roomId, candidate: e.candidate });
      }
    };

    pc.ontrack = (e) => {
      setRemoteStream(e.streams[0]);
    };

    pc.onconnectionstatechange = () => {
      if (['disconnected', 'failed', 'closed'].includes(pc.connectionState)) {
        cleanup();
      }
    };

    pcRef.current = pc;
    return pc;
  }, [roomId, cleanup]);

  // Handle Incoming Call
  useEffect(() => {
    if (!socket) return;

    socket.on('call:incoming', ({ callerName, callerId, roomId: rId }) => {
      if (callState !== 'idle') {
        // Busy - auto reject
        socket.emit('call:rejected', { toUserId: callerId, roomId: rId });
        return;
      }
      setRemoteUser({ id: callerId, name: callerName });
      setRoomId(rId);
      setIsIncoming(true);
      setCallState('ringing');
      
      // Play ringtone logic could go here
    });

    socket.on('call:accepted', async ({ roomId: rId }) => {
      if (callState !== 'offering') return;
      setCallState('connected');
      toast.success('Call accepted');
    });

    socket.on('user-joined', async ({ userName }) => {
      // If we are the ones who initiated (state is connected/offering), start handshake
      if (callState === 'connected' || callState === 'offering') {
        if (!localStream) return;
        const pc = pcRef.current || createPC(localStream);
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        socket.emit('offer', { roomId, offer });
      }
    });

    socket.on('call:rejected', () => {
      toast.error('Call rejected');
      cleanup();
    });

    socket.on('call:hangup', () => {
      cleanup();
    });

    // WebRTC Signaling
    socket.on('offer', async ({ offer }) => {
      if (!localStream) return;
      const pc = pcRef.current || createPC(localStream);
      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      socket.emit('answer', { roomId, answer });
    });

    socket.on('answer', async ({ answer }) => {
      if (pcRef.current) {
        await pcRef.current.setRemoteDescription(new RTCSessionDescription(answer));
      }
    });

    socket.on('ice-candidate', async ({ candidate }) => {
      if (pcRef.current) {
        try { await pcRef.current.addIceCandidate(new RTCIceCandidate(candidate)); } catch (e) {}
      }
    });

    return () => {
      socket.off('call:incoming');
      socket.off('call:accepted');
      socket.off('call:rejected');
      socket.off('call:hangup');
      socket.off('offer');
      socket.off('answer');
      socket.off('ice-candidate');
    };
  }, [socket, callState, localStream, roomId, createPC, cleanup]);

  const initiateCall = async (targetUser, rId) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      setLocalStream(stream);
      setRemoteUser(targetUser);
      setRoomId(rId);
      setCallState('offering');
      
      socket.emit('call:request', { 
        toUserId: targetUser.id, 
        callerName: user.name, 
        callerId: user.id || user.userId, 
        roomId: rId 
      });
      
      // Also join the room ourselves so we can receive WebRTC signals
      socket.emit('join-room', { roomId: rId, userId: user.id, userName: user.name });

    } catch (err) {
      toast.error('Could not access microphone');
      console.error(err);
    }
  };

  const acceptCall = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      setLocalStream(stream);
      setCallState('connected');
      
      socket.emit('call:accepted', { toUserId: remoteUser.id, roomId });
      socket.emit('join-room', { roomId, userId: user.id, userName: user.name });
      
      // Create PC and wait for offer
      createPC(stream);

    } catch (err) {
      toast.error('Could not access microphone');
      rejectCall();
    }
  };

  const rejectCall = () => {
    if (remoteUser && roomId) {
      socket.emit('call:rejected', { toUserId: remoteUser.id, roomId });
    }
    cleanup();
  };

  const hangupCall = () => {
    if (remoteUser && roomId) {
      socket.emit('call:hangup', { toUserId: remoteUser.id, roomId });
    }
    cleanup();
  };

  const toggleMute = () => {
    if (localStream) {
      const track = localStream.getAudioTracks()[0];
      if (track) {
        track.enabled = !track.enabled;
        setIsMuted(!track.enabled);
      }
    }
  };

  return (
    <CallContext.Provider value={{
      callState, isIncoming, remoteUser, localStream, remoteStream, isMuted,
      initiateCall, acceptCall, rejectCall, hangupCall, toggleMute
    }}>
      {children}
    </CallContext.Provider>
  );
}

export const useCall = () => useContext(CallContext);
