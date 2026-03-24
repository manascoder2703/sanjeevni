'use client';
import { useState, useEffect, useMemo } from 'react';
import { useNotifications } from '@/context/NotificationContext';
import { Search, Star, Stethoscope, SlidersHorizontal, X, PhoneOff } from 'lucide-react';
import Link from 'next/link';

const specialties = [
  'All Specialists',
  'Cardiologist',
  'Dermatologist',
  'Neurologist',
  'Pediatrician',
  'Psychiatrist',
  'Orthopedic',
  'General Physician',
  'Gynecologist'
];

const AVATAR_COLORS = [
  { bg: 'rgba(59,130,246,0.2)',  text: '#60a5fa' },
  { bg: 'rgba(139,92,246,0.2)', text: '#a78bfa' },
  { bg: 'rgba(34,197,94,0.2)',  text: '#4ade80' },
  { bg: 'rgba(249,115,22,0.2)', text: '#fb923c' },
  { bg: 'rgba(236,72,153,0.2)', text: '#f472b6' },
  { bg: 'rgba(20,184,166,0.2)', text: '#2dd4bf' },
  { bg: 'rgba(244,63,94,0.2)',  text: '#fb7185' },
  { bg: 'rgba(6,182,212,0.2)',  text: '#22d3ee' },
];

const relatedConditions = {
  'Cardiologist':      ['Heart failure', 'Arrhythmia'],
  'Dermatologist':     ['Acne', 'Psoriasis'],
  'Neurologist':       ['Migraine', 'Epilepsy'],
  'Pediatrician':      ['Child health', 'Vaccines'],
  'Psychiatrist':      ['Anxiety', 'Depression'],
  'Orthopedic':        ['Joint pain', 'Fractures'],
  'General Physician': ['Fever', 'Diabetes'],
  'Gynecologist':      ['Prenatal', 'PCOS'],
};

function getAvatarColor(name = '') {
  return AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length];
}

function getInitials(name = '') {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

// Fuzzy name match — strips spaces and does case-insensitive match
function fuzzyNameMatch(fullName = '', query = '') {
  if (!query) return true;
  const normalize = s => s.toLowerCase().replace(/\s+/g, '');
  const normalizedName  = normalize(fullName);
  const normalizedQuery = normalize(query);
  // Also check each word individually
  const words = fullName.toLowerCase().split(/\s+/);
  return normalizedName.includes(normalizedQuery) ||
    words.some(w => w.startsWith(normalizedQuery));
}

export default function FindDoctors() {
  const [doctors, setDoctors]               = useState([]);
  const [loading, setLoading]               = useState(true);
  const [searchQuery, setSearchQuery]       = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState('All Specialists');
  const [maxFee, setMaxFee]                 = useState(5000);
  const [onlineOnly, setOnlineOnly]         = useState(false);
  const [showFilters, setShowFilters]       = useState(false);
  const [feeRange, setFeeRange]             = useState(5000);

  const { lastRatingUpdate, doctorPresence } = useNotifications();

  useEffect(() => { fetchDoctors(); }, [selectedSpecialty]);  // Real-time status update listener for rating and reviews
  useEffect(() => {
    if (lastRatingUpdate) {
      setDoctors(prev => prev.map(doc => {
        if (doc._id === lastRatingUpdate.doctorId) {
          return {
            ...doc,
            rating: lastRatingUpdate.rating,
            totalReviews: lastRatingUpdate.totalReviews
          };
        }
        return doc;
      }));
    }
  }, [lastRatingUpdate]);

  const fetchDoctors = async () => {
    setLoading(true);
    try {
      const url = selectedSpecialty === 'All Specialists'
        ? '/api/doctors'
        : `/api/doctors?specialization=${encodeURIComponent(selectedSpecialty)}`;
      const res  = await fetch(url);
      const data = await res.json();
      const docs = data.doctors || [];
      setDoctors(docs);
      // Set fee range max based on actual data
      const maxActualFee = Math.max(...docs.map(d => d.fee || 0), 1000);
      const roundedMax = Math.ceil(maxActualFee / 500) * 500;
      setMaxFee(roundedMax);
      setFeeRange(roundedMax);
    } catch (error) {
      console.error('Failed to fetch doctors:', error);
    } finally {
      setLoading(false);
    }
  };  // All filtering and stats should use the combined presence data
  const { filteredDoctors, onlineCount, avgRating } = useMemo(() => {
    const list = doctors.map(doc => {
      const id = typeof doc.userId === 'object' ? doc.userId._id : doc.userId;
      const presenceStatus = doctorPresence[String(id)];
      const isOnline = presenceStatus !== undefined ? presenceStatus : doc.isOnline === true;
      return { ...doc, isOnline };
    });

    const filtered = list.filter(doc => {
      const name = doc.userId?.name || '';
      const spec = doc.specialization || '';
      const bio  = doc.bio || '';

      const matchesSearch = !searchQuery ||
        fuzzyNameMatch(name, searchQuery) ||
        spec.toLowerCase().includes(searchQuery.toLowerCase()) ||
        bio.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesFee = (doc.fee || 0) <= feeRange;
      const matchesOnline = !onlineOnly || doc.isOnline === true;

      return matchesSearch && matchesFee && matchesOnline;
    });

    const oCount = list.filter(d => d.isOnline).length;
    const aRating = list.length > 0
      ? (list.reduce((s, d) => s + (d.rating || 0), 0) / list.length).toFixed(1)
      : '0.0';

    return { filteredDoctors: filtered, onlineCount: oCount, avgRating: aRating };
  }, [doctors, doctorPresence, searchQuery, feeRange, onlineOnly]);

  const hasActiveFilters = onlineOnly || feeRange < maxFee;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', width: '100%', paddingBottom: '80px' }}>

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', textAlign: 'center' }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '4px 14px', borderRadius: '99px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.04)', fontSize: '10px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.14em', color: 'rgba(255,255,255,0.3)' }}>
          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#3b82f6', display: 'inline-block' }} />
          Medical Directory
        </span>
        <h1 style={{ fontSize: '40px', fontWeight: '800', color: '#fff', letterSpacing: '-1px', margin: 0 }}>
          Network <span style={{ color: '#3b82f6' }}>Diagnostics</span>
        </h1>
        <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', letterSpacing: '0.18em', fontWeight: '600', margin: 0 }}>
          Access verified medical expertise
        </p>
      </div>

      {/* Search + Filter button */}
      <div style={{ display: 'flex', gap: '10px', maxWidth: '700px', margin: '0 auto', width: '100%' }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <Search size={15} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.2)', pointerEvents: 'none' }} />
          <input
            type="text"
            placeholder="Search by name, specialty, or condition..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{ width: '100%', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '14px', padding: '14px 16px 14px 42px', fontSize: '14px', color: '#fff', outline: 'none', boxSizing: 'border-box' }}
            onFocus={e => e.target.style.borderColor = 'rgba(59,130,246,0.4)'}
            onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.08)'}
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')}
              style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.3)', padding: '4px' }}>
              <X size={14} />
            </button>
          )}
        </div>
        <button onClick={() => setShowFilters(v => !v)}
          style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '14px 20px', borderRadius: '14px', border: `1px solid ${hasActiveFilters ? 'rgba(59,130,246,0.4)' : 'rgba(255,255,255,0.08)'}`, background: hasActiveFilters ? 'rgba(59,130,246,0.1)' : 'rgba(255,255,255,0.03)', color: hasActiveFilters ? '#60a5fa' : 'rgba(255,255,255,0.5)', fontSize: '13px', fontWeight: '600', cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.2s' }}>
          <SlidersHorizontal size={14} />
          Filters {hasActiveFilters && <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#3b82f6', display: 'inline-block' }} />}
        </button>
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <div style={{ background: 'rgba(255,255,255,0.02)', border: '0.5px solid rgba(255,255,255,0.08)', borderRadius: '20px', padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '700px', margin: '0 auto', width: '100%' }}>

          {/* Fee Range */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '12px', fontWeight: '600', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Consultation Fee</span>
              <span style={{ fontSize: '14px', fontWeight: '700', color: '#fff' }}>Up to ₹{feeRange.toLocaleString()}</span>
            </div>
            <input type="range" min={0} max={maxFee} step={100} value={feeRange}
              onChange={e => setFeeRange(Number(e.target.value))}
              style={{ width: '100%', accentColor: '#3b82f6', cursor: 'pointer' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.2)' }}>₹0</span>
              <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.2)' }}>₹{maxFee.toLocaleString()}</span>
            </div>
          </div>

          {/* Online Only Toggle */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <p style={{ fontSize: '13px', fontWeight: '600', color: '#fff', margin: 0 }}>Available now only</p>
              <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', margin: '3px 0 0' }}>Show only doctors currently online</p>
            </div>
            <button onClick={() => setOnlineOnly(v => !v)}
              style={{ width: '44px', height: '24px', borderRadius: '99px', background: onlineOnly ? '#3b82f6' : 'rgba(255,255,255,0.1)', border: 'none', cursor: 'pointer', position: 'relative', transition: 'background 0.2s', flexShrink: 0 }}>
              <span style={{ position: 'absolute', top: '3px', left: onlineOnly ? '22px' : '3px', width: '18px', height: '18px', borderRadius: '50%', background: '#fff', transition: 'left 0.2s' }} />
            </button>
          </div>

          {/* Reset */}
          {hasActiveFilters && (
            <button onClick={() => { setFeeRange(maxFee); setOnlineOnly(false); }}
              style={{ alignSelf: 'flex-start', background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', fontSize: '12px', fontWeight: '600', cursor: 'pointer', padding: 0, textDecoration: 'underline' }}>
              Reset filters
            </button>
          )}
        </div>
      )}

      {/* Stats */}
      {!loading && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', width: '100%' }}>
          {[
            { label: 'Specialists',   value: doctors.length },
            { label: 'Online Now',    value: onlineCount, highlight: onlineCount > 0 },
            { label: 'Avg Rating',    value: avgRating },
          ].map(stat => (
            <div key={stat.label} style={{ background: 'rgba(255,255,255,0.02)', border: `0.5px solid ${stat.highlight ? 'rgba(34,197,94,0.2)' : 'rgba(255,255,255,0.06)'}`, borderRadius: '16px', padding: '20px', textAlign: 'center' }}>
              <div style={{ fontSize: '28px', fontWeight: '800', color: stat.highlight ? '#4ade80' : '#fff', letterSpacing: '-0.5px' }}>{stat.value}</div>
              <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: '600', marginTop: '4px' }}>{stat.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Specialty Filter */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '10px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.12em', color: 'rgba(255,255,255,0.2)', whiteSpace: 'nowrap' }}>Specialty</span>
          <div style={{ flex: 1, height: '0.5px', background: 'rgba(255,255,255,0.06)' }} />
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          {specialties.map(spec => {
            const isActive = selectedSpecialty === spec;
            return (
              <button key={spec} onClick={() => setSelectedSpecialty(spec)}
                style={{ padding: '7px 16px', borderRadius: '99px', fontSize: '12px', fontWeight: '500', border: `1px solid ${isActive ? '#3b82f6' : 'rgba(255,255,255,0.08)'}`, background: isActive ? '#3b82f6' : 'rgba(255,255,255,0.03)', color: isActive ? '#fff' : 'rgba(255,255,255,0.4)', cursor: 'pointer', transition: 'all 0.15s' }}
                onMouseEnter={e => { if (!isActive) { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'; e.currentTarget.style.color = '#fff'; }}}
                onMouseLeave={e => { if (!isActive) { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = 'rgba(255,255,255,0.4)'; }}}
              >
                {spec}
              </button>
            );
          })}
        </div>
      </div>

      {/* Results */}
      <div style={{ width: '100%' }}>
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '120px 0', gap: '24px' }}>
            <div style={{ position: 'relative', width: '56px', height: '56px' }}>
              <div className="absolute inset-0 rounded-full border-2 border-blue-500/20 animate-pulse" />
              <div className="absolute inset-0 rounded-full border-t-2 border-blue-500 animate-spin" />
            </div>
            <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: '10px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.18em', margin: 0 }}>Scanning network...</p>
          </div>
        ) : filteredDoctors.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '120px 0', gap: '16px', textAlign: 'center' }}>
            <div style={{ padding: '28px', background: 'rgba(255,255,255,0.03)', borderRadius: '50%', border: '1px solid rgba(255,255,255,0.06)' }}>
              <Stethoscope size={36} style={{ color: 'rgba(255,255,255,0.2)' }} />
            </div>
            <div>
              <h4 style={{ fontSize: '16px', fontWeight: '600', color: 'rgba(255,255,255,0.5)', margin: '0 0 6px' }}>No matches found</h4>
              <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.25)', margin: 0 }}>Try adjusting your search or filters.</p>
            </div>
            {hasActiveFilters && (
              <button onClick={() => { setFeeRange(maxFee); setOnlineOnly(false); setSearchQuery(''); }}
                style={{ marginTop: '8px', padding: '10px 20px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.5)', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>
                Clear all filters
              </button>
            )}
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
              <span style={{ fontSize: '10px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.12em', color: 'rgba(255,255,255,0.2)' }}>Results</span>
              <div style={{ flex: 1, height: '0.5px', background: 'rgba(255,255,255,0.05)' }} />
              <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.2)' }}>{filteredDoctors.length} doctors</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
              {filteredDoctors.map(doc => (
                <DoctorCard 
                  key={doc._id} 
                  doctor={doc} 
                  presenceStatus={doctorPresence[String(typeof doc.userId === 'object' ? doc.userId._id : doc.userId)]}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function DoctorCard({ doctor, presenceStatus }) {
  const name           = doctor.userId?.name || 'Medical Specialist';
  const { bg, text }   = getAvatarColor(name);
  const initials       = getInitials(name);
  const specialization = doctor.specialization || '';
  const tags           = relatedConditions[specialization] || [specialization];

  // Real fee from doctor.fee
  const fee = doctor.fee > 0
    ? `₹${doctor.fee.toLocaleString()}`
    : doctor.fee === 0 ? 'Free' : '—';

  // Real rating from doctor.rating
  const rating = doctor.rating > 0 ? Number(doctor.rating).toFixed(1) : '—';

  // Effective online status: Presence map takes priority over initial DB state
  const isOnline = presenceStatus !== undefined ? presenceStatus : doctor.isOnline === true;

  return (
    <div
      style={{ display: 'flex', flexDirection: 'column', background: 'rgba(255,255,255,0.03)', border: '0.5px solid rgba(255,255,255,0.07)', borderRadius: '20px', padding: '24px', gap: '20px', transition: 'all 0.2s' }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.13)'; e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'; e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; }}
    >
      {/* Top: avatar + name + online status */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <div style={{ width: '46px', height: '46px', borderRadius: '50%', background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: '14px', fontWeight: '700', color: text }}>{initials}</span>
          </div>
          {/* Online indicator dot on avatar */}
          <span style={{ position: 'absolute', bottom: '1px', right: '1px', width: '11px', height: '11px', borderRadius: '50%', background: isOnline ? '#4ade80' : 'rgba(255,255,255,0.15)', border: '2px solid #050608' }} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h4 style={{ fontSize: '15px', fontWeight: '600', color: '#fff', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>Dr. {name}</h4>
          <p style={{ fontSize: '12px', color: 'rgba(59,130,246,0.8)', margin: '3px 0 0' }}>{specialization || 'Specialist'}</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '4px 10px', borderRadius: '99px', border: `1px solid ${isOnline ? 'rgba(34,197,94,0.25)' : 'rgba(255,255,255,0.08)'}`, background: isOnline ? 'rgba(34,197,94,0.08)' : 'rgba(255,255,255,0.04)', flexShrink: 0 }}>
          <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: isOnline ? '#4ade80' : 'rgba(255,255,255,0.2)' }} />
          <span style={{ fontSize: '10px', fontWeight: '600', color: isOnline ? '#4ade80' : 'rgba(255,255,255,0.3)' }}>
            {isOnline ? 'Online' : 'Offline'}
          </span>
        </div>
      </div>

      {/* Tags */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
        {tags.map(tag => (
          <span key={tag} style={{ padding: '4px 12px', borderRadius: '99px', background: 'rgba(255,255,255,0.04)', border: '0.5px solid rgba(255,255,255,0.08)', fontSize: '11px', color: 'rgba(255,255,255,0.4)', fontWeight: '500' }}>
            {tag}
          </span>
        ))}
      </div>

      {/* Divider */}
      <div style={{ height: '0.5px', background: 'rgba(255,255,255,0.06)' }} />

      {/* Meta: experience | fee | rating */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
        {[
          { label: 'Experience', value: doctor.experience ? `${doctor.experience}y` : '—' },
          { label: 'Fee',        value: fee },
          { label: 'Rating',     value: rating, isRating: true },
        ].map(item => (
          <div key={item.label} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <span style={{ fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.12em', color: 'rgba(255,255,255,0.22)', fontWeight: '600' }}>{item.label}</span>
            {item.isRating ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Star size={11} style={{ color: '#fbbf24', fill: '#fbbf24' }} />
                <span style={{ fontSize: '14px', fontWeight: '700', color: '#fff' }}>{item.value}</span>
              </div>
            ) : (
              <span style={{ fontSize: '14px', fontWeight: '700', color: '#fff' }}>{item.value}</span>
            )}
          </div>
        ))}
      </div>

      {/* Action Area */}
      <div style={{ marginTop: 'auto' }}>
        <Link
          href={`/dashboard/patient/doctors/${doctor._id}`}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '12px', borderRadius: '12px',
            background: '#fff', color: '#000', fontSize: '13px', fontWeight: '800', textDecoration: 'none', transition: 'all 0.2s',
            boxShadow: '0 4px 15px rgba(255,255,255,0.1)'
          }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(255,255,255,0.15)'; }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 15px rgba(255,255,255,0.1)'; }}
        >
          Book Appointment
        </Link>
      </div>
    </div>
  );
}