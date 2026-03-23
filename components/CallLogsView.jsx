'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  PhoneCall,
  PhoneIncoming,
  PhoneOutgoing,
  PhoneMissed,
  Search,
  Phone,
  RefreshCcw,
  Clock3,
  CheckCircle2,
  XCircle,
  ArrowUpDown,
  Filter,
} from 'lucide-react';
import { useCall } from '@/context/CallContext';
import { AnimatePresence, motion } from 'framer-motion';
import toast from 'react-hot-toast';

const ACCENT = '#18B6A2';
const DANGER = '#EF4444';
const INFO = '#3B82F6';
const PANEL = 'rgba(255,255,255,0.03)';

export default function CallLogsView({ role }) {
  const { initiateCall, callState } = useCall();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [sortOrder, setSortOrder] = useState('latest');
  const [refreshing, setRefreshing] = useState(false);

  const fetchLogs = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    if (silent) setRefreshing(true);
    setError('');
    try {
      const res = await fetch('/api/calls', { cache: 'no-store' });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || 'Failed to load call logs');
      setLogs(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || 'Failed to load call logs');
      toast.error('Failed to load call logs');
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const filteredLogs = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    const next = logs.filter((log) => {
      const name = log?.otherUser?.name || 'Unknown User';
      const specialty = log?.otherUser?.specialty || '';
      const matchesSearch =
        !normalizedSearch ||
        name.toLowerCase().includes(normalizedSearch) ||
        specialty.toLowerCase().includes(normalizedSearch);
      const matchesFilter = 
        filter === 'All' || 
        (filter === 'Incoming' && log.direction === 'incoming') ||
        (filter === 'Outgoing' && log.direction === 'outgoing') ||
        (filter === 'Missed' && (log.status === 'missed' || log.status === 'rejected' || log.status === 'declined'));
      return matchesSearch && matchesFilter;
    });
    return [...next].sort((a, b) => {
      const aTime = new Date(a?.createdAt || 0).getTime();
      const bTime = new Date(b?.createdAt || 0).getTime();
      return sortOrder === 'latest' ? bTime - aTime : aTime - bTime;
    });
  }, [logs, search, filter, sortOrder]);

  const filterCounts = useMemo(() => {
    const incoming = logs.filter((log) => log.direction === 'incoming').length;
    const outgoing = logs.filter((log) => log.direction === 'outgoing').length;
    const missed = logs.filter((log) => ['missed', 'rejected', 'declined'].includes(log.status)).length;
    return {
      All: logs.length,
      Incoming: incoming,
      Outgoing: outgoing,
      Missed: missed,
    };
  }, [logs]);

  const stats = useMemo(() => {
    const total = logs.length;
    const completed = logs.filter((l) => l.status === 'completed').length;
    const missed = logs.filter((l) => l.status !== 'completed').length;
    const totalSeconds = logs.reduce((acc, curr) => acc + (curr.duration || 0), 0);
    const totalMins = Math.round(totalSeconds / 60);

    return { total, completed, missed, totalMins, visible: filteredLogs.length };
  }, [logs, filteredLogs.length]);

  const groupedLogs = useMemo(() => {
    const groups = {};
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1);

    filteredLogs.forEach((log) => {
      const date = new Date(log.createdAt);
      const bucketDate = new Date(date);
      bucketDate.setHours(0, 0, 0, 0);
      const key = bucketDate.toISOString();

      if (!groups[key]) {
        let label = bucketDate.toLocaleDateString([], { day: '2-digit', month: 'short', year: 'numeric' });
        if (bucketDate.getTime() === today.getTime()) label = 'Today';
        if (bucketDate.getTime() === yesterday.getTime()) label = 'Yesterday';
        groups[key] = { key, label, logs: [] };
      }
      groups[key].logs.push(log);
    });

    const list = Object.values(groups).sort((a, b) => {
      const aTime = new Date(a.key).getTime();
      const bTime = new Date(b.key).getTime();
      return sortOrder === 'latest' ? bTime - aTime : aTime - bTime;
    });
    return list;
  }, [filteredLogs, sortOrder]);

  const onCall = (log) => {
    if (callState !== 'idle') {
      toast.error('You are already in a call');
      return;
    }
    if (!log?.conversationId || !log?.otherUser?.id) {
      toast.error('This call cannot be started from logs');
      return;
    }
    initiateCall(log.otherUser, log.conversationId);
  };

  const clearFilters = () => {
    setFilter('All');
    setSearch('');
    setSortOrder('latest');
  };

  if (loading) {
    return (
      <div className="w-full max-w-7xl mx-auto p-6 md:p-8">
        <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-8 md:p-10">
          <div className="size-12 relative mx-auto">
            <div className="absolute inset-0 rounded-full border-4 border-white/10" />
            <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-white animate-spin" />
          </div>
          <p className="mt-4 text-center text-sm text-white/55 font-semibold">Loading call logs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full self-stretch">
      <section className="w-full max-w-7xl mx-auto px-4 md:px-8 py-6 md:py-8 space-y-6">
        <div className="rounded-3xl border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.02))] p-5 md:p-7">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-1">
              <h1 className="text-[11px] md:text-xs font-black tracking-[0.25em] text-white/40 uppercase">
                {role === 'doctor' ? 'Doctor Portal' : 'Patient Portal'}
              </h1>
              <h2 className="text-3xl md:text-4xl font-black text-white tracking-tight">Call Logs</h2>
              <p className="text-sm md:text-base text-white/65 font-medium">
                Monitor audio consultation history with your {role === 'doctor' ? 'patients' : 'doctors'}.
              </p>
            </div>
            <button
              onClick={() => fetchLogs(true)}
              disabled={refreshing}
              className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-xs font-black uppercase tracking-[0.18em] text-white/90 transition hover:bg-white/10 disabled:opacity-50"
            >
              <RefreshCcw className={`size-4 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>

          <div className="mt-5 grid grid-cols-2 xl:grid-cols-5 gap-3">
            <StatCard value={stats.total} label="Total calls" icon={PhoneCall} />
            <StatCard value={stats.completed} label="Completed" color={ACCENT} glowColor={ACCENT} icon={CheckCircle2} />
            <StatCard value={stats.missed} label="Missed" color={DANGER} glowColor={DANGER} icon={XCircle} />
            <StatCard value={stats.totalMins > 0 ? `${stats.totalMins}m` : '--'} label="Talk time" icon={Clock3} />
            <StatCard value={stats.visible} label="Visible" icon={Filter} />
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-3 md:p-4 space-y-3">
          <div className="flex flex-col xl:flex-row xl:items-center gap-3 justify-between">
            <div className="flex flex-wrap gap-2">
              {['All', 'Incoming', 'Outgoing', 'Missed'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setFilter(tab)}
                  className={`inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-black uppercase tracking-[0.14em] border transition ${
                    filter === tab
                      ? 'bg-white text-black border-white'
                      : 'bg-white/5 text-white/75 border-white/15 hover:text-white hover:bg-white/10'
                  }`}
                >
                  {tab}
                  <span className={`${filter === tab ? 'text-black/80' : 'text-white/55'}`}>({filterCounts[tab]})</span>
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setSortOrder((prev) => (prev === 'latest' ? 'oldest' : 'latest'))}
                className="inline-flex h-11 items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-3 text-xs font-black uppercase tracking-[0.14em] text-white/85 hover:bg-white/10 transition"
              >
                <ArrowUpDown className="size-4" />
                {sortOrder === 'latest' ? 'Latest' : 'Oldest'}
              </button>
              <div className="relative min-w-0 w-full sm:w-[320px]">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-white/45" />
                <input
                  type="text"
                  placeholder="Search by name or specialty"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="h-11 w-full rounded-xl border border-white/15 bg-[#0A0A0A]/85 pl-10 pr-3 text-sm text-white placeholder:text-white/35 focus:outline-none focus:ring-2 focus:ring-white/20"
                />
              </div>
            </div>
          </div>

          {(filter !== 'All' || search || sortOrder !== 'latest') && (
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-white/10 bg-white/[0.02] px-3 py-2">
              <p className="text-xs text-white/60 font-semibold">Filters applied to call logs</p>
              <button
                onClick={clearFilters}
                className="text-xs font-black uppercase tracking-[0.12em] text-white/80 hover:text-white"
              >
                Clear all
              </button>
            </div>
          )}
        </div>

        {!!error && (
          <div className="rounded-xl border border-red-500/30 bg-red-500/8 px-4 py-3 text-sm text-red-300 font-medium">
            {error}
          </div>
        )}

        <div className="space-y-5 pb-10">
          <AnimatePresence mode="popLayout">
            {groupedLogs.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="py-16 md:py-20 text-center rounded-3xl border border-dashed border-white/15 bg-white/[0.02]"
              >
                <div className="size-16 md:size-20 bg-white/5 rounded-full flex items-center justify-center mx-auto shadow-inner">
                  <Phone className="size-7 md:size-9 text-white/20" />
                </div>
                <h3 className="mt-4 text-xl md:text-2xl font-black text-white">No call logs found</h3>
                <p className="mt-1 text-sm text-white/55">Try changing filters or search terms.</p>
              </motion.div>
            ) : (
              groupedLogs.map((group, groupIdx) => (
                <motion.div
                  key={group.key}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: groupIdx * 0.04 }}
                  className="space-y-2"
                >
                  <div className="flex items-center gap-3">
                    <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-black uppercase tracking-[0.16em] text-white/70">
                      {group.label}
                    </span>
                    <div className="h-px flex-1 bg-white/10" />
                  </div>

                  <div className="rounded-2xl border border-white/10 overflow-hidden">
                    <div className="hidden md:grid grid-cols-[minmax(0,1.8fr)_130px_130px_150px] gap-2 px-4 py-3 text-[11px] uppercase tracking-[0.18em] text-white/45 font-black bg-white/[0.03]">
                      <span>Participant</span>
                      <span>Direction</span>
                      <span>Status</span>
                      <span className="text-right">Action</span>
                    </div>
                    {group.logs.map((log) => (
                      <CallLogRow
                        key={log._id}
                        log={log}
                        isBusy={callState !== 'idle'}
                        onCall={() => onCall(log)}
                      />
                    ))}
                  </div>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>
      </section>
    </div>
  );
}

function StatCard({ value, label, color = 'white', glowColor, icon: Icon }) {
  return (
    <motion.div
      whileHover={{ y: -2 }}
      className="relative overflow-hidden rounded-xl border border-white/10 bg-white/[0.03] p-4"
      style={{ background: PANEL }}
    >
      {glowColor && (
        <div
          className="pointer-events-none absolute -right-6 -top-6 size-20 blur-[55px] opacity-25"
          style={{ background: glowColor }}
        />
      )}
      <div className="relative z-10 space-y-1">
        <div className="inline-flex rounded-lg border border-white/10 bg-black/20 p-1.5 text-white/75">
          {Icon ? <Icon className="size-4" /> : <Phone className="size-4" />}
        </div>
        <div className="text-xl md:text-3xl font-black tracking-tight" style={{ color }}>{value}</div>
        <div className="text-[10px] md:text-[11px] font-black text-white/50 uppercase tracking-[0.18em]">{label}</div>
      </div>
    </motion.div>
  );
}

function CallLogRow({ log, onCall, isBusy }) {
  const isCompleted = log.status === 'completed';
  const isIncoming = log.direction === 'incoming';
  const canCall = Boolean(log?.conversationId && log?.otherUser?.id) && !isBusy;

  let iconColor = INFO;
  if (!isCompleted) iconColor = DANGER;
  else if (isIncoming) iconColor = ACCENT;

  return (
    <div className="grid md:grid-cols-[minmax(0,1.8fr)_130px_130px_150px] gap-2 items-center px-4 py-4 border-t border-white/10 bg-white/[0.01] hover:bg-white/[0.04] transition">
      <div className="flex items-center gap-3 min-w-0">
        <div
          className="size-10 rounded-xl flex items-center justify-center border shrink-0"
          style={{ background: `${iconColor}16`, borderColor: `${iconColor}55`, color: iconColor }}
        >
          {!isCompleted ? <PhoneMissed size={16} /> : isIncoming ? <PhoneIncoming size={16} /> : <PhoneOutgoing size={16} />}
        </div>
        <div className="size-10 rounded-full overflow-hidden bg-white/10 shrink-0">
          {log?.otherUser?.avatar ? (
            <img src={log.otherUser.avatar} className="size-full object-cover" alt={log.otherUser?.name || 'User'} />
          ) : (
            <div className="size-full flex items-center justify-center text-xs font-black text-white/85 bg-gradient-to-br from-white/10 to-white/5 uppercase">
              {(log?.otherUser?.name || 'U')
                .split(' ')
                .map((n) => n[0])
                .join('')
                .slice(0, 2)}
            </div>
          )}
        </div>

        <div className="min-w-0">
          <p className="text-sm md:text-base font-bold text-white truncate">{log?.otherUser?.name || 'Unknown user'}</p>
          <p className="text-xs text-white/55 truncate">
            {log?.otherUser?.specialty || (isIncoming ? 'Incoming call' : 'Outgoing call')}
            <span className="mx-1 text-white/35">·</span>
            {new Date(log.createdAt).toLocaleString([], { hour: '2-digit', minute: '2-digit', day: '2-digit', month: 'short' })}
            {isCompleted ? <><span className="mx-1 text-white/35">·</span>{formatDuration(log.duration)}</> : null}
          </p>
        </div>
      </div>

      <div className="text-xs font-bold uppercase tracking-[0.12em] text-white/70">{log.direction}</div>

      <div>
        <span className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.13em] ${
          isCompleted
            ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/25'
            : 'bg-red-500/15 text-red-300 border border-red-500/25'
        }`}>
          {log.status}
        </span>
      </div>

      <div className="md:text-right">
        <button
          onClick={onCall}
          disabled={!canCall}
          className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-white/15 px-3 text-xs font-black uppercase tracking-[0.12em] text-white/85 bg-white/5 hover:bg-white/10 transition disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <PhoneCall size={14} />
          {isBusy ? 'Busy' : canCall ? 'Call again' : 'Unavailable'}
        </button>
      </div>
    </div>
  );
}

function formatDuration(s) {
  if (!s) return '--';
  const mins = Math.floor(s / 60);
  const secs = s % 60;
  return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
}
