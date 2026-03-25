'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard, 
  MessageSquare,
  Stethoscope,
  Bot,
  PhoneCall,
  FileText,
  HeartPulse,
  LogOut,
  UserCircle,
  ChevronDown,
  ShieldCheck
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import ExpandingSearch from './ExpandingSearch';
import NotificationBell from './NotificationBell';

const NAV_DATA = {
  patient: [
    { title: "Dashboard", url: "/dashboard/patient", icon: LayoutDashboard },
    { title: "Doctors", url: "/dashboard/patient/doctors", icon: Stethoscope },
    { title: "Assistant", url: "/dashboard/patient/ai-assistant", icon: Bot },
    { title: "Chat", url: "/dashboard/patient/chat", icon: MessageSquare },
    { title: "Calls", url: "/dashboard/patient/calls", icon: PhoneCall },
    { title: "Records", url: "/dashboard/patient/prescriptions", icon: FileText },
    { title: "Health", url: "/dashboard/patient/health-info", icon: HeartPulse },
  ],
  doctor: [
    { title: "Dashboard", url: "/dashboard/doctor", icon: LayoutDashboard },
    { title: "Chat", url: "/dashboard/doctor/chat", icon: MessageSquare },
    { title: "Calls", url: "/dashboard/doctor/calls", icon: PhoneCall },
    { title: "Records", url: "/dashboard/doctor/prescriptions", icon: FileText },
  ],
  admin: [
    { title: "Systems", url: "/dashboard/admin", icon: ShieldCheck },
  ]
};

export default function CinematicHeader() {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const userRole = user?.role || "patient";
  const navItems = NAV_DATA[userRole] || NAV_DATA.patient;

  const handleSignOut = async () => {
    await logout();
    router.push('/');
  };

  return (
    <motion.header 
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: "spring", stiffness: 100, damping: 20 }}
      className="fixed top-0 left-0 right-0 z-[100] flex justify-center p-6 pointer-events-none"
    >
      <div className="w-full max-w-[1440px] h-20 bg-zinc-900/60 backdrop-blur-3xl border border-white/10 rounded-[40px] shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex items-center px-10 gap-8 pointer-events-auto relative overflow-hidden">
        {/* Cinematic Light Sweep */}
        <motion.div
          animate={{ x: ["-100%", "200%"] }}
          transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.03] to-transparent -skew-x-12 pointer-events-none"
        />

        {/* LOGO & BRAND */}
        <Link href="/dashboard" className="flex items-center gap-4 group">
          <div className="size-11 bg-white/10 border border-white/20 rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(255,255,255,0.1)] group-hover:scale-110 transition-all duration-500">
            <Stethoscope size={22} className="text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]" />
          </div>
          <span className="text-2xl font-black tracking-tighter text-white group-hover:tracking-normal transition-all duration-500">
            Sanjeevni
          </span>
        </Link>

        {/* VERTICAL DIVIDER */}
        <div className="h-8 w-px bg-white/10 mx-2" />

        {/* CENTRAL NAV PILL */}
        <nav className="flex-1 flex items-center justify-center">
          <div className="flex items-center bg-white/[0.03] border border-white/5 rounded-full px-2 py-1.5 gap-1">
            {navItems.map((item) => {
              const isActive = pathname === item.url;
              return (
                <Link key={item.url} href={item.url}>
                  <motion.div
                    whileHover={{ backgroundColor: "rgba(255, 255, 255, 0.08)" }}
                    className={`
                      px-5 py-2 rounded-full flex items-center gap-2.5 transition-all duration-300 relative
                      ${isActive ? 'bg-white/15 text-white' : 'text-white/40 hover:text-white/80'}
                    `}
                  >
                    <item.icon size={17} className={isActive ? "text-sky-400" : ""} />
                    <span className="text-sm font-bold tracking-tight">{item.title}</span>
                    {isActive && (
                      <motion.div 
                        layoutId="nav-active-glow"
                        className="absolute inset-0 rounded-full border border-white/20 shadow-[0_0_15px_rgba(255,255,255,0.1)]"
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                      />
                    )}
                  </motion.div>
                </Link>
              );
            })}
          </div>
        </nav>

        {/* RIGHT ACTIONS */}
        <div className="flex items-center gap-6">
          <ExpandingSearch />
          <NotificationBell />
          
          <div className="h-8 w-px bg-white/10" />

          {/* USER PROFILE DROPDOWN */}
          <div className="relative">
            <button 
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className="flex items-center gap-3 p-1.5 pr-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full transition-all group"
            >
              <div className="size-9 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-black text-xs border border-white/20 shadow-lg">
                {user?.name?.charAt(0) || "U"}
              </div>
              <ChevronDown size={14} className={`text-white/40 group-hover:text-white transition-transform duration-300 ${isProfileOpen ? 'rotate-180' : ''}`} />
            </button>

            <AnimatePresence>
              {isProfileOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute top-full right-0 mt-4 w-64 bg-zinc-900 border border-white/10 rounded-3xl shadow-2xl overflow-hidden z-[110] backdrop-blur-3xl"
                >
                  <div className="p-6 border-b border-white/5">
                    <p className="text-white font-bold tracking-tight text-lg">{user?.name || "Patient"}</p>
                    <p className="text-white/40 text-xs font-medium uppercase tracking-widest mt-1">{userRole} Portal</p>
                  </div>
                  <div className="p-2">
                    <Link href={`/dashboard/${userRole}/profile`} onClick={() => setIsProfileOpen(false)}>
                      <div className="flex items-center gap-4 p-4 hover:bg-white/5 rounded-2xl transition-colors group">
                        <UserCircle size={20} className="text-white/40 group-hover:text-white transition-colors" />
                        <span className="text-sm font-bold text-white/80 group-hover:text-white">Account Settings</span>
                      </div>
                    </Link>
                    <button 
                      onClick={handleSignOut}
                      className="w-full flex items-center gap-4 p-4 hover:bg-red-500/10 rounded-2xl transition-colors group"
                    >
                      <LogOut size={20} className="text-red-400/60 group-hover:text-red-400 transition-colors" />
                      <span className="text-sm font-bold text-red-400/80 group-hover:text-red-400">Sign Out</span>
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </motion.header>
  );
}
