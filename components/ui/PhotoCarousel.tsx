'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { MediaPhoto } from '@/lib/media';

interface PhotoCarouselProps {
  photos: MediaPhoto[];
  /** Auto-advance interval in ms (default 4 500). Disabled when prefers-reduced-motion. */
  interval?: number;
  className?: string;
}

export function PhotoCarousel({ photos, interval = 4500, className }: PhotoCarouselProps) {
  const [current, setCurrent] = useState(0);
  const [animating, setAnimating] = useState(false);
  const paused = useRef(false);
  const reducedMotion = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Detect reduced-motion preference once on mount
  useEffect(() => {
    reducedMotion.current = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }, []);

  const go = (next: number) => {
    if (animating) return;
    const target = (next + photos.length) % photos.length;
    if (reducedMotion.current) {
      // Skip fade animation — swap instantly
      setCurrent(target);
      return;
    }
    setAnimating(true);
    setTimeout(() => {
      setCurrent(target);
      setAnimating(false);
    }, 250);
  };

  // Auto-advance — disabled for reduced-motion users
  useEffect(() => {
    if (reducedMotion.current) return;
    const timer = setInterval(() => {
      if (!paused.current) go((current + 1) % photos.length);
    }, interval);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current, interval, photos.length]);

  // Keyboard navigation when the carousel is focused/hovered
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft')  { e.preventDefault(); go(current - 1); }
      if (e.key === 'ArrowRight') { e.preventDefault(); go(current + 1); }
    };
    el.addEventListener('keydown', onKeyDown);
    return () => el.removeEventListener('keydown', onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current]);

  return (
    <div
      ref={containerRef}
      // tabIndex makes the container focusable so arrow-key nav works
      tabIndex={0}
      role="region"
      aria-label="Photo carousel"
      className={`group relative overflow-hidden rounded-2xl bg-gray-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/60 ${className ?? ''}`}
      onMouseEnter={() => { paused.current = true; }}
      onMouseLeave={() => { paused.current = false; }}
    >
      {/* Accessible live region: announces slide changes to screen readers */}
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        Photo {current + 1} of {photos.length}: {photos[current].alt}
      </div>

      {/* Main image */}
      <div className="relative aspect-[16/9]">
        <Image
          key={photos[current].src}
          src={photos[current].src}
          alt={photos[current].alt}
          fill
          className={`object-cover object-center transition-opacity duration-300 ${
            animating ? 'opacity-0' : 'opacity-100'
          }`}
          sizes="(max-width: 768px) 100vw, (max-width: 1280px) 80vw, 960px"
          loading="lazy"
        />

        {/* Hidden preload: warms the next image in the browser cache */}
        {photos.length > 1 && (
          <Image
            key={`pre-${photos[(current + 1) % photos.length].src}`}
            src={photos[(current + 1) % photos.length].src}
            alt=""
            fill
            aria-hidden
            className="pointer-events-none opacity-0"
            sizes="1px"
            loading="eager"
          />
        )}

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-transparent to-transparent" />

        {/* Tournament label */}
        {photos[current].label && (
          <span className="absolute bottom-10 left-4 rounded-full bg-black/45 px-3 py-1 text-xs font-semibold text-white backdrop-blur-sm">
            {photos[current].label}
          </span>
        )}

        {/* Prev / Next arrows — visible on hover or focus-within */}
        {photos.length > 1 && (
          <>
            <button
              type="button"
              aria-label="Previous photo"
              onClick={() => go(current - 1)}
              className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white opacity-0 transition-all duration-200 group-hover:opacity-100 hover:bg-black/70 hover:scale-110 focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-white/40"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              aria-label="Next photo"
              onClick={() => go(current + 1)}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white opacity-0 transition-all duration-200 group-hover:opacity-100 hover:bg-black/70 hover:scale-110 focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-white/40"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </>
        )}
      </div>

      {/* Navigation dots */}
      {photos.length > 1 && (
        <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5" role="tablist" aria-label="Select photo">
          {photos.map((photo, i) => (
            <button
              key={i}
              type="button"
              role="tab"
              aria-selected={i === current}
              aria-label={`Photo ${i + 1}: ${photo.alt}`}
              onClick={() => go(i)}
              className={`h-1.5 rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-white/60 ${
                i === current ? 'w-6 bg-white' : 'w-1.5 bg-white/40 hover:bg-white/70'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
