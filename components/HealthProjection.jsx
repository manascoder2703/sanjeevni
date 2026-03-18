'use client';

import { motion } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceArea, ReferenceLine } from 'recharts';
import { Target, TrendingUp, Sparkles, BrainCircuit } from 'lucide-react';
import HoloCard from './HoloCard';

const projectionData = [
  { day: 'D10', value: 78, type: 'actual' },
  { day: 'D05', value: 82, type: 'actual' },
  { day: 'Now', value: 85, type: 'actual' },
  { day: '+5', value: 88, type: 'projected' },
  { day: '+10', value: 92, type: 'projected' },
  { day: '+20', value: 95, type: 'projected' },
  { day: '+30', value: 98, type: 'projected' },
];

export default function HealthProjection() {
  return (
    <HoloCard
      className="p-8 flex flex-col gap-8 border-none bg-white/[0.01] shadow-[0_64px_128px_rgba(0,0,0,0.8)]"
      spotlightColor="rgba(16, 185, 129, 0.1)"
    >
      {/* Decorative Gradient Line */}
      <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-blue-500 via-cyan-400 to-emerald-400 opacity-30" />
      
      <div className="flex items-center justify-between relative z-10">
        <div className="flex flex-col gap-1">
          <h3 className="text-xl font-black text-white tracking-tighter drop-shadow-[0_0_15px_rgba(255,255,255,0.2)] flex items-center gap-3">
             <BrainCircuit className="text-blue-500" size={24} />
             Health Projection AI
          </h3>
          <p className="text-emerald-400/40 text-[11px] font-bold tracking-widest">30-Day Predictive Biometry</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] font-bold tracking-widest animate-pulse">
           <Sparkles size={12} /> AI Optimized
        </div>
      </div>

      <div className="h-[220px] w-full mt-4 relative z-10">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={projectionData}>
            <defs>
              <linearGradient id="projectionGlow" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#3b82f6" />
                <stop offset="100%" stopColor="#10b981" />
              </linearGradient>
            </defs>
            <XAxis 
              dataKey="day" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: '#ffffff20', fontSize: 10, fontWeight: 900 }}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'rgba(0,0,0,0.95)', 
                backdropFilter: 'blur(20px)',
                borderColor: 'rgba(59,130,246,0.3)', 
                borderRadius: '20px',
                fontSize: '10px',
                color: '#fff',
                fontWeight: '900',
                padding: '12px'
              }} 
              cursor={{ stroke: '#ffffff10', strokeWidth: 1 }}
            />
            
            {/* Confidence Zone */}
            <ReferenceArea x1="Now" x2="+30" fill="#10b98105" />
            <ReferenceLine x="Now" stroke="#ffffff15" strokeDasharray="3 3" />
            
            <Line 
              type="monotone" 
              dataKey="value" 
              stroke="url(#projectionGlow)" 
              strokeWidth={5}
              dot={{ r: 4, fill: '#fff', strokeWidth: 2, stroke: '#3b82f6' }}
              activeDot={{ r: 8, strokeWidth: 0, fill: '#10b981' }}
              strokeDasharray={(props) => props.payload.type === 'projected' ? '8 8' : '0'}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-2 gap-4 relative z-10">
         <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5 flex flex-col gap-2">
            <span className="text-[10px] font-bold text-white/30 tracking-wider">Forecast</span>
            <div className="flex items-center gap-2">
               <TrendingUp size={16} className="text-emerald-400" />
               <span className="text-lg font-black text-white">+15.4%</span>
            </div>
            <p className="text-[10px] text-white/20 font-bold">Projected improvement in respiratory efficiency.</p>
         </div>
         <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5 flex flex-col gap-2">
            <span className="text-[10px] font-bold text-white/30 tracking-wider">Confidence</span>
            <div className="flex items-center gap-2">
               <Target size={16} className="text-blue-400" />
               <span className="text-lg font-black text-white">94.2%</span>
            </div>
            <p className="text-[10px] text-white/20 font-bold">Based on latest neural response patterns.</p>
         </div>
      </div>
    </HoloCard>
  );
}
