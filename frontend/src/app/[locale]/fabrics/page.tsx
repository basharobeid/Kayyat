'use client';

import React, { useState } from 'react';
import { useLocale } from 'next-intl';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Link } from '@/i18n/routing';

interface FabricStore {
  id: string;
  nameAr: string;
  nameEn: string;
  taglineAr: string;
  taglineEn: string;
  city: string;
  image: string;
  specialtiesAr: string[];
  specialtiesEn: string[];
}

const FABRIC_STORES: FabricStore[] = [
  {
    id: 'store-collective',
    nameAr: 'ملتقى الأقمشة',
    nameEn: 'The Fabric Collective',
    taglineAr: 'متجر حي بألوان زاهية لكل أنواع الأقمشة وأدوات الخياطة المنزلية',
    taglineEn: 'A bright, welcoming neighborhood shop stocked floor-to-ceiling with cottons, prints & notions',
    city: 'الرياض',
    image: '/fabric-store-collective.jpg',
    specialtiesAr: ['أقمشة قطنية', 'مطبوعات ملونة', 'أدوات خياطة'],
    specialtiesEn: ['Cottons', 'Printed Fabrics', 'Haberdashery'],
  },
  {
    id: 'store-textile-trunk',
    nameAr: 'صندوق النسيج',
    nameEn: 'The Textile Trunk',
    taglineAr: 'مشغل تقليدي دافئ بتشكيلة واسعة من الكتان والقطن والمطبوعات الحرفية',
    taglineEn: 'A warm, artisanal workshop with an extensive range of linens, cottons & craft prints',
    city: 'جدة',
    image: '/fabric-store-textile-trunk.jpg',
    specialtiesAr: ['كتان', 'أقمشة تقليدية', 'أزرار وشرائط'],
    specialtiesEn: ['Linens', 'Traditional Weaves', 'Buttons & Ribbons'],
  },
  {
    id: 'store-atelier',
    nameAr: 'أتيليه النسيج الفاخر',
    nameEn: 'The Textile Atelier',
    taglineAr: 'صالة عرض راقية لأفخر أقمشة الصوف والبدلات المستوردة من كبرى دور النسيج العالمية',
    taglineEn: 'A refined showroom of premium suiting wools sourced from the world’s finest mills',
    city: 'الرياض',
    image: '/fabric-store-atelier.jpg',
    specialtiesAr: ['أصواف فاخرة', 'أقمشة بدلات', 'استشارات تفصيل'],
    specialtiesEn: ['Luxury Wools', 'Suiting Fabrics', 'Bespoke Consultations'],
  },
];

interface FabricItem {
  id: string;
  nameAr: string;
  nameEn: string;
  category: string;
  origin: string;
  material: string;
  color: string;
  pricePerMeter: number;
  stockMeters: number;
  image: string;
  descriptionAr: string;
  descriptionEn: string;
}

const FABRICS: FabricItem[] = [
  {
    id: 'fab-1',
    nameAr: 'صوف إنجليزي سوبر 150 فاخر',
    nameEn: 'Super 150s English Wool',
    category: 'wool',
    origin: 'بريطانيا (Huddersfield)',
    material: 'صوف طبيعي 100%',
    color: 'كحلي ملكي داكن',
    pricePerMeter: 240,
    stockMeters: 45,
    image: '/4ELzdJRzQ5VXQAPbmICpr3joms.png',
    descriptionAr: 'نسيج صوف استثنائي للبدلات الرسمية والمناسبات الفاخرة، مقاوم للتجعد وانسيابي.',
    descriptionEn: 'Ultra-fine worsted wool woven in England. Ideal for bespoke suits and luxury blazers.',
  },
  {
    id: 'fab-2',
    nameAr: 'قطن ياباني تويوبو فاخر',
    nameEn: 'Japanese Toyobo Pure Cotton',
    category: 'cotton',
    origin: 'اليابان (Osaka)',
    material: 'قطن ياباني نقي 100%',
    color: 'أبيض لؤلؤي ناصع',
    pricePerMeter: 85,
    stockMeters: 160,
    image: '/AEfoZzbxbn68WvwFvvXQInhOs.jpeg',
    descriptionAr: 'الخيار الأول للثياب السعودية الفاخرة، بارد وخفيف مع ثبات دائم للألوان.',
    descriptionEn: 'Premium Japanese long-staple cotton with a crisp, cool finish for traditional garments.',
  },
  {
    id: 'fab-3',
    nameAr: 'حرير كريب دو شين إيطالي',
    nameEn: 'Italian Crêpe de Chine Silk',
    category: 'silk',
    origin: 'إيطاليا (Como)',
    material: 'حرير طبيعي 100%',
    color: 'عاجي دافئ',
    pricePerMeter: 195,
    stockMeters: 38,
    image: '/AGI6JHG4ojGjbREnbz8H9K897g.png',
    descriptionAr: 'حرير طبيعي يتميز بملمس مخملي فاخر ولمعان هادئ، مثالي لفساتين السهرة والعبايات الراقية.',
    descriptionEn: 'Pure Italian mulberry silk with an elegant matte sheen and fluid drape.',
  },
  {
    id: 'fab-4',
    nameAr: 'كتان إيرلندي طبيعي ثقيل',
    nameEn: 'Heavyweight Irish Linen',
    category: 'linen',
    origin: 'إيرلندا (Belfast)',
    material: 'كتان 100%',
    color: 'بيج رملي',
    pricePerMeter: 110,
    stockMeters: 75,
    image: '/KHAYAT.png',
    descriptionAr: 'كتان كلاسيكي بارد وجيد التهوية بلمسة صيفية أنيقة ومقاومة عالية للتآكل.',
    descriptionEn: 'Timeless Irish linen with a breathable weave and characteristic relaxed drape.',
  },
];

export default function FabricsPage() {
  const locale = useLocale();
  const isAr = locale === 'ar';
  const [activeCategory, setActiveCategory] = useState('all');
  const [orderedSwatch, setOrderedSwatch] = useState<string | null>(null);

  const filtered = activeCategory === 'all'
    ? FABRICS
    : FABRICS.filter((f) => f.category === activeCategory);

  return (
    <div className="max-w-6xl mx-auto px-4 py-16 space-y-14 pt-28">
      {/* Header */}
      <div className="text-center space-y-4 max-w-2xl mx-auto">
        <span className="inline-block px-3.5 py-1 rounded-full bg-[#F4F4F5] text-[0.8125rem] font-medium text-[#18181B] border border-[#E4E4E7]">
          {isAr ? 'سوق الأقمشة الفاخرة' : 'Fabric Sourcing'}
        </span>
        <h1 className="text-3xl sm:text-5xl font-sans font-bold text-[#18181B] tracking-tight">
          {isAr ? 'أقمشة عالمية معتمدة لتفصيلك' : 'Curated Luxury Fabric Marketplace'}
        </h1>
        <p className="text-lg text-[#71717A] leading-relaxed">
          {isAr
            ? 'احصل على أرقى أقمشة الصوف والقطن والحرير مباشرة، مع إمكانية إرسالها للخيّاط المعتمد لتفصيلها.'
            : 'Source world-class textiles directly from premier mills and pair them with vetted master tailors.'}
        </p>
      </div>

      {/* Fabric Store Partners */}
      <div className="space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-2xl sm:text-3xl font-bold text-[#18181B] tracking-tight">
            {isAr ? 'متاجر أقمشة شريكة' : 'Partner Fabric Stores'}
          </h2>
          <p className="text-[#71717A] max-w-xl mx-auto">
            {isAr
              ? 'تصفح أبرز متاجر الأقمشة الشريكة وتخصص كل منها، من الأقمشة اليومية إلى الأصواف الفاخرة.'
              : 'Browse our featured fabric store partners, each with their own specialty — from everyday cottons to luxury suiting wools.'}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {FABRIC_STORES.map((store) => (
            <Card key={store.id} hoverable className="overflow-hidden rounded-3xl border border-line/80 shadow-sm p-0 flex flex-col">
              <div className="aspect-[4/3] overflow-hidden bg-zinc-100">
                <img
                  src={store.image}
                  alt={isAr ? store.nameAr : store.nameEn}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-5 space-y-3 flex-1 flex flex-col">
                <div>
                  <h3 className="text-lg font-bold text-[#18181B] tracking-tight">
                    {isAr ? store.nameAr : store.nameEn}
                  </h3>
                  <p className="text-xs text-muted mt-0.5">📍 {store.city}</p>
                </div>
                <p className="text-sm text-[#71717A] leading-relaxed flex-1">
                  {isAr ? store.taglineAr : store.taglineEn}
                </p>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {(isAr ? store.specialtiesAr : store.specialtiesEn).map((s) => (
                    <Badge key={s} variant="muted">{s}</Badge>
                  ))}
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Featured Swatches */}
      <div className="text-center space-y-2">
        <h2 className="text-2xl sm:text-3xl font-bold text-[#18181B] tracking-tight">
          {isAr ? 'أقمشة مختارة' : 'Featured Swatches'}
        </h2>
        <p className="text-[#71717A] max-w-xl mx-auto">
          {isAr
            ? 'تصفح نماذج من الأقمشة الأكثر طلباً واطلب عينة أو ابدأ التفصيل مباشرة.'
            : 'Browse a selection of our most requested fabrics and order a swatch or start tailoring right away.'}
        </p>
      </div>

      {/* Category Filter Pills */}
      <div className="flex flex-wrap items-center justify-center gap-2.5">
        {[
          { id: 'all', labelAr: 'جميع الأقمشة', labelEn: 'All Fabrics' },
          { id: 'wool', labelAr: 'أصواف وبدلات 🐑', labelEn: 'Wool & Suiting' },
          { id: 'cotton', labelAr: 'أقطان وثياب 🌿', labelEn: 'Pure Cotton' },
          { id: 'silk', labelAr: 'حرير وفساتين ✨', labelEn: 'Silk & Crepe' },
          { id: 'linen', labelAr: 'كتان صيفي 🌾', labelEn: 'Irish Linen' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveCategory(tab.id)}
            className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${
              activeCategory === tab.id
                ? 'bg-[#18181B] text-white shadow-sm'
                : 'bg-white border border-[#E4E4E7] text-[#52525B] hover:bg-[#F4F4F5]'
            }`}
          >
            {isAr ? tab.labelAr : tab.labelEn}
          </button>
        ))}
      </div>

      {/* Fabrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {filtered.map((fabric) => (
          <Card key={fabric.id} hoverable className="p-6 rounded-3xl border border-line/80 space-y-5 flex flex-col justify-between shadow-sm">
            <div className="space-y-4">
              {/* Photo */}
              <div className="overflow-hidden rounded-2xl aspect-[16/9] bg-zinc-100 relative group">
                <img
                  src={fabric.image}
                  alt={fabric.nameEn}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold text-[#18181B] shadow-xs">
                  {fabric.pricePerMeter} SAR / {isAr ? 'متر' : 'meter'}
                </div>
              </div>

              {/* Info */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold text-[#18181B] tracking-tight">
                    {isAr ? fabric.nameAr : fabric.nameEn}
                  </h3>
                  <Badge variant="gold">📍 {fabric.origin}</Badge>
                </div>
                <p className="text-sm text-[#71717A] leading-relaxed">
                  {isAr ? fabric.descriptionAr : fabric.descriptionEn}
                </p>
              </div>

              {/* Attributes */}
              <div className="flex flex-wrap gap-2 text-xs pt-1">
                <span className="px-2.5 py-1 bg-mist rounded-md font-medium text-ink">🧵 {fabric.material}</span>
                <span className="px-2.5 py-1 bg-mist rounded-md font-medium text-ink">🎨 {fabric.color}</span>
                <span className="px-2.5 py-1 bg-mist rounded-md font-medium text-olive">📦 {fabric.stockMeters} {isAr ? 'متر متوفر' : 'meters available'}</span>
              </div>
            </div>

            {/* Actions */}
            <div className="pt-4 border-t border-line flex gap-3">
              <button
                onClick={() => setOrderedSwatch(fabric.id)}
                className="flex-1 py-2.5 px-4 rounded-full text-xs font-semibold border border-line hover:bg-mist transition-colors"
              >
                {orderedSwatch === fabric.id ? (isAr ? '✓ تم طلب العينة' : '✓ Swatch Requested') : (isAr ? 'طلب عينة قماش (Swatch)' : 'Request Swatch')}
              </button>
              <Link href={`/requests?fabricId=${fabric.id}`} className="flex-1">
                <Button variant="secondary" size="sm" fullWidth className="rounded-full text-xs font-semibold py-2.5">
                  {isAr ? 'تفصيل مع خيّاط ➔' : 'Tailor this fabric ➔'}
                </Button>
              </Link>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
