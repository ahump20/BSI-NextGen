'use client';

import { useState, useRef, TouchEvent } from 'react';
import type { Game } from '@bsi/shared';

interface SwipeableGameCardProps {
  game: Game;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  children?: React.ReactNode;
}

export function SwipeableGameCard({
  game,
  onSwipeLeft,
  onSwipeRight,
  children,
}: SwipeableGameCardProps) {
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);
  const [translateX, setTranslateX] = useState(0);
  const [swiping, setSwiping] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const minSwipeDistance = 50;
  const maxSwipeDistance = 100;

  const handleTouchStart = (e: TouchEvent) => {
    setTouchEnd(0);
    setTouchStart(e.targetTouches[0].clientX);
    setSwiping(true);
  };

  const handleTouchMove = (e: TouchEvent) => {
    const currentTouch = e.targetTouches[0].clientX;
    setTouchEnd(currentTouch);

    const distance = currentTouch - touchStart;
    const cappedDistance = Math.max(
      -maxSwipeDistance,
      Math.min(maxSwipeDistance, distance)
    );
    setTranslateX(cappedDistance);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;

    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe && onSwipeLeft) {
      onSwipeLeft();
    }

    if (isRightSwipe && onSwipeRight) {
      onSwipeRight();
    }

    // Reset
    setTranslateX(0);
    setSwiping(false);
    setTouchStart(0);
    setTouchEnd(0);
  };

  return (
    <div className="relative overflow-hidden rounded-lg">
      {/* Swipe Actions Background */}
      <div className="absolute inset-0 flex items-center justify-between px-6">
        <div className="flex items-center gap-2 text-green-400">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
          <span className="font-medium">Favorite</span>
        </div>
        <div className="flex items-center gap-2 text-blue-400">
          <span className="font-medium">Share</span>
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
          </svg>
        </div>
      </div>

      {/* Swipeable Card */}
      <div
        ref={cardRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className="relative bg-gray-900"
        style={{
          transform: `translateX(${translateX}px)`,
          transition: swiping ? 'none' : 'transform 0.3s ease-out',
        }}
      >
        {children}
      </div>
    </div>
  );
}
