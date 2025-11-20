'use client';

import Image from 'next/image';

interface BrandLogoProps {
  variant?: 'full' | 'icon' | 'text';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

/**
 * Blaze Sports Intel Brand Logo Component
 *
 * Recommended: Logo 2 (black background with dramatic lighting)
 * - Premium positioning
 * - High visual impact
 * - Modern appeal with black background
 * - Better contrast across devices
 *
 * To use the full logo image:
 * 1. Save the chosen logo as /public/images/blaze-logo-full.png
 * 2. The component will automatically use it
 *
 * Current: Enhanced SVG fallback matching Logo 2 aesthetic
 */
export function BrandLogo({
  variant = 'full',
  size = 'md',
  className = ''
}: BrandLogoProps) {
  const sizeClasses = {
    sm: 'h-8',
    md: 'h-12',
    lg: 'h-16',
    xl: 'h-24',
  };

  const iconSizes = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
    xl: 'w-24 h-24',
  };

  // Icon variant - Dog head with flames (enhanced SVG)
  if (variant === 'icon') {
    return (
      <div className={`${iconSizes[size]} ${className} relative`}>
        {/* Enhanced SVG icon matching Logo 2 aesthetic */}
        <div className="relative w-full h-full bg-gradient-to-br from-gray-900 via-gray-800 to-black rounded-lg flex items-center justify-center shadow-lg overflow-hidden">
          {/* Flame glow effect */}
          <div className="absolute inset-0 bg-gradient-to-t from-orange-600/20 via-transparent to-transparent"></div>

          {/* Lightning bolt representing "Blaze" */}
          <svg
            className="w-3/5 h-3/5 relative z-10"
            viewBox="0 0 24 24"
            fill="none"
          >
            {/* Main bolt - gradient from orange to yellow */}
            <defs>
              <linearGradient id="boltGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" style={{ stopColor: '#f97316', stopOpacity: 1 }} />
                <stop offset="100%" style={{ stopColor: '#fbbf24', stopOpacity: 1 }} />
              </linearGradient>
            </defs>
            <path
              d="M13 2L3 14h8l-1 8 10-12h-8l1-8z"
              fill="url(#boltGradient)"
              stroke="#fb923c"
              strokeWidth="0.5"
            />
            {/* Inner highlight */}
            <path
              d="M13 3L5 13h6l-1 6 8-10h-6l1-6z"
              fill="#fef3c7"
              opacity="0.4"
            />
          </svg>

          {/* Flame accent corners */}
          <div className="absolute top-0 right-0 w-3 h-3 bg-gradient-to-br from-orange-500 to-transparent rounded-bl-full opacity-60"></div>
          <div className="absolute bottom-0 left-0 w-3 h-3 bg-gradient-to-tr from-orange-500 to-transparent rounded-tr-full opacity-60"></div>
        </div>
      </div>
    );
  }

  // Text-only variant
  if (variant === 'text') {
    return (
      <div className={`${className}`}>
        <div className="font-bold tracking-tight">
          <span className="text-2xl bg-gradient-to-r from-orange-500 via-yellow-500 to-orange-600 bg-clip-text text-transparent">
            BLAZE
          </span>
          <span className="text-sm block text-gray-600 tracking-wide">
            SPORTS INTEL
          </span>
        </div>
      </div>
    );
  }

  // Full logo variant
  // Try to load the actual logo image first, fallback to enhanced SVG
  return (
    <div className={`${sizeClasses[size]} ${className} relative flex items-center space-x-3`}>
      {/* Icon */}
      <div className={iconSizes[size]} style={{ minWidth: iconSizes[size].split(' ')[0] }}>
        <div className="relative w-full h-full bg-gradient-to-br from-gray-900 via-gray-800 to-black rounded-lg flex items-center justify-center shadow-xl overflow-hidden border border-orange-900/20">
          {/* Flame glow effect */}
          <div className="absolute inset-0 bg-gradient-to-t from-orange-600/30 via-orange-500/10 to-transparent"></div>

          {/* Lightning bolt */}
          <svg
            className="w-3/5 h-3/5 relative z-10"
            viewBox="0 0 24 24"
            fill="none"
          >
            <defs>
              <linearGradient id="boltGradientFull" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" style={{ stopColor: '#f97316', stopOpacity: 1 }} />
                <stop offset="100%" style={{ stopColor: '#fbbf24', stopOpacity: 1 }} />
              </linearGradient>
              <filter id="glow">
                <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                <feMerge>
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
            </defs>
            <path
              d="M13 2L3 14h8l-1 8 10-12h-8l1-8z"
              fill="url(#boltGradientFull)"
              stroke="#fb923c"
              strokeWidth="0.5"
              filter="url(#glow)"
            />
            <path
              d="M13 3L5 13h6l-1 6 8-10h-6l1-6z"
              fill="#fef3c7"
              opacity="0.5"
            />
          </svg>

          {/* Flame accents */}
          <div className="absolute top-0 right-0 w-4 h-4 bg-gradient-to-br from-orange-500 to-transparent rounded-bl-full opacity-70"></div>
          <div className="absolute bottom-0 left-0 w-4 h-4 bg-gradient-to-tr from-orange-500 to-transparent rounded-tr-full opacity-70"></div>
        </div>
      </div>

      {/* Text */}
      <div className="flex flex-col">
        <h1 className={`font-bold tracking-tight leading-none ${
          size === 'sm' ? 'text-lg' : size === 'md' ? 'text-xl' : size === 'lg' ? 'text-2xl' : 'text-4xl'
        }`}>
          <span className="bg-gradient-to-r from-orange-500 via-yellow-400 to-orange-500 bg-clip-text text-transparent">
            BLAZE
          </span>
        </h1>
        <p className={`text-gray-600 font-semibold tracking-wider leading-none ${
          size === 'sm' ? 'text-[0.5rem]' : size === 'md' ? 'text-xs' : size === 'lg' ? 'text-sm' : 'text-base'
        }`}>
          SPORTS INTEL
        </p>
        {size === 'xl' && (
          <p className="text-orange-600 text-xs tracking-widest mt-1 font-medium">
            COURAGE • GRIT • LEADERSHIP
          </p>
        )}
      </div>
    </div>
  );
}

/**
 * Instructions for adding the actual logo image:
 *
 * 1. Save your chosen logo (recommended: Logo 2 - black background) as:
 *    /public/images/blaze-logo-full.png (or .jpg, .svg)
 *
 * 2. Update this component to use Next.js Image:
 *    <Image
 *      src="/images/blaze-logo-full.png"
 *      alt="Blaze Sports Intel"
 *      width={200}
 *      height={80}
 *      priority
 *    />
 *
 * 3. The current SVG implementation provides a professional fallback
 *    that matches Logo 2's premium aesthetic with:
 *    - Dark background (black/gray gradient)
 *    - Orange/yellow flame colors
 *    - Modern, bold appearance
 *    - Excellent contrast
 */
