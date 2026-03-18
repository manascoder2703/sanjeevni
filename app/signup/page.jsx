"use client";
import Link from 'next/link';
import { User, Stethoscope, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import GlassSurface from '@/components/react-bits/GlassSurface';
import DarkVeil from '@/components/react-bits/DarkVeil';

export default function SignupRolePage() {
  const roles = [
    {
      title: "Patient",
      description: "Book appointments, consult with doctors, and manage your health records.",
      icon: <User size={40} className="text-blue-400" />,
      href: "/signup/patient",
      color: "from-blue-500/20 to-cyan-500/20"
    },
    {
      title: "Doctor",
      description: "Join our network of healthcare professionals and treat patients online.",
      icon: <Stethoscope size={40} className="text-emerald-400" />,
      href: "/signup/doctor",
      color: "from-emerald-500/20 to-teal-500/20"
    }
  ];

  return (
    <div className="min-h-screen bg-[#0f172a] flex flex-col items-center p-6 md:p-12 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute inset-0 z-0">
        <DarkVeil speed={0.3} opacity={0.4} />
      </div>

      <div className="relative z-10 w-full max-w-5xl flex flex-col justify-center min-h-[90vh]">
        {/* Role Cards Grid - Perfectly Centered */}
        <div className="flex flex-col justify-center py-12">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-0 mt-8">
            {roles.map((role, idx) => (
              <motion.div
                key={role.title}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 + idx * 0.1, duration: 0.8 }}
              >
                <Link href={role.href} className="group block relative">
                  <div className="p-12 md:p-24 flex flex-col items-center text-center transition-all duration-500 rounded-[40px] group-hover:bg-white/[0.02]">
                    {/* Glowing Aura on Hover */}
                    <div className={`absolute inset-0 bg-gradient-to-br ${role.color} opacity-0 group-hover:opacity-100 transition-opacity duration-1000 blur-[100px] -z-10 rounded-full scale-75`} />
                    
                    <div className="mb-8 p-6 bg-white/5 rounded-full group-hover:scale-110 group-hover:bg-white/10 transition-all duration-700">
                      {role.icon}
                    </div>
                    
                    <h2 className="text-4xl md:text-5xl font-black text-white mb-6 group-hover:text-white transition-colors">
                      {role.title}
                    </h2>
                    
                    <div className="flex items-center gap-3 text-zinc-500 font-bold group-hover:text-white transition-all duration-300">
                      Get Started <ArrowRight size={20} className="group-hover:translate-x-2 transition-transform" />
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Footer Link */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center mt-auto pb-8 text-zinc-500"
        >
          Already have an account? <Link href="/login" className="text-white hover:text-blue-400 font-bold transition-all">Sign in here</Link>
        </motion.div>
      </div>
    </div>
  );
}
