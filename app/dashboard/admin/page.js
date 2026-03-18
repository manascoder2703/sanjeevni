'use client';
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { 
  Users, 
  Stethoscope, 
  Calendar, 
  Clock, 
  CheckCircle, 
  XCircle, 
  ShieldCheck, 
  TrendingUp,
  Activity,
  UserPlus,
  ArrowUpRight
} from 'lucide-react';
import toast from 'react-hot-toast';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

// Mock data for platform growth
const growthData = [
  { name: 'Week 1', users: 400, doctors: 240 },
  { name: 'Week 2', users: 600, doctors: 320 },
  { name: 'Week 3', users: 800, doctors: 450 },
  { name: 'Week 4', users: 1100, doctors: 580 },
];

export default function AdminDashboard() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch('/api/admin');
      const data = await res.json();
      setStats(data);
    } catch (error) {
      toast.error('Failed to bridge platform stats');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleApprove = async (doctorId, action) => {
    await fetch('/api/admin', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ doctorId, action }),
    });
    toast.success(`Protocol ${action} finalized`);
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
    <div className="flex flex-col gap-10 w-full animate-fade-in pb-12">
      {/* Platform Header */}
      <div className="flex flex-col px-1 gap-2">
        <div className="flex items-center gap-2">
           <span className="px-3 py-1 bg-white/5 text-white/40 text-[10px] font-black uppercase tracking-[0.2em] rounded-full border border-white/10">
              System Administrator
           </span>
        </div>
        <h1 className="text-4xl md:text-5xl font-black tracking-tight text-white mt-1">
          Platform <span className="text-blue-500">Insights</span>
        </h1>
        <p className="text-white/20 text-xs font-bold uppercase tracking-[0.2em] mb-4">
           Global system status & medical professional vetting
        </p>
      </div>

      {/* Primary Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Total Base', value: stats?.totalUsers || 0, color: 'blue', icon: <Users size={22} />, trend: '+12%' },
          { label: 'Verified MDs', value: stats?.totalDoctors || 0, color: 'emerald', icon: <Stethoscope size={22} />, trend: '+5%' },
          { label: 'Active Sessions', value: stats?.totalAppointments || 0, color: 'cyan', icon: <Calendar size={22} />, trend: '+18%' },
          { label: 'Queue Load', value: stats?.pendingDoctors || 0, color: 'amber', icon: <Clock size={22} />, trend: 'Urgent' },
        ].map((s, i) => (
          <div key={i} className="glass-card group p-6 flex flex-col gap-5 hover:bg-white/[0.04] transition-all border border-white/5 cursor-default relative overflow-hidden">
            <div className={`absolute top-0 left-0 w-1 h-full bg-blue-500 opacity-0 group-hover:opacity-100 transition-opacity`} />
            <div className="flex items-center justify-between">
              <div className={`p-3 rounded-2xl bg-blue-500/10 text-blue-400 group-hover:scale-110 transition-transform duration-500`}>
                {s.icon}
              </div>
              <div className="flex flex-col items-end">
                <span className="text-4xl font-black text-white tracking-tighter tabular-nums">{s.value}</span>
                <span className="text-[10px] font-bold text-blue-400/60 uppercase tracking-widest">{s.trend}</span>
              </div>
            </div>
            <p className="text-white/30 text-[10px] font-black uppercase tracking-[0.2em]">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Growth Visualization */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 glass-card p-6 md:p-10 flex flex-col gap-8">
           <div className="flex items-center justify-between">
              <div className="flex flex-col gap-1">
                <h3 className="text-2xl font-black text-white tracking-tight">Expansion Curve</h3>
                <p className="text-white/20 text-[10px] font-black uppercase tracking-widest">Network Growth Analysis</p>
              </div>
              <div className="flex gap-2">
                 <div className="flex items-center gap-2 px-3 py-1 bg-blue-500/10 rounded-lg">
                    <div className="size-1.5 bg-blue-500 rounded-full"></div>
                    <span className="text-[10px] font-bold text-blue-400 uppercase">Users</span>
                 </div>
                 <div className="flex items-center gap-2 px-3 py-1 bg-emerald-500/10 rounded-lg">
                    <div className="size-1.5 bg-emerald-500 rounded-full"></div>
                    <span className="text-[10px] font-bold text-emerald-400 uppercase">Doctors</span>
                 </div>
              </div>
           </div>
           
           <div className="h-[300px] w-full">
             <ResponsiveContainer width="100%" height="100%">
               <AreaChart data={growthData}>
                 <defs>
                   <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                     <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                     <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                   </linearGradient>
                   <linearGradient id="colorDoctors" x1="0" y1="0" x2="0" y2="1">
                     <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                     <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                   </linearGradient>
                 </defs>
                 <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff05" />
                 <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#ffffff20', fontSize: 11 }} />
                 <YAxis hide />
                 <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderRadius: '16px', border: '1px solid #ffffff10', color: '#fff' }} />
                 <Area type="monotone" dataKey="users" stroke="#3b82f6" strokeWidth={4} fillOpacity={1} fill="url(#colorUsers)" />
                 <Area type="monotone" dataKey="doctors" stroke="#10b981" strokeWidth={4} fillOpacity={1} fill="url(#colorDoctors)" />
               </AreaChart>
             </ResponsiveContainer>
           </div>
        </div>

        <div className="lg:col-span-4 glass-card p-8 flex flex-col gap-6 items-center justify-center text-center relative overflow-hidden">
           <div className="absolute inset-0 bg-blue-500/5 blur-[100px] -z-10 rounded-full"></div>
           <div className="p-6 bg-blue-500/10 rounded-full text-blue-400">
             <ShieldCheck size={48} />
           </div>
           <div className="flex flex-col gap-2">
             <h4 className="text-xl font-black text-white">Security Protocol</h4>
             <p className="text-white/40 text-sm max-w-[200px]">All medical credentials are verified against secondary datasets for maximum compliance.</p>
           </div>
           <button className="w-full py-4 bg-white text-black rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all hover:bg-blue-500 hover:text-white">
             Audit Logs
           </button>
        </div>
      </div>

      {/* Credentials Verification Workspace */}
      <div className="glass-card flex flex-col overflow-hidden min-h-[500px]">
        <div className="flex items-center justify-between p-6 md:px-10 border-b border-white/5 bg-white/[0.02]">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-amber-500/10 rounded-2xl text-amber-500">
              <ShieldCheck size={24} />
            </div>
            <div className="flex flex-col">
              <h2 className="text-2xl font-black text-white tracking-tight">Credentials Vetting</h2>
              <p className="text-white/20 text-[10px] font-black uppercase tracking-widest">Awaiting Identity Verification</p>
            </div>
          </div>
        </div>

        <div className="p-6 md:p-10 flex-1 bg-black/10">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-32 gap-6">
              <div className="size-16 border-2 border-blue-500/20 border-t-blue-500 animate-spin rounded-full" />
            </div>
          ) : !stats?.recentDoctors?.length ? (
            <div className="flex flex-col items-center justify-center py-32 text-center opacity-20 gap-4">
              <div className="p-6 bg-emerald-500/10 rounded-full text-emerald-500">
                 <CheckCircle size={64} />
              </div>
              <p className="text-white text-xl font-black tracking-tight uppercase">Vetting Queue Empty</p>
            </div>
          ) : (
            <div className="grid gap-6">
              {stats.recentDoctors.map(doc => (
                <div key={doc._id} className="group relative flex flex-col md:flex-row items-center justify-between p-6 bg-slate-900/40 border border-white/5 rounded-3xl transition-all duration-500 hover:bg-slate-900/60 hover:border-blue-500/30">
                  <div className="flex items-center gap-6 w-full md:w-auto">
                    <div className="size-16 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center font-black text-white text-2xl shadow-xl shadow-blue-500/20">
                      {doc.userId?.name?.[0]?.toUpperCase()}
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <p className="text-white text-lg font-black tracking-tight group-hover:text-blue-400 transition-colors uppercase">Dr. {doc.userId?.name}</p>
                      <div className="flex items-center gap-2">
                        <span className="text-white/40 text-[10px] font-bold uppercase tracking-widest">{doc.specialization}</span>
                        <span className="w-1 h-1 bg-white/10 rounded-full"></span>
                        <span className="text-white/20 text-[10px] font-medium">{doc.userId?.email}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-4 w-full md:w-auto mt-6 md:mt-0">
                    <button 
                      className="flex-1 md:flex-none px-10 py-3.5 bg-blue-500 hover:bg-blue-600 text-white rounded-2xl text-[10px] font-black tracking-widest uppercase transition-all shadow-xl shadow-blue-500/30 active:scale-95 flex items-center justify-center gap-2"
                      onClick={() => handleApprove(doc._id, 'approve')}
                    >
                      <CheckCircle size={16} /> Approve Access
                    </button>
                    <button 
                      className="flex-1 md:flex-none px-6 py-3.5 bg-white/5 hover:bg-red-500/10 text-white/30 hover:text-red-400 rounded-2xl text-[10px] font-black tracking-widest uppercase transition-all border border-white/5 hover:border-red-500/20 active:scale-95 flex items-center justify-center gap-2"
                      onClick={() => handleApprove(doc._id, 'reject')}
                    >
                      <XCircle size={16} /> Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

