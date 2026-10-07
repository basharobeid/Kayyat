'use client';

import React, { useEffect, useState } from 'react';
import { useLocale } from 'next-intl';
import { Link } from '@/i18n/routing';
import { bookingsApi } from '@/lib/api';

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

// Indicative Damascus ranges in USD (shown with SYP at the configured rate). Final prices are
// confirmed by the tailor after measuring.
const PRICE_GUIDE: PriceCategory[] = [
  {
    id: 'trousers', icon: '👖', ar: 'بناطيل وجينز', en: 'Trousers & jeans',
    rows: [
      { ar: 'تقصير الحاشية', en: 'Shorten hem', min: 2, max: 4 },
      { ar: 'تقصير مع الحفاظ على الحاشية الأصلية', en: 'Shorten keeping original hem', min: 3, max: 5 },
      { ar: 'تضييق الخصر', en: 'Take in waist', min: 3, max: 6 },
      { ar: 'تضييق الأرجل', en: 'Taper legs', min: 4, max: 7 },
      { ar: 'تبديل سحاب', en: 'Replace zipper', min: 3, max: 6 },
    ],
  },
  {
    id: 'thobe', icon: '🥻', ar: 'ثياب وكنادير', en: 'Thobes & kanduras',
    rows: [
      { ar: 'تقصير الطول', en: 'Shorten length', min: 3, max: 5 },
      { ar: 'تعديل الأكمام والكبك', en: 'Adjust sleeves & cuffs', min: 2, max: 4 },
      { ar: 'تضييق الجوانب', en: 'Take in sides', min: 4, max: 7 },
      { ar: 'تعديل الياقة', en: 'Collar adjustment', min: 4, max: 7 },
      { ar: 'أزرار وكبسات', en: 'Buttons & snaps', min: 1, max: 2 },
    ],
  },
  {
    id: 'abaya', icon: '🧕', ar: 'عبايات', en: 'Abayas',
    rows: [
      { ar: 'تقصير الطول', en: 'Shorten length', min: 3, max: 6 },
      { ar: 'تضييق', en: 'Take in', min: 4, max: 8 },
      { ar: 'تعديل الأكمام', en: 'Adjust sleeves', min: 3, max: 5 },
      { ar: 'إصلاح تطريز', en: 'Embroidery repair', min: 5, max: 15 },
    ],
  },
  {
    id: 'dress', icon: '👗', ar: 'فساتين', en: 'Dresses',
    rows: [
      { ar: 'تقصير فستان عادي', en: 'Shorten day dress', min: 4, max: 8 },
      { ar: 'تقصير فستان سهرة', en: 'Shorten evening gown', min: 6, max: 14 },
      { ar: 'تضييق الصدر والخصر', en: 'Take in bust & waist', min: 6, max: 14 },
      { ar: 'تقصير الحمالات', en: 'Shorten straps', min: 3, max: 5 },
      { ar: 'سحاب مخفي', en: 'Invisible zipper', min: 4, max: 7 },
    ],
  },
  {
    id: 'suit', icon: '🧥', ar: 'بدلات وجاكيتات', en: 'Suits & jackets',
    rows: [
      { ar: 'تقصير أكمام الجاكيت', en: 'Shorten jacket sleeves', min: 6, max: 10 },
      { ar: 'تضييق الجوانب', en: 'Take in sides', min: 8, max: 15 },
      { ar: 'تبديل البطانة', en: 'Replace lining', min: 12, max: 25 },
      { ar: 'تبديل أزرار', en: 'Replace buttons', min: 2, max: 4 },
    ],
  },
  {
    id: 'repair', icon: '🪡', ar: 'إصلاحات عامة', en: 'General repairs',
    rows: [
      { ar: 'رقعة أو شق', en: 'Patch or tear', min: 2, max: 5 },
      { ar: 'إعادة خياطة درزة', en: 'Re-stitch seam', min: 2, max: 4 },
      { ar: 'تركيب زر', en: 'Sew on a button', min: 1, max: 2 },
    ],
  },
];

export const PriceGuide: React.FC = () => {
  const locale = useLocale();
  const isAr = locale === 'ar';
  const [activeId, setActiveId] = useState(PRICE_GUIDE[0].id);
  const active = PRICE_GUIDE.find((c) => c.id === activeId) ?? PRICE_GUIDE[0];
  const [rate, setRate] = useState<number | null>(null);
  useEffect(() => { bookingsApi.options().then((o) => setRate(o.usd_to_syp)).catch(() => {}); }, []);
  const syp = (usd: number) => Math.round((usd * (rate ?? 0)) / 50) * 50;

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
                <bdi dir="ltr">${row.min}–{row.max}</bdi>
                {rate && <span className="block text-xs font-medium text-muted"><bdi dir="ltr">{syp(row.min).toLocaleString()}–{syp(row.max).toLocaleString()}</bdi> {isAr ? 'ل.س' : 'SYP'}</span>}
              </span>
            </li>
          ))}
        </ul>
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <p className="text-xs text-muted leading-relaxed max-w-lg">
          {isAr
            ? 'أسعار استرشادية بدمشق. السعر النهائي بيتأكد بعد القياس، وبيوصلك قبل ما نبلّش الشغل. الدفع كاش بعد الخدمة.'
            : 'Indicative Damascus prices. The final price is confirmed after measuring, before any work starts. Pay in cash after the service.'}
        </p>
        <Link href="/book">
          <span className="btn-shine inline-flex items-center px-6 py-3 rounded-full text-sm font-semibold text-white bg-[#18181B] hover:bg-black shadow-md whitespace-nowrap">
            {isAr ? 'احجز الآن ←' : 'Book now →'}
          </span>
        </Link>
      </div>
    </div>
  );
};
