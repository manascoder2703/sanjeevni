'use client';
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Calendar, Video, CheckCircle, XCircle, Clock,
  Users, Sparkles, X, Loader2, Activity, Stethoscope,
  Star, AlertCircle
} from 'lucide-react';
import toast from 'react-hot-toast';
import io from 'socket.io-client';
import { getCallWindowStatus, secondsUntilWindow } from '@/lib/callWindow';

// ─── Helpers ────────────────────────────────────────────────────────────────

function getInitials(name = '') {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

function formatDate(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

const AVATAR_COLORS = [
  { bg: 'rgba(59,130,246,0.2)',  text: '#60a5fa' },
  { bg: 'rgba(139,92,246,0.2)', text: '#a78bfa' },
  { bg: 'rgba(34,197,94,0.2)',  text: '#4ade80' },
  { bg: 'rgba(249,115,22,0.2)', text: '#fb923c' },
  { bg: 'rgba(236,72,153,0.2)', text: '#f472b6' },
  { bg: 'rgba(20,184,166,0.2)', text: '#2dd4bf' },
];

function getAvatarColor(name = '') {
  return AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length];
}

function getStatusStyle(status) {
  switch (status) {
    case 'confirmed': return { label: 'Confirmed', color: '#60a5fa', bg: 'rgba(59,130,246,0.1)',  border: 'rgba(59,130,246,0.2)',  dot: '#60a5fa' };
    case 'pending':   return { label: 'Pending',   color: '#fbbf24', bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.2)', dot: '#fbbf24' };
    case 'completed': return { label: 'Completed', color: '#4ade80', bg: 'rgba(34,197,94,0.1)',  border: 'rgba(34,197,94,0.2)',  dot: '#4ade80' };
    case 'cancelled': return { label: 'Cancelled', color: '#fb7185', bg: 'rgba(244,63,94,0.1)',  border: 'rgba(244,63,94,0.2)',  dot: '#fb7185' };
    case 'rejected':  return { label: 'Rejected',  color: '#f43f5e', bg: 'rgba(244,63,94,0.15)', border: 'rgba(244,63,94,0.3)',  dot: '#f43f5e' };
    default:          return { label: status,      color: 'rgba(255,255,255,0.4)', bg: 'rgba(255,255,255,0.05)', border: 'rgba(255,255,255,0.1)', dot: 'rgba(255,255,255,0.4)' };
  }
}

function formatCountdown(totalSeconds) {
  if (totalSeconds <= 0) return '0m 0s';
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m ${s}s`;
}

// ─── Appointment Row (Today's Schedule) ─────────────────────────────────────

function TodayRow({ apt, onAccept, onReject, onDone, onSummary }) {
  const [windowStatus, setWindowStatus] = useState(getCallWindowStatus(apt));
  const [secondsLeft, setSecondsLeft]   = useState(secondsUntilWindow(apt));

  useEffect(() => {
    if (apt.status !== 'confirmed') return;
    const t = setInterval(() => {
      setWindowStatus(getCallWindowStatus(apt));
      setSecondsLeft(secondsUntilWindow(apt));
    }, 1000);
    return () => clearInterval(t);
  }, [apt]);

  const patName = apt.patientId?.name || 'Patient';
  const { bg, text } = getAvatarColor(patName);
  const { label, color, bg: sBg, border: sBorder, dot } = getStatusStyle(apt.status);

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '14px 20px', background: 'rgba(255,255,255,0.02)', border: '0.5px solid rgba(255,255,255,0.06)', borderRadius: '14px', transition: 'background 0.15s' }}
      onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}
      onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
    >
      <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <span style={{ fontSize: '12px', fontWeight: '700', color: text }}>{getInitials(patName)}</span>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: '13px', fontWeight: '600', color: '#fff', margin: 0 }}>{patName}</p>
        <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', margin: '2px 0 0' }}>{apt.timeSlot} · {apt.patientId?.email || ''}</p>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '4px 10px', borderRadius: '99px', background: sBg, border: `0.5px solid ${sBorder}`, flexShrink: 0 }}>
        <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: dot }} />
        <span style={{ fontSize: '10px', fontWeight: '600', color }}>{label}</span>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
        {apt.status === 'pending' && (
          <>
            <button onClick={() => onAccept(apt._id)}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', borderRadius: '10px', background: 'rgba(34,197,94,0.12)', border: '0.5px solid rgba(34,197,94,0.25)', color: '#4ade80', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>
              <CheckCircle size={13} /> Accept
            </button>
            <button onClick={() => onReject(apt._id)}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 12px', borderRadius: '10px', background: 'rgba(244,63,94,0.08)', border: '0.5px solid rgba(244,63,94,0.15)', color: '#fb7185', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>
              <XCircle size={13} />
            </button>
          </>
        )}
        {apt.status === 'confirmed' && apt.roomId && (
          <>
            {windowStatus === 'open' ? (
              <Link href={`/video/${apt.roomId}`}
                style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', borderRadius: '10px', background: '#3b82f6', color: '#fff', fontSize: '12px', fontWeight: '600', textDecoration: 'none' }}>
                <Video size={13} /> Join
              </Link>
            ) : windowStatus === 'early' ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 12px', borderRadius: '10px', background: 'rgba(255,255,255,0.04)', border: '0.5px solid rgba(255,255,255,0.08)' }}>
                <Clock size={11} style={{ color: 'rgba(255,255,255,0.3)' }} />
                <span style={{ fontSize: '11px', fontWeight: '600', color: 'rgba(255,255,255,0.4)' }}>{formatCountdown(secondsLeft)}</span>
              </div>
            ) : (
              <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.2)' }}>Expired</span>
            )}
            <button onClick={() => onDone(apt._id)}
              style={{ padding: '8px 14px', borderRadius: '10px', background: 'rgba(255,255,255,0.05)', border: '0.5px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.4)', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>
              Done
            </button>
          </>
        )}
        {apt.notes && (
          <button onClick={() => onSummary(apt)}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', borderRadius: '10px', background: 'rgba(139,92,246,0.1)', border: '0.5px solid rgba(139,92,246,0.2)', color: '#a78bfa', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>
            <Sparkles size={12} /> AI
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Main Dashboard ──────────────────────────────────────────────────────────

export default function DoctorDashboard() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading]           = useState(true);
  const [activeTab, setActiveTab]       = useState('pending');
  const [summaryApt, setSummaryApt]     = useState(null);
  const [summaryText, setSummaryText]   = useState('');
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [doctorProfile, setDoctorProfile] = useState(null);
  const [isOnline, setIsOnline]         = useState(false);

  const fetchAppointments = useCallback(async () => {
    try {
      const r = await fetch('/api/appointments');
      const d = await r.json();
      setAppointments(d.appointments || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  const fetchProfile = useCallback(async () => {
    try {
      const r = await fetch('/api/profile/doctor');
      const d = await r.json();
      setDoctorProfile(d.doctor || null);
    } catch (e) { console.error(e); }
  }, []);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.push('/login'); return; }
    fetchAppointments();
    fetchProfile();

    const socket = io(process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001');
    socket.on('connect', () => {
      socket.emit('doctor-online', { userId: user.id });
      setIsOnline(true);
    });
    socket.on('disconnect', () => setIsOnline(false));

    // Refresh appointments when new booking comes in
    socket.on('new-notification', () => fetchAppointments());

    return () => socket.disconnect();
  }, [user, authLoading, fetchAppointments, fetchProfile]);

  const updateStatus = async (id, status) => {
    try {
      await fetch(`/api/appointments/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status }),
      });
      toast.success(status === 'confirmed' ? 'Appointment accepted' : status === 'rejected' ? 'Appointment rejected' : status === 'cancelled' ? 'Appointment cancelled' : 'Marked as done');
      fetchAppointments();
    } catch (e) {
      toast.error('Failed to update status');
    }
  };

  const generateSummary = async (apt) => {
    setSummaryApt(apt);
    setSummaryLoading(true);
    setSummaryText('');
    try {
      const res = await fetch('/api/ai/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
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

  // ── Derived data ──
  const todayDate         = new Date().toISOString().split('T')[0];
  const todayAppointments = appointments.filter(a => a.date === todayDate && a.status !== 'cancelled');
  const pendingApts       = appointments.filter(a => a.status === 'pending');
  const confirmedApts     = appointments.filter(a => a.status === 'confirmed');
  const completedApts     = appointments.filter(a => a.status === 'completed');
  const cancelledApts     = appointments.filter(a => a.status === 'cancelled' || a.status === 'rejected');
  const rejectedOnlyApts  = appointments.filter(a => a.status === 'rejected');

  const tabData = { pending: pendingApts, confirmed: confirmedApts, completed: completedApts, cancelled: cancelledApts };

  const total             = appointments.length;
  const acceptanceRate    = total > 0 ? Math.round(((total - cancelledApts.length) / total) * 100) : 0;
  const completionRate    = total > 0 ? Math.round((completedApts.length / total) * 100) : 0;
  const cancellationRate  = total > 0 ? Math.round((cancelledApts.length / total) * 100) : 0;

  const firstName = user?.name?.split(' ')[0] || 'Doctor';
  const hour      = new Date().getHours();
  const greeting  = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  const tabList = [
    { id: 'pending',   label: 'Pending',   count: pendingApts.length },
    { id: 'confirmed', label: 'Confirmed', count: confirmedApts.length },
    { id: 'completed', label: 'Completed', count: completedApts.length },
    { id: 'cancelled', label: 'Cancelled', count: cancelledApts.length },
  ];

  const card = { background: 'rgba(255,255,255,0.02)', border: '0.5px solid rgba(255,255,255,0.07)', borderRadius: '20px' };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px', width: '100%', paddingBottom: '80px' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: '10px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.2em', color: 'rgba(255,255,255,0.2)', marginBottom: '4px' }}>{greeting}</div>
          <h1 style={{ fontSize: '28px', fontWeight: '900', color: '#fff', letterSpacing: '-0.5px', margin: 0 }}>
            Dr. {firstName} <span style={{ color: 'rgba(255,255,255,0.2)' }}>·</span> <span style={{ color: '#3b82f6' }}>Doctor Portal</span>
          </h1>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', borderRadius: '99px', background: isOnline ? 'rgba(34,197,94,0.1)' : 'rgba(255,255,255,0.04)', border: `0.5px solid ${isOnline ? 'rgba(34,197,94,0.25)' : 'rgba(255,255,255,0.08)'}` }}>
          <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: isOnline ? '#4ade80' : 'rgba(255,255,255,0.2)' }} />
          <span style={{ fontSize: '12px', fontWeight: '600', color: isOnline ? '#4ade80' : 'rgba(255,255,255,0.3)' }}>{isOnline ? 'Online' : 'Offline'}</span>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
        {[
          { label: 'Pending',   value: pendingApts.length,   iconColor: '#fbbf24', iconBg: 'rgba(245,158,11,0.12)',  Icon: Clock },
          { label: 'Confirmed', value: confirmedApts.length, iconColor: '#60a5fa', iconBg: 'rgba(59,130,246,0.12)',  Icon: Calendar },
          { label: 'Completed', value: completedApts.length, iconColor: '#4ade80', iconBg: 'rgba(34,197,94,0.12)',   Icon: CheckCircle },
          { label: 'Total',     value: total,                iconColor: '#a78bfa', iconBg: 'rgba(139,92,246,0.12)',  Icon: Users },
        ].map(stat => (
          <div key={stat.label} style={{ ...card, padding: '20px', display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: stat.iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <stat.Icon size={18} style={{ color: stat.iconColor }} />
            </div>
            <div>
              <div style={{ fontSize: '24px', fontWeight: '800', color: '#fff', lineHeight: 1 }}>{loading ? '—' : stat.value}</div>
              <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: '3px' }}>{stat.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Today + Performance */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px' }}>

        {/* Today's Schedule */}
        <div style={{ ...card, padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '34px', height: '34px', borderRadius: '10px', background: 'rgba(59,130,246,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Stethoscope size={15} style={{ color: '#60a5fa' }} />
              </div>
              <span style={{ fontSize: '15px', fontWeight: '700', color: '#fff' }}>Today's Schedule</span>
            </div>
            <span style={{ fontSize: '10px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.12em', color: 'rgba(255,255,255,0.2)' }}>
              {new Date().toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}
            </span>
          </div>

          {loading ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 0' }}>
              <div className="size-8 border-2 border-blue-500/20 border-t-blue-500 animate-spin rounded-full" />
            </div>
          ) : todayAppointments.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 0', gap: '10px', textAlign: 'center' }}>
              <Calendar size={28} style={{ color: 'rgba(255,255,255,0.1)' }} />
              <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.25)', margin: 0 }}>No appointments today</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {todayAppointments.map(apt => (
                <TodayRow key={apt._id} apt={apt}
                  onAccept={id => updateStatus(id, 'confirmed')}
                  onReject={id => updateStatus(id, 'rejected')}
                  onDone={id => updateStatus(id, 'completed')}
                  onSummary={generateSummary}
                />
              ))}
            </div>
          )}
        </div>

        {/* Performance */}
        <div style={{ ...card, padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '34px', height: '34px', borderRadius: '10px', background: 'rgba(245,158,11,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Activity size={15} style={{ color: '#fbbf24' }} />
            </div>
            <span style={{ fontSize: '15px', fontWeight: '700', color: '#fff' }}>Performance</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {[
              { label: 'Completion rate',   value: completionRate,   color: '#3b82f6' },
              { label: 'Acceptance rate',   value: acceptanceRate,   color: '#4ade80' },
              { label: 'Cancellation rate', value: cancellationRate, color: '#fb7185' },
            ].map(item => (
              <div key={item.label}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)' }}>{item.label}</span>
                  <span style={{ fontSize: '11px', fontWeight: '700', color: '#fff' }}>{item.value}%</span>
                </div>
                <div style={{ height: '4px', background: 'rgba(255,255,255,0.06)', borderRadius: '99px' }}>
                  <div style={{ width: `${item.value}%`, height: '100%', background: item.color, borderRadius: '99px', transition: 'width 0.8s ease' }} />
                </div>
              </div>
            ))}
          </div>

          <div style={{ height: '0.5px', background: 'rgba(255,255,255,0.06)' }} />

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {[
              { label: 'Avg rating',       value: doctorProfile?.rating > 0 ? Number(doctorProfile.rating).toFixed(1) : '—', isRating: true },
              { label: 'Total reviews',    value: doctorProfile?.totalReviews || 0 },
              { label: 'Consultation fee', value: doctorProfile?.fee ? `₹${doctorProfile.fee.toLocaleString()}` : '—' },
              { label: 'Experience',       value: doctorProfile?.experience ? `${doctorProfile.experience} yrs` : '—' },
            ].map(item => (
              <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)' }}>{item.label}</span>
                {item.isRating ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Star size={11} style={{ color: '#fbbf24', fill: '#fbbf24' }} />
                    <span style={{ fontSize: '11px', fontWeight: '700', color: '#fff' }}>{item.value}</span>
                  </div>
                ) : (
                  <span style={{ fontSize: '11px', fontWeight: '700', color: '#fff' }}>{item.value}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Appointment Queue */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', paddingBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '10px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.12em', color: 'rgba(255,255,255,0.2)', whiteSpace: 'nowrap' }}>Appointment Queue</span>
          <div style={{ flex: 1, height: '0.5px', background: 'rgba(255,255,255,0.05)' }} />
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '10px' }}>
          {tabList.map(tab => {
            const isActive = activeTab === tab.id;
            return (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', borderRadius: '12px', fontSize: '13px', fontWeight: '600', border: `0.5px solid ${isActive ? 'rgba(255,255,255,0.14)' : 'rgba(255,255,255,0.07)'}`, background: isActive ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.02)', color: isActive ? '#fff' : 'rgba(255,255,255,0.35)', cursor: 'pointer', transition: 'all 0.2s' }}
                onMouseEnter={e => { if (!isActive) { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = 'rgba(255,255,255,0.6)'; }}}
                onMouseLeave={e => { if (!isActive) { e.currentTarget.style.background = 'rgba(255,255,255,0.02)'; e.currentTarget.style.color = 'rgba(255,255,255,0.35)'; }}}
              >
                {tab.label}
                <span style={{ padding: '2px 7px', borderRadius: '99px', fontSize: '11px', fontWeight: '700', background: isActive ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.05)', color: isActive ? '#fff' : 'rgba(255,255,255,0.3)' }}>
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Table */}
        <div style={{ ...card, overflow: 'hidden' }}>
          {/* Header */}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1.5fr', gap: '16px', padding: '12px 28px', borderBottom: '0.5px solid rgba(255,255,255,0.05)', background: 'rgba(255,255,255,0.01)' }}>
            {['Patient', 'Date', 'Time', 'Status', 'Action'].map((h, i) => (
              <span key={h} style={{ fontSize: '9px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.12em', color: 'rgba(255,255,255,0.2)', textAlign: i === 4 ? 'right' : 'left' }}>{h}</span>
            ))}
          </div>

          {loading ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '60px 0' }}>
              <div className="size-8 border-2 border-blue-500/20 border-t-blue-500 animate-spin rounded-full" />
            </div>
          ) : tabData[activeTab].length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 0', gap: '10px' }}>
              <AlertCircle size={28} style={{ color: 'rgba(255,255,255,0.1)' }} />
              <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.2)', margin: 0 }}>No {activeTab} appointments</p>
            </div>
          ) : (
            tabData[activeTab].map((apt, i) => {
              const patName = apt.patientId?.name || 'Patient';
              const { bg, text } = getAvatarColor(patName);
              const { label, color, bg: sBg, border: sBorder, dot } = getStatusStyle(apt.status);
              const [wStatus, setWStatus] = useState ? getCallWindowStatus(apt) : 'not-confirmed';

              return (
                <div key={apt._id}
                  style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1.5fr', gap: '16px', padding: '18px 28px', alignItems: 'center', borderBottom: i !== tabData[activeTab].length - 1 ? '0.5px solid rgba(255,255,255,0.04)' : 'none', transition: 'background 0.15s' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
                    <div style={{ width: '34px', height: '34px', borderRadius: '50%', background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <span style={{ fontSize: '11px', fontWeight: '700', color: text }}>{getInitials(patName)}</span>
                    </div>
                    <p style={{ fontSize: '13px', fontWeight: '600', color: '#fff', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{patName}</p>
                  </div>

                  <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>{formatDate(apt.date)}</span>
                  <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>{apt.timeSlot || '—'}</span>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '4px 10px', borderRadius: '99px', background: sBg, border: `0.5px solid ${sBorder}`, width: 'fit-content' }}>
                    <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: dot }} />
                    <span style={{ fontSize: '10px', fontWeight: '600', color }}>{label}</span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                    {apt.status === 'pending' && (
                      <>
                        <button onClick={() => updateStatus(apt._id, 'confirmed')}
                          style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '7px 14px', borderRadius: '8px', background: 'rgba(34,197,94,0.12)', border: '0.5px solid rgba(34,197,94,0.25)', color: '#4ade80', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>
                          <CheckCircle size={12} /> Accept
                        </button>
                        <button onClick={() => updateStatus(apt._id, 'cancelled')}
                          style={{ display: 'flex', alignItems: 'center', padding: '7px 10px', borderRadius: '8px', background: 'rgba(244,63,94,0.08)', border: '0.5px solid rgba(244,63,94,0.15)', color: '#fb7185', cursor: 'pointer' }}>
                          <XCircle size={12} />
                        </button>
                      </>
                    )}
                    {apt.status === 'confirmed' && apt.roomId && (
                      <QueueJoinButton apt={apt} onDone={() => updateStatus(apt._id, 'completed')} />
                    )}
                    {(apt.status === 'completed' || apt.status === 'cancelled') && (
                      <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.2)' }}>—</span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* AI Summary Modal */}
      {summaryApt && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '24px' }}>
          <div style={{ background: '#0a0b0d', border: '0.5px solid rgba(139,92,246,0.3)', borderRadius: '24px', padding: '36px', maxWidth: '580px', width: '100%', position: 'relative' }}>
            <button onClick={() => setSummaryApt(null)}
              style={{ position: 'absolute', top: '20px', right: '20px', background: 'rgba(255,255,255,0.05)', border: 'none', borderRadius: '8px', padding: '8px', cursor: 'pointer', color: 'rgba(255,255,255,0.4)' }}>
              <X size={18} />
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '24px' }}>
              <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'rgba(139,92,246,0.15)', border: '0.5px solid rgba(139,92,246,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Sparkles size={20} style={{ color: '#a78bfa' }} />
              </div>
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#fff', margin: 0 }}>AI Brief</h3>
                <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.3)', margin: '2px 0 0' }}>Patient: {summaryApt.patientId?.name}</p>
              </div>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.02)', borderRadius: '16px', padding: '24px', border: '0.5px solid rgba(255,255,255,0.06)', minHeight: '160px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {summaryLoading ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                  <Loader2 size={32} className="animate-spin" style={{ color: '#a78bfa' }} />
                  <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.2)', textTransform: 'uppercase', letterSpacing: '0.12em', margin: 0 }}>Analysing...</p>
                </div>
              ) : (
                <p style={{ fontSize: '15px', color: 'rgba(255,255,255,0.85)', lineHeight: 1.7, margin: 0 }}>{summaryText}</p>
              )}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '16px', padding: '12px 16px', background: 'rgba(244,63,94,0.05)', borderRadius: '12px', border: '0.5px solid rgba(244,63,94,0.1)' }}>
              <AlertCircle size={14} style={{ color: '#fb7185', flexShrink: 0 }} />
              <p style={{ fontSize: '11px', color: 'rgba(251,113,133,0.6)', margin: 0 }}>AI-generated. Cross-reference with clinical data.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Separate component for join button in queue table to handle countdown
function QueueJoinButton({ apt, onDone }) {
  const [windowStatus, setWindowStatus] = useState(getCallWindowStatus(apt));
  const [secondsLeft, setSecondsLeft]   = useState(secondsUntilWindow(apt));

  useEffect(() => {
    const t = setInterval(() => {
      setWindowStatus(getCallWindowStatus(apt));
      setSecondsLeft(secondsUntilWindow(apt));
    }, 1000);
    return () => clearInterval(t);
  }, [apt]);

  return (
    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
      {windowStatus === 'open' ? (
        <Link href={`/video/${apt.roomId}`}
          style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '7px 14px', borderRadius: '8px', background: '#3b82f6', color: '#fff', fontSize: '12px', fontWeight: '600', textDecoration: 'none' }}>
          <Video size={12} /> Join
        </Link>
      ) : windowStatus === 'early' ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '7px 10px', borderRadius: '8px', background: 'rgba(255,255,255,0.04)', border: '0.5px solid rgba(255,255,255,0.08)' }}>
          <Clock size={11} style={{ color: 'rgba(255,255,255,0.3)' }} />
          <span style={{ fontSize: '11px', fontWeight: '600', color: 'rgba(255,255,255,0.4)' }}>{formatCountdown(secondsLeft)}</span>
        </div>
      ) : (
        <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.2)' }}>Expired</span>
      )}
      <button onClick={onDone}
        style={{ padding: '7px 12px', borderRadius: '8px', background: 'rgba(255,255,255,0.04)', border: '0.5px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.4)', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>
        Done
      </button>
    </div>
  );
}