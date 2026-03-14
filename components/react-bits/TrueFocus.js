'use client';
import { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';

/**
 * TrueFocus - A focused text animation effect.
 * Inspired by React Bits (reactbits.dev)
 */
export default function TrueFocus({
  text = '',
  color = '#0ea5e9',
  fontSize = '3rem',
  fontWeight = '900',
  className = '',
  ...props
}) {
  const [focusIndex, setFocusIndex] = useState(0);
  const words = text.split(' ');

  useEffect(() => {
    const interval = setInterval(() => {
      setFocusIndex((prev) => (prev + 1) % words.length);
    }, 2000);
    return () => clearInterval(interval);
  }, [words.length]);

  return (
    <div className={`true-focus-container ${className}`} style={{ fontSize, fontWeight }} {...props}>
      {words.map((word, i) => (
        <span
          key={i}
          className="true-focus-word"
          style={{
            position: 'relative',
            display: 'inline-block',
            marginRight: '0.5rem',
            color: i === focusIndex ? color : 'var(--text-muted)',
            transition: 'all 0.5s ease',
            filter: i === focusIndex ? 'blur(0px)' : 'blur(2px)',
            opacity: i === focusIndex ? 1 : 0.4,
            transform: i === focusIndex ? 'scale(1.1)' : 'scale(1)',
          }}
        >
          {word}
          {i === focusIndex && (
             <motion.div
                layoutId="focus-box"
                className="focus-box"
                style={{
                  position: 'absolute',
                  inset: '-4px -8px',
                  border: `2px solid ${color}`,
                  borderRadius: '8px',
                  pointerEvents: 'none',
                  zIndex: -1
                }}
             />
          )}
        </span>
      ))}
      <style jsx>{`
        .true-focus-container {
          display: flex;
          flex-wrap: wrap;
          justify-content: center;
          align-items: center;
        }
      `}</style>
    </div>
  );
}
