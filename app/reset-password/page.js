'use client';

import { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Lock, ArrowRight, Stethoscope, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';

function ResetPasswordForm() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!token) {
      toast.error('Invalid or missing reset token');
      return;
    }

    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    
    if (password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Something went wrong');
      }

      setSuccess(true);
      toast.success('Password updated successfully');
      
      setTimeout(() => {
        router.push('/login');
      }, 3000);
      
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: 64, height: 64, background: 'rgba(16,185,129,0.15)', color: '#10b981', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
          <CheckCircle2 size={32} />
        </div>
        <h3 style={{ fontSize: 20, fontWeight: 600, marginBottom: 8 }}>Password Reset Successful</h3>
        <p style={{ color: 'var(--text-muted)', marginBottom: 24, fontSize: 14, lineHeight: 1.5 }}>
          Your password has been successfully updated. Redirecting to login...
        </p>
        <Link 
          href="/login"
          className="btn-primary"
          style={{ width: '100%', justifyContent: 'center' }}
        >
          Log in now
        </Link>
      </div>
    );
  }

  if (!token) {
    return (
      <div style={{ textAlign: 'center' }}>
        <div style={{ padding: 16, background: 'rgba(239,68,68,0.15)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 12, marginBottom: 24 }}>
          <p style={{ fontWeight: 500, margin: 0 }}>Invalid or missing reset token.</p>
          <p style={{ fontSize: 13, marginTop: 4 }}>Please request a new password reset link.</p>
        </div>
        <Link 
          href="/forgot-password"
          className="btn-primary"
          style={{ width: '100%', justifyContent: 'center' }}
        >
          Request new link
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div>
        <label style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>New Password</label>
        <div style={{ position: 'relative' }}>
          <Lock size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="password"
            className="input"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="••••••••"
            required
            style={{ paddingLeft: 40 }}
          />
        </div>
      </div>

      <div>
        <label style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>Confirm New Password</label>
        <div style={{ position: 'relative' }}>
          <Lock size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="password"
            className="input"
            value={confirmPassword}
            onChange={e => setConfirmPassword(e.target.value)}
            placeholder="••••••••"
            required
            style={{ paddingLeft: 40 }}
          />
        </div>
      </div>

      <button
        type="submit"
        className="btn-primary pulse-glow"
        disabled={loading}
        style={{ width: '100%', justifyContent: 'center', marginTop: 8, padding: '14px 24px', fontSize: 16 }}
      >
        {loading ? 'Resetting...' : (
          <>
            Reset Password
            <ArrowRight size={18} />
          </>
        )}
      </button>
    </form>
  );
}

export default function ResetPassword() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-primary)', padding: 24 }}>
      {/* Background glow */}
      <div style={{ position: 'fixed', top: '20%', left: '50%', transform: 'translateX(-50%)', width: 600, height: 600, background: 'radial-gradient(circle, rgba(14,165,233,0.08) 0%, transparent 70%)', pointerEvents: 'none' }} />

      <div className="glass-card fade-in" style={{ width: '100%', maxWidth: 420, padding: 40, position: 'relative' }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ background: 'linear-gradient(135deg,#0ea5e9,#06b6d4)', width: 56, height: 56, borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <Stethoscope size={28} color="white" />
          </div>
          <h1 style={{ fontSize: 28, fontWeight: 800 }}>New Password</h1>
          <p style={{ color: 'var(--text-muted)', marginTop: 6, fontSize: 14 }}>
            Create a new password for your account
          </p>
        </div>

        <Suspense fallback={<div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Loading...</div>}>
          <ResetPasswordForm />
        </Suspense>
      </div>
    </div>
  );
}
