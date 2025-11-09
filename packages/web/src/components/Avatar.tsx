import Image from 'next/image';

interface AvatarProps {
  src?: string;
  name: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeClasses = {
  sm: 'w-6 h-6 text-sm',
  md: 'w-10 h-10 text-base',
  lg: 'w-16 h-16 text-xl',
};

/**
 * Optimized Avatar component with Next.js Image
 * Falls back to initials if no picture provided
 */
export function Avatar({ src, name, size = 'sm', className = '' }: AvatarProps) {
  const sizeClass = sizeClasses[size];
  const combinedClassName = `rounded-full ${sizeClass} ${className}`;

  if (!src) {
    // Fallback to initials
    const initial = (name || '?')[0].toUpperCase();
    return (
      <div
        className={`${combinedClassName} bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center font-bold`}
      >
        {initial}
      </div>
    );
  }

  // Next.js Image with optimization
  return (
    <div className={`relative ${sizeClass}`}>
      <Image
        src={src}
        alt={name}
        fill
        className={`${combinedClassName} object-cover`}
        sizes={size === 'sm' ? '24px' : size === 'md' ? '40px' : '64px'}
        priority={false}
        unoptimized={src.includes('googleusercontent.com') || src.includes('auth0')} // Skip optimization for external CDNs
      />
    </div>
  );
}
