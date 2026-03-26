'use client';
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import {
  CalendarDays, Video, Clock, CheckCircle2, XCircle,
  Activity, Users, Zap, Calendar, AlertCircle, Star, Loader2
} from 'lucide-react';
import { useNotifications } from '@/context/NotificationContext';
import toast from 'react-hot-toast';
import PatientCalendar from '@/components/PatientCalendar';

function getInitials(name = '') {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

function formatDate(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function getStatusConfig(status) {
  switch (status) {
    case 'confirmed': return { label: 'Confirmed', color: '#4ade80', bg: 'rgba(34,197,94,0.1)',  border: 'rgba(34,197,94,0.2)',  dot: '#4ade80' };
    case 'pending':   return { label: 'Pending',   color: '#fbbf24', bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.2)', dot: '#fbbf24' };
    case 'completed': return { label: 'Completed', color: '#60a5fa', bg: 'rgba(59,130,246,0.1)', border: 'rgba(59,130,246,0.2)', dot: '#60a5fa' };
    case 'cancelled': return { label: 'Cancelled', color: '#fb7185', bg: 'rgba(244,63,94,0.1)',  border: 'rgba(244,63,94,0.2)',  dot: '#fb7185' };
    case 'rejected':  return { label: 'Rejected',  color: '#f43f5e', bg: 'rgba(244,63,94,0.15)', border: 'rgba(244,63,94,0.3)',  dot: '#f43f5e' };
    default:          return { label: status,      color: 'rgba(255,255,255,0.4)', bg: 'rgba(255,255,255,0.05)', border: 'rgba(255,255,255,0.1)', dot: 'rgba(255,255,255,0.4)' };
  }
}

function getJoinState(appointment) {
  if (appointment.status !== 'confirmed') {
    return { show: false, countdown: null };
  }
  let scheduled;
  if (appointment.scheduledDateTime) {
    scheduled = new Date(appointment.scheduledDateTime);
  } else if (appointment.date && appointment.timeSlot) {
    const slot = appointment.timeSlot.trim();
    let hours, minutes;
    if (slot.includes('AM') || slot.includes('PM')) {
      const [time, modifier] = slot.split(' ');
      [hours, minutes] = time.split(':').map(Number);
      if (hours === 12) hours = 0;
      if (modifier === 'PM') hours += 12;
    } else {
      [hours, minutes] = slot.split(':').map(Number);
    }
    scheduled = new Date(`${appointment.date}T${String(hours).padStart(2,'0')}:${String(minutes||0).padStart(2,'0')}:00`);
  } else {
    return { show: false, countdown: null };
  }
  const now = new Date();
  const diffMs = scheduled - now;
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin > 10) {
    const h = Math.floor(diffMin / 60);
    const m = diffMin % 60;
    return { show: false, countdown: h > 0 ? (m > 0 ? `${h}h ${m}m` : `${h}h`) : `${diffMin}m` };
  }
  if (diffMs >= -3600000) return { show: true, countdown: null };
  return { show: false, countdown: null };
}

export default function PatientDashboard() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('active');
  const [reviewApt, setReviewApt] = useState(null);
  const [reviewForm, setReviewForm] = useState({ doctorRating: 0, platformRating: 0, comment: '' });
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewedIds, setReviewedIds] = useState(new Set());
  const [height, setHeight] = useState(175);
  const [weight, setWeight] = useState(70);

  const fetchAppointments = useCallback(async () => {
    try {
      const res = await fetch('/api/appointments?t=' + Date.now(), { cache: 'no-store', credentials: 'include' });
      const data = await res.json();
      setAppointments(data.appointments || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  const submitReview = async () => {
    if (reviewForm.doctorRating === 0 || reviewForm.platformRating === 0) {
      toast.error('Please provide both ratings');
      return;
    }
    setSubmittingReview(true);
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          appointmentId: reviewApt._id,
          ...reviewForm
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to submit review');
      toast.success('Thank you for your feedback!');
      setReviewedIds(prev => new Set([...prev, String(reviewApt._id)]));      setReviewApt(null);
      setReviewForm({ doctorRating: 0, platformRating: 0, comment: '' });
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSubmittingReview(false);
    }
  };

  const { lastRatingUpdate } = useNotifications();

  // Real-time rating update listener
  useEffect(() => {
    if (lastRatingUpdate && appointments.length > 0) {
      setAppointments(prev => prev.map(appt => {
        if (appt.doctorId?._id === lastRatingUpdate.doctorId) {
          return {
            ...appt,
            doctorId: {
              ...appt.doctorId,
              rating: lastRatingUpdate.rating,
              totalReviews: lastRatingUpdate.totalReviews
            }
          };
        }
        return appt;
      }));
    }
  }, [lastRatingUpdate]);

  useEffect(() => { fetchAppointments(); }, [fetchAppointments]);

  const todayDate = new Date().toISOString().split('T')[0];
  const todayAppointments     = appointments.filter(a => a.date === todayDate && a.status !== 'cancelled');
  const upcomingAppointments  = appointments.filter(a => a.date > todayDate && a.status !== 'cancelled').sort((a, b) => new Date(a.date) - new Date(b.date)).slice(0, 3);
  const activeAppointments    = appointments.filter(a => ['pending', 'confirmed'].includes(a.status));
  const pastAppointments      = appointments.filter(a => a.status === 'completed' || (a.status !== 'cancelled' && a.date < todayDate));
  const cancelledAppointments = appointments.filter(a => ['cancelled', 'rejected'].includes(a.status));
  const tabData = { active: activeAppointments, past: pastAppointments, cancelled: cancelledAppointments };

  const total          = appointments.length;
  const completed      = appointments.filter(a => a.status === 'completed').length;
  const doctorsVisited = new Set(appointments.map(a => a.doctorId?._id || a.doctorId)).size;
  const bmiValue       = (weight / ((height / 100) ** 2)).toFixed(1);
  const firstName      = user?.name?.split(' ')[0] || 'Patient';
  const hour           = new Date().getHours();
  const greeting       = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  const tabList = [
    { id: 'active',    label: 'Active',    icon: CheckCircle2, count: activeAppointments.length },
    { id: 'past',      label: 'Past',      icon: Clock,        count: pastAppointments.length },
    { id: 'cancelled', label: 'Cancelled', icon: XCircle,      count: cancelledAppointments.length },
  ];

  // Premium Neon Card Style handled by 'neon-glass-card' CSS class

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', width: '100%', paddingBottom: '80px' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <span style={{ fontSize: '10px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.2em', color: '#94a3b8' }}>{greeting}</span>
          <h1 style={{ fontSize: '30px', fontWeight: '900', color: '#fff', letterSpacing: '-0.5px', margin: 0 }}>
            {firstName} <span style={{ color: 'rgba(255,255,255,0.2)' }}>·</span> <span style={{ color: '#22d3ee' }}>Patient Portal</span>
          </h1>
        </div>
        <Link href="/dashboard/patient/doctors" style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 28px', borderRadius: '99px', border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.03)', color: '#fff', fontSize: '14px', fontWeight: '600', textDecoration: 'none', transition: 'all 0.2s' }}
          onMouseEnter={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.color = '#000'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; e.currentTarget.style.color = '#fff'; }}>
          <Zap size={15} /> Find a Doctor
        </Link>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
        {[
          { label: 'Total Consultations', value: total,             icon: CalendarDays, iconColor: '#3b82f6',  iconBg: 'rgba(59,130,246,0.2)' },
          { label: 'Completed',           value: completed,         icon: CheckCircle2, iconColor: '#10b981',  iconBg: 'rgba(16,185,129,0.2)' },
          { label: 'Doctors Visited',     value: doctorsVisited,    icon: Users,        iconColor: '#8b5cf6',  iconBg: 'rgba(139,92,246,0.2)' },
          { label: 'BMI Score',           value: bmiValue,          icon: Activity,     iconColor: '#f59e0b',  iconBg: 'rgba(245,158,11,0.2)' },
        ].map(stat => (
          <div key={stat.label} className="neon-glass-card obsidian-card" style={{ padding: '32px 40px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div style={{ width: '52px', height: '52px', borderRadius: '14px', background: stat.iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <stat.icon size={22} style={{ color: stat.iconColor }} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'center' }}>
              <span style={{ fontSize: '32px', fontWeight: '900', color: '#fff', letterSpacing: '-1px', lineHeight: 1 }}>{loading ? '—' : stat.value}</span>
              <span style={{ fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.12em', color: 'rgba(255,255,255,0.2)', fontWeight: '700' }}>{stat.label}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Today + Health Score */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px' }}>

        {/* Today */}
        <div className="neon-glass-card obsidian-card" style={{ padding: '32px 40px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(59,130,246,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CalendarDays size={16} style={{ color: '#60a5fa' }} />
              </div>
              <span style={{ fontSize: '15px', fontWeight: '700', color: '#fff' }}>Today's Appointments</span>
            </div>
            <span style={{ fontSize: '10px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.15em', color: 'rgba(255,255,255,0.2)' }}>
              {new Date().toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}
            </span>
          </div>

          {loading ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '60px 0' }}>
              <div className="size-8 border-2 border-blue-500/20 border-t-blue-500 animate-spin rounded-full" />
            </div>
          ) : todayAppointments.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 0', gap: '12px', textAlign: 'center' }}>
              <div style={{ width: '52px', height: '52px', borderRadius: '50%', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CalendarDays size={22} style={{ color: 'rgba(255,255,255,0.1)' }} />
              </div>
              <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '14px', fontWeight: '600', margin: 0 }}>No appointments today</p>
              <Link href="/dashboard/patient/doctors" style={{ color: '#60a5fa', fontSize: '12px', fontWeight: '700', textDecoration: 'none' }}>Book one now →</Link>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {todayAppointments.map(appt => {
                const docName = appt.doctorId?.userId?.name || 'Doctor';
                const { label, color, bg, border, dot } = getStatusConfig(appt.status);
                const joinState = getJoinState(appt);
                return (
                  <div key={appt._id} style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '16px 20px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '16px' }}>
                    <div style={{ width: '42px', height: '42px', borderRadius: '50%', background: 'rgba(59,130,246,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <span style={{ fontSize: '12px', fontWeight: '700', color: '#60a5fa' }}>{getInitials(docName)}</span>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <p style={{ fontSize: '15px', fontWeight: '800', color: '#f8fafc', margin: 0 }}>Dr. {docName}</p>
                        {appt.doctorId?.rating > 0 && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '3px', padding: '2px 8px', background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.25)', borderRadius: '8px' }}>
                            <Star size={10} style={{ color: '#fbbf24', fill: '#fbbf24' }} />
                            <span style={{ fontSize: '10px', fontWeight: '800', color: '#fbbf24' }}>{Number(appt.doctorId.rating).toFixed(1)}</span>
                          </div>
                        )}
                      </div>
                      <p style={{ fontSize: '12px', fontWeight: '600', color: '#94a3b8', margin: '3px 0 0' }}>{appt.doctorId?.specialization || 'Specialist'} · {appt.timeSlot}</p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '4px 12px', borderRadius: '99px', background: bg, border: `1px solid ${border}`, flexShrink: 0 }}>
                      <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: dot, flexShrink: 0 }} />
                      <span style={{ fontSize: '10px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.08em', color }}>{label}</span>
                    </div>
                    {joinState.show ? (
                      <Link href={`/video/${appt.roomId}`} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', borderRadius: '10px', background: '#3b82f6', color: '#fff', fontSize: '12px', fontWeight: '700', textDecoration: 'none', flexShrink: 0 }}>
                        <Video size={12} /> Join
                      </Link>
                    ) : joinState.countdown ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 12px', borderRadius: '10px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', flexShrink: 0 }}>
                        <Clock size={11} style={{ color: 'rgba(255,255,255,0.3)' }} />
                        <span style={{ fontSize: '10px', fontWeight: '700', color: 'rgba(255,255,255,0.4)' }}>{joinState.countdown}</span>
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Obsidian Appointment Calendar (Replaced BMI Calculator) */}
        <PatientCalendar appointments={appointments} />
      </div>

      {/* Upcoming */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <span style={{ fontSize: '10px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.12em', color: 'rgba(255,255,255,0.2)', whiteSpace: 'nowrap' }}>Upcoming</span>
          <div style={{ flex: 1, height: '0.5px', background: 'rgba(255,255,255,0.05)' }} />
        </div>
        {upcomingAppointments.length === 0 ? (
          <div style={{ padding: '40px', background: 'rgba(255,255,255,0.01)', border: '1px dashed rgba(255,255,255,0.06)', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.2)', fontSize: '12px', fontWeight: '600', fontStyle: 'italic' }}>
            No future sessions scheduled
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
            {upcomingAppointments.map(appt => {
              const docName = appt.doctorId?.userId?.name || 'Doctor';
              const { label, color, bg, border, dot } = getStatusConfig(appt.status);
              return (
                <div key={appt._id} className="neon-glass-card obsidian-card" style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(139,92,246,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <span style={{ fontSize: '12px', fontWeight: '700', color: '#a78bfa' }}>{getInitials(docName)}</span>
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <p style={{ fontSize: '13px', fontWeight: '700', color: '#fff', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>Dr. {docName}</p>
                      <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', margin: '2px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{appt.doctorId?.specialization || 'Specialist'}</p>
                    </div>
                  </div>
                  <div style={{ height: '0.5px', background: 'rgba(255,255,255,0.05)' }} />
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>
                      <Calendar size={11} style={{ color: 'rgba(59,130,246,0.5)' }} /> {formatDate(appt.date)}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>
                      <Clock size={11} style={{ color: 'rgba(59,130,246,0.5)' }} /> {appt.timeSlot}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '4px 10px', borderRadius: '99px', background: 'transparent', border: `1px solid ${border}`, width: 'fit-content' }}>
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: dot }} />
                    <span style={{ fontSize: '10px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.08em', color }}>{label}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Consultation Log */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', paddingBottom: '40px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <span style={{ fontSize: '10px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.12em', color: 'rgba(255,255,255,0.2)', whiteSpace: 'nowrap' }}>Consultation Log</span>
          <div style={{ flex: 1, height: '0.5px', background: 'rgba(255,255,255,0.05)' }} />
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '12px' }}>
          {tabList.map(tab => {
            const isActive = activeTab === tab.id;
            return (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 24px', borderRadius: '12px', fontSize: '14px', fontWeight: '600', border: `1px solid ${isActive ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.1)'}`, background: isActive ? 'rgba(255,255,255,0.08)' : 'transparent', color: isActive ? '#fff' : 'rgba(255,255,255,0.35)', cursor: 'pointer', transition: 'all 0.2s' }}
                onMouseEnter={e => { if (!isActive) { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'; e.currentTarget.style.color = 'rgba(255,255,255,0.7)'; }}}
                onMouseLeave={e => { if (!isActive) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = 'rgba(255,255,255,0.35)'; }}}
              >
                <tab.icon size={15} />
                {tab.label}
                <span style={{ padding: '2px 8px', borderRadius: '99px', fontSize: '12px', fontWeight: '700', background: isActive ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.05)', color: isActive ? '#fff' : 'rgba(255,255,255,0.3)' }}>
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Table */}
        <div className="neon-glass-card obsidian-card" style={{ overflow: 'hidden' }}>
          {/* Header */}
          <div style={{ display: 'grid', gridTemplateColumns: '2.5fr 1.2fr 1.4fr 1fr 1.4fr 1.2fr', gap: '16px', padding: '14px 32px', borderBottom: '0.5px solid rgba(255,255,255,0.05)', background: 'transparent' }}>
            {['Doctor', 'Specialty', 'Date', 'Time', 'Status', 'Action'].map((h, i) => (
              <span key={h} style={{ fontSize: '9px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.12em', color: 'rgba(255,255,255,0.2)', textAlign: i === 5 ? 'right' : 'left' }}>{h}</span>
            ))}
          </div>

          {loading ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '60px 0' }}>
              <div className="size-8 border-2 border-blue-500/20 border-t-blue-500 animate-spin rounded-full" />
            </div>
          ) : tabData[activeTab].length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 0', gap: '12px' }}>
              <AlertCircle size={28} style={{ color: 'rgba(255,255,255,0.1)' }} />
              <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: '14px', fontWeight: '600', margin: 0 }}>No {activeTab} appointments</p>
            </div>
          ) : (
            tabData[activeTab].map((appt, i) => {
              const docName = appt.doctorId?.userId?.name || 'Doctor';
              const spec    = appt.doctorId?.specialization || 'Specialist';
              const { label, color, bg, border, dot } = getStatusConfig(appt.status);
              const joinState = getJoinState(appt);
              const isReviewed = appt.isReviewed || reviewedIds.has(String(appt._id));
              return (
                <div key={appt._id}
                  style={{ display: 'grid', gridTemplateColumns: '2.5fr 1.2fr 1.4fr 1fr 1.4fr 1.2fr', gap: '16px', padding: '20px 32px', alignItems: 'center', borderBottom: i !== tabData[activeTab].length - 1 ? '0.5px solid rgba(255,255,255,0.04)' : 'none', transition: 'background 0.15s' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  {/* Doctor */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
                    <div style={{ width: '38px', height: '38px', borderRadius: '50%', background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <span style={{ fontSize: '11px', fontWeight: '700', color: '#60a5fa' }}>{getInitials(docName)}</span>
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <p style={{ fontSize: '13px', fontWeight: '600', color: '#fff', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>Dr. {docName}</p>
                        {appt.doctorId?.rating > 0 && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '3px', flexShrink: 0 }}>
                            <Star size={9} style={{ color: '#fbbf24', fill: '#fbbf24' }} />
                            <span style={{ fontSize: '10px', fontWeight: '700', color: '#fbbf24' }}>{Number(appt.doctorId.rating).toFixed(1)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', fontWeight: '500', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{spec}</span>
                  <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', fontWeight: '500' }}>{formatDate(appt.date)}</span>
                  <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', fontWeight: '500' }}>{appt.timeSlot || '—'}</span>

                  {/* Status */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '4px 12px', borderRadius: '99px', background: bg, border: `1px solid ${border}`, width: 'fit-content' }}>
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: dot, flexShrink: 0 }} />
                    <span style={{ fontSize: '10px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.08em', color }}>{label}</span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                    {joinState.show ? (
                      <Link href={`/video/${appt.roomId}`}
                        style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', borderRadius: '8px', background: '#3b82f6', color: '#fff', fontSize: '12px', fontWeight: '600', textDecoration: 'none' }}>
                        <Video size={11} /> Join
                      </Link>
                    ) : isReviewed ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#4ade80', fontSize: '11px', fontWeight: '700' }}>
                         <CheckCircle2 size={12} /> Reviewed
                      </div>
                    ) : appt.status === 'completed' ? (
                      <button onClick={() => setReviewApt(appt)}
                        style={{ padding: '8px 16px', borderRadius: '8px', background: 'rgba(255,255,255,0.06)', border: '0.5px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: '11px', fontWeight: '700', cursor: 'pointer', transition: 'all 0.2s' }}
                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}
                      >
                         Rate & Review
                      </button>
                    ) : joinState.countdown ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 12px', borderRadius: '8px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
                        <Clock size={11} style={{ color: 'rgba(255,255,255,0.3)' }} />
                        <span style={{ fontSize: '10px', fontWeight: '600', color: 'rgba(255,255,255,0.4)' }}>{joinState.countdown}</span>
                      </div>
                    ) : (
                      <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.2)' }}>—</span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Review Modal */}
      {reviewApt && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(12px)' }}>
           <div style={{ width: '100%', maxWidth: '540px', background: '#0a0b0d', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '32px', padding: '40px', display: 'flex', flexDirection: 'column', gap: '32px', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '2px', background: 'linear-gradient(90deg, #3b82f6, #60a5fa, #3b82f6)' }}></div>
              
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '12px' }}>
                 <div style={{ width: '64px', height: '64px', borderRadius: '20px', background: 'rgba(255, 215, 0, 0.1)', border: '1px solid rgba(255, 215, 0, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFD700', marginBottom: '8px' }}>
                    <Star size={32} style={{ fill: '#FFEB3B' }} />
                 </div>
                 <h2 style={{ fontSize: '24px', fontWeight: '900', color: '#fff', margin: 0, textTransform: 'uppercase', letterSpacing: '-0.5px' }}>Rate your Experience</h2>
                 <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.4)', fontWeight: '500', margin: 0 }}>Consultation with Dr. {reviewApt.doctorId?.userId?.name || 'Doctor'}</p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                 {/* Ratings */}
                 <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <RatingField 
                      label="Doctor Quality" 
                      value={reviewForm.doctorRating} 
                      onChange={v => setReviewForm(f => ({ ...f, doctorRating: v }))} 
                      icon={Activity}
                    />
                    <RatingField 
                      label="Platform Exp." 
                      value={reviewForm.platformRating} 
                      onChange={v => setReviewForm(f => ({ ...f, platformRating: v }))} 
                      icon={Zap}
                    />
                 </div>

                 {/* Comment */}
                 <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <label style={{ fontSize: '10px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.15em', color: 'rgba(255,255,255,0.2)', paddingLeft: '4px' }}>Descriptive Thoughts</label>
                    <textarea 
                      placeholder="Share your thoughts about the consultation..." 
                      style={{ width: '100%', minHeight: '120px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '16px', color: '#fff', fontSize: '14px', outline: 'none', resize: 'none', transition: 'border-color 0.2s' }}
                      onFocus={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'}
                      onBlur={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'}
                      value={reviewForm.comment}
                      onChange={e => setReviewForm(f => ({ ...f, comment: e.target.value }))}
                    />
                 </div>

                 <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                    <button onClick={() => setReviewApt(null)}
                      style={{ flex: 1, padding: '16px', borderRadius: '16px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.4)', fontSize: '14px', fontWeight: '700', cursor: 'pointer', transition: 'all 0.2s' }}
                      onMouseEnter={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.color = '#000'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.color = 'rgba(255,255,255,0.4)'; }}
                    >
                       Cancel
                    </button>
                    <button onClick={submitReview} disabled={submittingReview}
                      style={{ flex: 2, padding: '16px', borderRadius: '16px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: '14px', fontWeight: '700', cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}
                      onMouseEnter={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.color = '#000'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.color = '#fff'; }}
                    >
                       {submittingReview ? <Loader2 className="animate-spin" size={18} /> : 'Submit Feedback'}
                    </button>
                 </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}

function BMICalculator({ height, setHeight, weight, setWeight }) {
  const bmi = (weight / ((height / 100) ** 2)).toFixed(1);
  
  const getCategory = (val) => {
    if (val < 18.5) return { label: 'Underweight', color: '#fbbf24', bg: 'rgba(245,158,11,0.1)' };
    if (val < 25) return { label: 'Healthy', color: '#4ade80', bg: 'rgba(34,197,94,0.1)' };
    if (val < 30) return { label: 'Overweight', color: '#f97316', bg: 'rgba(249,115,22,0.1)' };
    return { label: 'Obese', color: '#ef4444', bg: 'rgba(239,68,68,0.1)' };
  };

  const cat = getCategory(parseFloat(bmi));

  return (
    <div className="neon-glass-card obsidian-card" style={{ padding: '32px 40px', display: 'flex', flexDirection: 'column', gap: '24px', border: '1px solid rgba(255, 255, 255, 0.2)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(59,130,246,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Activity size={16} style={{ color: '#60a5fa' }} />
        </div>
        <span style={{ fontSize: '15px', fontWeight: '700', color: '#fff' }}>BMI Calculator</span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* Height Slider */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '11px', fontWeight: '600', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>Height</span>
            <span style={{ fontSize: '14px', fontWeight: '800', color: '#fff' }}>{height} <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)' }}>cm</span></span>
          </div>
          <input 
            type="range" min="100" max="220" value={height} 
            onChange={(e) => setHeight(parseInt(e.target.value))}
            style={{ width: '100%', height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px', appearance: 'none', cursor: 'pointer', outline: 'none' }}
          />
        </div>

        {/* Weight Slider */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '11px', fontWeight: '600', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>Weight</span>
            <span style={{ fontSize: '14px', fontWeight: '800', color: '#fff' }}>{weight} <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)' }}>kg</span></span>
          </div>
          <input 
            type="range" min="30" max="150" value={weight} 
            onChange={(e) => setWeight(parseInt(e.target.value))}
            style={{ width: '100%', height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px', appearance: 'none', cursor: 'pointer', outline: 'none' }}
          />
        </div>
      </div>

      {/* BMI Display Card */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px', background: 'transparent', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '24px', padding: '24px', marginTop: '8px' }}>
         <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: '48px', fontWeight: '900', color: '#fff', letterSpacing: '-2px', lineHeight: 1 }}>{bmi}</span>
            <div style={{ position: 'absolute', bottom: '-15px', padding: '4px 12px', borderRadius: '99px', background: 'transparent', border: `1px solid ${cat.color}33` }}>
               <span style={{ fontSize: '10px', fontWeight: '800', color: cat.color, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{cat.label}</span>
            </div>
         </div>
         <div style={{ width: '100%', height: '6px', background: 'linear-gradient(90deg, #fbbf24 0%, #4ade80 30%, #4ade80 50%, #f97316 70%, #ef4444 100%)', borderRadius: '99px', position: 'relative', marginTop: '12px' }}>
            <div style={{ position: 'absolute', top: '-4px', left: `${Math.min(100, Math.max(0, (parseFloat(bmi) - 15) * 3.33))}%`, width: '14px', height: '14px', background: '#fff', border: '3px solid #000', borderRadius: '50%', transform: 'translateX(-50%)', transition: 'left 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)' }} />
         </div>
      </div>
    </div>
  );
}

function RatingField({ label, value, onChange, icon: Icon }) {
  return (
    <div style={{ background: 'transparent', border: 'none', borderRadius: '20px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
       <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Icon size={12} style={{ color: 'rgba(255,255,255,0.3)' }} />
          <span style={{ fontSize: '9px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(255,255,255,0.2)' }}>{label}</span>
       </div>
       <div style={{ display: 'flex', gap: '6px' }}>
          {[1,2,3,4,5].map(star => (
            <button key={star} onClick={() => onChange(star === 1 && value === 1 ? 0 : star)}
              style={{ width: '32px', height: '32px', borderRadius: '8px', background: star <= value ? 'rgba(255, 215, 0, 0.15)' : 'rgba(255,255,255,0.03)', border: `1px solid ${star <= value ? 'rgba(255, 215, 0, 0.3)' : 'rgba(255,255,255,0.05)'}`, color: star <= value ? '#FFD700' : 'rgba(255,255,255,0.15)', cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
               <Star size={14} style={{ fill: star <= value ? '#FFEB3B' : 'none' }} />
            </button>
          ))}
       </div>
    </div>
  );
}