'use client';
import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { Search, Star, Clock, DollarSign, Stethoscope, ArrowLeft } from 'lucide-react';
import { useSearchParams } from 'next/navigation';

const SPECIALTIES = ['All', 'Cardiologist', 'Dermatologist', 'Neurologist', 'Pediatrician', 'Psychiatrist', 'Orthopedic', 'General Physician', 'Gynecologist'];

export default function DoctorsPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', background: 'var(--bg-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>Loading...</div>}>
      <DoctorsContent />
    </Suspense>
  );
}

function DoctorsContent() {
  const searchParams = useSearchParams();
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [specialty, setSpecialty] = useState(searchParams.get('specialization') || 'All');

  useEffect(() => {
    fetchDoctors();
  }, [specialty]);

  const fetchDoctors = async () => {
    setLoading(true);
    const params = new URLSearchParams({ specialization: specialty });
    if (search) params.set('search', search);
    const res = await fetch(`/api/doctors?${params}`);
    const data = await res.json();
    setDoctors(data.doctors || []);
    setLoading(false);
  };

  const cleanSearch = search.toLowerCase().replace(/[\s.]/g, '');
  const filtered = doctors.filter(d => {
    if (!cleanSearch) return true;
    const rawName = d.userId?.name?.toLowerCase() || '';
    const nameWithoutSpaces = rawName.replace(/[\s.]/g, '');
    const nameWithDr = `dr${nameWithoutSpaces}`;
    const spec = d.specialization?.toLowerCase().replace(/[\s.]/g, '') || '';
    
    return nameWithoutSpaces.includes(cleanSearch) || 
           nameWithDr.includes(cleanSearch) || 
           spec.includes(cleanSearch);
  });

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)' }}>
      {/* Header */}
      <div style={{ background: 'rgba(15,23,42,0.9)', borderBottom: '1px solid var(--border)', padding: '20px 32px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)', textDecoration: 'none', marginBottom: 16, fontSize: 14 }}>
            <ArrowLeft size={16} /> Back to Home
          </Link>
          <h1 style={{ fontSize: 32, fontWeight: 800, marginBottom: 8 }}>Find a Doctor</h1>
          <p style={{ color: 'var(--text-muted)' }}>Browse and book from our verified medical professionals</p>
        </div>
      </div>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '32px' }}>
        {/* Search bar */}
        <div style={{ 
          position: 'relative', 
          marginBottom: 32, 
          background: 'rgba(30,41,59,0.5)', 
          backdropFilter: 'blur(12px)',
          borderRadius: 16,
          padding: 8,
          border: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          transition: 'all 0.3s ease',
          boxShadow: '0 4px 24px rgba(0,0,0,0.2)'
        }}
        className="search-container"
        >
          <div style={{ paddingLeft: 12, color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}>
            <Search size={20} />
          </div>
          <input
            type="text" 
            placeholder="Search by name, specialty, or condition..." 
            value={search}
            onChange={e => setSearch(e.target.value)} 
            onKeyDown={e => e.key === 'Enter' && fetchDoctors()}
            style={{ 
              flex: 1,
              background: 'transparent',
              border: 'none',
              padding: '12px 8px',
              color: 'var(--text-primary)',
              fontSize: 16,
              outline: 'none',
              width: '100%'
            }}
          />
          <button 
            onClick={fetchDoctors}
            className="btn-primary"
            style={{ 
              padding: '10px 24px', 
              borderRadius: 12,
              fontSize: 14,
              height: '100%'
            }}
          >
            Search
          </button>
        </div>

        <style>{`
          .search-container:focus-within {
            border-color: var(--accent) !important;
            box-shadow: 0 0 0 4px rgba(14,165,233,0.15), 0 8px 32px rgba(0,0,0,0.3) !important;
            background: rgba(30,41,59,0.7) !important;
          }
          @keyframes spin { to { transform: rotate(360deg); } }
        `}</style>

        {/* Specialty filters */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 32 }}>
          {SPECIALTIES.map(s => (
            <button key={s} onClick={() => setSpecialty(s)} style={{
              padding: '8px 18px', borderRadius: 50, border: 'none', cursor: 'pointer', fontWeight: 500, fontSize: 13, transition: 'all 0.2s',
              background: specialty === s ? 'linear-gradient(135deg,#0ea5e9,#06b6d4)' : 'rgba(30,41,59,0.8)',
              color: specialty === s ? 'white' : 'var(--text-muted)',
              border: specialty === s ? 'none' : '1px solid var(--border)',
            }}>{s}</button>
          ))}
        </div>

        {/* Doctors grid */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '80px 0', color: 'var(--text-muted)' }}>
            <div style={{ width: 40, height: 40, border: '3px solid var(--border)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px' }} />
            Loading doctors...
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 0', color: 'var(--text-muted)' }}>
            <Stethoscope size={48} style={{ margin: '0 auto 16px', opacity: 0.3 }} />
            <p>No doctors found. Try a different specialty.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 24 }}>
            {filtered.map((doctor, i) => (
              <DoctorCard key={doctor._id} doctor={doctor} index={i} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function DoctorCard({ doctor, index }) {
  const initials = doctor.userId?.name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'DR';
  return (
    <div className="glass-card fade-in" style={{ padding: 24, animationDelay: `${index * 0.05}s`, transition: 'transform 0.2s, box-shadow 0.2s' }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 20px 40px rgba(14,165,233,0.15)'; }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}>
      <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
        <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'linear-gradient(135deg,#0ea5e9,#06b6d4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 700, color: 'white', flexShrink: 0 }}>
          {initials}
        </div>
        <div>
          <h3 style={{ fontWeight: 700, fontSize: 17, marginBottom: 2 }}>Dr. {doctor.userId?.name}</h3>
          <p style={{ color: 'var(--accent)', fontSize: 13, fontWeight: 500 }}>{doctor.specialization}</p>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 16, marginBottom: 16, flexWrap: 'wrap' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, color: 'var(--text-muted)' }}>
          <Star size={13} style={{ color: '#f59e0b' }} /> {doctor.rating > 0 ? doctor.rating : '4.8'} ({doctor.totalReviews || 24})
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, color: 'var(--text-muted)' }}>
          <Clock size={13} /> {doctor.experience} yrs exp
        </span>
      </div>
      {doctor.bio && <p style={{ color: 'var(--text-muted)', fontSize: 13, lineHeight: 1.5, marginBottom: 16, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{doctor.bio}</p>}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 16, borderTop: '1px solid var(--border)' }}>
        <span style={{ fontSize: 18, fontWeight: 700, color: '#10b981' }}>₹{doctor.fee}</span>
        <Link href={`/doctors/${doctor._id}`} className="btn-primary" style={{ textDecoration: 'none', padding: '8px 18px', fontSize: 13 }}>
          Book Now →
        </Link>
      </div>
    </div>
  );
}
