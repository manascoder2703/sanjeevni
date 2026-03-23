'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { 
  PhoneCall, 
  PhoneIncoming, 
  PhoneOutgoing, 
  PhoneMissed, 
  Search, 
  Phone
} from 'lucide-react';
import { useCall } from '@/context/CallContext';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

const ACCENT = '#18B6A2'; // Green for Incoming
const DANGER = '#EF4444'; // Red for Missed
const INFO = '#3B82F6';   // Blue for Outgoing

export default function CallLogsView({ role }) {
  const { initiateCall } = useCall();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All'); 
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const res = await fetch('/api/calls');
        const data = await res.json();
        if (data.error) throw new Error(data.error);
        setLogs(data);
      } catch (err) {
        toast.error('Failed to load call logs');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, []);

  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      const matchesSearch = log.otherUser.name.toLowerCase().includes(search.toLowerCase());
      const matchesFilter = 
        filter === 'All' || 
        (filter === 'Incoming' && log.direction === 'incoming') ||
        (filter === 'Outgoing' && log.direction === 'outgoing') ||
        (filter === 'Missed' && (log.status === 'missed' || log.status === 'rejected' || log.status === 'declined'));
      return matchesSearch && matchesFilter;
    });
  }, [logs, search, filter]);

  const stats = useMemo(() => {
    const total = filteredLogs.length;
    const completed = filteredLogs.filter(l => l.status === 'completed').length;
    const missed = filteredLogs.filter(l => l.status !== 'completed').length;
    const totalSeconds = filteredLogs.reduce((acc, curr) => acc + (curr.duration || 0), 0);
    const totalMins = Math.round(totalSeconds / 60);

    return { total, completed, missed, totalMins };
  }, [filteredLogs]);

  const groupLogsByDate = (logsToGroup) => {
    const groups = {};
    const today = new Date();
    const yesterday = new Date(Date.now() - 86400000);

    const formatDate = (date) => {
      return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }).toUpperCase();
    };

    logsToGroup.forEach(log => {
      const date = new Date(log.createdAt);
      let dateKey = formatDate(date);
      let dateStr = dateKey;

      if (date.toDateString() === today.toDateString()) {
        dateStr = 'TODAY';
        dateKey = '0-TODAY';
      } else if (date.toDateString() === yesterday.toDateString()) {
        dateStr = 'YESTERDAY';
        dateKey = '1-YESTERDAY';
      } else {
        dateKey = `2-${dateKey}`;
      }

      if (!groups[dateKey]) groups[dateKey] = { label: dateStr, logs: [] };
      groups[dateKey].logs.push(log);
    });

    return Object.fromEntries(
      Object.entries(groups).sort(([a], [b]) => a.localeCompare(b))
    );
  };

  const groupedLogs = groupLogsByDate(filteredLogs);

  if (loading) {
    return (
      <div className="flex h-96 w-full items-center justify-center">
        <div className="size-16 relative">
          <div className="absolute inset-0 rounded-full border-4 border-white/5" />
          <div className="absolute inset-0 rounded-full border-4 border-t-white animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto space-y-10 py-10 px-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header Info */}
      <div className="space-y-2">
        <h1 className="text-sm font-black tracking-[0.3em] text-white/20 uppercase">
          {role === 'doctor' ? 'Doctor Portal' : 'Patient Portal'}
        </h1>
        <h2 className="text-5xl font-black text-white tracking-tighter">Call logs</h2>
        <p className="text-lg text-white/40 font-medium">History of all audio consultations with your {role === 'doctor' ? 'patients' : 'doctors'}.</p>
      </div>

      {/* Stats Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard value={stats.total} label="Total calls" />
        <StatCard value={stats.completed} label="Completed" color={ACCENT} glowColor={ACCENT} />
        <StatCard value={stats.missed} label="Missed" color={DANGER} glowColor={DANGER} />
        <StatCard value={stats.totalMins > 0 ? `${stats.totalMins}m` : '--'} label="Total talk time" />
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col lg:flex-row gap-6 justify-between items-center py-6 border-y border-white/5 backdrop-blur-sm sticky top-0 z-20">
        <div className="flex bg-white/5 p-1.5 rounded-2xl border border-white/10 w-full lg:w-auto overflow-x-auto no-scrollbar">
          {['All', 'Incoming', 'Outgoing', 'Missed'].map(tab => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-8 py-3 rounded-xl text-sm font-black tracking-wide transition-all duration-300 relative whitespace-nowrap ${
                filter === tab 
                  ? 'text-white bg-white/10 shadow-[0_0_20px_rgba(255,255,255,0.1)]' 
                  : 'text-white/30 hover:text-white/60 hover:bg-white/[0.02]'
              }`}
            >
              {tab}
              {filter === tab && (
                <motion.div layoutId="tab-underline" className="absolute bottom-1 left-2 right-2 h-0.5 bg-white/40 rounded-full" />
              )}
            </button>
          ))}
        </div>

        <div className="relative w-full lg:w-[400px] group">
          <div className="absolute inset-0 bg-white/5 blur-xl group-focus-within:bg-white/10 transition-all duration-500 rounded-2xl" />
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 size-5 text-white/30 group-focus-within:text-white/60 transition-colors" />
          <input
            type="text"
            placeholder="Search by name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="relative w-full bg-[#0A0A0A]/80 border border-white/10 rounded-2xl py-4 pl-14 pr-6 text-white focus:outline-none focus:ring-2 focus:ring-white/20 transition-all font-bold tracking-tight text-lg"
          />
        </div>
      </div>

      {/* Log List */}
      <div className="space-y-12 pb-24">
        <AnimatePresence mode="popLayout">
          {Object.keys(groupedLogs).length === 0 ? (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="py-32 text-center space-y-6 bg-white/[0.02] border border-dashed border-white/10 rounded-[3rem]"
            >
              <div className="size-24 bg-white/5 rounded-full flex items-center justify-center mx-auto shadow-inner">
                <Phone className="size-10 text-white/10" />
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-black text-white">No logs found</h3>
                <p className="text-white/30 font-bold uppercase tracking-widest text-xs">Try adjusting your filters</p>
              </div>
            </motion.div>
          ) : (
            Object.entries(groupedLogs).map(([key, group], groupIdx) => (
              <motion.div 
                key={key}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: groupIdx * 0.1 }}
                className="space-y-5"
              >
                <div className="flex items-center gap-4 px-2">
                  <span className="text-sm font-black tracking-[0.3em] text-white/30 uppercase">
                    {group.label}
                  </span>
                  <div className="h-px flex-1 bg-white/5" />
                </div>
                <div className="grid gap-1 rounded-[2.5rem] overflow-hidden border border-white/5 bg-white/[0.01] backdrop-blur-3xl p-1 shadow-2xl">
                  {group.logs.map((log) => (
                    <CallLogRow 
                      key={log._id} 
                      log={log} 
                      onCall={() => initiateCall(log.otherUser, log.conversationId)} 
                    />
                  ))}
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function StatCard({ value, label, color = 'white', glowColor }) {
  return (
    <motion.div 
      whileHover={{ y: -5, backgroundColor: 'rgba(255,255,255,0.08)' }}
      className="bg-white/5 border border-white/10 rounded-[2rem] p-8 transition-all relative overflow-hidden group"
    >
      {glowColor && (
        <div 
          className="absolute -right-4 -top-4 size-24 blur-[60px] opacity-20 transition-opacity group-hover:opacity-40" 
          style={{ background: glowColor }}
        />
      )}
      <div className="relative z-10">
        <div className="text-5xl font-black mb-2 transition-all tracking-tighter" style={{ color }}>
          {value}
        </div>
        <div className="text-xs font-black text-white/30 uppercase tracking-[0.2em]">
          {label}
        </div>
      </div>
    </motion.div>
  );
}

function CallLogRow({ log, onCall }) {
  const isCompleted = log.status === 'completed';
  const isIncoming = log.direction === 'incoming';
  
  let arrowColor = INFO; 
  if (!isCompleted) arrowColor = DANGER;
  else if (isIncoming) arrowColor = ACCENT;

  return (
    <motion.div 
      layout
      whileHover={{ backgroundColor: 'rgba(255,255,255,0.04)' }}
      className="group flex items-center gap-6 p-6 transition-all border-b border-white/[0.03] last:border-0 relative"
    >
      {/* Direction Icon */}
      <div className="relative shrink-0">
        <div 
          className="size-14 rounded-2xl flex items-center justify-center transition-all duration-500 group-hover:scale-110 shadow-lg" 
          style={{ background: `${arrowColor}15`, color: arrowColor, border: `1px solid ${arrowColor}20` }}
        >
          {!isCompleted ? (
            <PhoneMissed size={24} className="animate-pulse" />
          ) : isIncoming ? (
            <PhoneIncoming size={24} />
          ) : (
            <PhoneOutgoing size={24} />
          )}
        </div>
        {!isCompleted && (
          <div className="absolute -top-1 -right-1 size-3 bg-red-500 rounded-full border-2 border-black" />
        )}
      </div>

      {/* Avatar */}
      <div className="size-14 rounded-2xl flex items-center justify-center text-lg font-black bg-white/10 text-white shrink-0 shadow-2xl relative overflow-hidden group-hover:ring-2 ring-white/20 transition-all">
        {log.otherUser.avatar ? (
          <img src={log.otherUser.avatar} className="size-full object-cover" alt={log.otherUser.name} />
        ) : (
          <div className="size-full flex items-center justify-center bg-gradient-to-br from-white/10 to-white/5 uppercase">
            {log.otherUser.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-3 mb-1">
          <h4 className="text-xl font-black text-white tracking-tight truncate">{log.otherUser.name}</h4>
          <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-[0.2em] ${
            isCompleted 
              ? 'bg-white/10 text-white/60' 
              : 'bg-red-500/10 text-red-500 border border-red-500/20'
          }`}>
            {log.status}
          </span>
        </div>
        <div className="flex items-center gap-2 text-white/30 font-bold text-xs uppercase tracking-widest">
          <span className="text-white/50">{log.otherUser.specialty}</span>
          <span className="size-1 rounded-full bg-white/10" />
          <span>{log.direction}</span>
        </div>
      </div>

      {/* Time & Duration */}
      <div className="text-right shrink-0 hidden sm:block">
        <div className="text-sm font-black text-white mb-1">
          {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
        <div className={`text-xs font-black uppercase tracking-widest ${isCompleted ? 'text-white/20' : 'text-red-500/40'}`}>
          {isCompleted ? formatDuration(log.duration) : '--'}
        </div>
      </div>

      {/* Action */}
      <div className="pl-4">
        <motion.button 
          whileHover={{ scale: 1.05, backgroundColor: 'rgba(255,255,255,1)', color: 'black' }}
          whileTap={{ scale: 0.95 }}
          onClick={onCall}
          className="flex items-center gap-3 px-6 py-3.5 rounded-2xl border border-white/10 bg-white/5 text-white transition-all text-sm font-black uppercase tracking-widest group/btn shadow-[0_0_20px_rgba(255,255,255,0)] hover:shadow-[0_0_20px_rgba(255,255,255,0.2)]"
        >
          <PhoneCall size={18} />
          <span className="hidden md:inline">Call again</span>
        </motion.button>
      </div>
    </motion.div>
  );
}

function formatDuration(s) {
  if (!s) return '---';
  const mins = Math.floor(s / 60);
  const secs = s % 60;
  return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
}
