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
    emergency: { color: '#ef4444', bg: 'rgba(239,68,68,0.1)', border: 'rgba(239,68,68,0.3)', icon: <AlertTriangle size={18} />, label: '🚨 Emergency – Seek immediate care' },
    urgent:    { color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.3)', icon: <Clock size={18} />, label: '⚠️ Urgent – See a doctor within 24-48 hours' },
    routine:   { color: '#10b981', bg: 'rgba(16,185,129,0.1)', border: 'rgba(16,185,129,0.3)', icon: <CheckCircle size={18} />, label: '✅ Routine – Schedule a regular appointment' },
  };

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Activity size={20} style={{ color: '#0ea5e9' }} /> AI Symptom Checker
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
          Describe your symptoms and Sanjeevni AI will help you understand what might be happening.
        </p>
      </div>

      <div className="glass-card premium-card" style={{ padding: 28, marginBottom: 24, transition: 'all 0.3s ease' }}>
        <label style={{ display: 'block', fontWeight: 600, fontSize: 14, marginBottom: 12, color: 'var(--text-secondary)' }}>
          Describe your symptoms in detail
        </label>
        <textarea
          value={symptoms}
          onChange={e => setSymptoms(e.target.value)}
          placeholder="e.g. I have had a persistent headache for 2 days, mild fever around 99°F, and feeling fatigued. No vomiting."
          rows={5}
          className="symptom-textarea"
          style={{
            width: '100%', borderRadius: 14, padding: '16px 20px', fontSize: 15,
            background: 'rgba(15,23,42,0.7)', border: '1px solid var(--border)',
            color: 'var(--text-primary)', resize: 'vertical', outline: 'none', boxSizing: 'border-box',
            fontFamily: 'inherit', lineHeight: 1.6, transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        />
        <button
          onClick={analyze}
          disabled={loading}
          className="btn-primary"
          style={{ 
            marginTop: 18, padding: '12px 24px', borderRadius: 12,
            display: 'flex', alignItems: 'center', gap: 10, fontSize: 15,
            opacity: loading ? 0.7 : 1, transition: 'all 0.3s ease',
            boxShadow: '0 4px 12px rgba(14, 165, 233, 0.2)'
          }}
        >
          {loading ? <Loader2 size={18} className="spin" /> : <Sparkles size={18} />}
          {loading ? 'Analyzing...' : 'Analyze Symptoms'}
        </button>
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
            <div className="glass-card" style={{ padding: 24, border: '1px solid rgba(14, 165, 233, 0.2)' }}>
              <h3 style={{ fontWeight: 700, fontSize: 16, marginBottom: 18, display: 'flex', alignItems: 'center', gap: 10 }}>
                <Stethoscope size={20} style={{ color: '#0ea5e9' }} /> Possible Conditions
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {result.possibleConditions.map((c, i) => {
                  const lColor = c.likelihood === 'High' ? '#ef4444' : c.likelihood === 'Medium' ? '#f59e0b' : '#10b981';
                  return (
                    <div key={i} className="condition-card" style={{ 
                      display: 'flex', gap: 14, padding: '16px 20px', 
                      background: 'rgba(15,23,42,0.6)', borderRadius: 14, 
                      border: '1px solid var(--border)', transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      cursor: 'default'
                    }}>
                      <div style={{ minWidth: 10, height: 10, borderRadius: '50%', background: lColor, marginTop: 6, flexShrink: 0, boxShadow: `0 0 8px ${lColor}aa` }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                          <span style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-primary)' }}>{c.name}</span>
                          <span style={{ fontSize: 11, fontWeight: 800, color: lColor, padding: '4px 10px', background: `${lColor}15`, borderRadius: 8, border: `1px solid ${lColor}30`, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{c.likelihood}</span>
                        </div>
                        <p style={{ color: 'var(--text-muted)', fontSize: 14, lineHeight: 1.6 }}>{c.description}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Home Care Tips */}
          {result.homeCareTips?.length > 0 && (
            <div className="glass-card" style={{ padding: 24, border: '1px solid rgba(16, 185, 129, 0.2)' }}>
              <h3 style={{ fontWeight: 700, fontSize: 16, marginBottom: 18, display: 'flex', alignItems: 'center', gap: 10 }}>
                <Heart size={20} style={{ color: '#10b981' }} /> Home Care Tips
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
                {result.homeCareTips.map((tip, i) => (
                  <div key={i} className="tip-item" style={{ 
                    display: 'flex', gap: 12, alignItems: 'flex-start', padding: '14px 16px',
                    background: 'rgba(15,23,42,0.4)', borderRadius: 12, border: '1px solid var(--border)',
                    transition: 'all 0.2s ease'
                  }}>
                    <div style={{ width: 22, height: 22, borderRadius: '50%', background: 'rgba(16, 185, 129, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <CheckCircle size={14} style={{ color: '#10b981' }} />
                    </div>
                    <span style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{tip}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Disclaimer */}
          {result.disclaimer && (
            <p style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'center', fontStyle: 'italic', padding: '8px 0' }}>
              ⚠️ {result.disclaimer}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

/* ──────────────────────────────────── HEALTH CHAT ──────────────────────────────────── */

function HealthChat() {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: "Hi! I'm Sanjeevni AI, your personal health assistant. I can answer general health questions, help you understand medical terms, or guide you on when to see a doctor. How can I help you today?" }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    const userMsg = { role: 'user', content: input.trim() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setLoading(true);
    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMessages }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setMessages(prev => [...prev, { role: 'assistant', content: data.reply }]);
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
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 200px)', minHeight: 500 }}>
      <div style={{ marginBottom: 16 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 8 }}>
          <MessageSquare size={20} style={{ color: '#0ea5e9' }} /> AI Health Chat
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
          Chat with Sanjeevni AI for general health guidance and information.
        </p>
      </div>

      {/* Messages */}
      <div className="glass-card" style={{ flex: 1, overflowY: 'auto', padding: 20, marginBottom: 16 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {messages.map((msg, i) => (
            <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', flexDirection: msg.role === 'user' ? 'row-reverse' : 'row' }}>
              <div style={{
                width: 34, height: 34, borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: msg.role === 'user' ? 'linear-gradient(135deg,#0ea5e9,#06b6d4)' : 'rgba(99,102,241,0.2)',
                color: msg.role === 'user' ? 'white' : '#818cf8',
              }}>
                {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
              </div>
              <div style={{
                maxWidth: '78%', padding: '14px 18px', borderRadius: msg.role === 'user' ? '20px 4px 20px 20px' : '4px 20px 20px 20px',
                background: msg.role === 'user' ? 'linear-gradient(135deg,#0ea5e9,#06b6d4)' : 'rgba(30,41,59,0.9)',
                border: msg.role === 'user' ? 'none' : '1px solid var(--border)',
                color: 'white', fontSize: 14, lineHeight: 1.6, whiteSpace: 'pre-wrap',
                boxShadow: msg.role === 'user' ? '0 4px 12px rgba(14, 165, 233, 0.15)' : 'none',
                transition: 'transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                transformOrigin: msg.role === 'user' ? 'right' : 'left'
              }} className="chat-bubble">
                {msg.content}
              </div>
            </div>
          ))}
          {loading && (
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'rgba(99,102,241,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#818cf8' }}>
                <Bot size={16} />
              </div>
              <div style={{ padding: '12px 18px', borderRadius: '4px 18px 18px 18px', background: 'rgba(30,41,59,0.8)', border: '1px solid var(--border)', display: 'flex', gap: 5, alignItems: 'center' }}>
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#0ea5e9', animation: 'pulse 1s infinite' }} />
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#0ea5e9', animation: 'pulse 1s infinite 0.2s' }} />
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#0ea5e9', animation: 'pulse 1s infinite 0.4s' }} />
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>
      </div>

      {/* Input */}
      <div className="glass-card" style={{ padding: '12px 16px', display: 'flex', gap: 10, alignItems: 'flex-end' }}>
        <textarea
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask about symptoms, medications, health tips... (Enter to send)"
          rows={2}
          style={{
            flex: 1, resize: 'none', background: 'transparent', border: 'none', outline: 'none',
            color: 'var(--text-primary)', fontSize: 14, fontFamily: 'inherit', lineHeight: 1.5,
          }}
        />
        <button
          onClick={sendMessage}
          disabled={loading || !input.trim()}
          style={{
            width: 40, height: 40, borderRadius: '50%', border: 'none', cursor: loading || !input.trim() ? 'not-allowed' : 'pointer',
            background: loading || !input.trim() ? 'rgba(51,65,85,0.4)' : 'linear-gradient(135deg,#0ea5e9,#06b6d4)',
            color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'all 0.2s', flexShrink: 0,
          }}
        >
          {loading ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Send size={16} />}
        </button>
      </div>
    </div>
  );
}

/* ──────────────────────────────────── MAIN PAGE ──────────────────────────────────── */

export default function AIAssistantPage() {
  const { user, loading: authLoading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [activeTab, setActiveTab] = useState('symptom-checker');

  useEffect(() => {
    if (authLoading) return;
    if (!user) router.push('/login');
  }, [user, authLoading]);

  if (!user) return null;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', display: 'flex' }}>
      {/* Sidebar */}
      <aside style={{ width: 240, background: 'rgba(15,23,42,0.95)', borderRight: '1px solid var(--border)', padding: '24px 16px', position: 'sticky', top: 0, height: '100vh', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 32, paddingLeft: 8 }}>
          <div style={{ background: 'linear-gradient(135deg,#0ea5e9,#06b6d4)', padding: 7, borderRadius: 9 }}><Stethoscope size={16} color="white" /></div>
          <span style={{ fontWeight: 800, fontSize: 18, background: 'linear-gradient(135deg,#0ea5e9,#06b6d4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Sanjeevni</span>
        </div>
        <div style={{ background: 'rgba(14,165,233,0.1)', border: '1px solid rgba(14,165,233,0.2)', borderRadius: 12, padding: '16px', marginBottom: 24 }}>
          <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'linear-gradient(135deg,#0ea5e9,#06b6d4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 700, color: 'white', marginBottom: 8 }}>
            {user.name?.[0]?.toUpperCase()}
          </div>
          <p style={{ fontWeight: 600, fontSize: 14 }}>{user.name}</p>
          <p style={{ color: 'var(--text-muted)', fontSize: 12 }}>Patient</p>
        </div>
        <nav style={{ flex: 1 }}>
          {[
            { icon: <Calendar size={18} />, label: 'My Appointments', href: '/dashboard/patient' },
            { icon: <Stethoscope size={18} />, label: 'Find Doctors', href: '/doctors' },
            { icon: <Bot size={18} />, label: 'AI Assistant', href: '/dashboard/patient/ai-assistant' },
            { icon: <User size={18} />, label: 'My Profile', href: '/dashboard/patient/profile' },
          ].map((item) => (
            <Link key={item.label} href={item.href} className={`sidebar-link ${pathname === item.href ? 'sidebar-link-active' : ''}`}>
              {item.icon}<span>{item.label}</span>
            </Link>
          ))}
        </nav>
        <button
          onClick={logout}
          onMouseEnter={e => { e.currentTarget.style.background = '#ef4444'; e.currentTarget.style.color = 'white'; e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(239,68,68,0.3)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.1)'; e.currentTarget.style.color = '#ef4444'; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, padding: '12px 14px', borderRadius: 12, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#ef4444', cursor: 'pointer', width: '100%', fontSize: 14, fontWeight: 600, transition: 'all 0.2s ease' }}
        >
          <LogOut size={16} /> Sign Out
        </button>
      </aside>

      {/* Main Content */}
      <main style={{ flex: 1, padding: '32px', overflowY: 'auto' }}>
        {/* Header */}
        <div style={{ marginBottom: 32, position: 'relative' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 8 }}>
            <div style={{ 
              width: 52, height: 52, borderRadius: 16, 
              background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)', 
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 8px 16px rgba(99, 102, 241, 0.3)',
              position: 'relative',
              overflow: 'hidden'
            }}>
              <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at 20% 20%, rgba(255,255,255,0.2) 0%, transparent 50%)' }} />
              <Bot size={28} color="white" style={{ position: 'relative', zIndex: 1 }} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <DecryptedText 
                  text="Sanjeevni AI Assistant"
                  speed={80}
                  maxIterations={15}
                  className="decrypted-title"
                  parentClassName="decrypted-parent"
                  style={{ fontSize: 28, fontWeight: 900, letterSpacing: '-0.02em', background: 'linear-gradient(to right, #fff, #94a3b8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}
                />
                <div style={{ 
                  display: 'flex', alignItems: 'center', gap: 5, padding: '4px 12px', 
                  background: 'rgba(16, 185, 129, 0.1)', borderRadius: 20, border: '1px solid rgba(16, 185, 129, 0.2)' 
                }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981', boxShadow: '0 0 8px #10b981' }} />
                  <ShinyText text="AI LIVE" speed={3} className="status-shiny" style={{ fontSize: 10, fontWeight: 800, color: '#10b981', letterSpacing: '0.8px' }} />
                </div>
              </div>
              <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 2, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Sparkles size={12} style={{ color: '#a855f7' }} /> Powered by Google Gemini · For informational use only
              </p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ 
          display: 'flex', gap: 4, marginBottom: 32, 
          background: 'rgba(15,23,42,0.8)', padding: '6px', borderRadius: 14, 
          width: 'fit-content', border: '1px solid var(--border)',
          boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.3)'
        }}>
          {[
            { id: 'symptom-checker', label: 'Symptom Checker', icon: <Activity size={16} /> },
            { id: 'health-chat', label: 'Health Chat', icon: <MessageSquare size={16} /> },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
              style={{
                display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', borderRadius: 10, border: 'none', cursor: 'pointer',
                fontSize: 14, fontWeight: 700, transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                background: activeTab === tab.id ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
                color: activeTab === tab.id ? '#818cf8' : 'var(--text-muted)',
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              <span style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: 8 }}>
                {tab.icon} {tab.label}
              </span>
              {activeTab === tab.id && (
                <div style={{ position: 'absolute', bottom: 0, left: '20%', right: '20%', height: 2, background: '#818cf8', boxShadow: '0 0 10px #818cf8', borderRadius: '2px 2px 0 0' }} />
              )}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === 'symptom-checker' && <SymptomChecker />}
        {activeTab === 'health-chat' && <HealthChat />}
      </main>

      <style>{`
        @keyframes pulse { 0%,100% { opacity: 0.3; transform: scale(0.8); } 50% { opacity: 1; transform: scale(1); } }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .spin { animation: spin 1s linear infinite; }
        
        .symptom-textarea:focus {
          border-color: #0ea5e9 !important;
          background: rgba(15,23,42,0.9) !important;
          box-shadow: 0 0 0 4px rgba(14, 165, 233, 0.1);
        }
        
        .premium-card:hover {
          transform: translateY(-2px);
          border-color: rgba(14, 165, 233, 0.3) !important;
          box-shadow: 0 12px 30px rgba(0, 0, 0, 0.3) !important;
        }
        
        .condition-card:hover {
          transform: translateX(4px);
          background: rgba(30, 41, 59, 0.8) !important;
          border-color: rgba(14, 165, 233, 0.4) !important;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
        }
        
        .tip-item:hover {
          transform: translateY(-2px);
          background: rgba(16, 185, 129, 0.1) !important;
          border-color: rgba(16, 185, 129, 0.3) !important;
        }
        
        .chat-bubble:hover {
          transform: scale(1.01);
        }
        
        .message-input:focus-within {
          border-color: #0ea5e9 !important;
          box-shadow: 0 0 0 4px rgba(14, 165, 233, 0.1);
        }

        .tab-button:hover:not(.active) {
          background: rgba(99, 102, 241, 0.1) !important;
          color: white !important;
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
