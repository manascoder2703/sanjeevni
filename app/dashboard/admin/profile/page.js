'use client';
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Users, Stethoscope, Camera, Phone, LogOut, Save, ShieldCheck, User, Calendar, Clock, ChevronLeft } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminProfile() {
  const { user, loading: authLoading, logout } = useAuth();
  const router = useRouter();
  const fileInputRef = useRef(null);

  const [form, setForm] = useState({ name: '', phone: '', avatar: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.push('/login'); return; }
    if (user.role !== 'admin') { router.push('/'); return; }
    fetch('/api/profile/admin')
      .then(r => r.json())
      .then(data => {
        if (data.user) {
          setForm({ name: data.user.name || '', phone: data.user.phone || '', avatar: data.user.avatar || '' });
        }
        setLoading(false);
      });
  }, [user, authLoading]);

  const handleImageChange = (e) => {
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
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save');
      const stored = JSON.parse(localStorage.getItem('sanjeevni_user') || '{}');
      localStorage.setItem('sanjeevni_user', JSON.stringify({ ...stored, name: form.name, avatar: form.avatar }));
      toast.success('Profile updated!');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (!user || user.role !== 'admin') return null;
  const initials = form.name?.[0]?.toUpperCase() || 'A';

  return (
    <div style={{ minHeight: '100vh', padding: '32px' }}>
      {/* Main */}
      <main style={{ maxWidth: 640, margin: '0 auto' }}>
        <div style={{ maxWidth: 640, margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 32 }}>
            <Link href="/dashboard/admin" style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', textDecoration: 'none' }}><ChevronLeft size={20} /></Link>
            <div>
              <h1 style={{ fontSize: 26, fontWeight: 800 }}>Admin Profile</h1>
              <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 2 }}>Manage your administrator account details</p>
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
                      ? <img src={form.avatar} alt="avatar" style={{ width: 96, height: 96, borderRadius: '50%', objectFit: 'cover', border: '3px solid #f59e0b' }} />
                      : <div style={{ width: 96, height: 96, borderRadius: '50%', background: 'linear-gradient(135deg,#f59e0b,#ef4444)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><ShieldCheck size={40} color="white" /></div>
                    }
                    <div style={{ position: 'absolute', bottom: 0, right: 0, background: '#f59e0b', borderRadius: '50%', width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid var(--bg-primary)' }}>
                      <Camera size={13} color="white" />
                    </div>
                  </div>
                  <div>
                    <p style={{ fontWeight: 600, marginBottom: 4 }}>Upload a photo</p>
                    <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 12 }}>JPG, PNG or GIF · Max 1.5 MB</p>
                    <button type="button" className="btn-secondary" style={{ fontSize: 13, padding: '8px 16px' }} onClick={() => fileInputRef.current?.click()}>Choose File</button>
                    {form.avatar && (
                      <button type="button" style={{ marginLeft: 8, fontSize: 13, padding: '8px 16px', background: 'none', border: '1px solid rgba(239,68,68,0.4)', color: '#ef4444', borderRadius: 8, cursor: 'pointer' }} onClick={() => setForm(f => ({ ...f, avatar: '' }))}>Remove</button>
                    )}
                  </div>
                  <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImageChange} />
                </div>
              </div>

              {/* Account Info */}
              <div className="glass-card" style={{ padding: 28 }}>
                <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}><User size={18} /> Account Information</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div>
                    <label style={labelStyle}>Full Name</label>
                    <input className="input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Admin name" required />
                  </div>
                  <div>
                    <label style={labelStyle}>Email (read-only)</label>
                    <input className="input" value={user.email} disabled style={{ opacity: 0.5, cursor: 'not-allowed' }} />
                  </div>
                  <div>
                    <label style={labelStyle}><Phone size={13} style={{ display: 'inline', marginRight: 4 }} />Phone Number</label>
                    <input className="input" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="+91 98765 43210" />
                  </div>
                </div>
              </div>

              {/* Role Badge */}
              <div className="glass-card" style={{ padding: 20, display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{ background: 'rgba(245,158,11,0.15)', padding: 12, borderRadius: 12, color: '#f59e0b' }}><ShieldCheck size={22} /></div>
                <div>
                  <p style={{ fontWeight: 600 }}>Administrator Role</p>
                  <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>Full platform access · Cannot be changed here</p>
                </div>
              </div>

              {/* Save */}
              <button type="submit" className="btn-primary pulse-glow" disabled={saving} style={{ alignSelf: 'flex-end', padding: '13px 32px', fontSize: 15, display: 'flex', alignItems: 'center', gap: 8, background: 'linear-gradient(135deg,#f59e0b,#ef4444)', border: 'none' }}>
                <Save size={16} /> {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </form>
          )}
        </div>
      </main>
    </div>
  );
}

const labelStyle = { fontSize: 13, fontWeight: 500, color: 'var(--text-muted)', display: 'block', marginBottom: 6 };
