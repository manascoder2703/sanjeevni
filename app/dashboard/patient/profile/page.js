'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  User, Camera, Phone, Calendar, Droplets, MapPin, AlertCircle,
  Stethoscope, LogOut, Save, ChevronLeft, Shield, Sparkles,
  Heart, Activity, Thermometer
} from 'lucide-react';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const GENDERS = ['male', 'female', 'other'];

export default function PatientProfile() {
  const { user, loading: authLoading, logout, refreshUser } = useAuth();
  const router = useRouter();
  const fileInputRef = useRef(null);

  const [form, setForm] = useState({
    name: '', phone: '', dob: '', gender: '', bloodGroup: '', address: '', allergies: '', avatar: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.push('/login'); return; }
    
    const fetchProfile = async () => {
      try {
        const res = await fetch('/api/profile/patient');
        const data = await res.json();
        if (data.user) {
          const u = data.user;
          setForm({
            name: u.name || '',
            phone: u.phone || '',
            dob: u.dob ? u.dob.split('T')[0] : '',
            gender: u.gender || '',
            bloodGroup: u.bloodGroup || '',
            address: u.address || '',
            allergies: u.allergies || '',
            avatar: u.avatar || '',
          });
        }
      } catch (err) {
        console.error('Failed to fetch profile:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchProfile();
  }, [user, authLoading]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 1.5 * 1024 * 1024) {
      toast.error('Image must be under 1.5 MB');
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => setForm(f => ({ ...f, avatar: reader.result }));
    reader.readAsDataURL(file);
  };

  const handleSave = async (e) => {
    if (e) e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/profile/patient', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save');
      
      // Update local context for real-time sidebar/global sync
      await refreshUser();
      
      toast.success('Profile updated successfully!', {
        icon: '💎',
        style: {
          borderRadius: '16px',
          background: 'rgba(255, 255, 255, 0.1)',
          color: '#fff',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
        }
      });
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (!user && !authLoading) return null;

  const initials = form.name?.[0]?.toUpperCase() || '?';

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 }
  };

  return (
    <div className="w-full relative min-h-[calc(100vh-150px)] flex flex-col items-center justify-center p-4">
      <style jsx global>{`
        .premium-input {
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 14px;
          padding: 12px 18px;
          color: white;
          width: 100%;
          transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
          font-size: 14px;
          backdrop-filter: blur(10px);
        }
        .premium-input:focus {
          outline: none;
          border-color: rgba(255, 255, 255, 0.3);
          background: rgba(255, 255, 255, 0.04);
          box-shadow: 0 0 15px rgba(255, 255, 255, 0.1);
        }
        .glass-card-new {
          background: rgba(255, 255, 255, 0.01);
          backdrop-filter: blur(30px);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 24px;
          position: relative;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
        }
        .field-label {
          font-size: 11px;
          font-weight: 600;
          color: rgba(255, 255, 255, 0.4);
          margin-bottom: 8px;
          margin-left: 4px;
          display: block;
        }
      `}</style>

      <motion.main 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="max-w-5xl w-full space-y-10 py-12 relative z-10"
      >
        {/* Header Section */}
        <motion.div variants={itemVariants} className="flex flex-col items-center text-center space-y-2 mb-10">
          <h1 className="text-4xl font-bold tracking-tight text-white/90">Health profile</h1>
        </motion.div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <div className="size-10 border-2 border-white/5 border-t-white animate-spin rounded-full" />
            <p className="text-white/20 text-[10px] font-medium tracking-widest uppercase">Initializing neural link</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
            {/* Left Column (Identity & Core) */}
            <div className="lg:col-span-4 space-y-8">
              {/* Identity Card (Horizontal) */}
              <motion.div variants={itemVariants} className="glass-card-new p-8 flex items-center gap-6">
                <div 
                  className="relative cursor-pointer shrink-0"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <div className="size-24 rounded-3xl flex items-center justify-center border border-white/10 shadow-[0_0_20px_rgba(255,255,255,0.05)] overflow-hidden transition-all hover:border-white/30 group">
                    {form.avatar ? (
                      <img src={form.avatar} alt="Profile" className="size-full object-cover group-hover:scale-110 transition-transform duration-500" />
                    ) : (
                      <div className="size-full bg-white/5 flex items-center justify-center text-3xl font-bold text-white/20">
                        {initials}
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                      <Camera size={20} className="text-white" />
                    </div>
                  </div>
                </div>
                
                <div className="flex-1 space-y-1">
                  <h2 className="text-xl font-bold text-white/90">{form.name || 'Set Name'}</h2>
                  <div className="text-[11px] text-white/40 font-medium flex items-center gap-2">
                    <span>{form.bloodGroup || '--'}</span>
                    <span className="text-white/10">•</span>
                    <span>Blood group</span>
                  </div>
                </div>
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
              </motion.div>

              {/* Identity Information Section */}
              <motion.section variants={itemVariants} className="glass-card-new p-10 border border-white/5">
                <div className="flex items-center gap-3 mb-8">
                  <User size={16} className="text-white/30" />
                  <h3 className="text-sm font-semibold text-white/60">Identity link</h3>
                </div>

                <div className="space-y-6">
                  <div>
                    <span className="field-label">Registry name</span>
                    <input 
                      className="premium-input" 
                      value={form.name} 
                      onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                      placeholder="Enter full name"
                    />
                  </div>
                  <div>
                    <span className="field-label">Biometric ID (phone)</span>
                    <input 
                      className="premium-input" 
                      value={form.phone} 
                      onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                      placeholder="+91..."
                    />
                  </div>
                  <div>
                    <span className="field-label">Gender allocation</span>
                    <select 
                      className="premium-input"
                      value={form.gender}
                      onChange={e => setForm(f => ({ ...f, gender: e.target.value }))}
                    >
                      <option value="">Select</option>
                      {GENDERS.map(g => <option key={g} value={g}>{g.charAt(0).toUpperCase() + g.slice(1)}</option>)}
                    </select>
                  </div>
                  <div>
                    <span className="field-label">Timeline of origin</span>
                    <input 
                      type="date"
                      className="premium-input" 
                      value={form.dob} 
                      onChange={e => setForm(f => ({ ...f, dob: e.target.value }))}
                    />
                  </div>
                </div>
              </motion.section>
            </div>

            {/* Right Column (Clinical & Actions) */}
            <div className="lg:col-span-8 space-y-8">
              {/* Clinical Information Section */}
              <motion.section variants={itemVariants} className="glass-card-new p-10 border border-white/5">
                <div className="flex items-center gap-3 mb-10">
                  <Activity size={18} className="text-white/30" />
                  <h3 className="text-sm font-semibold text-white/60">Clinical metadata</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-10">
                  <div className="md:col-span-1">
                    <span className="field-label">Hematology group</span>
                    <select 
                      className="premium-input"
                      value={form.bloodGroup}
                      onChange={e => setForm(f => ({ ...f, bloodGroup: e.target.value }))}
                    >
                      <option value="">Select</option>
                      {BLOOD_GROUPS.map(g => <option key={g} value={g}>{g}</option>)}
                    </select>
                  </div>
                  <div className="md:col-span-1">
                    <span className="field-label">Primary email</span>
                    <input className="premium-input opacity-40 cursor-not-allowed" value={user.email} disabled />
                  </div>
                  <div className="md:col-span-2">
                    <span className="field-label">Geographic coordinates (address)</span>
                    <input 
                      className="premium-input" 
                      placeholder="Specify your residential locus..."
                      value={form.address} 
                      onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <span className="field-label">Sensitive pathologies / allergies</span>
                    <textarea 
                      className="premium-input min-h-[160px] resize-none" 
                      placeholder="Specify critical medical metadata or chronic pathologies..."
                      value={form.allergies} 
                      onChange={e => setForm(f => ({ ...f, allergies: e.target.value }))}
                    />
                  </div>
                </div>
              </motion.section>

            {/* Save Button (Centered Rounded Full) */}
            <div className="lg:col-span-12 flex justify-center pt-10">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleSave}
                disabled={saving}
                className="px-24 py-6 rounded-full bg-white/5 hover:bg-white border border-white/10 hover:border-white text-white/80 hover:text-black font-bold text-sm tracking-widest uppercase backdrop-blur-xl shadow-2xl transition-all duration-300 disabled:opacity-30"
              >
                {saving ? 'Saving changes...' : 'Save changes'}
              </motion.button>
            </div>
            </div>
          </div>
        )}
      </motion.main>
    </div>
  );
}
