'use client';
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import {
  CalendarDays, Video, Clock, CheckCircle2, XCircle,
  Stethoscope, Activity, Users, Zap, Search, ArrowRight,
  TrendingUp, Calendar, ChevronRight, AlertCircle
} from 'lucide-react';

// ─── Helpers ────────────────────────────────────────────────────────────────

function getInitials(name = '') {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

function formatDate(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function formatTime(timeSlot) {
  return timeSlot || '—';
}

function getStatusConfig(status) {
  switch (status) {
    case 'confirmed': return { label: 'Confirmed', color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', dot: 'bg-emerald-400' };
    case 'pending':   return { label: 'Pending',   color: 'text-amber-400',   bg: 'bg-amber-500/10',   border: 'border-amber-500/20',   dot: 'bg-amber-400' };
    case 'completed': return { label: 'Completed', color: 'text-blue-400',    bg: 'bg-blue-500/10',    border: 'border-blue-500/20',    dot: 'bg-blue-400' };
    case 'cancelled': return { label: 'Cancelled', color: 'text-rose-400',    bg: 'bg-rose-500/10',    border: 'border-rose-500/20',    dot: 'bg-rose-400' };
    default:          return { label: status,      color: 'text-white/40',    bg: 'bg-white/5',        border: 'border-white/10',       dot: 'bg-white/40' };
  }
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function PatientDashboard() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('active');

  const fetchAppointments = useCallback(async () => {
    try {
      const res = await fetch('/api/appointments');
      const data = await res.json();
      setAppointments(data.appointments || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAppointments(); }, [fetchAppointments]);

  // ── Derived data ──
  const todayDate = new Date().toISOString().split('T')[0];
  
  const todayAppointments = appointments.filter(a => a.date === todayDate && a.status !== 'cancelled');
  const upcomingAppointments = appointments
    .filter(a => a.date > todayDate && a.status !== 'cancelled')
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .slice(0, 3);

  const activeAppointments = appointments.filter(a => ['pending', 'confirmed'].includes(a.status));
  const pastAppointments = appointments.filter(a => a.status === 'completed' || (a.status !== 'cancelled' && a.date < todayDate));
  const cancelledAppointments = appointments.filter(a => a.status === 'cancelled');

  const tabData = { active: activeAppointments, past: pastAppointments, cancelled: cancelledAppointments };

  // ── Stats ──
  const total = appointments.length;
  const completed = appointments.filter(a => a.status === 'completed').length;
  const doctorsVisited = new Set(appointments.map(a => a.doctorId?._id || a.doctorId)).size;
  const healthScore = total === 0 ? 0 : Math.min(98, Math.round(60 + (completed / Math.max(total, 1)) * 38));

  const firstName = user?.name?.split(' ')[0] || 'Patient';

  return (
    <div className="flex flex-col gap-8 w-full pb-20 max-w-[1240px]">
      
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/20">Good Morning</span>
          <h1 className="text-3xl font-black text-white tracking-tight">
            {firstName} <span className="text-white/20">·</span> <span className="text-[#3b82f6]">Patient Portal</span>
          </h1>
        </div>
        <Link
  href="/dashboard/patient/doctors"
  style={{ padding: '12px 32px' }}
  className="group flex items-center justify-center gap-3 rounded-full border border-white/20 bg-[#1a1a1a] text-white text-sm font-semibold transition-all duration-200 active:scale-95 whitespace-nowrap hover:bg-white hover:text-black hover:border-white"
>
  <Zap size={16} className="text-white group-hover:text-black transition-colors duration-200 group-hover:[color:black] shrink-0" />
  <span className="group-hover:text-black transition-colors duration-200">Find a Doctor</span>
</Link>
      </div>

      {/* ── Stats Highlights ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total', value: total, icon: CalendarDays, color: 'text-blue-400', bg: 'bg-blue-500/10' },
          { label: 'Completed', value: completed, icon: CheckCircle2, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
          { label: 'Doctors', value: doctorsVisited, icon: Users, color: 'text-violet-400', bg: 'bg-violet-500/10' },
          { label: 'Health Score', value: `${healthScore}%`, icon: Activity, color: 'text-white', bg: 'bg-amber-500/10' },
        ].map(stat => (
          <div key={stat.label} className="bg-white/[0.02] border border-white/[0.05] rounded-[24px] p-6 flex flex-col items-center justify-center gap-4 hover:bg-white/[0.04] transition-all min-h-[130px] text-center">
  <div className={`size-14 rounded-2xl ${stat.bg} flex items-center justify-center shadow-lg`}>
    <stat.icon size={24} className={stat.color} />
  </div>
  <div className="flex flex-col gap-1 items-center">
    <span className="text-3xl font-black text-white tracking-tighter">{loading ? '—' : stat.value}</span>
    <span className="text-[9px] uppercase tracking-widest text-white/20 font-black">{stat.label}</span>
  </div>
</div>
        ))}
      </div>

      {/* ── Main Dashboard Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Today's Schedule */}
        <div className="lg:col-span-8 flex flex-col bg-white/[0.02] border border-white/[0.05] rounded-[32px] gap-6 relative overflow-hidden" style={{ padding: '2rem 2.5rem' }}>
          <div className="flex items-center justify-between relative z-10">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-xl bg-blue-500/10 flex items-center justify-center shadow-inner">
                <CalendarDays size={18} className="text-blue-500" />
              </div>
              <h3 className="text-lg font-black text-white tracking-tight">Today's Appointments</h3>
            </div>
            <span className="text-[10px] font-black uppercase tracking-[0.15em] text-white/20">
              {new Date().toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}
            </span>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20 animate-pulse">
               <div className="size-10 border-2 border-blue-500/20 border-t-blue-500 animate-spin rounded-full" />
            </div>
          ) : todayAppointments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
              <div className="size-16 rounded-full bg-white/[0.02] border border-white/5 flex items-center justify-center">
                <CalendarDays size={32} className="text-white/10" />
              </div>
              <div className="flex flex-col gap-1">
                <p className="text-white/30 text-sm font-bold">No appointments today</p>
                <Link href="/dashboard/patient/doctors" className="text-blue-500 text-xs font-black uppercase tracking-widest hover:text-blue-400 transition-all">
                  Book one now →
                </Link>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {todayAppointments.map(appt => {
                const docName = appt.doctorId?.userId?.name || 'Doctor';
                const { label, color, bg, border, dot } = getStatusConfig(appt.status);
                return (
                  <div key={appt._id} className="flex items-center gap-5 p-5 bg-white/[0.02] border border-white/[0.05] rounded-3xl hover:bg-white/[0.04] transition-all">
                    <div className="size-12 rounded-full bg-blue-500/20 flex items-center justify-center shrink-0 ring-4 ring-blue-500/5">
                      <span className="text-sm font-black text-blue-400">{getInitials(docName)}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-[15px] font-black text-white">Dr. {docName}</h4>
                      <p className="text-[11px] font-bold text-white/30 mt-0.5 capitalize">
                        {appt.doctorId?.specialization || 'Specialist'} <span className="mx-1.5 opacity-30">·</span> {appt.timeSlot}
                      </p>
                    </div>
                    <div className={`px-4 py-1.5 rounded-full border ${bg} ${border} flex items-center gap-2`}>
                      <span className={`size-2 rounded-full ${dot} shadow-lg`} />
                      <span className={`text-[10px] font-black uppercase tracking-widest ${color}`}>{label}</span>
                    </div>
                    <button className="px-6 py-2.5 rounded-xl bg-white/[0.05] border border-white/10 text-white text-[10px] font-black uppercase tracking-widest hover:bg-blue-500 hover:border-blue-500 transition-all shadow-lg">
                      Join
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Health Score Ring */}
        <div className="lg:col-span-4 flex flex-col bg-white/[0.02] border border-white/[0.05] rounded-[32px] gap-8" style={{ padding: '2rem 2.5rem' }}>
           <div className="flex items-center gap-3">
              <div className="size-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
                <Activity size={18} className="text-amber-500" />
              </div>
              <h3 className="text-lg font-black text-white tracking-tight">Health Score</h3>
           </div>

           <div className="flex flex-col items-center gap-6">
              <div className="relative size-36">
                 <svg className="size-full -rotate-90" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8" />
                    <circle
                      cx="50" cy="50" r="42" fill="none"
                      stroke="#3b82f6"
                      strokeWidth="10"
                      strokeLinecap="round"
                      strokeDasharray="264"
                      strokeDashoffset={264 - (2.64 * healthScore)}
                      className="transition-all duration-1000 ease-out shadow-2xl"
                    />
                 </svg>
                 <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-4xl font-black text-white tracking-tighter">{healthScore}</span>
                    <span className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em]">Score</span>
                 </div>
              </div>
              <div className={`px-5 py-1.5 rounded-full flex items-center gap-2 border font-black uppercase text-[10px] tracking-widest
                ${healthScore > 80 ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-amber-500/10 border-amber-500/20 text-amber-500'}`}>
                 <Zap size={10} /> {healthScore > 80 ? 'Excellent' : 'Good'}
              </div>
           </div>

           <div className="flex flex-col gap-3">
              {[
                { label: 'Appointments kept', value: `${completed}/${total}` },
                { label: 'Doctors consulted', value: doctorsVisited },
                { label: 'Cancellation rate', value: total > 0 ? `${Math.round((cancelledAppointments.length / total) * 100)}%` : '0%' }
              ].map(item => (
                <div key={item.label} className="flex justify-between items-center py-2 border-b border-white/[0.03] last:border-0">
                  <span className="text-[11px] font-bold text-white/30">{item.label}</span>
                  <span className="text-[11px] font-black text-white">{item.value}</span>
                </div>
              ))}
           </div>
        </div>
      </div>

      {/* ── Upcoming Row ── */}
      <div className="flex flex-col gap-6">
        <div className="flex items-center gap-4">
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/10">Upcoming</span>
          <div className="h-px flex-1 bg-white/5" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {upcomingAppointments.length === 0 ? (
            <div className="col-span-full py-10 bg-white/[0.01] border border-dashed border-white/5 rounded-3xl flex items-center justify-center text-white/20 text-xs font-bold italic">
               No future sessions scheduled
            </div>
          ) : (
            upcomingAppointments.map(appt => {
              const docName = appt.doctorId?.userId?.name || 'Doctor';
              const { label, color, bg, border, dot } = getStatusConfig(appt.status);
              return (
                <div key={appt._id} className="bg-white/[0.02] border border-white/[0.05] rounded-[28px] p-6 flex flex-col gap-5 hover:bg-white/[0.04] transition-all group">
                   <div className="flex items-center gap-4">
                      <div className="size-11 rounded-full bg-violet-500/20 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                        <span className="text-xs font-black text-violet-400">{getInitials(docName)}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-black text-white truncate">Dr. {docName}</h4>
                        <p className="text-[10px] font-bold text-white/30 truncate capitalize">{appt.doctorId?.specialization || 'Specialist'}</p>
                      </div>
                   </div>
                   <div className="flex items-center justify-between text-[11px] font-bold text-white/40">
                      <div className="flex items-center gap-2">
                        <Calendar size={12} className="text-blue-500/50" /> {formatDate(appt.date)}
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock size={12} className="text-blue-500/50" /> {appt.timeSlot}
                      </div>
                   </div>
                   <div className={`px-4 py-1.5 rounded-full border ${bg} ${border} w-fit`}>
                      <span className={`text-[10px] font-black uppercase tracking-widest ${color}`}>{label}</span>
                   </div>
                </div>
              )
            })
          )}
        </div>
      </div>

      {/* ── Consultation Log ── */}
      <div className="flex flex-col gap-6">
        <div className="flex items-center gap-4">
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/10 text-nowrap">Consultation Log</span>
          <div className="h-px flex-1 bg-white/5" />
        </div>

        <div className="flex gap-2 bg-white/[0.02] p-1.5 rounded-2xl w-fit border border-white/[0.05]">
          {[
            { id: 'active', label: 'Active', icon: CheckCircle2, count: activeAppointments.length },
            { id: 'past', label: 'Past', icon: Clock, count: pastAppointments.length },
            { id: 'cancelled', label: 'Cancelled', icon: XCircle, count: cancelledAppointments.length }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2.5 px-6 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all
                ${activeTab === tab.id ? 'bg-white/[0.08] text-white shadow-xl ring-1 ring-white/10' : 'text-white/30 hover:text-white/60'}`}
            >
              <tab.icon size={12} /> {tab.label} <span className="opacity-30 text-[9px]">{tab.count}</span>
            </button>
          ))}
        </div>

        <div className="bg-white/[0.02] border border-white/[0.05] rounded-[32px] overflow-hidden shadow-2xl">
          <div className="grid grid-cols-12 gap-4 px-8 py-5 border-b border-white/[0.05] bg-white/[0.01]">
            <span className="col-span-4 text-[9px] font-black uppercase tracking-[0.2em] text-white/20">Doctor</span>
            <span className="col-span-2 text-[9px] font-black uppercase tracking-[0.2em] text-white/20">Date</span>
            <span className="col-span-2 text-[9px] font-black uppercase tracking-[0.2em] text-white/20">Time</span>
            <span className="col-span-2 text-[9px] font-black uppercase tracking-[0.2em] text-white/20">Status</span>
            <span className="col-span-2 text-[9px] font-black uppercase tracking-[0.2em] text-white/20 text-right">Action</span>
          </div>

          <div className="flex flex-col">
            {tabData[activeTab].length === 0 ? (
               <div className="flex flex-col items-center justify-center py-20 opacity-20 italic text-sm">
                  Inventory empty for this classification
               </div>
            ) : (
              tabData[activeTab].map(appt => {
                const docName = appt.doctorId?.userId?.name || 'Doctor';
                const { label, color, bg, border, dot } = getStatusConfig(appt.status);
                return (
                  <div key={appt._id} className="grid grid-cols-12 gap-4 px-8 py-6 items-center hover:bg-white/[0.02] transition-colors border-b border-white/[0.04] last:border-0 group">
                    <div className="col-span-4 flex items-center gap-4">
                      <div className="size-9 rounded-full bg-blue-500/10 flex items-center justify-center shrink-0 border border-blue-500/20">
                        <span className="text-[10px] font-black text-blue-400">{getInitials(docName)}</span>
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-black text-white group-hover:text-blue-400 transition-colors truncate">Dr. {docName}</p>
                        <p className="text-[10px] font-bold text-white/25 truncate capitalize">{appt.doctorId?.specialization || 'Specialist'}</p>
                      </div>
                    </div>
                    <div className="col-span-2 text-xs font-bold text-white/60">
                      {formatDate(appt.date)}
                    </div>
                    <div className="col-span-2 text-xs font-bold text-white/60">
                      {appt.timeSlot}
                    </div>
                    <div className="col-span-2">
                       <div className={`px-4 py-1.5 rounded-full border ${bg} ${border} flex items-center gap-2 w-fit`}>
                         <span className={`size-1.5 rounded-full ${dot}`} />
                         <span className={`text-[10px] font-black uppercase tracking-widest ${color}`}>{label}</span>
                       </div>
                    </div>
                    <div className="col-span-2 flex justify-end">
                       <button className="px-5 py-2 rounded-lg bg-white/[0.05] border border-white/10 text-white text-[10px] font-black uppercase tracking-widest hover:bg-white/[0.1] transition-all">
                         View
                       </button>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}