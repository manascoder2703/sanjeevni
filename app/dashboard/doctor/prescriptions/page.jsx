'use client';
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import toast from 'react-hot-toast';
import { Plus, Trash2, FileText, User, AlertTriangle, ChevronDown, ChevronUp, Eye } from 'lucide-react';
import { AnimatePresence } from 'framer-motion';
import PrescriptionModal from '@/components/PrescriptionModal';

const ACCENT = '#18b6a2';
const card = {
  background: 'rgba(255,255,255,0.02)',
  border: '0.5px solid rgba(255,255,255,0.07)',
  borderRadius: 16,
};

function initials(name = '') {
  return name.split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase();
}

function Chip({ label, color = 'teal' }) {
  const colors = {
    teal:   { bg: 'rgba(24,182,162,0.1)',  border: 'rgba(24,182,162,0.3)',  text: '#18b6a2' },
    red:    { bg: 'rgba(239,68,68,0.1)',   border: 'rgba(239,68,68,0.3)',   text: '#fb7185' },
    amber:  { bg: 'rgba(251,191,36,0.1)',  border: 'rgba(251,191,36,0.3)',  text: '#fbbf24' },
    purple: { bg: 'rgba(167,139,250,0.1)', border: 'rgba(167,139,250,0.3)', text: '#a78bfa' },
  };
  const c = colors[color] || colors.teal;
  return (
    <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 99, background: c.bg, border: `0.5px solid ${c.border}`, color: c.text, fontWeight: 600 }}>
      {label}
    </span>
  );
}

const EMPTY_MEDICINE = { name: '', dosage: '', frequency: '', duration: '', instructions: '' };

export default function DoctorPrescriptionsPage() {
  const { user } = useAuth();
  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showSafetyPanel, setShowSafetyPanel] = useState(true);
  const [viewingRx, setViewingRx] = useState(null);

  const [form, setForm] = useState({
    diagnosis: '',
    medicines: [{ ...EMPTY_MEDICINE }],
    doctorNotes: '',
  });

  const fetchPatients = useCallback(async () => {
    try {
      const res = await fetch('/api/prescriptions/doctor', { credentials: 'include' });
      const data = await res.json();
      if (res.ok) setPatients(data.patients || []);
    } catch (e) {
      toast.error('Failed to load patients');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchPatients(); }, [fetchPatients]);

  const selectPatient = (patient) => {
    setSelectedPatient(patient);
    setForm({ diagnosis: '', medicines: [{ ...EMPTY_MEDICINE }], doctorNotes: '' });
  };

  const addMedicine = () => {
    setForm(f => ({ ...f, medicines: [...f.medicines, { ...EMPTY_MEDICINE }] }));
  };

  const removeMedicine = (i) => {
    setForm(f => ({ ...f, medicines: f.medicines.filter((_, idx) => idx !== i) }));
  };

  const updateMedicine = (i, field, value) => {
    setForm(f => {
      const meds = [...f.medicines];
      meds[i] = { ...meds[i], [field]: value };
      return { ...f, medicines: meds };
    });
  };

  const handleSubmit = async () => {
    if (!selectedPatient) return toast.error('Select a patient first');
    if (!form.diagnosis.trim()) return toast.error('Diagnosis is required');
    if (form.medicines.some(m => !m.name.trim())) return toast.error('All medicine names are required');

    setSaving(true);
    try {
      const res = await fetch('/api/prescriptions/doctor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          patientUserId: selectedPatient._id,
          diagnosis: form.diagnosis,
          medicines: form.medicines,
          doctorNotes: form.doctorNotes,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create prescription');
      toast.success('Prescription issued successfully');
      setForm({ diagnosis: '', medicines: [{ ...EMPTY_MEDICINE }], doctorNotes: '' });
      fetchPatients();
    } catch (e) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  };

  const inp = {
    style: {
      width: '100%', background: 'rgba(255,255,255,0.03)', border: '0.5px solid rgba(255,255,255,0.08)',
      borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#fff', outline: 'none', boxSizing: 'border-box',
    },
  };

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', color: 'rgba(255,255,255,0.4)' }}>
      Loading patients...
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, width: '100%', paddingBottom: 80 }}>
      <div>
        <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.2em', color: 'rgba(255,255,255,0.2)', marginBottom: 4 }}>Doctor Portal</div>
        <h1 style={{ fontSize: 26, fontWeight: 900, color: '#fff', letterSpacing: '-0.5px', margin: 0 }}>Prescriptions</h1>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 20, alignItems: 'start' }}>

        {/* Patient list */}
        <div style={{ ...card, overflow: 'hidden' }}>
          <div style={{ padding: '16px 18px', borderBottom: '0.5px solid rgba(255,255,255,0.07)', fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            Confirmed patients ({patients.length})
          </div>
          {patients.length === 0 ? (
            <div style={{ padding: 24, color: 'rgba(255,255,255,0.3)', fontSize: 13 }}>No confirmed patients yet.</div>
          ) : patients.map(p => (
            <div
              key={p._id}
              onClick={() => selectPatient(p)}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); selectPatient(p); } }}
              tabIndex={0}
              role="button"
              style={{
                width: '100%', padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 12,
                background: selectedPatient?._id === p._id ? 'rgba(24,182,162,0.1)' : 'transparent',
                border: 'none', borderBottom: '0.5px solid rgba(255,255,255,0.05)',
                borderLeft: selectedPatient?._id === p._id ? `3px solid ${ACCENT}` : '3px solid transparent',
                cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s',
                boxSizing: 'border-box',
              }}
            >
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: ACCENT, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800, flexShrink: 0 }}>
                {initials(p.name)}
              </div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ color: '#fff', fontSize: 13, fontWeight: 700 }}>{p.name}</div>
                <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11 }}>
                  {p.age ? `${p.age} yrs · ` : ''}{p.gender || 'Unknown'}
                </div>
                {p.latestRx && (
                  <button 
                    onClick={(e) => { e.stopPropagation(); setViewingRx(p.latestRx); }}
                    style={{ 
                      display: 'flex', alignItems: 'center', gap: 4, marginTop: 6,
                      padding: '4px 10px', borderRadius: 8, background: 'rgba(24,182,162,0.08)',
                      border: '1px solid rgba(24,182,162,0.2)', color: ACCENT, 
                      fontSize: 10, fontWeight: 700, cursor: 'pointer',
                      transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                    }}
                    onMouseOver={e => { 
                      e.currentTarget.style.background = ACCENT; 
                      e.currentTarget.style.color = '#fff';
                      e.currentTarget.style.transform = 'translateY(-1px)';
                      e.currentTarget.style.boxShadow = `0 4px 12px ${ACCENT}44`;
                    }}
                    onMouseOut={e => { 
                      e.currentTarget.style.background = 'rgba(24,182,162,0.08)'; 
                      e.currentTarget.style.color = ACCENT;
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    <Eye size={12} /> View Last Rx
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Right panel */}
        {!selectedPatient ? (
          <div style={{ ...card, padding: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12, minHeight: 300 }}>
            <FileText size={32} color="rgba(255,255,255,0.15)" />
            <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 14 }}>Select a patient to write a prescription</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* Patient info */}
            <div style={{ ...card, padding: '18px 22px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 14 }}>
                <div style={{ width: 48, height: 48, borderRadius: '50%', background: ACCENT, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 800 }}>
                  {initials(selectedPatient.name)}
                </div>
                <div>
                  <div style={{ color: '#fff', fontSize: 16, fontWeight: 800 }}>{selectedPatient.name}</div>
                  <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12 }}>
                    {selectedPatient.age ? `${selectedPatient.age} years · ` : ''}{selectedPatient.gender || ''} {selectedPatient.bloodGroup ? `· ${selectedPatient.bloodGroup}` : ''}
                  </div>
                </div>
              </div>
            </div>

            {/* Safety panel */}
            <div style={{ background: 'rgba(239,68,68,0.05)', border: '0.5px solid rgba(239,68,68,0.2)', borderRadius: 16, overflow: 'hidden' }}>
              <button
                onClick={() => setShowSafetyPanel(s => !s)}
                style={{ width: '100%', padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'transparent', border: 'none', cursor: 'pointer' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <AlertTriangle size={16} color="#fb7185" />
                  <span style={{ color: '#fb7185', fontSize: 13, fontWeight: 700 }}>Patient safety info — read before prescribing</span>
                </div>
                {showSafetyPanel ? <ChevronUp size={16} color="#fb7185" /> : <ChevronDown size={16} color="#fb7185" />}
              </button>

              {showSafetyPanel && (
                <div style={{ padding: '0 18px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {[
                    { label: 'Drug allergies', items: selectedPatient.allergies, color: 'red' },
                    { label: 'Current medications', items: selectedPatient.currentMedications, color: 'amber' },
                    { label: 'Conditions', items: selectedPatient.conditions, color: 'purple' },
                  ].map(row => (
                    <div key={row.label} style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                      <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.06em', minWidth: 120, paddingTop: 3 }}>{row.label}</span>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                        {row.items?.length > 0
                          ? row.items.map(item => <Chip key={item} label={item} color={row.color} />)
                          : <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.2)', fontStyle: 'italic' }}>None reported</span>
                        }
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Prescription form */}
            <div style={{ ...card, padding: '18px 22px' }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 16 }}>Prescription details</div>

              {/* Diagnosis */}
              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Diagnosis *</label>
                <input {...inp} value={form.diagnosis} onChange={e => setForm(f => ({ ...f, diagnosis: e.target.value }))} placeholder="e.g. Acute pharyngitis with mild fever" />
              </div>

              {/* Medicines */}
              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', display: 'block', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Medicines *</label>

                {/* Header */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px 80px 80px 120px 32px', gap: 6, marginBottom: 6 }}>
                  {['Medicine name', 'Dosage', 'Frequency', 'Duration', 'Instructions', ''].map(h => (
                    <div key={h} style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</div>
                  ))}
                </div>

                {form.medicines.map((med, i) => (
                  <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 80px 80px 80px 120px 32px', gap: 6, marginBottom: 8 }}>
                    <input {...inp} value={med.name} onChange={e => updateMedicine(i, 'name', e.target.value)} placeholder="Amoxicillin 500mg" />
                    <input {...inp} value={med.dosage} onChange={e => updateMedicine(i, 'dosage', e.target.value)} placeholder="500mg" />
                    <input {...inp} value={med.frequency} onChange={e => updateMedicine(i, 'frequency', e.target.value)} placeholder="1-0-1" />
                    <input {...inp} value={med.duration} onChange={e => updateMedicine(i, 'duration', e.target.value)} placeholder="5 days" />
                    <input {...inp} value={med.instructions} onChange={e => updateMedicine(i, 'instructions', e.target.value)} placeholder="After food" />
                    <button
                      onClick={() => removeMedicine(i)}
                      disabled={form.medicines.length === 1}
                      style={{ width: 32, height: 38, borderRadius: 8, border: '0.5px solid rgba(255,255,255,0.1)', background: 'transparent', color: 'rgba(255,255,255,0.3)', cursor: form.medicines.length === 1 ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}

                <button
                  onClick={addMedicine}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 10, border: `0.5px solid ${ACCENT}`, background: 'rgba(24,182,162,0.08)', color: ACCENT, fontSize: 12, fontWeight: 600, cursor: 'pointer', marginTop: 4 }}
                >
                  <Plus size={14} /> Add medicine
                </button>
              </div>

              {/* Notes */}
              <div style={{ marginBottom: 20 }}>
                <label style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Notes for patient</label>
                <textarea
                  value={form.doctorNotes}
                  onChange={e => setForm(f => ({ ...f, doctorNotes: e.target.value }))}
                  placeholder="e.g. Take medicines after food. Avoid cold drinks. Follow up in 5 days if symptoms persist."
                  rows={3}
                  style={{ ...inp.style, resize: 'none', lineHeight: 1.6 }}
                />
              </div>

              <button
                onClick={handleSubmit}
                disabled={saving}
                style={{ width: '100%', padding: 14, borderRadius: 12, border: 'none', background: ACCENT, color: '#fff', fontSize: 14, fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1 }}
              >
                {saving ? 'Issuing prescription...' : 'Issue Prescription'}
              </button>
            </div>
          </div>
        )}
      </div>

      <AnimatePresence>
        {viewingRx && (
          <PrescriptionModal rx={viewingRx} onClose={() => setViewingRx(null)} />
        )}
      </AnimatePresence>
    </div>
  );
}