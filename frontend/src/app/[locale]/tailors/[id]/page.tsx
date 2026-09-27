import React from 'react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Link } from '@/i18n/routing';

interface TailorDetail {
  id: string;
  name: string;
  shopName: string;
  city: string;
  district: string;
  rating: number;
  reviewsCount: number;
  yearsExperience: number;
  completedOrders: number;
  turnaround: string;
  avatar: string;
  coverImage: string;
  bioAr: string;
  bioEn: string;
  specialties: string[];
  priceList: { serviceAr: string; serviceEn: string; price: string }[];
  portfolio: string[];
  reviews: { id: string; author: string; rating: number; date: string; commentAr: string; commentEn: string }[];
}

export function generateStaticParams() {
  return [
    { id: 't-1' },
    { id: 't-2' },
    { id: 't-3' },
    { id: 't-4' },
    { id: 't-5' },
    { id: '1' },
    { id: '2' },
  ];
}

const TAILOR_DATA: TailorDetail = {
  id: 't-1',
  name: 'أحمد محمود (أبو أحمد)',
  shopName: 'مشغل الخيّاط الذهبي',
  city: 'الرياض',
  district: 'حي النرجس',
  rating: 4.9,
  reviewsCount: 128,
  yearsExperience: 18,
  completedOrders: 420,
  turnaround: '24 - 48 ساعة',
  avatar: '/AEfoZzbxbn68WvwFvvXQInhOs.jpeg',
  coverImage: '/G4cfAEDulUqxGAMCOM4atCL63M.jpeg',
  bioAr: 'خبير خياطة وتعديل بدلات رسمية وثياب سعودية بخبرة تتجاوز 18 عاماً في الرياض. نلتزم بأعلى معايير الدقة مع خياطة مخفية تحافظ على قيمة وتفصيل القطعة الأصلية.',
  bioEn: 'Master tailor with 18+ years of expertise in luxury suits, bespoke thobes, and precision alterations in Riyadh. Delivering discreet hand-finishes and guaranteed turnaround.',
  specialties: ['خياطة رجالية', 'تعديل بدلات رسمية', 'تقصير وتضييق', 'ثياب سعودية', 'خياطة يدوية'],
  priceList: [
    { serviceAr: 'تقصير بنطال / جينز مع الحاشية الأصلية', serviceEn: 'Trouser Hemming (Original Hem)', price: '30 - 45 SAR' },
    { serviceAr: 'تضييق خصر البنطال أو التنورة', serviceEn: 'Waist Tapering (Pants/Skirts)', price: '35 - 55 SAR' },
    { serviceAr: 'تقصير وتعديل أكمام السترة الرسمية', serviceEn: 'Suit Jacket Sleeve Shortening', price: '65 - 95 SAR' },
    { serviceAr: 'تعديل وتضييق الثوب السعودي بالكامل', serviceEn: 'Full Traditional Thobe Resizing', price: '45 - 75 SAR' },
    { serviceAr: 'استبدال السحاب العادي والمخفي', serviceEn: 'Zipper Replacement (Standard/Invisible)', price: '25 - 40 SAR' },
  ],
  portfolio: [
    '/AEfoZzbxbn68WvwFvvXQInhOs.jpeg',
    '/KHAYAT.png',
    '/4ELzdJRzQ5VXQAPbmICpr3joms.png',
    '/AGI6JHG4ojGjbREnbz8H9K897g.png',
  ],
  reviews: [
    {
      id: 'rev-1',
      author: 'سارة العتيبي',
      rating: 5,
      date: 'منذ يومين',
      commentAr: 'شغل احترافي جداً! قصرت بنطالين مع المحافظة على الحاشية الأصلية واستلمتها مكوية وبحالة لا تفرق عن الجديدة.',
      commentEn: 'Exceptional craftsmanship. Two jeans hemmed with the original finish preserved, delivered ironed and pristine.',
    },
    {
      id: 'rev-2',
      author: 'فيصل الشمري',
      rating: 5,
      date: 'منذ أسبوع',
      commentAr: 'خياط ثقة وتعامله راقي جداً، تم تعديل البدلة في أقل من 24 ساعة بمناسبة زواج أخي.',
      commentEn: 'True artisan. Fast turnaround within 24 hours for my brother’s wedding suit.',
    },
  ],
};

export default async function TailorProfilePage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale } = await params;
  const isAr = locale === 'ar';
  const tailor = TAILOR_DATA;

  return (
    <div className="max-w-5xl mx-auto px-4 py-16 space-y-12 pt-28">
      
      {/* Cover Banner & Atelier Header */}
      <div className="relative rounded-[2.5rem] overflow-hidden border border-line/80 shadow-md bg-zinc-900">
        <div
          className="h-64 sm:h-80 w-full bg-cover bg-center opacity-60"
          style={{ backgroundImage: `url('${tailor.coverImage}')` }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent" />

        <div className="absolute bottom-6 left-6 right-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4 text-white">
          <div className="flex items-center gap-5">
            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl overflow-hidden border-2 border-white/40 shadow-xl bg-zinc-800 flex-shrink-0">
              <img
                src={tailor.avatar}
                alt={tailor.name}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{tailor.shopName}</h1>
                <span className="px-2.5 py-0.5 rounded-full bg-white/20 text-xs font-bold text-white border border-white/30 backdrop-blur-xs">
                  ✓ {isAr ? 'مشغل معتمد' : 'Verified Atelier'}
                </span>
              </div>
              <p className="text-sm text-zinc-300">
                {tailor.name} • 📍 {tailor.city} ({tailor.district})
              </p>
              <div className="flex items-center gap-3 pt-1 text-xs text-zinc-300">
                <span className="text-amber-400 font-bold">★ {tailor.rating}</span>
                <span>({tailor.reviewsCount} {isAr ? 'تقييم' : 'reviews'})</span>
                <span>• {tailor.yearsExperience} {isAr ? 'سنة خبرة' : 'years exp'}</span>
                <span>• {tailor.completedOrders} {isAr ? 'طلب منفذ' : 'completed'}</span>
              </div>
            </div>
          </div>

          <Link href={`/requests?tailorId=${tailor.id}`}>
            <Button variant="primary" size="md" className="rounded-full px-7 py-3 bg-white text-black hover:bg-zinc-200 font-semibold shadow-lg">
              {isAr ? 'طلب عرض سعر فوري ➔' : 'Request Quote ➔'}
            </Button>
          </Link>
        </div>
      </div>

      {/* About & Specialties */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Bio & Pricing Menu */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Bio Card */}
          <Card className="p-7 rounded-3xl border border-line/80 space-y-4">
            <h2 className="text-xl font-bold text-[#18181B] tracking-tight">
              {isAr ? 'عن المشغل والحرفية' : 'About the Atelier'}
            </h2>
            <p className="text-base text-[#52525B] leading-relaxed">
              {isAr ? tailor.bioAr : tailor.bioEn}
            </p>
            <div className="flex flex-wrap gap-2 pt-2">
              {tailor.specialties.map((spec, i) => (
                <span key={i} className="px-3 py-1 rounded-full bg-[#F4F4F5] text-xs font-medium text-[#18181B] border border-line">
                  {spec}
                </span>
              ))}
            </div>
          </Card>

          {/* Transparent Price Menu */}
          <Card className="p-7 rounded-3xl border border-line/80 space-y-5">
            <div className="flex items-center justify-between border-b border-line pb-3">
              <div>
                <h2 className="text-xl font-bold text-[#18181B] tracking-tight">
                  {isAr ? 'قائمة الأسعار المرجعية' : 'Standard Price Guide'}
                </h2>
                <p className="text-xs text-muted mt-0.5">
                  {isAr ? 'أسعار إرشادية شفافة، ويتم تأكيد السعر النهائي بعد معاينة الصور' : 'Transparent baseline pricing. Final quote confirmed after photo review'}
                </p>
              </div>
              <Badge variant="gold">شفافية كاملة</Badge>
            </div>

            <div className="divide-y divide-line">
              {tailor.priceList.map((item, idx) => (
                <div key={idx} className="py-3.5 flex items-center justify-between text-sm">
                  <span className="font-medium text-[#18181B]">
                    {isAr ? item.serviceAr : item.serviceEn}
                  </span>
                  <span className="font-bold text-[#18181B] bg-mist/60 px-3 py-1 rounded-full text-xs">
                    {item.price}
                  </span>
                </div>
              ))}
            </div>
          </Card>

          {/* Customer Reviews */}
          <Card className="p-7 rounded-3xl border border-line/80 space-y-5">
            <div className="flex items-center justify-between border-b border-line pb-3">
              <h2 className="text-xl font-bold text-[#18181B] tracking-tight">
                {isAr ? 'تقييمات وتجارب العملاء' : 'Verified Customer Reviews'}
              </h2>
              <span className="text-xs text-olive font-bold">100% {isAr ? 'تجارب موثقة' : 'Verified Orders'}</span>
            </div>

            <div className="space-y-4">
              {tailor.reviews.map((rev) => (
                <div key={rev.id} className="p-4 bg-mist/40 rounded-2xl space-y-2 border border-line/50">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-[#18181B]">{rev.author}</span>
                    <span className="text-muted">{rev.date}</span>
                  </div>
                  <div className="text-amber-500 text-xs">{'★'.repeat(rev.rating)}</div>
                  <p className="text-sm text-[#52525B] leading-relaxed">
                    {isAr ? rev.commentAr : rev.commentEn}
                  </p>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Right Column: Work Portfolio & Quick Booking Box */}
        <div className="space-y-8">
          
          {/* Quick Booking Box */}
          <Card className="p-6 rounded-3xl border border-line/80 space-y-5 bg-[#14171F] text-white shadow-xl">
            <div className="space-y-1">
              <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                {isAr ? 'حجز مباشر' : 'Fast Booking'}
              </span>
              <h3 className="text-xl font-bold tracking-tight">
                {isAr ? 'اطلب تعديل قطعتك مع هذا المشغل' : 'Book with this Atelier'}
              </h3>
            </div>

            <div className="p-3.5 bg-white/5 rounded-2xl border border-white/10 text-xs text-zinc-300 space-y-2">
              <div className="flex items-center justify-between">
                <span>⏱️ {isAr ? 'وقت الإنجاز:' : 'Turnaround:'}</span>
                <span className="font-bold text-white">{tailor.turnaround}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>🚚 {isAr ? 'خدمة التوصيل:' : 'Doorstep Pickup:'}</span>
                <span className="font-bold text-emerald-400">متوفرة لبابك</span>
              </div>
              <div className="flex items-center justify-between">
                <span>🛡️ {isAr ? 'ضمان المقاس:' : 'Guarantee:'}</span>
                <span className="font-bold text-white">إعادة تعديل مجانية</span>
              </div>
            </div>

            <Link href={`/requests?tailorId=${tailor.id}`} className="block">
              <Button variant="primary" size="md" fullWidth className="rounded-full py-3 bg-white text-black hover:bg-zinc-200 font-bold shadow-md">
                {isAr ? 'ابدأ حجز التعديل الآن ➔' : 'Start Alteration Booking ➔'}
              </Button>
            </Link>
          </Card>

          {/* Portfolio Grid */}
          <Card className="p-6 rounded-3xl border border-line/80 space-y-4">
            <h3 className="text-lg font-bold text-[#18181B] tracking-tight">
              {isAr ? 'معرض الأعمال السابقة' : 'Portfolio & Finished Works'}
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {tailor.portfolio.map((img, idx) => (
                <div key={idx} className="aspect-square rounded-2xl overflow-hidden bg-zinc-100 border border-line group">
                  <img
                    src={img}
                    alt="Tailor portfolio work"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
