'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Phone, PhoneOff, Mic, MicOff, User } from 'lucide-react';
import { useCall } from '@/context/CallContext';

const ACCENT = '#18b6a2';
const DANGER = '#ef4444';

export default function AudioCallOverlay() {
  const { 
    callState, isIncoming, remoteUser, isMuted,
    acceptCall, rejectCall, hangupCall, toggleMute 
  } = useCall();

  const [timer, setTimer] = useState(0);

  // --- Ringtone Synth ---
  useEffect(() => {
    let audioCtx;
    let oscillator;
    let gainNode;
    let timeoutId;

    const playTone = () => {
      if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      }
      
      oscillator = audioCtx.createOscillator();
      gainNode = audioCtx.createGain();

      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(480, audioCtx.currentTime); 
      
      gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.1, audioCtx.currentTime + 0.05);
      gainNode.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.4);

      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);

      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 0.5);

      timeoutId = setTimeout(playTone, 1500); // Repeat pattern
    };

    if (callState === 'ringing' && isIncoming) {
      playTone();
    }

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      if (audioCtx) audioCtx.close();
    };
  }, [callState, isIncoming]);

  useEffect(() => {
    let interval;
    if (callState === 'connected') {
      interval = setInterval(() => setTimer(t => t + 1), 1000);
    } else {
      setTimer(0);
    }
    return () => clearInterval(interval);
  }, [callState]);

  const formatTimer = (s) => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  if (callState === 'idle') return null;

  const initials = (name = '') => name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 9999,
          background: 'rgba(5, 8, 13, 0.9)',
          backdropFilter: 'blur(20px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white'
        }}
      >
        <motion.div
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 20 }}
          style={{
            width: 'min(400px, 90vw)',
            background: 'linear-gradient(180deg, #111827, #030712)',
            borderRadius: 40,
            border: '1px solid rgba(255, 255, 255, 0.1)',
            padding: 48,
            boxShadow: '0 40px 100px rgba(0,0,0,0.8)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center'
          }}
        >
          {/* Avatar Area */}
          <div style={{ position: 'relative', marginBottom: 32 }}>
            <motion.div
              animate={callState === 'ringing' ? {
                scale: [1, 1.1, 1],
                opacity: [0.5, 0.8, 0.5]
              } : {}}
              transition={{ repeat: Infinity, duration: 2 }}
              style={{
                position: 'absolute',
                inset: -20,
                borderRadius: '50%',
                border: `2px solid ${callState === 'offering' || callState === 'ringing' ? ACCENT : 'rgba(255,255,255,0.1)'}`,
                opacity: 0.5
              }}
            />
            <div style={{
              width: 120,
              height: 120,
              borderRadius: '50%',
              background: `linear-gradient(135deg, ${ACCENT}, #3b82f6)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 40,
              fontWeight: 800,
              boxShadow: `0 20px 40px rgba(24, 182, 162, 0.3)`
            }}>
              {remoteUser ? initials(remoteUser.name) : <User size={48} />}
            </div>
          </div>

          {/* User Info */}
          <h2 style={{ fontSize: 28, fontWeight: 800, margin: '0 0 8px' }}>
            {remoteUser?.name || 'Sanjeevni User'}
          </h2>
          <p style={{ 
            fontSize: 18, 
            color: 'rgba(255, 255, 255, 0.5)', 
            margin: '0 0 40px',
            textTransform: 'capitalize'
          }}>
            {callState === 'ringing' ? (isIncoming ? 'Incoming Audio Call' : 'Calling...') : 
             callState === 'offering' ? 'Initiating Call...' : 
             callState === 'connected' ? `In Call • ${formatTimer(timer)}` : 'Call Ended'}
          </p>

          {/* Actions */}
          <div style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
            {callState === 'ringing' && isIncoming ? (
              <>
                <ActionButton 
                  icon={<PhoneOff size={28} />} 
                  onClick={rejectCall} 
                  bg={DANGER} 
                  label="Reject" 
                />
                <ActionButton 
                  icon={<Phone size={28} />} 
                  onClick={acceptCall} 
                  bg={ACCENT} 
                  label="Accept" 
                  pulse
                />
              </>
            ) : (
              <>
                {callState === 'connected' && (
                  <ActionButton 
                    icon={isMuted ? <MicOff size={24} /> : <Mic size={24} />} 
                    onClick={toggleMute} 
                    bg="rgba(255,255,255,0.1)" 
                    label={isMuted ? 'Unmute' : 'Mute'} 
                  />
                )}
                <ActionButton 
                  icon={<PhoneOff size={28} />} 
                  onClick={hangupCall} 
                  bg={DANGER} 
                  label="End" 
                />
              </>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

function ActionButton({ icon, onClick, bg, label, pulse = false }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        animate={pulse ? { scale: [1, 1.05, 1] } : {}}
        transition={pulse ? { repeat: Infinity, duration: 1.5 } : {}}
        onClick={onClick}
        style={{
          width: 72,
          height: 72,
          borderRadius: '50%',
          border: 'none',
          background: bg,
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          boxShadow: '0 10px 20px rgba(0,0,0,0.3)'
        }}
      >
        {icon}
      </motion.button>
      <span style={{ fontSize: 14, fontWeight: 600, color: 'rgba(255, 255, 255, 0.4)' }}>{label}</span>
    </div>
  );
}
