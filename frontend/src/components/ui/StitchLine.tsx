'use client';

import React from 'react';
import { RevealOnScroll } from './RevealOnScroll';

// A gold "thread" that sews itself across the page when scrolled into view,
// with a needle riding the end of the stitch.
export const StitchLine: React.FC<{ className?: string }> = ({ className = '' }) => (
  <RevealOnScroll className={`max-w-6xl mx-auto px-4 ${className}`}>
    <div className="stitch-draw relative">
      <svg viewBox="0 0 1200 40" preserveAspectRatio="none" className="w-full h-8" aria-hidden="true">
        <path
          d="M0 20 C 150 5, 300 35, 450 20 S 750 5, 900 20 S 1100 35, 1200 20"
          className="stitch-path"
          stroke="rgb(var(--color-gold))"
          strokeWidth="2.5"
          strokeLinecap="round"
          fill="none"
        />
      </svg>
    </div>
  </RevealOnScroll>
);
