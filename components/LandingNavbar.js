"use client";
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { Stethoscope, Home, Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePathname } from 'next/navigation';
import DecryptedText from './react-bits/DecryptedText';
import GlassSurface from './react-bits/GlassSurface';

export default function LandingNavbar() {
  const { user } = useAuth();
  const [isVisible, setIsVisible] = useState(true);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const pathname = usePathname();
  const isLoginPage = pathname === '/login';

  useEffect(() => {
    const handleScroll = () => {
      if (isMenuOpen) return;
      
      // On non-landing pages, keep navbar visible
      if (pathname !== '/') {
        setIsVisible(true);
        return;
      }

      const winScroll = window.scrollY || document.documentElement.scrollTop;
      const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      const scrolledPercent = height > 0 ? (winScroll / height) * 100 : 0;

      setIsVisible(scrolledPercent < 35);
    };
    
    // Initial check
    handleScroll();
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isMenuOpen, pathname]);

  const navLinks = [
    { name: "About Us", id: "about-section" },
    { name: "Login", href: "/login" },
    { name: "Join", href: "/signup", primary: true }
  ];

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
          y: isVisible || isMenuOpen ? 0 : -120, 
          opacity: isVisible || isMenuOpen ? 1 : 0,
          pointerEvents: isVisible || isMenuOpen ? 'auto' : 'none'
        }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        style={{
          width: '100%',
          maxWidth: '1100px',
          zIndex: 1000
        }}
      >
        <GlassSurface 
          borderRadius={isMenuOpen ? 24 : 999} 
          backgroundOpacity={0.15} 
          saturation={1.8} 
          distortionScale={-150}
          displace={1}
          className="w-full transition-[border-radius] duration-500"
        >
          <div style={{
            width: '100%',
            padding: '10px 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            position: 'relative',
            zIndex: 1001
          }}>
            {/* Logo */}
            <Link href="/" onClick={() => setIsMenuOpen(false)} style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 8 }} className="nav-logo">
              <Stethoscope className="w-5 h-5 md:w-[22px] md:h-[22px]" color="var(--accent)" />
              {isLoginPage ? (
                <span className="text-lg md:text-xl font-extrabold tracking-tight text-white">
                  Sanjeevni
                </span>
              ) : (
                <DecryptedText 
                  text="Sanjeevni" 
                  animateOn="view"
                  revealDirection="start"
                  speed={80}
                  maxIterations={15}
                  className="text-lg md:text-xl font-extrabold tracking-tight text-white"
                />
              )}
            </Link>

            {/* Desktop Actions */}
            <div className="hidden md:flex items-center gap-4">
              {isLoginPage ? (
                <Link href="/" className="nav-btn-pill-ghost px-3! py-2! text-sm">
                   Home
                </Link>
              ) : (
                <>
                  {navLinks.map((link) => (
                    <div key={link.name} style={{ position: 'relative' }}>
                      <motion.div 
                        className="absolute inset-0 bg-blue-500/30 blur-2xl rounded-full opacity-0 pointer-events-none"
                        whileHover={{ opacity: 1, scale: 1.5 }}
                        style={{ zIndex: -1 }}
                      />
                      {link.id ? (
                        <motion.button 
                          whileHover={{ y: -6, scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                          onClick={() => {
                            const element = document.getElementById(link.id);
                            if (element) element.scrollIntoView({ behavior: 'smooth' });
                          }}
                          className="nav-btn-pill-ghost px-3! py-2! text-sm cursor-pointer border-none bg-transparent relative z-10"
                        >
                          {link.name}
                        </motion.button>
                      ) : (
                        <Link href={link.href} style={{ textDecoration: 'none' }}>
                          <motion.div
                            whileHover={{ y: -6, scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                            className={`${link.primary ? 'nav-btn-pill-primary' : 'nav-btn-pill-ghost'} px-3! py-2! text-sm relative z-10`}
                          >
                            {link.name}
                          </motion.div>
                        </Link>
                      )}
                    </div>
                  ))}
                </>
              )}
            </div>

            {/* Mobile Toggle */}
            <button 
              className="md:hidden p-2 text-white/80 hover:text-white transition-colors border-none bg-transparent cursor-pointer"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              style={{ touchAction: 'manipulation' }}
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>

          {/* Mobile Menu Overlay */}
          <AnimatePresence>
            {isMenuOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                className="md:hidden overflow-hidden border-t border-white/10"
              >
                <div className="flex flex-col gap-2! p-6! pb-8!">
                  {navLinks.map((link) => (
                    link.id ? (
                      <button 
                        key={link.name}
                        onClick={() => {
                          const element = document.getElementById(link.id);
                          if (element) element.scrollIntoView({ behavior: 'smooth' });
                          setIsMenuOpen(false);
                        }}
                        className="nav-btn-pill-ghost w-full justify-start py-4! text-base bg-white/5"
                        style={{ touchAction: 'manipulation' }}
                      >
                        {link.name}
                      </button>
                    ) : (
                      <Link 
                        key={link.name}
                        href={link.href}
                        onClick={() => setIsMenuOpen(false)}
                        className={`${link.primary ? 'nav-btn-pill-primary' : 'nav-btn-pill-ghost'} w-full text-center py-4! text-base ${!link.primary ? 'bg-white/5' : ''}`}
                        style={{ touchAction: 'manipulation' }}
                      >
                        {link.name}
                      </Link>
                    )
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </GlassSurface>
      </motion.nav>

      <style jsx>{`
        .nav-btn-pill-ghost {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          color: rgba(255, 255, 255, 0.8);
          text-decoration: none;
          padding: 8px 18px!important;
          font-size: 14px;
          font-weight: 600;
          border-radius: 999px;
          transition: background 0.3s, color 0.3s;
        }
        .nav-btn-pill-ghost:hover {
          color: white;
          background: rgba(255, 255, 255, 0.12);
        }
        .nav-btn-pill-primary {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          background: white;
          color: #0f172a;
          text-decoration: none;
          padding: 8px 22px!important;
          font-size: 14px;
          font-weight: 700;
          border-radius: 999px;
          transition: background 0.3s;
        }
        .nav-logo:hover {
          opacity: 0.9;
        }
      `}</style>
    </div>
  );
}
