'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Command, LayoutDashboard, Stethoscope, Bot, UserCircle, LogOut, ArrowRight, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export default function CommandPalette() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const { user, logout } = useAuth();
  const router = useRouter();
  const inputRef = useRef(null);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(prev => !prev);
      }
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      setQuery('');
    }
  }, [isOpen]);

  const navItems = [
    { title: 'Home Dashboard', url: '/dashboard/patient', icon: LayoutDashboard, category: 'Navigation' },
    { title: 'Find Medical Specialists', url: '/dashboard/patient/doctors', icon: Stethoscope, category: 'Navigation' },
    { title: 'Access Sanjeevni AI', url: '/dashboard/patient/ai-assistant', icon: Bot, category: 'Navigation' },
    { title: 'Unified Patient Profile', url: '/dashboard/patient/profile', icon: UserCircle, category: 'Account' },
  ].filter(item => item.title.toLowerCase().includes(query.toLowerCase()));

  const handleNavigate = (url) => {
    router.push(url);
    setIsOpen(false);
  };

  const handleLogout = async () => {
    await logout();
    router.push('/');
    setIsOpen(false);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] px-4">
          {/* Backdrop Blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="absolute inset-0 bg-black/60 backdrop-blur-md"
          />

          {/* Command Window */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-2xl bg-black/40 border border-white/10 rounded-3xl shadow-[0_32px_128px_rgba(0,0,0,0.8)] backdrop-blur-3xl overflow-hidden"
          >
            {/* Search Input Area */}
            <div className="flex items-center gap-4 px-6 py-5 border-b border-white/5 relative bg-white/[0.02]">
              <Search className="size-6 text-blue-500 animate-pulse" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Initialize neural command..."
                className="flex-1 bg-transparent border-none outline-none text-white text-lg font-black tracking-tight placeholder:text-white/10 placeholder:uppercase uppercase"
              />
              <div className="flex items-center gap-2 px-2 py-1 bg-white/5 border border-white/10 rounded-lg">
                <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">ESC</span>
              </div>
            </div>

            {/* Results Area */}
            <div className="max-h-[450px] overflow-y-auto p-4 custom-scrollbar">
              {navItems.length > 0 ? (
                <div className="flex flex-col gap-2">
                  <p className="px-3 py-2 text-[10px] font-black text-blue-500/50 uppercase tracking-[0.4em]">Available Protocols</p>
                  {navItems.map((item, idx) => (
                    <motion.button
                      key={item.url}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      onClick={() => handleNavigate(item.url)}
                      className="group flex items-center gap-4 p-4 rounded-2xl hover:bg-white/5 border border-transparent hover:border-white/10 transition-all text-left"
                    >
                      <div className="size-10 rounded-xl bg-white/5 flex items-center justify-center text-white/40 group-hover:text-blue-500 group-hover:bg-blue-500/10 transition-colors">
                        <item.icon className="size-5" />
                      </div>
                      <div className="flex flex-col flex-1">
                        <span className="text-sm font-black text-white uppercase tracking-wider">{item.title}</span>
                        <span className="text-[10px] font-bold text-white/20 uppercase tracking-[0.2em]">{item.category}</span>
                      </div>
                      <ArrowRight className="size-4 text-white/0 group-hover:text-white/40 group-hover:translate-x-1 transition-all" />
                    </motion.button>
                  ))}
                </div>
              ) : (
                <div className="py-20 flex flex-col items-center justify-center opacity-20 text-center gap-6">
                  <X size={48} className="text-white" />
                  <p className="text-xl font-black uppercase tracking-tighter">No Protocols Found</p>
                </div>
              )}

              {/* Quick Actions Footer */}
              <div className="mt-4 pt-4 border-t border-white/5">
                <button
                  onClick={handleLogout}
                  className="w-full group flex items-center justify-between p-4 rounded-2xl hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition-all"
                >
                  <div className="flex items-center gap-4">
                    <div className="size-10 rounded-xl bg-red-500/5 flex items-center justify-center text-red-500/40 group-hover:text-red-500 transition-colors">
                      <LogOut className="size-5" />
                    </div>
                    <span className="text-sm font-black text-red-400 uppercase tracking-wider">Terminate Session</span>
                  </div>
                  <Command className="size-4 text-red-500/20" />
                </button>
              </div>
            </div>

            {/* Bottom Glow */}
            <div className="absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-blue-500/20 to-transparent" />
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
