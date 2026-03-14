'use client';
import { useRef, useState } from 'react';

/**
 * SpotlightCard - A card with a spotlight effect that follows the cursor.
 * Inspired by React Bits (reactbits.dev)
 */
export default function SpotlightCard({
  children,
  className = '',
  spotlightColor = 'rgba(14, 165, 233, 0.15)', // Default to accent color
  ...props
}) {
  const divRef = useRef(null);
  const [isFocused, setIsFocused] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [opacity, setOpacity] = useState(0);

  const handleMouseMove = (e) => {
    if (!divRef.current || isFocused) return;

    const div = divRef.current;
    const rect = div.getBoundingClientRect();

    setPosition({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  const handleMouseEnter = () => {
    setOpacity(1);
  };

  const handleMouseLeave = () => {
    setOpacity(0);
  };

  const handleFocus = () => {
    setIsFocused(true);
    setOpacity(1);
  };

  const handleBlur = () => {
    setIsFocused(false);
    setOpacity(0);
  };

  return (
    <div
      ref={divRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onFocus={handleFocus}
      onBlur={handleBlur}
      className={`spotlight-card ${className}`}
      {...props}
    >
      <div
        className="spotlight-layer"
        style={{
          opacity,
          background: `radial-gradient(600px circle at ${position.x}px ${position.y}px, ${spotlightColor}, transparent 40%)`,
        }}
      />
      <div className="spotlight-content">{children}</div>

      <style jsx>{`
        .spotlight-card {
          position: relative;
          border-radius: 16px;
          border: 1px solid var(--border);
          background: var(--bg-card);
          overflow: hidden;
          transition: transform 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease;
        }
        .spotlight-card:hover {
          transform: translateY(-5px);
          border-color: rgba(14, 165, 233, 0.3);
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
        }
        .spotlight-layer {
          pointer-events: none;
          position: absolute;
          inset: 0px;
          transition: opacity 0.3s;
          z-index: 1;
        }
        .spotlight-content {
          position: relative;
          z-index: 2;
        }
      `}</style>
    </div>
  );
}
