'use client';

/**
 * ShinyText - Adds a shining gradient animation to text.
 * Inspired by React Bits (reactbits.dev)
 */
export default function ShinyText({
  text,
  disabled = false,
  speed = 5,
  className = '',
  style = {},
  ...props
}) {
  const animationDuration = `${speed}s`;

  return (
    <span
      className={`shiny-text ${disabled ? 'disabled' : ''} ${className}`}
      style={{ 
        ...style,
        animationDuration,
        '--shiny-speed': animationDuration 
      }}
      {...props}
    >
      {text}
      <style jsx>{`
        .shiny-text {
          color: #b5b5b5a4;
          background: linear-gradient(
            120deg,
            rgba(255, 255, 255, 0) 40%,
            rgba(255, 255, 255, 0.8) 50%,
            rgba(255, 255, 255, 0) 60%
          );
          background-size: 200% 100%;
          -webkit-background-clip: text;
          background-clip: text;
          display: inline-block;
          animation: shine linear infinite;
        }

        .shiny-text.disabled {
          animation: none;
        }

        @keyframes shine {
          0% {
            background-position: 100% 0;
          }
          100% {
            background-position: -100% 0;
          }
        }
      `}</style>
    </span>
  );
}
