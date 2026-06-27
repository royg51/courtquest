'use client';

import { useEffect } from 'react';
import confetti from 'canvas-confetti';

// Fires once on mount — used only on the post-checkout success state, never
// on a normal page load, so it doesn't get old or annoying on repeat visits.
export function DonationConfetti() {
  useEffect(() => {
    confetti({
      particleCount: 120,
      spread: 80,
      origin: { y: 0.6 },
      colors: ['#ef4444', '#f87171', '#fca5a5', '#fbbf24'],
    });
  }, []);

  return null;
}
