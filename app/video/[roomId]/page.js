'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Mic, MicOff, Video, VideoOff, PhoneOff, MessageCircle, Send } from 'lucide-react';
import { io } from 'socket.io-client';
import toast from 'react-hot-toast';

export default function VideoCallPage() {
  const { roomId } = useParams();
  const { user } = useAuth();
  const router = useRouter();

  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(true);
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState('');
  const [connected, setConnected] = useState(false);
  const [callTime, setCallTime] = useState(0);

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const socketRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const localStreamRef = useRef(null);
  const timerRef = useRef(null);

  const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001';

  const [isStreamReady, setIsStreamReady] = useState(false);
  const signalQueue = useRef([]);
  const processedMidsRef = useRef(new Set());

  const createPeerConnection = useCallback(() => {
    console.log('Creating PeerConnection...');
    const pc = new RTCPeerConnection({ 
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }, { urls: 'stun:stun1.l.google.com:19302' }] 
    });
    
    localStreamRef.current?.getTracks().forEach(track => {
      pc.addTrack(track, localStreamRef.current);
    });

    pc.ontrack = (event) => {
      console.log('Received remote track');
      if (remoteVideoRef.current) remoteVideoRef.current.srcObject = event.streams[0];
      setConnected(true);
    };

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socketRef.current?.emit('ice-candidate', { roomId, candidate: event.candidate });
      }
    };

    pc.onsignalingstatechange = () => {
      console.log('Signaling State:', pc.signalingState);
    };

    peerConnectionRef.current = pc;
    return pc;
  }, [roomId]);

  const createOffer = useCallback(async () => {
    if (peerConnectionRef.current?.signalingState !== 'stable') return;
    console.log('Creating Offer...');
    const pc = createPeerConnection();
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    socketRef.current?.emit('offer', { roomId, offer });
  }, [roomId, createPeerConnection]);

  const createAnswer = useCallback(async (offer) => {
    console.log('Creating Answer...');
    const pc = createPeerConnection();
    await pc.setRemoteDescription(new RTCSessionDescription(offer));
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);
    socketRef.current?.emit('answer', { roomId, answer });
  }, [roomId, createPeerConnection]);

  const processSignalQueue = useCallback(async () => {
    while (signalQueue.current.length > 0) {
      const { type, data } = signalQueue.current.shift();
      if (type === 'offer') await createAnswer(data);
      if (type === 'answer') {
        const pc = peerConnectionRef.current;
        if (pc && pc.signalingState === 'have-local-offer') {
          await pc.setRemoteDescription(new RTCSessionDescription(data));
        }
      }
      if (type === 'candidate') {
        const pc = peerConnectionRef.current;
        if (pc && data) await pc.addIceCandidate(new RTCIceCandidate(data));
      }
    }
  }, [createAnswer]);

  useEffect(() => {
    if (isStreamReady) processSignalQueue();
  }, [isStreamReady, processSignalQueue]);

  const isConnectingRef = useRef(false);

  const cleanup = useCallback(() => {
    console.log('Cleaning up resources...');
    isConnectingRef.current = false;
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
      localStreamRef.current = null;
    }
    if (localVideoRef.current) localVideoRef.current.srcObject = null;
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
    
    setConnected(false);
    setIsStreamReady(false);
    setRemoteUserName('');
    setMessages([]); // Clear chat history to avoid duplication on rejoin
    setCallTime(0);
    signalQueue.current = [];
  }, []);

  const [remoteUserName, setRemoteUserName] = useState('');

  const userRef = useRef(user);
  useEffect(() => { userRef.current = user; }, [user]);

  const startCall = useCallback(async () => {
    if (socketRef.current || isConnectingRef.current) return;
    isConnectingRef.current = true;

    try {
      console.log('Initializing media...');
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      localStreamRef.current = stream;
      if (localVideoRef.current) localVideoRef.current.srcObject = stream;
      setIsStreamReady(true);

      console.log('Connecting to socket...');
      const socket = io(SOCKET_URL, { 
        transports: ['websocket'],
        forceNew: true, // Ensure fresh connection on every rejoin
        multiplex: false // Prevent instance sharing
      });
      socketRef.current = socket;
      
      const currentUser = userRef.current;
      const myDisplayName = currentUser?.role === 'doctor' ? `Dr. ${currentUser.name}` : currentUser?.name;

      socket.on('connect', () => {
        console.log('Connected to signaling server with ID:', socket.id);
        socket.emit('join-room', { 
          roomId, 
          userId: currentUser?.id, 
          userName: myDisplayName 
        });
      });

      socket.on('user-joined', async ({ userName }) => {
        console.log('Other user joined:', userName);
        setConnected(true);
        setRemoteUserName(userName);
        toast.success(`${userName || 'The other participant'} joined!`);
        // We no longer call createOffer here. 
        // We wait for the room-info recipient (newcomer) to initiate.
      });

      socket.on('room-info', async ({ remoteUserName: name }) => {
        console.log('Received room info:', name);
        setRemoteUserName(name);
        setConnected(true);
        // The person who just joined (receiving room-info) should initiate the offer
        // to simplify the flow and ensure tracks are ready.
        await createOffer();
      });

      socket.on('offer', async ({ offer }) => {
        setConnected(true);
        signalQueue.current.push({ type: 'offer', data: offer });
        await processSignalQueue(); 
      });

      socket.on('answer', async ({ answer }) => {
        setConnected(true);
        signalQueue.current.push({ type: 'answer', data: answer });
        await processSignalQueue();
      });

      socket.on('ice-candidate', async ({ candidate }) => {
        signalQueue.current.push({ type: 'candidate', data: candidate });
        await processSignalQueue();
      });

      socket.on('chat-history', ({ history }) => {
        console.log('Syncing chat history:', history.length, 'messages');
        const currentUserId = userRef.current?.id;
        const mappedHistory = history.map(msg => {
          if (msg.mid) processedMidsRef.current.add(msg.mid); 
          return {
            ...msg,
            self: String(msg.senderId) === String(currentUserId)
          };
        });
        setMessages(mappedHistory);
      });

      socket.on('call-started', ({ startTime }) => {
        console.log('Call synchronized at:', new Date(startTime).toLocaleTimeString());
        const updateTimer = () => {
          const elapsed = Math.floor((Date.now() - startTime) / 1000);
          setCallTime(Math.max(0, elapsed));
        };
        updateTimer();
        if (timerRef.current) clearInterval(timerRef.current);
        timerRef.current = setInterval(updateTimer, 1000);
      });

      socket.on('chat-message', (msg) => {
        console.log('Received chat message:', msg);
        
        // DEDUPLICATION BY MESSAGE ID (MID)
        if (msg.mid && processedMidsRef.current.has(msg.mid)) {
          console.log('Discarding duplicate message with MID:', msg.mid);
          return;
        }
        if (msg.mid) processedMidsRef.current.add(msg.mid); // Add new message MID to the set

        const currentUserId = userRef.current?.id;
        const isFromMe = String(msg.senderId) === String(currentUserId);

        if (msg.senderName && !remoteUserName) {
          setRemoteUserName(msg.senderName);
        }
        
        setMessages(prev => [...prev, { ...msg, self: isFromMe }]);
      });

      socket.on('user-left', () => {
        toast(`${remoteUserName || 'The other participant'} left the call.`, { icon: '👋' });
        setConnected(false);
        setRemoteUserName('');
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
        if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
        if (peerConnectionRef.current) {
          peerConnectionRef.current.close();
          peerConnectionRef.current = null;
        }
      });

    } catch (err) {
      console.error('Call initialization error:', err);
      toast.error('Could not access camera/microphone: ' + err.message);
    }
  }, [roomId, SOCKET_URL, createOffer, processSignalQueue]);

  useEffect(() => {
    if (!user && !localStorage.getItem('sanjeevni_user')) {
      router.push('/login');
      return;
    }

    if (user && !socketRef.current && !isConnectingRef.current) {
      startCall();
    }
  }, [user, router, startCall]);

  useEffect(() => {
    return () => {
      cleanup();
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [cleanup]);


  const endCall = () => { cleanup(); router.back(); };

  const toggleMute = () => {
    const track = localStreamRef.current?.getAudioTracks()[0];
    if (track) { track.enabled = !track.enabled; setIsMuted(!track.enabled); }
  };

  const toggleVideo = () => {
    const track = localStreamRef.current?.getVideoTracks()[0];
    if (track) { track.enabled = !track.enabled; setIsVideoOff(!track.enabled); }
  };

  const sendMessage = () => {
    const currentUser = userRef.current;
    if (!message.trim() || !currentUser) return;
    
    const mid = `${currentUser.id}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const msg = { 
      mid,
      senderId: currentUser.id,
      senderName: currentUser.role === 'doctor' ? `Dr. ${currentUser.name}` : currentUser.name, 
      text: message, 
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    
    processedMidsRef.current.add(mid);
    socketRef.current?.emit('chat-message', { roomId, ...msg });
    setMessages(prev => [...prev, { ...msg, self: true }]);
    setMessage('');
  };

  const formatTime = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  return (
    <div style={{ minHeight: '100vh', background: '#0a0f1e', display: 'flex', flexDirection: 'column' }}>
      {/* Top bar */}
      <div style={{ background: 'rgba(15,23,42,0.9)', borderBottom: '1px solid var(--border)', padding: '12px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ background: 'linear-gradient(135deg,#0ea5e9,#06b6d4)', padding: 6, borderRadius: 8 }}>
            <Video size={16} color="white" />
          </div>
          <div>
            <p style={{ fontWeight: 700 }}>
              {connected ? `Call with ${remoteUserName}` : 'Sanjeevni Consultation'}
            </p>
            <p style={{ color: 'var(--text-muted)', fontSize: 12 }}>Room: {roomId?.substring(0, 8).toUpperCase()}</p>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          {connected && <span style={{ fontSize: 13, color: '#10b981', fontWeight: 500, marginRight: 8 }}>Signal Stable</span>}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 20, padding: '4px 12px' }}>
            <div style={{ width: 6, height: 6, background: '#10b981', borderRadius: '50%', animation: 'pulse-glow 2s infinite' }} />
            <span style={{ fontSize: 12, color: '#10b981', fontWeight: 500 }}>{formatTime(callTime)}</span>
          </div>
        </div>
      </div>

      {/* Main area */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Video area */}
        <div style={{ flex: 1, position: 'relative', background: '#060b14' }}>
          {/* Remote video */}
          <video ref={remoteVideoRef} autoPlay playsInline style={{ width: '100%', height: '100%', objectFit: 'cover', display: connected ? 'block' : 'none' }} />
          {!connected && (
            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
              <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'rgba(14,165,233,0.1)', border: '2px solid rgba(14,165,233,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16, fontSize: 32 }}>
                {user?.role === 'doctor' ? '🩹' : '👨‍⚕️'}
              </div>
              <p style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 8 }}>
                {user?.role === 'doctor' ? 'Waiting for the Patient...' : 'Waiting for the Doctor...'}
              </p>
              <p style={{ fontSize: 13 }}>Connection will start automatically when they join</p>
            </div>
          )}

          {/* Local video PiP */}
          <div style={{ position: 'absolute', bottom: 24, right: 24, width: 180, height: 120, borderRadius: 12, overflow: 'hidden', border: '2px solid rgba(14,165,233,0.4)', boxShadow: '0 8px 24px rgba(0,0,0,0.5)', background: '#0a0f1e' }}>
            <video ref={localVideoRef} autoPlay playsInline muted style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }} />
            <div style={{ position: 'absolute', bottom: 4, left: 8, fontSize: 10, color: 'white', background: 'rgba(0,0,0,0.5)', padding: '2px 6px', borderRadius: 4 }}>You</div>
          </div>

          {/* Controls */}
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '24px', display: 'flex', justifyContent: 'center', gap: 16, background: 'linear-gradient(to top, rgba(6,11,20,0.9), transparent)' }}>
            <ControlBtn onClick={toggleMute} active={isMuted} icon={isMuted ? <MicOff size={20} /> : <Mic size={20} />} label={isMuted ? 'Unmute' : 'Mute'} />
            <ControlBtn onClick={toggleVideo} active={isVideoOff} icon={isVideoOff ? <VideoOff size={20} /> : <Video size={20} />} label={isVideoOff ? 'Show Video' : 'Hide Video'} />
            <button onClick={endCall} style={{ width: 56, height: 56, borderRadius: '50%', background: '#ef4444', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', boxShadow: '0 4px 16px rgba(239,68,68,0.5)', transition: 'transform 0.2s' }}
              onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.1)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
              title="End Call">
              <PhoneOff size={22} />
            </button>
            <ControlBtn onClick={() => setIsChatOpen(!isChatOpen)} icon={<MessageCircle size={20} />} label="Chat" />
          </div>
        </div>

        {/* Chat panel */}
        {isChatOpen && (
          <div style={{ width: 320, background: 'rgba(15,23,42,0.95)', borderLeft: '1px solid var(--border)', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', fontWeight: 600 }}>Live Chat</div>
            <div style={{ flex: 1, overflowY: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
              {messages.length === 0 && <p style={{ color: 'var(--text-muted)', fontSize: 13, textAlign: 'center', marginTop: 40 }}>No messages yet. Say hello! 👋</p>}
              {messages.map((m, i) => (
                <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: m.self ? 'flex-end' : 'flex-start' }}>
                  <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 3 }}>
                    {m.self ? 'You' : (m.senderName || 'Participant')} · {m.time}
                  </p>
                  <div style={{ 
                    background: m.self ? 'linear-gradient(135deg,#0ea5e9,#06b6d4)' : 'rgba(30,41,59,0.8)', 
                    padding: '10px 14px', 
                    borderRadius: m.self ? '14px 14px 4px 14px' : '14px 14px 14px 4px', 
                    maxWidth: '85%', 
                    fontSize: 14, 
                    lineHeight: 1.4,
                    color: 'white',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                  }}>
                    {m.text}
                  </div>
                </div>
              ))}
            </div>
            <div style={{ padding: 16, borderTop: '1px solid var(--border)', display: 'flex', gap: 8 }}>
              <input
                className="input" value={message} onChange={e => setMessage(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && sendMessage()}
                placeholder="Type a message..." style={{ flex: 1, borderRadius: 10 }}
              />
              <button className="btn-primary" onClick={sendMessage} style={{ padding: '10px 14px', borderRadius: 10 }}><Send size={16} /></button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ControlBtn({ onClick, icon, label, active }) {
  return (
    <button onClick={onClick} title={label} style={{
      width: 52, height: 52, borderRadius: '50%', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: active ? '#0f172a' : 'white', transition: 'all 0.2s',
      background: active ? 'white' : 'rgba(255,255,255,0.15)',
    }}
      onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.1)'}
      onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}>
      {icon}
    </button>
  );
}
