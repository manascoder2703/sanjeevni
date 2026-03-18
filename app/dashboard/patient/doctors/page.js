'use client';
import { useState, useEffect } from 'react';
import { Search, ArrowRight, Star, Clock, Stethoscope } from 'lucide-react';
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
  { bg: 'bg-blue-500/20', text: 'text-blue-400' },
  { bg: 'bg-violet-500/20', text: 'text-violet-400' },
  { bg: 'bg-emerald-500/20', text: 'text-emerald-400' },
  { bg: 'bg-orange-500/20', text: 'text-orange-400' },
  { bg: 'bg-pink-500/20', text: 'text-pink-400' },
  { bg: 'bg-teal-500/20', text: 'text-teal-400' },
  { bg: 'bg-rose-500/20', text: 'text-rose-400' },
  { bg: 'bg-cyan-500/20', text: 'text-cyan-400' },
];

function getAvatarColor(name = '') {
  const index = name.charCodeAt(0) % AVATAR_COLORS.length;
  return AVATAR_COLORS[index];
}

function getInitials(name = '') {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

// Deterministic mock rating/availability based on doctor id
function getMockMeta(id = '') {
  const code = id.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const rating = (4.4 + (code % 6) * 0.1).toFixed(1);
  const isAvailable = code % 3 !== 0;
  const busyHours = (code % 3) + 1;
  return { rating, isAvailable, busyHours };
}

export default function FindDoctors() {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState('All Specialists');

  useEffect(() => {
    fetchDoctors();
  }, [selectedSpecialty]);

  const fetchDoctors = async () => {
    setLoading(true);
    try {
      const url = selectedSpecialty === 'All Specialists'
        ? '/api/doctors'
        : `/api/doctors?specialization=${selectedSpecialty}`;
      const res = await fetch(url);
      const data = await res.json();
      setDoctors(data.doctors || []);
    } catch (error) {
      console.error('Failed to fetch doctors:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredDoctors = doctors.filter(doc =>
    doc.userId?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    doc.specialization?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    doc.biography?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const availableCount = doctors.filter(d => getMockMeta(d._id).isAvailable).length;

  return (
    <div className="flex flex-col gap-10 w-full pb-20">

      {/* Header */}
      <div className="flex flex-col items-center gap-3 text-center">
        <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 bg-white/5 text-[10px] font-semibold uppercase tracking-widest text-white/30">
          <span className="size-1.5 rounded-full bg-blue-500 inline-block" />
          Medical Directory
        </span>
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-white">
          Network <span className="text-blue-500">Diagnostics</span>
        </h1>
        <p className="text-white/30 text-[11px] uppercase tracking-widest font-medium">
          Access verified medical expertise
        </p>
      </div>

      {/* Search */}
      <div className="relative max-w-2xl mx-auto w-full group">
        <Search
          size={15}
          className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-blue-400 transition-colors"
        />
        <input
          type="text"
          placeholder="Search doctors, specialties, or conditions..."
          className="w-full bg-white/[0.03] border border-white/8 rounded-xl py-3 pl-10 pr-4 text-sm text-white placeholder:text-white/20 outline-none focus:border-blue-500/40 focus:ring-2 focus:ring-blue-500/10 transition-all"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Stats Row */}
      {!loading && (
        <div className="grid grid-cols-3 gap-3 w-full">
          {[
            { label: 'Specialists', value: doctors.length },
            { label: 'Available Now', value: availableCount },
            { label: 'Avg Rating', value: '4.8' },
          ].map(stat => (
            <div key={stat.label} className="bg-white/[0.03] border border-white/5 rounded-xl px-4 py-3 text-center">
              <div className="text-xl font-bold text-white">{stat.value}</div>
              <div className="text-[10px] text-white/30 uppercase tracking-wider mt-0.5 font-medium">{stat.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Specialty Filter */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-semibold uppercase tracking-widest text-white/20 whitespace-nowrap">Specialty</span>
          <div className="h-px flex-1 bg-white/5" />
        </div>
        <div className="flex flex-wrap gap-2">
          {specialties.map(spec => (
            <button
              key={spec}
              onClick={() => setSelectedSpecialty(spec)}
              className={`px-4 py-1.5 rounded-full text-xs font-medium border transition-all
                ${selectedSpecialty === spec
                  ? 'bg-blue-500 text-white border-blue-500'
                  : 'bg-white/[0.03] border-white/8 text-white/40 hover:text-white hover:border-white/20 hover:bg-white/[0.06]'
                }`}
            >
              {spec}
            </button>
          ))}
        </div>
      </div>

      {/* Results */}
      <div className="w-full">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 gap-6">
            <div className="relative size-16">
              <div className="absolute inset-0 rounded-full border-2 border-blue-500/20 animate-pulse" />
              <div className="absolute inset-0 rounded-full border-t-2 border-blue-500 animate-spin" />
            </div>
            <p className="text-white/20 text-[10px] font-semibold uppercase tracking-widest animate-pulse">
              Scanning network...
            </p>
          </div>
        ) : filteredDoctors.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 gap-4 text-center">
            <div className="p-8 bg-white/[0.03] rounded-full border border-white/5">
              <Stethoscope size={40} className="text-white/20" />
            </div>
            <div>
              <h4 className="text-lg font-semibold text-white/60">No matches found</h4>
              <p className="text-white/30 text-sm mt-1 max-w-xs">Try a different specialty or search term.</p>
            </div>
          </div>
        ) : (
          <>
            {/* Result count */}
            <div className="flex items-center gap-3 mb-5">
              <span className="text-[10px] font-semibold uppercase tracking-widest text-white/20">Results</span>
              <div className="h-px flex-1 bg-white/5" />
              <span className="text-[10px] text-white/20">{filteredDoctors.length} doctors</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 w-full">
              {filteredDoctors.map(doc => (
                <DoctorCard key={doc._id} doctor={doc} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function DoctorCard({ doctor }) {
  const name = doctor.userId?.name || 'Medical Specialist';
  const { bg, text } = getAvatarColor(name);
  const initials = getInitials(name);
  const { rating, isAvailable, busyHours } = getMockMeta(doctor._id || '');

  // Since specialization is a single value (e.g. "Cardiologist"),
  // show it as a tag + derive related conditions from it
  const specialization = doctor.specialization || '';
  const relatedConditions = {
    'Cardiologist': ['Heart failure', 'Arrhythmia'],
    'Dermatologist': ['Acne', 'Psoriasis'],
    'Neurologist': ['Migraine', 'Epilepsy'],
    'Pediatrician': ['Child health', 'Vaccines'],
    'Psychiatrist': ['Anxiety', 'Depression'],
    'Orthopedic': ['Joint pain', 'Fractures'],
    'General Physician': ['Fever', 'Diabetes'],
    'Gynecologist': ['Prenatal', 'PCOS'],
  };
  const tags = relatedConditions[specialization] || [];

  // Fee: show 0 as "Free" and falsy as "—"
  const feeDisplay = doctor.consultationFee > 0
    ? `₹${doctor.consultationFee}`
    : doctor.consultationFee === 0
    ? 'Free'
    : '—';

  return (
    <div className="group flex flex-col bg-white/[0.03] border border-white/[0.07] rounded-2xl p-6 gap-5 hover:border-white/[0.14] hover:bg-white/[0.05] transition-all duration-200">

      {/* Top row: avatar + name + availability */}
      <div className="flex items-center gap-4">
        <div className={`size-12 rounded-full ${bg} flex items-center justify-center shrink-0`}>
          <span className={`text-sm font-bold ${text}`}>{initials}</span>
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-[15px] font-semibold text-white">Dr. {name}</h4>
          <p className="text-xs text-blue-400/80 mt-0.5">{specialization || 'Specialist'}</p>
        </div>
        <div className={`flex items-center gap-1.5 shrink-0 px-2.5 py-1 rounded-full border ${isAvailable ? 'border-emerald-500/20 bg-emerald-500/10' : 'border-amber-500/20 bg-amber-500/10'}`}>
          <span className={`size-1.5 rounded-full ${isAvailable ? 'bg-emerald-400' : 'bg-amber-400'}`} />
          <span className={`text-[10px] font-semibold ${isAvailable ? 'text-emerald-400' : 'text-amber-400'}`}>
            {isAvailable ? 'Available' : `Busy · ${busyHours}h`}
          </span>
        </div>
      </div>

      {/* Condition tags */}
      <div className="flex flex-wrap gap-2">
        {tags.map(tag => (
          <span key={tag} className="px-3 py-1 rounded-full bg-white/[0.04] border border-white/[0.07] text-[11px] text-white/40 font-medium">
            {tag}
          </span>
        ))}
        {tags.length === 0 && (
          <span className="px-3 py-1 rounded-full bg-white/[0.04] border border-white/[0.07] text-[11px] text-white/40 font-medium">
            {specialization}
          </span>
        )}
      </div>

      {/* Divider */}
      <div className="h-px bg-white/[0.06]" />

      {/* Meta row: experience | fee | rating */}
      <div className="grid grid-cols-3 gap-3">
        <div className="flex flex-col gap-1.5">
          <span className="text-[9px] uppercase tracking-widest text-white/25 font-semibold">Experience</span>
          <span className="text-sm font-bold text-white">
            {doctor.experience ? `${doctor.experience}y` : '—'}
          </span>
        </div>
        <div className="flex flex-col gap-1.5">
          <span className="text-[9px] uppercase tracking-widest text-white/25 font-semibold">Fee</span>
          <span className="text-sm font-bold text-white">{feeDisplay}</span>
        </div>
        <div className="flex flex-col gap-1.5">
          <span className="text-[9px] uppercase tracking-widest text-white/25 font-semibold">Rating</span>
          <div className="flex items-center gap-1">
            <Star size={11} className="text-amber-400 fill-amber-400" />
            <span className="text-sm font-bold text-white">{rating}</span>
          </div>
        </div>
      </div>

      {/* Book button — matches card bg, arrow slides on hover */}
      <Link
        href={`/dashboard/patient/doctors/${doctor._id}`}
        className="group/btn flex items-center justify-center gap-2 py-3 rounded-xl bg-white/[0.06] border border-white/[0.08] hover:bg-white/[0.10] hover:border-white/[0.15] text-white text-xs font-semibold transition-all duration-200 active:scale-[0.98]"
      >
        Book Appointment
        <ArrowRight size={13} className="group-hover/btn:translate-x-1 transition-transform duration-200" />
      </Link>
    </div>
  );
}