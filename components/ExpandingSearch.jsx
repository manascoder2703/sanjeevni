'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X } from 'lucide-react';

export default function ExpandingSearch() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const inputRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    if (isExpanded && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isExpanded]);

  const handleClear = () => {
    setSearchValue("");
    if (inputRef.current) inputRef.current.focus();
  };

  return (
    <div 
      ref={containerRef}
      onMouseEnter={() => setIsExpanded(true)}
      onMouseLeave={() => {
        if (!searchValue && document.activeElement !== inputRef.current) {
          setIsExpanded(false);
        }
      }}
      className="relative flex items-center justify-end"
    >
      <motion.div
        initial={false}
        animate={{
          width: isExpanded ? 280 : 44,
          backgroundColor: isExpanded ? "rgba(255, 255, 255, 0.05)" : "rgba(255, 255, 255, 0)",
          borderColor: isExpanded ? "rgba(255, 255, 255, 0.4)" : "rgba(255, 255, 255, 0.1)",
          boxShadow: isExpanded 
            ? "0 0 20px rgba(255, 255, 255, 0.1), inset 0 0 10px rgba(255, 255, 255, 0.05)" 
            : "0 0 0px rgba(255, 255, 255, 0)",
        }}
        transition={{
          type: "spring",
          stiffness: 300,
          damping: 30
        }}
        className="h-11 rounded-full border backdrop-blur-xl flex items-center overflow-hidden relative group cursor-pointer shadow-lg"
      >
        <div className="absolute left-3 flex items-center justify-center pointer-events-none">
          <Search 
            size={20} 
            className={`transition-colors duration-300 ${isExpanded ? "text-white" : "text-white/40 group-hover:text-white/70"}`} 
          />
        </div>

        <input
          ref={inputRef}
          type="text"
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          onFocus={() => setIsExpanded(true)}
          onBlur={() => {
            if (!searchValue) setIsExpanded(false);
          }}
          placeholder="Search records..."
          className={`
            pl-12! bg-transparent border-none outline-none text-white placeholder-white/20 text-sm font-medium w-full pr-10
            transition-opacity duration-300 ${isExpanded ? "opacity-100" : "opacity-0 pointer-events-none"}
          `}
        />

        <AnimatePresence>
          {isExpanded && searchValue && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              onClick={handleClear}
              className="absolute right-3 text-white/40 hover:text-white transition-colors"
            >
              <X size={16} />
            </motion.button>
          )}
        </AnimatePresence>

        {/* White Shiny Border Pulse Overlay */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 rounded-full border border-white/40 pointer-events-none shadow-[0_0_15px_rgba(255,255,255,0.2)] animate-pulse"
              style={{ animationDuration: '3s' }}
            />
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
