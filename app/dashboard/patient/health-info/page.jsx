'use client';
import HealthInfoStepper from '@/components/HealthInfoStepper';
import { useRouter } from 'next/navigation';

export default function HealthInfoPage() {
  const router = useRouter();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, width: '100%' }}>
      <div>
        <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.2em', color: 'rgba(255,255,255,0.2)', marginBottom: 4 }}>Patient Portal</div>
        <h1 style={{ fontSize: 26, fontWeight: 900, color: '#fff', letterSpacing: '-0.5px', margin: 0 }}>Health Information</h1>
        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14, marginTop: 6 }}>
          This information helps your doctor write accurate prescriptions for you.
        </p>
      </div>
      <HealthInfoStepper />
    </div>
  );
}