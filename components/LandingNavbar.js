'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { Stethoscope } from 'lucide-react';
import { motion } from 'framer-motion';
import DecryptedText from './react-bits/DecryptedText';
import GlassSurface from './react-bits/GlassSurface';

export default function LandingNavbar() {
  const { user } = useAuth();
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const handleScroll = () => {
      // Calculate scroll percentage
      const winScroll = document.body.scrollTop || document.documentElement.scrollTop;
      const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      const scrolledPercent = (winScroll / height) * 100;

      // Hide if > 35%, show if < 35%
      setIsVisible(scrolledPercent < 35);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div style={{ 
      position: 'fixed', 
      top: 24, 
      left: 0, 
      right: 0, 
      display: 'flex', 
      justifyContent: 'center', 
      zIndex: 1000,
      padding: '0 20px'
    }}>
      <motion.nav 
        initial={{ y: -100, opacity: 0 }}
        animate={{ 
          y: isVisible ? 0 : -120, 
          opacity: isVisible ? 1 : 0,
          pointerEvents: isVisible ? 'auto' : 'none'
        }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        style={{
          width: '100%',
          maxWidth: '1100px',
          zIndex: 1000
        }}
      >
        <GlassSurface 
          borderRadius={999} 
          backgroundOpacity={0.15} 
          saturation={1.8} 
          distortionScale={-150}
          displace={1}
          className="w-full"
        >
          <div style={{
            width: '100%',
            padding: '10px 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            {/* Logo */}
            <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 10 }} className="nav-logo">
              <Stethoscope size={22} color="var(--accent)" />
              <DecryptedText 
                text="Sanjeevni" 
                animateOn="view"
                revealDirection="start"
                speed={80}
                maxIterations={15}
                style={{ 
                  fontSize: 20, 
                  fontWeight: 800, 
                  letterSpacing: '-0.5px',
                  color: 'white'
                }} 
              />
            </Link>

            {/* Right Actions */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              {user ? (
                <Link href={`/dashboard/${user.role}`} className="nav-btn-pill-primary">
                  Dashboard
                </Link>
              ) : (
                <>
                  <Link href="/login" className="nav-btn-pill-ghost">
                    Login
                  </Link>
                  <Link href="/register" className="nav-btn-pill-primary">
                    Get Started
                  </Link>
                </>
              )}
            </div>
          </div>
        </GlassSurface>
      </motion.nav>

      <style jsx>{`
        .nav-btn-pill-ghost {
          color: rgba(255, 255, 255, 0.8);
          text-decoration: none;
          padding: 8px 20px;
          font-size: 14px;
          font-weight: 600;
          border-radius: 999px;
          transition: all 0.2s;
        }
        .nav-btn-pill-ghost:hover {
          color: white;
          background: rgba(255, 255, 255, 0.05);
        }
        .nav-btn-pill-primary {
          background: white;
          color: #0f172a;
          text-decoration: none;
          padding: 8px 22px;
          font-size: 14px;
          font-weight: 700;
          border-radius: 999px;
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .nav-btn-pill-primary:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(255, 255, 255, 0.2);
          background: #f8fafc;
        }
        .nav-logo:hover {
          opacity: 0.9;
        }
      `}</style>
    </div>
  );
}
