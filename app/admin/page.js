'use client';
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import { Users, Stethoscope, Calendar, Clock, CheckCircle, XCircle, LogOut, ShieldCheck, User } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';

export default function AdminDashboard() {
  const { user, loading: authLoading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    const res = await fetch('/api/admin');
    const data = await res.json();
    setStats(data);
    setLoading(false);
  }, []);

  const handleApprove = async (doctorId, action) => {
    await fetch('/api/admin', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ doctorId, action }),
    });
    toast.success(`Doctor ${action}d successfully`);
    fetchStats();
  };

  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.push('/login'); return; }
    if (user.role !== 'admin') { router.push('/'); return; }
    fetchStats();
  }, [user, authLoading, router, fetchStats]);

  if (!user || user.role !== 'admin') return null;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', display: 'flex' }}>
      <aside style={{ width: 240, background: 'rgba(15,23,42,0.95)', borderRight: '1px solid var(--border)', padding: '24px 16px', position: 'sticky', top: 0, height: '100vh', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 32, paddingLeft: 8 }}>
          <div style={{ background: 'linear-gradient(135deg,#0ea5e9,#06b6d4)', padding: 7, borderRadius: 9 }}><Stethoscope size={16} color="white" /></div>
          <span style={{ fontWeight: 800, fontSize: 18, background: 'linear-gradient(135deg,#0ea5e9,#06b6d4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Sanjeevni</span>
        </div>
        <div style={{ background: 'rgba(14,165,233,0.1)', border: '1px solid rgba(14,165,233,0.2)', borderRadius: 12, padding: 16, marginBottom: 24 }}>
          <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'linear-gradient(135deg,#f59e0b,#ef4444)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 700, color: 'white', marginBottom: 8 }}>
            <ShieldCheck size={18} />
          </div>
          <p style={{ fontWeight: 600, fontSize: 14 }}>{user.name}</p>
          <p style={{ color: 'var(--accent)', fontSize: 12, fontWeight: 500 }}>Administrator</p>
        </div>
        <nav style={{ flex: 1 }}>
          {[
            { icon: <Users size={18} />, label: 'Dashboard', href: '/admin' },
            { icon: <User size={18} />, label: 'My Profile', href: '/admin/profile' },
          ].map((item) => (
            <Link 
              key={item.label} 
              href={item.href} 
              className={`sidebar-link ${pathname === item.href ? 'sidebar-link-active' : ''}`}
            >
              {item.icon}<span>{item.label}</span>
            </Link>
          ))}
        </nav>
        <button 
          onClick={logout} 
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#ef4444';
            e.currentTarget.style.color = 'white';
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(239,68,68,0.3)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(239,68,68,0.1)';
            e.currentTarget.style.color = '#ef4444';
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = 'none';
          }}
          style={{ 
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, 
            padding: '12px 14px', borderRadius: 12, 
            background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', 
            color: '#ef4444', cursor: 'pointer', width: '100%', fontSize: 14, fontWeight: 600,
            transition: 'all 0.2s ease'
          }}
        >
          <LogOut size={16} /> Sign Out
        </button>
      </aside>

      <main style={{ flex: 1, padding: '32px', overflowY: 'auto' }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 4 }}>Admin Dashboard</h1>
        <p style={{ color: 'var(--text-muted)', marginBottom: 32 }}>Platform overview and management</p>

        {/* Stats */}
        {loading ? <p style={{ color: 'var(--text-muted)' }}>Loading...</p> : (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginBottom: 32 }}>
              {[
                { label: 'Total Users', value: stats?.totalUsers || 0, color: '#0ea5e9', icon: <Users size={20} /> },
                { label: 'Active Doctors', value: stats?.totalDoctors || 0, color: '#10b981', icon: <Stethoscope size={20} /> },
                { label: 'Total Appointments', value: stats?.totalAppointments || 0, color: '#06b6d4', icon: <Calendar size={20} /> },
                { label: 'Pending Approvals', value: stats?.pendingDoctors || 0, color: '#f59e0b', icon: <Clock size={20} /> },
              ].map((s, i) => (
                <div key={i} className="glass-card" style={{ padding: 20, display: 'flex', alignItems: 'center', gap: 16 }}>
                  <div style={{ background: `${s.color}20`, padding: 12, borderRadius: 12, color: s.color }}>{s.icon}</div>
                  <div>
                    <p style={{ fontSize: 28, fontWeight: 800, color: s.color }}>{s.value}</p>
                    <p style={{ color: 'var(--text-muted)', fontSize: 12 }}>{s.label}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Pending Doctor Approvals */}
            <div className="glass-card" style={{ padding: 24 }}>
              <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Clock size={18} style={{ color: '#f59e0b' }} /> Pending Doctor Approvals
              </h2>
              {!stats?.recentDoctors?.length ? (
                <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
                  <CheckCircle size={40} style={{ margin: '0 auto 12px', color: '#10b981', opacity: 0.5 }} />
                  <p>All caught up! No pending approvals.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {stats.recentDoctors.map(doc => (
                    <div key={doc._id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', background: 'rgba(15,23,42,0.5)', borderRadius: 12, border: '1px solid var(--border)', flexWrap: 'wrap', gap: 12 }}>
                      <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
                        <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'linear-gradient(135deg,#0ea5e9,#06b6d4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: 'white', fontSize: 16 }}>
                          {doc.userId?.name?.[0]?.toUpperCase()}
                        </div>
                        <div>
                          <p style={{ fontWeight: 600, marginBottom: 2 }}>Dr. {doc.userId?.name}</p>
                          <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>{doc.specialization} · {doc.userId?.email}</p>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button className="btn-primary" onClick={() => handleApprove(doc._id, 'approve')} style={{ padding: '8px 16px', fontSize: 13, gap: 6, display: 'flex', alignItems: 'center' }}>
                          <CheckCircle size={14} /> Approve
                        </button>
                        <button className="btn-secondary" onClick={() => handleApprove(doc._id, 'reject')} style={{ padding: '8px 16px', fontSize: 13, color: '#ef4444', borderColor: 'rgba(239,68,68,0.3)', display: 'flex', alignItems: 'center', gap: 6 }}>
                          <XCircle size={14} /> Reject
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
