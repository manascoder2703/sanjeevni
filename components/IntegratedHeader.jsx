'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
// Lucide imports merged below
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import ExpandingSearch from './ExpandingSearch';
import NotificationBell from './NotificationBell';
import UniversalAvatar from './UniversalAvatar';
import { useAgent } from '@/context/AgentContext';
import { Sparkles, Stethoscope, UserCircle, LogOut, ChevronDown } from 'lucide-react';

export default function IntegratedHeader() {
  const { user, logout } = useAuth();
  const { toggleAgent, isAgentVisible } = useAgent();
  const router = useRouter();

  const handleSignOut = async () => {
    await logout();
    router.push('/');
  };

  return (
    <header className="h-16 shrink-0 w-full flex items-center justify-between px-6! border-b border-white/20 bg-transparent z-[100] relative">
      <div 
        className="flex items-center gap-4 transition-all duration-300 ease-in-out pl-2"
      >
        <Link href="/dashboard" className="flex items-center gap-3 group">
          <div className="size-9 bg-white/10 border border-white/20 rounded-lg flex items-center justify-center shadow-[0_0_15px_rgba(255,255,255,0.1)] group-hover:scale-105 transition-all">
            <Stethoscope size={18} className="text-white" />
          </div>
          <span className="text-xl font-black tracking-tighter text-white">
            Sanjeevni
          </span>
        </Link>
      </div>

      <div className="flex items-center gap-4">
        <ExpandingSearch />
        
        {/* TALK TO YOUR AGENT TOGGLE */}
        <button 
          onClick={toggleAgent}
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            width: 'auto',
            minWidth: '200px'
          }}
          className={`
            hidden md:flex gap-3 px-6 h-9 rounded-full border transition-all duration-300 group/agent
            ${isAgentVisible 
              ? 'bg-sky-400/20 border-sky-400/40 text-sky-400 shadow-[0_0_15px_rgba(56,189,248,0.2)]' 
              : 'bg-white/5 border-white/10 text-white/50 hover:bg-white/10 hover:border-white/20 hover:text-white'}
          `}
        >
          <Sparkles size={14} className={isAgentVisible ? "animate-pulse" : "group-hover/agent:animate-spin-slow"} />
          <span className="text-[11px] font-black uppercase tracking-[0.15em]">Talk to your agent</span>
        </button>

        <NotificationBell />
        <div className="h-6 w-px bg-white/10 mx-2" />
        
        <div className="flex items-center gap-3">
          <UniversalAvatar user={user} size="size-8" />
          <div className="hidden md:flex flex-col items-start -space-y-1">
             <span className="text-[13px] font-bold text-white/90">{user?.name || "Patient"}</span>
             <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest">{user?.role || "patient"}</span>
          </div>
        </div>
      </div>
    </header>
  );
}
