'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Star, Clock, Briefcase, Calendar, CheckCircle, Phone, PhoneOff } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useNotifications } from '@/context/NotificationContext';
import { useCall } from '@/context/CallContext';
import toast from 'react-hot-toast';
import {
  buildTimeOptionsForWindow,
  DEFAULT_TIME_WINDOWS,
  parseDateAndTimeSlot,
  formatMinutesToTimeLabel,
  parseTimeLabelToMinutes,
  getSlotKeysForTimeLabel,
  slotKeyToTimeLabel,
  formatMinutesToSlotKey
} from '@/lib/bookingTime';

const SLOT_META = {
  booked: { label: 'Booked', border: 'rgba(244,63,94,0.3)', background: 'rgba(244,63,94,0.08)', color: '#fb7185' },
  bookedByYou: { label: 'Booked by you', border: 'rgba(74,222,128,0.35)', background: 'rgba(74,222,128,0.08)', color: '#4ade80' },
  locked: { label: 'Held', border: 'rgba(251,191,36,0.3)', background: 'rgba(251,191,36,0.08)', color: '#fbbf24' },
  lockedByYou: { label: 'Held by you', border: 'rgba(59,130,246,0.35)', background: 'rgba(59,130,246,0.08)', color: '#60a5fa' },
  doctorBusy: { label: 'Doctor is Busy', border: 'rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.5)' },
  available: { label: 'Available', border: 'rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.03)', color: 'rgba(255,255,255,0.4)' }
};

function getLocalDateValue(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export default function DoctorProfilePage() {
  const { id } = useParams();
  const { user } = useAuth();
  const { lastLockExpiry, doctorPresence, socket } = useNotifications();
  const { initiateCall, callState } = useCall();
  const router = useRouter();

  const [doctor, setDoctor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedWindow, setSelectedWindow] = useState('');
  const [selectedSlot, setSelectedSlot] = useState('');
  const [booking, setBooking] = useState(false);
  const [lockExpiry, setLockExpiry] = useState(null);
  const [timeLeft, setTimeLeft] = useState(null);
  const [slotStates, setSlotStates] = useState({});
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [localTime, setLocalTime] = useState('');
  const todayValue = useMemo(() => getLocalDateValue(), []);

  // Effective online status derived from global presence map
  const docUserId = doctor ? (typeof doctor.userId === 'object' ? doctor.userId._id : doctor.userId) : null;
  const presenceStatus = doctorPresence[String(docUserId)];
  const isOnline = presenceStatus !== undefined ? presenceStatus : doctor?.isOnline === true;

  const fetchDoctor = useCallback(async (dateValue = '') => {
    try {
      if (dateValue) setSlotsLoading(true);
      const query = dateValue ? `?date=${encodeURIComponent(dateValue)}` : '';
      const response = await fetch(`/api/doctors/${id}${query}`, { credentials: 'include' });
      const data = await response.json();
      setDoctor(data.doctor);
      setSlotStates(data.slotStates || {});
    } finally {
      setLoading(false);
      setSlotsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (!id) return;
    fetchDoctor(selectedDate);
  }, [id, selectedDate, fetchDoctor]);

  useEffect(() => {
    if (!selectedSlot) return;

    const selectedSlotState = slotStates[selectedSlot];
    if (selectedSlotState === 'bookedByYou') {
      setLockExpiry(null);
      setTimeLeft(null);
      return;
    }

    if (selectedSlotState !== 'lockedByYou') {
      setLockExpiry(null);
      setTimeLeft(null);
      return;
    }

    fetch(`/api/appointments/lock?doctorId=${id}&date=${selectedDate}&timeSlot=${encodeURIComponent(selectedSlot)}`, {
      credentials: 'include'
    })
      .then(r => r.json())
      .then(data => {
        if (data.exists) {
          setLockExpiry(data.expiresAt);
        } else {
          setLockExpiry(null);
          setTimeLeft(null);
          fetchDoctor(selectedDate);
        }
      });
  }, [id, selectedDate, selectedSlot, slotStates, fetchDoctor]);

  useEffect(() => {
    if (lastLockExpiry && lastLockExpiry.doctorId === id && lastLockExpiry.date === selectedDate && lastLockExpiry.timeSlot === selectedSlot) {
      setLockExpiry(null);
      setTimeLeft(null);
      fetchDoctor(selectedDate);
    }
  }, [lastLockExpiry, id, selectedDate, selectedSlot, fetchDoctor]);

  // Sync localTime with selectedSlot only when selectedSlot changes externally
  useEffect(() => {
    if (selectedSlot) {
      const hhmm = formatMinutesToSlotKey(parseTimeLabelToMinutes(selectedSlot));
      setLocalTime(hhmm || '');
    } else {
      setLocalTime('');
    }
  }, [selectedSlot]);

  useEffect(() => {
    if (!lockExpiry) return;

    const interval = setInterval(() => {
      const diff = Math.max(0, Math.floor((new Date(lockExpiry) - new Date()) / 1000));
      setTimeLeft(diff);
      if (diff === 0) {
        setLockExpiry(null);
        setSelectedSlot('');
        toast.error('Session expired. Please select the slot again.');
        fetchDoctor(selectedDate);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [lockExpiry, selectedDate, fetchDoctor]);

  const availableWindows = useMemo(() => {
    if (!selectedDate || !doctor) return [];

    const dateObj = new Date(selectedDate);
    const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'long' });
    const dayAvail = doctor.availability?.find(a => a.day === dayName);

    if (dayAvail && dayAvail.slots?.length > 0) {
      return dayAvail.slots.filter((windowStart) => buildTimeOptionsForWindow(windowStart).length > 0);
    }

    return DEFAULT_TIME_WINDOWS.filter((windowStart) => buildTimeOptionsForWindow(windowStart).length > 0);
  }, [doctor, selectedDate]);

  const timeOptions = useMemo(() => {
    if (!selectedWindow) return [];

    const options = buildTimeOptionsForWindow(selectedWindow);
    if (selectedDate !== todayValue) return options;

    const now = new Date();
    return options.filter((slot) => {
      const slotTime = parseDateAndTimeSlot(selectedDate, slot);
      return slotTime && slotTime > now;
    });
  }, [selectedDate, selectedWindow, todayValue]);

  const visibleWindows = useMemo(() => {
    if (selectedDate !== todayValue) return availableWindows;

    const now = new Date();
    return availableWindows.filter((windowStart) =>
      buildTimeOptionsForWindow(windowStart).some((slot) => {
        const slotTime = parseDateAndTimeSlot(selectedDate, slot);
        return slotTime && slotTime > now;
      })
    );
  }, [availableWindows, selectedDate, todayValue]);

  const windowSummaries = useMemo(() => {
    return Object.fromEntries(
      visibleWindows.map((windowStart) => {
        const options = buildTimeOptionsForWindow(windowStart);
        const hasAvailableOption = options.some((slot) => {
          const state = slotStates[slot] || 'available';
          return state === 'available' || state === 'lockedByYou';
        });
        const hasMine = options.some((slot) => {
          const state = slotStates[slot];
          return state === 'bookedByYou' || state === 'lockedByYou';
        });

        return [windowStart, { hasAvailableOption, hasMine }];
      })
    );
  }, [slotStates, visibleWindows]);

  useEffect(() => {
    // Consolidated reset logic with stable dependency size
    if (!selectedDate) return;

    if (selectedWindow && visibleWindows.length > 0 && !visibleWindows.includes(selectedWindow)) {
      setSelectedWindow('');
      setSelectedSlot('');
      setLockExpiry(null);
      setTimeLeft(null);
    }
  }, [selectedDate, selectedWindow, visibleWindows.length]);

  // Real-time slot synchronization
  useEffect(() => {
    if (!socket || !id || !selectedDate) return;

    const handleSlotOccupied = (data) => {
      const { doctorId, date, timeSlot, state, patientId } = data;
      if (doctorId === id && date === selectedDate) {
        const keys = getSlotKeysForTimeLabel(timeSlot);
        const finalState = patientId === user?.userId 
          ? (state === 'locked' ? 'lockedByYou' : 'bookedByYou')
          : (state === 'locked' ? 'locked' : 'booked');
          
        setSlotStates(prev => {
          const next = { ...prev };
          keys.forEach(k => {
            const label = slotKeyToTimeLabel(k);
            if (!next[label] || next[label] === 'available' || next[label] === undefined) {
               next[label] = finalState;
            }
          });
          return next;
        });
      }
    };

    const handleSlotVacated = (data) => {
      const { doctorId, date, timeSlot } = data;
      if (doctorId === id && date === selectedDate) {
        const keys = getSlotKeysForTimeLabel(timeSlot);
        setSlotStates(prev => {
          const next = { ...prev };
          keys.forEach(k => {
            const label = slotKeyToTimeLabel(k);
            delete next[label];
          });
          return next;
        });
        // Force refresh from server to ensure data consistency
        fetchDoctor(selectedDate);
      }
    };

    const handleBusyRangeAdded = (data) => {
      const { doctorId, date, slotKeys } = data;
      if (doctorId === String(docUserId) && date === selectedDate) {
        setSlotStates(prev => {
          const next = { ...prev };
          slotKeys.forEach(k => { next[k] = 'doctorBusy'; });
          return next;
        });
      }
    };

    const handleBusyRangeRemoved = (data) => {
      const { doctorId, date, slotKeys } = data;
      if (doctorId === String(docUserId) && date === selectedDate) {
        setSlotStates(prev => {
          const next = { ...prev };
          slotKeys.forEach(k => { delete next[k]; });
          return next;
        });
        fetchDoctor(selectedDate);
      }
    };

    socket.on('slot:occupied', handleSlotOccupied);
    socket.on('slot:vacated', handleSlotVacated);
    socket.on('doctor:busy-range-added', handleBusyRangeAdded);
    socket.on('doctor:busy-range-removed', handleBusyRangeRemoved);

    return () => {
      socket.off('slot:occupied', handleSlotOccupied);
      socket.off('slot:vacated', handleSlotVacated);
      socket.off('doctor:busy-range-added', handleBusyRangeAdded);
      socket.off('doctor:busy-range-removed', handleBusyRangeRemoved);
    };
  }, [socket, id, selectedDate, user?.userId, fetchDoctor, docUserId]);

  const getEffectiveSlotState = useCallback((timeLabel) => {
    if (!timeLabel || !slotStates) return 'available';
    const keys = getSlotKeysForTimeLabel(timeLabel); // 60 keys for 1-hour duration
    
    let hasBookedByYou = false;
    let hasLockedByYou = false;
    let hasBookedByOthers = false;
    let hasLockedByOthers = false;
    let hasDoctorBusy = false;

    for (const k of keys) {
      const state = slotStates[slotKeyToTimeLabel(k)];
      if (state === 'bookedByYou') hasBookedByYou = true;
      if (state === 'lockedByYou') hasLockedByYou = true;
      if (state === 'booked') hasBookedByOthers = true;
      if (state === 'locked') hasLockedByOthers = true;
      if (state === 'doctorBusy') hasDoctorBusy = true;
    }

    if (hasBookedByYou) return 'bookedByYou';
    if (hasLockedByYou) return 'lockedByYou';
    if (hasBookedByOthers) return 'booked';
    if (hasLockedByOthers) return 'locked';
    if (hasDoctorBusy) return 'doctorBusy';
    
    return 'available';
  }, [slotStates]);

  const handleWindowClick = (windowStart) => {
    setSelectedWindow(windowStart);
    // Only reset slot if it's outside the new window
    const minutes = parseTimeLabelToMinutes(selectedSlot);
    const windowMinutes = parseTimeLabelToMinutes(windowStart);
    if (minutes !== null && windowMinutes !== null) {
      if (minutes < windowMinutes || minutes >= windowMinutes + 60) {
        setSelectedSlot('');
      }
    }
    setLockExpiry(null);
    setTimeLeft(null);
  };

  const handleBookSlot = async () => {
    if (!user) {
      toast.error('Please login to book');
      router.push('/login');
      return;
    }

    if (!selectedDate || !selectedSlot) {
      toast.error('Please select a date and time slot');
      return;
    }

    const now = new Date();
    if (selectedDate === todayValue) {
      const slotTime = parseDateAndTimeSlot(selectedDate, selectedSlot);
      if (!slotTime) {
        toast.error('Please select a valid time slot.');
        return;
      }
      if (slotTime <= now) {
        toast.error('Please select a future time slot.');
        return;
      }
    }

    setBooking(true);
    try {
      const lockRes = await fetch('/api/appointments/lock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ doctorId: id, date: selectedDate, timeSlot: selectedSlot })
      });
      const lockData = await lockRes.json();
      if (!lockRes.ok) {
        throw new Error(lockData.error || 'Failed to secure time slot');
      }
      setLockExpiry(lockData.expiresAt);

      const res = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ doctorId: id, date: selectedDate, timeSlot: selectedSlot })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      toast.success('Appointment booked successfully!');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBooking(false);
      await fetchDoctor(selectedDate);
    }
  };

  const initials = doctor?.userId?.name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'DR';
  const selectedSlotState = getEffectiveSlotState(selectedSlot);
  const isBookedByYou = selectedSlotState === 'bookedByYou';
  const isLockedByYou = selectedSlotState === 'lockedByYou';
  const isDoctorBusy = selectedSlotState === 'doctorBusy';
  const isBlockedByOthers = selectedSlotState === 'booked' || selectedSlotState === 'locked' || isDoctorBusy;
  const canSubmitBooking = selectedDate && selectedSlot && !booking && !isBookedByYou && !isDoctorBusy;

  const format24To12 = (hhm) => {
    if (!hhm) return '';
    const [h, m] = hhm.split(':').map(Number);
    const ampm = h >= 12 ? 'PM' : 'AM';
    let dispH = h % 12;
    if (dispH === 0) dispH = 12;
    return `${String(dispH).padStart(2, '0')}:${String(m).padStart(2, '0')} ${ampm}`;
  };

  const getSlotMessage = () => {
    if (isBookedByYou) return "This slot was booked by you";
    if (isDoctorBusy) {
      // Find which range specifically blocks this slot
      const range = doctor?.busyRanges?.find(r => 
        r.date === selectedDate && r.slotKeys.includes(selectedSlot)
      );
      if (range) return `Doctor is Busy from ${format24To12(range.startTime)} to ${format24To12(range.endTime)}`;
      return "Doctor is Busy";
    }
    if (isBlockedByOthers) {
      return "This time slot was booked by someone else";
    }
    return SLOT_META[selectedSlotState || 'available'].label;
  };

  const getEndTimeLabel = (timeLabel) => {
    const minutes = parseTimeLabelToMinutes(timeLabel);
    if (minutes === null) return '';
    return formatMinutesToTimeLabel(minutes + 60);
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: '16px' }}>
        <div className="size-10 border-2 border-blue-500/20 border-t-blue-500 animate-spin rounded-full" />
        <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: '11px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.12em' }}>Fetching profile...</p>
      </div>
    );
  }

  if (!doctor) {
    return <div style={{ textAlign: 'center', padding: '120px', color: 'rgba(255,255,255,0.3)' }}>Doctor not found</div>;
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', padding: '32px' }}>
      <div style={{ maxWidth: 940, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px' }}>
          <Link
            href="/dashboard/patient/doctors"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: 'rgba(255,255,255,0.3)', textDecoration: 'none', fontSize: '13px', fontWeight: '600', transition: 'color 0.2s' }}
            onMouseEnter={e => e.currentTarget.style.color = '#fff'}
            onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.3)'}
          >
            <ArrowLeft size={16} /> Back to Network
          </Link>

          <button
            onClick={() => doctor && initiateCall(doctor.userId?._id || doctor.userId, doctor._id)}
            disabled={!isOnline || callState !== 'idle'}
            style={{
              display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 24px', borderRadius: '14px',
              background: isOnline ? '#fff' : 'rgba(255,255,255,0.03)',
              color: isOnline ? '#000' : 'rgba(255,255,255,0.2)',
              fontSize: '14px', fontWeight: '800', border: 'none',
              cursor: (isOnline && callState === 'idle') ? 'pointer' : 'not-allowed',
              transition: 'all 0.2s',
              boxShadow: isOnline ? '0 4px 20px rgba(255,255,255,0.1)' : 'none'
            }}
          >
            {isOnline ? (
              <><Phone size={16} fill="currentColor" /> Call Now</>
            ) : (
              <><PhoneOff size={16} /> Doctor Busy</>
            )}
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: '32px', alignItems: 'start' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div style={{ background: 'rgba(255,255,255,0.02)', border: '0.5px solid rgba(255,255,255,0.08)', borderRadius: '28px', padding: '40px' }}>
              <div style={{ display: 'flex', gap: '32px' }}>
                <div style={{ position: 'relative' }}>
                  <div style={{ width: '100px', height: '100px', borderRadius: '50%', background: 'linear-gradient(135deg, #3b82f6, #60a5fa)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px', fontWeight: '800', color: '#fff', boxShadow: '0 0 30px rgba(59,130,246,0.3)' }}>
                    {initials}
                  </div>
                  <div style={{ position: 'absolute', bottom: '4px', right: '4px', width: '14px', height: '14px', borderRadius: '50%', background: isOnline ? '#4ade80' : 'rgba(255,255,255,0.2)', border: '3px solid #050608' }} />
                </div>

                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                    <h1 style={{ fontSize: '30px', fontWeight: '900', color: '#fff', letterSpacing: '-0.5px', margin: 0 }}>Dr. {doctor.userId?.name}</h1>
                    {doctor.isApproved && <CheckCircle size={18} style={{ color: '#4ade80' }} />}
                  </div>
                  <p style={{ color: '#60a5fa', fontWeight: '700', fontSize: '15px', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 20px' }}>{doctor.specialization}</p>

                  <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 14px', background: 'rgba(0,0,0,0.2)', border: '0.5px solid rgba(255,255,255,0.06)', borderRadius: '99px', fontSize: '13px', color: 'rgba(255,255,255,0.6)', fontWeight: '600' }}>
                      <Star size={14} style={{ color: '#fbbf24', fill: '#fbbf24' }} /> {doctor.rating > 0 ? Number(doctor.rating).toFixed(1) : '-'}
                      <span style={{ color: 'rgba(255,255,255,0.2)', marginLeft: '4px' }}>({doctor.totalReviews || 0} reviews)</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 14px', background: 'rgba(0,0,0,0.2)', border: '0.5px solid rgba(255,255,255,0.06)', borderRadius: '99px', fontSize: '13px', color: 'rgba(255,255,255,0.6)', fontWeight: '600' }}>
                      <Briefcase size={14} /> {doctor.experience}Y Experience
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ height: '0.5px', background: 'rgba(255,255,255,0.06)', margin: '32px 0' }} />

              <div>
                <h3 style={{ fontSize: '12px', fontWeight: '800', color: 'rgba(255,255,255,0.2)', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: '12px' }}>Professional Brief</h3>
                <p style={{ color: 'rgba(255,255,255,0.6)', lineHeight: '1.8', fontSize: '15px', margin: 0 }}>{doctor.bio || 'No professional overview provided yet.'}</p>
              </div>

              {doctor.hospital && (
                <div style={{ marginTop: '24px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '10px', background: 'rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Briefcase size={14} style={{ color: 'rgba(255,255,255,0.4)' }} />
                  </div>
                  <div>
                    <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', fontWeight: '700', margin: 0 }}>Primary Institution</p>
                    <p style={{ fontSize: '14px', color: '#fff', fontWeight: '600', margin: 0 }}>{doctor.hospital}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', position: 'sticky', top: '32px' }}>
            <div style={{ background: 'rgba(255,255,255,0.02)', border: '0.5px solid rgba(255,255,255,0.08)', borderRadius: '28px', padding: '32px', textAlign: 'center' }}>
              <p style={{ fontSize: '13px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(255,255,255,0.35)', marginBottom: '8px' }}>Consultation Fee</p>
              <h2 style={{ fontSize: '42px', fontWeight: '900', margin: 0, letterSpacing: '-1px', color: '#fff' }}>Rs {doctor.fee}</h2>
              <p style={{ fontSize: '11px', fontWeight: '600', color: 'rgba(255,255,255,0.25)', marginTop: '4px' }}>Secure Payment & Instant Access</p>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.02)', border: '0.5px solid rgba(255,255,255,0.08)', borderRadius: '28px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingLeft: '4px' }}>
                  <Calendar size={14} style={{ color: '#fff', filter: 'drop-shadow(0 0 4px rgba(255,255,255,0.4))' }} />
                  <span style={{ fontSize: '11px', fontWeight: '800', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Select Consultation Date</span>
                </div>
                <input
                  type="date"
                  min={todayValue}
                  value={selectedDate}
                  onChange={(e) => {
                    setSelectedDate(e.target.value);
                    setSelectedWindow('');
                    setSelectedSlot('');
                    setLockExpiry(null);
                    setTimeLeft(null);
                  }}
                  style={{ width: '100%', padding: '16px', borderRadius: '16px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', color: '#fff', fontSize: '14px', outline: 'none', colorScheme: 'dark' }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingLeft: '4px' }}>
                  <Clock size={14} style={{ color: '#60a5fa' }} />
                  <span style={{ fontSize: '11px', fontWeight: '800', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Choose A Time Window</span>
                </div>

                {!selectedDate ? (
                  <div style={{ padding: '20px', background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.08)', borderRadius: '16px', textAlign: 'center' }}>
                    <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.2)', fontWeight: '500', margin: 0 }}>Please pick a date first</p>
                  </div>
                ) : slotsLoading ? (
                  <div style={{ padding: '20px', background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.08)', borderRadius: '16px', textAlign: 'center' }}>
                    <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.2)', fontWeight: '500', margin: 0 }}>Refreshing slot availability...</p>
                  </div>
                ) : visibleWindows.length === 0 ? (
                  <div style={{ padding: '20px', background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.08)', borderRadius: '16px', textAlign: 'center' }}>
                    <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.2)', fontWeight: '500', margin: 0 }}>No future booking windows available for this day</p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '10px', maxHeight: '320px', overflowY: 'auto', paddingRight: '4px' }}>
                      {visibleWindows.map((windowStart) => {
                        const summary = windowSummaries[windowStart] || { hasAvailableOption: true, hasMine: false };
                        const isSelected = selectedWindow === windowStart;
                        const subLabel = summary.hasMine
                          ? 'Your booking inside'
                          : summary.hasAvailableOption
                            ? 'Pick exact time'
                            : 'Currently full';

                        return (
                          <button
                            key={windowStart}
                            onClick={() => handleWindowClick(windowStart)}
                            style={{
                              padding: '12px 10px',
                              borderRadius: '12px',
                              background: isSelected ? 'rgba(59,130,246,0.12)' : 'rgba(255,255,255,0.03)',
                              border: `1px solid ${isSelected ? '#3b82f6' : 'rgba(255,255,255,0.08)'}`,
                              color: isSelected ? '#fff' : 'rgba(255,255,255,0.75)',
                              fontSize: '13px',
                              fontWeight: '700',
                              cursor: 'pointer',
                              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '4px',
                              opacity: summary.hasAvailableOption || summary.hasMine ? 1 : 0.8
                            }}
                            onMouseEnter={e => {
                              if (!isSelected) {
                                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)';
                                e.currentTarget.style.color = '#fff';
                              }
                            }}
                            onMouseLeave={e => {
                              if (!isSelected) {
                                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)';
                                e.currentTarget.style.color = 'rgba(255,255,255,0.75)';
                              }
                            }}
                          >
                            <span>{windowStart}</span>
                            <span style={{ fontSize: '10px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.04em', color: isSelected ? '#bfdbfe' : 'rgba(255,255,255,0.35)' }}>
                              {subLabel}
                            </span>
                          </button>
                        );
                      })}
                    </div>

                    {selectedWindow && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <label style={{ fontSize: '11px', fontWeight: '800', color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', letterSpacing: '0.08em', paddingLeft: '4px' }}>
                          Select Exact Start Time
                        </label>
                        <div style={{ position: 'relative' }}>
                          <input
                            type="time"
                            value={localTime}
                            onChange={(e) => {
                              const val = e.target.value;
                              if (!val) {
                                setLocalTime('');
                                setSelectedSlot('');
                                return;
                              }
                              
                              const minutes = parseTimeLabelToMinutes(val);
                              const windowMins = selectedWindow ? parseTimeLabelToMinutes(selectedWindow) : null;
                              
                              // Enforcement: Stay within the selected 1-hour window
                              if (windowMins !== null && minutes !== null) {
                                if (minutes < windowMins || minutes >= windowMins + 60) {
                                  toast.error(`Please select a time within the ${selectedWindow} window`);
                                  return;
                                }
                              }

                              setLocalTime(val); 
                              if (minutes !== null) {
                                setSelectedSlot(formatMinutesToTimeLabel(minutes));
                              }
                            }}
                            min={selectedWindow ? formatMinutesToSlotKey(parseTimeLabelToMinutes(selectedWindow)) : undefined}
                            max={selectedWindow ? formatMinutesToSlotKey(parseTimeLabelToMinutes(selectedWindow) + 59) : undefined}
                            style={{
                              width: '100%',
                              padding: '14px 16px',
                              borderRadius: '14px',
                              background: 'rgba(255,255,255,0.035)',
                              border: '1px solid rgba(255,255,255,0.08)',
                              color: '#fff',
                              fontSize: '14px',
                              outline: 'none',
                              colorScheme: 'dark',
                              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.03)'
                            }}
                          />
                        </div>

                        {selectedSlot && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <div style={{ 
                              display: 'flex', 
                              alignItems: 'center', 
                              justifyContent: isDoctorBusy ? 'center' : 'space-between', 
                              padding: '10px 12px', 
                              borderRadius: '12px', 
                              background: 'rgba(255,255,255,0.03)', 
                              border: '1px solid rgba(255,255,255,0.06)' 
                            }}>
                              {!isDoctorBusy && (
                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                  <span style={{ fontSize: '12px', fontWeight: '700', color: '#fff' }}>{selectedSlot} — {getEndTimeLabel(selectedSlot)}</span>
                                  <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)', fontWeight: '600' }}>60 min consultation</span>
                                </div>
                              )}
                              <span style={{ 
                                fontSize: '11px', fontWeight: '800', letterSpacing: '0.05em', 
                                textTransform: 'uppercase', color: SLOT_META[selectedSlotState || 'available'].color,
                                textAlign: isDoctorBusy ? 'center' : 'right'
                              }}>
                                {getSlotMessage()}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {timeLeft !== null && selectedSlot && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px', background: 'rgba(245,158,11,0.05)', border: '0.5px solid rgba(245,158,11,0.15)', borderRadius: '12px', justifyContent: 'center' }}>
                        <Clock size={12} style={{ color: '#fbbf24' }} />
                        <span style={{ fontSize: '11px', fontWeight: '700', color: '#fbbf24', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                          Expires in {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <button
                onClick={handleBookSlot}
                disabled={!canSubmitBooking}
                style={{
                  marginTop: '8px',
                  padding: '18px',
                  borderRadius: '20px',
                  background: isBookedByYou ? '#4ade80' : isBlockedByOthers ? 'rgba(255,255,255,0.05)' : (selectedDate && selectedSlot) ? '#fff' : 'rgba(255,255,255,0.05)',
                  color: isBookedByYou ? '#000' : isBlockedByOthers ? 'rgba(255,255,255,0.3)' : (selectedDate && selectedSlot) ? '#000' : 'rgba(255,255,255,0.2)',
                  fontSize: '15px',
                  fontWeight: '800',
                  border: 'none',
                  cursor: canSubmitBooking ? 'pointer' : 'not-allowed',
                  transition: 'all 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '10px'
                }}
                onMouseEnter={e => {
                  if (canSubmitBooking) {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 10px 25px rgba(255,255,255,0.15)';
                  }
                }}
                onMouseLeave={e => {
                  if (canSubmitBooking) {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }
                }}
              >
                {booking ? (
                  <div className="size-5 border-2 border-slate-900/20 border-t-slate-900 animate-spin rounded-full" />
                ) : isBookedByYou ? (
                  <><CheckCircle size={18} /> Booked by you</>
                ) : isBlockedByOthers ? (
                  <><Clock size={18} /> Slot unavailable</>
                ) : isLockedByYou ? (
                  <><CheckCircle size={18} /> Continue booking</>
                ) : (
                  <><CheckCircle size={18} /> Book Slot</>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
