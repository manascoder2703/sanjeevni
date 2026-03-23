'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useNotifications } from '@/context/NotificationContext';
import toast from 'react-hot-toast';
import { useCall } from '@/context/CallContext';
import {
  CalendarPlus,
  FileText,
  Paperclip,
  Phone,
  PhoneCall,
  Search,
  Send,
  ShieldAlert,
  TestTubeDiagonal,
  Trash2,
  UserRound,
  X,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

const ACCENT = '#18b6a2';
const SHELL_BG = '#06090f';
const LEFT_BG = '#0b1017';

const QUICK_ACTIONS = [
  { key: 'follow-up', label: 'Book follow-up', icon: CalendarPlus, text: 'Let us plan a follow-up consultation to review your progress and symptoms.' },
  { key: 'prescription', label: 'Send prescription', icon: FileText, text: 'I am sharing your prescription details. Please follow the dosage instructions carefully.' },
  { key: 'tests', label: 'Request test report', icon: TestTubeDiagonal, text: 'Please share your latest test reports so I can review them and guide you further.' },
];

const AVATARS = [
  { bg: '#dbf3ed', text: '#0f766e' },
  { bg: '#e7eefb', text: '#1d4ed8' },
  { bg: '#f7ead6', text: '#a16207' },
  { bg: '#efe8fb', text: '#7c3aed' },
];

function initials(name = '') {
  return name.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase();
}

function avatarTone(name = '') {
  return AVATARS[name.charCodeAt(0) % AVATARS.length] || AVATARS[0];
}

function shortTime(value) {
  if (!value) return '';
  const date = new Date(value);
  const now = new Date();
  const yesterday = new Date();
  yesterday.setDate(now.getDate() - 1);
  if (date.toDateString() === now.toDateString()) return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

function messageTime(value) {
  if (!value) return '';
  return new Date(value).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

function dayLabel(value) {
  if (!value) return '';
  const date = new Date(value);
  const now = new Date();
  if (date.toDateString() === now.toDateString()) {
    return `Today, ${date.toLocaleDateString([], { month: 'long', day: 'numeric' })}`;
  }
  return date.toLocaleDateString([], { month: 'long', day: 'numeric' });
}

function addMessageIfMissing(messages = [], nextMessage) {
  if (!nextMessage?._id) return messages;
  if (messages.some((m) => m._id === nextMessage._id)) return messages;
  const tempIndex = messages.findIndex(
    (m) => String(m._id).startsWith('temp_') && m.text === nextMessage.text && m.mine
  );
  if (tempIndex !== -1) {
    const updated = [...messages];
    updated[tempIndex] = nextMessage;
    return updated;
  }
  return [...messages, nextMessage];
}

export default function PortalChatWorkspace({ viewerRole }) {
  const { user } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [conversationLoading, setConversationLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState('active');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [typingUser, setTypingUser] = useState('');
  const [presence, setPresence] = useState({});
  const [showProfile, setShowProfile] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const { socket } = useNotifications();
  const { initiateCall, callState } = useCall();
  const selectedRef = useRef(null);
  const typingTimerRef = useRef(null);
  const endRef = useRef(null);
  const conversationLoadedRef = useRef(false);

  const allLabel = viewerRole === 'doctor' ? 'All patients' : 'All doctors';
  const searchLabel = viewerRole === 'doctor' ? 'Search patients...' : 'Search doctors...';
  const selfLabel = viewerRole === 'doctor' ? 'Doctor Portal' : 'Patient Portal';

  // ─── Sidebar only — never touches open conversation ──────────────────────────
  const fetchConversations = useCallback(async () => {
    try {
      const res = await fetch('/api/chat/conversations', { credentials: 'include', cache: 'no-store' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load chats');
      const next = (data.conversations || []).filter((c) =>
        c.counterpart?.role === (viewerRole === 'doctor' ? 'patient' : 'doctor')
      );
      setConversations(next);
      setPresence((current) => {
        const merged = { ...current };
        next.forEach((c) => {
          if (typeof merged[c.counterpart.id] === 'undefined') {
            merged[c.counterpart.id] = !!c.counterpart.initialOnline;
          }
        });
        return merged;
      });
      setSelectedId((current) => {
        if (current && next.some((item) => item._id === current)) return current;
        if (current && !next.some((item) => item._id === current)) return null;
         return null;
      });
    } catch (error) {
      toast.error(error.message || 'Failed to load chats');
    } finally {
      setLoading(false);
    }
  }, [viewerRole]);

  // ─── Load conversation — only on explicit user selection ─────────────────────
  const openConversation = useCallback(async (conversationId, shouldMarkRead = true) => {
    if (!conversationId) {
      setSelectedConversation(null);
      conversationLoadedRef.current = false;
      return;
    }
    if (!shouldMarkRead && conversationLoadedRef.current) return;

    setConversationLoading(true);
    conversationLoadedRef.current = false;

    try {
      const res = await fetch(`/api/chat/conversations/${conversationId}`, { credentials: 'include', cache: 'no-store' });
      const data = await res.json();
      if (res.status === 404) {
        setSelectedConversation(null);
        setSelectedId(null);
        fetchConversations();
        return;
      }
      if (!res.ok) throw new Error(data.error || 'Failed to load chat');
      let conversation = data.conversation;

      if (shouldMarkRead && conversation.unreadCount > 0) {
        const readRes = await fetch(`/api/chat/conversations/${conversationId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ markRead: true }),
        });
        const readData = await readRes.json();
        if (readRes.ok && readData.conversation) conversation = readData.conversation;
        fetchConversations();
      }

      setSelectedConversation(conversation);
      conversationLoadedRef.current = true;
    } catch (error) {
      if (error.message !== 'Conversation not found') {
        toast.error(error.message || 'Failed to open chat');
      }
    } finally {
      setConversationLoading(false);
    }
  }, [fetchConversations]);

  useEffect(() => { fetchConversations(); }, [fetchConversations]);

  useEffect(() => {
    const id = setInterval(fetchConversations, 20000);
    return () => clearInterval(id);
  }, [fetchConversations]);

  useEffect(() => { selectedRef.current = selectedId; }, [selectedId]);

  useEffect(() => {
    conversationLoadedRef.current = false;
    openConversation(selectedId, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId]);

  // ─── Socket ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!socket) return;

    if (user?.id) socket.emit('identify', { userId: user.id });
    if (selectedRef.current) socket.emit('chat:join', { conversationId: selectedRef.current });

    const handlePresenceSnapshot = ({ presence: snapshot = {} }) => {
      setPresence((current) => ({ ...current, ...snapshot }));
    };

    const handlePresenceChanged = ({ userId, isOnline }) => {
      setPresence((current) => ({ ...current, [userId]: isOnline }));
    };

    const handleConversationUpdated = ({ conversationId } = {}) => {
      fetchConversations();
      if (conversationId && conversationId === selectedRef.current) {
        setTimeout(() => {
          setSelectedId((current) => {
            if (current !== conversationId) return current;
            setSelectedConversation(null);
            return null;
          });
        }, 500);
      }
    };

    const handleChatMessage = ({ conversationId, message: nextMessage }) => {
      if (conversationId !== selectedRef.current) return;
      setSelectedConversation((current) => {
        if (!current) return current;
        return {
          ...current,
          messages: addMessageIfMissing(current.messages, {
            ...nextMessage,
            mine: String(nextMessage.senderId) === String(user?.id),
          }),
        };
      });
    };

    const handleChatTyping = ({ conversationId, userId, userName, isTyping }) => {
      if (conversationId !== selectedRef.current || String(userId) === String(user?.id)) return;
      setTypingUser(isTyping ? userName : '');
    };

    const handleChatRead = ({ conversationId, messageIds = [], readByUserId }) => {
      if (conversationId !== selectedRef.current || String(readByUserId) === String(user?.id)) return;
      setSelectedConversation((current) => current ? {
        ...current,
        messages: current.messages.map((entry) =>
          messageIds.includes(entry._id) ? { ...entry, readAt: new Date().toISOString() } : entry
        ),
      } : current);
    };

    socket.on('presence:snapshot', handlePresenceSnapshot);
    socket.on('presence:changed', handlePresenceChanged);
    socket.on('chat:conversation-updated', handleConversationUpdated);
    socket.on('chat:message', handleChatMessage);
    socket.on('chat:typing', handleChatTyping);
    socket.on('chat:read', handleChatRead);

    return () => {
      if (selectedRef.current) socket.emit('chat:leave', { conversationId: selectedRef.current });
      socket.off('presence:snapshot', handlePresenceSnapshot);
      socket.off('presence:changed', handlePresenceChanged);
      socket.off('chat:conversation-updated', handleConversationUpdated);
      socket.off('chat:message', handleChatMessage);
      socket.off('chat:typing', handleChatTyping);
      socket.off('chat:read', handleChatRead);
    };
  }, [fetchConversations, user?.id, socket]);

  useEffect(() => {
    if (!socket || !selectedId) return undefined;
    socket.emit('chat:join', { conversationId: selectedId });
    return () => socket?.emit('chat:leave', { conversationId: selectedId });
  }, [selectedId, socket]);

  const watchedIds = useMemo(() => conversations.map((c) => c.counterpart.id).filter(Boolean), [conversations]);
  useEffect(() => {
    if (!socket || watchedIds.length === 0) return;
    socket.emit('presence:query', { userIds: watchedIds });
  }, [watchedIds, socket]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [selectedConversation?.messages, typingUser]);

  // ─── Tab filtering ───────────────────────────────────────────────────────────
  const filteredConversations = useMemo(() => {
    const query = search.trim().toLowerCase();
    return conversations.filter((c) => {
      const isOnline = presence[c.counterpart.id] ?? c.counterpart.initialOnline;
      const isConfirmed = c.latestAppointmentStatus === 'confirmed';

      if (viewerRole === 'doctor') {
        if (tab === 'active' && (!isConfirmed || !isOnline)) return false;
        if (tab === 'all' && !isConfirmed) return false;
      }

      if (viewerRole === 'patient') {
        if (tab === 'active' && !isOnline) return false;
        // tab === 'all' → backend already returns approved doctors only
      }

      if (!query) return true;
      return (
        c.counterpart.name.toLowerCase().includes(query) ||
        c.lastMessageText.toLowerCase().includes(query)
      );
    });
  }, [conversations, search, tab, presence, viewerRole]);

  const activeCount = useMemo(() => {
    return conversations.filter((c) => {
      const isOnline = presence[c.counterpart.id] ?? c.counterpart.initialOnline;
      const isConfirmed = c.latestAppointmentStatus === 'confirmed';
      if (viewerRole === 'doctor') return isConfirmed && isOnline;
      return isOnline;
    }).length;
  }, [conversations, presence, viewerRole]);

  const allCount = useMemo(() => {
    if (viewerRole === 'patient') return conversations.length;
    return conversations.filter((c) => c.latestAppointmentStatus === 'confirmed').length;
  }, [conversations, viewerRole]);

  const selectedOnline = selectedConversation
    ? (presence[selectedConversation.counterpart.id] ?? selectedConversation.counterpart.initialOnline)
    : false;

  const emitTyping = useCallback((isTyping) => {
    if (!socket || !selectedId || !user?.id) return;
    socket.emit('chat:typing', {
      conversationId: selectedId,
      userId: user.id,
      userName: user.name,
      isTyping,
    });
  }, [selectedId, user?.id, user?.name, socket]);

  const onChangeMessage = (event) => {
    const value = event.target.value;
    setMessage(value);
    if (!selectedId) return;
    emitTyping(!!value.trim());
    clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(() => emitTyping(false), 1200);
  };

  const sendMessage = useCallback(async (overrideText, kind = 'text') => {
    const text = (typeof overrideText === 'string' ? overrideText : message).trim();
    if (!text || !selectedId) return;

    setSending(true);
    setMessage('');
    clearTimeout(typingTimerRef.current);
    emitTyping(false);

    const tempId = `temp_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    const optimisticMessage = {
      _id: tempId,
      text,
      kind,
      mine: true,
      senderId: String(user?.id),
      senderRole: viewerRole,
      createdAt: new Date().toISOString(),
      deliveredAt: new Date().toISOString(),
      readAt: null,
      _optimistic: true,
    };

    setSelectedConversation((current) => current
      ? { ...current, messages: [...current.messages, optimisticMessage] }
      : current
    );

    try {
      const res = await fetch(`/api/chat/conversations/${selectedId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ text, kind }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to send message');

      setSelectedConversation((current) => {
        if (!current) return current;
        return {
          ...current,
          messages: current.messages.map((m) =>
            m._id === tempId ? { ...data.message, mine: true } : m
          ),
        };
      });

      fetchConversations();
    } catch (error) {
      setSelectedConversation((current) => {
        if (!current) return current;
        return { ...current, messages: current.messages.filter((m) => m._id !== tempId) };
      });
      setMessage(text);
      toast.error(error.message || 'Failed to send message');
    } finally {
      setSending(false);
    }
  }, [emitTyping, fetchConversations, message, selectedId, user?.id, viewerRole]);

  const toggleUrgent = async () => {
    if (viewerRole !== 'doctor' || !selectedConversation) return;
    const res = await fetch(`/api/chat/conversations/${selectedConversation._id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ urgent: !selectedConversation.urgent }),
    });
    const data = await res.json();
    if (!res.ok) return toast.error(data.error || 'Failed to update urgency');
    setSelectedConversation((current) => current
      ? { ...current, urgent: data.conversation.urgent }
      : current
    );
    fetchConversations();
  };

  // ─── Delete conversation ──────────────────────────────────────────────────────
  // Clears all messages but keeps the document so syncPortalConversationsForUser
  // can repopulate it when a new confirmed appointment is booked in the future.
  const deleteConversation = async () => {
    if (!selectedConversation) return;
    const deletedId = selectedConversation._id;
    setDeleting(true);
    try {
      const res = await fetch(`/api/chat/conversations/${deletedId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete');

      // Immediately remove from sidebar state so it vanishes without
      // waiting for fetchConversations to complete a round trip.
      setConversations((current) => current.filter((c) => c._id !== deletedId));
      setSelectedConversation(null);
      setSelectedId(null);
      setConfirmDelete(false);
      fetchConversations();
      toast.success('Conversation deleted');
    } catch (error) {
      toast.error(error.message || 'Failed to delete conversation');
    } finally {
      setDeleting(false);
    }
  };

  const entries = useMemo(() => {
    const items = [];
    let currentDivider = '';
    (selectedConversation?.messages || []).forEach((entry) => {
      const divider = dayLabel(entry.createdAt);
      if (divider !== currentDivider) {
        currentDivider = divider;
        items.push({ type: 'divider', id: divider, label: divider });
      }
      items.push({ type: 'message', id: entry._id, message: entry });
    });
    return items;
  }, [selectedConversation?.messages]);

  const emptyStateMessage = useMemo(() => {
    if (viewerRole === 'doctor') {
      if (tab === 'active') return 'No patients are currently online. They will appear here when they come online.';
      return 'No confirmed patients yet. Patients will appear here once their appointment is confirmed.';
    }
    if (tab === 'active') return 'No doctors are currently online. They will appear here when they log in.';
    return 'No approved doctors available yet. Check back soon.';
  }, [tab, viewerRole]);

  const selfTone = avatarTone(user?.name || 'S');
  const otherTone = avatarTone(selectedConversation?.counterpart.name || 'A');
  // Doctor portal: only confirmed patients appear, so messaging is never locked for doctors.
  // Patient portal: locked until appointment is confirmed.
  const isMessagingLocked = viewerRole === 'doctor' ? false : selectedConversation?.deletedByDoctor === true || selectedConversation?.latestAppointmentStatus !== 'confirmed';

  return (
    <div style={{ width: '100%', height: '100%', minHeight: '100%', alignSelf: 'stretch' }}>
      <style>{`
        .chat-workspace { height:100%; min-height:0; width:100%; display:flex; }
        .chat-shell { display:grid; grid-template-columns:minmax(380px,500px) minmax(0,1fr); min-height:100%; height:100%; width:100%; overflow:hidden; background:linear-gradient(180deg,rgba(7,10,16,0.98),rgba(5,8,13,0.99)); }
        .chat-scroll { scroll-behavior: smooth; }
        .chat-scroll::-webkit-scrollbar { width:8px; }
        .chat-scroll::-webkit-scrollbar-thumb { background:rgba(255,255,255,0.12); border-radius:999px; }
        .chat-tab { flex:1; padding:18px 20px; border:none; background:transparent; color:rgba(255,255,255,0.72); font-size:16px; border-bottom:3px solid transparent; cursor:pointer; }
        .chat-tab.active { color:${ACCENT}; border-bottom-color:${ACCENT}; }
        .chat-row { transition:all 0.2s ease; }
        .chat-row:hover { background:rgba(255,255,255,0.06); transform:translateX(2px); }
        .chat-row.selected { background:linear-gradient(90deg,rgba(24,182,162,0.15),rgba(59,130,246,0.05)); border-left:4px solid ${ACCENT} !important; }
        .chat-chip { transition:all 0.2s ease; }
        .chat-chip:hover:not(:disabled) { transform:translateY(-2px); box-shadow:0 4px 12px rgba(0,0,0,0.2); }
        .profile-btn:hover { background:rgba(255,255,255,0.08) !important; color:white !important; border-color:rgba(255,255,255,0.2) !important; }
        .delete-btn:hover { background:rgba(239,68,68,0.14) !important; color:rgba(239,68,68,1) !important; border-color:rgba(239,68,68,0.5) !important; }
        .action-btn:hover:not(:disabled) { background:rgba(255,255,255,0.08) !important; color:white !important; }
        .close-btn:hover { background:rgba(255,255,255,0.1) !important; transform:rotate(90deg); }
        .msg-optimistic { opacity:0.75; }
        @media (max-width:1100px) { .chat-shell { grid-template-columns:1fr; } .chat-left { border-right:none !important; border-bottom:1px solid rgba(255,255,255,0.12); max-height:42vh; } }
      `}</style>

      <div className="chat-workspace">
        <div className="chat-shell">

          {/* ── LEFT SIDEBAR ─────────────────────────────────────────────── */}
          <aside className="chat-left" style={{ background: 'linear-gradient(180deg,rgba(10,14,21,0.98),rgba(8,11,18,0.98))', borderRight: '1px solid rgba(255,255,255,0.08)', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '28px 28px 18px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <div style={{ width: 72, height: 72, borderRadius: '50%', background: selfTone.bg, color: selfTone.text, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, fontWeight: 800 }}>{initials(user?.name || 'S')}</div>
                  <div>
                    <h2 style={{ margin: 0, color: 'white', fontSize: 24, fontWeight: 800 }}>{user?.name || 'Sanjeevni User'}</h2>
                    <p style={{ margin: '4px 0 0', color: 'rgba(255,255,255,0.72)', fontSize: 18 }}>{selfLabel}</p>
                  </div>
                </div>
                <span style={{ width: 18, height: 18, borderRadius: '50%', background: ACCENT }} />
              </div>
              <div style={{ marginTop: 22, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12, borderRadius: 18, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.025)' }}>
                <Search size={22} color="rgba(255,255,255,0.56)" />
                <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={searchLabel} style={{ width: '100%', border: 'none', outline: 'none', background: 'transparent', color: 'white', fontSize: 18 }} />
              </div>
            </div>

            <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
              <button type="button" className={`chat-tab ${tab === 'active' ? 'active' : ''}`} onClick={() => setTab('active')}>
                Active {activeCount > 0 ? `(${activeCount})` : ''}
              </button>
              <button type="button" className={`chat-tab ${tab === 'all' ? 'active' : ''}`} onClick={() => setTab('all')}>
                {allLabel} {allCount > 0 ? `(${allCount})` : ''}
              </button>
            </div>

            <div className="chat-scroll" style={{ overflowY: 'auto', flex: 1 }}>
              {loading ? (
                <div style={{ padding: 28, color: 'rgba(255,255,255,0.56)' }}>Loading chats...</div>
              ) : filteredConversations.length === 0 ? (
                <div style={{ padding: 28, color: 'rgba(255,255,255,0.56)', lineHeight: 1.7, fontSize: 15 }}>{emptyStateMessage}</div>
              ) : filteredConversations.map((c) => {
                const tone = avatarTone(c.counterpart.name);
                const online = presence[c.counterpart.id] ?? c.counterpart.initialOnline;
                return (
                  <button
                    key={c._id}
                    type="button"
                    className={`chat-row ${c._id === selectedId ? 'selected' : ''}`}
                    onClick={() => { setSelectedId(c._id); setShowProfile(false); setConfirmDelete(false); }}
                    style={{ width: '100%', padding: '22px 26px', display: 'flex', gap: 16, border: 'none', borderBottom: '1px solid rgba(255,255,255,0.08)', background: 'transparent', cursor: 'pointer', textAlign: 'left' }}
                  >
                    <div style={{ position: 'relative', flexShrink: 0 }}>
                      <div style={{ width: 66, height: 66, borderRadius: '50%', background: tone.bg, color: tone.text, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 800 }}>{initials(c.counterpart.name)}</div>
                      <span style={{ position: 'absolute', right: 2, bottom: 2, width: 14, height: 14, borderRadius: '50%', background: online ? ACCENT : 'rgba(255,255,255,0.24)', border: `2px solid ${LEFT_BG}` }} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                        <div style={{ minWidth: 0 }}>
                          <h3 style={{ margin: 0, color: 'white', fontSize: 19, fontWeight: 800 }}>{c.counterpart.name}</h3>
                          <p style={{ margin: '4px 0 0', color: 'rgba(255,255,255,0.62)', fontSize: 16, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.lastMessageText}</p>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                          <span style={{ color: 'rgba(255,255,255,0.56)', fontSize: 16 }}>{shortTime(c.lastMessageAt)}</span>
                          {c.unreadCount > 0 && (
                            <span style={{ minWidth: 34, height: 34, borderRadius: 17, padding: '0 10px', background: ACCENT, color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800 }}>{c.unreadCount}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </aside>

          {/* ── MAIN CHAT AREA ───────────────────────────────────────────── */}
          <section style={{ background: 'linear-gradient(180deg,rgba(7,10,16,0.96),rgba(5,8,12,0.99))', display: 'flex', flexDirection: 'column', minWidth: 0, position: 'relative' }}>
            <div style={{ position: 'absolute', inset: '0 0 auto 0', height: 220, background: 'radial-gradient(circle at top left,rgba(24,182,162,0.12),transparent 42%),radial-gradient(circle at top right,rgba(59,130,246,0.08),transparent 36%)', pointerEvents: 'none' }} />

            {selectedConversation ? (
              <>
                {/* Header */}
                <header style={{ padding: '20px 28px', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 18, flexWrap: 'wrap', background: 'rgba(255,255,255,0.015)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16, minWidth: 0 }}>
                    <div style={{ position: 'relative' }}>
                      <div style={{ width: 60, height: 60, borderRadius: '50%', background: otherTone.bg, color: otherTone.text, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 22 }}>{initials(selectedConversation.counterpart.name)}</div>
                      <span style={{ position: 'absolute', right: 1, bottom: 1, width: 14, height: 14, borderRadius: '50%', background: selectedOnline ? ACCENT : 'rgba(255,255,255,0.24)', border: `2px solid ${SHELL_BG}` }} />
                    </div>
                    <div>
                      <h2 style={{ margin: 0, color: 'white', fontSize: 22, fontWeight: 800 }}>{selectedConversation.counterpart.name}</h2>
                      <p style={{ margin: '4px 0 0', color: selectedOnline ? ACCENT : 'rgba(255,255,255,0.56)', fontSize: 16 }}>
                        {selectedOnline ? 'Online' : 'Offline'}
                        {viewerRole === 'doctor'
                          ? ` · Patient #${selectedConversation.counterpart.referenceCode || '10482'}`
                          : ` · ${selectedConversation.counterpart.specialization || 'Doctor'}`}
                      </p>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                    {selectedConversation.urgent && (
                      <span style={{ padding: '10px 16px', borderRadius: 999, background: 'rgba(255,234,234,0.96)', color: '#b63636', fontWeight: 700, fontSize: 16 }}>Urgent</span>
                    )}
                    {selectedConversation.latestAppointmentStatus === 'confirmed' && selectedConversation.latestRoomId ? (
                      <button 
                        type="button" 
                        onClick={() => initiateCall({ id: selectedConversation.counterpart.id, name: selectedConversation.counterpart.name }, selectedConversation.latestRoomId)} 
                        className="action-btn" 
                        disabled={callState !== 'idle'}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: 10, padding: '14px 18px', borderRadius: 18, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.02)', color: 'rgba(255,255,255,0.88)', fontSize: 16, cursor: 'pointer' }}
                      >
                        <PhoneCall size={20} />Call
                      </button>
                    ) : (
                      <button type="button" disabled style={{ display: 'inline-flex', alignItems: 'center', gap: 10, padding: '14px 18px', borderRadius: 18, border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.02)', color: 'rgba(255,255,255,0.34)', fontSize: 16 }}><PhoneCall size={20} />Call</button>
                    )}
                    <button
                      type="button"
                      onClick={() => setShowProfile(true)}
                      className="profile-btn"
                      style={{ display: 'inline-flex', alignItems: 'center', gap: 10, padding: '14px 18px', borderRadius: 18, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.02)', color: 'rgba(255,255,255,0.88)', fontSize: 16, cursor: 'pointer', transition: 'all 0.2s ease' }}
                    >
                      <UserRound size={20} />Profile
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmDelete(true)}
                      className="delete-btn"
                      style={{ display: 'inline-flex', alignItems: 'center', gap: 10, padding: '14px 18px', borderRadius: 18, border: '1px solid rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.06)', color: 'rgba(239,68,68,0.85)', fontSize: 16, cursor: 'pointer', transition: 'all 0.2s ease' }}
                    >
                      <Trash2 size={20} />Delete
                    </button>
                  </div>
                </header>

                {/* Messages */}
                <div className="chat-scroll" style={{ flex: 1, overflowY: 'auto', padding: '28px 28px 12px', background: 'radial-gradient(circle at top left,rgba(24,182,162,0.08),transparent 26%),radial-gradient(circle at bottom right,rgba(59,130,246,0.08),transparent 24%)' }}>
                  {conversationLoading ? (
                    <div style={{ color: 'rgba(255,255,255,0.6)' }}>Loading messages...</div>
                  ) : entries.length === 0 ? (
                    <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 16, textAlign: 'center', marginTop: 60 }}>No messages yet. Say hello!</div>
                  ) : entries.map((entry) =>
                    entry.type === 'divider' ? (
                      <div key={entry.id} style={{ display: 'flex', alignItems: 'center', gap: 18, margin: '10px 0 26px' }}>
                        <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.14)' }} />
                        <span style={{ color: 'rgba(255,255,255,0.68)', fontSize: 14, fontWeight: 600 }}>{entry.label}</span>
                        <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.14)' }} />
                      </div>
                    ) : (
                      <div key={entry.id} style={{ marginBottom: 18 }}>
                        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 14, justifyContent: entry.message.mine ? 'flex-end' : 'flex-start' }}>
                          {!entry.message.mine && (
                            <div style={{ width: 54, height: 54, borderRadius: '50%', background: otherTone.bg, color: otherTone.text, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 800 }}>
                              {initials(selectedConversation.counterpart.name)}
                            </div>
                          )}
                          <div style={{ maxWidth: '72%' }} className={entry.message._optimistic ? 'msg-optimistic' : ''}>
                            {entry.message.kind === 'call' ? (
                              <div style={{ padding: '12px 20px', borderRadius: 22, background: 'rgba(255,255,255,0.03)', color: 'rgba(255,255,255,0.7)', fontSize: 16, border: '1px dashed rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', gap: 12, fontStyle: 'italic' }}>
                                <Phone size={18} style={{ color: ACCENT }} />
                                {entry.message.text}
                              </div>
                            ) : (
                              <div style={{ padding: '18px 22px', borderRadius: 22, background: entry.message.mine ? ACCENT : 'rgba(255,255,255,0.06)', color: 'white', fontSize: 18, lineHeight: 1.6, border: `1px solid ${entry.message.mine ? ACCENT : 'rgba(255,255,255,0.08)'}`, boxShadow: entry.message.mine ? '0 16px 36px rgba(24,182,162,0.16)' : 'none' }}>
                                {entry.message.text}
                              </div>
                            )}
                            <div style={{ marginTop: 8, display: 'flex', justifyContent: entry.message.mine ? 'flex-end' : 'flex-start', gap: 6, color: 'rgba(255,255,255,0.56)', fontSize: 14 }}>
                              <span>{messageTime(entry.message.createdAt)}</span>
                              {entry.message.mine && (
                                <span>· {entry.message._optimistic ? 'Sending…' : entry.message.readAt ? 'Read' : 'Delivered'}</span>
                              )}
                            </div>
                          </div>
                          {entry.message.mine && (
                            <div style={{ width: 54, height: 54, borderRadius: '50%', background: ACCENT, color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 800 }}>
                              {initials(user?.name || 'S')}
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  )}
                  {typingUser && (
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
                      <div style={{ padding: '14px 18px', borderRadius: 18, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.03)', display: 'inline-flex', gap: 10 }}>
                        {[0, 1, 2].map((dot) => <span key={dot} style={{ width: 12, height: 12, borderRadius: '50%', background: ACCENT }} />)}
                      </div>
                    </div>
                  )}
                  <div ref={endRef} />
                </div>

                {/* Input */}
                <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', padding: '16px 28px 26px', background: 'rgba(255,255,255,0.015)' }}>
                  {viewerRole === 'doctor' && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 18 }}>
                      {QUICK_ACTIONS.map((action) => (
                        <button
                          key={action.key}
                          type="button"
                          className="chat-chip"
                          onClick={() => sendMessage(action.text, 'quick-action')}
                          disabled={isMessagingLocked}
                          style={{ display: 'inline-flex', alignItems: 'center', gap: 10, padding: '12px 20px', borderRadius: 999, border: '1px solid rgba(203,255,244,0.42)', background: '#dff8ef', color: '#0f766e', fontSize: 15, cursor: isMessagingLocked ? 'not-allowed' : 'pointer', opacity: isMessagingLocked ? 0.45 : 1 }}
                        >
                          <action.icon size={18} />{action.label}
                        </button>
                      ))}
                      <button
                        type="button"
                        className="chat-chip"
                        onClick={toggleUrgent}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: 10, padding: '12px 20px', borderRadius: 999, border: '1px solid rgba(243,186,82,0.8)', background: selectedConversation.urgent ? 'rgba(243,186,82,0.16)' : '#fff4df', color: '#a16207', fontSize: 15, cursor: 'pointer' }}
                      >
                        <ShieldAlert size={18} />
                        {selectedConversation.urgent ? 'Remove urgent' : 'Mark as urgent'}
                      </button>
                    </div>
                  )}

                  <form onSubmit={(e) => { e.preventDefault(); sendMessage(); }} style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <button type="button" style={{ width: 68, height: 64, borderRadius: 18, border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.02)', color: 'rgba(255,255,255,0.56)' }}>
                      <Paperclip size={24} style={{ margin: '0 auto' }} />
                    </button>
                    <input
                      value={message}
                      onChange={onChangeMessage}
                      disabled={isMessagingLocked}
                      placeholder={selectedConversation?.deletedByDoctor ? 'Book a new appointment to start chatting again…' : isMessagingLocked ? 'Available once appointment is confirmed…' : `Type a message to ${selectedConversation.counterpart.name.split(' ')[0]}...`}
                      style={{ flex: 1, height: 64, borderRadius: 20, border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.02)', color: 'white', fontSize: 18, padding: '0 24px', outline: 'none', opacity: isMessagingLocked ? 0.45 : 1, cursor: isMessagingLocked ? 'not-allowed' : 'text' }}
                    />
                    <button
                      type="submit"
                      disabled={sending || !message.trim() || isMessagingLocked}
                      style={{ width: 64, height: 64, borderRadius: '50%', border: 'none', background: ACCENT, color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: isMessagingLocked ? 'not-allowed' : 'pointer', opacity: isMessagingLocked ? 0.4 : 1 }}
                    >
                      <Send size={24} />
                    </button>
                  </form>
                </div>
              </>
            ) : (
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.56)', fontSize: 18 }}>
                Select a conversation to start chatting.
              </div>
            )}
          </section>
        </div>
      </div>

      {/* ── PROFILE MODAL ──────────────────────────────────────────────────── */}
      {showProfile && selectedConversation && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div style={{ width: 'min(520px,100%)', borderRadius: 32, background: 'linear-gradient(180deg,#0d1117,#080b0f)', border: '1px solid rgba(255,255,255,0.1)', padding: '40px 32px', boxShadow: '0 32px 64px rgba(0,0,0,0.6)', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', inset: '0 0 auto 0', height: 160, background: 'radial-gradient(circle at top left,rgba(24,182,162,0.15),transparent 70%)', pointerEvents: 'none' }} />
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, position: 'relative', zIndex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                <div style={{ width: 84, height: 84, borderRadius: '50%', background: otherTone.bg, color: otherTone.text, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, fontWeight: 800, border: '4px solid rgba(255,255,255,0.05)' }}>{initials(selectedConversation.counterpart.name)}</div>
                <div>
                  <h3 style={{ margin: 0, color: 'white', fontSize: 28, fontWeight: 900, letterSpacing: '-0.5px' }}>{selectedConversation.counterpart.name}</h3>
                  <p style={{ margin: '8px 0 0', color: ACCENT, fontSize: 17, fontWeight: 700 }}>
                    {viewerRole === 'doctor' ? `Patient #${selectedConversation.counterpart.referenceCode || '13496'}` : selectedConversation.counterpart.specialization || 'Doctor'}
                  </p>
                </div>
              </div>
              <button type="button" onClick={() => setShowProfile(false)} className="close-btn" style={{ width: 48, height: 48, borderRadius: '50%', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.06)', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s ease' }}><X size={22} /></button>
            </div>
            <div style={{ display: 'grid', gap: 18, marginTop: 40, position: 'relative', zIndex: 1 }}>
              {[
                { label: 'Primary Email', value: selectedConversation.counterpart.email },
                { label: 'Contact Number', value: selectedConversation.counterpart.phone },
                { label: 'Appointment Status', value: selectedConversation.latestAppointmentStatus },
              ].map(({ label, value }) => (
                <div key={label} style={{ padding: '20px 24px', borderRadius: 20, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 14, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>{label}</div>
                  <div style={{ color: 'white', fontSize: 18, fontWeight: 600 }}>{value || 'Not provided'}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── DELETE CONFIRMATION MODAL ───────────────────────────────────────── */}
      {confirmDelete && selectedConversation && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div style={{ width: 'min(420px,100%)', borderRadius: 28, background: 'linear-gradient(180deg,#0d1117,#080b0f)', border: '1px solid rgba(239,68,68,0.2)', padding: '36px 32px', boxShadow: '0 32px 64px rgba(0,0,0,0.7)' }}>
            <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 22 }}>
              <Trash2 size={24} color="rgba(239,68,68,0.9)" />
            </div>
            <h3 style={{ margin: '0 0 10px', color: 'white', fontSize: 22, fontWeight: 800 }}>Delete conversation?</h3>
            <p style={{ margin: '0 0 28px', color: 'rgba(255,255,255,0.56)', fontSize: 15, lineHeight: 1.7 }}>
              All messages with <strong style={{ color: 'rgba(255,255,255,0.8)' }}>{selectedConversation.counterpart.name}</strong> will be permanently deleted.
              If they book a confirmed appointment in the future, the conversation will reappear automatically.
            </p>
            <div style={{ display: 'flex', gap: 12 }}>
              <button
                type="button"
                onClick={() => setConfirmDelete(false)}
                disabled={deleting}
                style={{ flex: 1, height: 52, borderRadius: 16, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.72)', fontSize: 16, cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={deleteConversation}
                disabled={deleting}
                style={{ flex: 1, height: 52, borderRadius: 16, border: 'none', background: 'rgba(239,68,68,0.85)', color: 'white', fontSize: 16, fontWeight: 700, cursor: deleting ? 'not-allowed' : 'pointer', opacity: deleting ? 0.7 : 1 }}
              >
                {deleting ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}