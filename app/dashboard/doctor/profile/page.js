'use client';
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import {
  Camera, X, Save, CheckCircle, AlertCircle,
  User, Briefcase, Globe, BookOpen, ChevronUp, ChevronDown
} from 'lucide-react';
import toast from 'react-hot-toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const SPECIALIZATIONS = [
  'General Physician', 'Cardiologist', 'Dermatologist', 'Neurologist',
  'Orthopedic', 'Pediatrician', 'Psychiatrist', 'Gynecologist',
  'Ophthalmologist', 'ENT Specialist', 'Dentist', 'Oncologist',
  'Endocrinologist', 'Urologist', 'Radiologist'
];

const CONSULT_TYPES = ['Online', 'In-person', 'Both'];

const COMMON_LANGS = [
  'English', 'Hindi', 'Telugu', 'Tamil',
  'Kannada', 'Malayalam', 'Marathi', 'Bengali', 'Gujarati'
];

// ─── Animated Avatar ──────────────────────────────────────────────────────────

function AnimatedAvatar({ name = '', rating = 0, isOnline = false, avatarUrl = '', gender = '' }) {
  const initials = name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'DR';

  const MaleAvatar = () => (
    <svg width="140" height="140" viewBox="0 0 140 140" style={{ borderRadius: '50%' }}>
      <circle cx="70" cy="70" r="70" fill="#0d1117"/>
      <ellipse cx="70" cy="118" rx="38" ry="28" fill="#f0f4ff"/>
      <rect x="62" y="88" width="16" height="16" rx="4" fill="#e8b89a"/>
      <path d="M62 96 L70 106 L78 96 L74 90 L66 90Z" fill="#3b82f6"/>
      <ellipse cx="70" cy="72" rx="24" ry="26" fill="#e8b89a"/>
      <path d="M46 66 Q48 44 70 42 Q92 44 94 66 Q88 52 70 50 Q52 52 46 66Z" fill="#2d1a06"/>
      <ellipse cx="62" cy="70" rx="4" ry="4.5" fill="#1a202c"/>
      <ellipse cx="78" cy="70" rx="4" ry="4.5" fill="#1a202c"/>
      <ellipse cx="63" cy="68.5" rx="1.5" ry="1.5" fill="white"/>
      <ellipse cx="79" cy="68.5" rx="1.5" ry="1.5" fill="white"/>
      <path d="M57 64 Q62 62 67 64" fill="none" stroke="#2d1a06" strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M73 64 Q78 62 83 64" fill="none" stroke="#2d1a06" strokeWidth="1.5" strokeLinecap="round"/>
      <ellipse cx="70" cy="77" rx="3" ry="2" fill="#d4956a"/>
      <path d="M63 83 Q70 88 77 83" fill="none" stroke="#c4855a" strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M58 100 Q52 108 56 116 Q60 122 66 120" fill="none" stroke="#374151" strokeWidth="2" strokeLinecap="round"/>
      <circle cx="66" cy="120" r="3" fill="#6b7280"/>
      <circle cx="58" cy="100" r="2" fill="#374151"/>
      <path d="M32 140 Q45 110 62 96 L70 106 L55 140Z" fill="white"/>
      <path d="M108 140 Q95 110 78 96 L70 106 L85 140Z" fill="white"/>
    </svg>
  );

  const FemaleAvatar = () => (
    <svg width="140" height="140" viewBox="0 0 140 140" style={{ borderRadius: '50%' }}>
      <circle cx="70" cy="70" r="70" fill="#0d1117"/>
      <ellipse cx="70" cy="118" rx="38" ry="28" fill="#f0f4ff"/>
      <rect x="62" y="88" width="16" height="16" rx="4" fill="#f0c4a8"/>
      <path d="M62 96 L70 104 L78 96 L74 90 L66 90Z" fill="#ec4899"/>
      <ellipse cx="70" cy="72" rx="24" ry="26" fill="#f0c4a8"/>
      <ellipse cx="70" cy="64" rx="28" ry="30" fill="#1a0a0a"/>
      <ellipse cx="70" cy="72" rx="22" ry="24" fill="#f0c4a8"/>
      <path d="M46 72 Q42 95 46 115" fill="none" stroke="#1a0a0a" strokeWidth="10" strokeLinecap="round"/>
      <path d="M94 72 Q98 95 94 115" fill="none" stroke="#1a0a0a" strokeWidth="10" strokeLinecap="round"/>
      <path d="M46 68 Q50 44 70 42 Q90 44 94 68 Q88 50 70 50 Q52 50 46 68Z" fill="#1a0a0a"/>
      <ellipse cx="62" cy="70" rx="4.5" ry="5" fill="#1a202c"/>
      <ellipse cx="78" cy="70" rx="4.5" ry="5" fill="#1a202c"/>
      <ellipse cx="63.5" cy="68.5" rx="1.5" ry="1.5" fill="white"/>
      <ellipse cx="79.5" cy="68.5" rx="1.5" ry="1.5" fill="white"/>
      <path d="M57.5 65.5 Q62 63 67 65" fill="none" stroke="#1a0a0a" strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M73 65 Q78 63 82.5 65.5" fill="none" stroke="#1a0a0a" strokeWidth="1.5" strokeLinecap="round"/>
      <ellipse cx="70" cy="77" rx="2.5" ry="2" fill="#dba07a"/>
      <path d="M64 83 Q70 88 76 83" fill="none" stroke="#d4856a" strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M58 100 Q52 108 56 116 Q60 122 66 120" fill="none" stroke="#374151" strokeWidth="2" strokeLinecap="round"/>
      <circle cx="66" cy="120" r="3" fill="#6b7280"/>
      <circle cx="58" cy="100" r="2" fill="#374151"/>
      <path d="M32 140 Q45 110 62 96 L70 106 L55 140Z" fill="white"/>
      <path d="M108 140 Q95 110 78 96 L70 106 L85 140Z" fill="white"/>
    </svg>
  );

  const DefaultAvatar = () => (
    <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg,rgba(59,130,246,0.25),rgba(139,92,246,0.2))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <span style={{ fontSize: '38px', fontWeight: '800', color: '#60a5fa', letterSpacing: '-1px', lineHeight: 1 }}>{initials}</span>
    </div>
  );

  return (
    <div style={{ position: 'relative', width: '140px', height: '140px', margin: '0 auto' }}>
      <style>{`
        @keyframes av-spin { to { transform: rotate(360deg); } }
        @keyframes av-spin-r { to { transform: rotate(-360deg); } }
        @keyframes av-pulse { 0%,100%{opacity:.12;transform:scale(1)} 50%{opacity:.3;transform:scale(1.07)} }
        @keyframes av-float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-5px)} }
        @keyframes av-glow { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.5;transform:scale(0.85)} }
        
        /* Hide number input arrows */
        input::-webkit-outer-spin-button,
        input::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
        input[type=number] { -moz-appearance: textfield; }
      `}</style>
      <div style={{ position:'absolute', inset:'-22px', borderRadius:'50%', border:'1px dashed rgba(59,130,246,0.18)', animation:'av-spin 20s linear infinite', pointerEvents:'none' }} />
      <div style={{ position:'absolute', inset:'-38px', borderRadius:'50%', border:'1px dashed rgba(139,92,246,0.1)', animation:'av-spin-r 28s linear infinite', pointerEvents:'none' }} />
      <div style={{ position:'absolute', inset:'-8px', borderRadius:'50%', border:'1.5px solid rgba(59,130,246,0.14)', animation:'av-pulse 3.5s ease-in-out infinite', pointerEvents:'none' }} />
      <svg style={{ position:'absolute', inset:'-12px', width:'164px', height:'164px', pointerEvents:'none' }} viewBox="0 0 164 164">
        <circle cx="82" cy="82" r="78" fill="none" stroke="rgba(59,130,246,0.25)" strokeWidth="1.5"
          strokeDasharray="10 8"
          style={{ animation:'av-spin 16s linear infinite', transformOrigin:'82px 82px' }} />
      </svg>
      <div style={{ position:'absolute', inset:0, borderRadius:'50%', overflow:'hidden', animation:'av-float 4s ease-in-out infinite', border:'2px solid rgba(59,130,246,0.25)' }}>
        {avatarUrl ? (
          <img src={avatarUrl} alt={name} style={{ width:'100%', height:'100%', objectFit:'cover' }} />
        ) : gender === 'male' ? <MaleAvatar />
          : gender === 'female' ? <FemaleAvatar />
          : <DefaultAvatar />}
      </div>
      <div style={{ position:'absolute', bottom:'4px', right:'4px', width:'16px', height:'16px', borderRadius:'50%', background: isOnline ? '#4ade80' : 'rgba(255,255,255,0.15)', border:'2.5px solid #050608', animation: isOnline ? 'av-glow 2s ease-in-out infinite' : 'none', zIndex:2 }} />
      {rating > 0 && (
        <div style={{ position:'absolute', top:'16px', right:'-36px', background:'rgba(245,158,11,0.12)', border:'0.5px solid rgba(245,158,11,0.3)', borderRadius:'8px', padding:'4px 8px', zIndex:2 }}>
          <span style={{ fontSize:'11px', fontWeight:'700', color:'#fbbf24' }}>{Number(rating).toFixed(1)} ★</span>
        </div>
      )}
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

// Minimalist stepper for number fields
function StepperInput({ value, onChange, min = 0, step = 1, placeholder }) {
  return (
    <div style={{ position:'relative', display:'flex', alignItems:'center' }}>
      <input {...inp({ paddingRight:'32px', background:'transparent' })} type="number" min={min} value={value}
        onChange={e => onChange(e.target.value)} placeholder={placeholder} />
      <div style={{ position:'absolute', right:'8px', display:'flex', flexDirection:'column', gap:'1px' }}>
        <button type="button"
          onClick={() => onChange(String(Number(value || 0) + step))}
          style={{ background:'none', border:'none', cursor:'pointer', color:'rgba(255,255,255,0.2)', padding:'1px', display:'flex', lineHeight:1, transition:'color 0.1s' }}
          onMouseEnter={e => e.currentTarget.style.color = 'rgba(255,255,255,0.7)'}
          onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.2)'}>
          <ChevronUp size={12} />
        </button>
        <button type="button"
          onClick={() => onChange(String(Math.max(min, Number(value || 0) - step)))}
          style={{ background:'none', border:'none', cursor:'pointer', color:'rgba(255,255,255,0.2)', padding:'1px', display:'flex', lineHeight:1, transition:'color 0.1s' }}
          onMouseEnter={e => e.currentTarget.style.color = 'rgba(255,255,255,0.7)'}
          onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.2)'}>
          <ChevronDown size={12} />
        </button>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function DoctorProfile() {
  const { user, loading: authLoading } = useAuth();
  const router  = useRouter();
  const fileRef = useRef(null);

  const [form, setForm] = useState({
    name: '', phone: '', avatar: '', gender: '',
    specialization: '', bio: '', fee: '', experience: '',
    hospital: '', clinicAddress: '', qualifications: [],
    languages: ['English'], consultationType: 'Both',
  });
  const [meta, setMeta]           = useState({ rating: 0, totalReviews: 0, isApproved: false });
  const [loading, setLoading]     = useState(true);
  const [saving, setSaving]       = useState(false);
  const [qualInput, setQualInput] = useState('');

  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.push('/login'); return; }
    fetch('/api/profile/doctor', { credentials: 'include' })
      .then(r => r.json())
      .then(data => {
        if (data.user && data.doctor) {
          const u = data.user, d = data.doctor;
          setForm({
            name: u.name || '', phone: u.phone || '', avatar: u.avatar || '', gender: u.gender || '',
            specialization: d.specialization || '', bio: d.bio || '',
            fee: d.fee || '', experience: d.experience || '',
            hospital: d.hospital || '', clinicAddress: d.clinicAddress || '',
            qualifications: d.qualifications || [],
            languages: d.languages?.length ? d.languages : ['English'],
            consultationType: d.consultationType || 'Both',
          });
          setMeta({ rating: d.rating || 0, totalReviews: d.totalReviews || 0, isApproved: d.isApproved || false });
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

  const addQual = () => {
    const val = qualInput.trim();
    if (val && !form.qualifications.includes(val)) {
      setForm(f => ({ ...f, qualifications: [...f.qualifications, val] }));
      setQualInput('');
    }
  };

  const toggleLang = (lang) => setForm(f => ({
    ...f,
    languages: f.languages.includes(lang)
      ? f.languages.filter(l => l !== lang)
      : [...f.languages, lang],
  }));

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/profile/doctor', {
        method: 'PUT', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, fee: Number(form.fee), experience: Number(form.experience) }),
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
      <div className="size-10 border-2 border-blue-500/20 border-t-blue-500 animate-spin rounded-full" />
      <p style={{ fontSize:'11px', color:'rgba(255,255,255,0.2)', textTransform:'uppercase', letterSpacing:'0.12em' }}>Loading...</p>
    </div>
  );

  return (
    <form onSubmit={handleSave} style={{ display:'flex', flexDirection:'column', gap:'28px', width:'100%', paddingBottom:'80px' }}>

      {/* Header */}
      <div>
        <div style={{ fontSize:'10px', fontWeight:'700', textTransform:'uppercase', letterSpacing:'0.2em', color:'rgba(255,255,255,0.2)', marginBottom:'4px' }}>Doctor Portal</div>
        <h1 style={{ fontSize:'26px', fontWeight:'900', color:'#fff', letterSpacing:'-0.5px', margin:0 }}>My Profile</h1>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'280px 1fr', gap:'20px', alignItems:'start' }}>

        {/* ── Left Column ── */}
        <div style={{ display:'flex', flexDirection:'column', gap:'16px' }}>

          {/* Avatar Card — compact */}
          <div style={{ ...card, padding:'28px 20px', display:'flex', flexDirection:'column', alignItems:'center', gap:'16px' }}>

            <div style={{ position:'relative' }}>
              <AnimatedAvatar
                name={form.name}
                rating={meta.rating}
                isOnline={true}
                avatarUrl={form.avatar}
                gender={form.gender}
              />
              {/* Camera button */}
              <button type="button" onClick={() => fileRef.current?.click()}
                style={{ position:'absolute', bottom:'4px', left:'4px', width:'26px', height:'26px', borderRadius:'50%', background:'rgba(0,0,0,0.7)', border:'1px solid rgba(255,255,255,0.15)', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', zIndex:3, transition:'all 0.15s' }}
                onMouseEnter={e => { e.currentTarget.style.background = '#3b82f6'; e.currentTarget.style.borderColor = '#3b82f6'; }}
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
              <h2 style={{ fontSize:'16px', fontWeight:'800', color:'#fff', margin:'0 0 3px' }}>Dr. {form.name || 'Your Name'}</h2>
              <p style={{ fontSize:'12px', color:'rgba(59,130,246,0.8)', margin:0 }}>{form.specialization || 'Specialist'}</p>
            </div>

            <div style={{ display:'flex', alignItems:'center', gap:'6px', padding:'5px 14px', borderRadius:'99px', background: meta.isApproved ? 'rgba(34,197,94,0.1)' : 'rgba(245,158,11,0.1)', border:`0.5px solid ${meta.isApproved ? 'rgba(34,197,94,0.25)' : 'rgba(245,158,11,0.25)'}` }}>
              {meta.isApproved
                ? <CheckCircle size={12} style={{ color:'#4ade80' }} />
                : <AlertCircle size={12} style={{ color:'#fbbf24' }} />}
              <span style={{ fontSize:'11px', fontWeight:'600', color: meta.isApproved ? '#4ade80' : '#fbbf24' }}>
                {meta.isApproved ? 'Approved' : 'Pending approval'}
              </span>
            </div>

            <div style={{ height:'0.5px', background:'rgba(255,255,255,0.06)', width:'100%' }} />

            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'8px', width:'100%' }}>
              {[
                { label:'Rating', value: meta.rating > 0 ? `${Number(meta.rating).toFixed(1)}★` : '—', color:'#fbbf24' },
                { label:'Reviews', value: meta.totalReviews || 0, color:'#60a5fa' },
                { label:'Fee', value: form.fee ? `₹${Number(form.fee).toLocaleString()}` : '—', color:'#4ade80' },
                { label:'Exp.', value: form.experience ? `${form.experience}y` : '—', color:'#a78bfa' },
              ].map(s => (
                <div key={s.label} style={{ background:'rgba(255,255,255,0.02)', border:'0.5px solid rgba(255,255,255,0.05)', borderRadius:'10px', padding:'10px', textAlign:'center' }}>
                  <div style={{ fontSize:'14px', fontWeight:'800', color: s.color, lineHeight:1 }}>{s.value}</div>
                  <div style={{ fontSize:'9px', color:'rgba(255,255,255,0.25)', textTransform:'uppercase', letterSpacing:'0.08em', marginTop:'3px' }}>{s.label}</div>
                </div>
              ))}
            </div>

            {form.languages?.length > 0 && (
              <div style={{ width:'100%', marginTop:'12px', display:'flex', flexWrap:'wrap', gap:'6px', justifyContent:'center', opacity:0.8 }}>
                {form.languages.map(l => (
                  <span key={l} style={{ fontSize:'9px', padding:'4px 10px', borderRadius:'6px', background:'rgba(255,255,255,0.05)', border:'0.5px solid rgba(255,255,255,0.1)', color:'rgba(255,255,255,0.5)', fontWeight:'700', textTransform:'uppercase', letterSpacing:'0.05em' }}>{l}</span>
                ))}
              </div>
            )}
          </div>

          {/* Contact Info */}
          <div style={{ ...card, padding:'20px 22px' }}>
            <SectionHeader icon={User} title="Contact" color="#60a5fa" bg="rgba(59,130,246,0.1)" />
            <div style={{ display:'flex', flexDirection:'column', gap:'12px' }}>
              <div>
                <Label>Full name</Label>
                <input {...inp()} value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Dr. Full Name" required />
              </div>
              <div>
                <Label>Email</Label>
                <input {...inp({ opacity:0.4, cursor:'not-allowed' })} value={user.email} disabled />
              </div>
              <div>
                <Label>Phone</Label>
                <input {...inp()} value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="+91 98765 43210" />
              </div>
              <div>
                <Label>Gender</Label>
                <div style={{ display:'flex', gap:'6px' }}>
                  {['male', 'female', 'other'].map(g => {
                    const active = form.gender === g;
                    return (
                      <button key={g} type="button" onClick={() => setForm(f => ({ ...f, gender: g }))}
                        style={{ 
                          flex:1, padding:'10px 6px', borderRadius:'10px', fontSize:'12px', fontWeight:'600', 
                          border:`0.5px solid ${active ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.07)'}`, 
                          background: active ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.02)', 
                          color: active ? '#fff' : 'rgba(255,255,255,0.3)', 
                          boxShadow: active ? '0 0 15px rgba(255,255,255,0.05)' : 'none',
                          cursor:'pointer', transition:'all 0.3s ease' 
                        }}>
                        {g.charAt(0).toUpperCase() + g.slice(1)}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Right Column ── */}
        <div style={{ display:'flex', flexDirection:'column', gap:'16px' }}>

          {/* Professional Details */}
          <div style={{ ...card, padding:'24px 28px' }}>
            <SectionHeader icon={Briefcase} title="Professional Details" color="#a78bfa" bg="rgba(139,92,246,0.1)" />
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'16px' }}>

              {/* Shadcn Dropdown for Specialization */}
              <div>
                <Label>Specialization</Label>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button type="button"
                      style={{ 
                        width:'100%', background: form.specialization ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.03)', 
                        border:'0.5px solid rgba(255,255,255,0.08)', borderRadius:'12px', padding:'12px 16px', fontSize:'14px', 
                        color: form.specialization ? '#fff' : 'rgba(255,255,255,0.3)', outline:'none', textAlign:'left', 
                        cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'space-between', 
                        boxSizing:'border-box', transition:'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        boxShadow: form.specialization ? '0 0 15px rgba(255,255,255,0.03)' : 'none'
                      }}
                      onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'}
                      onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'}
                    >
                      <span>{form.specialization || 'Select specialization'}</span>
                      <ChevronDown size={14} style={{ color:'rgba(255,255,255,0.3)', flexShrink:0 }} />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    className="bg-[#0a0b0d] border border-white/10 text-white rounded-xl shadow-2xl max-h-64 overflow-y-auto"
                    style={{ width:'var(--radix-dropdown-menu-trigger-width)', zIndex:50 }}
                  >
                    {SPECIALIZATIONS.map(s => (
                      <DropdownMenuItem key={s}
                        onClick={() => setForm(f => ({ ...f, specialization: s }))}
                        className={`cursor-pointer text-sm px-4 py-2.5 rounded-lg mx-1 my-0.5 transition-colors focus:bg-white focus:text-black ${form.specialization === s ? 'text-blue-400 bg-blue-500/10' : 'text-white/70 hover:bg-white/10 hover:text-white'}`}>
                        {s}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <div>
                <Label>Consultation type</Label>
                <div style={{ display:'flex', gap:'6px' }}>
                  {CONSULT_TYPES.map(ct => {
                    const active = form.consultationType === ct;
                    return (
                      <button key={ct} type="button" onClick={() => setForm(f => ({ ...f, consultationType: ct }))}
                        style={{ 
                          flex:1, padding:'12px 6px', borderRadius:'10px', fontSize:'12px', fontWeight:'600', 
                          border:`0.5px solid ${active ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.08)'}`, 
                          background: active ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.02)', 
                          color: active ? '#fff' : 'rgba(255,255,255,0.3)', 
                          boxShadow: active ? '0 0 15px rgba(255,255,255,0.05)' : 'none',
                          cursor:'pointer', transition:'all 0.3s ease' 
                        }}>
                        {ct}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Experience with stepper */}
              <div>
                <Label>Experience (years)</Label>
                <StepperInput
                  value={form.experience}
                  onChange={v => setForm(f => ({ ...f, experience: v }))}
                  min={0} step={1}
                  placeholder="10"
                />
              </div>

              {/* Fee with stepper */}
              <div>
                <Label>Consultation fee (₹)</Label>
                <StepperInput
                  value={form.fee}
                  onChange={v => setForm(f => ({ ...f, fee: v }))}
                  min={0} step={100}
                  placeholder="500"
                />
              </div>

              <div>
                <Label>Hospital / Clinic</Label>
                <input {...inp()} value={form.hospital} onChange={e => setForm(f => ({ ...f, hospital: e.target.value }))} placeholder="City Heart Hospital" />
              </div>

              <div>
                <Label>Clinic address</Label>
                <input {...inp()} value={form.clinicAddress} onChange={e => setForm(f => ({ ...f, clinicAddress: e.target.value }))} placeholder="123 Main St, Mumbai" />
              </div>

              <div style={{ gridColumn:'span 2' }}>
                <Label>Bio</Label>
                <textarea {...inp({ resize:'none', minHeight:'100px' })} value={form.bio} onChange={e => setForm(f => ({ ...f, bio: e.target.value }))} placeholder="Describe your expertise and approach to patient care..." />
              </div>
            </div>
          </div>

          {/* Qualifications */}
          <div style={{ ...card, padding:'24px 28px' }}>
            <SectionHeader icon={BookOpen} title="Qualifications" color="#4ade80" bg="rgba(34,197,94,0.1)" />
            <div style={{ display:'flex', gap:'10px', marginBottom:'14px' }}>
              <input {...inp()} value={qualInput}
                onChange={e => setQualInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addQual(); }}}
                placeholder="e.g. MBBS, MD Cardiology..." />
              <button type="button" onClick={addQual}
                style={{ padding:'12px 20px', borderRadius:'12px', background:'rgba(34,197,94,0.1)', border:'0.5px solid rgba(34,197,94,0.2)', color:'#4ade80', fontSize:'13px', fontWeight:'600', cursor:'pointer', whiteSpace:'nowrap', transition:'all 0.15s' }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(34,197,94,0.18)'}
                onMouseLeave={e => e.currentTarget.style.background = 'rgba(34,197,94,0.1)'}>
                + Add
              </button>
            </div>
            <div style={{ display:'flex', flexWrap:'wrap', gap:'8px', minHeight:'36px' }}>
              {form.qualifications.length === 0 ? (
                <p style={{ fontSize:'12px', color:'rgba(255,255,255,0.2)', fontStyle:'italic', margin:0 }}>No qualifications added yet</p>
              ) : form.qualifications.map(q => (
                <div key={q} style={{ display:'flex', alignItems:'center', gap:'6px', padding:'6px 12px', borderRadius:'99px', background:'rgba(255,255,255,0.04)', border:'0.5px solid rgba(255,255,255,0.09)' }}>
                  <span style={{ fontSize:'12px', color:'rgba(255,255,255,0.55)', fontWeight:'500' }}>{q}</span>
                  <button type="button" onClick={() => setForm(f => ({ ...f, qualifications: f.qualifications.filter(x => x !== q) }))}
                    style={{ background:'none', border:'none', cursor:'pointer', color:'rgba(255,255,255,0.25)', padding:0, display:'flex', lineHeight:1 }}>
                    <X size={12} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Languages */}
          <div style={{ ...card, padding:'24px 28px' }}>
            <SectionHeader icon={Globe} title="Languages" color="#fbbf24" bg="rgba(245,158,11,0.1)" />
            <div style={{ display:'flex', flexWrap:'wrap', gap:'8px' }}>
              {COMMON_LANGS.map(lang => {
                const active = form.languages.includes(lang);
                return (
                  <button key={lang} type="button" onClick={() => toggleLang(lang)}
                    style={{ 
                      padding:'8px 18px', borderRadius:'99px', fontSize:'12px', fontWeight:'600', 
                      border:`0.5px solid ${active ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.08)'}`, 
                      background: active ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.02)', 
                      color: active ? '#fff' : 'rgba(255,255,255,0.35)', 
                      boxShadow: active ? '0 0 12px rgba(255,255,255,0.05)' : 'none',
                      cursor:'pointer', transition:'all 0.3s ease' 
                    }}>
                    {lang}
                  </button>
                );
              })}
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