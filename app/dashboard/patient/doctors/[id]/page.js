'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Star, Clock, Briefcase, Calendar, CheckCircle } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import toast from 'react-hot-toast';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const DEFAULT_SLOTS = ['09:00 AM', '10:00 AM', '11:00 AM', '02:00 PM', '03:00 PM', '04:00 PM', '05:00 PM'];

export default function DoctorProfilePage() {
  const { id } = useParams();
  const { user } = useAuth();
  const router = useRouter();
  const [doctor, setDoctor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedSlot, setSelectedSlot] = useState('');
  const [booking, setBooking] = useState(false);

  useEffect(() => {
    fetch(`/api/doctors/${id}`)
      .then(r => r.json())
      .then(d => { setDoctor(d.doctor); setLoading(false); });
  }, [id]);

  const handleBook = async () => {
    if (!user) { toast.error('Please login to book'); router.push('/login'); return; }
    if (!selectedDate || !selectedSlot) { toast.error('Please select a date and time slot'); return; }
    
    // Future time validation
    const now = new Date();
    const selectedDateTime = new Date(`${selectedDate}T${selectedSlot}:00`);
    if (selectedDateTime <= now) {
      toast.error('For today, please select a future time.');
      return;
    }

    setBooking(true);
    try {
      const res = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ doctorId: id, date: selectedDate, timeSlot: selectedSlot }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success('Appointment booked! Check your email.');
      router.push('/dashboard/patient');
    } catch (err) { toast.error(err.message); }
    finally { setBooking(false); }
  };

  if (loading) return <div style={{ textAlign: 'center', padding: '120px', color: 'var(--text-muted)' }}>Loading...</div>;
  if (!doctor) return <div style={{ textAlign: 'center', padding: '120px', color: 'var(--text-muted)' }}>Doctor not found</div>;

  const initials = doctor.userId?.name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'DR';

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', padding: '32px' }}>
      <div style={{ maxWidth: 900, margin: '0 auto' }}>
        <Link href="/dashboard/patient/doctors" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)', textDecoration: 'none', marginBottom: 24, fontSize: 14 }}>
          <ArrowLeft size={16} /> Back to Doctors
        </Link>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 24 }}>
          {/* Doctor Info */}
          <div>
            <div className="glass-card" style={{ padding: 32, marginBottom: 24 }}>
              <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }}>
                <div style={{ width: 88, height: 88, borderRadius: '50%', background: 'linear-gradient(135deg,#0ea5e9,#06b6d4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, fontWeight: 700, color: 'white', flexShrink: 0 }}>
                  {initials}
                </div>
                <div style={{ flex: 1 }}>
                  <h1 style={{ fontSize: 26, fontWeight: 800, marginBottom: 4 }}>Dr. {doctor.userId?.name}</h1>
                  <p style={{ color: 'var(--accent)', fontWeight: 600, marginBottom: 12 }}>{doctor.specialization}</p>
                  <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, color: 'var(--text-muted)' }}><Star size={15} style={{ color: '#f59e0b' }} /> 4.8 (24 reviews)</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, color: 'var(--text-muted)' }}><Clock size={15} /> {doctor.experience} years experience</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, color: 'var(--text-muted)' }}><Briefcase size={15} /> {doctor.hospital || 'City Hospital'}</span>
                  </div>
                </div>
              </div>
              {doctor.bio && (
                <div style={{ marginTop: 24, paddingTop: 24, borderTop: '1px solid var(--border)' }}>
                  <h3 style={{ fontWeight: 600, marginBottom: 8 }}>About</h3>
                  <p style={{ color: 'var(--text-muted)', lineHeight: 1.7 }}>{doctor.bio}</p>
                </div>
              )}
            </div>
          </div>

          {/* Booking Card */}
          <div>
            <div className="glass-card" style={{ padding: 24, position: 'sticky', top: 24 }}>
              <div style={{ textAlign: 'center', paddingBottom: 20, borderBottom: '1px solid var(--border)', marginBottom: 20 }}>
                <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 4 }}>Consultation Fee</p>
                <p style={{ fontSize: 32, fontWeight: 800, color: '#10b981' }}>₹{doctor.fee}</p>
              </div>

              <div style={{ background: 'rgba(30,41,59,0.5)', borderRadius: 16, border: '1px solid var(--border)', padding: '20px', marginBottom: 24 }}>
                <h3 style={{ fontWeight: 600, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8, fontSize: 15 }}><Calendar size={18} color="var(--accent)" /> Select Date</h3>
                <div style={{ marginBottom: 24 }}>
                  <input 
                    type="date" 
                    className="input"
                    min={new Date().toISOString().split('T')[0]}
                    value={selectedDate}
                    onChange={(e) => { setSelectedDate(e.target.value); }}
                    style={{ width: '100%', padding: '14px', borderRadius: 12, background: 'rgba(15,23,42,0.6)', border: '1px solid var(--border)', color: 'white', fontSize: 14 }}
                  />
                </div>

                <h3 style={{ fontWeight: 600, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8, fontSize: 15 }}><Clock size={18} color="var(--accent)" /> Preferred Time</h3>
                <div>
                  <input 
                    type="time" 
                    className="input"
                    value={selectedSlot}
                    onChange={(e) => setSelectedSlot(e.target.value)}
                    style={{ width: '100%', padding: '14px', borderRadius: 12, background: 'rgba(15,23,42,0.6)', border: '1px solid var(--border)', color: 'white', fontSize: 14 }}
                  />
                  <p style={{ color: 'var(--text-muted)', fontSize: 11, marginTop: 8, paddingLeft: 4 }}>Select any desired consultation time</p>
                </div>
              </div>

              <button className="btn-primary pulse-glow" onClick={handleBook} disabled={booking || !selectedDate || !selectedSlot}
                style={{ width: '100%', justifyContent: 'center', padding: '14px', fontSize: 15 }}>
                {booking ? 'Booking...' : (<><CheckCircle size={18} /> Confirm Booking</>)}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
