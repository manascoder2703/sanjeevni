'use client';
import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, RefreshCw } from 'lucide-react';

export default function OTPModal({ onSuccess }) {
  const { pendingOTP, verifyOTP, resendOTP } = useAuth();
  const router = useRouter();
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState('');
  const [countdown, setCountdown] = useState(60);
  const inputRefs = useRef([]);

  // Countdown timer for resend
  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  if (!pendingOTP) return null;

  const handleChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);
    setError('');
    // Auto focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length === 6) {
      setOtp(pasted.split(''));
      inputRefs.current[5]?.focus();
    }
  };

  const handleVerify = async () => {
    const otpString = otp.join('');
    if (otpString.length !== 6) {
      setError('Please enter the complete 6-digit code');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await verifyOTP(otpString);
      if (res.error) {
        setError(res.error);
        setOtp(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
        return;
      }

      toast.success('Verified successfully!');
      const user = res.user;
      if (onSuccess) {
        onSuccess(user);
      } else {
        if (user.role === 'admin') router.push('/admin');
        else router.push(`/dashboard/${user.role}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    const res = await resendOTP();
    setResending(false);
    if (res.error) {
      toast.error(res.error);
    } else {
      toast.success('New OTP sent to your email');
      setCountdown(60);
      setOtp(['', '', '', '', '', '']);
      setError('');
      inputRefs.current[0]?.focus();
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        background: 'rgba(2, 6, 23, 0.85)',
      }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        style={{
          width: '100%',
          maxWidth: '420px',
          background: 'linear-gradient(180deg, #0d1117, #080b0f)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '28px',
          padding: '40px 36px',
          boxShadow: '0 32px 64px rgba(0,0,0,0.6)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Glow */}
        <div style={{ position: 'absolute', inset: '0 0 auto 0', height: 160, background: 'radial-gradient(circle at top center, rgba(24,182,162,0.12), transparent 70%)', pointerEvents: 'none' }} />

        {/* Icon */}
        <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(24,182,162,0.1)', border: '1px solid rgba(24,182,162,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
          <Mail size={24} color="#18b6a2" />
        </div>

        {/* Title */}
        <h2 style={{ color: '#fff', fontSize: 24, fontWeight: 800, textAlign: 'center', margin: '0 0 8px', letterSpacing: '-0.5px' }}>
          Check your email
        </h2>
        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14, textAlign: 'center', margin: '0 0 32px', lineHeight: 1.6 }}>
          We sent a 6-digit code to<br />
          <span style={{ color: '#18b6a2', fontWeight: 600 }}>{pendingOTP.email}</span>
        </p>

        {/* OTP inputs */}
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginBottom: '24px' }}>
          {otp.map((digit, i) => (
            <input
              key={i}
              ref={el => inputRefs.current[i] = el}
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={1}
              value={digit}
              onChange={e => handleChange(i, e.target.value)}
              onKeyDown={e => handleKeyDown(i, e)}
              onPaste={handlePaste}
              style={{
                width: 48,
                height: 56,
                borderRadius: 12,
                border: `1.5px solid ${error ? 'rgba(239,68,68,0.5)' : digit ? 'rgba(24,182,162,0.6)' : 'rgba(255,255,255,0.1)'}`,
                background: digit ? 'rgba(24,182,162,0.08)' : 'rgba(255,255,255,0.03)',
                color: '#fff',
                fontSize: 22,
                fontWeight: 700,
                textAlign: 'center',
                outline: 'none',
                transition: 'all 0.2s ease',
                caretColor: '#18b6a2',
              }}
              onFocus={e => { e.target.style.borderColor = '#18b6a2'; e.target.style.boxShadow = '0 0 0 3px rgba(24,182,162,0.15)'; }}
              onBlur={e => { e.target.style.borderColor = digit ? 'rgba(24,182,162,0.6)' : error ? 'rgba(239,68,68,0.5)' : 'rgba(255,255,255,0.1)'; e.target.style.boxShadow = 'none'; }}
            />
          ))}
        </div>

        {/* Error */}
        <AnimatePresence>
          {error && (
            <motion.p
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              style={{ color: '#fb7185', fontSize: 13, textAlign: 'center', margin: '-8px 0 16px', fontWeight: 500 }}
            >
              {error}
            </motion.p>
          )}
        </AnimatePresence>

        {/* Verify button */}
        <button
          onClick={handleVerify}
          disabled={loading || otp.join('').length !== 6}
          style={{
            width: '100%',
            height: 52,
            borderRadius: 14,
            border: 'none',
            background: otp.join('').length === 6 ? '#18b6a2' : 'rgba(24,182,162,0.2)',
            color: otp.join('').length === 6 ? '#fff' : 'rgba(255,255,255,0.3)',
            fontSize: 16,
            fontWeight: 700,
            cursor: loading || otp.join('').length !== 6 ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s ease',
            marginBottom: 16,
          }}
        >
          {loading ? 'Verifying...' : 'Verify OTP'}
        </button>

        {/* Resend */}
        <div style={{ textAlign: 'center' }}>
          {countdown > 0 ? (
            <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 13 }}>
              Resend code in <span style={{ color: '#18b6a2', fontWeight: 600 }}>{countdown}s</span>
            </p>
          ) : (
            <button
              onClick={handleResend}
              disabled={resending}
              style={{ background: 'none', border: 'none', color: '#18b6a2', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}
            >
              <RefreshCw size={13} className={resending ? 'animate-spin' : ''} />
              {resending ? 'Sending...' : 'Resend code'}
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
}