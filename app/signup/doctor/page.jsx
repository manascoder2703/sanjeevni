import { SignupForm } from "@/components/signup-form";
import DarkVeil from '@/components/react-bits/DarkVeil';

export default function DoctorSignupPage() {
  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10 bg-[#020617] relative overflow-hidden">
      {/* Premium Background Layer */}
      <div className="absolute inset-0 z-0 opacity-80">
        <DarkVeil 
          speed={0.2} 
          hueShift={-10} 
          noiseIntensity={0.03} 
          warpAmount={0.1}
        />
      </div>

      <div className="relative z-10 w-full max-w-[550px]">
        <SignupForm role="doctor" />
      </div>
    </div>
  );
}
