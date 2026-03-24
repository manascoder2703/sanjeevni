'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { X, Clock, AlertCircle, CheckCircle2, Moon, Calendar } from 'lucide-react';

const ACCENT = '#3b82f6';

export default function BusyDurationModal({ isOpen, onClose, onConfirm, doctorName }) {
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [error, setError] = useState('');

  // Set default times on open
  useEffect(() => {
    if (isOpen) {
      const now = new Date();
      const today = now.toISOString().split('T')[0];
      const start = now.toTimeString().slice(0, 5); // HH:MM
      
      const later = new Date(now.getTime() + 60 * 60 * 1000); // +1 hour
      const end = later.toTimeString().slice(0, 5);
      
      setDate(today);
      setStartTime(start);
      setEndTime(end);
      setError('');
    }
  }, [isOpen]);

  const validate = useMemo(() => {
    if (!date || !startTime || !endTime) return { valid: false, msg: 'Please fill all fields.' };
    
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    
    // Past date check
    if (date < todayStr) {
      return { valid: false, msg: 'Selected date cannot be in the past.' };
    }

    const [sH, sM] = startTime.split(':').map(Number);
    const [eH, eM] = endTime.split(':').map(Number);
    
    const startMinutes = sH * 60 + sM;
    const endMinutes = eH * 60 + eM;

    // Past time check (only if today)
    if (date === todayStr) {
      const nowMinutes = now.getHours() * 60 + now.getMinutes();
      if (startMinutes < nowMinutes - 1) { // 1 min buffer
        return { valid: false, msg: 'Start time cannot be in the past.' };
      }
    }

    if (endMinutes <= startMinutes) {
      return { valid: false, msg: 'End time must be after start time.' };
    }

    return { valid: true, msg: '' };
  }, [date, startTime, endTime]);

  const handleConfirm = () => {
    if (validate.valid) {
      onConfirm({ date, startTime, endTime });
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(16px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, padding: 20 }}>
      <div 
        style={{ 
          background: '#0a0b0d', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 28, 
          width: '100%', maxWidth: 440, position: 'relative', padding: '36px', 
          boxShadow: '0 30px 70px -12px rgba(0,0,0,0.9)', overflow: 'hidden' 
        }}
      >
        {/* Aesthetic Background Effect */}
        <div style={{ position: 'absolute', top: -50, right: -50, width: 150, height: 150, background: 'rgba(59,130,246,0.05)', filter: 'blur(60px)', borderRadius: '50%' }} />

        {/* Close Button */}
        <button 
          onClick={onClose} 
          style={{ position: 'absolute', top: 24, right: 24, background: 'rgba(255,255,255,0.04)', border: 'none', borderRadius: '12px', padding: '8px', cursor: 'pointer', color: 'rgba(255,255,255,0.4)', transition: 'all 0.2s' }}
          onMouseEnter={e => e.currentTarget.style.color = '#fff'}
          onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.4)'}
        >
          <X size={18} />
        </button>

        {/* Header */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <div style={{ padding: 8, background: 'rgba(59,130,246,0.12)', borderRadius: 12 }}>
              <Moon size={22} color={ACCENT} fill="rgba(59,130,246,0.2)" />
            </div>
            <span style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.15em', color: 'rgba(255,255,255,0.25)' }}>Availability Sync</span>
          </div>
          <h2 style={{ fontSize: 24, fontWeight: 800, color: '#fff', margin: 0, letterSpacing: '-0.5px' }}>Set Busy Duration</h2>
          <p style={{ color: 'rgba(255,255,255,0.4)', marginTop: 6, fontSize: 13, lineHeight: 1.5 }}>Select a tentative time range for when you will be unavailable for consultations.</p>
        </div>

        {/* Inputs */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          
          {/* Date Picker */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <label style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase' }}>Busy Date</label>
            <div style={{ position: 'relative' }}>
              <Calendar size={14} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)' }} />
              <input 
                type="date" 
                value={date}
                min={new Date().toISOString().split('T')[0]}
                onChange={e => setDate(e.target.value)}
                style={{ 
                  width: '100%', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', 
                  borderRadius: 14, padding: '12px 14px 12px 40px', color: '#fff', fontSize: 15, outline: 'none'
                }} 
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            {/* Start Time */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase' }}>From</label>
              <div style={{ position: 'relative' }}>
                <Clock size={14} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)' }} />
                <input 
                  type="time" 
                  value={startTime}
                  onChange={e => setStartTime(e.target.value)}
                  style={{ 
                    width: '100%', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', 
                    borderRadius: 14, padding: '12px 14px 12px 40px', color: '#fff', fontSize: 15, outline: 'none'
                  }} 
                />
              </div>
            </div>

            {/* End Time */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase' }}>To (Tentative)</label>
              <div style={{ position: 'relative' }}>
                <Clock size={14} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)' }} />
                <input 
                  type="time" 
                  value={endTime}
                  onChange={e => setEndTime(e.target.value)}
                  style={{ 
                    width: '100%', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', 
                    borderRadius: 14, padding: '12px 14px 12px 40px', color: '#fff', fontSize: 15, outline: 'none'
                  }} 
                />
              </div>
            </div>
          </div>

          {/* Error Message */}
          {!validate.valid && startTime && endTime && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 16px', background: 'rgba(244,63,94,0.08)', border: '1px solid rgba(244,63,94,0.15)', borderRadius: 14 }}>
              <AlertCircle size={14} color="#fb7185" />
              <span style={{ fontSize: 12, fontWeight: 600, color: '#fb7185' }}>{validate.msg}</span>
            </div>
          )}

          {/* Success Message (Visual Cue) */}
          {validate.valid && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 16px', background: 'rgba(34,197,94,0.05)', border: '1px solid rgba(34,197,94,0.1)', borderRadius: 14 }}>
              <CheckCircle2 size={14} color="#4ade80" />
              <span style={{ fontSize: 12, fontWeight: 600, color: '#4ade80' }}>Ready to set as Busy</span>
            </div>
          )}

          {/* Action Button */}
          <button 
            onClick={handleConfirm}
            disabled={!validate.valid}
            style={{ 
              marginTop: 8, width: '100%', padding: '16px', borderRadius: 16, border: 'none', 
              background: validate.valid ? '#fff' : 'rgba(255,255,255,0.05)', 
              color: validate.valid ? '#000' : 'rgba(255,255,255,0.2)', 
              fontWeight: 800, fontSize: 14, 
              cursor: validate.valid ? 'pointer' : 'not-allowed', 
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              boxShadow: validate.valid ? '0 10px 30px rgba(255,255,255,0.2)' : 'none'
            }}
            onMouseEnter={e => {
              if (validate.valid) {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 15px 40px rgba(255,255,255,0.3)';
              }
            }}
            onMouseLeave={e => {
              if (validate.valid) {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 10px 30px rgba(255,255,255,0.2)';
              }
            }}
          >
            Schedule Status Change
          </button>

          <p style={{ textAlign: 'center', fontSize: 11, color: 'rgba(255,255,255,0.2)', margin: 0 }}>
            Patients will see you as "Busy" during this interval.
          </p>
        </div>
      </div>
    </div>
  );
}
