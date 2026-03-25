'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Sparkles, Plus, Mic, Activity } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAgent } from '@/context/AgentContext';
import Orb from '../ui/Orb';

export default function AIAgentWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const { isAgentVisible, hideAgent } = useAgent();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [bookingContext, setBookingContext] = useState(null);
  const [executing, setExecuting] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0); 
  
  const scrollRef = useRef(null);
  const recognitionRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const animationFrameRef = useRef(null);
  const streamRef = useRef(null);

  // Initialize Speech Recognition logic once
  useEffect(() => {
    if (typeof window !== 'undefined' && (window.SpeechRecognition || window.webkitSpeechRecognition)) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.continuous = false; 
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setInput(prev => (prev ? `${prev} ${transcript}` : transcript));
        toast.success("Speech captured!", { duration: 1000 });
      };

      recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        stopAudioAnalysis();
        setIsListening(false);
      };

      recognition.onend = () => {
        stopAudioAnalysis();
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }
    return () => stopAudioAnalysis();
  }, []);

  const stopAudioAnalysis = () => {
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    if (audioContextRef.current) audioContextRef.current.close();
    if (streamRef.current) streamRef.current.getTracks().forEach(track => track.stop());
    setAudioLevel(0);
  };

  const startAudioAnalysis = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      const audioContext = new AudioContext();
      audioContextRef.current = audioContext;
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      analyserRef.current = analyser;
      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);
      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      const updateLevel = () => {
        analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) sum += dataArray[i];
        const average = sum / dataArray.length;
        const level = Math.min(1, average / 64); 
        setAudioLevel(level);
        animationFrameRef.current = requestAnimationFrame(updateLevel);
      };
      updateLevel();
    } catch (err) { console.error("Audio analysis failed:", err); }
  };

  const toggleListening = () => {
    if (!recognitionRef.current) {
      toast.error("Speech input is not supported in this browser. Please use Google Chrome.");
      return;
    }
    if (isListening) {
      recognitionRef.current.stop();
      stopAudioAnalysis();
      setIsListening(false);
    } else {
      try {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        const fresh = new SpeechRecognition();
        fresh.continuous = false;
        fresh.interimResults = false;
        fresh.lang = 'en-US';
        fresh.onresult = (event) => {
          const transcript = event.results[0][0].transcript;
          setInput(prev => {
            if (prev.endsWith(transcript)) return prev;
            return prev ? `${prev} ${transcript}` : transcript;
          });
        };
        fresh.onerror = (event) => { console.error('Speech error:', event.error); stopAudioAnalysis(); setIsListening(false); };
        fresh.onend = () => { stopAudioAnalysis(); setIsListening(false); };
        fresh.start();
        startAudioAnalysis();
        setIsListening(true);
        toast.success("Ready to speak...", { duration: 2000 });
      } catch (err) { console.error("Critical Mic failure:", err); setIsListening(false); }
    }
  };

  const confirmBooking = async (details) => {
    if (executing) return;
    const missing = [];
    if (!details.doctorName && !details.doctorId) missing.push('Doctor');
    if (!details.date) missing.push('Date');
    if (!details.timeSlot) missing.push('Time Slot');
    if (missing.length > 0) { toast.error(`Missing info: ${missing.join(', ')}`); return; }
    setExecuting(true);
    const tId = toast.loading("Processing...");
    try {
      let doctorId = details.doctorId;
      if (!doctorId && details.doctorName) {
        const cleanName = details.doctorName.replace(/^(dr\.?|doctor|mr\.?|ms\.?|mrs\.?)\s+/i, '').trim();
        const searchRes = await fetch(`/api/doctors?search=${encodeURIComponent(cleanName)}`);
        const { doctors } = await searchRes.json();
        if (doctors && doctors.length > 0) doctorId = doctors[0]._id;
      }
      if (!doctorId) throw new Error("Doctor record not found");
      const bookRes = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ doctorId, date: details.date, timeSlot: details.timeSlot })
      });
      if (!bookRes.ok) throw new Error("Booking failed");
      toast.success("Confirmed!", { id: tId });
      setMessages(prev => [...prev, { id: Date.now(), role: 'assistant', content: `Confirmed: Dr. ${details.doctorName} on ${details.date} at ${details.timeSlot}.` }]);
      setBookingContext(null);
    } catch (err) { toast.error(err.message, { id: tId }); } finally { setExecuting(false); }
  };

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, loading, isOpen]);

  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : 'unset';
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

  const mergeBookingParams = (current, newParams) => {
    const updated = { ...(current || {}) };
    if (newParams?.doctorName) updated.doctorName = newParams.doctorName;
    if (newParams?.doctorId) updated.doctorId = newParams.doctorId;
    if (newParams?.date) updated.date = newParams.date;
    if (newParams?.timeSlot || newParams?.time) updated.timeSlot = newParams.timeSlot || newParams.time;
    return updated;
  };

  const handleSend = async (e) => {
    e?.preventDefault();
    if (isListening) { if (recognitionRef.current) recognitionRef.current.stop(); stopAudioAnalysis(); setIsListening(false); }
    const text = input.trim();
    if (!text || loading) return;
    if (!isOpen) setIsOpen(true);
    setMessages(prev => [...prev, { id: Date.now(), role: 'user', content: text }]);
    setInput('');
    setLoading(true);
    try {
      const parseRes = await fetch('/api/ai/agent/parse', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message: text }) });
      const parsedData = await parseRes.json();
      if (parsedData.error) throw new Error(parsedData.error);
      let replyContent = '';
      let actionData = null;
      switch (parsedData.intent) {
        case 'BOOK_DOCTOR':
          const ub = mergeBookingParams(bookingContext, parsedData.params);
          setBookingContext(ub);
          if (!ub.doctorName || !ub.date || !ub.timeSlot) replyContent = `Need ${!ub.doctorName ? 'doctor name,' : ''} ${!ub.date ? 'date,' : ''} ${!ub.timeSlot ? 'and time' : ''}.`;
          else { replyContent = `Drafted appointment for ${ub.doctorName} on ${ub.date} at ${ub.timeSlot}.`; actionData = { type: 'ACTION', label: 'Confirm Booking', payload: ub }; }
          break;
        case 'SEARCH_DOCTORS':
          replyContent = `Searching...`;
          const dr = await fetch(`/api/doctors?specialization=${parsedData.params?.specialty || 'All'}`);
          const { doctors } = await dr.json();
          if (doctors?.length > 0) { replyContent = `Specialists found:`; actionData = { type: 'DOCTOR_LIST', data: doctors.slice(0, 3) }; }
          else replyContent = `No specialists found.`;
          break;
        default: replyContent = "I'm your assistant. How can I help you today?";
      }
      setMessages(prev => [...prev, { id: Date.now() + 1, role: 'assistant', content: replyContent, action: actionData }]);
    } catch (err) { toast.error("Process failed"); } finally { setLoading(false); }
  };

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black z-[150] flex flex-col font-sans h-screen w-screen overflow-hidden"
          >
            {/* DYNAMIC ORB BACKGROUND */}
            <div className="fixed inset-0 z-[-1] pointer-events-none opacity-60">
              <Orb hoverIntensity={2} rotateOnHover hue={0} forceHoverState={false} backgroundColor="#000000" />
            </div>

            {/* BRANDING HERO LAYER (REFINED TO MATCH BACKGROUND) */}
            <AnimatePresence>
              {messages.length === 0 && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.05 }}
                  transition={{ duration: 2, ease: "easeOut" }}
                  className="absolute inset-x-0 top-[40%] flex flex-col items-center justify-center pointer-events-none z-0"
                >
                  <h1 className="text-7xl md:text-8xl font-black tracking-tighter mix-blend-screen select-none text-center leading-none text-white/40 drop-shadow-[0_0_15px_rgba(255,255,255,0.1)]">
                    Sanjeevni
                  </h1>
                  <p className="mt-4 text-sm md:text-base text-white/10 font-bold tracking-[0.5em] uppercase text-center leading-relaxed">
                    Personal Healthcare Automation 
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* FLOATING CLOSE BUTTON */}
            <button 
              onClick={() => setIsOpen(false)} 
              className="absolute top-8 right-12 size-12 flex items-center justify-center hover:bg-white/10 rounded-full text-white/40 hover:text-white transition-all transform hover:rotate-90 z-[160]"
            >
              <X size={28} />
            </button>

            {/* RESULTS */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto custom-scrollbar flex flex-col items-center relative z-10" style={{ padding: '120px 40px 300px 40px' }}>
              <div className="w-full max-w-[800px] mx-auto flex flex-col">
                {messages.map((m) => (
                  <div key={m.id} className="w-full mb-16! animate-in fade-in slide-in-from-bottom-8 duration-1000">
                    {m.role === 'user' ? (
                      <div className="flex justify-end mb-10!">
                        <div className="text-sky-100/40 text-4xl font-medium tracking-tight text-right max-w-[90%] drop-shadow-[0_0_30px_rgba(186,242,248,0.2)] leading-relaxed">
                          {m.content}
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-12">
                        <div className="text-3xl leading-[1.65] text-white/80 font-medium tracking-tight">
                          {m.content.split('. ').map((sentence, idx) => (
                            <React.Fragment key={idx}>
                              {idx === 0 ? (
                                <span className="text-sky-100 font-bold tracking-tight drop-shadow-[0_0_15px_rgba(125,211,252,0.4)]">
                                  {sentence}.
                                </span>
                              ) : (<span className="opacity-70 tracking-tight"> {sentence}.</span>)}
                            </React.Fragment>
                          ))}
                        </div>
                        {m.action && (
                          <div className="mt-14 space-y-12!">
                            {m.action.type === 'DOCTOR_LIST' && (
                              <div className="space-y-10">
                                <h3 className="text-4xl font-black text-white/90 tracking-tight">Top Specialists</h3>
                                <ul className="space-y-10">
                                  {m.action.data.map(doc => (
                                    <li key={doc._id} onClick={() => { setBookingContext({ doctorName: doc.userId?.name, doctorId: doc._id }); setInput(`Book with Dr. ${doc.userId?.name}`); }} className="flex items-start gap-10 group cursor-pointer">
                                      <div className="size-4.5 rounded-full bg-sky-400 mt-4.5 shrink-0 shadow-[0_0_25px_rgba(56,189,248,0.5)] group-hover:scale-150 transition-all duration-300" />
                                      <div className="flex-1">
                                        <p className="text-3xl font-bold text-white group-hover:text-sky-400 transition-colors tracking-tight">{doc.userId?.name} <span className="text-[12px] text-white/20 font-black uppercase tracking-[0.4em] ml-8 px-3 py-1 border border-white/5 rounded-lg bg-white/5">Verified</span></p>
                                        <p className="text-xl text-white/40 font-medium mt-4 leading-relaxed max-w-[700px]">Expert in {doc.specialization}.</p>
                                        <div className="mt-6 text-sm font-black uppercase text-sky-400 opacity-0 group-hover:opacity-100 transition-all tracking-[0.5em] translate-x-4 group-hover:translate-x-0">Connect →</div>
                                      </div>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                            {m.action.type === 'ACTION' && (
                              <div className="pt-16 border-t border-white/5">
                                <button 
                                  disabled={executing} 
                                  onClick={() => confirmBooking(m.action.payload)} 
                                  className="px-20 h-24 bg-white/5 border border-white/10 hover:border-white/20 text-white/90 font-black text-2xl rounded-[36px] flex items-center gap-6 transition-all transform active:scale-95 hover:bg-white/10"
                                >
                                  <Sparkles size={32} className="text-sky-400" />
                                  {executing ? 'Executing...' : m.action.label}
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
                {loading && (
                  <div className="flex gap-4 items-center mb-10!">
                    <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1 }} className="size-4 bg-sky-400 rounded-full" />
                    <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} className="size-4 bg-sky-400 rounded-full" />
                  </div>
                )}
              </div>
            </div>

            {/* INPUT HUB (REFINED PADDING & TYPOGRAPHY) */}
            <div className="fixed bottom-14 left-0 right-0 flex justify-center z-[200]">
              <div className="w-full max-w-[700px] px-10">
                <div 
                  className="relative group bg-white/5 backdrop-blur-3xl rounded-[40px] border border-white/10 shadow-[0_40px_100px_rgba(0,0,0,0.6)] flex flex-col transition-all duration-500 hover:bg-white/10"
                  style={{ padding: '16px 24px' }}
                >
                  <div className="flex items-center gap-4">
                    <button type="button" className="size-12 bg-white/5 flex items-center justify-center rounded-full text-white/30 hover:text-white transition-all transform hover:scale-110 active:scale-95"><Plus size={28} /></button>
                    <textarea 
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      placeholder={isListening ? "Listening..." : "Ask me anything"}
                      rows={1}
                      className="flex-1 bg-transparent text-white placeholder-white/20 outline-none text-2xl font-medium resize-none min-h-[48px] max-h-[400px] custom-scrollbar tracking-tight transition-all"
                      style={{ 
                        lineHeight: '1.6', 
                        paddingTop: '8px', 
                        paddingBottom: '8px',
                        paddingLeft: '12px',
                        paddingRight: '12px',
                        overflowY: 'auto'
                      }}
                      onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(e); } }}
                    />
                    <div className="flex items-center gap-4">
                      {isListening ? (
                        <button 
                          type="button" 
                          onClick={toggleListening}
                          className="relative size-12 bg-white/5 flex items-center justify-center rounded-full text-white/30 transition-all transform hover:scale-110 active:scale-95"
                        >
                          <motion.div 
                            animate={{ scale: [1, 1.5, 1], opacity: [0.2, 0, 0.2] }} 
                            transition={{ repeat: Infinity, duration: 2 }}
                            className="absolute inset-0 bg-white/10 rounded-full pointer-events-none"
                          />
                          <motion.div style={{ scale: 1 + audioLevel * 1.5 }} className="absolute inset-0 bg-white/5 rounded-full pointer-events-none" />
                          <Mic size={28} className="relative z-10" />
                        </button>
                      ) : (
                        input.trim() ? (
                          <button type="button" onClick={handleSend} disabled={loading} className="size-12 bg-white/5 flex items-center justify-center rounded-full text-white/30 hover:text-white transition-all transform hover:scale-110 active:scale-95"><Send size={28} /></button>
                        ) : (
                          <button type="button" onClick={toggleListening} className="size-12 bg-white/5 flex items-center justify-center rounded-full text-white/30 hover:text-white transition-all transform hover:scale-110 active:scale-95"><Mic size={28} /></button>
                        )
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {!isOpen && isAgentVisible && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[100] w-full max-w-[650px] px-6 cursor-pointer">
          <div className="relative group" onClick={() => setIsOpen(true)}>
            {/* RGB GLOWING BORDER */}
            <div className="absolute -inset-[2px] rounded-[32px] opacity-40 blur-xl group-hover:opacity-100 transition-opacity duration-1000 animate-pulse bg-gradient-to-r from-red-500 via-blue-500 to-green-500 bg-[length:200%_200%] animate-rgb-glow" />
            <div className="absolute -inset-[1px] rounded-[32px] bg-gradient-to-r from-red-500 via-blue-500 to-green-500 bg-[length:200%_200%] animate-rgb-glow" />
            
            <div className="relative h-16 rounded-[32px] bg-zinc-950/95 flex items-center justify-center border border-white/5 px-12 transition-all transform hover:-translate-y-2 shadow-[0_0_50px_rgba(0,0,0,1)] backdrop-blur-3xl">
              <div className="flex items-center gap-6">
                <Activity size={24} className="text-sky-400 group-hover:animate-pulse-fast" />
                <span className="text-white/30 text-xl font-semibold tracking-tight group-hover:text-white/60 transition-colors uppercase py-1">Automate your workflow</span>
              </div>
              
              {/* STATUS INDICATOR (ABSOLUTE POSITIONED TO KEEP MAIN TEXT CENTERED) */}
              <div className="absolute right-10 flex items-center">
                <div className="text-[10px] font-black uppercase text-sky-400/20 tracking-[0.2em] group-hover:text-sky-400/50 transition-colors">AI Active</div>
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 8px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.05); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255, 255, 255, 0.1); }
        
        @keyframes rgb-glow {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .animate-rgb-glow {
          animation: rgb-glow 6s linear infinite;
        }
        @keyframes pulse-fast {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.7; transform: scale(1.1); }
        }
        .animate-pulse-fast {
          animation: pulse-fast 1s ease-in-out infinite;
        }
      `}</style>
    </>
  );
}
