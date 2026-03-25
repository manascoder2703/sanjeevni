'use client';
import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  Stethoscope, LogOut, Calendar, User, Bot, Send, Loader2,
  AlertTriangle, CheckCircle, Clock, Sparkles, MessageSquare,
  Activity, ChevronRight, Heart
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

// React Bits Components
import DecryptedText from '@/components/react-bits/DecryptedText';
import ShinyText from '@/components/react-bits/ShinyText';

/* ──────────────────────────────────── SYMPTOM CHECKER ──────────────────────────────────── */

function SymptomChecker() {
  const [symptoms, setSymptoms] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const analyze = async () => {
    if (!symptoms.trim()) { toast.error('Please describe your symptoms first'); return; }
    setLoading(true); setResult(null);
    try {
      const res = await fetch('/api/ai/symptom-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symptoms }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setResult(data.analysis);
    } catch (e) {
      toast.error(e.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const urgencyConfig = {
    emergency: { color: 'white', bg: 'rgba(239,68,68,0.15)', border: 'rgba(239,68,68,0.3)', icon: <AlertTriangle size={18} style={{ color: 'white' }} />, label: '🚨 Emergency – Seek immediate care' },
    urgent:    { color: 'white', bg: 'rgba(245,158,11,0.15)', border: 'rgba(245,158,11,0.3)', icon: <Clock size={18} style={{ color: 'white' }} />, label: '⚠️ Urgent – See a doctor within 24-48 hours' },
    routine:   { color: 'white', bg: 'rgba(16,185,129,0.15)', border: 'rgba(16,185,129,0.3)', icon: <CheckCircle size={18} style={{ color: 'white' }} />, label: '✅ Routine – Schedule a regular appointment' },
  };

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Activity size={20} style={{ color: 'white', filter: 'drop-shadow(0 0 5px rgba(255,255,255,0.2))' }} /> AI Symptom Checker
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
          Describe your symptoms and Sanjeevni AI will help you understand what might be happening.
        </p>
      </div>

      <div className="glass-card premium-card" style={{ 
        padding: 28, 
        marginBottom: 24, 
        background: 'rgba(255, 255, 255, 0.02)',
        backdropFilter: 'blur(12px)',
        border: '1px solid rgba(255, 255, 255, 0.05)',
        borderRadius: 24,
        boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
        transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)' 
      }}>
        <label style={{ display: 'block', fontWeight: 700, fontSize: 13, marginBottom: 12, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '1px' }}>
          Describe your symptoms in detail
        </label>
        <textarea
          value={symptoms}
          onChange={e => setSymptoms(e.target.value)}
          placeholder="e.g. I have had a persistent headache for 2 days, mild fever around 99°F, and feeling fatigued. No vomiting."
          rows={5}
          className="symptom-textarea"
          style={{
            width: '100%', borderRadius: 16, padding: '18px 22px', fontSize: 15,
            background: 'rgba(0, 0, 0, 0.3)', border: '1px solid rgba(255, 255, 255, 0.08)',
            color: 'white', resize: 'vertical', outline: 'none', boxSizing: 'border-box',
            fontFamily: 'inherit', lineHeight: 1.6, transition: 'all 0.3s ease',
          }}
        />
        <motion.button
          onClick={analyze}
          disabled={loading}
          whileHover={!loading ? { scale: 1.02, backgroundColor: '#ffffff', color: '#0f172a', boxShadow: '0 0 30px rgba(255,255,255,0.2)' } : {}}
          whileTap={!loading ? { scale: 0.98 } : {}}
          style={{ 
            marginTop: 18, 
            padding: '14px 28px', 
            borderRadius: 14,
            display: 'flex', 
            alignItems: 'center', 
            gap: 10, 
            fontSize: 15,
            fontWeight: 700,
            background: 'transparent',
            border: '2px solid rgba(255,255,255,0.2)',
            color: 'white',
            cursor: loading ? 'not-allowed' : 'pointer',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            opacity: loading ? 0.6 : 1,
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          {loading ? <Loader2 size={18} className="spin" /> : <Sparkles size={18} />}
          {loading ? 'Analyzing...' : 'Analyze Symptoms'}
        </motion.button>
      </div>

      {result && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Urgency Banner */}
          {result.urgencyLevel && urgencyConfig[result.urgencyLevel] && (
            <div style={{
              padding: '14px 18px', borderRadius: 12,
              background: urgencyConfig[result.urgencyLevel].bg,
              border: `1px solid ${urgencyConfig[result.urgencyLevel].border}`,
              color: urgencyConfig[result.urgencyLevel].color,
              display: 'flex', alignItems: 'center', gap: 10, fontWeight: 600
            }}>
              {urgencyConfig[result.urgencyLevel].icon}
              <div>
                <div>{urgencyConfig[result.urgencyLevel].label}</div>
                {result.urgencyMessage && (
                  <div style={{ fontWeight: 400, fontSize: 13, marginTop: 2, opacity: 0.9 }}>{result.urgencyMessage}</div>
                )}
              </div>
            </div>
          )}

          {/* Possible Conditions */}
          {result.possibleConditions?.length > 0 && (
            <div className="glass-card" style={{ 
              padding: '28px 24px', 
              background: 'rgba(255, 255, 255, 0.03)',
              backdropFilter: 'blur(16px)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: 24,
              boxShadow: '0 20px 50px rgba(0,0,0,0.3)'
            }}>
              <h3 style={{ fontWeight: 800, fontSize: 17, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10, letterSpacing: '-0.02em' }}>
                <Stethoscope size={20} style={{ color: 'white', filter: 'drop-shadow(0 0 8px rgba(255,255,255,0.4))' }} /> Possible Conditions
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {result.possibleConditions.map((c, i) => {
                  const lColor = c.likelihood === 'High' ? '#ef4444' : c.likelihood === 'Medium' ? '#f59e0b' : '#10b981';
                  const lBg = c.likelihood === 'High' ? 'rgba(239, 68, 68, 0.15)' : c.likelihood === 'Medium' ? 'rgba(245, 158, 11, 0.15)' : 'rgba(16, 185, 129, 0.15)';
                  return (
                    <motion.div 
                      key={i} 
                      whileHover={{ x: 5, backgroundColor: 'rgba(255, 255, 255, 0.06)', borderColor: 'rgba(255, 255, 255, 0.15)' }}
                      whileTap={{ scale: 0.995, backgroundColor: 'rgba(255, 255, 255, 0.08)' }}
                      className="condition-card" 
                      style={{ 
                        display: 'flex', gap: 16, padding: '18px 22px', 
                        background: 'rgba(255, 255, 255, 0.04)', 
                        borderRadius: 18, 
                        border: '1px solid rgba(255, 255, 255, 0.06)', 
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        cursor: 'default'
                      }}
                    >
                      <div style={{ minWidth: 10, height: 10, borderRadius: '50%', background: lColor, marginTop: 6, flexShrink: 0, boxShadow: `0 0 12px ${lColor}aa` }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                          <span style={{ fontWeight: 800, fontSize: 16, color: 'white' }}>{c.name}</span>
                          <span style={{ fontSize: 10, fontWeight: 900, color: lColor, padding: '4px 10px', background: lBg, borderRadius: 8, border: `1px solid ${lColor}30`, textTransform: 'uppercase', letterSpacing: '1px' }}>{c.likelihood}</span>
                        </div>
                        <p style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: 14, lineHeight: 1.6, fontWeight: 500 }}>{c.description}</p>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Home Care Tips */}
          {result.homeCareTips?.length > 0 && (
            <div className="glass-card" style={{ padding: 24, border: '1px solid rgba(255, 255, 255, 0.1)', background: 'rgba(255,255,255,0.02)' }}>
              <h3 style={{ fontWeight: 700, fontSize: 16, marginBottom: 18, display: 'flex', alignItems: 'center', gap: 10 }}>
                <Heart size={20} style={{ color: 'white', filter: 'drop-shadow(0 0 5px rgba(255,255,255,0.3))' }} /> Home Care Tips
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
                {result.homeCareTips.map((tip, i) => (
                  <div key={i} className="tip-item" style={{ 
                    display: 'flex', gap: 12, alignItems: 'flex-start', padding: '14px 16px',
                    background: 'rgba(255,255,255,0.03)', borderRadius: 12, border: '1px solid rgba(255,255,255,0.05)',
                    transition: 'all 0.2s ease'
                  }}>
                    <div style={{ width: 22, height: 22, borderRadius: '50%', background: 'rgba(255, 255, 255, 0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: '1px solid rgba(255,255,255,0.1)' }}>
                      <CheckCircle size={14} style={{ color: 'white' }} />
                    </div>
                    <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)', lineHeight: 1.5 }}>{tip}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Disclaimer */}
          {result.disclaimer && (
            <p style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'center', padding: '8px 0' }}>
              ⚠️ {result.disclaimer}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

/* ──────────────────────────────────── HEALTH CHAT ──────────────────────────────────── */

function HealthChat({ messages, setMessages, chatId, setChatId, loading, setLoading }) {
  const [input, setInput] = useState('');
  const [countdown, setCountdown] = useState(0);
  const bottomRef = useRef(null);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setInterval(() => setCountdown(c => c - 1), 1000);
      return () => clearInterval(timer);
    }
  }, [countdown]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    const userMsg = { role: 'user', content: input.trim() };
    const newMessages = [...messages, userMsg];
    
    // Optimistic update
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMessages, chatId }),
      });
      const data = await res.json();
      
      if (res.status === 429) {
        setCountdown(60);
        toast.error('Free Tier Limit: Please wait 60 seconds.');
        return;
      }

      if (!res.ok) throw new Error(data.error);
      
      setMessages(prev => [...prev, { role: 'assistant', content: data.reply }]);
      if (data.chatId) setChatId(data.chatId);
    } catch (e) {
      toast.error(e.message || 'Failed to get response');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 220px)', minHeight: 600, position: 'relative' }}>
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ fontSize: 24, fontWeight: 900, marginBottom: 6, display: 'flex', alignItems: 'center', gap: 10, letterSpacing: '-0.03em' }}>
          <MessageSquare size={24} style={{ color: 'white', filter: 'drop-shadow(0 0 8px rgba(255,255,255,0.4))' }} /> 
          <span style={{ background: 'linear-gradient(to right, #fff, #94a3b8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Neural Health Suite
          </span>
        </h2>
        <p style={{ color: 'rgba(148, 163, 184, 0.6)', fontSize: 13, fontWeight: 500, letterSpacing: '0.01em' }}>
          Direct interface with Sanjeevni Intelligence Core
        </p>
      </div>

      {/* Messages */}
      <div className="glass-card chat-workspace" style={{ 
        flex: 1, 
        overflowY: 'auto', 
        padding: '28px 32px', 
        marginBottom: 20,
        background: 'rgba(0, 0, 0, 0.3)',
        border: '1px solid rgba(255, 255, 255, 0.05)',
        backdropFilter: 'blur(30px)',
        borderRadius: 28,
        boxShadow: 'inset 0 0 40px rgba(0,0,0,0.5)'
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <AnimatePresence initial={false}>
            {messages.map((m, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                style={{
                  display: 'flex',
                  justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start',
                  gap: 12
                }}
              >
                {m.role === 'assistant' && (
                  <div style={{ position: 'relative' }}>
                    <motion.div 
                      animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.3, 0.1] }}
                      transition={{ duration: 3, repeat: Infinity }}
                      style={{ position: 'absolute', inset: -4, background: 'rgba(255, 255, 255, 0.2)', borderRadius: 14, filter: 'blur(8px)' }}
                    />
                    <motion.div 
                      whileHover={{ scale: 1.1, backgroundColor: 'rgba(255,255,255,0.1)' }}
                      style={{ 
                        width: 40, height: 40, borderRadius: 14, 
                        background: 'rgba(255, 255, 255, 0.05)', 
                        display: 'flex', alignItems: 'center', justifyContent: 'center', 
                        color: 'white', border: '1px solid rgba(255, 255, 255, 0.1)',
                        position: 'relative', zIndex: 1,
                        cursor: 'help'
                      }}
                    >
                      <Bot size={20} />
                    </motion.div>
                  </div>
                )}
                
                <div 
                  style={{ 
                    maxWidth: '80%',
                    padding: '16px 20px',
                    borderRadius: m.role === 'user' ? '20px 20px 4px 20px' : '4px 20px 20px 20px',
                    background: m.role === 'user' 
                      ? 'rgba(255, 255, 255, 0.12)' 
                      : 'rgba(255, 255, 255, 0.04)',
                    backdropFilter: 'blur(15px)',
                    color: 'white',
                    fontSize: 15,
                    lineHeight: 1.6,
                    boxShadow: m.role === 'user' 
                      ? '0 10px 30px rgba(255, 255, 255, 0.05)' 
                      : '0 10px 30px rgba(0,0,0,0.3)',
                    border: '1px solid rgba(255,255,255,0.08)'
                  }}
                  className="chat-bubble-premium"
                >
                  <p style={{ margin: 0, fontWeight: 500 }}>{m.content}</p>
                </div>

                {m.role === 'user' && (
                  <motion.div 
                    whileHover={{ scale: 1.1, backgroundColor: 'rgba(255,255,255,0.06)' }}
                    style={{ width: 40, height: 40, borderRadius: 14, background: 'rgba(255, 255, 255, 0.03)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.4)', border: '1px solid rgba(255,255,255,0.05)', cursor: 'pointer' }}
                  >
                    <User size={20} />
                  </motion.div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
          
          {loading && (
            <motion.div 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              style={{ display: 'flex', gap: 14, alignItems: 'center' }}
            >
              <div style={{ width: 40, height: 40, borderRadius: 14, background: 'rgba(30,41,59,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#818cf8', border: '1px solid rgba(148,163,184,0.1)' }}>
                <Bot size={18} className="spin" />
              </div>
              <div style={{ 
                padding: '14px 20px', 
                borderRadius: '6px 20px 20px 20px', 
                background: 'rgba(30,41,59,0.4)', 
                border: '1px solid rgba(148,163,184,0.1)', 
                display: 'flex', gap: 6, alignItems: 'center' 
              }}>
                <motion.span animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1 }} style={{ width: 6, height: 6, borderRadius: '50%', background: 'white' }} />
                <motion.span animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} style={{ width: 6, height: 6, borderRadius: '50%', background: 'white' }} />
                <motion.span animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} style={{ width: 6, height: 6, borderRadius: '50%', background: 'white' }} />
              </div>
            </motion.div>
          )}
          <div ref={bottomRef} />
        </div>
      </div>

      {/* Premium Input Bridge */}
      <div style={{ 
        position: 'relative',
        padding: '2px',
        borderRadius: 26,
        background: 'rgba(255, 255, 255, 0.03)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        boxShadow: '0 10px 40px rgba(0,0,0,0.5)',
        transition: 'all 0.3s ease'
      }}
      className="chat-input-container"
      >
        <div style={{ 
          background: 'rgba(0, 0, 0, 0.4)', 
          backdropFilter: 'blur(20px)',
          borderRadius: 24,
          padding: '12px 14px 12px 24px', 
          display: 'flex', 
          gap: 14, 
          alignItems: 'center',
          transition: 'all 0.3s ease'
        }}>
          <textarea
            value={countdown > 0 ? `AI Cooling down... (${countdown}s)` : input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={loading || countdown > 0}
            placeholder={countdown > 0 ? "Rate limit reached" : "Ask anything about your health..."}
            rows={1}
            style={{
              flex: 1, 
              resize: 'none', 
              background: 'transparent', 
              border: 'none', 
              outline: 'none',
              color: countdown > 0 ? '#ef4444' : 'white', 
              fontSize: 15, 
              fontFamily: 'inherit', 
              lineHeight: 1.5,
              fontWeight: 500,
              padding: '12px 0',
              opacity: (loading || countdown > 0) ? 0.6 : 1
            }}
          />
          <motion.button
            whileHover={!(loading || countdown > 0 || !input.trim()) ? { scale: 1.05, backgroundColor: '#ffffff', color: '#0f172a', boxShadow: '0 0 20px rgba(255, 255, 255, 0.2)' } : {}}
            whileTap={!(loading || countdown > 0 || !input.trim()) ? { scale: 0.95 } : {}}
            onClick={sendMessage}
            disabled={loading || countdown > 0 || (!input.trim() && countdown === 0)}
            style={{
              width: 44, height: 44, borderRadius: 16, 
              cursor: (loading || countdown > 0 || !input.trim()) ? 'not-allowed' : 'pointer',
              background: 'transparent',
              border: '2px solid rgba(255, 255, 255, 0.1)',
              color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)', flexShrink: 0,
              opacity: (loading || countdown > 0 || !input.trim()) ? 0.4 : 1
            }}
          >
            {loading ? <Loader2 size={20} className="spin" /> : countdown > 0 ? <Clock size={20} /> : <Send size={20} />}
          </motion.button>
        </div>
      </div>
    </div>
  );
}

/* ──────────────────────────────────── CHAT HISTORY ──────────────────────────────────── */

function ChatHistory({ onSelectChat }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await fetch('/api/ai/history');
        const data = await res.json();
        if (res.ok) setHistory(data.chats || []);
      } catch (err) {
        console.error('History load error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
      <Loader2 className="spin" style={{ color: '#0ea5e9' }} />
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ marginBottom: 12 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Clock size={20} style={{ color: 'white', filter: 'drop-shadow(0 0 5px rgba(255,255,255,0.3))' }} /> Previous Conversations
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
          Access your past health chats and AI summaries.
        </p>
      </div>

      {history.length === 0 ? (
        <div className="glass-card" style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
          No previous chats found. Start a new conversation in the Health Chat tab!
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 12 }}>
          {history.map(chat => (
            <motion.div
              key={chat._id}
              whileHover={{ scale: 1.01, x: 5, backgroundColor: 'rgba(255, 255, 255, 0.05)', borderColor: 'rgba(255, 255, 255, 0.15)' }}
              whileTap={{ scale: 0.99 }}
              onClick={() => onSelectChat(chat._id)}
              className="glass-card history-item"
              style={{
                padding: '24px', 
                cursor: 'pointer', 
                border: '1px solid rgba(255, 255, 255, 0.05)',
                background: 'rgba(255, 255, 255, 0.02)',
                borderRadius: 20,
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)', 
                position: 'relative', 
                overflow: 'hidden'
              }}
            >
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, transparent 50%)', pointerEvents: 'none' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12, position: 'relative', zIndex: 1 }}>
                <h4 style={{ fontWeight: 800, color: 'white', fontSize: 17, letterSpacing: '-0.01em' }}>{chat.title}</h4>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, opacity: 0.5 }}>
                  <Calendar size={12} />
                  <span style={{ fontSize: 11, fontWeight: 700 }}>
                    {new Date(chat.updatedAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
              <p style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: 14, lineHeight: 1.6, marginBottom: 0, position: 'relative', zIndex: 1, fontWeight: 500 }}>
                {chat.summary || "No summary available for this conversation."}
              </p>
              <div style={{ position: 'absolute', right: 16, bottom: 16, opacity: 0.1, zIndex: 1 }}>
                <ChevronRight size={20} />
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ──────────────────────────────────── MAIN PAGE ──────────────────────────────────── */

export default function AIAssistantPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('symptom-checker');
  
  // Persistent Chat State
  const [messages, setMessages] = useState([
    { role: 'assistant', content: "Hi! I'm Sanjeevni AI, your personal health assistant. I can answer general health questions, help you understand medical terms, or guide you on when to see a doctor. How can I help you today?" }
  ]);
  const [chatId, setChatId] = useState(null);
  const [chatLoading, setChatLoading] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!user) router.push('/login');
  }, [user, authLoading]);

  const loadPreviousChat = async (id) => {
    setChatLoading(true);
    setActiveTab('health-chat');
    try {
      const res = await fetch('/api/ai/history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chatId: id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      setMessages(data.chat.messages);
      setChatId(data.chat._id);
    } catch (e) {
      toast.error('Failed to load chat history');
    } finally {
      setChatLoading(false);
    }
  };

  if (!user) return null;

  const chatProps = { messages, setMessages, chatId, setChatId, loading: chatLoading, setLoading: setChatLoading };

  return (
    <div style={{ flex: 1, height: '100%', display: 'flex', flexDirection: 'column', minHeight: 0, padding: '32px' }}>
      {/* Main Content */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, width: '100%', position: 'relative', zIndex: 10 }}>
        {/* Header */}
        <div style={{ marginBottom: 32, position: 'relative' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 8 }}>
            <motion.div 
              whileHover={{ scale: 1.1, rotate: 5 }}
              style={{ 
                width: 52, height: 52, borderRadius: 16, 
                background: 'rgba(255, 255, 255, 0.03)', 
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
                position: 'relative',
                overflow: 'hidden',
                cursor: 'pointer'
              }}
            >
              <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at 20% 20%, rgba(255,255,255,0.1) 0%, transparent 50%)' }} />
              <Bot size={28} style={{ color: 'white', filter: 'drop-shadow(0 0 8px rgba(255,255,255,0.5))', position: 'relative', zIndex: 1 }} />
            </motion.div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <h1 style={{ 
                  margin: 0,
                  fontSize: 28, 
                  fontWeight: 900, 
                  letterSpacing: '-0.02em', 
                  background: 'linear-gradient(to right, #fff, #94a3b8)', 
                  WebkitBackgroundClip: 'text', 
                  WebkitTextFillColor: 'transparent' 
                }}>
                  Sanjeevni AI Assistant
                </h1>
                <div style={{ 
                   display: 'flex', alignItems: 'center', gap: 5, padding: '4px 12px', 
                   background: 'rgba(255, 255, 255, 0.05)', borderRadius: 20, border: '1px solid rgba(255, 255, 255, 0.1)' 
                }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'white', boxShadow: '0 0 8px white' }} />
                  <ShinyText text="AI LIVE" speed={3} className="status-shiny" style={{ fontSize: 10, fontWeight: 800, color: 'white', letterSpacing: '0.8px' }} />
                </div>
              </div>
              <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 2, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Sparkles size={12} style={{ color: 'white', opacity: 0.6 }} /> Powered by Google Gemini · For informational use only
              </p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ 
          display: 'flex', gap: 6, marginTop: 0, marginRight: 0, marginBottom: 40, marginLeft: 0,
          background: 'rgba(0, 0, 0, 0.4)', 
          padding: '6px', 
          borderRadius: 16, 
          width: 'fit-content', 
          border: '1px solid rgba(255, 255, 255, 0.05)',
          boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.5)',
          position: 'relative',
          backdropFilter: 'blur(10px)'
        }}>
          {[
            { id: 'symptom-checker', label: 'Symptom Checker', icon: <Activity size={16} /> },
            { id: 'health-chat', label: 'Health Chat', icon: <MessageSquare size={16} /> },
            { id: 'history', label: 'Previous Chats', icon: <Clock size={16} /> },
          ].map(tab => (
            <motion.button
              key={tab.id}
              whileHover={activeTab !== tab.id ? { backgroundColor: 'rgba(255, 255, 255, 0.05)', color: 'white' } : {}}
              whileTap={{ scale: 0.98 }}
              onClick={() => setActiveTab(tab.id)}
              className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
              style={{
                display: 'flex', alignItems: 'center', gap: 8, padding: '12px 24px', borderRadius: 12, border: 'none', cursor: 'pointer',
                fontSize: 14, fontWeight: 700, transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                background: 'transparent',
                color: activeTab === tab.id ? 'white' : 'rgba(255, 255, 255, 0.4)',
                position: 'relative',
                overflow: 'hidden',
                zIndex: 1
              }}
            >
              <span style={{ position: 'relative', zIndex: 2, display: 'flex', alignItems: 'center', gap: 8 }}>
                {tab.icon} {tab.label}
              </span>
              
              {activeTab === tab.id && (
                <motion.div
                  layoutId="activeTabPill"
                  transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                  style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'rgba(255, 255, 255, 0.08)',
                    borderRadius: 10,
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    boxShadow: '0 4px 15px rgba(0,0,0,0.2)',
                    zIndex: 0
                  }}
                />
              )}
            </motion.button>
          ))}
        </div>

        {/* Tab Content with State Preservation */}
        <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', display: activeTab === 'symptom-checker' ? 'block' : 'none', paddingRight: 12 }}>
          <SymptomChecker />
        </div>
        
        <div style={{ flex: 1, minHeight: 0, display: activeTab === 'health-chat' ? 'flex' : 'none', flexDirection: 'column' }}>
          <HealthChat {...chatProps} />
        </div>

        <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', display: activeTab === 'history' ? 'block' : 'none', paddingRight: 12 }}>
          <ChatHistory onSelectChat={loadPreviousChat} />
        </div>
      </main>

      <style>{`
        .history-item:hover {
          border-color: rgba(255, 255, 255, 0.2) !important;
          background: rgba(255, 255, 255, 0.05) !important;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.4) !important;
        }

        @keyframes pulse { 0%,100% { opacity: 0.3; transform: scale(0.8); } 50% { opacity: 1; transform: scale(1); } }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .spin { animation: spin 1s linear infinite; }
        
        .symptom-textarea:focus {
          border-color: rgba(255, 255, 255, 0.5) !important;
          background: rgba(0, 0, 0, 0.5) !important;
          box-shadow: 0 0 30px rgba(255, 255, 255, 0.15);
        }
        
        .premium-card:focus-within {
          border-color: rgba(255, 255, 255, 0.1) !important;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.4) !important;
          transform: translateY(-2px);
        }
        
        .premium-card:hover:not(:focus-within) {
          border-color: rgba(255, 255, 255, 0.15) !important;
          background: rgba(255, 255, 255, 0.04) !important;
        }
        
        
        .tip-item:hover {
          transform: translateY(-2px);
          background: rgba(16, 185, 129, 0.1) !important;
          border-color: rgba(16, 185, 129, 0.3) !important;
        }
        
        .chat-bubble-premium:hover {
          transform: scale(1.01);
        }

        .chat-input-container:focus-within {
          border-color: rgba(255, 255, 255, 0.2) !important;
          background: rgba(255, 255, 255, 0.05) !important;
          box-shadow: 0 0 30px rgba(255, 255, 255, 0.05) !important;
        }

        /* Custom Scrollbar for Chat */
        .glass-card::-webkit-scrollbar {
          width: 6px;
        }
        .glass-card::-webkit-scrollbar-track {
          background: transparent;
        }
        .glass-card::-webkit-scrollbar-thumb {
          background: rgba(148, 163, 184, 0.2);
          borderRadius: 3px;
        }
        .glass-card::-webkit-scrollbar-thumb:hover {
          background: rgba(148, 163, 184, 0.4);
        }
      `}</style>
    </div>
  );
}
