'use client';
import { useRef } from 'react';
import { X, Download, FileText } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const ACCENT = '#18b6a2';

function formatDate(dateStr) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
}

export default function PrescriptionModal({ rx, onClose }) {
  const printRef = useRef(null);

  if (!rx) return null;

  const handleDownload = () => {
    const printContent = printRef.current.innerHTML;
    const w = window.open('', '_blank');
    w.document.write(`
      <html>
        <head>
          <title>Prescription ${rx.rxNumber}</title>
          <style>
            * { box-sizing: border-box; margin: 0; padding: 0; font-family: Arial, sans-serif; }
            body { padding: 40px; color: #000; background: #fff; line-height: 1.5; }
            h1 { font-size: 26px; font-weight: 900; margin-bottom: 4px; color: #18b6a2; }
            .sub { font-size: 11px; color: #666; margin-bottom: 32px; text-transform: uppercase; letter-spacing: 0.1em; }
            .grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 30px; }
            .item { margin-bottom: 12px; }
            .label { font-size: 9px; text-transform: uppercase; letter-spacing: 0.1em; color: #999; margin-bottom: 4px; }
            .val { font-size: 14px; font-weight: 600; color: #000; }
            hr { border: none; border-top: 1px solid #eee; margin: 24px 0; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; }
            th { font-size: 9px; text-transform: uppercase; letter-spacing: 0.1em; color: #999; padding: 12px 8px; text-align: left; border-bottom: 2px solid #eee; }
            td { padding: 12px 8px; border-bottom: 1px solid #f5f5f5; color: #000; font-size: 13px; }
            .num { width: 22px; height: 22px; border-radius: 50%; background: #e6f1fb; color: #0c447c; font-size: 11px; font-weight: 700; display: inline-flex; align-items: center; justify-content: center; }
            .note { background: #fffbeb; border: 1px solid #fcd34d; border-radius: 10px; padding: 16px; font-size: 13px; color: #92400e; margin-top: 24px; }
            .footer { margin-top: 60px; display: flex; justify-content: space-between; align-items: flex-end; }
            .sig-line { width: 160px; height: 1.5px; background: #000; margin-bottom: 6px; }
            .sig-label { font-size: 11px; font-weight: 700; color: #000; }
            .sig-sub { font-size: 10px; color: #666; margin-top: 2px; }
            .validity { font-size: 11px; color: #999; }
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
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000, 
        background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24
      }}
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        exit={{ scale: 0.9, y: 20, opacity: 0 }}
        style={{
          width: '100%', maxWidth: 800, maxHeight: '90vh', overflowY: 'auto',
          background: '#0a0a0a', border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 24, padding: 0, position: 'relative'
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(255,255,255,0.02)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(24,182,162,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <FileText size={20} color={ACCENT} />
            </div>
            <div>
              <div style={{ color: '#fff', fontSize: 16, fontWeight: 800 }}>Prescription Details</div>
              <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12 }}>{rx.rxNumber}</div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button
              onClick={handleDownload}
              style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px', borderRadius: 10, background: ACCENT, color: '#fff', border: 'none', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
            >
              <Download size={16} /> Download PDF
            </button>
            <button
              onClick={onClose}
              style={{ padding: 8, borderRadius: '50%', background: 'rgba(255,255,255,0.05)', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer' }}
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div style={{ padding: 32 }}>
          {/* Printable (Hidden) */}
          <div ref={printRef} style={{ display: 'none' }}>
            <h1>Sanjeevni</h1>
            <div className="sub">Digital Prescription · {rx.rxNumber} · Issued: {formatDate(rx.issuedAt)}</div>
            <div className="grid2">
              <div className="item"><div className="label">Patient Name</div><div className="val">{snap.name}</div></div>
              <div className="item"><div className="label">Doctor Name</div><div className="val">Dr. {doctorName}</div></div>
              <div className="item"><div className="label">Age / Gender</div><div className="val">{snap.age ? `${snap.age} Yrs` : '—'} · {snap.gender || '—'}</div></div>
              <div className="item"><div className="label">Specialization</div><div className="val">{specialization}</div></div>
              <div className="item"><div className="label">Blood Group</div><div className="val">{snap.bloodGroup || '—'}</div></div>
              <div className="item"><div className="label">Diagnosis</div><div className="val">{rx.diagnosis}</div></div>
            </div>
            <hr />
            <table>
              <thead><tr><th>#</th><th>Medicine Name</th><th>Dosage</th><th>Frequency</th><th>Duration</th><th>Instructions</th></tr></thead>
              <tbody>
                {rx.medicines.map((m, i) => (
                  <tr key={i}>
                    <td><span className="num">{i + 1}</span></td>
                    <td>{m.name}</td><td>{m.dosage}</td><td>{m.frequency}</td><td>{m.duration}</td><td>{m.instructions}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {rx.doctorNotes && <div className="note"><strong>Doctor's Notes:</strong><br/>{rx.doctorNotes}</div>}
            <div className="footer">
              <div>
                <div className="sig-line"></div>
                <div className="sig-label">Digital Signature</div>
                <div className="sig-sub">Dr. {doctorName} · {specialization}</div>
              </div>
              <div className="validity">Valid for 30 days from issued date</div>
            </div>
          </div>

          {/* Visible in Dialog */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 32 }}>
            {[
              { label: 'Patient', value: snap.name },
              { label: 'Diagnosis', value: rx.diagnosis },
              { label: 'Issued On', value: formatDate(rx.issuedAt) },
              { label: 'Blood Group', value: snap.bloodGroup || 'Not Specified' },
            ].map(item => (
              <div key={item.label}>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>{item.label}</div>
                <div style={{ fontSize: 14, color: '#fff', fontWeight: 600 }}>{item.value}</div>
              </div>
            ))}
          </div>

          <div style={{ marginBottom: 32 }}>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 16 }}>Medicines</div>
            <div style={{ borderRadius: 16, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.06)' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: 'rgba(255,255,255,0.02)' }}>
                    {['#', 'Medicine', 'Dosage', 'Frequency', 'Duration'].map(h => (
                      <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 10, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rx.medicines.map((m, i) => (
                    <tr key={i} style={{ borderBottom: i === rx.medicines.length - 1 ? 'none' : '1px solid rgba(255,255,255,0.04)' }}>
                      <td style={{ padding: '14px 16px', color: 'rgba(255,255,255,0.4)', fontSize: 12 }}>{i + 1}</td>
                      <td style={{ padding: '14px 16px', color: '#fff', fontSize: 13, fontWeight: 600 }}>{m.name}</td>
                      <td style={{ padding: '14px 16px', color: 'rgba(255,255,255,0.7)', fontSize: 13 }}>{m.dosage}</td>
                      <td style={{ padding: '14px 16px', color: 'rgba(255,255,255,0.7)', fontSize: 13 }}>{m.frequency}</td>
                      <td style={{ padding: '14px 16px', color: 'rgba(255,255,255,0.7)', fontSize: 13 }}>{m.duration}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {rx.doctorNotes && (
            <div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>Doctor's Notes</div>
              <div style={{ padding: 16, borderRadius: 12, background: 'rgba(251,191,36,0.05)', border: '1px solid rgba(251,191,36,0.1)', color: 'rgba(255,255,255,0.7)', fontSize: 13, lineHeight: 1.6 }}>
                {rx.doctorNotes}
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
