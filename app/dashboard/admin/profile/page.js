'use client';
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import {
  Camera, X, Save, ShieldCheck, AlertCircle,
  User, Lock, Calendar, Users, Stethoscope, Clock
} from 'lucide-react';
import toast from 'react-hot-toast';

// ─── Animated Avatar ──────────────────────────────────────────────────────────

function AnimatedAvatar({ name = '', avatarUrl = '' }) {
  const initials = name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'AD';

  return (
    <div style={{ position: 'relative', width: '140px', height: '140px', margin: '0 auto' }}>
      <style>{`
        @keyframes av-spin { to { transform: rotate(360deg); } }
        @keyframes av-spin-r { to { transform: rotate(-360deg); } }
        @keyframes av-pulse { 0%,100%{opacity:.12;transform:scale(1)} 50%{opacity:.3;transform:scale(1.07)} }
        @keyframes av-float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-5px)} }
        @keyframes av-glow { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.5;transform:scale(0.85)} }
        input::-webkit-outer-spin-button,
        input::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
        input[type=number] { -moz-appearance: textfield; }
      `}</style>
      <div style={{ position:'absolute', inset:'-22px', borderRadius:'50%', border:'1px dashed rgba(245,158,11,0.18)', animation:'av-spin 20s linear infinite', pointerEvents:'none' }} />
      <div style={{ position:'absolute', inset:'-38px', borderRadius:'50%', border:'1px dashed rgba(239,68,68,0.1)', animation:'av-spin-r 28s linear infinite', pointerEvents:'none' }} />
      <div style={{ position:'absolute', inset:'-8px', borderRadius:'50%', border:'1.5px solid rgba(245,158,11,0.14)', animation:'av-pulse 3.5s ease-in-out infinite', pointerEvents:'none' }} />
      <svg style={{ position:'absolute', inset:'-12px', width:'164px', height:'164px', pointerEvents:'none' }} viewBox="0 0 164 164">
        <circle cx="82" cy="82" r="78" fill="none" stroke="rgba(245,158,11,0.25)" strokeWidth="1.5"
          strokeDasharray="10 8"
          style={{ animation:'av-spin 16s linear infinite', transformOrigin:'82px 82px' }} />
      </svg>
      <div style={{ position:'absolute', inset:0, borderRadius:'50%', overflow:'hidden', animation:'av-float 4s ease-in-out infinite', border:'2px solid rgba(245,158,11,0.25)' }}>
        {avatarUrl ? (
          <img src={avatarUrl} alt={name} style={{ width:'100%', height:'100%', objectFit:'cover' }} />
        ) : (
          <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg,rgba(245,158,11,0.25),rgba(239,68,68,0.2))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: '38px', fontWeight: '800', color: '#fbbf24', letterSpacing: '-1px', lineHeight: 1 }}>{initials}</span>
          </div>
        )}
      </div>
      <div style={{ position:'absolute', bottom:'4px', right:'4px', width:'16px', height:'16px', borderRadius:'50%', background:'#4ade80', border:'2.5px solid #050608', animation:'av-glow 2s ease-in-out infinite', zIndex:2 }} />
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function inp(extra = {}) {
  return {
    style: {
      width: '100%', background: 'rgba(255,255,255,0.03)',
      border: '0.5px solid rgba(255,255,255,0.08)', borderRadius: '12px',
      padding: '12px 16px', fontSize: '14px', color: '#fff', outline: 'none',
      boxSizing: 'border-box', transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)', ...extra,
    },
    onFocus: e => {
      e.target.style.borderColor = 'rgba(255,255,255,0.8)';
      e.target.style.boxShadow = '0 0 15px rgba(255,255,255,0.1)';
      e.target.style.background = 'rgba(255,255,255,0.05)';
    },
    onBlur:  e => {
      e.target.style.borderColor = 'rgba(255,255,255,0.08)';
      e.target.style.boxShadow = 'none';
      e.target.style.background = 'rgba(255,255,255,0.03)';
    },
  };
}

const card = { background: 'rgba(255,255,255,0.02)', border: '0.5px solid rgba(255,255,255,0.07)', borderRadius: '20px' };

function SectionHeader({ icon: Icon, title, color, bg }) {
  return (
    <div style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'20px' }}>
      <div style={{ width:'32px', height:'32px', borderRadius:'10px', background: bg, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
        <Icon size={14} style={{ color }} />
      </div>
      <span style={{ fontSize:'15px', fontWeight:'700', color:'#fff' }}>{title}</span>
    </div>
  );
}

function Label({ children }) {
  return <label style={{ fontSize:'11px', fontWeight:'600', color:'rgba(255,255,255,0.3)', display:'block', marginBottom:'7px' }}>{children}</label>;
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AdminProfile() {
  const { user, loading: authLoading } = useAuth();
  const router  = useRouter();
  const fileRef = useRef(null);

  const [form, setForm] = useState({ name: '', phone: '', avatar: '' });
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.push('/login'); return; }
    if (user.role !== 'admin') { router.push('/'); return; }

    Promise.all([
      fetch('/api/profile/admin', { credentials: 'include' }).then(r => r.json()),
      fetch('/api/admin', { credentials: 'include' }).then(r => r.json()),
    ]).then(([profileData, statsData]) => {
      if (profileData.user) {
        setForm({
          name: profileData.user.name || '',
          phone: profileData.user.phone || '',
          avatar: profileData.user.avatar || '',
        });
      }
      setStats(statsData);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [user, authLoading]);

  const handleImage = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 1.5 * 1024 * 1024) { toast.error('Image must be under 1.5 MB'); return; }
    const reader = new FileReader();
    reader.onloadend = () => setForm(f => ({ ...f, avatar: reader.result }));
    reader.readAsDataURL(file);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/profile/admin', {
        method: 'PUT', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save');
      const stored = JSON.parse(localStorage.getItem('sanjeevni_user') || '{}');
      localStorage.setItem('sanjeevni_user', JSON.stringify({ ...stored, name: form.name, avatar: form.avatar }));
      toast.success('Profile saved');
    } catch (err) { toast.error(err.message); }
    finally { setSaving(false); }
  };

  if (!user || loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:'60vh', flexDirection:'column', gap:'16px' }}>
      <div className="size-10 border-2 border-amber-500/20 border-t-amber-500 animate-spin rounded-full" />
      <p style={{ fontSize:'11px', color:'rgba(255,255,255,0.2)', textTransform:'uppercase', letterSpacing:'0.12em' }}>Loading...</p>
    </div>
  );

  const joinedDate = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
    : '—';

  return (
    <form onSubmit={handleSave} style={{ display:'flex', flexDirection:'column', gap:'28px', width:'100%', paddingBottom:'80px' }}>

      {/* Header */}
      <div>
        <div style={{ fontSize:'10px', fontWeight:'700', textTransform:'uppercase', letterSpacing:'0.2em', color:'rgba(255,255,255,0.2)', marginBottom:'4px' }}>System Administrator</div>
        <h1 style={{ fontSize:'26px', fontWeight:'900', color:'#fff', letterSpacing:'-0.5px', margin:0 }}>My Profile</h1>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'280px 1fr', gap:'20px', alignItems:'start' }}>

        {/* ── Left Column ── */}
        <div style={{ display:'flex', flexDirection:'column', gap:'16px' }}>

          {/* Avatar Card */}
          <div style={{ ...card, padding:'28px 20px', display:'flex', flexDirection:'column', alignItems:'center', gap:'16px' }}>

            <div style={{ position:'relative' }}>
              <AnimatedAvatar
                name={form.name}
                avatarUrl={form.avatar}
              />
              {/* Camera button */}
              <button type="button" onClick={() => fileRef.current?.click()}
                style={{ position:'absolute', bottom:'4px', left:'4px', width:'26px', height:'26px', borderRadius:'50%', background:'rgba(0,0,0,0.7)', border:'1px solid rgba(255,255,255,0.15)', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', zIndex:3, transition:'all 0.15s' }}
                onMouseEnter={e => { e.currentTarget.style.background = '#f59e0b'; e.currentTarget.style.borderColor = '#f59e0b'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(0,0,0,0.7)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'; }}>
                <Camera size={11} style={{ color:'#fff' }} />
              </button>
              {/* Remove button */}
              {form.avatar && (
                <button type="button" onClick={() => setForm(f => ({ ...f, avatar: '' }))}
                  style={{ position:'absolute', top:'-2px', left:'-2px', width:'22px', height:'22px', borderRadius:'50%', background:'rgba(0,0,0,0.7)', border:'1px solid rgba(255,255,255,0.15)', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', zIndex:3, transition:'all 0.15s' }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#fb7185'; e.currentTarget.style.borderColor = '#fb7185'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'rgba(0,0,0,0.7)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'; }}>
                  <X size={10} style={{ color:'#fff' }} />
                </button>
              )}
              <input ref={fileRef} type="file" accept="image/*" style={{ display:'none' }} onChange={handleImage} />
            </div>

            <div style={{ textAlign:'center' }}>
              <h2 style={{ fontSize:'16px', fontWeight:'800', color:'#fff', margin:'0 0 3px' }}>{form.name || 'Admin'}</h2>
              <p style={{ fontSize:'12px', color:'rgba(245,158,11,0.8)', margin:0 }}>System Administrator</p>
            </div>

            <div style={{ display:'flex', alignItems:'center', gap:'6px', padding:'5px 14px', borderRadius:'99px', background:'rgba(34,197,94,0.1)', border:'0.5px solid rgba(34,197,94,0.25)' }}>
              <ShieldCheck size={12} style={{ color:'#4ade80' }} />
              <span style={{ fontSize:'11px', fontWeight:'600', color:'#4ade80' }}>
                Full Access
              </span>
            </div>

            <div style={{ height:'0.5px', background:'rgba(255,255,255,0.06)', width:'100%' }} />

            {/* Platform Stats Grid */}
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'8px', width:'100%' }}>
              {[
                { label:'Users', value: stats?.totalUsers || 0, color:'#60a5fa' },
                { label:'Doctors', value: stats?.totalDoctors || 0, color:'#4ade80' },
                { label:'Appts', value: stats?.totalAppointments || 0, color:'#a78bfa' },
                { label:'Pending', value: stats?.pendingDoctors || 0, color:'#fbbf24' },
              ].map(s => (
                <div key={s.label} style={{ background:'rgba(255,255,255,0.02)', border:'0.5px solid rgba(255,255,255,0.05)', borderRadius:'10px', padding:'10px', textAlign:'center' }}>
                  <div style={{ fontSize:'14px', fontWeight:'800', color: s.color, lineHeight:1 }}>{s.value}</div>
                  <div style={{ fontSize:'9px', color:'rgba(255,255,255,0.25)', textTransform:'uppercase', letterSpacing:'0.08em', marginTop:'3px' }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Admin Info Card */}
          <div style={{ ...card, padding:'20px 22px' }}>
            <SectionHeader icon={ShieldCheck} title="Admin Access" color="#fbbf24" bg="rgba(245,158,11,0.1)" />
            <div style={{ display:'flex', flexDirection:'column', gap:'12px' }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <span style={{ fontSize:'12px', color:'rgba(255,255,255,0.3)' }}>Role</span>
                <span style={{ fontSize:'12px', fontWeight:'600', color:'#fbbf24' }}>Super Admin</span>
              </div>
              <div style={{ height:'0.5px', background:'rgba(255,255,255,0.04)' }} />
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <span style={{ fontSize:'12px', color:'rgba(255,255,255,0.3)' }}>Member since</span>
                <span style={{ fontSize:'12px', fontWeight:'600', color:'rgba(255,255,255,0.6)' }}>{joinedDate}</span>
              </div>
              <div style={{ height:'0.5px', background:'rgba(255,255,255,0.04)' }} />
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <span style={{ fontSize:'12px', color:'rgba(255,255,255,0.3)' }}>Access level</span>
                <div style={{ display:'flex', alignItems:'center', gap:'5px', padding:'3px 10px', borderRadius:'99px', background:'rgba(34,197,94,0.08)', border:'0.5px solid rgba(34,197,94,0.2)' }}>
                  <span style={{ width:'5px', height:'5px', borderRadius:'50%', background:'#4ade80' }} />
                  <span style={{ fontSize:'10px', fontWeight:'600', color:'#4ade80' }}>Full Control</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Right Column ── */}
        <div style={{ display:'flex', flexDirection:'column', gap:'16px' }}>

          {/* Account Details */}
          <div style={{ ...card, padding:'24px 28px' }}>
            <SectionHeader icon={User} title="Account Details" color="#60a5fa" bg="rgba(59,130,246,0.1)" />
            <div style={{ display:'flex', flexDirection:'column', gap:'16px' }}>
              <div>
                <Label>Full name</Label>
                <input {...inp()} value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Admin Name" required />
              </div>
              <div>
                <Label>Email</Label>
                <input {...inp({ opacity:0.4, cursor:'not-allowed' })} value={user.email} disabled />
              </div>
              <div>
                <Label>Phone</Label>
                <input {...inp()} value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="+91 98765 43210" />
              </div>
            </div>
          </div>

          {/* Security & Access */}
          <div style={{ ...card, padding:'24px 28px' }}>
            <SectionHeader icon={Lock} title="Security & Access" color="#a78bfa" bg="rgba(139,92,246,0.1)" />
            <div style={{ display:'flex', flexDirection:'column', gap:'16px' }}>
              {[
                { icon: ShieldCheck, label: 'Authentication', value: 'JWT + Cookies', color: '#4ade80', bg: 'rgba(34,197,94,0.08)' },
                { icon: Users, label: 'Managed users', value: `${(stats?.totalUsers || 0)} accounts`, color: '#60a5fa', bg: 'rgba(59,130,246,0.08)' },
                { icon: Stethoscope, label: 'Doctor approvals', value: `${(stats?.pendingDoctors || 0)} pending`, color: '#fbbf24', bg: 'rgba(245,158,11,0.08)' },
                { icon: Calendar, label: 'Platform appointments', value: `${(stats?.totalAppointments || 0)} total`, color: '#a78bfa', bg: 'rgba(139,92,246,0.08)' },
              ].map(item => (
                <div key={item.label} style={{ display:'flex', alignItems:'center', gap:'14px', padding:'14px 16px', borderRadius:'14px', background: item.bg, border:`0.5px solid ${item.color}22`, transition:'all 0.15s' }}
                  onMouseEnter={e => e.currentTarget.style.background = `${item.bg.replace('0.08', '0.14')}`}
                  onMouseLeave={e => e.currentTarget.style.background = item.bg}>
                  <div style={{ width:'36px', height:'36px', borderRadius:'10px', background:`${item.color}18`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                    <item.icon size={16} style={{ color: item.color }} />
                  </div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:'11px', color:'rgba(255,255,255,0.3)', marginBottom:'2px' }}>{item.label}</div>
                    <div style={{ fontSize:'14px', fontWeight:'700', color:'#fff' }}>{item.value}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Save button */}
          <button type="submit" disabled={saving}
            style={{ width:'100%', padding:'16px', borderRadius:'14px', background:'rgba(0,0,0,0.6)', border:'0.5px solid rgba(255,255,255,0.2)', color:'#fff', fontSize:'14px', fontWeight:'700', cursor: saving ? 'not-allowed' : 'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:'8px', transition:'all 0.2s', opacity: saving ? 0.5 : 1 }}
            onMouseEnter={e => { if (!saving) { e.currentTarget.style.background = '#fff'; e.currentTarget.style.color = '#000'; e.currentTarget.style.borderColor = '#fff'; }}}
            onMouseLeave={e => { if (!saving) { e.currentTarget.style.background = 'rgba(0,0,0,0.6)'; e.currentTarget.style.color = '#fff'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'; }}}
          >
            <Save size={16} />
            {saving ? 'Saving...' : 'Save All Changes'}
          </button>
        </div>
      </div>
    </form>
  );
}
