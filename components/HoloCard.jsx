'use client';
import { useState, useRef } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';

export default function HoloCard({ children, className = '', containerStyle = {}, spotlightColor = 'rgba(255, 255, 255, 0.05)' }) {
  const [isHovered, setIsHovered] = useState(false);
  const cardRef = useRef(null);

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  // Smooth out mouse movement
  const springX = useSpring(mouseX, { stiffness: 150, damping: 20 });
  const springY = useSpring(mouseY, { stiffness: 150, damping: 20 });

  const handleMouseMove = (e) => {
    if (!cardRef.current) return;
    const { left, top, width, height } = cardRef.current.getBoundingClientRect();
    const x = e.clientX - left;
    const y = e.clientY - top;
    mouseX.set(x);
    mouseY.set(y);
  };

  const background = useTransform(
    [springX, springY],
    ([x, y]) => `radial-gradient(circle at ${x}px ${y}px, ${spotlightColor}, transparent 80%)`
  );

  return (
    <motion.div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -5 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className={`glass-card relative overflow-visible group ${className}`}
      style={containerStyle}
    >
      {/* Dynamic Spotlight Effect */}
      <motion.div
        className="absolute inset-0 pointer-events-none z-0"
        style={{ background }}
      />

      {/* Internal Glow on Hover */}
      <AnimatePresence>
        {isHovered && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-blue-500/5 blur-[80px] -z-10 pointer-events-none"
          />
        )}
      </AnimatePresence>

      {/* Medical Grid Overlay */}
      <div className="absolute inset-0 medical-grid-overlay opacity-20 pointer-events-none" />

      {/* Content Rendering */}
      <div className="relative z-10 w-full h-full">
        {children}
      </div>
    </motion.div>
  );
}

import { AnimatePresence } from 'framer-motion';
