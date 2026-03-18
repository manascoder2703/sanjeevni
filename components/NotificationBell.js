'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Check, Trash2, Calendar, CheckCircle2 } from 'lucide-react';
import { useNotifications } from '@/context/NotificationContext';

export default function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const { notifications, unreadCount, markAsRead, markAllAsRead, clearNotifications } = useNotifications();
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2.5 rounded-xl bg-white/[0.03] border border-white/10 hover:bg-white/[0.08] transition-all group"
      >
        <Bell 
          className={`size-5 transition-colors ${unreadCount > 0 ? 'text-red-500 fill-red-500/10' : 'text-white/40 group-hover:text-white'}`} 
        />
        
        <AnimatePresence>
          {unreadCount > 0 && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className="absolute -top-1 -right-1 size-4 bg-red-600 rounded-full border-2 border-[#000000] flex items-center justify-center"
            >
              <span className="text-[9px] font-bold text-white">{unreadCount}</span>
            </motion.div>
          )}
        </AnimatePresence>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute right-0 mt-3 w-80 bg-black/80 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] z-50 overflow-hidden"
          >
            <div className="p-4 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
              <h3 className="text-sm font-bold tracking-tight">Notifications</h3>
              {notifications.length > 0 && (
                <button 
                  onClick={markAllAsRead}
                  className="text-[10px] uppercase font-black tracking-widest text-blue-400 hover:text-blue-300 transition-colors"
                >
                  Mark all read
                </button>
              )}
            </div>

            <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
              {notifications.length === 0 ? (
                <div className="p-10 flex flex-col items-center justify-center opacity-20">
                  <Bell className="size-10 mb-3" />
                  <p className="text-xs font-medium">No new notifications</p>
                </div>
              ) : (
                <div className="flex flex-col">
                  {notifications.map((n) => (
                    <div 
                      key={n.id}
                      onClick={() => markAsRead(n.id)}
                      className={`p-4 border-b border-white/5 cursor-pointer transition-colors hover:bg-white/[0.03] relative ${!n.read ? 'bg-white/[0.01]' : ''}`}
                    >
                      {!n.read && (
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500" />
                      )}
                      <div className="flex gap-3">
                        <div className={`p-2 rounded-lg bg-white/5 border border-white/10 h-fit ${n.type === 'booking' ? 'text-blue-400' : 'text-green-400'}`}>
                          {n.type === 'booking' ? <Calendar size={14} /> : <CheckCircle2 size={14} />}
                        </div>
                        <div className="flex-1">
                          <p className={`text-xs font-bold mb-0.5 ${!n.read ? 'text-white' : 'text-white/60'}`}>{n.title}</p>
                          <p className="text-[11px] text-white/40 leading-relaxed">{n.content}</p>
                          <p className="text-[9px] text-white/20 mt-2 font-mono uppercase tracking-tighter">
                            {new Date(n.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {notifications.length > 0 && (
              <button 
                onClick={clearNotifications}
                className="w-full p-3 text-[10px] uppercase font-black tracking-widest text-white/20 hover:text-red-400 hover:bg-red-500/5 transition-all flex items-center justify-center gap-2 border-t border-white/5"
              >
                <Trash2 size={12} />
                Clear history
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
