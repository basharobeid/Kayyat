'use client';

import React, { useState } from 'react';
import { useLocale } from 'next-intl';
import { Link } from '@/i18n/routing';

interface PriceRow {
  ar: string;
  en: string;
  min: number;
  max: number;
}

interface PriceCategory {
  id: string;
  icon: string;
  ar: string;
  en: string;
  rows: PriceRow[];
}

// Indicative market ranges only. Real prices come from tailor quotes on each request.
const PRICE_GUIDE: PriceCategory[] = [
  {
    id: 'trousers', icon: '👖', ar: 'بناطيل وجينز', en: 'Trousers & jeans',
    rows: [
      { ar: 'تقصير الحاشية', en: 'Shorten hem', min: 20, max: 35 },
      { ar: 'تقصير مع الحفاظ على الحاشية الأصلية', en: 'Shorten keeping original hem', min: 35, max: 55 },
      { ar: 'تضييق الخصر', en: 'Take in waist', min: 30, max: 50 },
      { ar: 'تضييق الأرجل', en: 'Taper legs', min: 35, max: 60 },
      { ar: 'تبديل سحاب', en: 'Replace zipper', min: 25, max: 40 },
    ],
  },
  {
    id: 'thobe', icon: '🥻', ar: 'ثياب وكنادير', en: 'Thobes & kanduras',
    rows: [
      { ar: 'تقصير الطول', en: 'Shorten length', min: 25, max: 40 },
      { ar: 'تعديل الأكمام والكبك', en: 'Adjust sleeves & cuffs', min: 20, max: 35 },
      { ar: 'تضييق الجوانب', en: 'Take in sides', min: 35, max: 60 },
      { ar: 'تعديل الياقة', en: 'Collar adjustment', min: 30, max: 55 },
      { ar: 'أزرار وكبسات', en: 'Buttons & snaps', min: 10, max: 20 },
    ],
  },
  {
    id: 'abaya', icon: '🧕', ar: 'عبايات', en: 'Abayas',
    rows: [
      { ar: 'تقصير الطول', en: 'Shorten length', min: 30, max: 50 },
      { ar: 'تضييق', en: 'Take in', min: 40, max: 70 },
      { ar: 'تعديل الأكمام', en: 'Adjust sleeves', min: 25, max: 45 },
      { ar: 'إصلاح تطريز', en: 'Embroidery repair', min: 40, max: 120 },
    ],
  },
  {
    id: 'dress', icon: '👗', ar: 'فساتين', en: 'Dresses',
    rows: [
      { ar: 'تقصير فستان عادي', en: 'Shorten day dress', min: 40, max: 70 },
      { ar: 'تقصير فستان سهرة', en: 'Shorten evening gown', min: 60, max: 120 },
      { ar: 'تضييق الصدر والخصر', en: 'Take in bust & waist', min: 50, max: 120 },
      { ar: 'تقصير الحمالات', en: 'Shorten straps', min: 25, max: 45 },
      { ar: 'سحاب مخفي', en: 'Invisible zipper', min: 35, max: 60 },
    ],
  },
  {
    id: 'suit', icon: '🧥', ar: 'بدلات وجاكيتات', en: 'Suits & jackets',
    rows: [
      { ar: 'تقصير أكمام الجاكيت', en: 'Shorten jacket sleeves', min: 50, max: 90 },
      { ar: 'تضييق الجوانب', en: 'Take in sides', min: 70, max: 130 },
      { ar: 'تبديل البطانة', en: 'Replace lining', min: 120, max: 250 },
      { ar: 'تبديل أزرار', en: 'Replace buttons', min: 15, max: 30 },
    ],
  },
  {
    id: 'repair', icon: '🪡', ar: 'إصلاحات عامة', en: 'General repairs',
    rows: [
      { ar: 'رقعة أو شق', en: 'Patch or tear', min: 20, max: 45 },
      { ar: 'إعادة خياطة درزة', en: 'Re-stitch seam', min: 15, max: 30 },
      { ar: 'تركيب زر', en: 'Sew on a button', min: 5, max: 15 },
    ],
  },
];

export const PriceGuide: React.FC = () => {
  const locale = useLocale();
  const isAr = locale === 'ar';
  const [activeId, setActiveId] = useState(PRICE_GUIDE[0].id);
  const active = PRICE_GUIDE.find((c) => c.id === activeId) ?? PRICE_GUIDE[0];
  const currency = isAr ? 'ر.س' : 'SAR';

  return (
    <div className="space-y-6">
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 [scrollbar-width:none]">
        {PRICE_GUIDE.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveId(cat.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
              activeId === cat.id
                ? 'bg-[#18181B] text-white shadow-md'
                : 'bg-white border border-line text-charcoal hover:bg-mist'
            }`}
          >
            <span>{cat.icon}</span>
            {isAr ? cat.ar : cat.en}
          </button>
        ))}
      </div>

      <div key={active.id} className="reveal is-visible bg-white rounded-3xl border border-line/80 shadow-sm overflow-hidden">
        <ul className="divide-y divide-line/70">
          {active.rows.map((row) => (
            <li key={row.en} className="flex items-center justify-between gap-4 px-6 py-4 hover:bg-cream/60 transition-colors">
              <span className="text-sm sm:text-base font-medium text-ink">{isAr ? row.ar : row.en}</span>
              <span className="text-sm sm:text-base font-bold text-[#18181B] whitespace-nowrap tabular-nums">
<bdi dir="ltr">{row.min}–{row.max}</bdi> <span className="text-xs font-medium text-muted">{currency}</span>
              </span>
            </li>
          ))}
        </ul>
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <p className="text-xs text-muted leading-relaxed max-w-lg">
          {isAr
            ? 'أسعار استرشادية فقط. السعر النهائي يحدده الخيّاط في عرضه بعد ما يشوف القطعة — وبتقارن بين أكثر من عرض قبل ما توافق.'
            : 'Indicative ranges only. Your final price comes from tailor quotes after they see the item — and you compare several before accepting.'}
        </p>
        <Link href="/requests">
          <span className="btn-shine inline-flex items-center px-6 py-3 rounded-full text-sm font-semibold text-white bg-[#18181B] hover:bg-black shadow-md whitespace-nowrap">
            {isAr ? 'احصل على عروض أسعار حقيقية ➔' : 'Get real quotes ➔'}
          </span>
        </Link>
      </div>
    </div>
  );
};
