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

  return {
    ...rawUser,
    id: normalizedId,
    userId: normalizedId,
  };
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { data: session, status } = useSession();

  useEffect(() => {
    console.log('[AuthContext] Session Status:', status);
    if (status === 'authenticated') {
      console.log('[AuthContext] Session Data:', session);
    }
    
    const initializeAuth = () => {
      try {
        const stored = localStorage.getItem('sanjeevni_user');
        if (stored) {
          const parsedUser = normalizeUserShape(JSON.parse(stored));
          setUser(parsedUser);
        }
      } catch (error) {
        console.error('Failed to parse stored user:', error);
      } finally {
        if (status !== 'loading') {
          setLoading(false);
        }
      }
    };

    initializeAuth();
  }, [status]);

  useEffect(() => {
    if (session?.user) {
      const userData = normalizeUserShape({
        name: session.user.name,
        email: session.user.email,
        role: session.user.role || 'patient',
        avatar: session.user.image,
        id: session.user.id
      });
      setUser(userData);
      localStorage.setItem('sanjeevni_user', JSON.stringify(userData));
    }
  }, [session]);

  const login = async (email, password) => {
    console.log('--- Logging in via AuthContext ---');
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      console.log('Login response status:', res.status);

      let data;
      const contentType = res.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        data = await res.json();
      } else {
        const text = await res.text();
        console.error('Login non-JSON response:', text);
        return { error: 'Server error: Invalid response format' };
      }

      if (!res.ok) {
        console.log('Login failed with message:', data.error);
        return { error: data.error || 'Login failed' };
      }

      const normalizedUser = normalizeUserShape(data.user);
      setUser(normalizedUser);
      localStorage.setItem('sanjeevni_user', JSON.stringify(normalizedUser));
      console.log('Login successful for:', normalizedUser.email);
      return { user: normalizedUser };
    } catch (error) {
      console.error('Login fetch error:', error);
      return { error: 'Network error: Please try again' };
    }
  };


  const register = async (formData) => {
    console.log('--- Registering user via AuthContext ---');
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      console.log('Register response status:', res.status);
      
      let data;
      const contentType = res.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        data = await res.json();
        console.log('Register JSON data:', data);
      } else {
        const text = await res.text();
        console.error('Register non-JSON response:', text);
        throw new Error(`Server returned non-JSON response (${res.status})`);
      }

      if (!res.ok) {
        return { error: data.error || data.details || 'Registration failed' };
      }

      const normalizedUser = normalizeUserShape(data.user);
      setUser(normalizedUser);
      localStorage.setItem('sanjeevni_user', JSON.stringify(normalizedUser));
      return { user: normalizedUser };
    } catch (error) {
      console.error('Registration fetch/logic error:', error);
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
    if (session) {
      await nextAuthSignOut({ redirect: false });
    }
    await fetch('/api/auth/logout', { method: 'POST' });
    localStorage.removeItem('sanjeevni_user');
    window.location.href = '/';
  };

  return (
    <AuthContext.Provider value={{ user, loading: loading || status === 'loading', login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
