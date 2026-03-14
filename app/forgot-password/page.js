'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Mail, ArrowRight, ArrowLeft, Stethoscope, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Something went wrong');
      }

      setSuccess(true);
      toast.success('Password reset link sent to your email');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

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
          <h1 style={{ fontSize: 28, fontWeight: 800 }}>Reset Password</h1>
          <p style={{ color: 'var(--text-muted)', marginTop: 6, fontSize: 14 }}>
            Enter your email to receive a reset link
          </p>
        </div>

        {success ? (
          <div style={{ textAlign: 'center' }}>
            <div style={{ width: 64, height: 64, background: 'rgba(16,185,129,0.15)', color: '#10b981', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <CheckCircle2 size={32} />
            </div>
            <h3 style={{ fontSize: 20, fontWeight: 600, marginBottom: 8 }}>Check your email</h3>
            <p style={{ color: 'var(--text-muted)', marginBottom: 24, fontSize: 14, lineHeight: 1.5 }}>
              If an account exists with <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{email}</span>, we've sent instructions to reset your password.
            </p>
            <Link 
              href="/login"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 8, color: 'var(--accent)', fontWeight: 500, textDecoration: 'none' }}
            >
              <ArrowLeft size={16} />
              Back to login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>Email Address</label>
              <div style={{ position: 'relative' }}>
                <Mail size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  type="email"
                  className="input"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="doctor@hospital.com"
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
              {loading ? 'Sending...' : (
                <>
                  Send Reset Link
                  <ArrowRight size={18} />
                </>
              )}
            </button>
            
            <div style={{ textAlign: 'center', marginTop: 16 }}>
              <Link 
                href="/login"
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)', fontSize: 14, textDecoration: 'none', transition: 'color 0.2s', fontWeight: 500 }}
                onMouseOver={(e) => e.target.style.color = 'var(--text-primary)'}
                onMouseOut={(e) => e.target.style.color = 'var(--text-muted)'}
              >
                <ArrowLeft size={14} /> Back to Login
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
