'use client';
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  User, Camera, Phone, Calendar, Droplets, MapPin, AlertCircle,
  Stethoscope, LogOut, Save, ChevronLeft, Shield
} from 'lucide-react';
import toast from 'react-hot-toast';

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const GENDERS = ['male', 'female', 'other'];

export default function PatientProfile() {
  const { user, loading: authLoading, logout } = useAuth();
  const router = useRouter();
  const fileInputRef = useRef(null);

  const [form, setForm] = useState({
    name: '', phone: '', dob: '', gender: '', bloodGroup: '', address: '', allergies: '', avatar: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.push('/login'); return; }
    fetch('/api/profile/patient')
      .then(r => r.json())
      .then(data => {
        if (data.user) {
          const u = data.user;
          setForm({
            name: u.name || '',
            phone: u.phone || '',
            dob: u.dob ? u.dob.split('T')[0] : '',
            gender: u.gender || '',
            bloodGroup: u.bloodGroup || '',
            address: u.address || '',
            allergies: u.allergies || '',
            avatar: u.avatar || '',
          });
        }
        setLoading(false);
      });
  }, [user, authLoading]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 1.5 * 1024 * 1024) {
      toast.error('Image must be under 1.5 MB');
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => setForm(f => ({ ...f, avatar: reader.result }));
    reader.readAsDataURL(file);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/profile/patient', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save');
      // Update localStorage
      const stored = JSON.parse(localStorage.getItem('sanjeevni_user') || '{}');
      localStorage.setItem('sanjeevni_user', JSON.stringify({ ...stored, name: form.name, avatar: form.avatar }));
      toast.success('Profile updated!');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (!user) return null;

  const initials = form.name?.[0]?.toUpperCase() || '?';

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', display: 'flex' }}>
      {/* Sidebar */}
      <aside style={{ width: 240, background: 'rgba(15,23,42,0.95)', borderRight: '1px solid var(--border)', padding: '24px 16px', position: 'sticky', top: 0, height: '100vh', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 32, paddingLeft: 8 }}>
          <div style={{ background: 'linear-gradient(135deg,#0ea5e9,#06b6d4)', padding: 7, borderRadius: 9 }}><Stethoscope size={16} color="white" /></div>
          <span style={{ fontWeight: 800, fontSize: 18, background: 'linear-gradient(135deg,#0ea5e9,#06b6d4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Sanjeevni</span>
        </div>
        <div style={{ background: 'rgba(14,165,233,0.1)', border: '1px solid rgba(14,165,233,0.2)', borderRadius: 12, padding: 16, marginBottom: 24 }}>
          {form.avatar
            ? <img src={form.avatar} alt="avatar" style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover', marginBottom: 8 }} />
            : <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'linear-gradient(135deg,#0ea5e9,#06b6d4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 700, color: 'white', marginBottom: 8 }}>{initials}</div>
          }
          <p style={{ fontWeight: 600, fontSize: 14 }}>{user.name}</p>
          <p style={{ color: 'var(--text-muted)', fontSize: 12 }}>Patient</p>
        </div>
        <nav style={{ flex: 1 }}>
          {[
            { icon: <Calendar size={18} />, label: 'My Appointments', href: '/dashboard/patient' },
            { icon: <Stethoscope size={18} />, label: 'Find Doctors', href: '/doctors' },
            { icon: <User size={18} />, label: 'My Profile', href: '/dashboard/patient/profile' },
          ].map((item) => (
            <Link key={item.label} href={item.href} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderRadius: 10, textDecoration: 'none', marginBottom: 4, transition: 'all 0.2s', background: item.href === '/dashboard/patient/profile' ? 'rgba(14,165,233,0.1)' : 'transparent', color: item.href === '/dashboard/patient/profile' ? 'var(--accent)' : 'var(--text-muted)' }}>
              {item.icon}{item.label}
            </Link>
          ))}
        </nav>
        <button onClick={logout} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', borderRadius: 10, background: 'none', border: '1px solid var(--border)', color: 'var(--text-muted)', cursor: 'pointer', width: '100%', fontSize: 14 }}>
          <LogOut size={16} /> Sign Out
        </button>
      </aside>

      {/* Main */}
      <main style={{ flex: 1, padding: '32px', overflowY: 'auto', maxWidth: 800 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 32 }}>
          <Link href="/dashboard/patient" style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', textDecoration: 'none' }}><ChevronLeft size={20} /></Link>
          <div>
            <h1 style={{ fontSize: 26, fontWeight: 800 }}>My Profile</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 2 }}>Manage your personal and medical information</p>
          </div>
        </div>

        {loading ? (
          <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 80 }}>Loading...</p>
        ) : (
          <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {/* Avatar */}
            <div className="glass-card" style={{ padding: 28 }}>
              <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}><Camera size={18} /> Profile Photo</h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
                <div style={{ position: 'relative', cursor: 'pointer' }} onClick={() => fileInputRef.current?.click()}>
                  {form.avatar
                    ? <img src={form.avatar} alt="avatar" style={{ width: 96, height: 96, borderRadius: '50%', objectFit: 'cover', border: '3px solid var(--accent)' }} />
                    : <div style={{ width: 96, height: 96, borderRadius: '50%', background: 'linear-gradient(135deg,#0ea5e9,#06b6d4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36, fontWeight: 800, color: 'white' }}>{initials}</div>
                  }
                  <div style={{ position: 'absolute', bottom: 0, right: 0, background: 'var(--accent)', borderRadius: '50%', width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid var(--bg-primary)' }}>
                    <Camera size={13} color="white" />
                  </div>
                </div>
                <div>
                  <p style={{ fontWeight: 600, marginBottom: 4 }}>Upload a photo</p>
                  <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 12 }}>JPG, PNG or GIF · Max 1.5 MB</p>
                  <button type="button" className="btn-secondary" style={{ fontSize: 13, padding: '8px 16px' }} onClick={() => fileInputRef.current?.click()}>
                    Choose File
                  </button>
                  {form.avatar && (
                    <button type="button" style={{ marginLeft: 8, fontSize: 13, padding: '8px 16px', background: 'none', border: '1px solid rgba(239,68,68,0.4)', color: '#ef4444', borderRadius: 8, cursor: 'pointer' }} onClick={() => setForm(f => ({ ...f, avatar: '' }))}>
                      Remove
                    </button>
                  )}
                </div>
                <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImageChange} />
              </div>
            </div>

            {/* Personal Info */}
            <div className="glass-card" style={{ padding: 28 }}>
              <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}><User size={18} /> Personal Information</h2>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={labelStyle}>Full Name</label>
                  <input className="input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Your full name" required />
                </div>
                <div>
                  <label style={labelStyle}>Email (read-only)</label>
                  <input className="input" value={user.email} disabled style={{ opacity: 0.5, cursor: 'not-allowed' }} />
                </div>
                <div>
                  <label style={labelStyle}><Phone size={13} style={{ display: 'inline', marginRight: 4 }} />Phone Number</label>
                  <input className="input" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="+91 98765 43210" />
                </div>
                <div>
                  <label style={labelStyle}><Calendar size={13} style={{ display: 'inline', marginRight: 4 }} />Date of Birth</label>
                  <input className="input" type="date" value={form.dob} onChange={e => setForm(f => ({ ...f, dob: e.target.value }))} max={new Date().toISOString().split('T')[0]} />
                </div>
                <div>
                  <label style={labelStyle}>Gender</label>
                  <select className="input" value={form.gender} onChange={e => setForm(f => ({ ...f, gender: e.target.value }))} style={{ cursor: 'pointer' }}>
                    <option value="">Select gender</option>
                    {GENDERS.map(g => <option key={g} value={g}>{g.charAt(0).toUpperCase() + g.slice(1)}</option>)}
                  </select>
                </div>
              </div>
            </div>

            {/* Medical Info */}
            <div className="glass-card" style={{ padding: 28 }}>
              <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}><Shield size={18} /> Medical Information</h2>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <label style={labelStyle}><Droplets size={13} style={{ display: 'inline', marginRight: 4 }} />Blood Group</label>
                  <select className="input" value={form.bloodGroup} onChange={e => setForm(f => ({ ...f, bloodGroup: e.target.value }))} style={{ cursor: 'pointer' }}>
                    <option value="">Select blood group</option>
                    {BLOOD_GROUPS.map(g => <option key={g} value={g}>{g}</option>)}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}><MapPin size={13} style={{ display: 'inline', marginRight: 4 }} />Address</label>
                  <input className="input" value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} placeholder="City, State" />
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={labelStyle}><AlertCircle size={13} style={{ display: 'inline', marginRight: 4 }} />Known Allergies / Medical Conditions</label>
                  <textarea className="input" value={form.allergies} onChange={e => setForm(f => ({ ...f, allergies: e.target.value }))} placeholder="e.g. Penicillin allergy, Diabetes Type 2..." rows={3} style={{ resize: 'vertical' }} />
                </div>
              </div>
            </div>

            {/* Save */}
            <button type="submit" className="btn-primary pulse-glow" disabled={saving} style={{ alignSelf: 'flex-end', padding: '13px 32px', fontSize: 15, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Save size={16} /> {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </form>
        )}
      </main>
    </div>
  );
}

const labelStyle = { fontSize: 13, fontWeight: 500, color: 'var(--text-muted)', display: 'block', marginBottom: 6 };
