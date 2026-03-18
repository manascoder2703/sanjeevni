'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Calendar, 
  Video, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Stethoscope, 
  Users, 
  Sparkles, 
  X, 
  Loader2,
  TrendingUp,
  Activity
} from 'lucide-react';
import toast from 'react-hot-toast';
import io from 'socket.io-client';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import HoloCard from '@/components/HoloCard';
import ShinyText from '@/components/react-bits/ShinyText';

import { getCallWindowStatus, secondsUntilWindow } from '@/lib/callWindow';

const volumeData = [
  { name: 'Mon', count: 4 },
  { name: 'Tue', count: 7 },
  { name: 'Wed', count: 5 },
  { name: 'Thu', count: 8 },
  { name: 'Fri', count: 12 },
  { name: 'Sat', count: 3 },
  { name: 'Sun', count: 2 },
];

function AppointmentRow({ apt, updateStatus, showSummary }) {
  const [windowStatus, setWindowStatus] = useState(getCallWindowStatus(apt));
  const [secondsLeft, setSecondsLeft] = useState(secondsUntilWindow(apt));

  useEffect(() => {
    if (apt.status !== 'confirmed') return;
    const timer = setInterval(() => {
      setWindowStatus(getCallWindowStatus(apt));
      setSecondsLeft(secondsUntilWindow(apt));
    }, 1000);
    return () => clearInterval(timer);
  }, [apt]);

  const patName = apt.patientId?.name || 'Patient';
  
  const statusConfig = {
    pending: { label: 'Verification', color: 'text-amber-400 bg-amber-400/10 border-amber-400/20' },
    confirmed: { label: 'Scheduled', color: 'text-blue-400 bg-blue-400/10 border-blue-400/20' },
    completed: { label: 'Finished', color: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20' },
    cancelled: { label: 'Aborted', color: 'text-red-400 bg-red-400/10 border-red-400/20' }
  }[apt.status] || { label: apt.status, color: 'text-white/40 bg-white/5 border-white/10' };

  const formatCountdown = (totalSeconds) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins}m ${secs}s`;
  };

  return (
    <HoloCard 
      className="p-6 border border-white/5 bg-white/[0.01] rounded-2xl shadow-xl"
      spotlightColor="rgba(59, 130, 246, 0.05)"
    >
      <div className="flex flex-col lg:flex-row items-center justify-between gap-6 relative z-10">
        <div className="flex items-center gap-5 w-full lg:w-auto">
          <div className="size-14 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center font-black text-white text-xl shadow-lg shadow-cyan-500/20">
            {patName[0]?.toUpperCase()}
          </div>
          <div className="flex flex-col gap-0.5">
            <p className="text-white font-black text-lg tracking-tight group-hover:text-cyan-400 transition-colors uppercase">{patName}</p>
            <div className="flex items-center gap-2">
              <span className="text-white/30 text-[10px] font-bold tracking-widest uppercase">{apt.timeSlot}</span>
              <span className={`px-2 py-0.5 rounded-lg text-[8px] font-black tracking-widest uppercase border ${statusConfig.color}`}>
                {statusConfig.label}
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto justify-end">
          {apt.status === 'pending' && (
            <>
              <button className="flex-1 lg:flex-none px-6 py-2.5 bg-cyan-500 hover:bg-cyan-600 text-white rounded-xl text-[10px] font-black tracking-widest uppercase transition-all shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-2" onClick={() => updateStatus(apt._id, 'confirmed')}>
                <CheckCircle size={14} /> Accept
              </button>
              <button className="flex-1 lg:flex-none px-4 py-2.5 bg-white/5 hover:bg-red-500/10 text-white/30 hover:text-red-400 rounded-xl border border-white/5 transition-all" onClick={() => updateStatus(apt._id, 'cancelled')}>
                <XCircle size={14} />
              </button>
            </>
          )}
          {apt.status === 'confirmed' && apt.roomId && (
            <>
              {windowStatus === 'open' ? (
                <Link href={`/video/${apt.roomId}`} className="flex-1 lg:flex-none px-8 py-2.5 bg-cyan-500 hover:bg-cyan-600 text-white rounded-xl text-[10px] font-black tracking-widest uppercase transition-all shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-2 animate-pulse">
                  <Video size={14} /> Enter Room
                </Link>
              ) : windowStatus === 'early' ? (
                <div className="flex flex-col items-end gap-1.5">
                   <button disabled className="px-8 py-2.5 bg-white/5 text-white/20 rounded-xl text-[10px] font-black tracking-widest uppercase border border-white/5 cursor-not-allowed">
                     <Video size={14} /> Enter Room
                   </button>
                   <span className="text-[9px] font-black text-amber-500/80 bg-amber-500/5 px-2 py-0.5 rounded-md border border-amber-500/10 tracking-widest uppercase">
                     {formatCountdown(secondsLeft)}
                   </span>
                </div>
              ) : (
                <span className="text-[10px] font-black text-white/20 uppercase tracking-widest">Session Expired</span>
              )}
              <button className="px-6 py-2.5 bg-white/5 hover:bg-emerald-500/10 text-white/30 hover:text-emerald-400 rounded-xl text-[10px] font-black tracking-widest uppercase border border-white/5 transition-all" onClick={() => updateStatus(apt._id, 'completed')}>
                Mark Done
              </button>
            </>
          )}
          {apt.notes && (
            <button className="px-6 py-2.5 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 rounded-xl text-[10px] font-black tracking-widest uppercase border border-cyan-500/20 transition-all flex items-center gap-2" onClick={() => showSummary(apt)}>
              <Sparkles size={14} /> AI Brief
            </button>
          )}
        </div>
      </div>
    </HoloCard>
  );
}

export default function DoctorDashboard() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [summaryApt, setSummaryApt] = useState(null);
  const [summaryText, setSummaryText] = useState('');
  const [summaryLoading, setSummaryLoading] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.push('/login'); return; }
    fetchAppointments();

    const socket = io(process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001');
    socket.on('connect', () => {
      socket.emit('doctor-online', { userId: user.id });
    });
    return () => socket.disconnect();
  }, [user, authLoading]);

  const fetchAppointments = async () => {
    const r = await fetch('/api/appointments');
    const d = await r.json();
    setAppointments(d.appointments || []);
    setLoading(false);
  };

  const updateStatus = async (id, status) => {
    await fetch(`/api/appointments/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) });
    toast.success(`Session status: ${status}`);
    fetchAppointments();
  };

  const generateSummary = async (apt) => {
    setSummaryApt(apt);
    setSummaryLoading(true);
    setSummaryText('');
    try {
      const res = await fetch('/api/ai/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: apt.notes, patientName: apt.patientId?.name }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSummaryText(data.summary);
    } catch (e) {
      toast.error(e.message || 'Briefing failure');
      setSummaryApt(null);
    } finally {
      setSummaryLoading(false);
    }
  };

  const pendingCount = appointments.filter(a => a.status === 'pending').length;
  const confirmedCount = appointments.filter(a => a.status === 'confirmed').length;
  const completedCount = appointments.filter(a => a.status === 'completed').length;

  return (
    <div className="flex flex-col gap-6 w-full max-w-[1600px] mx-auto">
      {/* Header */}

      {/* Stats and Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 shrink-0">
        <HoloCard 
          className="lg:col-span-8 p-6 md:p-10 flex flex-col gap-8 border-none bg-white/[0.01] shadow-2xl"
          spotlightColor="rgba(6, 182, 212, 0.1)"
        >
           <div className="flex items-center justify-between relative z-10">
              <div className="flex flex-col gap-1">
                <h3 className="text-2xl font-black text-white tracking-tight">Patient Flow Metrics</h3>
                <p className="text-white/20 text-[10px] font-bold uppercase tracking-[0.2em]">Weekly Consultation Volume</p>
              </div>
              <div className="p-3 bg-cyan-500/10 rounded-2xl text-cyan-500 border border-cyan-500/20 shadow-lg shadow-cyan-500/10">
                <TrendingUp size={24} />
              </div>
           </div>
           
           <div className="h-[280px] w-full relative z-10 mr-4">
             <ResponsiveContainer width="100%" height="100%">
               <AreaChart data={volumeData}>
                 <defs>
                   <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                     <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3}/>
                     <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                   </linearGradient>
                 </defs>
                 <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff03" />
                 <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#ffffff20', fontSize: 10, fontWeight: 900 }} />
                 <Tooltip 
                   contentStyle={{ 
                     backgroundColor: 'rgba(0,0,0,0.9)', 
                     backdropFilter: 'blur(20px)',
                     borderRadius: '16px', 
                     border: '1px solid #ffffff10', 
                     color: '#fff',
                     fontSize: '11px',
                     fontWeight: '900'
                   }} 
                 />
                 <Area type="monotone" dataKey="count" stroke="#06b6d4" strokeWidth={5} fillOpacity={1} fill="url(#colorCount)" />
               </AreaChart>
             </ResponsiveContainer>
           </div>
        </HoloCard>

        <div className="lg:col-span-4 grid grid-cols-2 lg:grid-cols-1 gap-6">
           <StatBox label="Queue" value={pendingCount} color="amber" icon={<Clock size={20}/>}/>
           <StatBox label="Active" value={confirmedCount} color="blue" icon={<Activity size={20}/>}/>
           <StatBox label="Success" value={completedCount} color="emerald" icon={<CheckCircle size={20}/>}/>
           <StatBox label="Total" value={appointments.length} color="cyan" icon={<Users size={20}/>}/>
        </div>
      </div>

      {/* Workspace */}
      <HoloCard className="flex-1 flex flex-col overflow-hidden border border-white/5 bg-white/[0.01] rounded-2xl shadow-2xl">
        <div className="flex items-center justify-between p-5 md:px-8 border-b border-white/10 bg-white/[0.02] shrink-0">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-cyan-500/10 rounded-2xl text-cyan-400 border border-cyan-500/20 shadow-lg">
              <Stethoscope size={24} />
            </div>
            <div className="flex flex-col">
              <h2 className="text-2xl font-black text-white tracking-tight">Daily Schedule</h2>
              <p className="text-white/20 text-[10px] font-black uppercase tracking-[0.2em]">Active Consultation Queue</p>
            </div>
          </div>
        </div>
        
        <div className="p-6 md:p-8 flex-1 overflow-y-auto custom-scrollbar">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-32 gap-6">
              <div className="size-16 border-2 border-cyan-500/20 border-t-cyan-500 animate-spin rounded-full shadow-lg shadow-cyan-500/10" />
            </div>
          ) : appointments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-32 text-center opacity-20">
              <Calendar size={80} className="mb-4 text-white" />
              <p className="text-white text-xl font-black tracking-tight">Operations Clear</p>
            </div>
          ) : (
            <div className="grid gap-6">
              {appointments.map(apt => (
                <AppointmentRow key={apt._id} apt={apt} updateStatus={updateStatus} showSummary={generateSummary} />
              ))}
            </div>
          )}
        </div>
      </HoloCard>

      {/* Modal */}
      {summaryApt && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-xl flex items-center justify-center z-[100] p-6 animate-in slide-in-from-bottom duration-500">
          <div className="glass-card max-w-2xl w-full p-10 relative border border-cyan-500/20 overflow-hidden">
            <div className="absolute top-0 right-0 p-20 bg-cyan-500/10 blur-[120px] rounded-full translate-x-1/2 -translate-y-1/2"></div>
            
            <button onClick={() => setSummaryApt(null)} className="absolute top-8 right-8 p-3 rounded-full hover:bg-white/5 text-white/30 hover:text-white transition-all">
              <X size={24} />
            </button>
            
            <div className="flex items-center gap-6 mb-10">
              <div className="p-4 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-3xl shadow-2xl shadow-cyan-500/20 rotate-3">
                <Sparkles size={32} className="text-white" />
              </div>
              <div className="flex flex-col gap-1">
                <h3 className="text-3xl font-black text-white tracking-tight">Intelligence Briefing</h3>
                <p className="text-cyan-400/70 text-sm font-bold tracking-widest uppercase">Subject: {summaryApt.patientId?.name}</p>
              </div>
            </div>

            <div className="bg-slate-950/40 rounded-3xl p-8 border border-white/5 shadow-inner min-h-[250px] flex items-center justify-center">
              {summaryLoading ? (
                <div className="flex flex-col items-center gap-6">
                  <Loader2 size={48} className="animate-spin text-cyan-500" />
                  <p className="text-white/20 text-xs font-black tracking-widest uppercase animate-pulse">Running Neural Analysis...</p>
                </div>
              ) : (
                <div className="text-white/90 leading-relaxed text-lg font-medium relative">
                   <span className="text-4xl absolute -top-4 -left-6 opacity-20 font-serif">"</span>
                   {summaryText}
                   <span className="text-4xl absolute -bottom-8 -right-4 opacity-20 font-serif">"</span>
                </div>
              )}
            </div>
            
            <div className="mt-10 flex items-center gap-4 p-5 bg-red-500/5 rounded-2xl border border-red-500/10">
              <Activity className="text-red-500 shrink-0" size={24} />
              <p className="text-red-400/60 text-[11px] font-bold leading-tight uppercase tracking-wider">
                This analysis is AI-synthesized for decision support. Cross-reference with primary clinical data for precision medicine.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatBox({ label, value, color, icon }) {
  const themes = {
    amber: { glow: 'rgba(245, 158, 11, 0.1)', text: 'text-amber-500', border: 'border-amber-500/20' },
    blue: { glow: 'rgba(59, 130, 246, 0.1)', text: 'text-blue-500', border: 'border-blue-500/20' },
    emerald: { glow: 'rgba(16, 185, 129, 0.1)', text: 'text-emerald-500', border: 'border-emerald-500/20' },
    cyan: { glow: 'rgba(6, 182, 212, 0.1)', text: 'text-cyan-400', border: 'border-cyan-500/20' }
  }
  
  const current = themes[color] || themes.cyan;

  return (
    <HoloCard 
      spotlightColor={current.glow}
      className={`p-5 border border-white/5 bg-white/[0.01] rounded-2xl shadow-xl`}
    >
      <div className="flex items-center justify-between relative z-10 w-full">
        <div className="flex flex-col">
          <span className="text-white/30 text-[9px] font-black tracking-[0.2em] uppercase mb-1">{label}</span>
          <h4 className="text-3xl font-black text-white tracking-tighter drop-shadow-lg">
            <ShinyText text={String(value)} speed={3} className="text-white" />
          </h4>
        </div>
        <div className={`p-3.5 rounded-xl bg-white/10 backdrop-blur-xl border ${current.border} ${current.text} shadow-inner transition-transform group-hover:scale-105`}>
          {icon}
        </div>
      </div>
    </HoloCard>
  )
}
