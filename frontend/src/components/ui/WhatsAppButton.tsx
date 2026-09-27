'use client';

import React from 'react';
import { useLocale } from 'next-intl';

// Digits only, international format without "+", e.g. 966501234567.
const NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER;

export const WhatsAppButton: React.FC = () => {
  const isAr = useLocale() === 'ar';
  if (!NUMBER) return null;

  const text = encodeURIComponent(
    isAr ? 'مرحبا، بدي استفسر عن خدمة تعديل ملابس' : "Hi, I'd like to ask about an alteration"
  );

  return (
    <a
      href={`https://wa.me/${NUMBER}?text=${text}`}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="WhatsApp"
      className="fixed bottom-6 end-6 z-50 w-14 h-14 rounded-full bg-[#25D366] text-white shadow-xl flex items-center justify-center hover:scale-110 transition-transform animate-float"
    >
      <svg viewBox="0 0 24 24" className="w-7 h-7" fill="currentColor" aria-hidden="true">
        <path d="M17.47 14.38c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.64.07-.3-.15-1.26-.46-2.4-1.48-.89-.79-1.49-1.77-1.66-2.07-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.62-.92-2.22-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48 0 1.46 1.07 2.88 1.21 3.08.15.2 2.1 3.2 5.08 4.49.71.31 1.27.49 1.7.63.72.23 1.37.2 1.88.12.57-.09 1.76-.72 2.01-1.41.25-.7.25-1.29.17-1.41-.07-.13-.27-.2-.57-.35zM12.05 21.8h-.01a9.8 9.8 0 01-5-1.37l-.36-.21-3.72.98 1-3.63-.24-.37a9.78 9.78 0 01-1.5-5.2c0-5.42 4.41-9.83 9.84-9.83 2.63 0 5.1 1.03 6.95 2.88a9.77 9.77 0 012.88 6.96c0 5.42-4.41 9.83-9.84 9.83zm8.37-18.2A11.76 11.76 0 0012.05 0C5.5 0 .17 5.33.17 11.88c0 2.1.55 4.14 1.59 5.94L.07 24l6.33-1.66a11.87 11.87 0 005.64 1.44h.01c6.55 0 11.88-5.33 11.88-11.88 0-3.17-1.23-6.16-3.48-8.4z" />
      </svg>
    </a>
  );
};
