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
    <div className="w-full relative min-h-[calc(100vh-150px)] flex flex-col items-center justify-center p-4">
      <style jsx global>{`
        .premium-input {
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 14px;
          padding: 12px 18px;
          color: white;
          width: 100%;
          transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
          font-size: 14px;
          backdrop-filter: blur(10px);
        }
        .premium-input:focus {
          outline: none;
          border-color: rgba(255, 255, 255, 0.3);
          background: rgba(255, 255, 255, 0.04);
          box-shadow: 0 0 15px rgba(255, 255, 255, 0.1);
        }
        .glass-card-new {
          background: rgba(255, 255, 255, 0.01);
          backdrop-filter: blur(30px);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 24px;
          position: relative;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
        }
        .field-label {
          font-size: 11px;
          font-weight: 600;
          color: rgba(255, 255, 255, 0.4);
          margin-bottom: 8px;
          margin-left: 4px;
          display: block;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 10px;
        }
      `}</style>

      <main className="max-w-5xl w-full mx-auto py-12 relative z-10 flex flex-col gap-10">
        <div className="flex items-center gap-6">
          <Link href="/dashboard/doctor" className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/5 transition-all text-white/40">
            <ChevronLeft size={20} />
          </Link>
          <div className="flex flex-col gap-1">
            <h1 className="text-3xl font-bold tracking-tight text-white/90">Clinical identity</h1>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 gap-6">
             <div className="size-12 border-2 border-white/5 border-t-white animate-spin rounded-full shadow-[0_0_20px_rgba(255,255,255,0.05)]" />
             <p className="text-white/20 text-[10px] font-medium tracking-widest uppercase animate-pulse">Establishing professional sync</p>
          </div>
        ) : (
          <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
            {/* Left Column: Profile & Personal */}
            <div className="lg:col-span-4 space-y-8">
              {/* Photo Card */}
              <div className="glass-card-new p-8 border border-white/5">
                <div className="flex flex-col items-center gap-6">
                  <div 
                    className="relative cursor-pointer group"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {form.avatar ? (
                      <img src={form.avatar} alt="avatar" className="size-32 rounded-3xl object-cover border border-white/10 shadow-2xl transition-transform duration-500 group-hover:scale-105" />
                    ) : (
                      <div className="size-32 rounded-3xl bg-white/5 flex items-center justify-center text-4xl font-bold text-white shadow-2xl">{initials}</div>
                    )}
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center rounded-3xl transition-opacity">
                      <Camera size={24} className="text-white" />
                    </div>
                  </div>
                  
                  <div className="text-center space-y-2">
                    <p className="text-white/80 font-semibold text-sm">Professional portrait</p>
                    <p className="text-white/20 text-[9px] font-medium">JPG, PNG · Max 1.5mb</p>
                  </div>

                  <div className="flex gap-2 w-full pt-2">
                    <button type="button" onClick={() => fileInputRef.current?.click()} className="flex-1 py-2.5 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 text-[10px] font-bold tracking-widest transition-all">Upload</button>
                    {form.avatar && (
                      <button type="button" onClick={() => setForm(f => ({ ...f, avatar: '' }))} className="px-4 py-2.5 bg-white/5 hover:bg-red-500 border border-white/10 hover:border-red-500 text-white/40 hover:text-white transition-all"><X size={14} /></button>
                    )}
                  </div>
                  <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
                </div>
              </div>

              {/* Basic Personal Info */}
              <div className="glass-card-new p-10 border border-white/5">
                <div className="flex items-center gap-3 mb-8">
                  <User size={16} className="text-white/30" />
                  <h3 className="text-sm font-semibold text-white/60">Core registry</h3>
                </div>
                <div className="space-y-6">
                  <div>
                    <label className="field-label">Official name</label>
                    <input className="premium-input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Dr. Enter Name" required />
                  </div>
                  <div>
                    <label className="field-label">Digital coordinate (email)</label>
                    <input className="premium-input opacity-40 cursor-not-allowed" value={user.email} disabled />
                  </div>
                  <div>
                    <label className="field-label">Verified contact</label>
                    <input className="premium-input" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="+91..." />
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Professional & Qualifications */}
            <div className="lg:col-span-8 space-y-8">
              {/* Professional Specs */}
              <div className="glass-card-new p-10 border border-white/5">
                <div className="flex items-center gap-3 mb-10">
                  <Briefcase size={18} className="text-white/30" />
                  <h3 className="text-sm font-semibold text-white/60">Clinical expertise</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-10">
                  <div>
                    <label className="field-label">Neural specialization</label>
                    <select className="premium-input" value={form.specialization} onChange={e => setForm(f => ({ ...f, specialization: e.target.value }))} required>
                      <option value="">Select domain</option>
                      {SPECIALIZATIONS.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <label className="field-label">Seniority (yrs)</label>
                      <input className="premium-input" type="number" min="0" value={form.experience} onChange={e => setForm(f => ({ ...f, experience: e.target.value }))} />
                    </div>
                    <div>
                      <label className="field-label">Protocol fee (₹)</label>
                      <input className="premium-input" type="number" min="0" value={form.fee} onChange={e => setForm(f => ({ ...f, fee: e.target.value }))} />
                    </div>
                  </div>
                  <div className="md:col-span-2">
                    <label className="field-label">Primary institution / hospital</label>
                    <input className="premium-input" value={form.hospital} onChange={e => setForm(f => ({ ...f, hospital: e.target.value }))} placeholder="e.g. Center for advanced medicine" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="field-label">Geographic presence (address)</label>
                    <input className="premium-input" value={form.clinicAddress} onChange={e => setForm(f => ({ ...f, clinicAddress: e.target.value }))} placeholder="Specify clinical locus" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="field-label">Professional briefing (bio)</label>
                    <textarea className="premium-input min-h-[140px] resize-none custom-scrollbar" value={form.bio} onChange={e => setForm(f => ({ ...f, bio: e.target.value }))} placeholder="Synthesize your professional approach..." />
                  </div>
                </div>
              </div>

              {/* Qualifications & Skills */}
              <div className="glass-card-new p-10 border border-white/5">
                <div className="flex items-center gap-3 mb-10">
                  <BookOpen size={18} className="text-white/30" />
                  <h3 className="text-sm font-semibold text-white/60">Credential stack</h3>
                </div>
                
                <div className="space-y-8">
                  <div className="flex gap-4">
                    <input 
                      ref={qualInputRef}
                      className="premium-input flex-1" 
                      value={qualInput} 
                      onChange={e => setQualInput(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addQualification(); } }}
                      placeholder="Add qualification (e.g. mbbs, fellowship...)" 
                    />
                    <button type="button" onClick={addQualification} className="px-8 bg-white/5 hover:bg-white border border-white/10 hover:border-white rounded-2xl text-[10px] font-bold tracking-widest transition-all flex items-center gap-3">
                      Insert
                    </button>
                  </div>
                  
                  <div className="flex flex-wrap gap-3 min-h-[40px]">
                    {form.qualifications.map(q => (
                      <button key={q} type="button" onClick={() => removeQualification(q)} className="group px-4 py-2 bg-white/5 hover:bg-red-500/5 border border-white/10 hover:border-red-500/20 rounded-xl flex items-center gap-3 transition-all">
                        <span className="text-[11px] font-semibold text-white/40 group-hover:text-red-400">{q}</span>
                        <X size={12} className="text-white/20 group-hover:text-red-400" />
                      </button>
                    ))}
                    {form.qualifications.length === 0 && <p className="text-white/10 text-[11px] font-medium italic py-2">No credentials initialized</p>}
                  </div>
                </div>

                <div className="h-px bg-white/5 my-10" />

                <div className="space-y-6">
                  <div className="flex items-center gap-3">
                    <Globe size={16} className="text-white/30" />
                    <label className="field-label mb-0">Linguistic capabilities</label>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {COMMON_LANGS.map(lang => (
                      <button key={lang} type="button" onClick={() => toggleLanguage(lang)} className={`px-4 py-2 rounded-xl text-[10px] font-bold tracking-widest transition-all border ${form.languages.includes(lang) ? 'bg-white border-white text-black' : 'bg-white/5 border-white/5 text-white/30 hover:bg-white/10'}`}>
                        {lang}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Consultation Preference & Save */}
              <div className="flex flex-col md:flex-row items-center justify-between gap-10">
                <div className="glass-card-new px-8 py-6 border border-white/5 flex items-center gap-8">
                  <span className="text-[10px] font-semibold text-white/20 uppercase tracking-widest shrink-0">Consult type:</span>
                  <div className="flex gap-2">
                    {CONSULT_TYPES.map(ct => (
                      <button key={ct} type="button" onClick={() => setForm(f => ({ ...f, consultationType: ct }))} className={`px-5 py-2.5 rounded-xl text-[10px] font-bold tracking-widest transition-all border ${form.consultationType === ct ? 'bg-white/10 border-white/20 text-white' : 'bg-transparent border-transparent text-white/20 hover:text-white/40'}`}>
                        {ct}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex-1 flex justify-center">
                  <button type="submit" disabled={saving} className="px-24 py-6 bg-white/5 hover:bg-white border border-white/10 hover:border-white rounded-full shadow-2xl text-white/80 hover:text-black font-bold text-sm tracking-widest uppercase flex items-center justify-center gap-4 backdrop-blur-xl transition-all duration-300 active:scale-95 disabled:opacity-30">
                    {saving ? 'Saving changes...' : 'Save changes'}
                  </button>
                </div>
              </div>
            </div>
          </form>
        )}
      </main>
    </div>
  );
}

const labelStyle = { fontSize: 13, fontWeight: 500, color: 'var(--text-muted)', display: 'block', marginBottom: 6 };
