'use client';
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  User, Camera, Phone, Stethoscope, LogOut, Save, ChevronLeft,
  Briefcase, Globe, MapPin, DollarSign, BookOpen, X, Plus
} from 'lucide-react';
import toast from 'react-hot-toast';

const SPECIALIZATIONS = ['General Physician', 'Cardiologist', 'Dermatologist', 'Neurologist', 'Orthopedic', 'Pediatrician', 'Psychiatrist', 'Gynecologist', 'Ophthalmologist', 'ENT Specialist', 'Dentist', 'Oncologist', 'Endocrinologist', 'Urologist', 'Radiologist'];
const CONSULT_TYPES = ['Online', 'In-person', 'Both'];
const COMMON_LANGS = ['English', 'Hindi', 'Telugu', 'Tamil', 'Kannada', 'Malayalam', 'Marathi', 'Bengali', 'Gujarati'];

export default function DoctorProfile() {
  const { user, loading: authLoading, logout } = useAuth();
  const router = useRouter();
  const fileInputRef = useRef(null);
  const qualInputRef = useRef(null);

  const [form, setForm] = useState({
    name: '', phone: '', avatar: '',
    specialization: '', bio: '', fee: '', experience: '',
    hospital: '', clinicAddress: '', qualifications: [],
    languages: ['English'], consultationType: 'Both',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [qualInput, setQualInput] = useState('');

  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.push('/login'); return; }
    fetch('/api/profile/doctor')
      .then(r => r.json())
      .then(data => {
        if (data.user && data.doctor) {
          const u = data.user, d = data.doctor;
          setForm({
            name: u.name || '', phone: u.phone || '', avatar: u.avatar || '',
            specialization: d.specialization || '', bio: d.bio || '',
            fee: d.fee || '', experience: d.experience || '',
            hospital: d.hospital || '', clinicAddress: d.clinicAddress || '',
            qualifications: d.qualifications || [],
            languages: d.languages?.length ? d.languages : ['English'],
            consultationType: d.consultationType || 'Both',
          });
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

  const addQualification = () => {
    const val = qualInput.trim();
    if (val && !form.qualifications.includes(val)) {
      setForm(f => ({ ...f, qualifications: [...f.qualifications, val] }));
      setQualInput('');
    }
  };

  const removeQualification = (q) => setForm(f => ({ ...f, qualifications: f.qualifications.filter(x => x !== q) }));

  const toggleLanguage = (lang) => {
    setForm(f => ({
      ...f,
      languages: f.languages.includes(lang) ? f.languages.filter(l => l !== lang) : [...f.languages, lang],
    }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/profile/doctor', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, fee: Number(form.fee), experience: Number(form.experience) }),
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
          <p style={{ fontWeight: 600, fontSize: 14 }}>Dr. {user.name}</p>
          <p style={{ color: 'var(--text-muted)', fontSize: 12 }}>Doctor</p>
        </div>
        <nav style={{ flex: 1 }}>
          {[
            { icon: <Stethoscope size={18} />, label: 'Dashboard', href: '/dashboard/doctor' },
            { icon: <User size={18} />, label: 'My Profile', href: '/dashboard/doctor/profile' },
          ].map((item) => (
            <Link key={item.label} href={item.href} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderRadius: 10, textDecoration: 'none', marginBottom: 4, transition: 'all 0.2s', background: item.href === '/dashboard/doctor/profile' ? 'rgba(14,165,233,0.1)' : 'transparent', color: item.href === '/dashboard/doctor/profile' ? 'var(--accent)' : 'var(--text-muted)' }}>
              {item.icon}{item.label}
            </Link>
          ))}
        </nav>
        <button onClick={logout} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', borderRadius: 10, background: 'none', border: '1px solid var(--border)', color: 'var(--text-muted)', cursor: 'pointer', width: '100%', fontSize: 14 }}>
          <LogOut size={16} /> Sign Out
        </button>
      </aside>

      {/* Main */}
      <main style={{ flex: 1, padding: '32px', overflowY: 'auto' }}>
        <div style={{ maxWidth: 820, margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 32 }}>
            <Link href="/dashboard/doctor" style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', textDecoration: 'none' }}><ChevronLeft size={20} /></Link>
            <div>
              <h1 style={{ fontSize: 26, fontWeight: 800 }}>Doctor Profile</h1>
              <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 2 }}>Your professional information shown to patients</p>
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
                    <button type="button" className="btn-secondary" style={{ fontSize: 13, padding: '8px 16px' }} onClick={() => fileInputRef.current?.click()}>Choose File</button>
                    {form.avatar && (
                      <button type="button" style={{ marginLeft: 8, fontSize: 13, padding: '8px 16px', background: 'none', border: '1px solid rgba(239,68,68,0.4)', color: '#ef4444', borderRadius: 8, cursor: 'pointer' }} onClick={() => setForm(f => ({ ...f, avatar: '' }))}>Remove</button>
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
                    <input className="input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Dr. Full Name" required />
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

              {/* Professional Details */}
              <div className="glass-card" style={{ padding: 28 }}>
                <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}><Briefcase size={18} /> Professional Details</h2>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div>
                    <label style={labelStyle}>Specialization</label>
                    <select className="input" value={form.specialization} onChange={e => setForm(f => ({ ...f, specialization: e.target.value }))} required style={{ cursor: 'pointer' }}>
                      <option value="">Select specialization</option>
                      {SPECIALIZATIONS.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={labelStyle}><Briefcase size={13} style={{ display: 'inline', marginRight: 4 }} />Experience (years)</label>
                    <input className="input" type="number" min="0" max="60" value={form.experience} onChange={e => setForm(f => ({ ...f, experience: e.target.value }))} placeholder="e.g. 5" />
                  </div>
                  <div>
                    <label style={labelStyle}><DollarSign size={13} style={{ display: 'inline', marginRight: 4 }} />Consultation Fee (₹)</label>
                    <input className="input" type="number" min="0" value={form.fee} onChange={e => setForm(f => ({ ...f, fee: e.target.value }))} placeholder="e.g. 500" />
                  </div>
                  <div>
                    <label style={labelStyle}>Hospital / Clinic Name</label>
                    <input className="input" value={form.hospital} onChange={e => setForm(f => ({ ...f, hospital: e.target.value }))} placeholder="e.g. Apollo Hospitals" />
                  </div>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label style={labelStyle}><MapPin size={13} style={{ display: 'inline', marginRight: 4 }} />Clinic Address</label>
                    <input className="input" value={form.clinicAddress} onChange={e => setForm(f => ({ ...f, clinicAddress: e.target.value }))} placeholder="Full clinic address" />
                  </div>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label style={labelStyle}><BookOpen size={13} style={{ display: 'inline', marginRight: 4 }} />Bio</label>
                    <textarea className="input" value={form.bio} onChange={e => setForm(f => ({ ...f, bio: e.target.value }))} placeholder="Tell patients about your expertise and approach..." rows={4} style={{ resize: 'vertical' }} />
                  </div>
                </div>
              </div>

              {/* Qualifications */}
              <div className="glass-card" style={{ padding: 28 }}>
                <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}><BookOpen size={18} /> Qualifications</h2>
                <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                  <input
                    ref={qualInputRef}
                    className="input"
                    value={qualInput}
                    onChange={e => setQualInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addQualification(); } }}
                    placeholder="e.g. MBBS, MD Cardiology..."
                    style={{ flex: 1 }}
                  />
                  <button type="button" className="btn-secondary" onClick={addQualification} style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Plus size={15} /> Add
                  </button>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {form.qualifications.map(q => (
                    <span key={q} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(14,165,233,0.12)', border: '1px solid rgba(14,165,233,0.2)', borderRadius: 20, padding: '5px 12px', fontSize: 13, fontWeight: 500, color: 'var(--accent)' }}>
                      {q}
                      <button type="button" onClick={() => removeQualification(q)} style={{ background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', padding: 0, display: 'flex' }}><X size={12} /></button>
                    </span>
                  ))}
                  {form.qualifications.length === 0 && <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>No qualifications added yet.</p>}
                </div>
              </div>

              {/* Consultation Preferences */}
              <div className="glass-card" style={{ padding: 28 }}>
                <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}><Globe size={18} /> Consultation Preferences</h2>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                  <div>
                    <label style={labelStyle}>Consultation Type</label>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      {CONSULT_TYPES.map(ct => (
                        <button key={ct} type="button" onClick={() => setForm(f => ({ ...f, consultationType: ct }))} style={{ padding: '8px 16px', borderRadius: 8, border: `1px solid ${form.consultationType === ct ? 'var(--accent)' : 'var(--border)'}`, background: form.consultationType === ct ? 'rgba(14,165,233,0.12)' : 'transparent', color: form.consultationType === ct ? 'var(--accent)' : 'var(--text-muted)', cursor: 'pointer', fontWeight: 500, fontSize: 13, transition: 'all 0.2s' }}>
                          {ct}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label style={labelStyle}>Languages Spoken</label>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      {COMMON_LANGS.map(lang => (
                        <button key={lang} type="button" onClick={() => toggleLanguage(lang)} style={{ padding: '7px 12px', borderRadius: 8, border: `1px solid ${form.languages.includes(lang) ? 'var(--accent)' : 'var(--border)'}`, background: form.languages.includes(lang) ? 'rgba(14,165,233,0.12)' : 'transparent', color: form.languages.includes(lang) ? 'var(--accent)' : 'var(--text-muted)', cursor: 'pointer', fontSize: 12, fontWeight: 500, transition: 'all 0.2s' }}>
                          {lang}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Save */}
              <button type="submit" className="btn-primary pulse-glow" disabled={saving} style={{ alignSelf: 'flex-end', padding: '13px 32px', fontSize: 15, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Save size={16} /> {saving ? 'Saving...' : 'Save Profile'}
              </button>
            </form>
          )}
        </div>
      </main>
    </div>
  );
}

const labelStyle = { fontSize: 13, fontWeight: 500, color: 'var(--text-muted)', display: 'block', marginBottom: 6 };
