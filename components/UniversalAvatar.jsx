'use client';

import React from 'react';

/**
 * UniversalAvatar
 * 
 * A dynamic profile picture resolver that handles:
 * 1. User-uploaded profile pictures (base64 or URL)
 * 2. Premium 3D cartoon fallbacks based on gender (male/female)
 * 3. Default fallback for unknown gender
 * 
 * @param {Object} user - The user object from AuthContext
 * @param {string} size - Tailwind size class (default: size-8)
 * @param {string} className - Additional CSS classes
 */
export default function UniversalAvatar({ user, size = 'size-8', className = '' }) {
  const avatarUrl = user?.avatar;
  const gender = user?.gender?.toLowerCase();
  
  // Deterministic randomization for premium avatars (pick 1 or 2 based on user identifier)
  const idValue = user?.id || user?._id || user?.name || '1';
  const avatarIndex = (idValue.toString().split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % 2) + 1;
  
  // High-fidelity 3D Cartoon Fallbacks
  const defaults = user?.role === 'patient'
    ? {
        male: '/avatars/male_cartoon.png',
        female: '/avatars/female_cartoon.png',
      }
    : {
        male: `/avatars/male_premium_${avatarIndex}.png`,
        female: `/avatars/female_premium_${avatarIndex}.png`,
      };

  // Resolve source: custom photo > gender-based cartoon > generic male cartoon
  const src = avatarUrl || defaults[gender] || defaults.male;

  return (
    <div className={`${size} rounded-full overflow-hidden border border-white/20 bg-white/5 flex items-center justify-center shrink-0 ${className}`}>
      <img 
        src={src} 
        alt={user?.name || 'User Avatar'} 
        className="w-full h-full object-cover"
        loading="lazy"
        onError={(e) => {
          // Final safety fallback if image fails to load
          e.currentTarget.src = defaults.male;
        }}
      />
    </div>
  );
}
