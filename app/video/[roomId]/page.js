'use client';
import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  Mic, 
  MicOff, 
  Video, 
  VideoOff, 
  PhoneOff, 
  Send, 
  MessageSquare, 
  Users, 
  Clock, 
  Maximize, 
  Settings,
  ShieldCheck,
  Activity
} from 'lucide-react';
import io from 'socket.io-client';
import { useAuth } from '@/context/AuthContext';
import toast from 'react-hot-toast';

export default function VideoCall() {
  const { roomId } = useParams();
  const { user } = useAuth();
  const router = useRouter();
  const [micOn, setMicOn] = useState(true);
  const [videoOn, setVideoOn] = useState(true);
  const [stream, setStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState('');
  const [timer, setTimer] = useState(0);
  const [showChat, setShowChat] = useState(true);

  const socketRef = useRef();
  const pcRef = useRef();
  const localVideoRef = useRef();
  const remoteVideoRef = useRef();
  const chatEndRef = useRef();

  useEffect(() => {
    if (!user) return;
    
    const socket = io(process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001');
    socketRef.current = socket;

    const init = async () => {
      try {
        const s = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        setStream(s);
        if (localVideoRef.current) localVideoRef.current.srcObject = s;

        socket.emit('join-room', { roomId, userId: user.id });

        socket.on('user-joined', async ({ userId }) => {
          toast.success('Patient connected');
          const pc = createPeerConnection(userId);
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          socket.emit('offer', { offer, to: userId, roomId });
        });

        socket.on('offer', async ({ offer, from }) => {
          const pc = createPeerConnection(from);
          await pc.setRemoteDescription(new RTCSessionDescription(offer));
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          socket.emit('answer', { answer, to: from, roomId });
        });

        socket.on('answer', async ({ answer }) => {
          await pcRef.current.setRemoteDescription(new RTCSessionDescription(answer));
        });

        socket.on('ice-candidate', async ({ candidate }) => {
          if (pcRef.current) await pcRef.current.addIceCandidate(new RTCIceCandidate(candidate));
        });

        socket.on('chat-message', (msg) => {
          setMessages(prev => {
            if (prev.find(m => m.mid === msg.mid)) return prev;
            return [...prev, msg];
          });
        });

        socket.on('user-disconnected', () => {
          setRemoteStream(null);
          toast.error('Connection severed');
        });
      } catch (err) {
        toast.error('Media access denied');
      }
    };

    init();

    const interval = setInterval(() => setTimer(prev => prev + 1), 1000);
    return () => {
      socket.disconnect();
      if (pcRef.current) pcRef.current.close();
      if (stream) stream.getTracks().forEach(t => t.stop());
      clearInterval(interval);
    };
  }, [roomId, user]);

  const createPeerConnection = (userId) => {
    const pc = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
    });
    pcRef.current = pc;

    stream.getTracks().forEach(track => pc.addTrack(track, stream));

    pc.onicecandidate = (e) => {
      if (e.candidate) {
        socketRef.current.emit('ice-candidate', { candidate: e.candidate, to: userId, roomId });
      }
    };

    pc.ontrack = (e) => setRemoteStream(e.streams[0]);
    return pc;
  };

  const toggleMic = () => {
    stream.getAudioTracks()[0].enabled = !micOn;
    setMicOn(!micOn);
  };

  const toggleVideo = () => {
    stream.getVideoTracks()[0].enabled = !videoOn;
    setVideoOn(!videoOn);
  };

  const sendMessage = () => {
    if (!message.trim()) return;
    const msg = { text: message, sender: user.name, userId: user.id, mid: Date.now() + Math.random().toString() };
    socketRef.current.emit('chat-message', { roomId, message: msg });
    setMessages(prev => [...prev, msg]);
    setMessage('');
  };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const formatTime = (s) => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 bg-[#020617] text-white flex overflow-hidden font-sans">
      {/* Background Ambience */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
         <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-500/10 blur-[120px] rounded-full"></div>
         <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-cyan-500/10 blur-[120px] rounded-full"></div>
      </div>

      {/* Main Video Stage */}
      <div className={`flex-1 flex flex-col relative transition-all duration-500 ${showChat ? 'md:mr-[400px]' : ''}`}>
        {/* Top Header */}
        <div className="absolute top-0 left-0 w-full p-8 flex items-center justify-between z-20 bg-gradient-to-b from-[#020617] to-transparent">
           <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-500/10 rounded-2xl border border-blue-500/20 text-blue-400">
                <ShieldCheck size={24} />
              </div>
              <div className="flex flex-col">
                 <h2 className="text-xl font-black tracking-tight uppercase">Sanjeevani Nexus <span className="text-blue-500">Call</span></h2>
                 <p className="text-white/30 text-[10px] font-bold tracking-[0.3em] uppercase">End-to-End Encrypted</p>
              </div>
           </div>
           
           <div className="flex items-center gap-6">
              <div className="flex items-center gap-3 px-5 py-2.5 bg-white/[0.03] border border-white/5 rounded-2xl backdrop-blur-xl">
                 <div className="size-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]"></div>
                 <span className="text-sm font-black tabular-nums tracking-widest">{formatTime(timer)}</span>
              </div>
              <button onClick={() => setShowChat(!showChat)} className={`p-4 rounded-2xl transition-all ${showChat ? 'bg-blue-500 text-white shadow-xl shadow-blue-500/30' : 'bg-white/5 text-white/40 border border-white/5 hover:bg-white/10'}`}>
                 <MessageSquare size={20} />
              </button>
           </div>
        </div>

        {/* Video Canvas */}
        <div className="flex-1 p-8 pt-32 pb-32 flex items-center justify-center gap-8 relative overflow-hidden">
          <div className="relative w-full h-full max-w-6xl rounded-[40px] overflow-hidden border border-white/5 shadow-2xl bg-slate-900/50 backdrop-blur-3xl group">
             {/* Remote Video */}
             {remoteStream ? (
               <video ref={remoteVideoRef} autoPlay playsInline className="w-full h-full object-cover" srcObject={remoteStream} />
             ) : (
               <div className="w-full h-full flex flex-col items-center justify-center gap-8 opacity-20">
                  <div className="relative">
                    <div className="size-40 border-2 border-blue-500/20 rounded-full"></div>
                    <div className="absolute top-0 left-0 size-40 border-t-2 border-blue-500 rounded-full animate-spin"></div>
                    <Users size={64} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white" />
                  </div>
                  <p className="text-xl font-black tracking-[0.4em] uppercase">Awaiting Peer Connection</p>
               </div>
             )}

             {/* Local Video PIP */}
             <div className="absolute bottom-8 right-8 w-60 aspect-video rounded-3xl overflow-hidden border-2 border-white/10 shadow-2xl z-10 transition-transform hover:scale-105">
                <video ref={localVideoRef} autoPlay playsInline muted className="w-full h-full object-cover bg-black" srcObject={stream} />
                {!videoOn && (
                  <div className="absolute inset-0 bg-slate-900 flex items-center justify-center">
                    <VideoOff size={24} className="text-white/20" />
                  </div>
                )}
             </div>

             {/* UI Overlays */}
             <div className="absolute bottom-8 left-8 flex items-center gap-4 z-10">
                <div className="flex items-center gap-3 px-4 py-2 bg-black/40 backdrop-blur-xl border border-white/5 rounded-2xl">
                   <Activity size={14} className="text-cyan-400" />
                   <span className="text-[10px] font-black tracking-widest uppercase">Network Optimized</span>
                </div>
             </div>
          </div>
        </div>

        {/* Console Controls */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-8 p-3 px-10 bg-[#0f172a]/60 backdrop-blur-3xl border border-white/5 rounded-[32px] shadow-2xl z-30 group">
           <ControlBtn 
             icon={micOn ? <Mic size={24}/> : <MicOff size={24}/>} 
             onClick={toggleMic} 
             active={micOn} 
             danger={!micOn}
             label="Mic"
           />
           <ControlBtn 
             icon={videoOn ? <Video size={24}/> : <VideoOff size={24}/>} 
             onClick={toggleVideo} 
             active={videoOn} 
             danger={!videoOn}
             label="Video"
           />
           <button 
             onClick={() => router.back()} 
             className="size-16 bg-red-500 hover:bg-red-600 active:scale-90 text-white rounded-2xl flex items-center justify-center shadow-xl shadow-red-500/30 transition-all group/end relative"
           >
              <PhoneOff size={32} />
              <span className="absolute -top-12 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] font-black uppercase px-3 py-1 rounded-lg opacity-0 group-hover/end:opacity-100 transition-opacity">Disconnect</span>
           </button>
           <ControlBtn icon={<Settings size={22}/>} label="Settings" />
           <ControlBtn icon={<Maximize size={22}/>} label="Full" />
        </div>
      </div>

      {/* Neural Chat Panel */}
      <aside className={`fixed top-0 right-0 h-full w-full md:w-[400px] bg-[#020617]/80 backdrop-blur-3xl border-l border-white/5 flex flex-col transform transition-transform duration-500 z-40 ${showChat ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="p-8 border-b border-white/5 flex items-center justify-between">
           <div className="flex items-center gap-4">
              <div className="p-2.5 bg-blue-500/10 rounded-xl text-blue-400">
                <MessageSquare size={18} />
              </div>
              <h3 className="text-sm font-black uppercase tracking-[0.2em]">Neural Chat</h3>
           </div>
           <button onClick={() => setShowChat(false)} className="p-2 hover:bg-white/5 rounded-lg text-white/20 transition-colors">
              <Maximize size={18} className="rotate-45" />
           </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6 no-scrollbar">
          {messages.map((msg, i) => (
            <div key={msg.mid || i} className={`flex flex-col ${msg.userId === user.id ? 'items-end' : 'items-start'}`}>
              <span className="text-[9px] font-black text-white/20 uppercase tracking-widest mb-1.5 px-2">{msg.sender}</span>
              <div className={`
                max-w-[85%] px-5 py-3.5 rounded-2xl text-[13px] font-medium leading-relaxed
                ${msg.userId === user.id 
                  ? 'bg-blue-600 text-white rounded-tr-none shadow-lg shadow-blue-500/10' 
                  : 'bg-white/[0.03] border border-white/5 text-white/80 rounded-tl-none'}
              `}>
                {msg.text}
              </div>
            </div>
          ))}
          <div ref={chatEndRef} />
        </div>

        <div className="p-8 bg-gradient-to-t from-[#020617] to-transparent">
          <div className="relative group">
            <input 
              type="text" 
              placeholder="Inject message..." 
              className="w-full bg-white/[0.03] border border-white/10 rounded-2xl py-4 pl-6 pr-14 text-sm font-medium focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/30 outline-none transition-all placeholder:text-white/10"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
            />
            <button 
              onClick={sendMessage}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-2.5 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-all shadow-lg shadow-blue-500/20 active:scale-95"
            >
              <Send size={16} />
            </button>
          </div>
        </div>
      </aside>
    </div>
  );
}

function ControlBtn({ icon, onClick, active, danger, label }) {
  return (
    <div className="flex flex-col items-center gap-2 group/ctrl">
      <button 
        onClick={onClick}
        className={`
          size-14 rounded-2xl flex items-center justify-center transition-all active:scale-90 relative
          ${danger 
            ? 'bg-red-500/10 text-red-500 border border-red-500/20 shadow-lg shadow-red-500/5' 
            : active 
              ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' 
              : 'bg-white/5 text-white/30 border border-white/5 hover:text-white hover:bg-white/10'}
        `}
      >
        {icon}
        {danger && <div className="absolute top-0 right-0 size-3 bg-red-500 rounded-full border-2 border-[#0f172a] animate-pulse"></div>}
      </button>
      <span className="text-[9px] font-black uppercase tracking-widest text-white/20 group-hover/ctrl:text-white/40 transition-colors">{label}</span>
    </div>
  )
}
