'use client';
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import toast from 'react-hot-toast';
import { FileText, Download } from 'lucide-react';

const ACCENT = '#18b6a2';
const card = {
  background: 'rgba(255,255,255,0.02)',
  border: '1px solid rgba(255,255,255,0.2)',
  borderRadius: 16,
};

function initials(name = '') {
  return name.split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase();
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
}

function Chip({ label, color = 'red' }) {
  const colors = {
    red:    { bg: 'rgba(239,68,68,0.1)',   border: 'rgba(239,68,68,0.3)',   text: '#fb7185' },
    amber:  { bg: 'rgba(251,191,36,0.1)',  border: 'rgba(251,191,36,0.3)',  text: '#fbbf24' },
  };
  const c = colors[color] || colors.red;
  return (
    <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 99, background: c.bg, border: `0.5px solid ${c.border}`, color: c.text, fontWeight: 600 }}>
      {label}
    </span>
  );
}

function PrescriptionView({ rx }) {
  const printRef = useRef(null);

  const handleDownload = () => {
    const printContent = printRef.current.innerHTML;
    const w = window.open('', '_blank');
    w.document.write(`
      <html>
        <head>
          <title>${rx.rxNumber}</title>
          <style>
            * { box-sizing: border-box; margin: 0; padding: 0; font-family: Arial, sans-serif; }
            body { padding: 32px; color: #000; background: #fff; }
            h1 { font-size: 22px; font-weight: 900; margin-bottom: 4px; }
            .sub { font-size: 12px; color: #666; margin-bottom: 24px; }
            .grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 20px; }
            .label { font-size: 10px; text-transform: uppercase; letter-spacing: 0.06em; color: #999; margin-bottom: 3px; }
            .val { font-size: 13px; font-weight: 600; color: #000; }
            hr { border: none; border-top: 1px solid #eee; margin: 16px 0; }
            table { width: 100%; border-collapse: collapse; font-size: 12px; }
            th { font-size: 10px; text-transform: uppercase; letter-spacing: 0.06em; color: #999; padding: 8px 6px; text-align: left; border-bottom: 1px solid #eee; }
            td { padding: 8px 6px; border-bottom: 1px solid #f5f5f5; color: #000; }
            .num { width: 20px; height: 20px; border-radius: 50%; background: #e6f1fb; color: #0c447c; font-size: 10px; font-weight: 700; display: inline-flex; align-items: center; justify-content: center; }
            .note { background: #fffbeb; border: 1px solid #fcd34d; border-radius: 8px; padding: 12px; font-size: 12px; color: #92400e; margin-top: 16px; }
            .chip { display: inline-block; font-size: 11px; padding: 2px 10px; border-radius: 99px; background: #fee2e2; color: #991b1b; border: 1px solid #fca5a5; margin: 2px; }
            .footer { margin-top: 40px; display: flex; justify-content: space-between; align-items: flex-end; }
            .sig-line { width: 120px; height: 1px; background: #ccc; margin-bottom: 4px; }
            .sig-label { font-size: 10px; color: #999; }
            .validity { font-size: 11px; color: #999; text-align: right; }
          </style>
        </head>
        <body>${printContent}</body>
      </html>
    `);
    w.document.close();
    setTimeout(() => { w.print(); w.close(); }, 500);
  };

  const snap = rx.patientSnapshot || {};
  const doctorName = rx.doctorUserId?.name || 'Doctor';
  const specialization = rx.doctorProfileId?.specialization || '';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      {/* Download button */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
        <button
          onClick={handleDownload}
          style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 18px', borderRadius: 12, border: `0.5px solid ${ACCENT}`, background: 'rgba(24,182,162,0.08)', color: ACCENT, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
        >
          <Download size={16} /> Download PDF
        </button>
      </div>

      {/* Prescription card */}
      <div className="neon-glass-card obsidian-card" style={{ overflow: 'hidden', borderRadius: 16 }}>
        {/* Header */}
        <div style={{ padding: '18px 22px', borderBottom: '0.5px solid rgba(255,255,255,0.07)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', background: 'rgba(255,255,255,0.015)' }}>
          <div>
            <div style={{ fontSize: 20, fontWeight: 900, color: '#fff' }}>Sanjeevni</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 2 }}>Digital prescription · {rx.rxNumber}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>{formatDate(rx.issuedAt)}</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 2 }}>Valid until {formatDate(rx.validUntil)}</div>
          </div>
        </div>

        {/* Printable content (hidden visually but used for PDF) */}
        <div ref={printRef} style={{ display: 'none' }}>
          <h1>Sanjeevni</h1>
          <div className="sub">Digital Prescription · {rx.rxNumber} · Issued: {formatDate(rx.issuedAt)}</div>
          <div className="grid2">
            <div><div className="label">Patient</div><div className="val">{snap.name || 'Patient'}</div></div>
            <div><div className="label">Doctor</div><div className="val">Dr. {doctorName}</div></div>
            <div><div className="label">Age / gender</div><div className="val">{snap.age ? `${snap.age} yrs` : '—'} · {snap.gender || '—'}</div></div>
            <div><div className="label">Specialization</div><div className="val">{specialization || '—'}</div></div>
            <div><div className="label">Blood group</div><div className="val">{snap.bloodGroup || '—'}</div></div>
            <div><div className="label">Diagnosis</div><div className="val">{rx.diagnosis}</div></div>
          </div>
          {snap.allergies?.length > 0 && (
            <div style={{marginBottom:12}}>
              <div className="label">Known drug allergies</div>
              {snap.allergies.map(a => <span key={a} className="chip">{a}</span>)}
            </div>
          )}
          <hr />
          <table>
            <thead><tr><th>#</th><th>Medicine</th><th>Dosage</th><th>Frequency</th><th>Duration</th><th>Instructions</th></tr></thead>
            <tbody>
              {(rx.medicines || []).map((m, i) => (
                <tr key={i}>
                  <td><span className="num">{i + 1}</span></td>
                  <td>{m.name}</td><td>{m.dosage}</td><td>{m.frequency}</td><td>{m.duration}</td><td>{m.instructions}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {rx.doctorNotes && <div className="note"><strong>Doctor&apos;s notes:</strong> {rx.doctorNotes}</div>}
          <div className="footer">
            <div><div className="sig-line"></div><div className="sig-label">Dr. {doctorName} · {specialization}</div></div>
            <div className="validity">Valid for 30 days from issue date</div>
          </div>
        </div>

        {/* Visible prescription */}
        <div style={{ padding: '18px 22px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 18 }}>
            {[
              { label: 'Patient', value: snap.name || 'Patient' },
              { label: 'Doctor', value: `Dr. ${doctorName}` },
              { label: 'Age / gender', value: `${snap.age ? snap.age + ' yrs' : '—'} · ${snap.gender || '—'}` },
              { label: 'Specialization', value: specialization || '—' },
              { label: 'Blood group', value: snap.bloodGroup || '—' },
              { label: 'Diagnosis', value: rx.diagnosis },
            ].map(({ label, value }) => (
              <div key={label}>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 3 }}>{label}</div>
                <div style={{ fontSize: 13, color: '#fff', fontWeight: 600 }}>{value}</div>
              </div>
            ))}
          </div>

          {snap.allergies?.length > 0 && (
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Known allergies</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {snap.allergies.map(a => <Chip key={a} label={a} color="red" />)}
              </div>
            </div>
          )}

          <div style={{ height: '0.5px', background: 'rgba(255,255,255,0.07)', marginBottom: 14 }} />

          {/* Medicines table */}
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, marginBottom: 14 }}>
            <thead>
              <tr>
                {['#', 'Medicine', 'Dosage', 'Frequency', 'Duration', 'Instructions'].map(h => (
                  <th key={h} style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'rgba(255,255,255,0.25)', padding: '6px 8px', textAlign: 'left', borderBottom: '0.5px solid rgba(255,255,255,0.07)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(rx.medicines || []).map((m, i) => (
                <tr key={i}>
                  <td style={{ padding: '8px 8px', borderBottom: '0.5px solid rgba(255,255,255,0.04)' }}>
                    <div style={{ width: 20, height: 20, borderRadius: '50%', background: 'rgba(24,182,162,0.15)', color: ACCENT, fontSize: 10, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{i + 1}</div>
                  </td>
                  {[m.name, m.dosage, m.frequency, m.duration, m.instructions].map((val, j) => (
                    <td key={j} style={{ padding: '8px 8px', color: '#fff', fontSize: 12, borderBottom: '0.5px solid rgba(255,255,255,0.04)' }}>{val || '—'}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>

          {rx.doctorNotes && (
            <div style={{ background: 'rgba(251,191,36,0.06)', border: '0.5px solid rgba(251,191,36,0.2)', borderRadius: 10, padding: '12px 14px', fontSize: 12, color: 'rgba(255,255,255,0.7)', lineHeight: 1.6 }}>
              <span style={{ fontWeight: 700, color: '#fbbf24' }}>Doctor's notes: </span>{rx.doctorNotes}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: '12px 22px', borderTop: '0.5px solid rgba(255,255,255,0.07)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.01)' }}>
          <div>
            <div style={{ width: 100, height: '0.5px', background: 'rgba(255,255,255,0.2)', marginBottom: 4 }} />
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>Dr. {doctorName} · {specialization}</div>
          </div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>Valid for 30 days</div>
        </div>
      </div>
    </div>
  );
}

export default function PatientPrescriptionsPage() {
  const { user } = useAuth();
  const [prescriptions, setPrescriptions] = useState([]);
  const [selectedRx, setSelectedRx] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/prescriptions/patient', { credentials: 'include' })
      .then(r => r.json())
      .then(data => {
        if (data.prescriptions) {
          setPrescriptions(data.prescriptions);
          if (data.prescriptions.length > 0) setSelectedRx(data.prescriptions[0]);
        }
      })
      .catch(() => toast.error('Failed to load prescriptions'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', color: 'rgba(255,255,255,0.4)' }}>
      Loading prescriptions...
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, width: '100%', paddingBottom: 80 }}>
      <div>
        <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.2em', color: 'rgba(255,255,255,0.2)', marginBottom: 4 }}>Patient Portal</div>
        <h1 style={{ fontSize: 26, fontWeight: 900, color: '#fff', letterSpacing: '-0.5px', margin: 0 }}>My Prescriptions</h1>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: 20, alignItems: 'start' }}>

        {/* Sidebar */}
        <div className="neon-glass-card obsidian-card" style={{ overflow: 'hidden' }}>
          <div style={{ padding: '16px 18px', borderBottom: '0.5px solid rgba(255,255,255,0.07)', fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            {prescriptions.length} prescription{prescriptions.length !== 1 ? 's' : ''}
          </div>
          {prescriptions.length === 0 ? (
            <div style={{ padding: 24, color: 'rgba(255,255,255,0.3)', fontSize: 13 }}>No prescriptions yet.</div>
          ) : prescriptions.map(rx => (
            <button
              key={rx._id}
              onClick={() => setSelectedRx(rx)}
              style={{
                width: '100%', padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 12,
                background: selectedRx?._id === rx._id ? 'rgba(24,182,162,0.08)' : 'transparent',
                border: 'none', borderBottom: '0.5px solid rgba(255,255,255,0.05)',
                borderLeft: selectedRx?._id === rx._id ? `3px solid ${ACCENT}` : '3px solid transparent',
                cursor: 'pointer', textAlign: 'left',
              }}
            >
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(24,182,162,0.15)', color: ACCENT, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <FileText size={16} />
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ color: '#fff', fontSize: 13, fontWeight: 700 }}>Dr. {rx.doctorUserId?.name || 'Doctor'}</div>
                <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, marginTop: 1 }}>{formatDate(rx.issuedAt)}</div>
                <div style={{ color: ACCENT, fontSize: 10, marginTop: 1 }}>{rx.rxNumber}</div>
              </div>
            </button>
          ))}
        </div>

        {/* Main content */}
        {!selectedRx ? (
          <div className="neon-glass-card obsidian-card" style={{ padding: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12, minHeight: 300 }}>
            <FileText size={32} color="rgba(255,255,255,0.15)" />
            <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 14 }}>Select a prescription to view</div>
          </div>
        ) : (
          <PrescriptionView rx={selectedRx} />
        )}
      </div>
    </div>
  );
}