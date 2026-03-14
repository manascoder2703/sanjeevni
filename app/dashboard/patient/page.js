'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { Calendar, Video, Clock, User, LogOut, Stethoscope, CheckCircle, XCircle, Bot } from 'lucide-react';
import toast from 'react-hot-toast';
import { getCallWindowStatus, secondsUntilWindow, parseLegacyDateTime } from '@/lib/callWindow';

export default function PatientDashboard() {
  const { user, loading: authLoading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('upcoming');

  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.push('/login'); return; }
    fetchAppointments();
  }, [user, authLoading]);

  const fetchAppointments = async () => {
    const res = await fetch('/api/appointments');
    const data = await res.json();
    setAppointments(data.appointments || []);
    setLoading(false);
  };

  const cancelAppointment = async (id) => {
    await fetch(`/api/appointments/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 'cancelled' }) });
    toast.success('Appointment cancelled');
    fetchAppointments();
  };

  const today = new Date().toISOString().split('T')[0];
  const now = new Date();

  const isPast = (a) => {
    if (a.status === 'completed') return true;
    if (a.date < today) return true;
    if (a.date === today) {
      if (a.status === 'confirmed' && getCallWindowStatus(a) === 'expired') return true;
      if (a.status !== 'confirmed') {
        const scheduledTime = a.scheduledDateTime 
          ? new Date(a.scheduledDateTime) 
          : parseLegacyDateTime(a.date, a.timeSlot);
        const expiresAt = new Date(scheduledTime.getTime() + 180 * 60000);
        if (now > expiresAt) return true;
      }
    }
    return false;
  };

  const upcoming = appointments.filter(a => !isPast(a) && a.status !== 'cancelled');
  const past = appointments.filter(a => isPast(a) && a.status !== 'cancelled');
  const cancelledApts = appointments.filter(a => a.status === 'cancelled');
  
  let shown = upcoming;
  if (activeTab === 'past') shown = past;
  if (activeTab === 'cancelled') shown = cancelledApts;

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

      {/* Main */}
      <main style={{ flex: 1, padding: '32px', overflowY: 'auto' }}>
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontSize: 28, fontWeight: 800 }}>Good day, {user.name?.split(' ')[0]}! 👋</h1>
          <p style={{ color: 'var(--text-muted)', marginTop: 4 }}>{new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginBottom: 32 }}>
          {[
            { label: 'Upcoming', value: upcoming.length, color: '#0ea5e9', icon: <Calendar size={20} /> },
            { label: 'Completed', value: appointments.filter(a => a.status === 'completed').length, color: '#10b981', icon: <CheckCircle size={20} /> },
            { label: 'Total Booked', value: appointments.length, color: '#06b6d4', icon: <Clock size={20} /> },
          ].map((s, i) => (
            <div key={i} className="glass-card" style={{ padding: 20, display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ background: `${s.color}20`, padding: 12, borderRadius: 12, color: s.color }}>{s.icon}</div>
              <div>
                <p style={{ fontSize: 28, fontWeight: 800, color: s.color }}>{s.value}</p>
                <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>{s.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Appointments */}
        <div className="glass-card" style={{ padding: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <h2 style={{ fontSize: 20, fontWeight: 700 }}>Appointments</h2>
            <div style={{ display: 'flex', gap: 8 }}>
              {['upcoming', 'past', 'cancelled'].map(tab => (
                <button key={tab} onClick={() => setActiveTab(tab)} style={{
                  padding: '7px 16px', borderRadius: 8, border: 'none', cursor: 'pointer', fontWeight: 500, fontSize: 13, transition: 'all 0.2s', textTransform: 'capitalize',
                  background: activeTab === tab ? 'linear-gradient(135deg,#0ea5e9,#06b6d4)' : 'rgba(51,65,85,0.4)',
                  color: activeTab === tab ? 'white' : 'var(--text-muted)',
                }}>{tab}</button>
              ))}
            </div>
          </div>
          {loading ? <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 40 }}>Loading...</p>
            : shown.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
                <Calendar size={40} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
                <p>No appointments found.</p>
                <Link href="/doctors" className="btn-primary" style={{ display: 'inline-flex', textDecoration: 'none', marginTop: 16 }}>Book Now</Link>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {shown.map((apt) => (
                  <AppointmentRow key={apt._id} apt={apt} onCancel={cancelAppointment} />
                ))}
              </div>
            )}
        </div>
      </main>
    </div>
  );
}



function AppointmentRow({ apt, onCancel }) {
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

  const doctorName = apt.doctorId?.userId?.name || 'Doctor';
  const specialty = apt.doctorId?.specialization || '';
  const statusClass = { pending: 'badge-pending', confirmed: 'badge-confirmed', completed: 'badge-completed', cancelled: 'badge-cancelled' }[apt.status] || 'badge-pending';

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
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', background: 'rgba(15,23,42,0.5)', borderRadius: 12, border: '1px solid var(--border)', flexWrap: 'wrap', gap: 12 }}>
      <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
        <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'linear-gradient(135deg,#0ea5e9,#06b6d4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 700, color: 'white', flexShrink: 0 }}>
          {doctorName[0]?.toUpperCase()}
        </div>
        <div>
          <p style={{ fontWeight: 600, marginBottom: 2 }}>Dr. {doctorName}</p>
          <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>{specialty}</p>
        </div>
      </div>
      <div style={{ textAlign: 'center' }}>
        <p style={{ fontWeight: 600, fontSize: 14 }}>{new Date(apt.date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}</p>
        <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>{apt.timeSlot}</p>
      </div>
      <span className={`badge ${statusClass}`}>{apt.status}</span>
      <div style={{ display: 'flex', gap: 8 }}>
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
          </>
        )}
        {apt.status === 'pending' && (
          <button className="btn-secondary" onClick={() => onCancel(apt._id)} style={{ fontSize: 13, padding: '8px 14px', color: '#ef4444', borderColor: 'rgba(239,68,68,0.3)' }}>Cancel</button>
        )}
      </div>
    </div>
  );
}
