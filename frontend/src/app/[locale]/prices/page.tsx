'use client';

import React from 'react';
import { useLocale } from 'next-intl';
import { PriceGuide } from '@/components/features/PriceGuide';

export default function PricesPage() {
  const isAr = useLocale() === 'ar';

  return (
    <div className="max-w-4xl mx-auto px-4 py-16 pt-28 space-y-10">
      <div className="text-center space-y-4 max-w-2xl mx-auto">
        <span className="inline-block px-3.5 py-1 rounded-full bg-[#F4F4F5] text-[0.8125rem] font-medium text-[#18181B] border border-[#E4E4E7]">
          {isAr ? 'دليل الأسعار' : 'Price guide'}
        </span>
        <h1 className="text-3xl sm:text-5xl font-bold text-[#18181B] tracking-tight">
          {isAr ? 'أسعار واضحة قبل ما تحجز' : 'Know the price before you book'}
        </h1>
        <p className="text-lg text-[#71717A] leading-relaxed">
          {isAr
            ? 'اختر نوع القطعة وشوف متوسط أسعار التعديلات الشائعة بالسوق.'
            : 'Pick a garment type to see typical market prices for common alterations.'}
        </p>
      </div>
      <PriceGuide />
    </div>
  );
}
