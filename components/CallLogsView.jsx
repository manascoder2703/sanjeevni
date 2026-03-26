'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Phone, PhoneIncoming, PhoneOutgoing, PhoneMissed, PhoneCall, Search, PhoneOff, Trash2, CheckSquare, Square } from 'lucide-react';
import { useCall } from '@/context/CallContext';
import { useNotifications } from '@/context/NotificationContext';
import toast from 'react-hot-toast';

const ACCENT = '#18b6a2';

function initials(name = '') {
  return name.split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase();
}

function formatDuration(secs) {
  if (!secs) return '—';
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

function formatTime(dateStr) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function StatusBadge({ status }) {
  const map = {
    completed: { bg: 'rgba(24,182,162,0.1)', border: 'rgba(24,182,162,0.3)', color: '#18b6a2', label: 'Completed' },
    missed:    { bg: 'rgba(239,68,68,0.1)',  border: 'rgba(239,68,68,0.3)',  color: '#fb7185', label: 'Missed' },
    rejected:  { bg: 'rgba(239,68,68,0.1)',  border: 'rgba(239,68,68,0.3)',  color: '#fb7185', label: 'Rejected' },
    declined:  { bg: 'rgba(239,68,68,0.1)',  border: 'rgba(239,68,68,0.3)',  color: '#fb7185', label: 'Declined' },
    cancelled: { bg: 'rgba(59,130,246,0.1)', border: 'rgba(59,130,246,0.3)', color: '#60a5fa', label: 'No answer' },
  };
  const s = map[status] || map.missed;
  return (
    <span style={{ fontSize: 11, padding: '2px 10px', borderRadius: 99, background: s.bg, border: `0.5px solid ${s.border}`, color: s.color, fontWeight: 700 }}>
      {s.label}
    </span>
  );
}

function DirectionIcon({ direction, status }) {
  const isMissed = ['missed', 'rejected', 'declined'].includes(status);
  const isIn = direction === 'incoming';
  
  const bg = isMissed ? 'rgba(239,68,68,0.1)' : isIn ? 'rgba(24,182,162,0.1)' : 'rgba(59,130,246,0.1)';
  const color = isMissed ? '#fb7185' : isIn ? '#18b6a2' : '#60a5fa';
  const Icon = isMissed ? PhoneMissed : isIn ? PhoneIncoming : PhoneOutgoing;
  return (
    <div style={{ width: 36, height: 36, borderRadius: '50%', background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      <Icon size={16} color={color} />
    </div>
  );
}

const AVATARS = [
  { bg: '#0d2b1e', text: '#18b6a2' },
  { bg: '#1a1030', text: '#a78bfa' },
  { bg: '#2b1a0d', text: '#fbbf24' },
  { bg: '#0d1a2b', text: '#60a5fa' },
];

function avatar(name = '') {
  return AVATARS[name.charCodeAt(0) % AVATARS.length] || AVATARS[0];
}

function ConfirmationModal({ isOpen, onCancel, onConfirm, title, message, isDeleting }) {
  if (!isOpen) return null;
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }}>
      <div style={{ background: '#000', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 24, width: '100%', maxWidth: 440, padding: 32, boxShadow: '0 25px 60px -12px rgba(0,0,0,0.8)', textAlign: 'center' }}>
        <div style={{ 
          width: 80, height: 80, borderRadius: '50%', background: '#000', color: '#fff', 
          display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px',
          boxShadow: '0 0 20px rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.1)'
        }}>
          <Trash2 size={40} style={{ filter: 'drop-shadow(0 0 8px rgba(255,255,255,0.4))' }} />
        </div>
        <h2 style={{ color: '#fff', fontSize: 24, fontWeight: 800, margin: '0 0 12px' }}>{title}</h2>
        <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 16, lineHeight: 1.6, margin: '0 0 32px' }}>
          {message}
          <br />
          <strong style={{ color: '#ef4444' }}>This action cannot be undone.</strong>
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <button 
            onClick={onCancel}
            disabled={isDeleting}
            style={{ 
              padding: '14px', borderRadius: 16, border: 'none', 
              background: '#fff', color: '#000', fontWeight: 800, cursor: 'pointer', transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)' 
            }}
            onMouseEnter={e => { 
                e.currentTarget.style.transform = 'scale(1.02)';
                e.currentTarget.style.boxShadow = '0 0 20px rgba(255,255,255,0.6)';
            }}
            onMouseLeave={e => { 
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.boxShadow = 'none';
            }}
          >
            Cancel
          </button>
          <button 
            onClick={onConfirm}
            disabled={isDeleting}
            style={{ 
              padding: '14px', borderRadius: 16, border: 'none', 
              background: '#fff', color: '#000', fontWeight: 800, cursor: 'pointer', transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)' 
            }}
            onMouseEnter={e => { 
              e.currentTarget.style.transform = 'scale(1.02)';
              e.currentTarget.style.boxShadow = '0 0 20px rgba(255,255,255,0.6)';
            }}
            onMouseLeave={e => { 
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            {isDeleting ? 'Deleting...' : 'Delete permanently'}
          </button>
        </div>
      </div>
    </div>
  );
}

const TABS = ['All', 'Incoming', 'Outgoing', 'Missed'];

export default function CallLogsView({ role }) {
  const { initiateCall, callState } = useCall();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [isDeleting, setIsDeleting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isAllDeletion, setIsAllDeletion] = useState(false);
  const { doctorPresence } = useNotifications();

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/calls', { credentials: 'include', cache: 'no-store' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to fetch');
      setLogs(Array.isArray(data) ? data : []);
    } catch (err) {
      toast.error(err.message || 'Failed to load call logs');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { 
    fetchLogs(); 
  }, [fetchLogs]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return logs
      .filter(log => {
        const name = log?.otherUser?.name || '';
        const matchSearch = !q || name.toLowerCase().includes(q);
        const isMissed = ['missed', 'rejected', 'declined'].includes(log.status);
        const matchTab =
          filter === 'All' ||
          (filter === 'Incoming' && log.direction === 'incoming') ||
          (filter === 'Outgoing' && log.direction === 'outgoing') ||
          (filter === 'Missed' && isMissed);
        return matchSearch && matchTab;
      })
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [logs, search, filter]);

  const stats = useMemo(() => {
    const total = logs.length;
    const completed = logs.filter(l => l.status === 'completed').length;
    const missed = logs.filter(l => ['missed', 'rejected', 'declined'].includes(l.status)).length;
    const totalSecs = logs.reduce((acc, l) => acc + (l.duration || 0), 0);
    const totalMins = Math.round(totalSecs / 60);
    return { total, completed, missed, talkTime: totalMins > 0 ? `${totalMins}m` : '—' };
  }, [logs]);

  // Group by date
  const grouped = useMemo(() => {
    const today = new Date().toDateString();
    const yesterday = new Date(Date.now() - 86400000).toDateString();
    const map = {};
    filtered.forEach(log => {
      const d = new Date(log.createdAt);
      let label = d.toDateString() === today ? 'Today'
        : d.toDateString() === yesterday ? 'Yesterday'
        : d.toLocaleDateString([], { day: 'numeric', month: 'long' });
      if (!map[label]) map[label] = [];
      map[label].push(log);
    });
    return Object.entries(map);
  }, [filtered]);

  const onCallAgain = (log) => {
    if (callState !== 'idle') return toast.error('You are already in a call');
    if (!log?.conversationId || !log?.otherUser?.id) return toast.error('Call info unavailable');
    initiateCall(log.otherUser, log.conversationId);
  };

  const toggleSelect = (id) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filtered.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filtered.map(l => l._id)));
    }
  };

  const handleDeleteClick = (all = false) => {
    if (!all && selectedIds.size === 0) return;
    setIsAllDeletion(all);
    setShowConfirm(true);
  };

  const executeDelete = async () => {
    const all = isAllDeletion;
    setIsDeleting(true);
    try {
      const res = await fetch('/api/calls', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          all,
          ids: all ? [] : Array.from(selectedIds)
        }),
        credentials: 'include'
      });
      if (!res.ok) throw new Error('Failed to delete');
      toast.success(all ? 'Call history cleared' : 'Logs deleted');
      setSelectedIds(new Set());
      setShowConfirm(false);
      fetchLogs();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setIsDeleting(false);
    }
  };

  // Standard card object for components that need to pass it to style prop directly (will keep border but should match globals.css opacity)
  const card = {
    background: 'rgba(255,255,255,0.02)',
    border: '1px solid rgba(255,255,255,0.2)', 
    borderRadius: 16,
  };

  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 20, paddingBottom: 80 }}>

      {/* Header */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
          <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.2em', color: 'rgba(255,255,255,0.2)' }}>
            {role === 'doctor' ? 'Doctor Portal' : 'Patient Portal'}
          </div>
          {logs.length > 0 && (
            <button
              onClick={() => handleDeleteClick(true)}
              disabled={isDeleting}
              style={{
                display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px', borderRadius: 10,
                background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)',
                color: 'rgba(239,68,68,0.9)', fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s'
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.12)'; e.currentTarget.style.borderColor = 'rgba(239,68,68,0.4)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.06)'; e.currentTarget.style.borderColor = 'rgba(239,68,68,0.2)'; }}
            >
              <Trash2 size={14} />
              Clear history
            </button>
          )}
        </div>
        <h1 style={{ fontSize: 26, fontWeight: 900, color: '#fff', letterSpacing: '-0.5px', margin: 0 }}>Call logs</h1>
        <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)', marginTop: 4 }}>
          History of all audio consultations with your {role === 'doctor' ? 'patients' : 'doctors'}.
        </p>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0,1fr))', gap: 10 }}>
        {[
          { label: 'Total calls', value: stats.total, color: '#fff' },
          { label: 'Completed', value: stats.completed, color: '#18b6a2' },
          { label: 'Missed', value: stats.missed, color: '#fb7185' },
          { label: 'Total talk time', value: stats.talkTime, color: '#fff' },
        ].map(s => (
          <div key={s.label} className="neon-glass-card obsidian-card" style={{ padding: '16px 18px', borderRadius: '16px' }}>
            <div style={{ fontSize: 28, fontWeight: 900, color: s.color, lineHeight: 1 }}>{s.value}</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 5 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Controls */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: 6 }}>
          {TABS.map(tab => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              style={{
                padding: '8px 16px', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s',
                background: filter === tab ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.03)',
                border: filter === tab ? '0.5px solid rgba(255,255,255,0.3)' : '0.5px solid rgba(255,255,255,0.08)',
                color: filter === tab ? '#fff' : 'rgba(255,255,255,0.45)',
              }}
            >
              {tab}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.03)', border: '0.5px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: '8px 14px', minWidth: 200 }}>
          <Search size={14} color="rgba(255,255,255,0.3)" style={{ flexShrink: 0 }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name..."
            style={{ background: 'transparent', border: 'none', outline: 'none', color: '#fff', fontSize: 13, width: '100%' }}
          />
        </div>
      </div>

      {/* Logs */}
      {loading ? (
        <div className="neon-glass-card obsidian-card" style={{ padding: 48, textAlign: 'center', color: 'rgba(255,255,255,0.3)', fontSize: 14 }}>
          Loading call logs...
        </div>
      ) : grouped.length === 0 ? (
        <div className="neon-glass-card obsidian-card" style={{ padding: 48, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Phone size={20} color="rgba(255,255,255,0.2)" />
          </div>
          <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.3)' }}>No call logs found</div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.2)' }}>Calls will appear here after your first consultation</div>
        </div>
      ) : (
        <div className="neon-glass-card obsidian-card" style={{ overflow: 'hidden' }}>
          {grouped.map(([date, rows], gi) => (
            <div key={date}>
              <div style={{ padding: '8px 18px', background: 'rgba(255,255,255,0.015)', borderBottom: '0.5px solid rgba(255,255,255,0.06)', fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                {date}
              </div>
              {rows.map((log, i) => {
                const av = avatar(log.otherUser?.name || '');
                const isLast = i === rows.length - 1 && gi === grouped.length - 1;
                return (
                  <div
                    key={log._id}
                    style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px', borderBottom: isLast ? 'none' : '0.5px solid rgba(255,255,255,0.05)', transition: 'background 0.15s', cursor: 'default' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <div 
                      onClick={() => toggleSelect(log._id)}
                      style={{ padding: 4, cursor: 'pointer', color: selectedIds.has(log._id) ? ACCENT : 'rgba(255,255,255,0.2)', transition: 'all 0.2s' }}
                    >
                      {selectedIds.has(log._id) ? <CheckSquare size={18} /> : <Square size={18} />}
                    </div>
                    <DirectionIcon direction={log.direction} status={log.status} />

                    <div style={{ width: 40, height: 40, borderRadius: '50%', background: av.bg, color: av.text, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800, flexShrink: 0 }}>
                      {initials(log.otherUser?.name || 'U')}
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', marginBottom: 2 }}>{log.otherUser?.name || 'Unknown'}</div>
                      <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginBottom: 5 }}>
                        {log.otherUser?.specialty || 'Consultation'} · {log.direction === 'incoming' ? 'Incoming' : 'Outgoing'}
                      </div>
                      <StatusBadge status={log.status} />
                    </div>

                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginBottom: 2 }}>{formatTime(log.createdAt)}</div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#fff', marginBottom: 8 }}>{formatDuration(log.duration)}</div>
                      <button
                        onClick={() => onCallAgain(log)}
                        disabled={callState !== 'idle' || doctorPresence[log.otherUser?.id] === false}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px', borderRadius: 8,
                          border: `0.5px solid rgba(255,255,255,0.1)`, 
                          background: (callState === 'idle' && doctorPresence[log.otherUser?.id] !== false) ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.02)',
                          color: (callState === 'idle' && doctorPresence[log.otherUser?.id] !== false) ? '#fff' : 'rgba(255,255,255,0.25)', 
                          fontSize: 12, fontWeight: 700, 
                          cursor: (callState === 'idle' && doctorPresence[log.otherUser?.id] !== false) ? 'pointer' : 'not-allowed',
                          opacity: 1, transition: 'all 0.15s',
                        }}
                        onMouseEnter={e => { if (callState === 'idle' && doctorPresence[log.otherUser?.id] !== false) { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; }}}
                        onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
                      >
                        {doctorPresence[log.otherUser?.id] === false ? <><PhoneOff size={13} /> Busy</> : <><PhoneCall size={13} /> Call again</>}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      )}

      {/* Floating Selection Bar */}
      {selectedIds.size > 0 && (
        <div style={{
          position: 'fixed', bottom: 30, left: '50%', transform: 'translateX(-50%)',
          background: 'rgba(15,23,42,0.92)', backdropFilter: 'blur(12px)',
          border: '1px solid rgba(255,255,255,0.1)', padding: '12px 24px',
          borderRadius: 24, display: 'flex', alignItems: 'center', gap: 24,
          boxShadow: '0 20px 50px rgba(0,0,0,0.5)', zIndex: 100, borderBottom: `2px solid ${ACCENT}`
        }}>
          <div style={{ color: '#fff', fontSize: 14, fontWeight: 600 }}>
            {selectedIds.size} selected
          </div>
          <div style={{ height: 20, width: 1, background: 'rgba(255,255,255,0.2)' }} />
          <div style={{ display: 'flex', gap: 12 }}>
            <button
              onClick={() => setSelectedIds(new Set())}
              style={{ background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.5)', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
            >
              Cancel
            </button>
            <button
              onClick={() => handleDeleteClick(false)}
              disabled={isDeleting}
              style={{
                background: 'rgba(239,68,68,0.9)', color: '#fff', border: 'none',
                padding: '8px 18px', borderRadius: 12, fontSize: 13, fontWeight: 700,
                display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', boxShadow: '0 4px 12px rgba(239,68,68,0.2)'
              }}
            >
              <Trash2 size={14} />
              Delete items
            </button>
          </div>
        </div>
      )}

      <ConfirmationModal
        isOpen={showConfirm}
        isDeleting={isDeleting}
        onCancel={() => setShowConfirm(false)}
        onConfirm={executeDelete}
        title={isAllDeletion ? 'Clear call history?' : 'Delete selected logs?'}
        message={isAllDeletion 
          ? 'This will permanently remove all call logs from your view.' 
          : `This will permanently remove ${selectedIds.size} selected call logs from your view.`}
      />
    </div>
  );
}