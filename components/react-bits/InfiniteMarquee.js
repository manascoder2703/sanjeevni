'use client';

import { useRef, useEffect } from 'react';
import { gsap } from 'gsap';

const InfiniteMarquee = ({ 
  children, 
  speed = 1, 
  direction = 'left', 
  pauseOnHover = true,
  className = "" 
}) => {
  const containerRef = useRef(null);
  const wrapperRef = useRef(null);

  useEffect(() => {
    if (!wrapperRef.current) return;

    const wrapper = wrapperRef.current;
    const items = Array.from(wrapper.children);
    
    // Clone children to create the infinite effect
    items.forEach(item => {
      const clone = item.cloneNode(true);
      wrapper.appendChild(clone);
    });

    const totalWidth = wrapper.scrollWidth / 2;
    
    const xMove = direction === 'left' ? -totalWidth : totalWidth;
    const initialX = direction === 'left' ? 0 : -totalWidth;

    const animation = gsap.to(wrapper, {
      x: xMove,
      duration: totalWidth / (50 * speed),
      ease: "none",
      repeat: -1,
      paused: false,
    });

    if (pauseOnHover) {
      const handleMouseEnter = () => animation.pause();
      const handleMouseLeave = () => animation.play();

      containerRef.current.addEventListener('mouseenter', handleMouseEnter);
      containerRef.current.addEventListener('mouseleave', handleMouseLeave);

      return () => {
        if (containerRef.current) {
          containerRef.current.removeEventListener('mouseenter', handleMouseEnter);
          containerRef.current.removeEventListener('mouseleave', handleMouseLeave);
        }
        animation.kill();
      };
    }

    return () => animation.kill();
  }, [speed, direction, pauseOnHover, children]);

  return (
    <div 
      ref={containerRef}
      className={`relative overflow-hidden w-full ${className}`}
      style={{ 
        maskImage: 'linear-gradient(to right, transparent, black 15%, black 85%, transparent)',
        WebkitMaskImage: 'linear-gradient(to right, transparent, black 15%, black 85%, transparent)',
      }}
    >
      <div 
        ref={wrapperRef} 
        className="flex whitespace-nowrap py-8 gap-8 w-fit"
      >
        {children}
      </div>
    </div>
  );
};

export default InfiniteMarquee;
