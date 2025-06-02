'use client';

import Link from 'next/link';
import Image from 'next/image';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  className?: string;
}

export default function Logo({ size = 'md', showText = true, className = '' }: LogoProps) {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12', 
    lg: 'w-16 h-16'
  };

  const textSizeClasses = {
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-2xl'
  };

  return (
    <Link 
      href="/" 
      className={`flex items-center gap-3 hover:opacity-80 transition-opacity ${className}`}
    >
      {/* Professional Camera Icon with Fork & Knife */}
      <div className={`relative ${sizeClasses[size]} flex-shrink-0`}>
        <svg viewBox="0 0 100 100" className="w-full h-full">
          {/* Camera Body - Main Rectangle */}
          <rect x="15" y="25" width="70" height="50" rx="8" ry="8" fill="#1e40af" stroke="#2563eb" strokeWidth="1.5"/>
          
          {/* Camera Top Section */}
          <rect x="25" y="18" width="50" height="12" rx="6" ry="6" fill="#1e40af"/>
          
          {/* Camera Lens Outer Ring */}
          <circle cx="50" cy="50" r="16" fill="#f8fafc" stroke="#2563eb" strokeWidth="2"/>
          
          {/* Camera Lens Inner Ring */}
          <circle cx="50" cy="50" r="12" fill="#1e40af" stroke="#2563eb" strokeWidth="1"/>
          
          {/* Fork (Left side of lens) */}
          <g transform="translate(43, 43)">
            {/* Fork Handle */}
            <rect x="0" y="6" width="1.5" height="8" fill="#f8fafc" rx="0.5"/>
            {/* Fork Tines */}
            <rect x="-1.5" y="4" width="0.8" height="3" fill="#f8fafc" rx="0.3"/>
            <rect x="-0.3" y="4" width="0.8" height="3" fill="#f8fafc" rx="0.3"/>
            <rect x="0.9" y="4" width="0.8" height="3" fill="#f8fafc" rx="0.3"/>
            <rect x="2.1" y="4" width="0.8" height="3" fill="#f8fafc" rx="0.3"/>
          </g>
          
          {/* Knife (Right side of lens) */}
          <g transform="translate(55, 43)">
            {/* Knife Handle */}
            <rect x="0" y="6" width="1.5" height="8" fill="#f8fafc" rx="0.5"/>
            {/* Knife Blade */}
            <polygon points="0,4 1.5,4 2.5,6 1.5,8 0,8" fill="#f8fafc"/>
          </g>
          
          {/* Camera Flash */}
          <rect x="70" y="22" width="6" height="4" rx="1.5" ry="1.5" fill="#f8fafc"/>
          
          {/* Camera Viewfinder */}
          <rect x="30" y="22" width="4" height="3" rx="0.5" ry="0.5" fill="#f8fafc"/>
          
          {/* Camera Grip Lines */}
          <line x1="18" y1="30" x2="18" y2="70" stroke="#2563eb" strokeWidth="0.5"/>
          <line x1="20" y1="32" x2="20" y2="68" stroke="#2563eb" strokeWidth="0.5"/>
          <line x1="82" y1="30" x2="82" y2="70" stroke="#2563eb" strokeWidth="0.5"/>
          <line x1="80" y1="32" x2="80" y2="68" stroke="#2563eb" strokeWidth="0.5"/>
        </svg>
      </div>
      
      {/* Text Logo */}
      {showText && (
        <span className={`font-bold text-slate-100 ${textSizeClasses[size]}`}>
          Snap<span className="text-blue-400">2</span>Health
        </span>
      )}
    </Link>
  );
} 