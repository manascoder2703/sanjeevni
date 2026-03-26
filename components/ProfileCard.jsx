'use client';

import React, { useEffect, useRef, useCallback } from 'react';

const DEFAULT_INNER_GRADIENT = 'linear-gradient(135deg, rgba(10, 15, 30, 0.95) 0%, rgba(20, 30, 60, 0.95) 100%)';

const ProfileCard = ({
  name = "Manas Mishra",
  title = "Founder, Sanjeevni",
  avatarUrl = "/profile.png",
  enableTilt = true,
  behindGlowColor = "rgba(34, 211, 238, 0.35)",
  innerGradient = DEFAULT_INNER_GRADIENT
}) => {
  const containerRef = useRef(null);
  const rafId = useRef(null);
  const isHovered = useRef(false);

  const updateStyles = useCallback((x, y) => {
    if (!containerRef.current) return;
    containerRef.current.style.setProperty('--card-x', `${x}%`);
    containerRef.current.style.setProperty('--card-y', `${y}%`);
    containerRef.current.style.setProperty('--card-opacity', isHovered.current ? '1' : '0');
    
    // Calculate rotation values for parallax
    const rotateX = (y - 50) * -0.2;
    const rotateY = (x - 50) * 0.2;
    containerRef.current.style.setProperty('--rotate-x', `${rotateX}deg`);
    containerRef.current.style.setProperty('--rotate-y', `${rotateY}deg`);
  }, []);

  const handleMouseMove = useCallback((e) => {
    if (!enableTilt) return;
    isHovered.current = true;
    const rect = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    
    if (rafId.current) cancelAnimationFrame(rafId.current);
    rafId.current = requestAnimationFrame(() => updateStyles(x, y));
  }, [enableTilt, updateStyles]);

  const handleMouseLeave = useCallback(() => {
    isHovered.current = false;
    if (rafId.current) cancelAnimationFrame(rafId.current);
    rafId.current = requestAnimationFrame(() => updateStyles(50, 50));
  }, [updateStyles]);

  return (
    <div 
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="profile-card-premium-container"
      style={{
        '--card-x': '50%',
        '--card-y': '50%',
        '--card-opacity': '0',
        '--rotate-x': '0deg',
        '--rotate-y': '0deg',
        position: 'relative',
        width: '100%',
        height: '640px',
        borderRadius: '38px',
        background: 'transparent',
        perspective: '1500px',
        transformStyle: 'preserve-3d',
        padding: '1px' // For the high-end border light
      }}
    >
      {/* Outer Glow / Shadow */}
      <div style={{
          position: 'absolute',
          inset: '-20px',
          background: `radial-gradient(circle at var(--card-x) var(--card-y), ${behindGlowColor}, transparent 60%)`,
          opacity: 'calc(var(--card-opacity) * 0.5)',
          filter: 'blur(40px)',
          zIndex: -1,
          pointerEvents: 'none',
          transition: 'opacity 0.5s ease'
      }} />

      {/* Main Card Body */}
      <div className="card-shell" style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        borderRadius: '37px',
        overflow: 'hidden',
        background: innerGradient,
        border: '1px solid rgba(255, 255, 255, 0.08)',
        boxShadow: '0 40px 100px rgba(0,0,0,0.6), inset 0 0 0 1px rgba(255,255,255,0.05)',
        display: 'flex',
        flexDirection: 'column',
        cursor: 'default',
        transform: 'rotateX(var(--rotate-x)) rotateY(var(--rotate-y))',
        transition: 'transform 0.1s ease-out',
        transformStyle: 'preserve-3d'
      }}>
        
        {/* Dynamic Sheen / Lighting Layer */}
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(circle at var(--card-x) var(--card-y), rgba(255,255,255,0.12) 0%, transparent 60%)',
          opacity: 'var(--card-opacity)',
          zIndex: 30,
          pointerEvents: 'none'
        }} />

        {/* Abstract Architectural Background (Glass Etched) */}
        <div style={{
          position: 'absolute',
          inset: 0,
          opacity: 0.15,
          pointerEvents: 'none',
          zIndex: 1,
          background: 'radial-gradient(circle at 50% 50%, rgba(255,255,255,0.05) 0%, transparent 100%)'
        }}>
            <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
                <defs>
                    <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                        <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="0.5" opacity="0.2"/>
                    </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#grid)" />
            </svg>
        </div>

        {/* Portrait - Multi-Layered Masking */}
        <div style={{
          flex: 1,
          position: 'relative',
          display: 'flex',
          alignItems: 'center', // Centered properly now
          justifyContent: 'center',
          zIndex: 20,
          transform: 'translateZ(50px) scale(1.1)',
          pointerEvents: 'none'
        }}>
           {/* Secondary Glow behind person */}
           <div style={{
              position: 'absolute',
              width: '400px',
              height: '400px',
              top: '20%',
              background: `radial-gradient(circle at 50% 50%, ${behindGlowColor}, transparent 75%)`,
              opacity: 0.4,
              filter: 'blur(50px)',
              zIndex: -1
           }} />

          <img 
            src={avatarUrl} 
            alt={name}
            style={{
              width: '100%',
              height: '100%', 
              objectFit: 'cover',
              objectPosition: 'center center', // Perfectly centered
              // Soft vignette to merge with the card edges
              maskImage: 'radial-gradient(circle at 50% 50%, black 50%, transparent 95%)',
              WebkitMaskImage: 'radial-gradient(circle at 50% 50%, black 50%, transparent 95%)',
              filter: 'brightness(1.05) contrast(1.1) saturate(0.95)',
              userSelect: 'none',
              transition: 'transform 0.4s cubic-bezier(0.23, 1, 0.32, 1)',
            }}
          />
        </div>

        {/* Bottom Ambient Occlusion */}
        <div style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: '150px',
          background: 'linear-gradient(to top, rgba(5, 10, 25, 0.6) 0%, transparent 100%)',
          zIndex: 25,
          pointerEvents: 'none'
        }} />
      </div>

      <style jsx>{`
        .profile-card-premium-container {
          cursor: pointer;
        }
        .card-shell:hover {
            border-color: rgba(255, 255, 255, 0.18);
            box-shadow: 0 50px 120px rgba(0,0,0,0.7), inset 0 0 0 1px rgba(255,255,255,0.1);
        }
        img {
            display: block;
        }
      `}</style>
    </div>
  );
};

export default ProfileCard;
