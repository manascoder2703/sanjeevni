'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { Calendar, Video, CheckCircle, XCircle, Clock, Stethoscope, LogOut, Users, User, Sparkles, X, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import io from 'socket.io-client';

import { getCallWindowStatus, secondsUntilWindow } from '@/lib/callWindow';

function AppointmentRow({ apt, updateStatus, showSummary }) {
  const [windowStatus, setWindowStatus] = useState(getCallWindowStatus(apt));
  const [secondsLeft, setSecondsLeft] = useState(secondsUntilWindow(apt));

  useEffect(() => {
    if (apt.status !== 'confirmed') return;

    const timer = setInterval(() => {
      const status = getCallWindowStatus(apt);
      setWindowStatus(status);
      setSecondsLeft(secondsUntilWindow(apt));
    }, 1000);

    return () => clearInterval(timer);
  }, [apt]);

  const patName = apt.patientId?.name || 'Patient';
  const statusClass = { pending: 'badge-pending', confirmed: 'badge-confirmed', completed: 'badge-completed', cancelled: 'badge-cancelled' }[apt.status];

  const formatCountdown = (totalSeconds) => {
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    
    if (hrs > 0) {
      return `${hrs}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }
    return `${mins}:${String(secs).padStart(2, '0')}`;
  };

  return (
    <div key={apt._id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', background: 'rgba(15,23,42,0.5)', borderRadius: 12, border: '1px solid var(--border)', flexWrap: 'wrap', gap: 12 }}>
      <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
        <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'rgba(14,165,233,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: 'var(--accent)', fontSize: 16 }}>{patName[0]?.toUpperCase()}</div>
        <div>
          <p style={{ fontWeight: 600, marginBottom: 2 }}>{patName}</p>
          <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>{apt.date} · {apt.timeSlot}</p>
        </div>
      </div>
      <span className={`badge ${statusClass}`}>{apt.status}</span>
      <div style={{ display: 'flex', gap: 8 }}>
        {apt.status === 'pending' && (
          <>
            <button className="btn-primary" onClick={() => updateStatus(apt._id, 'confirmed')} style={{ padding: '8px 14px', fontSize: 13, gap: 6 }}><CheckCircle size={14} /> Confirm</button>
            <button className="btn-secondary" onClick={() => updateStatus(apt._id, 'cancelled')} style={{ padding: '8px 14px', fontSize: 13, color: '#ef4444' }}><XCircle size={14} /></button>
          </>
        )}
        {apt.status === 'confirmed' && apt.roomId && (
          <>
            {windowStatus === 'open' ? (
              <Link href={`/video/${apt.roomId}`} className="btn-primary" style={{ textDecoration: 'none', padding: '8px 14px', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Video size={14} /> Join Call
              </Link>
            ) : windowStatus === 'early' ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                <button className="btn-primary" disabled style={{ opacity: 0.5, cursor: 'not-allowed', padding: '8px 14px', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Video size={14} /> Join Call
                </button>
                <span style={{ fontSize: 11, color: '#f59e0b', fontWeight: 600, padding: '2px 8px', background: 'rgba(245,158,11,0.1)', borderRadius: 6 }}>
                  Opens in {formatCountdown(secondsLeft)}
                </span>
              </div>
            ) : (
              <button disabled style={{ background: 'rgba(51,65,85,0.4)', color: 'var(--text-muted)', cursor: 'not-allowed', border: 'none', padding: '8px 14px', borderRadius: 8, fontSize: 13 }}>
                Session ended
              </button>
            )}
            <button className="btn-secondary" onClick={() => updateStatus(apt._id, 'completed')} style={{ padding: '8px 14px', fontSize: 13 }}>Mark Done</button>
          </>
        )}
        {apt.notes && (
          <button 
            className="btn-secondary" 
            onClick={() => showSummary(apt)} 
            style={{ padding: '8px 14px', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6, borderColor: 'var(--accent)', color: 'var(--accent)' }}
          >
            <Sparkles size={14} /> AI Summary
          </button>
        )}
      </div>
    </div>
  );
}

export default function DoctorDashboard() {
  const { user, loading: authLoading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [summaryApt, setSummaryApt] = useState(null);
  const [summaryText, setSummaryText] = useState('');
  const [summaryLoading, setSummaryLoading] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.push('/login'); return; }
    fetch('/api/appointments').then(r => r.json()).then(d => { setAppointments(d.appointments || []); setLoading(false); });

    // Connect to socket and mark doctor as online
    const socket = io(process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001');
    socket.on('connect', () => {
      console.log('📡 Connected to socket, marking online...');
      socket.emit('doctor-online', { userId: user.id });
    });

    return () => {
      socket.disconnect();
    };
  }, [user, authLoading]);

  const updateStatus = async (id, status) => {
    await fetch(`/api/appointments/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) });
    toast.success(`Appointment ${status}`);
    const res = await fetch('/api/appointments');
    const data = await res.json();
    setAppointments(data.appointments || []);
  };

  const generateSummary = async (apt) => {
    setSummaryApt(apt);
    setSummaryLoading(true);
    setSummaryText('');
    try {
      const res = await fetch('/api/ai/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: apt.notes, patientName: apt.patientId?.name }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSummaryText(data.summary);
    } catch (e) {
      toast.error(e.message || 'Failed to generate summary');
      setSummaryApt(null);
    } finally {
      setSummaryLoading(false);
    }
  };

  const pendingCount = appointments.filter(a => a.status === 'pending').length;
  const confirmedCount = appointments.filter(a => a.status === 'confirmed').length;
  const completedCount = appointments.filter(a => a.status === 'completed').length;

  if (!user) return null;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', display: 'flex' }}>
      <aside style={{ width: 240, background: 'rgba(15,23,42,0.95)', borderRight: '1px solid var(--border)', padding: '24px 16px', position: 'sticky', top: 0, height: '100vh', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 32, paddingLeft: 8 }}>
          <div style={{ background: 'linear-gradient(135deg,#0ea5e9,#06b6d4)', padding: 7, borderRadius: 9 }}><Stethoscope size={16} color="white" /></div>
          <span style={{ fontWeight: 800, fontSize: 18, background: 'linear-gradient(135deg,#0ea5e9,#06b6d4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Sanjeevni</span>
        </div>
        <div style={{ background: 'rgba(14,165,233,0.1)', border: '1px solid rgba(14,165,233,0.2)', borderRadius: 12, padding: 16, marginBottom: 24 }}>
          <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'linear-gradient(135deg,#0ea5e9,#06b6d4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 700, color: 'white', marginBottom: 8 }}>
            {user.name?.[0]?.toUpperCase()}
          </div>
          <p style={{ fontWeight: 600, fontSize: 14 }}>Dr. {user.name}</p>
          <p style={{ color: 'var(--text-muted)', fontSize: 12 }}>Doctor</p>
        </div>
        <nav style={{ flex: 1 }}>
          {[
            { icon: <Stethoscope size={18} />, label: 'Dashboard', href: '/dashboard/doctor' },
            { icon: <User size={18} />, label: 'My Profile', href: '/dashboard/doctor/profile' },
          ].map((item) => (
            <Link 
              key={item.label} 
              href={item.href} 
              className={`sidebar-link ${pathname === item.href ? 'sidebar-link-active' : ''}`}
            >
              {item.icon}<span>{item.label}</span>
            </Link>
          ))}
        </nav>
        <button 
          onClick={logout} 
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#ef4444';
            e.currentTarget.style.color = 'white';
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(239,68,68,0.3)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(239,68,68,0.1)';
            e.currentTarget.style.color = '#ef4444';
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = 'none';
          }}
          style={{ 
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, 
            padding: '12px 14px', borderRadius: 12, 
            background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', 
            color: '#ef4444', cursor: 'pointer', width: '100%', fontSize: 14, fontWeight: 600,
            transition: 'all 0.2s ease'
          }}
        >
          <LogOut size={16} /> Sign Out
        </button>
      </aside>

      <main style={{ flex: 1, padding: '32px', overflowY: 'auto' }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 4 }}>Doctor Dashboard</h1>
        <p style={{ color: 'var(--text-muted)', marginBottom: 32 }}>Manage your appointments and consultations</p>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 16, marginBottom: 32 }}>
          {[
            { label: 'Pending', value: pendingCount, color: '#f59e0b', icon: <Clock size={20} /> },
            { label: 'Confirmed', value: confirmedCount, color: '#0ea5e9', icon: <Calendar size={20} /> },
            { label: 'Completed', value: completedCount, color: '#10b981', icon: <CheckCircle size={20} /> },
            { label: 'Total', value: appointments.length, color: '#06b6d4', icon: <Users size={20} /> },
          ].map((s, i) => (
            <div key={i} className="glass-card" style={{ padding: 20, display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ background: `${s.color}20`, padding: 10, borderRadius: 10, color: s.color }}>{s.icon}</div>
              <div>
                <p style={{ fontSize: 26, fontWeight: 800, color: s.color }}>{s.value}</p>
                <p style={{ color: 'var(--text-muted)', fontSize: 12 }}>{s.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Appointment List */}
        <div className="glass-card" style={{ padding: 24 }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 20 }}>Patient Appointments</h2>
          {loading ? <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 40 }}>Loading...</p>
            : appointments.length === 0 ? <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 40 }}>No appointments yet.</p>
            : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {appointments.map(apt => (
                  <AppointmentRow key={apt._id} apt={apt} updateStatus={updateStatus} showSummary={generateSummary} />
                ))}
              </div>
            )}
        </div>

        {/* AI Summary Modal */}
        {summaryApt && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }}>
            <div className="glass-card" style={{ maxWidth: 600, width: '100%', padding: 24, position: 'relative', border: '1px solid var(--accent)' }}>
              <button onClick={() => setSummaryApt(null)} style={{ position: 'absolute', top: 16, right: 16, background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><X size={20} /></button>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                <div style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', padding: 8, borderRadius: 10 }}><Sparkles size={18} color="white" /></div>
                <div>
                  <h3 style={{ fontSize: 18, fontWeight: 700 }}>AI Clinical Summary</h3>
                  <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Patient: {summaryApt.patientId?.name}</p>
                </div>
              </div>

              <div style={{ minHeight: 120, background: 'rgba(15,23,42,0.5)', borderRadius: 12, padding: 16, border: '1px solid var(--border)', fontSize: 14, lineHeight: 1.6, color: 'var(--text-secondary)', whiteSpace: 'pre-wrap' }}>
                {summaryLoading ? (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 100, gap: 12 }}>
                    <Loader2 size={24} className="spin" style={{ color: 'var(--accent)' }} />
                    <p style={{ color: 'var(--text-muted)' }}>Generating clinical summary...</p>
                  </div>
                ) : (
                  summaryText
                )}
              </div>
              
              <p style={{ fontSize: 11, color: 'rgba(239,68,68,0.7)', marginTop: 16, textAlign: 'center' }}>
                ⚠️ This summary is AI-generated for informational purposes. Please review original notes for accuracy.
              </p>
            </div>
          </div>
        )}
      </main>
      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .spin { animation: spin 1s linear infinite; }
      `}</style>
    </div>
  );
}
