'use client';
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { Camera, X, Save, User, Activity } from 'lucide-react';
import toast from 'react-hot-toast';
import UniversalAvatar from '@/components/UniversalAvatar';

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const GENDERS      = ['male', 'female', 'other'];

function getInitials(name = '') {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '?';
}

function inp(extra = {}) {
  return {
    style: {
      width: '100%', background: 'rgba(255,255,255,0.03)',
      border: '0.5px solid rgba(255,255,255,0.08)', borderRadius: '12px',
      padding: '12px 16px', fontSize: '14px', color: '#fff', outline: 'none',
      boxSizing: 'border-box', transition: 'border-color 0.15s', ...extra,
    },
    onFocus: e => { if (!e.target.disabled) e.target.style.borderColor = 'rgba(59,130,246,0.5)'; },
    onBlur:  e => e.target.style.borderColor = 'rgba(255,255,255,0.08)',
  };
}

const card = { background: 'rgba(255,255,255,0.02)', border: '0.5px solid rgba(255,255,255,0.07)', borderRadius: '20px' };

function Label({ children }) {
  return <label style={{ fontSize: '11px', fontWeight: '600', color: 'rgba(255,255,255,0.3)', display: 'block', marginBottom: '7px' }}>{children}</label>;
}

function SectionHeader({ icon: Icon, title, color, bg }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
      <div style={{ width: '32px', height: '32px', borderRadius: '10px', background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Icon size={14} style={{ color }} />
      </div>
      <span style={{ fontSize: '15px', fontWeight: '700', color: '#fff' }}>{title}</span>
    </div>
  );
}

export default function PatientProfile() {
  const { user, loading: authLoading, refreshUser } = useAuth();
  const router  = useRouter();
  const fileRef = useRef(null);

  const [form, setForm] = useState({
    name: '', phone: '', dob: '', gender: '',
    bloodGroup: '', address: '', allergies: '', avatar: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.push('/login'); return; }
    fetch('/api/profile/patient', { credentials: 'include' })
      .then(r => r.json())
      .then(data => {
        if (data.user) {
          const u = data.user;
          setForm({
            name:       u.name       || '',
            phone:      u.phone      || '',
            dob:        u.dob ? u.dob.split('T')[0] : '',
            gender:     u.gender     || '',
            bloodGroup: u.bloodGroup || '',
            address:    u.address    || '',
            allergies:  u.allergies  || '',
            avatar:     u.avatar     || '',
          });
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [user, authLoading]);

  const handleImage = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 1.5 * 1024 * 1024) { toast.error('Image must be under 1.5MB'); return; }
    const reader = new FileReader();
    reader.onloadend = () => setForm(f => ({ ...f, avatar: reader.result }));
    reader.readAsDataURL(file);
  };

  const handleSave = async (e) => {
    e?.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/profile/patient', {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save');
      await refreshUser?.();
      const stored = JSON.parse(localStorage.getItem('sanjeevni_user') || '{}');
      localStorage.setItem('sanjeevni_user', JSON.stringify({ ...stored, name: form.name, avatar: form.avatar }));
      toast.success('Profile saved successfully');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (!user || loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', flexDirection: 'column', gap: '16px' }}>
      <div className="size-10 border-2 border-blue-500/20 border-t-blue-500 animate-spin rounded-full" />
      <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.2)', textTransform: 'uppercase', letterSpacing: '0.12em' }}>Loading...</p>
    </div>
  );

  const formattedDob = form.dob
    ? new Date(form.dob).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
    : '—';

  return (
    <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '28px', width: '100%', paddingBottom: '80px' }}>

      {/* Header */}
      <div>
        <div style={{ fontSize: '10px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.2em', color: 'rgba(255,255,255,0.2)', marginBottom: '4px' }}>Patient Portal</div>
        <h1 style={{ fontSize: '26px', fontWeight: '900', color: '#fff', letterSpacing: '-0.5px', margin: 0 }}>My Profile</h1>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: '20px', alignItems: 'start' }}>

        {/* ── Left Column ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {/* Avatar + Summary Card */}
          <div style={{ ...card, padding: '24px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', textAlign: 'center' }}>

            {/* Avatar */}
            <div style={{ position: 'relative' }}>
              <UniversalAvatar 
                user={{ ...user, avatar: form.avatar, gender: form.gender }} 
                size="size-20" 
              />
              {/* Camera button */}
              <button type="button" onClick={() => fileRef.current?.click()}
                style={{ position: 'absolute', bottom: '0', right: '0', width: '26px', height: '26px', borderRadius: '50%', background: 'rgba(0,0,0,0.7)', border: '1px solid rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 2, transition: 'all 0.15s' }}
                onMouseEnter={e => { e.currentTarget.style.background = '#3b82f6'; e.currentTarget.style.borderColor = '#3b82f6'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(0,0,0,0.7)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'; }}>
                <Camera size={11} style={{ color: '#fff' }} />
              </button>
              {/* Remove button */}
              {form.avatar && (
                <button type="button" onClick={() => setForm(f => ({ ...f, avatar: '' }))}
                  style={{ position: 'absolute', top: '-2px', left: '-2px', width: '22px', height: '22px', borderRadius: '50%', background: 'rgba(0,0,0,0.7)', border: '1px solid rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 2, transition: 'all 0.15s' }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#fb7185'; e.currentTarget.style.borderColor = '#fb7185'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'rgba(0,0,0,0.7)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'; }}>
                  <X size={10} style={{ color: '#fff' }} />
                </button>
              )}
              <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImage} />
            </div>

            <div>
              <h2 style={{ fontSize: '16px', fontWeight: '800', color: '#fff', margin: '0 0 3px' }}>{form.name || 'Your Name'}</h2>
              <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.3)', margin: 0 }}>{user.email}</p>
            </div>

            <div style={{ height: '0.5px', background: 'rgba(255,255,255,0.06)', width: '100%' }} />

            {/* Quick stats */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '100%' }}>
              {[
                { label: 'Blood group', value: form.bloodGroup || '—', highlight: !!form.bloodGroup, color: '#f87171', bg: 'rgba(239,68,68,0.1)', border: 'rgba(239,68,68,0.25)' },
                { label: 'Date of birth', value: formattedDob },
                { label: 'Gender', value: form.gender ? form.gender.charAt(0).toUpperCase() + form.gender.slice(1) : '—' },
                { label: 'Phone', value: form.phone || '—' },
              ].map(item => (
                <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)' }}>{item.label}</span>
                  {item.highlight ? (
                    <span style={{ padding: '3px 10px', borderRadius: '99px', background: item.bg, border: `0.5px solid ${item.border}`, fontSize: '11px', fontWeight: '700', color: item.color }}>{item.value}</span>
                  ) : (
                    <span style={{ fontSize: '11px', fontWeight: '700', color: '#fff' }}>{item.value}</span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Blood Group Picker */}
          <div style={{ ...card, padding: '20px 22px' }}>
            <SectionHeader icon={Activity} title="Blood Group" color="#f87171" bg="rgba(239,68,68,0.1)" />
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '7px' }}>
              {BLOOD_GROUPS.map(g => {
                const isActive = form.bloodGroup === g;
                return (
                  <button key={g} type="button" onClick={() => setForm(f => ({ ...f, bloodGroup: g }))}
                    style={{ padding: '6px 14px', borderRadius: '99px', fontSize: '12px', fontWeight: '700', border: `0.5px solid ${isActive ? 'rgba(239,68,68,0.3)' : 'rgba(255,255,255,0.08)'}`, background: isActive ? 'rgba(239,68,68,0.12)' : 'rgba(255,255,255,0.02)', color: isActive ? '#f87171' : 'rgba(255,255,255,0.35)', cursor: 'pointer', transition: 'all 0.15s' }}>
                    {g}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Save button */}
          <button type="submit" disabled={saving}
            style={{ width: '100%', padding: '16px', borderRadius: '14px', background: 'rgba(0,0,0,0.6)', border: '0.5px solid rgba(255,255,255,0.2)', color: '#fff', fontSize: '14px', fontWeight: '700', cursor: saving ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', transition: 'all 0.2s', opacity: saving ? 0.5 : 1 }}
            onMouseEnter={e => { if (!saving) { e.currentTarget.style.background = '#fff'; e.currentTarget.style.color = '#000'; e.currentTarget.style.borderColor = '#fff'; }}}
            onMouseLeave={e => { if (!saving) { e.currentTarget.style.background = 'rgba(0,0,0,0.6)'; e.currentTarget.style.color = '#fff'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'; }}}>
            <Save size={15} />
            {saving ? 'Saving...' : 'Save All Changes'}
          </button>
        </div>

        {/* ── Right Column ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {/* Personal Info */}
          <div style={{ ...card, padding: '24px 28px' }}>
            <SectionHeader icon={User} title="Personal Info" color="#60a5fa" bg="rgba(59,130,246,0.1)" />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <Label>Full name</Label>
                <input {...inp()} value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Your full name" required />
              </div>
              <div>
                <Label>Email</Label>
                <input {...inp({ opacity: 0.4, cursor: 'not-allowed' })} value={user.email} disabled />
              </div>
              <div>
                <Label>Phone</Label>
                <input {...inp()} value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="+91 98765 43210" />
              </div>
              <div>
                <Label>Date of birth</Label>
                <input {...inp()} type="date" value={form.dob} onChange={e => setForm(f => ({ ...f, dob: e.target.value }))} />
              </div>
              <div style={{ gridColumn: 'span 2' }}>
                <Label>Gender</Label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {GENDERS.map(g => {
                    const isActive = form.gender === g;
                    return (
                      <button key={g} type="button" onClick={() => setForm(f => ({ ...f, gender: g }))}
                        style={{ flex: 1, padding: '11px 8px', borderRadius: '10px', fontSize: '13px', fontWeight: '600', border: `0.5px solid ${isActive ? 'rgba(59,130,246,0.4)' : 'rgba(255,255,255,0.07)'}`, background: isActive ? 'rgba(59,130,246,0.12)' : 'rgba(255,255,255,0.02)', color: isActive ? '#60a5fa' : 'rgba(255,255,255,0.3)', cursor: 'pointer', transition: 'all 0.15s' }}>
                        {g.charAt(0).toUpperCase() + g.slice(1)}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Medical Info */}
          <div style={{ ...card, padding: '24px 28px' }}>
            <SectionHeader icon={Activity} title="Medical Info" color="#fbbf24" bg="rgba(245,158,11,0.1)" />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <Label>Address</Label>
                <input {...inp()} value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} placeholder="Your home address" />
              </div>
              <div>
                <Label>Allergies / medical conditions</Label>
                <textarea {...inp({ resize: 'none', minHeight: '110px' })} value={form.allergies} onChange={e => setForm(f => ({ ...f, allergies: e.target.value }))} placeholder="List any known allergies or chronic conditions..." />
              </div>
            </div>
          </div>

        </div>
      </div>
    </form>
  );
}