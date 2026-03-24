'use client';

import React, { useState, useEffect } from 'react';
import { X, Sparkles, CheckCircle2, Circle, Trophy, Coffee, Droplets, Dumbbell, Quote } from 'lucide-react';

const ACCENT = '#3b82f6';

const QUOTES = [
  "The art of healing comes from nature, not from the physician. — Paracelsus",
  "Wherever the art of Medicine is loved, there is also a love of Humanity. — Hippocrates",
  "Medicines cure diseases, but only doctors can cure patients. — Carl Jung",
  "A good physician treats the disease; the great physician treats the patient who has the disease. — William Osler",
  "To cure sometimes, to relieve often, to comfort always. — Edward Livingston Trudeau"
];

const HABITS = [
  { id: 'water', label: 'Stay Hydrated', Icon: Droplets },
  { id: 'stretch', label: 'Quick Stretch', Icon: Dumbbell },
  { id: 'break', label: 'Mindful Break', Icon: Coffee }
];

export default function PlanYourDayModal({ isOpen, onClose, appointments, doctorName, isPlanned, onPlanComplete, userId }) {
  const [goal, setGoal] = useState('');
  const [completedHabits, setCompletedHabits] = useState(new Set());
  const [quote] = useState(() => QUOTES[Math.floor(Math.random() * QUOTES.length)]);

  useEffect(() => {
    // Sync with top-level persistence using unique userId
    if (isOpen && userId) {
        const savedGoal = localStorage.getItem(`doctor_daily_goal_${userId}`);
        const savedHabits = localStorage.getItem(`doctor_completed_habits_${userId}`);
        if (savedGoal) setGoal(savedGoal);
        if (savedHabits) setCompletedHabits(new Set(JSON.parse(savedHabits)));
    }
  }, [isOpen, userId]);

  const toggleHabit = (id) => {
    if (isPlanned || !userId) return; 
    const next = new Set(completedHabits);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setCompletedHabits(next);
    localStorage.setItem(`doctor_completed_habits_${userId}`, JSON.stringify([...next]));
  };

  const handleGoalChange = (val) => {
    if (isPlanned || !userId) return; 
    setGoal(val);
    localStorage.setItem(`doctor_daily_goal_${userId}`, val);
  };

  const finalizePlan = () => {
    onPlanComplete();
    onClose(); 
  };

  if (!isOpen) return null;

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(12px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }}>
      <div style={{ background: '#000', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 32, width: '100%', maxWidth: 640, maxHeight: '90vh', overflowY: 'auto', position: 'relative', padding: 40, boxShadow: '0 25px 60px -12px rgba(0,0,0,0.8)' }}>
        
        {/* Close */}
        <button onClick={onClose} style={{ position: 'absolute', top: 30, right: 30, background: 'rgba(255,255,255,0.05)', border: 'none', borderRadius: '50%', padding: 10, cursor: 'pointer', color: '#fff', transition: 'all 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'} onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}>
          <X size={20} />
        </button>

        {/* Header */}
        <div style={{ marginBottom: 40 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
            <div style={{ padding: 8, background: 'rgba(59,130,246,0.1)', borderRadius: 12 }}>
              <Sparkles size={24} color={ACCENT} />
            </div>
            <span style={{ fontSize: 12, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.2em', color: 'rgba(255,255,255,0.3)' }}>Daily Assistant</span>
          </div>
          <h2 style={{ fontSize: 32, fontWeight: 900, color: '#fff', margin: 0, letterSpacing: '-0.5px' }}>Good day, Dr. {doctorName.split(' ')[0]}</h2>
          <p style={{ color: 'rgba(255,255,255,0.4)', marginTop: 8, fontSize: 16 }}>{isPlanned ? "Your day is planned. You've got this!" : "Let's map out your clinical excellence for today."}</p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
          
          {/* Main Focus */}
          <section>
            <h3 style={{ fontSize: 13, fontWeight: 800, color: '#fff', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Trophy size={14} color="#fbbf24" /> Main Focus for today
            </h3>
            <input 
              value={goal}
              onChange={e => handleGoalChange(e.target.value)}
              disabled={isPlanned}
              placeholder="What is your primary goal today? (e.g. Complete all reports)"
              style={{ 
                width: '100%', background: 'rgba(255,255,255,0.03)', 
                border: '1px solid rgba(255,255,255,0.15)', borderRadius: 16, 
                padding: '16px 20px', color: '#fff', fontSize: 16, outline: 'none', 
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                opacity: isPlanned ? 0.6 : 1
              }}
              onFocus={e => {
                if (isPlanned) return;
                e.currentTarget.style.borderColor = '#fff';
                e.currentTarget.style.boxShadow = '0 0 15px rgba(255,255,255,0.3)';
              }}
              onBlur={e => {
                if (isPlanned) return;
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)';
                e.currentTarget.style.boxShadow = 'none';
              }}
              onMouseEnter={e => {
                if (isPlanned) return;
                if (document.activeElement !== e.currentTarget) {
                   e.currentTarget.style.borderColor = 'rgba(255,255,255,0.4)';
                }
              }}
              onMouseLeave={e => {
                if (isPlanned) return;
                if (document.activeElement !== e.currentTarget) {
                   e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)';
                }
              }}
            />
          </section>

          {/* Today's Timeline Summary */}
          <section>
            <h3 style={{ fontSize: 13, fontWeight: 800, color: '#fff', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 16 }}>Appointments Today</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {appointments.length === 0 ? (
                <div style={{ padding: 24, borderRadius: 20, background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.1)', textAlign: 'center', color: 'rgba(255,255,255,0.3)', fontSize: 14 }}>
                  No appointments scheduled for today.
                </div>
              ) : (
                appointments.map((apt, i) => (
                  <div key={apt._id || i} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '14px 20px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16 }}>
                    <div style={{ fontSize: 14, fontWeight: 800, color: ACCENT, width: 60 }}>{apt.timeSlot.split(' ')[0]}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 15, fontWeight: 700, color: '#fff' }}>{apt.patientId?.name || 'Patient'}</div>
                      <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>Consultation · {apt.status}</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>

          {/* Wellness Toggles */}
          <section>
            <h3 style={{ fontSize: 13, fontWeight: 800, color: '#fff', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 16 }}>Quick Wellness Check</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
              {HABITS.map(({ id, label, Icon }) => {
                const isActive = completedHabits.has(id);
                return (
                  <button 
                    key={id}
                    onClick={() => toggleHabit(id)}
                    disabled={isPlanned}
                    style={{ 
                      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: '20px 10px', 
                      borderRadius: 20, border: '1px solid', 
                      borderColor: isActive ? '#fff' : 'rgba(255,255,255,0.08)',
                      background: isActive ? '#fff' : 'rgba(255,255,255,0.02)',
                      cursor: isPlanned ? 'default' : 'pointer', transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      opacity: isPlanned && !isActive ? 0.3 : 1
                    }}
                    onMouseEnter={e => {
                        if (!isActive && !isPlanned) e.currentTarget.style.borderColor = 'rgba(255,255,255,0.3)';
                    }}
                    onMouseLeave={e => {
                        if (!isActive && !isPlanned) e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)';
                    }}
                  >
                    <Icon size={20} color={isActive ? '#000' : 'rgba(255,255,255,0.3)'} />
                    <span style={{ fontSize: 12, fontWeight: 800, color: isActive ? '#000' : 'rgba(255,255,255,0.4)' }}>{label}</span>
                  </button>
                );
              })}
            </div>
          </section>

          {/* Quote Section */}
          <div style={{ marginTop: 8, padding: 24, borderRadius: 24, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', position: 'relative' }}>
             <Quote size={40} style={{ position: 'absolute', top: 10, left: 10, opacity: 0.05, color: '#fff' }} />
             <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 15, fontStyle: 'italic', textAlign: 'center', margin: 0, lineHeight: 1.6 }}>&ldquo;{quote}&rdquo;</p>
          </div>

          {/* Finalize Button */}
          {isPlanned ? (
            <button 
              disabled
              style={{ 
                marginTop: 10, width: '100%', padding: '18px', borderRadius: 20, border: '1px solid rgba(255,255,255,0.2)', 
                background: 'linear-gradient(135deg, #e5e7eb, #9ca3af, #e5e7eb)', color: '#000', fontWeight: 900, fontSize: 16, 
                cursor: 'default', boxShadow: '0 0 30px rgba(192,192,192,0.4)', textAlign: 'center'
              }}
            >
              Day Planned
            </button>
          ) : (
            <button 
              onClick={finalizePlan}
              style={{ 
                marginTop: 10, width: '100%', padding: '18px', borderRadius: 20, border: 'none', 
                background: '#fff', color: '#000', fontWeight: 900, fontSize: 16, cursor: 'pointer', transition: 'all 0.3s' 
              }}
              onMouseEnter={e => { 
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 0 25px rgba(255,255,255,0.5)';
              }}
              onMouseLeave={e => { 
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
              }}
            >
              Ready for the day
            </button>
          )}

        </div>
      </div>
    </div>
  );
}
