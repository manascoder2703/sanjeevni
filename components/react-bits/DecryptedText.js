'use client';
import { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';

/**
 * DecryptedText - A hacker-style scrambling animation for text.
 * Inspired by React Bits (reactbits.dev)
 */
export default function DecryptedText({
  text,
  speed = 50,
  maxIterations = 10,
  sequential = false,
  revealDirection = 'start',
  useOriginalCharsOnly = false,
  animateOn = 'view',
  className = '',
  parentClassName = '',
  ...props
}) {
  const [displayText, setDisplayText] = useState(text);
  const [isHovering, setIsHovering] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [hasMounted, setHasMounted] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  const chars = '-./*!"#$ %&()=?@[]{}<>^_~+;:,';

  useEffect(() => {
    let interval;
    let iteration = 0;

    const startAnimation = () => {
      setIsAnimating(true);
      iteration = 0;
      
      const targetText = text;
      
      interval = setInterval(() => {
        setDisplayText(prevText => 
          targetText.split('').map((char, index) => {
            if (index < iteration) {
              return targetText[index];
            }
            if (char === ' ') return ' ';
            return chars[Math.floor(Math.random() * chars.length)];
          }).join('')
        );

        if (iteration >= targetText.length) {
          clearInterval(interval);
          setIsAnimating(false);
        }

        iteration += 1 / (maxIterations / 10);
      }, speed);
    };

    if (animateOn === 'view') {
       startAnimation();
    } else if (animateOn === 'hover' && isHovering && !isAnimating) {
       startAnimation();
    }

    return () => clearInterval(interval);
  }, [text, speed, maxIterations, animateOn, isHovering]);

  return (
    <span
      ref={containerRef}
      className={parentClassName}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      {...props}
    >
      <span 
        className={className}
        suppressHydrationWarning
      >
        {!hasMounted ? text : displayText}
      </span>
    </span>
  );
}
