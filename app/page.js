'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Stethoscope, Video, Shield, ArrowRight, Star, Users, Clock, Quote, Sparkles, ShieldCheck } from 'lucide-react';

// React Bits Components
import DarkVeil from '@/components/react-bits/DarkVeil';
import LandingNavbar from '@/components/LandingNavbar';
import SpotlightCard from '@/components/react-bits/SpotlightCard';
import AnimatedSection from '@/components/AnimatedSection';
import CardSwap, { Card as SwapCard } from '@/components/react-bits/CardSwap';
import BlurText from '@/components/react-bits/BlurText';
import DecryptedText from '@/components/react-bits/DecryptedText';
import SplitText from '@/components/react-bits/SplitText';
import InfiniteMarquee from '@/components/react-bits/InfiniteMarquee';
import GradualBlur from '@/components/react-bits/GradualBlur';
import GradientText from '@/components/react-bits/GradientText';
import GlassSurface from '@/components/react-bits/GlassSurface';

export default function HomePage() {
  const { user } = useAuth();
  const router = useRouter();
  const [doctorCount, setDoctorCount] = useState(null);
  const [onlineCount, setOnlineCount] = useState(null);
  const [titleComplete, setTitleComplete] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);

  useEffect(() => {
    // We allow users to see the landing page even if logged in.
    // Redirection only happens if they try to access /login or /register while logged in (handled by middleware).
    
    fetch('/api/public/stats')
      .then(res => res.json())
      .then(data => {
        setDoctorCount(data.doctorCount);
        setOnlineCount(data.onlineCount);
      })
      .catch(err => console.error('Error fetching stats:', err));
  }, [user, router]);


  const stats = [
    { icon: <Users size={20} />, value: doctorCount !== null ? `${doctorCount}` : '...', label: 'Total Doctors' },
    { icon: <Star size={20} />, value: '4.9★', label: 'Rating' },
    { icon: <Clock size={20} />, value: '24/7', label: 'Available' },
  ];

  const specialties = ['Cardiologist', 'Dermatologist', 'Neurologist', 'Pediatrician', 'Psychiatrist', 'Orthopedic'];

  const doctorTestimonials = [
    { name: 'Dr. Sarah Johnson', role: 'Cardiologist', quote: 'Sanjeevni has transformed how I manage my practice. The video quality is exceptional, and I can reach patients who couldn\'t travel to my clinic.' },
    { name: 'Dr. James Wilson', role: 'Pediatrician', quote: 'The scheduling system is so intuitive. It has reduced my administrative work by 40%, allowing me to focus more on my young patients.' },
    { name: 'Dr. Elena Rodriguez', role: 'Neurologist', quote: 'Being able to review patient history while on a secure video call is a game-changer. The platform is incredibly stable and professional.' }
  ];

  const patientTestimonials = [
    { name: 'Michael Chen', role: 'Software Engineer', quote: 'Booking an appointment was a breeze. I had a consultation from my living room and got my prescription within minutes. Highly recommend!' },
    { name: 'Emily Thompson', role: 'Teacher', quote: 'I was nervous about video calls, but the interface is so simple. Dr. Sarah was wonderful and made me feel heard without leaving my home.' },
    { name: 'Robert Davis', role: 'Senior Citizen', quote: 'At my age, traveling to hospitals is difficult. Sanjeevni has been a blessing. I can regularly check in with my cardiologist easily.' }
  ];

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', position: 'relative' }}>
      {/* Full Page Fixed Background */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none', background: 'var(--bg-primary)' }}>
        <DarkVeil
          hueShift={0}
          noiseIntensity={0}
          scanlineIntensity={0}
          speed={0.5}
          scanlineFrequency={0}
          warpAmount={0}
          className="fade-in"
        />
      </div>

      {/* Floating Navbar */}
      <LandingNavbar />

      {/* Styled components ... */}
      <style>{`
        .logo-hover:hover {
          opacity: 0.9;
          transform: scale(1.02);
        }
        .testimonial-card {
          padding: 32px;
          min-width: 380px;
          max-width: 380px;
          height: 100%;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          background: rgba(255, 255, 255, 0.03) !important;
          backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.08) !important;
          border-radius: 24px !important;
          transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
          white-space: normal;
        }
        .testimonial-card:hover {
          border-color: rgba(14, 165, 233, 0.4) !important;
          background: rgba(255, 255, 255, 0.05) !important;
          transform: translateY(-8px) scale(1.02);
          box-shadow: 0 20px 40px rgba(0,0,0,0.3), 0 0 20px rgba(14, 165, 233, 0.1);
        }
        @keyframes pulse-glow {
          0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(16,185,129,0.7); }
          70% { transform: scale(1); box-shadow: 0 0 0 10px rgba(16,185,129,0); }
          100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(16,185,129,0); }
        }
        .hero-btn-glass:hover {
          background: rgba(14, 165, 233, 0.2) !important;
          border-color: rgba(14, 165, 233, 0.8) !important;
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(14, 165, 233, 0.2);
        }
        .hero-btn-grey-glass:hover {
          background: rgba(255, 255, 255, 0.15) !important;
          border-color: rgba(255, 255, 255, 0.4) !important;
          color: white !important;
          transform: translateY(-2px);
          box-shadow: 0 10px 30px rgba(255, 255, 255, 0.1);
        }
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
      `}</style>
      
      {/* Hero Content */}
      <section style={{ position: 'relative', zIndex: 1, padding: '100px 0 60px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 20px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.2fr) minmax(0, 0.8fr)', gap: 60, alignItems: 'center' }} className="hero-grid">
            <div style={{ textAlign: 'left' }} className="hero-text-content">
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(14,165,233,0.1)', border: '1px solid rgba(14,165,233,0.3)', borderRadius: 20, padding: '6px 16px', marginBottom: 24, backdropFilter: 'blur(4px)' }}>
                <div style={{ width: 8, height: 8, background: onlineCount > 0 ? '#10b981' : '#94a3b8', borderRadius: '50%', animation: onlineCount > 0 ? 'pulse-glow 2s infinite' : 'none' }} />
                <span style={{ fontSize: 13, color: 'white', fontWeight: 600 }}>
                  <span style={{ color: 'var(--accent)' }}>{onlineCount !== null ? `${onlineCount}` : '...'}</span> Verified Doctors Online
                </span>
              </div>
              
              <h1 style={{ fontSize: 'clamp(32px, 8vw, 64px)', fontWeight: 900, lineHeight: 1.1, marginBottom: 20, color: 'white', display: 'flex', flexWrap: 'wrap', gap: '0 8px' }}>
                <BlurText text="Your Health," delay={150} animateBy="words" direction="top" stepDuration={0.6} />
                <BlurText 
                  text="One Click Away" 
                  delay={150} 
                  animateBy="words" 
                  direction="top" 
                  stepDuration={0.6}
                  onAnimationComplete={() => setTitleComplete(true)}
                  className="hero-title-gradient"
                  style={{ background: 'linear-gradient(135deg, #22d3ee, #818cf8, #c084fc)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', filter: 'drop-shadow(0 0 15px rgba(129, 140, 248, 0.4))' }}
                />
              </h1>
              
              <SplitText
                text="Book appointments with top doctors and consult via secure video calls — anytime, anywhere. Experience the future of healthcare."
                className="text-base md:text-lg"
                delay={30}
                duration={0.8}
                animate={titleComplete}
                textAlign="left"
                style={{ fontSize: 'clamp(16px, 2vw, 20px)', color: '#94a3b8', maxWidth: 540, marginBottom: 32, lineHeight: 1.6 }}
              />
              
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'inherit' }}>
                <Link href="/dashboard/patient/doctors" style={{ 
                  textDecoration: 'none', 
                  fontSize: 16, 
                  padding: '14px 28px',
                  borderRadius: '999px',
                  border: '1px solid rgba(14, 165, 233, 0.5)',
                  background: 'rgba(14, 165, 233, 0.1)',
                  color: '#0ea5e9',
                  fontWeight: 600,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  backdropFilter: 'blur(12px)',
                  transition: 'all 0.3s ease'
                }} className="hero-btn-glass">
                  Book Appointment <ArrowRight size={18} />
                </Link>
                <Link href="/register?role=doctor" style={{ 
                  textDecoration: 'none', 
                  fontSize: 16, 
                  padding: '14px 28px',
                  borderRadius: '999px',
                  background: 'rgba(148, 163, 184, 0.08)',
                  color: '#94a3b8',
                  border: '1px solid rgba(148, 163, 184, 0.2)',
                  fontWeight: 600,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  backdropFilter: 'blur(12px)',
                  transition: 'all 0.3s ease'
                }} className="hero-btn-grey-glass">
                  Join as Doctor
                </Link>
              </div>
            </div>

            <div style={{ position: 'relative', height: 450, display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }} className="hero-visual">
                <CardSwap
                    width={380}
                    height={280}
                    cardDistance={40}
                    verticalDistance={45}
                    delay={4000}
                    pauseOnHover={true}
                >
                    <SwapCard>
                        <GlassSurface borderRadius={24} backgroundOpacity={0.1} saturation={1.2} distortionScale={-220} displace={2}>
                            <div style={{ padding: 32, height: '100%', display: 'flex', flexDirection: 'column', gap: 16 }}>
                                <div style={{ background: 'rgba(34,211,238,0.1)', color: '#22d3ee', width: 48, height: 48, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <Sparkles size={24} />
                                </div>
                                <h3 style={{ fontSize: 22, fontWeight: 800, color: 'white' }}>AI Health Assistant</h3>
                                <p style={{ color: '#94a3b8', fontSize: 16, lineHeight: 1.6 }}>Get personalized health insights and preliminary checks powered by advanced medical AI models.</p>
                            </div>
                        </GlassSurface>
                    </SwapCard>
                    <SwapCard>
                        <GlassSurface borderRadius={24} backgroundOpacity={0.1} saturation={1.2} distortionScale={-220} displace={2}>
                            <div style={{ padding: 32, height: '100%', display: 'flex', flexDirection: 'column', gap: 16 }}>
                                <div style={{ background: 'rgba(129,140,248,0.1)', color: '#818cf8', width: 48, height: 48, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <Video size={24} />
                                </div>
                                <h3 style={{ fontSize: 22, fontWeight: 800, color: 'white' }}>Secure Video Consults</h3>
                                <p style={{ color: '#94a3b8', fontSize: 16, lineHeight: 1.6 }}>Connect instantly with board-certified specialists via our encrypted ultra-HD video platform.</p>
                            </div>
                        </GlassSurface>
                    </SwapCard>
                    <SwapCard>
                        <GlassSurface borderRadius={24} backgroundOpacity={0.1} saturation={1.2} distortionScale={-220} displace={2}>
                            <div style={{ padding: 32, height: '100%', display: 'flex', flexDirection: 'column', gap: 16 }}>
                                <div style={{ background: 'rgba(192,132,252,0.1)', color: '#c084fc', width: 48, height: 48, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <Shield size={24} />
                                </div>
                                <h3 style={{ fontSize: 22, fontWeight: 800, color: 'white' }}>Privacy Guaranteed</h3>
                                <p style={{ color: '#94a3b8', fontSize: 16, lineHeight: 1.6 }}>Your medical data is protected by military-grade encryption and strict global health standards.</p>
                            </div>
                        </GlassSurface>
                    </SwapCard>
                </CardSwap>
            </div>
          </div>
        </div>
      </section>

      {/* Hero Responsive Styles */}
      <style>{`
        @media (max-width: 992px) {
          .hero-grid {
            grid-template-columns: 1fr !important;
            text-align: center !important;
            gap: 120px !important;
          }
          .hero-text-content {
            text-align: center !important;
            display: flex;
            flex-direction: column;
            align-items: center;
          }
          .hero-visual {
            justify-content: center !important;
            height: 350px !important;
          }
        }
      `}</style>


      {/* Stats Row */}
      <section style={{ maxWidth: 1200, margin: '0 auto', padding: '0 20px 60px' }}>
        <div style={{ display: 'flex', gap: 32, justifyContent: 'center', paddingTop: 60, flexWrap: 'wrap' }}>
          {stats.map((s, i) => (
            <div key={i} style={{ textAlign: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--accent)', justifyContent: 'center', marginBottom: 4 }}>
                {s.icon}<span style={{ fontSize: 32, fontWeight: 800, color: 'var(--text-primary)' }}>{s.value}</span>
              </div>
              <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Doctor Testimonials */}
      <section style={{ background: 'rgba(14,165,233,0.02)', padding: '120px 0' }}>
        <div style={{ textAlign: 'center', marginBottom: 60, padding: '0 32px' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
            <GradientText
              colors={["#0ea5e9", "#818cf8", "#c084fc", "#0ea5e9"]}
              animationSpeed={6}
              showBorder={false}
              className="mx-auto"
            >
              <h2 style={{ fontSize: 36, fontWeight: 800, textAlign: 'center' }}>Trusted by Professionals</h2>
            </GradientText>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: 18, marginTop: 12 }}>Experience from our verified medical experts</p>
        </div>
        
        <InfiniteMarquee speed={0.8} direction="left">
          {doctorTestimonials.map((t, i) => (
            <div key={i} className="testimonial-card" style={{ padding: 0 }}>
              <GlassSurface borderRadius={24} backgroundOpacity={0.05} saturation={1.2} distortionScale={-200} displace={1.5}>
                <div style={{ padding: 32, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <Quote size={32} style={{ color: 'var(--accent)', opacity: 0.4, marginBottom: 20 }} />
                    <p style={{ fontSize: 17, lineHeight: 1.7, color: 'rgba(255,255,255,0.8)', fontStyle: 'italic', marginBottom: 24 }}>"{t.quote}"</p>
                  </div>
                  <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: 20, display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'linear-gradient(135deg,#0ea5e9,#818cf8)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, color: 'white' }}>{t.name[4]}</div>
                    <div>
                      <h4 style={{ fontWeight: 700, fontSize: 16, color: 'white' }}>{t.name}</h4>
                      <p style={{ color: 'var(--accent)', fontSize: 13, fontWeight: 600 }}>{t.role}</p>
                    </div>
                  </div>
                </div>
              </GlassSurface>
            </div>
          ))}
        </InfiniteMarquee>
      </section>

      {/* Patient Testimonials */}
      <section style={{ padding: '80px 0' }}>
        <div style={{ textAlign: 'center', marginBottom: 40, padding: '0 20px' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
            <GradientText
              colors={["#22d3ee", "#818cf8", "#c084fc", "#22d3ee"]}
              animationSpeed={6}
              showBorder={false}
              className="mx-auto"
            >
              <h2 style={{ fontSize: 36, fontWeight: 800, textAlign: 'center' }}>Patient Success Stories</h2>
            </GradientText>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: 18, marginTop: 12 }}>Real stories from people who chose Sanjeevni</p>
        </div>

        <InfiniteMarquee speed={0.6} direction="left">
          {patientTestimonials.map((t, i) => (
            <div key={i} className="testimonial-card" style={{ padding: 0 }}>
              <GlassSurface borderRadius={24} backgroundOpacity={0.05} saturation={1.2} distortionScale={-200} displace={1.5}>
                <div style={{ padding: 32, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <Quote size={32} style={{ color: '#06b6d4', opacity: 0.4, marginBottom: 20 }} />
                    <p style={{ fontSize: 17, lineHeight: 1.7, color: 'rgba(255,255,255,0.8)', marginBottom: 24 }}>"{t.quote}"</p>
                  </div>
                  <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: 20, display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'rgba(6,182,212,0.1)', border: '1px solid rgba(6,182,212,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, color: '#06b6d4' }}>{t.name[0]}</div>
                    <div>
                      <h4 style={{ fontWeight: 700, fontSize: 16, color: 'white' }}>{t.name}</h4>
                      <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>Happy Patient</p>
                    </div>
                  </div>
                </div>
              </GlassSurface>
            </div>
          ))}
        </InfiniteMarquee>
      </section>

      {/* Specialties */}
      <section style={{ maxWidth: 1200, margin: '0 auto', padding: '0 20px 60px', textAlign: 'center' }}>
        <h2 style={{ fontSize: 'clamp(28px, 4vw, 36px)', fontWeight: 800, marginBottom: 12 }}>Browse by Specialty</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: 24 }}>Find the right specialist for your needs</p>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center' }}>
          {specialties.map((s) => (
            <Link key={s} href={`/dashboard/patient/doctors?specialization=${s}`} style={{
              textDecoration: 'none',
              background: 'rgba(14,165,233,0.08)',
              border: '1px solid rgba(14,165,233,0.2)',
              color: 'var(--accent)',
              padding: '10px 20px',
              borderRadius: 50,
              fontSize: 14,
              fontWeight: 500,
              transition: 'all 0.2s',
            }}
              onMouseEnter={e => { e.target.style.background = 'rgba(14,165,233,0.2)'; }}
              onMouseLeave={e => { e.target.style.background = 'rgba(14,165,233,0.08)'; }}
            >{s}</Link>
          ))}
        </div>
      </section>

      {/* About Us Section */}
      <section id="about-section" style={{ padding: '100px 0 60px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 20px' }}>
          <div className="w-full relative overflow-hidden">
            <div className="p-8 md:p-12 lg:p-16 grid grid-cols-1 md:grid-cols-[1.2fr_0.8fr] gap-12 md:gap-20 items-center">
              <div className="text-left">
                <GradientText
                  colors={["#22d3ee", "#818cf8", "#c084fc", "#22d3ee"]}
                  animationSpeed={6}
                  showBorder={false}
                  className="text-sm font-bold tracking-widest mb-4"
                >
                  Our Mission
                </GradientText>
                
                <h2 style={{ fontSize: 'clamp(32px, 4vw, 48px)', fontWeight: 900, color: 'white', lineHeight: 1.1, marginBottom: 24 }}>
                  Revolutionizing Healthcare <br/>
                  <span style={{ color: '#94a3b8', fontWeight: 700 }}>With Human-Centric AI.</span>
                </h2>
                
                <p style={{ color: '#94a3b8', fontSize: 'clamp(16px, 1.2vw, 19px)', lineHeight: 1.6, marginBottom: 32, maxWidth: 600 }}>
                  Sanjeevni was born from a simple idea: that quality healthcare should be accessible to everyone, regardless of where they live. We combine cutting-edge technology with the expertise of top medical professionals to provide a seamless, secure, and compassionate care experience.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="flex items-start gap-4 p-5 rounded-2xl bg-white/[0.03] border border-white/5 hover:border-white/10 transition-all hover:translate-y-[-2px] duration-300">
                    <div className="p-3 bg-blue-500/10 rounded-xl">
                      <ShieldCheck size={24} className="text-blue-400" />
                    </div>
                    <div>
                      <h4 className="font-bold text-white mb-1">Secure & Private</h4>
                      <p className="text-sm text-zinc-400">HIPAA-compliant video calls and encrypted data.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4 p-5 rounded-2xl bg-white/[0.03] border border-white/5 hover:border-white/10 transition-all hover:translate-y-[-2px] duration-300">
                    <div className="p-3 bg-purple-500/10 rounded-xl">
                      <Users size={24} className="text-purple-400" />
                    </div>
                    <div>
                      <h4 className="font-bold text-white mb-1">Human-First</h4>
                      <p className="text-sm text-zinc-400">Technology that empowers, not replaces, doctors.</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="relative">
                <div className="w-full aspect-square max-w-[500px] lg:max-w-[540px] mx-auto relative group">
                   {/* Background Glow */}
                   <div className="absolute inset-0 bg-blue-500/25 blur-[120px] rounded-full animate-pulse group-hover:bg-blue-500/35 transition-colors duration-500" />
                   
                   <GlassSurface 
                     borderRadius={999} 
                     backgroundOpacity={0.12} 
                     className="w-full h-full border border-white/10 flex items-center justify-center p-10 md:p-16 transition-transform duration-500 group-hover:scale-[1.03]"
                   >
                     <div className="text-center">
                        <div className="relative mb-8">
                          <Stethoscope size={96} className="text-blue-400 mx-auto drop-shadow-[0_0_20px_rgba(59,130,246,0.6)] animate-bounce-slow" />
                          <div className="absolute -top-3 -right-3 p-3 bg-blue-500/25 rounded-full backdrop-blur-md border border-white/10">
                            <Sparkles size={20} className="text-blue-300" />
                          </div>
                        </div>
                        <div className="text-5xl md:text-6xl font-black text-white mb-3 tracking-tighter">10k+</div>
                        <div className="text-zinc-400/60 font-bold tracking-widest text-sm md:text-base">Global Patients</div>
                     </div>
                   </GlassSurface>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ padding: '24px 32px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 14 }}>
        © 2024 Sanjeevni. Built for better healthcare access.
      </footer>
    </div>
  );
}
