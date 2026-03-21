'use client';
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import {
  Users, Stethoscope, Calendar, Clock,
  CheckCircle, XCircle, AlertCircle, Star,
  ChevronUp, ChevronDown, Save, X
} from 'lucide-react';
import toast from 'react-hot-toast';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getInitials(name = '') {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '?';
}

function formatDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

const AVATAR_COLORS = [
  { bg: 'rgba(59,130,246,0.2)',  text: '#60a5fa' },
  { bg: 'rgba(139,92,246,0.2)', text: '#a78bfa' },
  { bg: 'rgba(34,197,94,0.2)',  text: '#4ade80' },
  { bg: 'rgba(249,115,22,0.2)', text: '#fb923c' },
  { bg: 'rgba(236,72,153,0.2)', text: '#f472b6' },
  { bg: 'rgba(20,184,166,0.2)', text: '#2dd4bf' },
];
function avatarColor(name = '') {
  return AVATAR_COLORS[(name.charCodeAt(0) || 0) % AVATAR_COLORS.length];
}

function getStatusStyle(status) {
  switch (status) {
    case 'confirmed': return { label: 'Confirmed', color: '#60a5fa', bg: 'rgba(59,130,246,0.1)',  border: 'rgba(59,130,246,0.2)',  dot: '#60a5fa' };
    case 'pending':   return { label: 'Pending',   color: '#fbbf24', bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.2)', dot: '#fbbf24' };
    case 'completed': return { label: 'Completed', color: '#4ade80', bg: 'rgba(34,197,94,0.1)',  border: 'rgba(34,197,94,0.2)',  dot: '#4ade80' };
    case 'cancelled': return { label: 'Cancelled', color: '#fb7185', bg: 'rgba(244,63,94,0.1)',  border: 'rgba(244,63,94,0.2)',  dot: '#fb7185' };
    default:          return { label: status,      color: 'rgba(255,255,255,0.4)', bg: 'rgba(255,255,255,0.05)', border: 'rgba(255,255,255,0.1)', dot: 'rgba(255,255,255,0.4)' };
  }
}

const card = { background: 'rgba(255,255,255,0.02)', border: '0.5px solid rgba(255,255,255,0.07)', borderRadius: '20px' };

function inp(extra = {}) {
  return {
    style: {
      width: '100%', background: 'rgba(255,255,255,0.03)',
      border: '0.5px solid rgba(255,255,255,0.08)', borderRadius: '10px',
      padding: '10px 14px', fontSize: '13px', color: '#fff', outline: 'none',
      boxSizing: 'border-box', transition: 'border-color 0.15s', ...extra,
    },
    onFocus: e => e.target.style.borderColor = 'rgba(59,130,246,0.5)',
    onBlur:  e => e.target.style.borderColor = 'rgba(255,255,255,0.08)',
  };
}

// ─── Edit Doctor Modal ─────────────────────────────────────────────────────────
function EditDoctorModal({ doctor, onClose, onSave }) {
  const [form, setForm] = useState({
    specialization: doctor.specialization || '',
    fee:            doctor.fee || '',
    experience:     doctor.experience || '',
    hospital:       doctor.hospital || '',
    bio:            doctor.bio || '',
    isApproved:     doctor.isApproved || false,
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/admin', {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ doctorId: doctor._id, updates: { ...form, fee: Number(form.fee), experience: Number(form.experience) } }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      toast.success('Doctor updated');
      onSave();
      onClose();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '24px' }}>
      <div style={{ background: '#0a0b0d', border: '0.5px solid rgba(255,255,255,0.1)', borderRadius: '24px', padding: '32px', maxWidth: '520px', width: '100%', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#fff', margin: 0 }}>Edit Doctor</h3>
            <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.3)', margin: '3px 0 0' }}>Dr. {doctor.userId?.name}</p>
          </div>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.05)', border: 'none', borderRadius: '8px', padding: '8px', cursor: 'pointer', color: 'rgba(255,255,255,0.4)' }}>
            <X size={16} />
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
          {[
            { label: 'Specialization', key: 'specialization' },
            { label: 'Hospital', key: 'hospital' },
            { label: 'Fee (₹)', key: 'fee', type: 'number' },
            { label: 'Experience (yrs)', key: 'experience', type: 'number' },
          ].map(f => (
            <div key={f.key}>
              <label style={{ fontSize: '11px', fontWeight: '600', color: 'rgba(255,255,255,0.3)', display: 'block', marginBottom: '6px' }}>{f.label}</label>
              <input {...inp()} type={f.type || 'text'} value={form[f.key]} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))} />
            </div>
          ))}
          <div style={{ gridColumn: 'span 2' }}>
            <label style={{ fontSize: '11px', fontWeight: '600', color: 'rgba(255,255,255,0.3)', display: 'block', marginBottom: '6px' }}>Bio</label>
            <textarea {...inp({ resize: 'none', minHeight: '80px' })} value={form.bio} onChange={e => setForm(p => ({ ...p, bio: e.target.value }))} />
          </div>
          <div style={{ gridColumn: 'span 2' }}>
            <label style={{ fontSize: '11px', fontWeight: '600', color: 'rgba(255,255,255,0.3)', display: 'block', marginBottom: '8px' }}>Approval Status</label>
            <div style={{ display: 'flex', gap: '8px' }}>
              {[true, false].map(v => (
                <button key={String(v)} type="button" onClick={() => setForm(p => ({ ...p, isApproved: v }))}
                  style={{ flex: 1, padding: '10px', borderRadius: '10px', fontSize: '12px', fontWeight: '600', border: `0.5px solid ${form.isApproved === v ? (v ? 'rgba(34,197,94,0.4)' : 'rgba(244,63,94,0.4)') : 'rgba(255,255,255,0.08)'}`, background: form.isApproved === v ? (v ? 'rgba(34,197,94,0.12)' : 'rgba(244,63,94,0.08)') : 'rgba(255,255,255,0.02)', color: form.isApproved === v ? (v ? '#4ade80' : '#fb7185') : 'rgba(255,255,255,0.3)', cursor: 'pointer', transition: 'all 0.15s' }}>
                  {v ? 'Approved' : 'Not Approved'}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
          <button onClick={onClose} style={{ flex: 1, padding: '12px', borderRadius: '12px', background: 'rgba(255,255,255,0.04)', border: '0.5px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.4)', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>
            Cancel
          </button>
          <button onClick={handleSave} disabled={saving}
            style={{ flex: 2, padding: '12px', borderRadius: '12px', background: '#3b82f6', border: 'none', color: '#fff', fontSize: '13px', fontWeight: '600', cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.6 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
            <Save size={14} />
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────
export default function AdminDashboard() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [stats, setStats]           = useState(null);
  const [allDoctors, setAllDoctors] = useState([]);
  const [allPatients, setAllPatients] = useState([]);
  const [allApts, setAllApts]       = useState([]);
  const [loading, setLoading]       = useState(true);
  const [activeTab, setActiveTab]   = useState('pending');
  const [editDoctor, setEditDoctor] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      const [statsRes, doctorsRes, patientsRes, aptsRes] = await Promise.all([
        fetch('/api/admin', { credentials: 'include' }),
        fetch('/api/admin?type=doctors', { credentials: 'include' }),
        fetch('/api/admin?type=patients', { credentials: 'include' }),
        fetch('/api/admin?type=appointments', { credentials: 'include' }),
      ]);
      const [statsData, doctorsData, patientsData, aptsData] = await Promise.all([
        statsRes.json(), doctorsRes.json(), patientsRes.json(), aptsRes.json(),
      ]);
      setStats(statsData);
      setAllDoctors(doctorsData.doctors || []);
      setAllPatients(patientsData.patients || []);
      setAllApts(aptsData.appointments || []);
    } catch {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleApprove = async (doctorId, action) => {
    try {
      await fetch('/api/admin', {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ doctorId, action }),
      });
      toast.success(action === 'approve' ? 'Doctor approved' : 'Doctor rejected');
      fetchData();
    } catch {
      toast.error('Failed to update');
    }
  };

  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.push('/login'); return; }
    if (user.role !== 'admin') { router.push('/'); return; }
    fetchData();
  }, [user, authLoading, router, fetchData]);

  if (!user || user.role !== 'admin') return null;

  const pendingDoctors = allDoctors.filter(d => !d.isApproved);
  const approvedDoctors = allDoctors.filter(d => d.isApproved);

  const tabList = [
    { id: 'pending',      label: 'Pending Approvals', count: pendingDoctors.length,   urgent: true },
    { id: 'doctors',      label: 'All Doctors',        count: allDoctors.length },
    { id: 'patients',     label: 'All Patients',       count: allPatients.length },
    { id: 'appointments', label: 'Appointments',       count: allApts.length },
  ];

  const tableHeader = (cols) => (
    <div style={{ display: 'grid', gridTemplateColumns: cols, gap: '16px', padding: '12px 28px', borderBottom: '0.5px solid rgba(255,255,255,0.05)', background: 'rgba(255,255,255,0.01)' }}>
      {['Doctor','Specialization','Fee','Status','Action'].map((h, i) => (
        <span key={h} style={{ fontSize: '9px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.12em', color: 'rgba(255,255,255,0.2)', textAlign: i === 4 ? 'right' : 'left' }}>{h}</span>
      ))}
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px', width: '100%', paddingBottom: '80px' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: '10px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.2em', color: 'rgba(255,255,255,0.2)', marginBottom: '4px' }}>System Administrator</div>
          <h1 style={{ fontSize: '26px', fontWeight: '900', color: '#fff', letterSpacing: '-0.5px', margin: 0 }}>Admin Dashboard</h1>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 14px', borderRadius: '99px', background: 'rgba(59,130,246,0.1)', border: '0.5px solid rgba(59,130,246,0.2)' }}>
          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#60a5fa' }} />
          <span style={{ fontSize: '11px', fontWeight: '600', color: '#60a5fa' }}>Admin Access</span>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
        {[
          { label: 'Total Users',        value: stats?.totalUsers || 0,        iconColor: '#60a5fa', iconBg: 'rgba(59,130,246,0.12)',  Icon: Users },
          { label: 'Approved Doctors',   value: stats?.totalDoctors || 0,      iconColor: '#4ade80', iconBg: 'rgba(34,197,94,0.12)',   Icon: Stethoscope },
          { label: 'Appointments',       value: stats?.totalAppointments || 0, iconColor: '#a78bfa', iconBg: 'rgba(139,92,246,0.12)',  Icon: Calendar },
          { label: 'Pending Approvals',  value: stats?.pendingDoctors || 0,    iconColor: '#fbbf24', iconBg: 'rgba(245,158,11,0.12)', Icon: Clock, highlight: true },
        ].map(s => (
          <div key={s.label} style={{ ...card, padding: '20px', display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: s.iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <s.Icon size={18} style={{ color: s.iconColor }} />
            </div>
            <div>
              <div style={{ fontSize: '24px', fontWeight: '800', color: s.highlight ? '#fbbf24' : '#fff', lineHeight: 1 }}>
                {loading ? '—' : s.value}
              </div>
              <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: '3px' }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '10px' }}>
        {tabList.map(tab => {
          const isActive = activeTab === tab.id;
          return (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', borderRadius: '12px', fontSize: '13px', fontWeight: '600', border: `0.5px solid ${isActive ? 'rgba(255,255,255,0.14)' : 'rgba(255,255,255,0.07)'}`, background: isActive ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.02)', color: isActive ? '#fff' : 'rgba(255,255,255,0.35)', cursor: 'pointer', transition: 'all 0.2s' }}>
              {tab.label}
              <span style={{ padding: '2px 7px', borderRadius: '99px', fontSize: '11px', fontWeight: '700', background: tab.urgent ? 'rgba(245,158,11,0.15)' : isActive ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.05)', color: tab.urgent ? '#fbbf24' : isActive ? '#fff' : 'rgba(255,255,255,0.3)' }}>
                {loading ? '—' : tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Table */}
      <div style={{ ...card, overflow: 'hidden' }}>

        {/* ── Pending Approvals ── */}
        {activeTab === 'pending' && (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.2fr 1fr 1fr 1.5fr', gap: '16px', padding: '12px 28px', borderBottom: '0.5px solid rgba(255,255,255,0.05)', background: 'rgba(255,255,255,0.01)' }}>
              {['Doctor', 'Specialization', 'Fee', 'Experience', 'Action'].map((h, i) => (
                <span key={h} style={{ fontSize: '9px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.12em', color: 'rgba(255,255,255,0.2)', textAlign: i === 4 ? 'right' : 'left' }}>{h}</span>
              ))}
            </div>
            {loading ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '60px 0' }}>
                <div className="size-8 border-2 border-blue-500/20 border-t-blue-500 animate-spin rounded-full" />
              </div>
            ) : pendingDoctors.length === 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 0', gap: '12px' }}>
                <CheckCircle size={28} style={{ color: 'rgba(34,197,94,0.3)' }} />
                <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: '14px', fontWeight: '600', margin: 0 }}>No pending approvals</p>
              </div>
            ) : pendingDoctors.map((doc, i) => {
              const name = doc.userId?.name || 'Unknown';
              const { bg, text } = avatarColor(name);
              return (
                <div key={doc._id} style={{ display: 'grid', gridTemplateColumns: '2fr 1.2fr 1fr 1fr 1.5fr', gap: '16px', padding: '18px 28px', alignItems: 'center', borderBottom: i !== pendingDoctors.length - 1 ? '0.5px solid rgba(255,255,255,0.04)' : 'none', transition: 'background 0.15s' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
                    <div style={{ width: '34px', height: '34px', borderRadius: '50%', background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <span style={{ fontSize: '11px', fontWeight: '700', color: text }}>{getInitials(name)}</span>
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <p style={{ fontSize: '13px', fontWeight: '600', color: '#fff', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>Dr. {name}</p>
                      <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', margin: '2px 0 0' }}>{doc.userId?.email}</p>
                    </div>
                  </div>
                  <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>{doc.specialization}</span>
                  <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>₹{doc.fee?.toLocaleString() || '—'}</span>
                  <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>{doc.experience ? `${doc.experience} yrs` : '—'}</span>
                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                    <button onClick={() => handleApprove(doc._id, 'approve')}
                      style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '7px 14px', borderRadius: '8px', background: 'rgba(34,197,94,0.12)', border: '0.5px solid rgba(34,197,94,0.25)', color: '#4ade80', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>
                      <CheckCircle size={12} /> Approve
                    </button>
                    <button onClick={() => handleApprove(doc._id, 'reject')}
                      style={{ display: 'flex', alignItems: 'center', padding: '7px 10px', borderRadius: '8px', background: 'rgba(244,63,94,0.08)', border: '0.5px solid rgba(244,63,94,0.15)', color: '#fb7185', cursor: 'pointer' }}>
                      <XCircle size={12} />
                    </button>
                  </div>
                </div>
              );
            })}
          </>
        )}

        {/* ── All Doctors ── */}
        {activeTab === 'doctors' && (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.2fr 1fr 1fr 1fr 1.2fr', gap: '16px', padding: '12px 28px', borderBottom: '0.5px solid rgba(255,255,255,0.05)', background: 'rgba(255,255,255,0.01)' }}>
              {['Doctor', 'Specialization', 'Fee', 'Rating', 'Status', 'Action'].map((h, i) => (
                <span key={h} style={{ fontSize: '9px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.12em', color: 'rgba(255,255,255,0.2)', textAlign: i === 5 ? 'right' : 'left' }}>{h}</span>
              ))}
            </div>
            {loading ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '60px 0' }}>
                <div className="size-8 border-2 border-blue-500/20 border-t-blue-500 animate-spin rounded-full" />
              </div>
            ) : allDoctors.length === 0 ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '60px 0' }}>
                <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: '14px', fontWeight: '600', margin: 0 }}>No doctors found</p>
              </div>
            ) : allDoctors.map((doc, i) => {
              const name = doc.userId?.name || 'Unknown';
              const { bg, text } = avatarColor(name);
              const isApproved = doc.isApproved;
              return (
                <div key={doc._id} style={{ display: 'grid', gridTemplateColumns: '2fr 1.2fr 1fr 1fr 1fr 1.2fr', gap: '16px', padding: '18px 28px', alignItems: 'center', borderBottom: i !== allDoctors.length - 1 ? '0.5px solid rgba(255,255,255,0.04)' : 'none', transition: 'background 0.15s' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
                    <div style={{ width: '34px', height: '34px', borderRadius: '50%', background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <span style={{ fontSize: '11px', fontWeight: '700', color: text }}>{getInitials(name)}</span>
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <p style={{ fontSize: '13px', fontWeight: '600', color: '#fff', margin: 0 }}>Dr. {name}</p>
                      <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', margin: '2px 0 0' }}>{doc.userId?.email}</p>
                    </div>
                  </div>
                  <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>{doc.specialization}</span>
                  <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>₹{doc.fee?.toLocaleString() || '—'}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Star size={11} style={{ color: '#fbbf24', fill: '#fbbf24' }} />
                    <span style={{ fontSize: '12px', color: '#fff', fontWeight: '600' }}>{doc.rating > 0 ? Number(doc.rating).toFixed(1) : '—'}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '4px 10px', borderRadius: '99px', background: isApproved ? 'rgba(34,197,94,0.1)' : 'rgba(245,158,11,0.1)', border: `0.5px solid ${isApproved ? 'rgba(34,197,94,0.2)' : 'rgba(245,158,11,0.2)'}`, width: 'fit-content' }}>
                    <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: isApproved ? '#4ade80' : '#fbbf24' }} />
                    <span style={{ fontSize: '10px', fontWeight: '600', color: isApproved ? '#4ade80' : '#fbbf24' }}>{isApproved ? 'Approved' : 'Pending'}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <button onClick={() => setEditDoctor(doc)}
                      style={{ padding: '7px 14px', borderRadius: '8px', background: 'rgba(59,130,246,0.1)', border: '0.5px solid rgba(59,130,246,0.2)', color: '#60a5fa', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>
                      Edit
                    </button>
                  </div>
                </div>
              );
            })}
          </>
        )}

        {/* ── All Patients ── */}
        {activeTab === 'patients' && (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.5fr 1fr 1fr', gap: '16px', padding: '12px 28px', borderBottom: '0.5px solid rgba(255,255,255,0.05)', background: 'rgba(255,255,255,0.01)' }}>
              {['Patient', 'Email', 'Blood Group', 'Joined'].map(h => (
                <span key={h} style={{ fontSize: '9px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.12em', color: 'rgba(255,255,255,0.2)' }}>{h}</span>
              ))}
            </div>
            {loading ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '60px 0' }}>
                <div className="size-8 border-2 border-blue-500/20 border-t-blue-500 animate-spin rounded-full" />
              </div>
            ) : allPatients.length === 0 ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '60px 0' }}>
                <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: '14px', fontWeight: '600', margin: 0 }}>No patients found</p>
              </div>
            ) : allPatients.map((pat, i) => {
              const { bg, text } = avatarColor(pat.name || '');
              return (
                <div key={pat._id} style={{ display: 'grid', gridTemplateColumns: '2fr 1.5fr 1fr 1fr', gap: '16px', padding: '18px 28px', alignItems: 'center', borderBottom: i !== allPatients.length - 1 ? '0.5px solid rgba(255,255,255,0.04)' : 'none', transition: 'background 0.15s' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
                    <div style={{ width: '34px', height: '34px', borderRadius: '50%', background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      {pat.avatar ? (
                        <img src={pat.avatar} alt={pat.name} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                      ) : (
                        <span style={{ fontSize: '11px', fontWeight: '700', color: text }}>{getInitials(pat.name)}</span>
                      )}
                    </div>
                    <p style={{ fontSize: '13px', fontWeight: '600', color: '#fff', margin: 0 }}>{pat.name || '—'}</p>
                  </div>
                  <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{pat.email}</span>
                  <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>{pat.bloodGroup || '—'}</span>
                  <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>{formatDate(pat.createdAt)}</span>
                </div>
              );
            })}
          </>
        )}

        {/* ── All Appointments ── */}
        {activeTab === 'appointments' && (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1.5fr 1.2fr 1fr 1fr', gap: '16px', padding: '12px 28px', borderBottom: '0.5px solid rgba(255,255,255,0.05)', background: 'rgba(255,255,255,0.01)' }}>
              {['Patient', 'Doctor', 'Date', 'Time', 'Status'].map(h => (
                <span key={h} style={{ fontSize: '9px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.12em', color: 'rgba(255,255,255,0.2)' }}>{h}</span>
              ))}
            </div>
            {loading ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '60px 0' }}>
                <div className="size-8 border-2 border-blue-500/20 border-t-blue-500 animate-spin rounded-full" />
              </div>
            ) : allApts.length === 0 ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '60px 0' }}>
                <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: '14px', fontWeight: '600', margin: 0 }}>No appointments found</p>
              </div>
            ) : allApts.map((apt, i) => {
              const { label, color, bg, border, dot } = getStatusStyle(apt.status);
              const patName = apt.patientId?.name || 'Patient';
              const docName = apt.doctorId?.userId?.name || 'Doctor';
              return (
                <div key={apt._id} style={{ display: 'grid', gridTemplateColumns: '1.5fr 1.5fr 1.2fr 1fr 1fr', gap: '16px', padding: '18px 28px', alignItems: 'center', borderBottom: i !== allApts.length - 1 ? '0.5px solid rgba(255,255,255,0.04)' : 'none', transition: 'background 0.15s' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <span style={{ fontSize: '13px', fontWeight: '600', color: '#fff' }}>{patName}</span>
                  <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>Dr. {docName}</span>
                  <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>{formatDate(apt.date)}</span>
                  <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>{apt.timeSlot || '—'}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '4px 10px', borderRadius: '99px', background: bg, border: `0.5px solid ${border}`, width: 'fit-content' }}>
                    <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: dot }} />
                    <span style={{ fontSize: '10px', fontWeight: '600', color }}>{label}</span>
                  </div>
                </div>
              );
            })}
          </>
        )}
      </div>

      {/* Edit Modal */}
      {editDoctor && (
        <EditDoctorModal
          doctor={editDoctor}
          onClose={() => setEditDoctor(null)}
          onSave={fetchData}
        />
      )}
    </div>
  );
}