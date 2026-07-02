'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';

export interface GridPhoto {
  src: string;
  alt: string;
  label?: string; // Optional tournament/event context shown on hover
}

interface PhotoGridProps {
  photos: GridPhoto[];
  columns?: 2 | 3 | 4;
  className?: string;
}

export function PhotoGrid({ photos, columns = 3, className }: PhotoGridProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const close = useCallback(() => setSelectedIndex(null), []);
  const prev = useCallback(
    () => setSelectedIndex((i) => (i !== null ? (i - 1 + photos.length) % photos.length : null)),
    [photos.length],
  );
  const next = useCallback(
    () => setSelectedIndex((i) => (i !== null ? (i + 1) % photos.length : null)),
    [photos.length],
  );

  useEffect(() => {
    if (selectedIndex === null) return undefined;

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowLeft') setSelectedIndex((i) => (i !== null ? (i - 1 + photos.length) % photos.length : null));
      if (e.key === 'ArrowRight') setSelectedIndex((i) => (i !== null ? (i + 1) % photos.length : null));
    };

    window.addEventListener('keydown', onKeyDown);

    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [selectedIndex, close, photos.length]);

  const colClass =
    columns === 2
      ? 'grid-cols-2'
      : columns === 4
        ? 'grid-cols-2 sm:grid-cols-4'
        : 'grid-cols-2 sm:grid-cols-3';

  return (
    <>
      <div className={`grid gap-2 ${colClass} ${className ?? ''}`}>
        {photos.map((photo, i) => (
          <button
            key={photo.src}
            type="button"
            onClick={() => setSelectedIndex(i)}
            className="group relative aspect-[4/3] overflow-hidden rounded-lg bg-gray-800 focus:outline-none focus:ring-2 focus:ring-brand-500/60"
            aria-label={`View photo: ${photo.alt}`}
          >
            <Image
              src={photo.src}
              alt={photo.alt}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              sizes="(max-width: 640px) 50vw, (max-width: 1280px) 33vw, 400px"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-black/0 transition-colors duration-300 group-hover:bg-black/20" />
            {photo.label && (
              <div className="absolute inset-x-0 bottom-0 translate-y-full bg-gradient-to-t from-black/75 to-transparent px-3 py-2.5 transition-transform duration-300 group-hover:translate-y-0">
                <p className="text-xs font-semibold tracking-wide text-white">{photo.label}</p>
              </div>
            )}
          </button>
        ))}
      </div>

      {selectedIndex !== null && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Photo viewer"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/92 p-4 animate-fade-in"
          onClick={close}
        >
          <div
            className="relative flex max-h-[90vh] max-w-[90vw] items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative max-h-[85vh] max-w-[85vw] overflow-hidden rounded-lg">
              <Image
                src={photos[selectedIndex].src}
                alt={photos[selectedIndex].alt}
                width={1200}
                height={800}
                className="max-h-[85vh] w-auto object-contain"
                sizes="90vw"
                priority
              />
            </div>
          </div>

          <button
            type="button"
            onClick={close}
            className="absolute right-4 top-4 rounded-full bg-black/60 p-2 text-white transition-colors hover:bg-black/80 focus:outline-none focus:ring-2 focus:ring-white/40"
            aria-label="Close photo viewer"
          >
            <X className="h-6 w-6" />
          </button>

          {photos.length > 1 && (
            <>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); prev(); }}
                className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-black/60 p-3 text-white transition-colors hover:bg-black/80 focus:outline-none focus:ring-2 focus:ring-white/40 sm:left-6"
                aria-label="Previous photo"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>

              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); next(); }}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-black/60 p-3 text-white transition-colors hover:bg-black/80 focus:outline-none focus:ring-2 focus:ring-white/40 sm:right-6"
                aria-label="Next photo"
              >
                <ChevronRight className="h-6 w-6" />
              </button>

              <p className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-black/50 px-3 py-1 text-sm text-white/80">
                {selectedIndex + 1} / {photos.length}
              </p>
            </>
          )}
        </div>
      )}
    </>
  );
}
