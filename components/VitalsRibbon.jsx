'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Activity, Thermometer, Droplets } from 'lucide-react';

export default function VitalsRibbon() {
  const [pulse, setPulse] = useState(72);
  const [temp, setTemp] = useState(98.6);
  const [oxygen, setOxygen] = useState(98);

  useEffect(() => {
    const interval = setInterval(() => {
      setPulse(p => p + (Math.random() > 0.5 ? 1 : -1));
      setOxygen(o => Math.min(100, Math.max(95, o + (Math.random() > 0.5 ? 0.1 : -0.1))));
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const vitals = [
    { label: 'Pulse Rate', value: `${pulse} BPM`, icon: Heart, color: 'text-red-500', glow: 'shadow-red-500/20' },
    { label: 'Systolic', value: '120/80', icon: Activity, color: 'text-blue-500', glow: 'shadow-blue-500/20' },
    { label: 'Body Temp', value: `${temp.toFixed(1)}°F`, icon: Thermometer, color: 'text-amber-500', glow: 'shadow-amber-500/20' },
    { label: 'SpO2', value: `${oxygen.toFixed(0)}%`, icon: Droplets, color: 'text-cyan-500', glow: 'shadow-cyan-500/20' },
  ];

  return (
    <motion.div 
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-6 p-2 px-6 bg-white/[0.01] border border-white/10 rounded-2xl backdrop-blur-3xl shadow-[0_20px_40px_rgba(0,0,0,0.4)]"
    >
      <div className="flex items-center gap-3 pr-6 border-r border-white/10">
        <div className="size-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_12px_#10b981]" />
        <span className="text-[10px] font-black text-white/40 tracking-[0.2em] uppercase">Neural Link: Secured</span>
      </div>
      
      <div className="flex items-center gap-10">
        {vitals.map((v, i) => (
          <div key={v.label} className="flex items-center gap-3 group cursor-default">
            <div className={`p-2 rounded-lg bg-white/5 border border-white/10 transition-all group-hover:bg-white/10 group-hover:scale-110`}>
              <v.icon size={14} className={v.color} />
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-white/30 tracking-wide">{v.label}</span>
              <span className="text-[11px] font-black text-white tabular-nums tracking-tighter">{v.value}</span>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
