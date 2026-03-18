"use client";
import { LoginForm } from "@/components/login-form"
import DarkVeil from "@/components/react-bits/DarkVeil"
import LandingNavbar from "@/components/LandingNavbar"
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';

export default function Page() {
  const { user } = useAuth();
  const router = useRouter();
  const [isRedirecting, setIsRedirecting] = useState(false);

  useEffect(() => {
    if (user) {
      setIsRedirecting(true);
      const role = user.role || 'patient';
      if (role === 'admin') router.push('/admin');
      else router.push(`/dashboard/${role}`);
    }
  }, [user, router]);

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10 bg-[#020617] relative overflow-hidden">
      <LandingNavbar />
      
      {/* Premium Background Layer */}
      <div className="absolute inset-0 z-0 opacity-80">
        <DarkVeil 
          speed={0.2} 
          hueShift={-10} 
          noiseIntensity={0.03} 
          warpAmount={0.1}
        />
      </div>

      <div className="w-full max-w-[450px] relative z-10 mt-24 md:mt-20">
        <LoginForm />
      </div>
    </div>
  );
}
