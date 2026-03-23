'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Phone,
  PhoneCall,
  PhoneIncoming,
  PhoneOutgoing,
  PhoneMissed,
  Search,
} from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { useCall } from '@/context/CallContext';

const CHIP_MAP = ['All', 'Incoming', 'Outgoing', 'Missed'];
const SURFACE = 'bg-[#1f1f1f]/88';
const SURFACE_SOFT = 'bg-[#232323]/86';
const BORDER = 'border-white/12';

export default function CallLogsView({ role }) {
  const { initiateCall, callState } = useCall();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState('');

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/calls', { cache: 'no-store' });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || 'Failed to fetch logs');
      setLogs(Array.isArray(data) ? data : []);
    } catch (err) {
      const message = err?.message || 'Failed to fetch logs';
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const filteredLogs = useMemo(() => {
    const query = search.trim().toLowerCase();
    return logs
      .filter((log) => {
        const name = log?.otherUser?.name || '';
        const specialty = log?.otherUser?.specialty || '';
        const matchesSearch = !query || name.toLowerCase().includes(query) || specialty.toLowerCase().includes(query);
        const missed = ['missed', 'rejected', 'declined'].includes(log.status);
        const matchesFilter =
          filter === 'All' ||
          (filter === 'Incoming' && log.direction === 'incoming') ||
          (filter === 'Outgoing' && log.direction === 'outgoing') ||
          (filter === 'Missed' && missed);
        return matchesSearch && matchesFilter;
      })
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [logs, search, filter]);

  const stats = useMemo(() => {
    const total = logs.length;
    const completed = logs.filter((l) => l.status === 'completed').length;
    const missed = logs.filter((l) => l.status !== 'completed').length;
    const totalSeconds = logs.reduce((acc, curr) => acc + (curr.duration || 0), 0);
    const totalMins = Math.round(totalSeconds / 60);
    return { total, completed, missed, totalMins };
  }, [logs]);

  const groupedLogs = useMemo(() => {
    const grouped = {};
    const today = new Date();
    const yesterday = new Date(Date.now() - 86400000);

    filteredLogs.forEach((log) => {
      const d = new Date(log.createdAt);
      let label = d.toLocaleDateString([], { day: '2-digit', month: 'short' }).toUpperCase();
      if (d.toDateString() === today.toDateString()) label = 'TODAY';
      else if (d.toDateString() === yesterday.toDateString()) label = 'YESTERDAY';
      if (!grouped[label]) grouped[label] = [];
      grouped[label].push(log);
    });

    const ordered = [];
    if (grouped.TODAY) ordered.push(['TODAY', grouped.TODAY]);
    if (grouped.YESTERDAY) ordered.push(['YESTERDAY', grouped.YESTERDAY]);
    Object.keys(grouped)
      .filter((k) => !['TODAY', 'YESTERDAY'].includes(k))
      .sort((a, b) => {
        const aDate = new Date(grouped[a][0]?.createdAt || 0).getTime();
        const bDate = new Date(grouped[b][0]?.createdAt || 0).getTime();
        return bDate - aDate;
      })
      .forEach((k) => ordered.push([k, grouped[k]]));
    return ordered;
  }, [filteredLogs]);

  const onCallAgain = (log) => {
    if (callState !== 'idle') {
      toast.error('You are already in a call');
      return;
    }
    if (!log?.conversationId || !log?.otherUser?.id) {
      toast.error('Call unavailable for this log');
      return;
    }
    initiateCall(log.otherUser, log.conversationId);
  };

  if (loading) {
    return (
      <div className="w-full max-w-5xl mx-auto px-6 py-10">
        <div className="rounded-2xl border border-white/10 bg-white/[0.02] py-16 text-center">
          <p className="text-white/60 font-semibold">Loading call logs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-5xl mx-auto px-4 md:px-6 py-7 md:py-8">
      <div className="space-y-4">
        <div>
          <p className="text-[10px] uppercase tracking-[0.22em] text-white/45 font-black">
            {role === 'doctor' ? 'Doctor Portal' : 'Patient Portal'}
          </p>
          <h1 className="text-[40px] leading-[1.05] font-black text-white mt-1 tracking-tight">Call logs</h1>
          <p className="text-white/60 text-[23px] leading-6 font-medium mt-1">
            History of all audio consultations with your {role === 'doctor' ? 'patients' : 'doctors'}.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatTile label="Total calls" value={stats.total} />
          <StatTile label="Completed" value={stats.completed} color="text-emerald-400" />
          <StatTile label="Missed" value={stats.missed} color="text-rose-400" />
          <StatTile label="Total talk time" value={stats.totalMins > 0 ? `${stats.totalMins}m` : '--'} />
        </div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-1">
          <div className="flex flex-wrap items-center gap-2">
            {CHIP_MAP.map((chip) => (
              <button
                key={chip}
                onClick={() => setFilter(chip)}
                className={`h-10 px-4 rounded-xl border text-[15px] font-semibold transition ${
                  filter === chip
                    ? 'bg-white/14 border-white/35 text-white'
                    : `${SURFACE_SOFT} border-white/15 text-white/75 hover:text-white hover:bg-[#2b2b2b]/92`
                }`}
              >
                {chip}
              </button>
            ))}
          </div>

          <div className="relative w-full md:w-[280px]">
            <Search className="size-4 text-white/45 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name..."
              className={`h-10 w-full rounded-xl border ${BORDER} ${SURFACE_SOFT} pl-9 pr-3 text-[15px] text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-white/20`}
            />
          </div>
        </div>

        {error && (
          <div className="rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {error}
          </div>
        )}

        {groupedLogs.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/15 bg-white/[0.02] py-16 text-center">
            <Phone className="size-8 text-white/20 mx-auto mb-3" />
            <p className="text-white/70 font-bold">No logs found</p>
          </div>
        ) : (
          <div className={`rounded-2xl border ${BORDER} ${SURFACE} overflow-hidden shadow-[0_8px_40px_rgba(0,0,0,0.35)]`}>
            {groupedLogs.map(([label, rows]) => (
              <div key={label}>
                <div className="px-4 py-2 border-y border-white/10 bg-[#2a2a2a]/90 text-[11px] font-black tracking-[0.16em] text-white/45 uppercase">
                  {label}
                </div>
                {rows.map((log) => (
                  <CallRow key={log._id} log={log} isBusy={callState !== 'idle'} onCallAgain={() => onCallAgain(log)} />
                ))}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatTile({ label, value, color = 'text-white' }) {
  return (
    <div className={`rounded-xl border ${BORDER} ${SURFACE_SOFT} px-4 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]`}>
      <div className={`text-4xl leading-9 font-black ${color}`}>{value}</div>
      <div className="text-[18px] text-white/70 leading-5 mt-1">{label}</div>
    </div>
  );
}

function CallRow({ log, onCallAgain, isBusy }) {
  const isIncoming = log.direction === 'incoming';
  const isCompleted = log.status === 'completed';
  const canCall = Boolean(log?.conversationId && log?.otherUser?.id) && !isBusy;

  return (
    <motion.div layout className="px-4 py-3 border-b border-white/10 last:border-b-0 hover:bg-[#2a2a2a]/85 transition">
      <div className="flex items-center gap-3">
        <div className={`size-9 rounded-full flex items-center justify-center border ${isIncoming ? 'bg-emerald-200/20 border-emerald-100/35 text-emerald-50' : 'bg-blue-200/20 border-blue-100/35 text-blue-50'}`}>
          {isIncoming ? <PhoneIncoming size={14} /> : <PhoneOutgoing size={14} />}
        </div>
        <div className="size-9 rounded-full bg-[#e8ecef] text-[#49515b] flex items-center justify-center text-xs font-black uppercase">
          {(log?.otherUser?.name || 'U').split(' ').map((x) => x[0]).join('').slice(0, 2)}
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-white text-[22px] leading-6 font-bold truncate">{log?.otherUser?.name || 'Unknown user'}</p>
          <p className="text-white/65 text-[15px] leading-5 truncate">
            {log?.otherUser?.specialty || 'Consultation'} · {capitalize(log.direction)}
          </p>
          <span className={`mt-1 inline-flex rounded-full px-2 py-0.5 text-[11px] font-bold ${
            isCompleted ? 'bg-emerald-100/85 text-emerald-900' : 'bg-rose-100/85 text-rose-900'
          }`}>
            {capitalize(log.status)}
          </span>
        </div>

        <div className="text-right shrink-0">
          <p className="text-white/70 text-sm font-semibold">{new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
          <p className="text-white text-sm font-black">{isCompleted ? formatDuration(log.duration) : '—'}</p>
          <button
            onClick={onCallAgain}
            disabled={!canCall}
            className="mt-2 inline-flex items-center gap-2 h-9 px-3 rounded-lg border border-white/25 bg-[#2c2c2c]/95 text-white text-sm font-semibold hover:bg-[#3a3a3a] transition disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <PhoneCall size={14} />
            Call again
          </button>
        </div>
      </div>
    </motion.div>
  );
}

function capitalize(s = '') {
  if (!s) return '';
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function formatDuration(value) {
  if (!value) return '--';
  const mins = Math.floor(value / 60);
  const secs = value % 60;
  return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
}
