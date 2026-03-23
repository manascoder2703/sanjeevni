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
  const audioRef = useRef(null);

  // Update audio source when remote stream changes
  useEffect(() => {
    if (audioRef.current && remoteStream) {
      console.log('🔊 Attaching remote stream to audio element');
      audioRef.current.srcObject = remoteStream;
      const playPromise = audioRef.current.play();
      if (playPromise !== undefined) {
        playPromise.catch(err => {
          console.warn('⚠️ Audio play promise rejected:', err);
          // Try to play again or notify user
        });
      }
    }
  }, [remoteStream]);

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
        { urls: 'stun:stun2.l.google.com:19302' },
        { urls: 'stun:stun3.l.google.com:19302' },
        { urls: 'stun:stun4.l.google.com:19302' },
      ],
    });

    stream.getTracks().forEach(track => pc.addTrack(track, stream));

    pc.onicecandidate = (e) => {
      if (e.candidate && stateRef.current.roomId) {
        socket.emit('ice-candidate', { roomId: stateRef.current.roomId, candidate: e.candidate });
      }
    };

    pc.ontrack = (e) => {
      console.log('📡 Remote track received:', e.track.kind);
      if (e.streams && e.streams[0]) {
        setRemoteStream(e.streams[0]);
      } else {
        const inboundStream = new MediaStream([e.track]);
        setRemoteStream(inboundStream);
      }
    };

    pc.oniceconnectionstatechange = () => {
      console.log('🧊 ICE Connection State:', pc.iceConnectionState);
      if (pc.iceConnectionState === 'failed') {
        toast.error('Connection failed. A TURN server may be required.');
      }
    };

    pc.onsignalingstatechange = () => {
      console.log('🚦 Signaling State:', pc.signalingState);
    };

    pc.onconnectionstatechange = () => {
      console.log('🔌 Peer Connection State:', pc.connectionState);
      if (['disconnected', 'failed', 'closed'].includes(pc.connectionState)) {
        cleanup();
      }
    };

    pcRef.current = pc;
    return pc;
  }, [roomId, cleanup]);

  const stateRef = useRef({ callState, roomId, localStream, remoteUser });
  useEffect(() => {
    stateRef.current = { callState, roomId, localStream, remoteUser };
  }, [callState, roomId, localStream, remoteUser]);

  // Handle Signaling
  useEffect(() => {
    if (!socket) return;

    const handleIncoming = ({ callerName, callerId, roomId: rId }) => {
      console.log('📞 Incoming call from:', callerName);
      if (stateRef.current.callState !== 'idle') {
        socket.emit('call:rejected', { toUserId: callerId, roomId: rId });
        return;
      }
      setRemoteUser({ id: callerId, name: callerName });
      setRoomId(rId);
      setIsIncoming(true);
      setCallState('ringing');
    };

    const handleAccepted = async ({ roomId: rId }) => {
      console.log('✅ Call accepted signal received');
      if (stateRef.current.callState !== 'offering') return;
      setCallState('connected');
      toast.success('Call accepted');
    };

    const handleUserJoined = async () => {
      const { callState: curState, localStream: curStream, roomId: curRoom } = stateRef.current;
      console.log('👥 User joined room, current state:', curState);
      if (curState === 'connected' || curState === 'offering') {
        if (!curStream) return;
        console.log('🚀 Creating Offer...');
        const pc = pcRef.current || createPC(curStream);
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        socket.emit('offer', { roomId: curRoom, offer });
      }
    };

    const handleOffer = async ({ offer }) => {
      const { localStream: curStream, roomId: curRoom } = stateRef.current;
      console.log('📡 Received Offer, creating Answer...');
      if (!curStream) return;
      const pc = pcRef.current || createPC(curStream);
      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      socket.emit('answer', { roomId: curRoom, answer });
    };

    const handleAnswer = async ({ answer }) => {
      console.log('📡 Received Answer, setting remote description');
      if (pcRef.current) {
        await pcRef.current.setRemoteDescription(new RTCSessionDescription(answer));
      }
    };

    const handleIce = async ({ candidate }) => {
      console.log('🧊 Received ICE Candidate from peer');
      if (pcRef.current) {
        try { await pcRef.current.addIceCandidate(new RTCIceCandidate(candidate)); } catch (e) {
          console.warn('⚠️ ICE Candidate Error:', e);
        }
      }
    };

    socket.on('call:incoming', handleIncoming);
    socket.on('call:accepted', handleAccepted);
    socket.on('user-joined', handleUserJoined);
    socket.on('call:rejected', () => { toast.error('Call rejected'); cleanup(); });
    socket.on('call:hangup', () => cleanup());
    socket.on('offer', handleOffer);
    socket.on('answer', handleAnswer);
    socket.on('ice-candidate', handleIce);

    return () => {
      socket.off('call:incoming', handleIncoming);
      socket.off('call:accepted', handleAccepted);
      socket.off('user-joined', handleUserJoined);
      socket.off('call:rejected');
      socket.off('call:hangup');
      socket.off('offer', handleOffer);
      socket.off('answer', handleAnswer);
      socket.off('ice-candidate', handleIce);
    };
  }, [socket, createPC, cleanup]);

  const initiateCall = async (targetUser, rId) => {
    console.log('🚀 Initiating call to:', targetUser.name);
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
      
      socket.emit('join-room', { roomId: rId, userId: user.id || user.userId, userName: user.name });

    } catch (err) {
      toast.error('Could not access microphone');
      console.error(err);
    }
  };

  const acceptCall = async () => {
    console.log('✅ Accepting call from:', remoteUser?.name);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      setLocalStream(stream);
      setCallState('connected');
      
      socket.emit('call:accepted', { toUserId: remoteUser.id, roomId });
      socket.emit('join-room', { roomId, userId: user.id || user.userId, userName: user.name });
      
      createPC(stream);

    } catch (err) {
      toast.error('Could not access microphone');
      rejectCall();
    }
  };

  const rejectCall = () => {
    console.log('❌ Rejecting call');
    if (remoteUser && roomId) {
      socket.emit('call:rejected', { toUserId: remoteUser.id, roomId });
    }
    cleanup();
  };

  const hangupCall = () => {
    console.log('📞 Hanging up call');
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
      <audio ref={audioRef} autoPlay playsInline style={{ display: 'none' }} />
    </CallContext.Provider>
  );
}

export const useCall = () => useContext(CallContext);
