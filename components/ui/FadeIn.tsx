'use client';

import { useEffect, useRef } from 'react';

interface FadeInProps {
  children: React.ReactNode;
  className?: string;
  // Stagger delay in ms — 0 for no delay
  delay?: number;
}

// IntersectionObserver-based fade-in-up.
// Elements already in the viewport on mount are left visible immediately (no flash).
// Elements below the fold are hidden until scrolled into view, then transition in.
// Uses GPU-composited properties only (opacity + transform) for 60fps performance.
export function FadeIn({ children, className, delay = 0 }: FadeInProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Respect the user's motion preference — skip animation entirely.
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    // If the element is already in the viewport on mount, leave it visible.
    // This avoids a flash of invisible content for above-fold elements.
    const rect = el.getBoundingClientRect();
    const alreadyVisible = rect.top < window.innerHeight && rect.bottom > 0;
    if (alreadyVisible) return;

    // Start hidden below the fold — GPU composited transform + opacity only.
    el.style.opacity = '0';
    el.style.transform = 'translateY(20px)';
    el.style.willChange = 'opacity, transform';

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        el.style.transition = `opacity 0.55s ease-out ${delay}ms, transform 0.55s ease-out ${delay}ms`;
        el.style.opacity = '1';
        el.style.transform = 'translateY(0)';
        // Clean up willChange after animation completes to free compositor resources.
        const cleanup = () => { el.style.willChange = 'auto'; };
        el.addEventListener('transitionend', cleanup, { once: true });
        observer.disconnect();
      },
      { threshold: 0.12, rootMargin: '0px 0px -32px 0px' },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [delay]);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
