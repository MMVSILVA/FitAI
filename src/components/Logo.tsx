import React from 'react';

export const Logo = ({ className = "w-12 h-12" }: { className?: string }) => (
  <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <g transform="rotate(-45 50 50)" fill="#ffffff">
      {/* Bar */}
      <rect x="15" y="44" width="70" height="12" rx="2" />
      {/* Inner Plates */}
      <rect x="28" y="20" width="14" height="60" rx="3" />
      <rect x="58" y="20" width="14" height="60" rx="3" />
      {/* Outer Plates */}
      <rect x="18" y="30" width="8" height="40" rx="2" />
      <rect x="74" y="30" width="8" height="40" rx="2" />
      {/* End Caps */}
      <rect x="10" y="40" width="6" height="20" rx="1" />
      <rect x="84" y="40" width="6" height="20" rx="1" />
    </g>
  </svg>
);
