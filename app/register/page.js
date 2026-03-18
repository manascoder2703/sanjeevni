'use client';
import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Stethoscope, User, Mail, Lock, ArrowRight, Briefcase } from 'lucide-react';
import toast from 'react-hot-toast';

function RegisterForm() {
  const searchParams = useSearchParams();
  const [role, setRole] = useState(searchParams.get('role') || 'patient');
  const [form, setForm] = useState({ name: '', email: '', password: '', specialization: '', fee: 500, experience: 1, bio: '' });
  const [loading, setLoading] = useState(false);
  const { register, user: authUser } = useAuth();
  const router = useRouter();
  const [isRedirecting, setIsRedirecting] = useState(false);

  useEffect(() => {
    if (authUser) {
      setIsRedirecting(true);
      const role = authUser.role || 'patient';
      if (role === 'admin') router.push('/admin');
      else router.push(`/dashboard/${role}`);
    }
  }, [authUser, router]);

  if (isRedirecting) return null;

  const specializations = ['Cardiologist', 'Dermatologist', 'Neurologist', 'Pediatrician', 'Psychiatrist', 'Orthopedic', 'General Physician', 'Gynecologist'];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const user = await register({ ...form, role });
      toast.success('Account created successfully!');
      if (user.role === 'doctor') {
        toast('Your profile is pending admin approval.', { icon: '⏳' });
        router.push('/dashboard/doctor');
      } else {
        router.push('/dashboard/patient');
      }
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-primary)', padding: 24 }}>
      <div style={{ position: 'fixed', top: '20%', right: '20%', width: 500, height: 500, background: 'radial-gradient(circle, rgba(6,182,212,0.07) 0%, transparent 70%)', pointerEvents: 'none' }} />

      <div className="glass-card fade-in" style={{ width: '100%', maxWidth: 480, padding: 40 }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ background: 'linear-gradient(135deg,#0ea5e9,#06b6d4)', width: 56, height: 56, borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <Stethoscope size={28} color="white" />
          </div>
          <h1 style={{ fontSize: 28, fontWeight: 800 }}>Create Account</h1>
          <p style={{ color: 'var(--text-muted)', marginTop: 6 }}>Join Sanjeevni today</p>
        </div>

        {/* Role Toggle */}
        <div style={{ display: 'flex', background: 'rgba(15,23,42,0.8)', borderRadius: 12, padding: 4, marginBottom: 24 }}>
          {['patient', 'doctor'].map((r) => (
            <button key={r} onClick={() => setRole(r)} style={{
              flex: 1, padding: '10px', borderRadius: 10, border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 14, transition: 'all 0.2s',
              background: role === r ? 'linear-gradient(135deg,#0ea5e9,#06b6d4)' : 'transparent',
              color: role === r ? 'white' : 'var(--text-muted)',
            }}>
              {r === 'patient' ? '👤 Patient' : '👨‍⚕️ Doctor'}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-muted)', display: 'block', marginBottom: 5 }}>Full Name</label>
            <div style={{ position: 'relative' }}>
              <User size={15} style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input type="text" className="input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="John Doe" required style={{ paddingLeft: 38 }} />
            </div>
          </div>
          <div>
            <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-muted)', display: 'block', marginBottom: 5 }}>Email</label>
            <div style={{ position: 'relative' }}>
              <Mail size={15} style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input type="email" className="input" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="you@example.com" required style={{ paddingLeft: 38 }} />
            </div>
          </div>
          <div>
            <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-muted)', display: 'block', marginBottom: 5 }}>Password</label>
            <div style={{ position: 'relative' }}>
              <Lock size={15} style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input type="password" className="input" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} placeholder="Min 6 characters" required minLength={6} style={{ paddingLeft: 38 }} />
            </div>
          </div>

          {/* Doctor-specific fields */}
          {role === 'doctor' && (
            <>
              <div>
                <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-muted)', display: 'block', marginBottom: 5 }}>Specialization</label>
                <select className="input" value={form.specialization} onChange={e => setForm({ ...form, specialization: e.target.value })} required>
                  <option value="">Select Specialization</option>
                  {specializations.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-muted)', display: 'block', marginBottom: 5 }}>Fee (₹)</label>
                  <input type="number" className="input" value={form.fee} onChange={e => setForm({ ...form, fee: Number(e.target.value) })} min={100} />
                </div>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-muted)', display: 'block', marginBottom: 5 }}>Experience (yrs)</label>
                  <input type="number" className="input" value={form.experience} onChange={e => setForm({ ...form, experience: Number(e.target.value) })} min={0} />
                </div>
              </div>
              <div>
                <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-muted)', display: 'block', marginBottom: 5 }}>Bio</label>
                <textarea className="input" value={form.bio} onChange={e => setForm({ ...form, bio: e.target.value })} placeholder="Brief professional bio..." rows={3} style={{ resize: 'vertical' }} />
              </div>
            </>
          )}

          <button type="submit" className="btn-primary" disabled={loading} style={{ width: '100%', justifyContent: 'center', marginTop: 4, padding: '14px', fontSize: 16 }}>
            {loading ? 'Creating account...' : (<>Create Account <ArrowRight size={18} /></>)}
          </button>
        </form>

        <p style={{ textAlign: 'center', color: 'var(--text-muted)', marginTop: 20, fontSize: 14 }}>
          Already have an account?{' '}
          <Link href="/login" style={{ color: 'var(--accent)', textDecoration: 'none', fontWeight: 600 }}>Sign in →</Link>
        </p>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-primary)' }}><span style={{ color: 'var(--text-muted)' }}>Loading...</span></div>}>
      <RegisterForm />
    </Suspense>
  );
}
