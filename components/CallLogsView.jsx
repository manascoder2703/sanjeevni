'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Phone, 
  PhoneCall, 
  PhoneIncoming, 
  PhoneOutgoing, 
  PhoneMissed, 
  Search, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Clock, 
  Calendar,
  X,
  PhoneOff
} from 'lucide-react';
import { useCall } from '@/context/CallContext';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

const ACCENT = '#18B6A2';
const DANGER = '#EF4444';
const INFO = '#3B82F6';

export default function CallLogsView({ role }) {
  const { initiateCall } = useCall();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All'); // 'All', 'Incoming', 'Outgoing', 'Missed'
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
    const today = new Date().toDateString();
    const yesterday = new Date(Date.now() - 86400000).toDateString();

    logsToGroup.forEach(log => {
      const date = new Date(log.createdAt);
      let dateStr = date.toDateString();
      if (dateStr === today) dateStr = 'TODAY';
      else if (dateStr === yesterday) dateStr = 'YESTERDAY';
      else {
        dateStr = date.toLocaleDateString('en-GB', { day: '2-digit', month: 'SHORT' }).toUpperCase();
      }

      if (!groups[dateStr]) groups[dateStr] = [];
      groups[dateStr].push(log);
    });
    return groups;
  };

  const groupedLogs = groupLogsByDate(filteredLogs);

  const formatDuration = (s) => {
    if (!s) return '---';
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
  };

  const formatTime = (dateStr) => {
    return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (loading) {
    return (
      <div className="flex h-96 w-full items-center justify-center">
        <div className="size-10 animate-spin rounded-full border-4 border-white/10 border-t-white" />
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto space-y-8 animate-in fade-in duration-700">
      {/* Header Info */}
      <div className="space-y-1">
        <h1 className="text-4xl font-black tracking-tighter text-white uppercase opacity-10">
          {role === 'doctor' ? 'Doctor Portal' : 'Patient Portal'}
        </h1>
        <h2 className="text-3xl font-bold text-white tracking-tight">Call logs</h2>
        <p className="text-white/40">History of all audio consultations with your {role === 'doctor' ? 'patients' : 'doctors'}.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard value={stats.total} label="Total calls" />
        <StatCard value={stats.completed} label="Completed" color={ACCENT} />
        <StatCard value={stats.missed} label="Missed" color={DANGER} />
        <StatCard value={`${stats.totalMins}m`} label="Total talk time" />
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center py-4">
        <div className="flex bg-white/5 p-1 rounded-xl border border-white/10">
          {['All', 'Incoming', 'Outgoing', 'Missed'].map(tab => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${
                filter === tab 
                  ? 'bg-white/10 text-white shadow-lg' 
                  : 'text-white/40 hover:text-white/60'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-96">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-white/30" />
          <input
            type="text"
            placeholder="Search by name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-white/20 transition-all font-medium"
          />
        </div>
      </div>

      {/* Log List */}
      <div className="space-y-10 pb-20">
        {Object.keys(groupedLogs).length === 0 ? (
          <div className="py-20 text-center space-y-4">
            <div className="size-20 bg-white/5 rounded-full flex items-center justify-center mx-auto">
              <PhoneCall className="size-8 text-white/20" />
            </div>
            <p className="text-white/40 font-medium text-lg">No call logs found matching your criteria.</p>
          </div>
        ) : (
          Object.entries(groupedLogs).map(([date, logsInGroup]) => (
            <div key={date} className="space-y-4">
              <div className="text-[11px] font-black tracking-[0.2em] text-white/30 uppercase px-2">
                {date}
              </div>
              <div className="space-y-px rounded-3xl overflow-hidden border border-white/5">
                {logsInGroup.map((log) => (
                  <CallLogRow 
                    key={log._id} 
                    log={log} 
                    onCall={() => initiateCall(log.otherUser, log.conversationId)} 
                  />
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function StatCard({ value, label, color = 'white' }) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-6 transition-all hover:bg-white/[0.07] group">
      <div className="text-3xl font-black mb-1 transition-all group-hover:scale-105 origin-left" style={{ color }}>
        {value}
      </div>
      <div className="text-sm font-bold text-white/30 uppercase tracking-wider">
        {label}
      </div>
    </div>
  );
}

function CallLogRow({ log, onCall }) {
  const isCompleted = log.status === 'completed';
  const isIncoming = log.direction === 'incoming';
  
  let arrowColor = INFO; // Blue for Outgoing
  if (!isCompleted) arrowColor = DANGER; // Red for Missed
  else if (isIncoming) arrowColor = ACCENT; // Green for Incoming

  return (
    <div className="group flex items-center gap-6 p-5 bg-white/[0.02] hover:bg-white/[0.05] transition-all border-b border-white/5 last:border-0 relative">
      {/* Direction Icon */}
      <div className="relative">
        <div className={`size-10 rounded-full flex items-center justify-center`} style={{ background: `${arrowColor}20`, color: arrowColor }}>
          {log.status !== 'completed' ? (
            <PhoneMissed size={18} className="rotate-0" />
          ) : isIncoming ? (
            <PhoneIncoming size={18} />
          ) : (
            <PhoneOutgoing size={18} />
          )}
        </div>
      </div>

      {/* Avatar */}
      <div className="size-12 rounded-full flex items-center justify-center text-sm font-black bg-white/10 text-white shrink-0 shadow-inner">
        {log.otherUser.avatar ? (
          <img src={log.otherUser.avatar} className="size-full rounded-full object-cover" />
        ) : (
          log.otherUser.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h4 className="text-lg font-bold text-white truncate">{log.otherUser.name}</h4>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest ${
            isCompleted ? 'bg-white/10 text-white/60' : 'bg-red-500/20 text-red-500'
          }`}>
            {log.status}
          </span>
        </div>
        <p className="text-sm text-white/40 font-medium">
          {log.otherUser.specialty} • {log.direction.charAt(0).toUpperCase() + log.direction.slice(1)}
        </p>
      </div>

      {/* Time & Duration */}
      <div className="text-right shrink-0">
        <div className="text-sm font-bold text-white/60">
          {formatTime(log.createdAt)}
        </div>
        <div className={`text-sm font-black ${isCompleted ? 'text-white/40' : 'text-white/20'}`}>
          {isCompleted ? formatDuration(log.duration) : '---'}
        </div>
      </div>

      {/* Action */}
      <div className="pl-4">
        <button 
          onClick={onCall}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20 text-white transition-all text-sm font-bold group/btn"
        >
          <PhoneCall size={16} className="group-hover/btn:scale-110 transition-transform" />
          <span className="opacity-80">Call again</span>
        </button>
      </div>
    </div>
  );
}

function formatTime(dateStr) {
  return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function formatDuration(s) {
  if (!s) return '---';
  const mins = Math.floor(s / 60);
  const secs = s % 60;
  return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
}
