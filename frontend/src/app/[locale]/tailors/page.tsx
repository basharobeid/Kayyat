'use client';

import React, { useState } from 'react';
import { useLocale } from 'next-intl';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Link } from '@/i18n/routing';

interface TailorItem {
  id: string;
  name: string;
  shopName: string;
  city: string;
  district: string;
  specialties: string[];
  rating: number;
  reviewsCount: number;
  yearsExperience: number;
  completedOrders: number;
  turnaround: string;
  image: string;
  bio: string;
  isVerified: boolean;
  offersVanVisit: boolean;
}

const TAILORS_DIRECTORY: TailorItem[] = [
  {
    id: 't-1',
    name: 'أحمد محمود (أبو أحمد)',
    shopName: 'مشغل الخيّاط الذهبي',
    city: 'الرياض',
    district: 'حي النرجس',
    specialties: ['خياطة رجالية', 'تعديل بدلات رسمية', 'تقصير وتضييق'],
    rating: 4.9,
    reviewsCount: 128,
    yearsExperience: 18,
    completedOrders: 420,
    turnaround: '24 - 48 ساعة',
    image: '/AEfoZzbxbn68WvwFvvXQInhOs.jpeg',
    bio: 'خبير خياطة وتعديل بدلات إيطالية وثياب سعودية بدقة متناهية والتزام بالموعد.',
    isVerified: true,
    offersVanVisit: true,
  },
  {
    id: 't-2',
    name: 'فاطمة الزهراني',
    shopName: 'دار فاطمة للأزياء الراقية',
    city: 'جدة',
    district: 'حي الروضة',
    specialties: ['فساتين سهرة', 'تعديلات دقيقة', 'عبايات كوتور'],
    rating: 4.95,
    reviewsCount: 94,
    yearsExperience: 14,
    completedOrders: 310,
    turnaround: '48 - 72 ساعة',
    image: '/KHAYAT.png',
    bio: 'تصميم وتعديل مقاسات فساتين الزفاف والسهرة مع ضمان الحفاظ على أصل القماش.',
    isVerified: true,
    offersVanVisit: false,
  },
  {
    id: 't-3',
    name: 'عمر الحربي',
    shopName: 'ورشة الخياطة السريعة',
    city: 'الدمام',
    district: 'حي الشاطئ',
    specialties: ['جينز ودنيم', 'استبدال سحابات', 'تقصير فوري'],
    rating: 4.8,
    reviewsCount: 67,
    yearsExperience: 9,
    completedOrders: 280,
    turnaround: 'خلال 24 ساعة ⚡',
    image: '/4ELzdJRzQ5VXQAPbmICpr3joms.png',
    bio: 'متخصصون في التعديلات الفورية للجينز والبناطيل والقمصان مع استلام وتسليم من الباب.',
    isVerified: true,
    offersVanVisit: true,
  },
  {
    id: 't-4',
    name: 'خالد المطيري',
    shopName: 'مشغل الأناقة التراثية',
    city: 'الرياض',
    district: 'حي الملقا',
    specialties: ['بشوت ملكية', 'ثياب شتوية وصيفية', 'تطريز يدوي'],
    rating: 5.0,
    reviewsCount: 156,
    yearsExperience: 22,
    completedOrders: 580,
    turnaround: '3 - 5 أيام',
    image: '/G4cfAEDulUqxGAMCOM4atCL63M.jpeg',
    bio: 'خياطة يدوية احترافية للبشوت والثياب باستخدام خيوط القصب الذهبي والحرير الطبيعي.',
    isVerified: true,
    offersVanVisit: true,
  },
  {
    id: 't-5',
    name: 'مريم الدوسري',
    shopName: 'أتيليه مريم المعاصر',
    city: 'الخبر',
    district: 'حي الحزام الذهبي',
    specialties: ['إصلاح وترميم', 'تعديل ملابس نسائية', 'ملابس أطفال'],
    rating: 4.75,
    reviewsCount: 52,
    yearsExperience: 8,
    completedOrders: 190,
    turnaround: '48 ساعة',
    image: '/AGI6JHG4ojGjbREnbz8H9K897g.png',
    bio: 'عناية متناهية بالقطع الثمينة وترميم الملابس المتضررة مع توفير دبابيس المقاس المنزلية.',
    isVerified: true,
    offersVanVisit: false,
  },
];

const SPECIALTIES = [
  { id: 'all', labelAr: 'كل التخصصات', labelEn: 'All specialties' },
  { id: 'رجالية', labelAr: 'خياطة رجالية', labelEn: "Men's tailoring" },
  { id: 'فساتين', labelAr: 'فساتين وسهرة', labelEn: 'Dresses & evening wear' },
  { id: 'جينز', labelAr: 'جينز ودنيم', labelEn: 'Jeans & denim' },
  { id: 'بشوت', labelAr: 'بشوت وتراث', labelEn: 'Bisht & heritage' },
  { id: 'ترميم', labelAr: 'إصلاح وترميم', labelEn: 'Repair & restoration' },
];

export default function TailorsPage() {
  const locale = useLocale();
  const isAr = locale === 'ar';
  const [selectedCity, setSelectedCity] = useState('all');
  const [selectedSpecialty, setSelectedSpecialty] = useState('all');
  const [vanOnly, setVanOnly] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const filtered = TAILORS_DIRECTORY.filter((t) => {
    const matchesCity = selectedCity === 'all' || t.city === selectedCity;
    const matchesSpecialty =
      selectedSpecialty === 'all' ||
      t.specialties.some((s) => s.includes(selectedSpecialty));
    const matchesVan = !vanOnly || t.offersVanVisit;
    const matchesSearch =
      searchQuery === '' ||
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.shopName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.specialties.some((s) => s.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesCity && matchesSpecialty && matchesVan && matchesSearch;
  });

  return (
    <div className="max-w-6xl mx-auto px-4 py-16 space-y-12 pt-28">
      {/* Header */}
      <div className="text-center space-y-4 max-w-2xl mx-auto">
        <span className="inline-block px-3.5 py-1 rounded-full bg-[#F4F4F5] text-[0.8125rem] font-medium text-[#18181B] border border-[#E4E4E7]">
          {isAr ? 'دليل الخيّاطين المعتمدين' : 'Vetted Master Tailors'}
        </span>
        <h1 className="text-3xl sm:text-5xl font-sans font-bold text-[#18181B] tracking-tight">
          {isAr ? 'نخبة خيّاطي ومشاغل المنطقة' : 'Craftsmanship You Can Trust'}
        </h1>
        <p className="text-lg text-[#71717A] leading-relaxed">
          {isAr
            ? 'خيّاطون محترفون تم التحقق من جودة أعمالهم وتجارب عملائهم، مع خيارات الاستلام والتوصيل لبابك.'
            : 'Explore top-rated local ateliers. Handpicked artisans, transparent quotes, and doorstep convenience.'}
        </p>
      </div>

      {/* Filters Bar */}
      <div className="space-y-4 bg-white p-6 rounded-3xl border border-line/80 shadow-sm">
        {/* Search */}
        <div className="relative">
          <input
            type="text"
            placeholder={isAr ? 'ابحث بالاسم، المشغل، أو نوع التعديل (مثال: جينز، بدلة، فستان)...' : 'Search by tailor, shop, or garment type...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-12 px-4 rounded-full border border-line bg-surface focus:outline-none focus:ring-2 focus:ring-black text-sm"
          />
        </div>

        {/* City Filter Pills */}
        <div className="flex flex-wrap items-center gap-2 pt-2">
          <span className="text-xs font-semibold text-charcoal ml-2">
            {isAr ? 'المدينة:' : 'City:'}
          </span>
          {[
            { id: 'all', label: isAr ? 'جميع المدن' : 'All Cities' },
            { id: 'الرياض', label: isAr ? 'الرياض' : 'Riyadh' },
            { id: 'جدة', label: isAr ? 'جدة' : 'Jeddah' },
            { id: 'الدمام', label: isAr ? 'الدمام' : 'Dammam' },
            { id: 'الخبر', label: isAr ? 'الخبر' : 'Khobar' },
          ].map((city) => (
            <button
              key={city.id}
              onClick={() => setSelectedCity(city.id)}
              className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all ${
                selectedCity === city.id
                  ? 'bg-[#18181B] text-white shadow-xs'
                  : 'bg-[#F4F4F5] text-charcoal hover:bg-zinc-200'
              }`}
            >
              {city.label}
            </button>
          ))}
        </div>

        {/* Specialty Filter Pills */}
        <div className="flex flex-wrap items-center gap-2 pt-2">
          <span className="text-xs font-semibold text-charcoal ml-2">
            {isAr ? 'التخصص:' : 'Specialty:'}
          </span>
          {SPECIALTIES.map((spec) => (
            <button
              key={spec.id}
              onClick={() => setSelectedSpecialty(spec.id)}
              className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all ${
                selectedSpecialty === spec.id
                  ? 'bg-[#18181B] text-white shadow-xs'
                  : 'bg-[#F4F4F5] text-charcoal hover:bg-zinc-200'
              }`}
            >
              {isAr ? spec.labelAr : spec.labelEn}
            </button>
          ))}
        </div>

        {/* Mobile Tailor Van Toggle */}
        <div className="flex flex-wrap items-center gap-2 pt-2">
          <button
            onClick={() => setVanOnly((v) => !v)}
            className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all flex items-center gap-1.5 ${
              vanOnly
                ? 'bg-gold/20 text-gold-ink border border-gold/40 shadow-xs'
                : 'bg-[#F4F4F5] text-charcoal hover:bg-zinc-200 border border-transparent'
            }`}
          >
            🚐 {isAr ? 'يقدّم خدمة الخيّاط المتنقل فقط' : 'Offers mobile tailor van only'}
          </button>
        </div>
      </div>

      {/* Empty state */}
      {filtered.length === 0 && (
        <div className="text-center py-16 space-y-3">
          <p className="text-4xl">🔍</p>
          <p className="text-lg font-semibold text-[#18181B]">
            {isAr ? 'لا يوجد خيّاطون مطابقون لبحثك' : 'No tailors match your search'}
          </p>
          <p className="text-sm text-muted">
            {isAr
              ? 'جرّب تغيير المدينة أو التخصص أو كلمة البحث.'
              : 'Try a different city, specialty, or search term.'}
          </p>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              setSelectedCity('all');
              setSelectedSpecialty('all');
              setVanOnly(false);
              setSearchQuery('');
            }}
          >
            {isAr ? 'إعادة ضبط الفلاتر' : 'Reset filters'}
          </Button>
        </div>
      )}

      {/* Tailors List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {filtered.map((tailor) => (
          <Card key={tailor.id} hoverable className="p-6 rounded-3xl border border-line/80 space-y-6 flex flex-col justify-between shadow-sm">
            <div className="space-y-4">
              {/* Header: Photo + Name + Rating */}
              <div className="flex items-start gap-4">
                <div className="w-20 h-20 rounded-2xl overflow-hidden bg-zinc-100 flex-shrink-0 shadow-sm">
                  <img
                    src={tailor.image}
                    alt={tailor.name}
                    className="w-full h-full object-cover"
                  />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl font-bold text-[#18181B] truncate tracking-tight">
                      {tailor.shopName}
                    </h3>
                    {tailor.isVerified && (
                      <span className="text-xs font-bold text-olive bg-olive/15 px-2 py-0.5 rounded-full">
                        ✓ {isAr ? 'معتمد' : 'Verified'}
                      </span>
                    )}
                    {tailor.offersVanVisit && (
                      <span className="text-xs font-bold text-gold-ink bg-gold/15 px-2 py-0.5 rounded-full whitespace-nowrap">
                        🚐 {isAr ? 'خيّاط متنقل' : 'Mobile van'}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted font-medium mt-0.5">
                    {tailor.name} • 📍 {tailor.city} ({tailor.district})
                  </p>

                  <div className="flex items-center gap-2 mt-2 text-xs font-medium">
                    <span className="text-amber-500 font-bold">★ {tailor.rating}</span>
                    <span className="text-muted">({tailor.reviewsCount} {isAr ? 'تقييم' : 'reviews'})</span>
                    <span className="text-muted">• {tailor.yearsExperience} {isAr ? 'سنوات خبرة' : 'yrs exp'}</span>
                  </div>
                </div>
              </div>

              {/* Bio */}
              <p className="text-sm text-[#52525B] leading-relaxed">
                {tailor.bio}
              </p>

              {/* Badges */}
              <div className="flex flex-wrap gap-1.5">
                {tailor.specialties.map((s, idx) => (
                  <span key={idx} className="px-2.5 py-1 rounded-full bg-[#F4F4F5] text-xs font-medium text-charcoal border border-line/60">
                    {s}
                  </span>
                ))}
              </div>

              {/* Turnaround speed badge */}
              <div className="p-3 bg-mist/60 rounded-xl flex items-center justify-between text-xs font-medium text-ink">
                <span>⏱️ {isAr ? 'سرعة الإنجاز المعتادة:' : 'Typical Turnaround:'}</span>
                <span className="font-bold text-olive">{tailor.turnaround}</span>
              </div>
            </div>

            {/* Actions */}
            <div className="pt-4 border-t border-line flex gap-3">
              <Link href={`/requests?tailorId=${tailor.id}`} className="flex-1">
                <Button variant="primary" size="sm" fullWidth className="rounded-full text-xs font-semibold py-2.5 bg-[#18181B] hover:bg-black text-white">
                  {isAr ? 'طلب عرض سعر فوري ➔' : 'Request Quick Quote ➔'}
                </Button>
              </Link>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
