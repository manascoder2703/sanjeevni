'use client';
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import toast from 'react-hot-toast';
import { CheckCircle, RefreshCw, ChevronRight, ChevronLeft, Edit2, Info, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const ACCENT = '#18b6a2';

const STEPS = [
  {
    key: 'currentMedications',
    label: 'Current medications',
    sub: 'List any medicines you are currently taking regularly.',
    icon: '💊',
    iconBg: 'rgba(59,130,246,0.12)',
    color: 'blue',
    placeholder: 'e.g. Metformin 500mg',
    suggestions: ['Metformin', 'Atorvastatin', 'Amlodipine', 'Aspirin', 'Losartan', 'Omeprazole', 'Levothyroxine', 'None'],
  },
  {
    key: 'drugAllergies',
    label: 'Drug allergies',
    sub: 'Any medicines that have caused you an allergic reaction.',
    icon: '⚠️',
    iconBg: 'rgba(239,68,68,0.12)',
    color: 'red',
    placeholder: 'e.g. Penicillin',
    suggestions: ['Penicillin', 'Sulfonamides', 'NSAIDs', 'Aspirin', 'Codeine', 'Ibuprofen', 'None'],
  },
  {
    key: 'foodAllergies',
    label: 'Food & other allergies',
    sub: 'Any food, pollen, latex or environmental allergies.',
    icon: '🥜',
    iconBg: 'rgba(251,191,36,0.12)',
    color: 'amber',
    placeholder: 'e.g. Peanuts',
    suggestions: ['Peanuts', 'Shellfish', 'Dairy', 'Gluten', 'Eggs', 'Pollen', 'Latex', 'None'],
  },
  {
    key: 'conditions',
    label: 'Existing conditions',
    sub: 'Any chronic or ongoing medical conditions.',
    icon: '🩺',
    iconBg: 'rgba(167,139,250,0.12)',
    color: 'purple',
    placeholder: 'e.g. Diabetes',
    suggestions: ['Type 2 diabetes', 'Hypertension', 'Asthma', 'Thyroid disorder', 'Heart disease', 'Arthritis', 'None'],
  },
  {
    key: 'bloodGroup',
    label: 'Blood group',
    sub: 'Select your blood group if you know it.',
    icon: '🩸',
    iconBg: 'rgba(239,68,68,0.12)',
    color: 'red',
    type: 'blood',
  },
];

const CHIP_COLORS = {
  blue:   { bg: 'rgba(59,130,246,0.12)',  border: 'rgba(59,130,246,0.2)',  text: '#60a5fa' },
  red:    { bg: 'rgba(239,68,68,0.12)',   border: 'rgba(239,68,68,0.2)',   text: '#fb7185' },
  amber:  { bg: 'rgba(251,191,36,0.12)',  border: 'rgba(251,191,36,0.2)',  text: '#fbbf24' },
  purple: { bg: 'rgba(167,139,250,0.12)', border: 'rgba(167,139,250,0.2)', text: '#a78bfa' },
  teal:   { bg: 'rgba(24,182,162,0.12)',  border: 'rgba(24,182,162,0.2)',  text: '#18b6a2' },
};

function Chip({ label, color, onRemove }) {
  const c = CHIP_COLORS[color] || CHIP_COLORS.teal;
  return (
    <motion.span 
      layout
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.8, opacity: 0 }}
      style={{ 
        display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 12px', 
        borderRadius: 99, background: c.bg, border: `1px solid ${c.border}`, 
        color: c.text, fontSize: 11, fontWeight: 600, whiteSpace: 'nowrap'
      }}
    >
      {label}
      {onRemove && (
        <span onClick={(e) => { e.stopPropagation(); onRemove(); }} style={{ width: 14, height: 14, borderRadius: '50%', background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 10, lineHeight: 1 }}>×</span>
      )}
    </motion.span>
  );
}

export default function HealthInfoStepper({ onComplete }) {
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [view, setView] = useState('stepper'); // 'stepper', 'review', 'profile'
  const [done, setDone] = useState(false);
  const inputRef = useRef(null);

  // State for each step
  const [state, setState] = useState({
    currentMedications: [],
    drugAllergies: [],
    foodAllergies: [],
    conditions: [],
    bloodGroup: '',
  });
  const [customInput, setCustomInput] = useState('');

  // Load existing data on mount
  useEffect(() => {
    fetch('/api/profile/patient', { credentials: 'include' })
      .then(r => r.json())
      .then(data => {
        if (data.user) {
          const u = data.user;
          const drugAllergies = Array.isArray(u.allergies)
            ? u.allergies
            : (u.allergies ? u.allergies.split(',').map(s => s.trim()).filter(Boolean) : []);
          
          const hasData = (u.currentMedications?.length > 0 || drugAllergies.length > 0 || u.conditions?.length > 0 || u.bloodGroup);
          
          setState({
            currentMedications: u.currentMedications || [],
            drugAllergies,
            foodAllergies: u.foodAllergies || [],
            conditions: u.conditions || [],
            bloodGroup: u.bloodGroup || '',
          });

          if (hasData) {
            setView('profile');
          }
        }
      })
      .catch(() => {});
  }, []);

  const step = STEPS[currentStep];
  const isLastStep = currentStep === STEPS.length - 1;

  const toggleSuggestion = (val) => {
    if (step.type === 'blood') return;
    const key = step.key;
    if (val === 'None') {
      setState(s => ({ ...s, [key]: ['None'] }));
      return;
    }
    setState(s => {
      const current = s[key].filter(t => t !== 'None');
      const idx = current.indexOf(val);
      if (idx >= 0) {
        return { ...s, [key]: current.filter(t => t !== val) };
      }
      return { ...s, [key]: [...current, val] };
    });
  };

  const addCustom = () => {
    const val = customInput.trim();
    if (!val) return;
    const key = step.key;
    if (!state[key].includes(val)) {
      setState(s => ({ ...s, [key]: [...s[key].filter(t => t !== 'None'), val] }));
    }
    setCustomInput('');
    inputRef.current?.focus();
  };

  const removeTag = (key, val) => {
    setState(s => ({ ...s, [key]: s[key].filter(t => t !== val) }));
  };

  const selectBlood = (g) => {
    setState(s => ({ ...s, bloodGroup: g === 'unknown' ? '' : g }));
  };

  const goNext = () => {
    if (isLastStep) {
      handleSubmit();
    } else {
      setCurrentStep(s => s + 1);
      setCustomInput('');
    }
  };

  const goBack = () => {
    if (currentStep === 0) return;
    setCurrentStep(s => s - 1);
    setCustomInput('');
  };

  const handleSubmit = async () => {
    setSaving(true);
    try {
      const allAllergies = [...new Set([...state.drugAllergies, ...state.foodAllergies])].filter(a => a !== 'None').join(', ');

      const res = await fetch('/api/profile/patient', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          allergies: allAllergies,
          currentMedications: state.currentMedications.filter(m => m !== 'None'),
          conditions: state.conditions.filter(c => c !== 'None'),
          bloodGroup: state.bloodGroup,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save');

      toast.success('Health information updated');
      setDone(true);
      setTimeout(() => {
        setDone(false);
        setView('profile');
      }, 1500);
      if (onComplete) onComplete(data.user);
    } catch (e) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  };

  const editSection = (index) => {
    setCurrentStep(index);
    setView('stepper');
  };

  // --------------------------------------------------------------------------------
  // RENDERING HELPERS
  // --------------------------------------------------------------------------------

  const renderSummaryCard = (s, hideEdit = false) => {
    const values = state[s.key];
    const hasValue = values && (Array.isArray(values) ? values.length > 0 : !!values);
    const color = CHIP_COLORS[s.color];

    return (
      <motion.div 
        key={s.key}
        layout
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        style={{ 
          background: 'rgba(255,255,255,0.03)', 
          border: '1px solid rgba(255,255,255,0.06)', 
          borderRadius: 16, 
          padding: 16,
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
          position: 'relative'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ fontSize: 18 }}>{s.icon}</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.8)' }}>{s.label}</div>
          </div>
          {!hideEdit && (
            <button 
              onClick={() => editSection(STEPS.indexOf(s))}
              style={{ padding: 6, borderRadius: 8, background: 'rgba(255,255,255,0.05)', border: 'none', cursor: 'pointer', color: ACCENT }}
            >
              <Edit2 size={14} />
            </button>
          )}
        </div>
        
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {!hasValue ? (
            <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.2)', fontStyle: 'italic' }}>Not specified</span>
          ) : s.type === 'blood' ? (
            <Chip label={state.bloodGroup} color="red" />
          ) : (
            values.map(v => <Chip key={v} label={v} color={s.color} />)
          )}
        </div>
      </motion.div>
    );
  };

  if (done) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '100px 24px', gap: 20 }}>
        <motion.div 
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          style={{ width: 80, height: 80, borderRadius: '50%', background: 'rgba(24,182,162,0.12)', border: `2px solid ${ACCENT}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <CheckCircle size={40} color={ACCENT} />
        </motion.div>
        <h2 style={{ color: '#fff', fontSize: 24, fontWeight: 900, margin: 0, letterSpacing: '-0.5px' }}>Information Saved!</h2>
      </div>
    );
  }

  if (view === 'profile') {
    return (
      <div style={{ width: '100%', maxWidth: 800, margin: '8px auto 40px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 24 }}>
          <div>
            <h2 style={{ color: '#fff', fontSize: 20, fontWeight: 800, margin: 0 }}>Health Profile</h2>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, margin: '4px 0 0' }}>Manage your medical information for better consultations.</p>
          </div>
          <button 
            onClick={() => setView('stepper')}
            style={{ padding: '8px 16px', borderRadius: 10, background: ACCENT, color: '#fff', border: 'none', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
          >
            Update Profile
          </button>
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          {STEPS.map(s => renderSummaryCard(s))}
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 40, width: '100%', maxWidth: 1000, margin: '0 auto', alignItems: 'start' }}>
      
      {/* LEFT: STEPPER */}
      <div style={{ position: 'sticky', top: 20 }}>
        <AnimatePresence mode="wait">
          {view === 'stepper' && (
            <motion.div
              key="stepper"
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -20, opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              {/* Progress */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32, padding: '0 10px' }}>
                {STEPS.map((s, i) => (
                  <div key={s.key} style={{ display: 'flex', alignItems: 'center', flex: i < STEPS.length - 1 ? 1 : 'none' }}>
                    <div style={{ 
                      width: 32, height: 32, borderRadius: '50%', 
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 13, fontWeight: 800,
                      background: i < currentStep ? ACCENT : i === currentStep ? 'rgba(24,182,162,0.1)' : 'rgba(255,255,255,0.03)',
                      border: `2px solid ${i <= currentStep ? ACCENT : 'rgba(255,255,255,0.1)'}`,
                      color: i <= currentStep ? '#fff' : 'rgba(255,255,255,0.2)',
                      transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
                    }}>
                      {i < currentStep ? '✓' : i + 1}
                    </div>
                    {i < STEPS.length - 1 && (
                      <div style={{ 
                        flex: 1, height: 2, 
                        background: i < currentStep ? ACCENT : 'rgba(255,255,255,0.05)',
                        margin: '0 8px',
                        transition: 'background 0.4s ease'
                      }} />
                    )}
                  </div>
                ))}
              </div>

              <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 24, padding: 32 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 24 }}>
                  <div style={{ width: 48, height: 48, borderRadius: 16, background: step.iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>
                    {step.icon}
                  </div>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: ACCENT, textTransform: 'uppercase', letterSpacing: 1 }}>Section {currentStep + 1} of 5</div>
                    <h2 style={{ color: '#fff', fontSize: 22, fontWeight: 900, margin: 0, letterSpacing: '-0.5px' }}>{step.label}</h2>
                  </div>
                </div>

                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14, lineHeight: 1.6, marginBottom: 24 }}>{step.sub}</p>

                {step.type === 'blood' ? (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
                    {['A+', 'A−', 'B+', 'B−', 'AB+', 'AB−', 'O+', 'O−'].map(g => (
                      <button
                        key={g}
                        onClick={() => selectBlood(g)}
                        style={{
                          padding: '16px 0', borderRadius: 12, border: '1px solid',
                          borderColor: state.bloodGroup === g ? ACCENT : 'rgba(255,255,255,0.05)',
                          background: state.bloodGroup === g ? 'rgba(24,182,162,0.1)' : 'rgba(255,255,255,0.02)',
                          color: state.bloodGroup === g ? '#fff' : 'rgba(255,255,255,0.5)',
                          fontSize: 15, fontWeight: 800, cursor: 'pointer'
                        }}
                      >
                        {g}
                      </button>
                    ))}
                  </div>
                ) : (
                  <>
                    <div style={{ display: 'flex', gap: 10, marginBottom: 24 }}>
                      <input
                        ref={inputRef}
                        value={customInput}
                        onChange={e => setCustomInput(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addCustom(); } }}
                        placeholder={step.placeholder}
                        style={{ flex: 1, background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: '12px 16px', color: '#fff', outline: 'none' }}
                      />
                      <button onClick={addCustom} style={{ padding: '0 20px', borderRadius: 12, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontWeight: 600, cursor: 'pointer' }}>Add</button>
                    </div>

                    <div style={{ marginBottom: 24 }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.2)', textTransform: 'uppercase', marginBottom: 12 }}>Suggestions</div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                        {step.suggestions.map(s => (
                          <button
                            key={s}
                            onClick={() => toggleSuggestion(s)}
                            style={{
                              padding: '6px 14px', borderRadius: 99, border: '1px solid',
                              borderColor: state[step.key].includes(s) ? ACCENT : 'rgba(255,255,255,0.05)',
                              background: state[step.key].includes(s) ? 'rgba(24,182,162,0.08)' : 'transparent',
                              color: state[step.key].includes(s) ? ACCENT : 'rgba(255,255,255,0.3)',
                              fontSize: 12, fontWeight: 700, cursor: 'pointer'
                            }}
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                <div style={{ display: 'flex', gap: 12, marginTop: 40 }}>
                  <button
                    onClick={goBack}
                    disabled={currentStep === 0}
                    style={{ flex: 1, padding: 14, borderRadius: 14, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', visibility: currentStep === 0 ? 'hidden' : 'visible' }}
                  >
                    <ChevronLeft size={20} style={{ verticalAlign: 'middle' }} /> Back
                  </button>
                  <button
                    onClick={goNext}
                    disabled={saving}
                    style={{ flex: 2, padding: 14, borderRadius: 14, background: ACCENT, color: '#fff', border: 'none', fontWeight: 800, cursor: saving ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: saving ? 0.7 : 1 }}
                  >
                    {saving ? 'Saving...' : (isLastStep ? 'Confirm & Save' : 'Continue')} <ChevronRight size={20} />
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* RIGHT: LIVE SUMMARY PANEL */}
      <div style={{ background: 'rgba(0,0,0,0.15)', borderRadius: 24, border: '1px solid rgba(255,255,255,0.05)', padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'rgba(255,255,255,0.5)', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1 }}>
          <AlertCircle size={14} /> LIVE SUMMARY
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <AnimatePresence>
            {STEPS.map(s => renderSummaryCard(s, true))}
          </AnimatePresence>
        </div>

        <div style={{ marginTop: 10, padding: 16, borderRadius: 16, background: 'rgba(24,182,162,0.04)', border: '1px dashed rgba(24,182,162,0.2)' }}>
          <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 12, lineHeight: 1.5, margin: 0 }}>
            Your information is stored securely and only shared with the doctors you book appointments with.
          </p>
        </div>
      </div>

    </div>
  );
}