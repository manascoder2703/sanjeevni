'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Stethoscope, Video, Shield, ArrowRight, Star, Users, Clock, Quote, Sparkles, ShieldCheck, ChevronLeft, ChevronRight } from 'lucide-react';

// React Bits Components
import DarkVeil from '@/components/react-bits/DarkVeil';
import LandingNavbar from '@/components/LandingNavbar';
import SpotlightCard from '@/components/react-bits/SpotlightCard';
import AnimatedSection from '@/components/AnimatedSection';
import CardSwap, { Card as SwapCard } from '@/components/react-bits/CardSwap';
import BlurText from '@/components/react-bits/BlurText';
import DecryptedText from '@/components/react-bits/DecryptedText';
import SplitText from '@/components/react-bits/SplitText';
import GradualBlur from '@/components/react-bits/GradualBlur';
import GradientText from '@/components/react-bits/GradientText';
import GlassSurface from '@/components/react-bits/GlassSurface';
import LandingAssistantWidget from '@/components/LandingAssistantWidget';
import ProfileCard from '@/components/ProfileCard';

function TestimonialCarousel({ title, subtitle, testimonials, gradientColors, accentColor, sectionStyle, roleFallback }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [direction, setDirection] = useState('right');
  const activeTestimonial = testimonials[activeIndex];

  const goPrevious = () => {
    setDirection('left');
    setActiveIndex((current) => (current - 1 + testimonials.length) % testimonials.length);
  };

  const goNext = () => {
    setDirection('right');
    setActiveIndex((current) => (current + 1) % testimonials.length);
  };

  return (
    <section style={sectionStyle}>
      <div style={{ textAlign: 'center', marginBottom: 44, padding: '0 20px' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
          <GradientText
            colors={gradientColors}
            animationSpeed={6}
            showBorder={false}
            className="mx-auto"
          >
            <h2 style={{ fontSize: 36, fontWeight: 800, textAlign: 'center' }}>{title}</h2>
          </GradientText>
        </div>
        <p style={{ color: 'var(--text-muted)', fontSize: 18, marginTop: 12 }}>{subtitle}</p>
      </div>

      <div style={{ maxWidth: 1320, margin: '0 auto', padding: '0 20px', position: 'relative' }}>
        <div
          style={{
            position: 'absolute',
            inset: '10% auto auto 16%',
            width: 220,
            height: 220,
            borderRadius: '50%',
            background: `${accentColor}14`,
            filter: 'blur(88px)',
            pointerEvents: 'none'
          }}
        />
        <div
          style={{
            position: 'absolute',
            inset: 'auto 12% 6% auto',
            width: 240,
            height: 240,
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.05)',
            filter: 'blur(92px)',
            pointerEvents: 'none'
          }}
        />
        <button
          type="button"
          onClick={goPrevious}
          aria-label={`Previous ${title}`}
          className="testimonial-nav-button"
          style={{ left: 20 }}
        >
          <ChevronLeft size={24} />
        </button>

        <button
          type="button"
          onClick={goNext}
          aria-label={`Next ${title}`}
          className="testimonial-nav-button"
          style={{ right: 20 }}
        >
          <ChevronRight size={24} />
        </button>

        <div className="testimonial-slider-shell">
          <div
            key={`${title}-${activeIndex}-${direction}`}
            className={direction === 'right' ? 'testimonial-slide-right' : 'testimonial-slide-left'}
            style={{
              textAlign: 'center',
              width: '100%',
              position: 'relative',
              padding: '16px 0 18px'
            }}
          >
            <div
              style={{
                position: 'relative',
                zIndex: 1,
                width: 64,
                height: 64,
                borderRadius: '50%',
                margin: '0 auto 22px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: `${accentColor}1a`,
                border: `1px solid ${accentColor}4d`,
                color: accentColor,
                fontWeight: 800,
                fontSize: 20,
                letterSpacing: '-0.03em'
              }}
            >
              {activeTestimonial.name.charAt(0)}
            </div>

            <Quote size={40} style={{ position: 'relative', zIndex: 1, color: accentColor, opacity: 0.5, marginBottom: 22 }} />

            <p
              style={{
                position: 'relative',
                zIndex: 1,
                fontSize: 'clamp(20px, 2.1vw, 28px)',
                lineHeight: 1.85,
                color: 'rgba(255,255,255,0.88)',
                maxWidth: 860,
                margin: '0 auto 28px',
                textAlign: 'center'
              }}
            >
              "{activeTestimonial.quote}"
            </p>

            <h4 style={{ position: 'relative', zIndex: 1, fontWeight: 800, fontSize: 24, color: 'white', textAlign: 'center', marginBottom: 8 }}>
              {activeTestimonial.name}
            </h4>
            <p style={{ position: 'relative', zIndex: 1, color: accentColor, fontSize: 13, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', textAlign: 'center' }}>
              {activeTestimonial.role || roleFallback}
            </p>

            <div style={{ position: 'relative', zIndex: 1, display: 'flex', justifyContent: 'center', gap: 10, marginTop: 24 }}>
              {testimonials.map((testimonial, index) => (
                <button
                  key={`${testimonial.name}-${index}`}
                  type="button"
                  aria-label={`Show testimonial ${index + 1}`}
                  onClick={() => {
                    setDirection(index > activeIndex ? 'right' : 'left');
                    setActiveIndex(index);
                  }}
                  style={{
                    width: index === activeIndex ? 28 : 8,
                    height: 8,
                    borderRadius: 999,
                    border: 'none',
                    background: index === activeIndex ? accentColor : 'rgba(255,255,255,0.18)',
                    transition: 'all 0.25s ease',
                    cursor: 'pointer'
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function HomePage() {
  const { user } = useAuth();
  const router = useRouter();
  const [doctorCount, setDoctorCount] = useState(null);
  const [onlineCount, setOnlineCount] = useState(null);
  const [titleComplete, setTitleComplete] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [founderImageMissing, setFounderImageMissing] = useState(false);

  const founderVision = "Sanjeevni was born from a simple idea: that quality healthcare should be accessible to everyone, regardless of where they live. We combine cutting-edge technology with the expertise of top medical professionals to provide a seamless, secure, and compassionate care experience.";

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
        @keyframes pulse-glow {
          0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(16,185,129,0.7); }
          70% { transform: scale(1); box-shadow: 0 0 0 10px rgba(16,185,129,0); }
          100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(16,185,129,0); }
        }
        @keyframes testimonial-slide-right {
          0% { opacity: 0; transform: translateX(36px); }
          100% { opacity: 1; transform: translateX(0); }
        }
        @keyframes testimonial-slide-left {
          0% { opacity: 0; transform: translateX(-36px); }
          100% { opacity: 1; transform: translateX(0); }
        }
        .testimonial-slide-right {
          animation: testimonial-slide-right 0.35s ease;
        }
        .testimonial-slide-left {
          animation: testimonial-slide-left 0.35s ease;
        }
        .testimonial-nav-button {
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          width: 52px;
          height: 52px;
          border-radius: 999px;
          border: 1px solid rgba(255,255,255,0.1);
          background: rgba(255,255,255,0.04);
          backdrop-filter: blur(12px);
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.25s ease;
          z-index: 2;
        }
        .testimonial-nav-button:hover {
          background: rgba(255,255,255,0.1);
          border-color: rgba(255,255,255,0.22);
        }
        .testimonial-slider-shell {
          max-width: 980px;
          margin: 0 auto;
          min-height: 340px;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0 88px;
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
        @media (max-width: 768px) {
          .testimonial-nav-button {
            width: 44px;
            height: 44px;
          }
          .testimonial-slider-shell {
            min-height: 320px;
            padding: 0 52px;
          }
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

      <TestimonialCarousel
        title="Trusted by Professionals"
        subtitle="Experience from our verified medical experts"
        testimonials={doctorTestimonials}
        gradientColors={["#0ea5e9", "#818cf8", "#c084fc", "#0ea5e9"]}
        accentColor="#0ea5e9"
        roleFallback="Verified Doctor"
        sectionStyle={{
          background: 'linear-gradient(180deg, rgba(14,165,233,0.03) 0%, rgba(99,102,241,0.025) 58%, rgba(255,255,255,0) 100%)',
          padding: '110px 0 56px',
          position: 'relative'
        }}
      />

      <section
        style={{
          padding: '30px 0 28px',
          position: 'relative',
          background: 'linear-gradient(180deg, rgba(14,165,233,0.02) 0%, rgba(34,211,238,0.03) 45%, rgba(255,255,255,0) 100%)'
        }}
      >
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 20px' }}>
          <div style={{ position: 'relative', maxWidth: 860, display: 'grid', gap: 24 }}>
            <div
              style={{
                position: 'absolute',
                inset: '-2% auto auto -10%',
                width: 220,
                height: 220,
                borderRadius: '50%',
                background: 'rgba(14,165,233,0.1)',
                filter: 'blur(92px)',
                pointerEvents: 'none'
              }}
            />
            <div
              style={{
                position: 'absolute',
                inset: 'auto -8% -10% auto',
                width: 240,
                height: 240,
                borderRadius: '50%',
                background: 'rgba(129,140,248,0.08)',
                filter: 'blur(104px)',
                pointerEvents: 'none'
              }}
            />
            <div style={{ textAlign: 'left' }}>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '8px 14px',
                  borderRadius: 999,
                  background: 'rgba(255,255,255,0.04)',
                  marginBottom: 18
                }}
              >
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#22d3ee', boxShadow: '0 0 16px rgba(34,211,238,0.8)' }} />
                <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.72)' }}>
                  Meet The Founder
                </span>
              </div>

              <h2 style={{ fontSize: 'clamp(34px, 4.2vw, 56px)', fontWeight: 900, color: 'white', lineHeight: 1.05, marginBottom: 14 }}>
                Manas Mishra
              </h2>

              <p style={{ fontSize: 14, fontWeight: 800, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'rgba(34,211,238,0.8)', marginBottom: 22 }}>
                Founder, Sanjeevni
              </p>

              <p style={{ color: '#a1a1aa', fontSize: 18, lineHeight: 1.8, marginBottom: 24, maxWidth: 640 }}>
                Sanjeevni is being shaped to make quality healthcare feel more reachable, more organized, and more human for patients and doctors alike.
              </p>

              <div style={{ display: 'grid', gap: 14 }}>
                <div style={{ padding: '18px 20px', borderRadius: 22, background: 'rgba(255,255,255,0.03)' }}>
                  <p style={{ fontSize: 12, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(34,211,238,0.82)', marginBottom: 8 }}>
                    What Drives Sanjeevni
                  </p>
                  <p style={{ color: 'white', fontSize: 15, lineHeight: 1.7, margin: 0 }}>
                    Expanding healthcare access without losing the trust, empathy, and clarity people expect from care.
                  </p>
                </div>
                <div style={{ padding: '18px 20px', borderRadius: 22, background: 'rgba(255,255,255,0.03)' }}>
                  <p style={{ fontSize: 12, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(129,140,248,0.88)', marginBottom: 8 }}>
                    The Goal
                  </p>
                  <p style={{ color: 'white', fontSize: 15, lineHeight: 1.7, margin: 0 }}>
                    Building one seamless place where patients save time finding care and doctors spend more time on care itself.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Founder's Vision */}
      <section
        id="about-section"
        style={{
          padding: '42px 0 0',
          position: 'relative',
          background: 'linear-gradient(180deg, rgba(255,255,255,0.015) 0%, rgba(34,211,238,0.03) 40%, rgba(255,255,255,0) 100%)'
        }}
      >
        <div style={{ width: '100%', padding: '0 20px' }}>
          <div className="w-full relative overflow-hidden">
            <div
              style={{
                position: 'absolute',
                inset: '4% auto auto -8%',
                width: 260,
                height: 260,
                borderRadius: '50%',
                background: 'rgba(34,211,238,0.12)',
                filter: 'blur(100px)',
                pointerEvents: 'none'
              }}
            />
            <div
              style={{
                position: 'absolute',
                inset: 'auto -6% 8% auto',
                width: 280,
                height: 280,
                borderRadius: '50%',
                background: 'rgba(129,140,248,0.1)',
                filter: 'blur(110px)',
                pointerEvents: 'none'
              }}
            />
            <div className="p-8 md:p-12 lg:p-16 grid grid-cols-1 md:grid-cols-[1.2fr_0.8fr] gap-12 md:gap-20 items-center">
              <div className="text-left">
                <GradientText
                  colors={["#22d3ee", "#818cf8", "#c084fc", "#22d3ee"]}
                  animationSpeed={6}
                  showBorder={false}
                  className="text-sm font-bold tracking-widest mb-4"
                >
                  Founder's Vision
                </GradientText>
                
                <h2 style={{ fontSize: 'clamp(32px, 4vw, 48px)', fontWeight: 900, color: 'white', lineHeight: 1.1, marginBottom: 24 }}>
                  A healthcare experience built around access, trust, and compassionate technology.
                </h2>
                
                <p style={{ color: '#94a3b8', fontSize: 'clamp(16px, 1.2vw, 19px)', lineHeight: 1.6, marginBottom: 32, maxWidth: 600 }}>
                  {founderVision}
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="flex items-start gap-4 p-5 rounded-2xl bg-white/[0.03] border border-white/5 hover:border-white/10 transition-all hover:translate-y-[-2px] duration-300">
                    <div className="p-3 bg-blue-500/10 rounded-xl">
                      <ShieldCheck size={24} className="text-blue-400" />
                    </div>
                    <div>
                      <h4 className="font-bold text-white mb-1">Access For Everyone</h4>
                      <p className="text-sm text-zinc-400">Patients should be able to reach quality healthcare no matter where they live.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4 p-5 rounded-2xl bg-white/[0.03] border border-white/5 hover:border-white/10 transition-all hover:translate-y-[-2px] duration-300">
                    <div className="p-3 bg-purple-500/10 rounded-xl">
                      <Users size={24} className="text-purple-400" />
                    </div>
                    <div>
                      <h4 className="font-bold text-white mb-1">Technology With Compassion</h4>
                      <p className="text-sm text-zinc-400">Modern tools should support doctors with efficiency while keeping care secure and personal.</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="relative flex justify-center items-center">
                <div 
                  style={{
                    position: 'absolute',
                    inset: '30px auto auto 10%',
                    width: '300px',
                    height: '300px',
                    borderRadius: '50%',
                    background: 'rgba(34,211,238,0.2)',
                    filter: 'blur(100px)',
                    pointerEvents: 'none',
                    zIndex: 0
                  }}
                />
                <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: '420px' }}>
                  <ProfileCard
                    name="Manas Mishra"
                    title="Founder, Sanjeevni"
                    handle="manas"
                    avatarUrl="/profile.png"
                    enableTilt={true}
                    behindGlowColor="rgba(34, 211, 238, 0.4)"
                    innerGradient="linear-gradient(145deg, #050b18 0%, #1e3a8a 100%)"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <TestimonialCarousel
        title="Patient Success Stories"
        subtitle="Real stories from people who chose Sanjeevni"
        testimonials={patientTestimonials}
        gradientColors={["#22d3ee", "#818cf8", "#c084fc", "#22d3ee"]}
        accentColor="#22d3ee"
        roleFallback="Happy Patient"
        sectionStyle={{
          padding: '40px 0 96px',
          position: 'relative',
          background: 'linear-gradient(180deg, rgba(34,211,238,0.02) 0%, rgba(129,140,248,0.02) 55%, rgba(255,255,255,0) 100%)'
        }}
      />

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

      <section style={{ padding: '30px 0 90px', position: 'relative' }}>
        <div style={{ width: '100%', padding: '0 20px' }}>
          <div
            style={{
              width: '100%',
              height: 1,
              marginBottom: 36,
              background: 'linear-gradient(90deg, rgba(255,255,255,0), rgba(255,255,255,0.16), rgba(34,211,238,0.4), rgba(255,255,255,0.16), rgba(255,255,255,0))'
            }}
          />

          <div
            style={{
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            <div
              style={{
                position: 'absolute',
                inset: 'auto auto -80px -40px',
                width: 220,
                height: 220,
                borderRadius: '50%',
                background: 'rgba(34,211,238,0.12)',
                filter: 'blur(70px)',
                pointerEvents: 'none'
              }}
            />
            <div
              style={{
                position: 'absolute',
                top: -50,
                right: -30,
                width: 220,
                height: 220,
                borderRadius: '50%',
                background: 'rgba(129,140,248,0.1)',
                filter: 'blur(85px)',
                pointerEvents: 'none'
              }}
            />

            <div
              style={{
                position: 'relative',
                padding: '20px 10px 10px',
                display: 'grid',
                gridTemplateColumns: 'minmax(0, 1.15fr) minmax(0, 0.85fr)',
                gap: 30,
                alignItems: 'stretch'
              }}
              className="about-bottom-grid"
            >
              <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: 22 }}>
                <div>
                  <div
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 10,
                      padding: '8px 14px',
                      borderRadius: 999,
                      background: 'rgba(255,255,255,0.03)',
                      marginBottom: 18
                    }}
                  >
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#22d3ee', boxShadow: '0 0 16px rgba(34,211,238,0.8)' }} />
                    <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.72)' }}>
                      About Us
                    </span>
                  </div>

                  <h3 style={{ fontSize: 'clamp(28px, 3.2vw, 40px)', fontWeight: 900, color: 'white', lineHeight: 1.08, marginBottom: 16, maxWidth: 720 }}>
                    Sanjeevni is built to make digital healthcare feel faster, simpler, and more human.
                  </h3>

                  <p style={{ color: '#a1a1aa', fontSize: 16, lineHeight: 1.8, maxWidth: 720, margin: 0 }}>
                    We designed Sanjeevni for people who want healthcare access without unnecessary friction. Patients can discover doctors, book appointments, and connect through secure video consultations, while doctors can manage requests, consultations, and daily workflows from one streamlined platform.
                  </p>
                </div>

                <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
                  <div style={{ padding: '10px 14px', borderRadius: 999, border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.03)', color: 'white', fontSize: 13, fontWeight: 700 }}>
                    Telemedicine
                  </div>
                  <div style={{ padding: '10px 14px', borderRadius: 999, border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.03)', color: 'white', fontSize: 13, fontWeight: 700 }}>
                    Secure Video Consults
                  </div>
                  <div style={{ padding: '10px 14px', borderRadius: 999, border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.03)', color: 'white', fontSize: 13, fontWeight: 700 }}>
                    Doctor & Patient Workflows
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gap: 14 }}>
                <div
                  style={{
                    padding: '20px 20px 18px',
                    borderRadius: 22,
                    background: 'rgba(255,255,255,0.03)'
                  }}
                >
                  <p style={{ fontSize: 12, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(34,211,238,0.78)', marginBottom: 8 }}>
                    For Patients
                  </p>
                  <p style={{ color: 'white', fontSize: 15, lineHeight: 1.7, margin: 0 }}>
                    Get faster access to specialists, simpler online booking, and consultations from wherever you are.
                  </p>
                </div>

                <div
                  style={{
                    padding: '20px 20px 18px',
                    borderRadius: 22,
                    background: 'rgba(255,255,255,0.03)'
                  }}
                >
                  <p style={{ fontSize: 12, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(129,140,248,0.88)', marginBottom: 8 }}>
                    For Doctors
                  </p>
                  <p style={{ color: 'white', fontSize: 15, lineHeight: 1.7, margin: 0 }}>
                    Reduce scheduling friction, manage appointments in one place, and use your time more efficiently through digital consultations.
                  </p>
                </div>

                <div
                  style={{
                    padding: '20px 20px 18px',
                    borderRadius: 22,
                    background: 'linear-gradient(135deg, rgba(34,211,238,0.07), rgba(129,140,248,0.07))'
                  }}
                >
                  <p style={{ fontSize: 12, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.52)', marginBottom: 8 }}>
                    Why Sanjeevni
                  </p>
                  <p style={{ color: 'white', fontSize: 15, lineHeight: 1.7, margin: 0 }}>
                    A modern healthcare experience that combines convenience, trust, and productivity for both sides of the consultation.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <style>{`
        @media (max-width: 860px) {
          .about-bottom-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>

      <section style={{ padding: '0 20px 44px', position: 'relative', zIndex: 1 }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
          <div
            style={{
              width: 88,
              height: 88,
              borderRadius: '50%',
              background: 'radial-gradient(circle at 30% 30%, rgba(34,211,238,0.22), rgba(255,255,255,0.04))',
              border: '1px solid rgba(255,255,255,0.12)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 70px rgba(34,211,238,0.22), inset 0 1px 0 rgba(255,255,255,0.08)'
            }}
          >
            <Stethoscope size={38} style={{ color: '#22d3ee' }} />
          </div>

          <div style={{ fontSize: 'clamp(30px, 4vw, 42px)', fontWeight: 900, letterSpacing: '-0.05em', color: 'white', lineHeight: 1 }}>
            Sanjeevni
          </div>

          <div
            style={{
              width: 'min(480px, 90vw)',
              height: 1,
              background: 'linear-gradient(90deg, rgba(255,255,255,0), rgba(255,255,255,0.18), rgba(34,211,238,0.35), rgba(255,255,255,0.18), rgba(255,255,255,0))'
            }}
          />

          <p style={{ margin: 0, color: 'rgba(255,255,255,0.52)', fontSize: 13, letterSpacing: '0.04em', lineHeight: 1.6, textAlign: 'center' }}>
            Copyright reserved, Sanjeevni. All rights reserved.
          </p>
        </div>
      </section>

      <LandingAssistantWidget />

      {/* Footer */}
      <footer style={{ display: 'none' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14 }}>
            <div
              style={{
                width: 76,
                height: 76,
                borderRadius: '50%',
                background: 'radial-gradient(circle at 30% 30%, rgba(34,211,238,0.22), rgba(255,255,255,0.04))',
                border: '1px solid rgba(255,255,255,0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 60px rgba(34,211,238,0.18), inset 0 1px 0 rgba(255,255,255,0.08)'
              }}
            >
              <Stethoscope size={34} style={{ color: '#22d3ee' }} />
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 'clamp(28px, 4vw, 38px)', fontWeight: 900, letterSpacing: '-0.05em', color: 'white', lineHeight: 1 }}>
                Sanjeevni
              </div>
            </div>
          </div>

          <div
            style={{
              width: 'min(460px, 90vw)',
              height: 1,
              background: 'linear-gradient(90deg, rgba(255,255,255,0), rgba(255,255,255,0.18), rgba(34,211,238,0.35), rgba(255,255,255,0.18), rgba(255,255,255,0))'
            }}
          />

          <p style={{ margin: 0, color: 'rgba(255,255,255,0.5)', fontSize: 13, letterSpacing: '0.04em', lineHeight: 1.6 }}>
            Copyright reserved, Sanjeevni. All rights reserved.
          </p>
        </div>
        © 2024 Sanjeevni. Built for better healthcare access.
      </footer>
    </div>
  );
}
