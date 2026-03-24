'use client';
import { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession, signOut as nextAuthSignOut } from 'next-auth/react';

const AuthContext = createContext(null);

function normalizeUserShape(rawUser) {
  if (!rawUser) return null;
  const normalizedId =
    rawUser.id ||
    rawUser.userId ||
    rawUser._id ||
    rawUser?.id?.toString?.() ||
    rawUser?.userId?.toString?.() ||
    rawUser?._id?.toString?.();
  return { ...rawUser, id: normalizedId, userId: normalizedId };
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pendingOTP, setPendingOTP] = useState(null); // { email, user } when OTP is required
  const router = useRouter();
  const { data: session, status } = useSession();

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const stored = localStorage.getItem('sanjeevni_user');
        if (stored) {
          const parsedUser = normalizeUserShape(JSON.parse(stored));
          setUser(parsedUser);
          setLoading(false);
          // Still refresh in background to be sure
          refreshUser();
          return;
        }

        // If no stored user, try to fetch from API (using sanjeevni_token cookie)
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const data = await res.json();
          if (data.user) {
            const normalizedUser = normalizeUserShape(data.user);
            setUser(normalizedUser);
            localStorage.setItem('sanjeevni_user', JSON.stringify(normalizedUser));
          }
        }
      } catch (error) {
        console.error('Failed to initialize auth:', error);
      } finally {
        if (status !== 'loading') {
          setLoading(false);
        }
      }
    };
    initializeAuth();

    const timer = setTimeout(() => {
      setLoading(false);
    }, 5000);
    return () => clearTimeout(timer);
  }, [status]);

  useEffect(() => {
    if (session?.user) {
      const userData = normalizeUserShape({
        name: session.user.name,
        email: session.user.email,
        role: session.user.role || 'patient',
        avatar: session.user.image,
        id: session.user.id || session.user._id,
      });
      setUser(userData);
      localStorage.setItem('sanjeevni_user', JSON.stringify(userData));
      setLoading(false);
    }
  }, [session]);

  const login = async (email, password) => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const contentType = res.headers.get('content-type');
      let data;
      if (contentType && contentType.includes('application/json')) {
        data = await res.json();
      } else {
        return { error: 'Server error: Invalid response format' };
      }

      if (!res.ok) return { error: data.error || 'Login failed' };

      if (data.otpRequired) {
        // Store pending OTP state — do not set user yet
        setPendingOTP({ email: data.email, user: normalizeUserShape(data.user) });
        return { otpRequired: true, email: data.email };
      }

      // skipOTP account — token already set, proceed directly
      const normalizedUser = normalizeUserShape(data.user);
      setUser(normalizedUser);
      localStorage.setItem('sanjeevni_user', JSON.stringify(normalizedUser));
      // Availability reset
      localStorage.removeItem(`doctor_manual_offline_${normalizedUser.id}`);
      return { user: normalizedUser };
    } catch (error) {
      console.error('Login fetch error:', error);
      return { error: 'Network error: Please try again' };
    }
  };

  const register = async (formData) => {
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const contentType = res.headers.get('content-type');
      let data;
      if (contentType && contentType.includes('application/json')) {
        data = await res.json();
      } else {
        throw new Error(`Server returned non-JSON response (${res.status})`);
      }

      if (!res.ok) return { error: data.error || data.details || 'Registration failed' };

      if (data.otpRequired) {
        // Store pending OTP state — do not set user yet
        setPendingOTP({ email: data.email, user: normalizeUserShape(data.user) });
        return { otpRequired: true, email: data.email, user: normalizeUserShape(data.user) };
      }

      const normalizedUser = normalizeUserShape(data.user);
      setUser(normalizedUser);
      localStorage.setItem('sanjeevni_user', JSON.stringify(normalizedUser));
      // Availability reset
      localStorage.removeItem(`doctor_manual_offline_${normalizedUser.id}`);
      return { user: normalizedUser };
    } catch (error) {
      console.error('Registration error:', error);
      return { error: 'Network error: Please try again' };
    }
  };

  const verifyOTP = async (otp, manualEmail = null) => {
    const email = manualEmail || pendingOTP?.email;
    if (!email) return { error: 'No pending verification' };

    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp }),
      });

      const data = await res.json();
      if (!res.ok) return { error: data.error || 'OTP verification failed' };

      // OTP verified — set user and clear pending state
      const normalizedUser = normalizeUserShape(data.user);
      setUser(normalizedUser);
      localStorage.setItem('sanjeevni_user', JSON.stringify(normalizedUser));
      // Reset availability on fresh OTP verification
      localStorage.removeItem(`doctor_manual_offline_${normalizedUser.id}`);
      setPendingOTP(null);
      setLoading(false); 
      return { user: normalizedUser };
    } catch (error) {
      console.error('OTP verification error:', error);
      return { error: 'Network error: Please try again' };
    }
  };

  const resendOTP = async (manualEmail = null) => {
    const email = manualEmail || pendingOTP?.email;
    if (!email) return { error: 'No pending verification' };
    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) return { error: data.error || 'Failed to resend OTP' };
      return { success: true };
    } catch {
      return { error: 'Network error: Please try again' };
    }
  };

  const refreshUser = async () => {
    try {
      const res = await fetch('/api/profile/patient');
      const data = await res.json();
      if (res.ok && data.user) {
        const normalizedUser = normalizeUserShape(data.user);
        setUser(normalizedUser);
        localStorage.setItem('sanjeevni_user', JSON.stringify(normalizedUser));
      }
    } catch (error) {
      console.error('Refresh user error:', error);
    }
  };

  const logout = async () => {
    if (session) await nextAuthSignOut({ redirect: false });
    await fetch('/api/auth/logout', { method: 'POST' });
    // Clear doctor manual offline status for this user
    if (user?.id) {
        localStorage.removeItem(`doctor_manual_offline_${user.id}`);
    } else {
        // Fallback: clear all doctor manual status keys if we've already lost the ID
        Object.keys(localStorage).forEach(key => {
            if (key.startsWith('doctor_manual_offline_')) {
                localStorage.removeItem(key);
            }
        });
    }

    localStorage.removeItem('sanjeevni_user');
    setPendingOTP(null);
    window.location.href = '/';
  };

  return (
    <AuthContext.Provider value={{
      user,
      loading: (user || pendingOTP) ? false : (loading || status === 'loading'),
      pendingOTP,
      login,
      register,
      verifyOTP,
      resendOTP,
      logout,
      refreshUser,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};