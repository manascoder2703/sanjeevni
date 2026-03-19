'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Mic, MicOff, Video, VideoOff, PhoneOff,
  Send, MessageSquare, Monitor, MonitorOff, ShieldCheck
} from 'lucide-react';
import io from 'socket.io-client';
import { useAuth } from '@/context/AuthContext';
import toast from 'react-hot-toast';

// ─── Synced Timer ─────────────────────────────────────────────────────────────
function useSyncedTimer(startTime) {
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    if (!startTime) return;
    const tick = () => setElapsed(Math.max(0, Math.floor((Date.now() - startTime) / 1000)));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [startTime]);
  const m = Math.floor(elapsed / 60);
  const s = elapsed % 60;
  return `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
}

// ─── Control Button ───────────────────────────────────────────────────────────
function CtrlBtn({ icon, onClick, active = true, danger = false, disabled = false, label }) {
  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:'6px' }}>
      <button onClick={onClick} disabled={disabled}
        style={{
          width:'52px', height:'52px', borderRadius:'16px', border:'none',
          display:'flex', alignItems:'center', justifyContent:'center',
          cursor: disabled ? 'not-allowed' : 'pointer', transition:'all 0.15s',
          opacity: disabled ? 0.3 : 1,
          background: danger ? 'rgba(239,68,68,0.15)' : active ? 'rgba(59,130,246,0.15)' : 'rgba(255,255,255,0.06)',
          color: danger ? '#f87171' : active ? '#60a5fa' : 'rgba(255,255,255,0.5)',
          outline: `0.5px solid ${danger ? 'rgba(239,68,68,0.3)' : active ? 'rgba(59,130,246,0.3)' : 'rgba(255,255,255,0.1)'}`,
        }}>
        {icon}
      </button>
      {label && <span style={{ fontSize:'9px', fontWeight:'700', textTransform:'uppercase', letterSpacing:'0.1em', color:'rgba(255,255,255,0.2)' }}>{label}</span>}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function VideoCall() {
  const { roomId } = useParams();
  const { user }   = useAuth();
  const router     = useRouter();

  const [micOn, setMicOn]                 = useState(true);
  const [videoOn, setVideoOn]             = useState(true);
  const [screenSharing, setScreenSharing] = useState(false);
  const [localStream, setLocalStream]     = useState(null);
  const [remoteStream, setRemoteStream]   = useState(null);
  const [messages, setMessages]           = useState([]);
  const [message, setMessage]             = useState('');
  const [showChat, setShowChat]           = useState(true);
  const [startTime, setStartTime]         = useState(null);
  const [remoteUser, setRemoteUser]       = useState('');
  const [connected, setConnected]         = useState(false);

  const socketRef      = useRef();
  const pcRef          = useRef();
  const localVideoRef  = useRef();
  const remoteVideoRef = useRef();
  const chatEndRef     = useRef();
  const localStreamRef = useRef();
  const screenTrackRef = useRef();

  const timer = useSyncedTimer(startTime);

  // Attach streams to video elements
  useEffect(() => {
    if (localVideoRef.current && localStream) localVideoRef.current.srcObject = localStream;
  }, [localStream]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) remoteVideoRef.current.srcObject = remoteStream;
  }, [remoteStream]);

  // Scroll chat
  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior:'smooth' }); }, [messages]);

  // Get camera
  const initCamera = useCallback(async () => {
    try {
      // Stop any existing tracks first
      localStreamRef.current?.getTracks().forEach(t => t.stop());
      
      const s = await navigator.mediaDevices.getUserMedia({ video:true, audio:true });
      localStreamRef.current = s;
      setLocalStream(s);
      return s;
    } catch {
      toast.error('Camera/mic access denied');
      return null;
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(t => t.stop());
      localStreamRef.current = null;
    }
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = null;
    }
    setLocalStream(null);
  }, []);

  // Create WebRTC peer connection
  const createPC = useCallback((stream) => {
    const pc = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
      ],
    });
    pcRef.current = pc;
    stream.getTracks().forEach(track => pc.addTrack(track, stream));

    pc.onicecandidate = (e) => {
      if (e.candidate) socketRef.current?.emit('ice-candidate', { roomId, candidate: e.candidate });
    };

    pc.ontrack = (e) => {
      setRemoteStream(e.streams[0]);
      setConnected(true);
    };

    pc.onconnectionstatechange = () => {
      if (['disconnected','failed','closed'].includes(pc.connectionState)) {
        setConnected(false);
        setRemoteStream(null);
      }
    };

    return pc;
  }, [roomId]);

  // Main socket + WebRTC setup
  useEffect(() => {
    if (!user || !roomId) return;

    // 1. Permission Warm-up: Request early to ensure browser prompt triggers on user gesture
    // (the Link click that led here). Immediately stop tracks to keep it "Privacy First".
    const warmUp = async () => {
      try {
        const s = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        s.getTracks().forEach(t => t.stop());
      } catch (err) {
        console.warn('Initial permission check failed:', err);
      }
    };
    warmUp();

    const socket = io(process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001');
    socketRef.current = socket;

    socket.emit('join-room', { roomId, userId: user.id, userName: user.name });

    socket.on('call-started', ({ startTime: st }) => setStartTime(st));

    socket.on('room-info', ({ remoteUserName }) => {
      if (remoteUserName) setRemoteUser(remoteUserName);
    });

    socket.on('user-joined', async ({ userName }) => {
      setRemoteUser(userName || 'Peer');
      toast.success(`${userName || 'Peer'} joined`);
      const s = await initCamera();
      if (!s) return;
      const pc = createPC(s);
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      socket.emit('offer', { roomId, offer });
    });

    socket.on('offer', async ({ offer }) => {
      const s = await initCamera();
      if (!s) return;
      const pc = createPC(s);
      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      socket.emit('answer', { roomId, answer });
    });

    socket.on('answer', async ({ answer }) => {
      await pcRef.current?.setRemoteDescription(new RTCSessionDescription(answer));
    });

    socket.on('ice-candidate', async ({ candidate }) => {
      try { await pcRef.current?.addIceCandidate(new RTCIceCandidate(candidate)); } catch {}
    });

    socket.on('chat-history', ({ history }) => {
      setMessages((history || []).map(h => h.message || h));
    });

    socket.on('chat-message', ({ message: msg }) => {
      setMessages(prev => prev.find(m => m.mid === msg?.mid) ? prev : [...prev, msg]);
    });

    socket.on('user-left', () => {
      setConnected(false);
      setRemoteStream(null);
      stopCamera(); // Privacy First: Stop camera if peer leaves
      toast.error('Peer disconnected');
    });

    socket.on('user-disconnected', () => {
      setConnected(false);
      setRemoteStream(null);
      stopCamera(); // Privacy First: Stop camera if peer leaves
      toast.error('Peer disconnected');
    });

    const cleanup = () => {
      console.log('UNMOUNTING VIDEO: Performing deep cleanup');
      socket.disconnect();
      pcRef.current?.getSenders().forEach(s => {
        if (s.track) s.track.stop();
      });
      pcRef.current?.close();
      
      // Stop all tracks in the local ref
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(t => t.stop());
        localStreamRef.current = null;
      }
      
      // Stop screen sharing if active
      if (screenTrackRef.current) {
        screenTrackRef.current.stop();
        screenTrackRef.current = null;
      }

      // Explicitly clear video elements
      if (localVideoRef.current) localVideoRef.current.srcObject = null;
      if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
      
      setLocalStream(null);
      setRemoteStream(null);
    };

    window.addEventListener('beforeunload', cleanup);
    return () => {
      window.removeEventListener('beforeunload', cleanup);
      cleanup();
    };
  }, [roomId, user, initCamera, createPC, stopCamera]);

  // Toggle mic
  const toggleMic = () => {
    const track = localStreamRef.current?.getAudioTracks()[0];
    if (track) { track.enabled = !micOn; setMicOn(v => !v); }
  };

  // Toggle camera
  const toggleVideo = () => {
    const track = localStreamRef.current?.getVideoTracks()[0];
    if (track) { track.enabled = !videoOn; setVideoOn(v => !v); }
  };

  // Screen share
  const toggleScreenShare = async () => {
    if (screenSharing) {
      screenTrackRef.current?.stop();
      const cameraTrack = localStreamRef.current?.getVideoTracks()[0];
      if (cameraTrack && pcRef.current) {
        const sender = pcRef.current.getSenders().find(s => s.track?.kind === 'video');
        await sender?.replaceTrack(cameraTrack);
      }
      if (localVideoRef.current && localStreamRef.current) {
        localVideoRef.current.srcObject = localStreamRef.current;
      }
      setScreenSharing(false);
      return;
    }
    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({ video:true, audio:false });
      const screenTrack  = screenStream.getVideoTracks()[0];
      screenTrackRef.current = screenTrack;

      if (pcRef.current) {
        const sender = pcRef.current.getSenders().find(s => s.track?.kind === 'video');
        await sender?.replaceTrack(screenTrack);
      }

      if (localVideoRef.current) {
        const preview = new MediaStream([screenTrack, ...(localStreamRef.current?.getAudioTracks() || [])]);
        localVideoRef.current.srcObject = preview;
      }

      setScreenSharing(true);

      screenTrack.onended = async () => {
        const cameraTrack = localStreamRef.current?.getVideoTracks()[0];
        if (cameraTrack && pcRef.current) {
          const sender = pcRef.current.getSenders().find(s => s.track?.kind === 'video');
          await sender?.replaceTrack(cameraTrack);
        }
        if (localVideoRef.current && localStreamRef.current) {
          localVideoRef.current.srcObject = localStreamRef.current;
        }
        setScreenSharing(false);
      };
    } catch (err) {
      if (err.name !== 'NotAllowedError') toast.error('Screen share failed');
    }
  };

  // Send message
  const sendMessage = () => {
    if (!message.trim()) return;
    const msg = {
      text: message.trim(),
      sender: user.name,
      userId: user.id,
      mid: `${Date.now()}-${Math.random()}`,
      time: new Date().toLocaleTimeString('en-IN', { hour:'2-digit', minute:'2-digit' }),
    };
    socketRef.current?.emit('chat-message', { roomId, message: msg });
    setMessages(prev => [...prev, msg]);
    setMessage('');
  };

  const endCall = () => {
    socketRef.current?.disconnect();
    pcRef.current?.getSenders().forEach(s => {
      if (s.track) s.track.stop();
    });
    pcRef.current?.close();
    
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(t => t.stop());
      localStreamRef.current = null;
    }
    
    if (screenTrackRef.current) {
      screenTrackRef.current.stop();
      screenTrackRef.current = null;
    }

    if (localVideoRef.current) localVideoRef.current.srcObject = null;
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;

    setLocalStream(null);
    setRemoteStream(null);

    router.back();
  };

  const myInitials     = (user?.name || 'ME').split(' ').map(n => n[0]).join('').toUpperCase().slice(0,2);
  const remoteInitials = remoteUser.split(' ').map(n => n[0]).join('').toUpperCase().slice(0,2) || '??';

  return (
    <div style={{ position:'fixed', inset:0, background:'#050608', color:'#fff', display:'flex', fontFamily:'sans-serif', overflow:'hidden' }}>

      {/* ── Video Area ── */}
      <div style={{ flex:1, display:'flex', flexDirection:'column', position:'relative', minWidth:0 }}>

        {/* Top bar */}
        <div style={{ position:'absolute', top:0, left:0, right:0, padding:'20px 28px', display:'flex', alignItems:'center', justifyContent:'space-between', zIndex:10, background:'linear-gradient(to bottom, rgba(5,6,8,0.95), transparent)' }}>
          <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
            <div style={{ width:'34px', height:'34px', borderRadius:'10px', background:'rgba(59,130,246,0.12)', border:'0.5px solid rgba(59,130,246,0.25)', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <ShieldCheck size={15} style={{ color:'#60a5fa' }} />
            </div>
            <div>
              <p style={{ fontSize:'13px', fontWeight:'800', color:'#fff', margin:0, letterSpacing:'-0.3px' }}>
                Sanjeevani <span style={{ color:'#3b82f6' }}>Call</span>
              </p>
              <p style={{ fontSize:'9px', color:'rgba(255,255,255,0.2)', margin:0, textTransform:'uppercase', letterSpacing:'0.15em' }}>End-to-end encrypted</p>
            </div>
          </div>

          <div style={{ display:'flex', alignItems:'center', gap:'12px' }}>
            {/* Synced timer */}
            <div style={{ display:'flex', alignItems:'center', gap:'8px', padding:'6px 16px', borderRadius:'99px', background:'rgba(255,255,255,0.04)', border:'0.5px solid rgba(255,255,255,0.08)' }}>
              <span style={{ width:'7px', height:'7px', borderRadius:'50%', background: startTime ? '#4ade80' : 'rgba(255,255,255,0.2)', display:'inline-block', flexShrink:0 }} />
              <span style={{ fontSize:'13px', fontWeight:'700', fontVariantNumeric:'tabular-nums', color:'#fff' }}>
                {startTime ? timer : '00:00'}
              </span>
            </div>

            {/* Chat toggle */}
            <button onClick={() => setShowChat(v => !v)}
              style={{ width:'38px', height:'38px', borderRadius:'12px', border:'none', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', background: showChat ? 'rgba(59,130,246,0.15)' : 'rgba(255,255,255,0.05)', color: showChat ? '#60a5fa' : 'rgba(255,255,255,0.4)', outline: showChat ? '0.5px solid rgba(59,130,246,0.3)' : '0.5px solid rgba(255,255,255,0.1)' }}>
              <MessageSquare size={16} />
            </button>
          </div>
        </div>

        {/* Remote video (main) */}
        <div style={{ flex:1, position:'relative', background:'#0a0d14', display:'flex', alignItems:'center', justifyContent:'center', overflow:'hidden' }}>
          {remoteStream ? (
            <video ref={remoteVideoRef} autoPlay playsInline style={{ width:'100%', height:'100%', objectFit:'cover' }} />
          ) : (
            <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:'16px', opacity:0.4 }}>
              <div style={{ width:'80px', height:'80px', borderRadius:'50%', background:'rgba(59,130,246,0.15)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'28px', fontWeight:'800', color:'#60a5fa' }}>{remoteInitials}</div>
              <p style={{ fontSize:'14px', fontWeight:'600', color:'rgba(255,255,255,0.5)', margin:0 }}>{remoteUser || 'Waiting for peer...'}</p>
              {!remoteUser && (
                <div style={{ display:'flex', alignItems:'center', gap:'6px' }}>
                  <div style={{ width:'6px', height:'6px', borderRadius:'50%', background:'#fbbf24' }} />
                  <span style={{ fontSize:'11px', color:'rgba(255,255,255,0.3)' }}>Waiting for other participant...</span>
                </div>
              )}
            </div>
          )}

          {/* Remote name label */}
          {remoteStream && remoteUser && (
            <div style={{ position:'absolute', bottom:'80px', left:'16px', background:'rgba(0,0,0,0.6)', borderRadius:'8px', padding:'4px 12px', fontSize:'12px', fontWeight:'600', color:'#fff' }}>
              {remoteUser}
            </div>
          )}

          {/* Local PIP */}
          <div style={{ position:'absolute', bottom:'80px', right:'16px', width:'160px', height:'110px', borderRadius:'14px', overflow:'hidden', border:'1.5px solid rgba(255,255,255,0.15)', background:'#0d1520', zIndex:2 }}>
            {localStream ? (
              <video ref={localVideoRef} autoPlay playsInline muted style={{ width:'100%', height:'100%', objectFit:'cover', transform: screenSharing ? 'none' : 'scaleX(-1)' }} />
            ) : (
              <div style={{ width:'100%', height:'100%', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:'6px' }}>
                <div style={{ width:'36px', height:'36px', borderRadius:'50%', background:'rgba(34,197,94,0.2)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'12px', fontWeight:'700', color:'#4ade80' }}>{myInitials}</div>
              </div>
            )}
            {!videoOn && localStream && (
              <div style={{ position:'absolute', inset:0, background:'#0d1520', display:'flex', alignItems:'center', justifyContent:'center' }}>
                <VideoOff size={20} style={{ color:'rgba(255,255,255,0.2)' }} />
              </div>
            )}
            <div style={{ position:'absolute', bottom:'6px', left:'8px', fontSize:'10px', fontWeight:'700', color:'rgba(255,255,255,0.6)' }}>You</div>
            {screenSharing && (
              <div style={{ position:'absolute', top:'6px', right:'6px', background:'#3b82f6', borderRadius:'4px', padding:'2px 6px', fontSize:'9px', fontWeight:'700', color:'#fff' }}>SCREEN</div>
            )}
          </div>
        </div>

        {/* Controls bar */}
        <div style={{ height:'80px', background:'rgba(255,255,255,0.02)', borderTop:'0.5px solid rgba(255,255,255,0.06)', display:'flex', alignItems:'center', justifyContent:'center', gap:'16px', padding:'0 32px', flexShrink:0 }}>
          <CtrlBtn icon={micOn ? <Mic size={20}/> : <MicOff size={20}/>} onClick={toggleMic} active={micOn} danger={!micOn} label="Mic" disabled={!localStream} />
          <CtrlBtn icon={videoOn ? <Video size={20}/> : <VideoOff size={20}/>} onClick={toggleVideo} active={videoOn} danger={!videoOn} label="Cam" disabled={!localStream} />

          {/* End call */}
          <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:'6px' }}>
            <button onClick={endCall}
              style={{ width:'56px', height:'56px', borderRadius:'50%', background:'#ef4444', border:'none', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', transition:'all 0.15s' }}
              onMouseEnter={e => e.currentTarget.style.background='#dc2626'}
              onMouseLeave={e => e.currentTarget.style.background='#ef4444'}>
              <PhoneOff size={22} style={{ color:'#fff' }} />
            </button>
            <span style={{ fontSize:'9px', fontWeight:'700', textTransform:'uppercase', letterSpacing:'0.1em', color:'rgba(255,255,255,0.2)' }}>End</span>
          </div>

          <CtrlBtn icon={screenSharing ? <MonitorOff size={20}/> : <Monitor size={20}/>} onClick={toggleScreenShare} active={screenSharing} label="Share" disabled={!localStream} />
          <CtrlBtn icon={<MessageSquare size={20}/>} onClick={() => setShowChat(v => !v)} active={showChat} label="Chat" />
        </div>
      </div>

      {/* ── Chat Panel ── */}
      <div style={{
        width: showChat ? '340px' : '0',
        minWidth: showChat ? '340px' : '0',
        overflow:'hidden',
        transition:'all 0.3s ease',
        borderLeft:'0.5px solid rgba(255,255,255,0.07)',
        display:'flex',
        flexDirection:'column',
        background:'rgba(255,255,255,0.01)',
        flexShrink:0,
      }}>

        {/* Chat header */}
        <div style={{ padding:'20px', borderBottom:'0.5px solid rgba(255,255,255,0.07)', display:'flex', alignItems:'center', gap:'10px', flexShrink:0 }}>
          <MessageSquare size={14} style={{ color:'rgba(255,255,255,0.3)' }} />
          <span style={{ fontSize:'13px', fontWeight:'700', color:'rgba(255,255,255,0.7)' }}>Consultation Chat</span>
          <div style={{ marginLeft:'auto', display:'flex', alignItems:'center', gap:'5px' }}>
            <span style={{ width:'6px', height:'6px', borderRadius:'50%', background: connected ? '#4ade80' : 'rgba(255,255,255,0.2)', display:'inline-block' }} />
            <span style={{ fontSize:'10px', color:'rgba(255,255,255,0.25)', fontWeight:'600' }}>{connected ? '2 online' : '1 online'}</span>
          </div>
        </div>

        {/* Messages */}
        <div style={{ flex:1, overflowY:'auto', padding:'16px', display:'flex', flexDirection:'column', gap:'12px' }}>
          {messages.length === 0 && (
            <div style={{ textAlign:'center', padding:'40px 0', color:'rgba(255,255,255,0.15)', fontSize:'12px', fontWeight:'600' }}>
              No messages yet
            </div>
          )}
          {messages.map((msg, i) => {
            const isMe = msg.userId === user?.id;
            return (
              <div key={msg.mid || i} style={{ display:'flex', flexDirection:'column', alignItems: isMe ? 'flex-end' : 'flex-start', gap:'3px' }}>
                <span style={{ fontSize:'10px', fontWeight:'600', color:'rgba(255,255,255,0.2)', paddingLeft:'4px', paddingRight:'4px' }}>{msg.sender}</span>
                <div style={{
                  maxWidth:'85%', padding:'9px 13px', fontSize:'13px', lineHeight:1.5, fontWeight:'500',
                  borderRadius: isMe ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
                  background: isMe ? '#3b82f6' : 'rgba(255,255,255,0.06)',
                  color: isMe ? '#fff' : 'rgba(255,255,255,0.85)',
                  border: isMe ? 'none' : '0.5px solid rgba(255,255,255,0.08)',
                }}>
                  {msg.text}
                </div>
                {msg.time && <span style={{ fontSize:'10px', color:'rgba(255,255,255,0.2)', paddingLeft:'4px', paddingRight:'4px' }}>{msg.time}</span>}
              </div>
            );
          })}
          <div ref={chatEndRef} />
        </div>

        {/* Input */}
        <div style={{ padding:'14px 16px', borderTop:'0.5px solid rgba(255,255,255,0.07)', display:'flex', gap:'8px', alignItems:'center', flexShrink:0 }}>
          <input
            value={message}
            onChange={e => setMessage(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && sendMessage()}
            placeholder="Type a message..."
            style={{ flex:1, background:'rgba(255,255,255,0.04)', border:'0.5px solid rgba(255,255,255,0.08)', borderRadius:'10px', padding:'10px 14px', fontSize:'13px', color:'#fff', outline:'none' }}
            onFocus={e => e.target.style.borderColor='rgba(59,130,246,0.4)'}
            onBlur={e => e.target.style.borderColor='rgba(255,255,255,0.08)'}
          />
          <button onClick={sendMessage}
            style={{ width:'36px', height:'36px', borderRadius:'10px', background:'#3b82f6', border:'none', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, transition:'all 0.15s' }}
            onMouseEnter={e => e.currentTarget.style.background='#2563eb'}
            onMouseLeave={e => e.currentTarget.style.background='#3b82f6'}>
            <Send size={14} style={{ color:'#fff' }} />
          </button>
        </div>
      </div>
    </div>
  );
}