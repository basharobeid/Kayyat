'use client';

import React, { useEffect, useState } from 'react';
import { useLocale } from 'next-intl';
import { Link } from '@/i18n/routing';
import { RevealOnScroll } from '@/components/ui/RevealOnScroll';
import { AnimatedCounter } from '@/components/ui/AnimatedCounter';
import { catalogApi } from '@/lib/api';

// Sensible fallbacks if the live catalog can't be reached (e.g. the free backend is
// cold-starting) so the marketing page never shows a broken/empty stats row.
const FALLBACK_STATS = { services: 18, cities: 10, categories: 3 };

export default function HomePage() {
  const locale = useLocale();
  const isAr = locale === 'ar';
  const [stats, setStats] = useState(FALLBACK_STATS);

  useEffect(() => {
    Promise.all([catalogApi.services(), catalogApi.meta()])
      .then(([categories, meta]) => {
        setStats({
          services: categories.reduce((sum, c) => sum + c.services.length, 0),
          cities: meta.cities.length,
          categories: categories.length,
        });
      })
      .catch(() => {
        // Keep the fallback numbers; this is a marketing page, not a data page.
      });
  }, []);

  return (
    <div className="space-y-24 pb-20">
      
      {/* ─────────────────────────────────────────────────────────────
          1. HERO SECTION (Directly matching Screenshot 5)
         ───────────────────────────────────────────────────────────── */}
      <section className="relative min-h-[92vh] flex items-center justify-center text-center overflow-hidden px-4">
        {/* Editorial Fashion Photography Background with a slow continuous Ken Burns drift */}
        <div
          className="absolute inset-0 bg-cover bg-center -z-10 animate-ken-burns"
          style={{
            backgroundImage: `url('/G4cfAEDulUqxGAMCOM4atCL63M.jpeg')`,
          }}
        />
        {/* Soft luxury editorial overlay to guarantee crisp text legibility */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/40 to-black/60 -z-10" />

        <div className="max-w-4xl mx-auto pt-24 pb-16 space-y-7 text-white">

          {/* Floating Pill Announcement Tag */}
          <div className="reveal is-visible inline-flex items-center gap-2 px-4 py-1 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-md border border-white/25 shadow-sm text-[0.8125rem] font-medium transition-all cursor-pointer animate-float">
            <span>
              {isAr
                ? 'خيّاط × أرقى خدمات العناية بالملابس ✦ اكتشف المزيد'
                : 'KHAYYAT is here. Learn more →'}
            </span>
          </div>

          {/* Big Editorial Headline */}
          <h1 className="reveal is-visible text-4xl sm:text-6xl md:text-7xl font-sans font-bold tracking-tight leading-[1.08] max-w-3xl mx-auto drop-shadow-sm" style={{ animationDelay: '120ms' }}>
            {isAr ? (
              <>
                الملابس <span className="text-gold-gradient">صُنعت لتدوم</span>. <br />
                <span className="font-normal opacity-95">ونحن هنا لنضمن ذلك.</span>
              </>
            ) : (
              <>
                Clothes are <span className="text-gold-gradient">made to last</span>. <br />
                <span className="font-normal opacity-95">We make sure they do.</span>
              </>
            )}
          </h1>

          {/* Dual Pill CTA Buttons (Exact match to Sojo Screenshot 5) */}
          <div className="reveal is-visible flex flex-col sm:flex-row items-center justify-center gap-3 pt-4" style={{ animationDelay: '240ms' }}>
            {/* Fix an item Pill (Frosted Light) */}
            <Link href="/requests">
              <span className="btn-shine inline-flex items-center justify-center px-7 py-3 rounded-full text-[0.9375rem] font-semibold text-[#18181B] bg-white/90 hover:bg-white backdrop-blur-md shadow-md hover:shadow-lg transition-all hover:scale-[1.02]">
                {isAr ? 'عدّل قطعة الآن' : 'Fix an item'}
              </span>
            </Link>

            {/* Partner with us Pill (Solid Charcoal/Black) */}
            <Link href="/dashboard/tailor">
              <span className="btn-shine inline-flex items-center justify-center px-7 py-3 rounded-full text-[0.9375rem] font-semibold text-white bg-[#18181B]/95 hover:bg-black backdrop-blur-md shadow-md hover:shadow-lg transition-all hover:scale-[1.02]">
                {isAr ? 'انضم كشريك' : 'Partner with us'}
              </span>
            </Link>
          </div>
        </div>

        {/* Scroll cue */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-white/70 animate-chevron">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          BY THE NUMBERS
         ───────────────────────────────────────────────────────────── */}
      <RevealOnScroll>
        <section className="max-w-5xl mx-auto px-4 -mt-12 relative z-10">
          <div className="bg-white rounded-3xl shadow-xl border border-line/60 grid grid-cols-2 sm:grid-cols-4 divide-x divide-y sm:divide-y-0 divide-line/60 rtl:divide-x-reverse overflow-hidden">
            {[
              { value: stats.services, suffix: '+', labelAr: 'خدمة تعديل وإصلاح', labelEn: 'Alteration & repair services' },
              { value: stats.cities, suffix: '', labelAr: 'مدينة مغطاة', labelEn: 'Cities covered' },
              { value: stats.categories, suffix: '', labelAr: 'فئات خدمة رئيسية', labelEn: 'Core service categories' },
              { value: 100, suffix: '%', labelAr: 'ضمان المقاس', labelEn: 'Fit guarantee' },
            ].map((s, idx) => (
              <div key={idx} className="p-6 sm:p-8 text-center">
                <p className="text-3xl sm:text-4xl font-bold text-[#18181B] tracking-tight">
                  <AnimatedCounter value={s.value} suffix={s.suffix} />
                </p>
                <p className="text-xs sm:text-sm text-muted mt-1.5 font-medium">
                  {isAr ? s.labelAr : s.labelEn}
                </p>
              </div>
            ))}
          </div>
        </section>
      </RevealOnScroll>

      {/* ─────────────────────────────────────────────────────────────
          2. PRESS LOGOS MARQUEE (Matching Screenshot 5)
         ───────────────────────────────────────────────────────────── */}
      <RevealOnScroll>
        <section className="py-10 border-b border-black/[0.06] bg-white">
          <div className="max-w-5xl mx-auto px-4 flex flex-wrap items-center justify-around gap-8 md:gap-14 opacity-80 text-[#18181B] font-serif font-bold text-xl md:text-2xl tracking-[0.2em] uppercase">
            <span className="tracking-tight font-sans font-black bg-black text-white px-2 py-0.5 rounded-sm text-lg">BBC</span>
            <span className="font-serif italic font-bold">VOGUE</span>
            <span className="font-serif tracking-widest">THE TIMES</span>
            <span className="font-serif italic tracking-wider">BAZAAR</span>
            <span className="font-serif lowercase font-bold tracking-tight">The Guardian</span>
          </div>
        </section>
      </RevealOnScroll>

      {/* ─────────────────────────────────────────────────────────────
          3. "WHAT WE DO" SECTION (Matching Screenshots 1 & 2)
         ───────────────────────────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-4 space-y-24">
        
        {/* Section Header */}
        <RevealOnScroll className="text-center space-y-4 max-w-2xl mx-auto">
          <span className="inline-block px-3.5 py-1 rounded-full bg-[#F4F4F5] text-[0.8125rem] font-medium text-[#18181B] border border-[#E4E4E7]">
            {isAr ? 'ماذا نقدم' : 'What we do'}
          </span>
          <h2 className="text-3xl sm:text-5xl font-sans font-bold text-[#18181B] tracking-tight">
            {isAr
              ? 'منصة التعديل والصيانة الاحترافية المعتمدة'
              : "We're the expert alterations and repair platform"}
          </h2>
          <p className="text-lg text-[#71717A] max-w-xl mx-auto leading-relaxed">
            {isAr
              ? 'حلول عناية فائقة بالملابس تحظى بثقة الأفراد وأكبر علامات الأزياء'
              : 'Expert clothing care solutions loved by both brands and customers'}
          </p>
        </RevealOnScroll>

        {/* Split 1: SOJO for customers (Screenshot 1) */}
        <RevealOnScroll className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <div className="space-y-6">
            <h3 className="text-3xl sm:text-4xl font-sans font-bold text-[#18181B] tracking-tight">
              {isAr ? 'خيّاط للأفراد' : 'SOJO for customers'}
            </h3>
            <p className="text-base sm:text-lg text-[#52525B] leading-relaxed">
              {isAr
                ? 'احجز خدمة تعديل أو صيانة ملابسك أونلاين بكل سهولة. استعد قطعك المفضلة بمقاس وتفصيل مثالي، مع خدمة التوصيل المباشر لبابك.'
                : 'Book expert clothing repairs and alteration services online. Get your favourite items back in perfect condition, delivered directly to your door.'}
            </p>

            <ul className="space-y-3.5 pt-2">
              {[
                isAr ? 'حجز إلكتروني مبسط في 5 دقائق' : 'Simple online booking in 5 minutes',
                isAr ? 'دليل إرشادي لتثبيت الدبابيس وتحديد الطول من المنزل' : 'At-home pinning & repair finish guidance',
                isAr ? 'تنفيذ فائق الدقة بأيدي خيّاطين محترفين معتمدين' : "Everything completed by Khayyat's expert vetted tailors",
              ].map((item, idx) => (
                <li key={idx} className="flex items-center gap-3 text-[0.9375rem] text-[#18181B] font-medium">
                  <span className="w-5 h-5 rounded-full bg-black text-white flex items-center justify-center text-xs flex-shrink-0">
                    ✓
                  </span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>

            <div className="pt-4">
              <Link href="/requests">
                <span className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#18181B] hover:bg-black text-white text-[0.875rem] font-semibold transition-all shadow-sm">
                  {isAr ? 'كيف يعمل خيّاط ↗' : 'How it works ↗'}
                </span>
              </Link>
            </div>
          </div>

          {/* Photo: Artisan hands sewing at machine (Matching Screenshot 1) */}
          <div className="overflow-hidden rounded-3xl shadow-xl aspect-[4/3] bg-zinc-100 relative group">
            <img
              src="/AEfoZzbxbn68WvwFvvXQInhOs.jpeg"
              alt="Artisan hands operating a sewing machine"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
            />
          </div>
        </RevealOnScroll>

        {/* Split 2: SOJO for brands (Screenshot 2) */}
        <RevealOnScroll className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center pt-8">
          {/* Photo: Delivery Cargo / Specialized Care (Matching Screenshot 2) */}
          <div className="order-2 lg:order-1 overflow-hidden rounded-3xl shadow-xl aspect-[4/3] bg-zinc-100 relative group">
            <img
              src="/AGI6JHG4ojGjbREnbz8H9K897g.png"
              alt="Dedicated logistics delivery for garments"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
            />
          </div>

          {/* Brand Details */}
          <div className="order-1 lg:order-2 space-y-6">
            <h3 className="text-3xl sm:text-4xl font-sans font-bold text-[#18181B] tracking-tight">
              {isAr ? 'خيّاط للمتاجر والعلامات' : 'SOJO for brands'}
            </h3>
            <p className="text-base sm:text-lg text-[#52525B] leading-relaxed">
              {isAr
                ? 'نتعاون مع كبرى علامات الأزياء وبوتيكات التجزئة لتوفير خدمات تعديل وصيانة ما بعد البيع تقلل الهدر وتزيد ولاء العملاء.'
                : 'We partner with leading fashion brands to deliver scalable tailoring and repair aftercare solutions that reduce waste and increase customer loyalty.'}
            </p>

            <ul className="space-y-3.5 pt-2">
              {[
                isAr ? 'زيادة المبيعات داخل المتاجر عبر حلول التعديل الفورية' : 'Drive in-store sales with our retail solution',
                isAr ? 'استعادة قيمة المخزون التالف وإعادة تأهيله للبيع' : 'Unlock revenue through damaged stock recovery',
                isAr ? 'إطلاق خدمة صيانة شاملة تعزز معايير الاستدامة لعلامتك' : 'Launch a nationwide customer repair service to boost sustainability credentials',
              ].map((item, idx) => (
                <li key={idx} className="flex items-center gap-3 text-[0.9375rem] text-[#18181B] font-medium">
                  <span className="w-5 h-5 rounded-full bg-black text-white flex items-center justify-center text-xs flex-shrink-0">
                    ✓
                  </span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>

            <div className="pt-4">
              <Link href="/dashboard/tailor">
                <span className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#18181B] hover:bg-black text-white text-[0.875rem] font-semibold transition-all shadow-sm">
                  {isAr ? 'حلول الأعمال ↗' : 'Our solutions ↗'}
                </span>
              </Link>
            </div>
          </div>
        </RevealOnScroll>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          4. "OUR WORK WITH BRANDS" 3-CARD SHOWCASE (Matching Screenshot 3)
         ───────────────────────────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-4 space-y-12">
        <RevealOnScroll className="text-center space-y-4 max-w-2xl mx-auto">
          <span className="inline-block px-3.5 py-1 rounded-full bg-[#F4F4F5] text-[0.8125rem] font-medium text-[#18181B] border border-[#E4E4E7]">
            {isAr ? 'حلولنا' : 'Our solutions'}
          </span>
          <h2 className="text-3xl sm:text-5xl font-sans font-bold text-[#18181B] tracking-tight">
            {isAr ? 'منظومة عملنا مع العلامات التجارية' : 'Our work with brands'}
          </h2>
          <p className="text-lg text-[#71717A] max-w-xl mx-auto leading-relaxed">
            {isAr
              ? 'حلول تعديل وصيانة متكاملة تدعم أهداف النمو والاستدامة لقطاع الأزياء'
              : 'End-to-end repair and alteration solutions to support goals across your business'}
          </p>
        </RevealOnScroll>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Card 1: Customer repair service */}
          <RevealOnScroll className="space-y-4 group cursor-pointer">
            <div className="overflow-hidden rounded-3xl aspect-[4/3] bg-zinc-100 shadow-md">
              <img
                src="/4ELzdJRzQ5VXQAPbmICpr3joms.png"
                alt="Hand stitching clothing repair"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
            </div>
            <h4 className="text-xl font-bold text-[#18181B] tracking-tight">
              {isAr ? 'خدمة صيانة وإصلاح الأفراد' : 'Customer repair service'}
            </h4>
            <p className="text-sm text-[#71717A] leading-relaxed">
              {isAr
                ? 'خدمة صيانة وإصلاح متكاملة لعملاء متاجرك — حجز رقمي مباشر وتسليم خلال سبعة أيام بمستوى عالٍ من التخصيص.'
                : 'A fully managed repair service for your customers — booked online and returned in seven days. Fully customised to your brand.'}
            </p>
          </RevealOnScroll>

          {/* Card 2: Digitised retail alterations */}
          <RevealOnScroll className="space-y-4 group cursor-pointer" delayMs={120}>
            <div className="overflow-hidden rounded-3xl aspect-[4/3] bg-zinc-100 shadow-md">
              <img
                src="/KHAYAT.png"
                alt="Tailor fitting a bespoke suit jacket"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
            </div>
            <h4 className="text-xl font-bold text-[#18181B] tracking-tight">
              {isAr ? 'رقمنة تعديلات متاجر التجزئة' : 'Digitised retail alterations'}
            </h4>
            <p className="text-sm text-[#71717A] leading-relaxed">
              {isAr
                ? 'متاجرك وخيّاطوك مع منصتنا الذكية. نحول التعديلات اليدوية والفواتير الورقية إلى تجربة رقمية متكاملة تتضمن الحجز والتتبع والإشعارات.'
                : 'Your stores, your tailors, our tech. Khayyat digitises your in-store alterations process — replacing paper dockets with automated booking, comms and invoicing across every location.'}
            </p>
          </RevealOnScroll>

          {/* Card 3: Damaged stock recovery */}
          <RevealOnScroll className="space-y-4 group cursor-pointer" delayMs={240}>
            <div className="overflow-hidden rounded-3xl aspect-[4/3] bg-zinc-100 shadow-md">
              <img
                src="/AEfoZzbxbn68WvwFvvXQInhOs.jpeg"
                alt="Hands inspecting fabric for recovery"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
            </div>
            <h4 className="text-xl font-bold text-[#18181B] tracking-tight">
              {isAr ? 'استعادة وتأهيل المخزون التالف' : 'Damaged stock recovery'}
            </h4>
            <p className="text-sm text-[#71717A] leading-relaxed">
              {isAr
                ? 'تحويل الملابس التالفة والمرتجعات غير القابلة للبيع إلى عوائد مستردة عبر ترميمها وإعادتها لحالتها الأصلية للبيع.'
                : 'Turn damaged and unsellable inventory into recovered revenue. Khayyat repairs and restores marked-out stock — from shop floor returns to warehouse overstocks.'}
            </p>
          </RevealOnScroll>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          5. DARK MODE "KEY FEATURES" (Directly matching Screenshot 4)
         ───────────────────────────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-4">
        {/* Brand Partner Logos Above the Dark Card */}
        <div className="py-6 flex flex-wrap items-center justify-around gap-8 opacity-70 grayscale text-[#18181B] font-serif font-bold text-lg md:text-xl tracking-widest uppercase">
          <span>PAUL SMITH</span>
          <span>RALPH LAUREN</span>
          <span>GANNI</span>
          <span>M&S</span>
          <span>HARVEY NICHOLS</span>
        </div>

        {/* Dark Container */}
        <div className="rounded-[2.5rem] bg-[#14171F] text-white p-8 sm:p-14 md:p-20 space-y-16 shadow-2xl border border-white/[0.08] relative overflow-hidden">
          {/* Ambient glow accents */}
          <div className="pointer-events-none absolute -top-24 -right-24 w-72 h-72 rounded-full bg-gold/10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 -left-24 w-72 h-72 rounded-full bg-info/10 blur-3xl" />

          <RevealOnScroll className="text-center space-y-4 max-w-2xl mx-auto relative">
            <span className="inline-block px-3.5 py-1 rounded-full bg-white/10 text-[0.8125rem] font-medium text-white/90 border border-white/15">
              {isAr ? 'أبرز المزايا' : 'Key Features'}
            </span>
            <h2 className="text-3xl sm:text-5xl font-sans font-bold tracking-tight text-white">
              {isAr
                ? 'لماذا تختار كبرى دور الأزياء منصة خيّاط'
                : 'Why the biggest names in fashion choose KHAYYAT'}
            </h2>
            <p className="text-sm sm:text-base text-zinc-400 leading-relaxed">
              {isAr
                ? 'أحدث التقنيات الرقمية، خبرات تشغيلية لوجستية، وحرفية خياطة متفوقة — مدمجة في حل متكامل للعناية بالملابس.'
                : 'Best-in-class technology, operations and tailoring expertise — built into a cohesive clothing care solution for fashion brands.'}
            </p>
          </RevealOnScroll>

          {/* 3 Dark Feature Cards with Line Icons (Matching Screenshot 4) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">

            {/* Card 1 */}
            <RevealOnScroll className="bg-[#1C202B]/80 border border-white/10 rounded-2xl p-8 space-y-4 hover:border-white/25 hover:-translate-y-1 transition-all">
              <div className="w-10 h-10 flex items-center justify-center text-white">
                <svg className="w-8 h-8 stroke-current" fill="none" viewBox="0 0 24 24" strokeWidth="1.75">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-white tracking-tight">
                {isAr ? 'عائد استثماري ملموس ومثبت' : 'Proven to drive tangible ROI'}
              </h3>
              <p className="text-sm text-zinc-400 leading-relaxed">
                {isAr
                  ? 'نبني نموذج عمل ملموس مع كل شريك تجاري يقلل من مرتجعات المقاسات ويرفع نسبة رضا وولاء العملاء.'
                  : 'We build real business cases with every brand partner — identifying genuine challenges and delivering measurable results that go well beyond customer experience.'}
              </p>
            </RevealOnScroll>

            {/* Card 2 */}
            <RevealOnScroll className="bg-[#1C202B]/80 border border-white/10 rounded-2xl p-8 space-y-4 hover:border-white/25 hover:-translate-y-1 transition-all" delayMs={120}>
              <div className="w-10 h-10 flex items-center justify-center text-white">
                <svg className="w-8 h-8 stroke-current" fill="none" viewBox="0 0 24 24" strokeWidth="1.75">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 3v1.5M4.5 8.25H3m18 0h-1.5M4.5 12H3m18 0h-1.5m-15 3.75H3m18 0h-1.5M8.25 19.5V21M12 3v1.5m0 15V21m3.75-18v1.5m0 15V21m-9-1.5h10.5a2.25 2.25 0 002.25-2.25V6.75a2.25 2.25 0 00-2.25-2.25H6.75A2.25 2.25 0 004.5 6.75v10.5a2.25 2.25 0 002.25 2.25zm.75-12h9v9h-9v-9z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-white tracking-tight">
                {isAr ? 'حجز ذكي وبيانات مدعومة بالذكاء الاصطناعي' : 'AI-driven booking & insights'}
              </h3>
              <p className="text-sm text-zinc-400 leading-relaxed">
                {isAr
                  ? 'خطوات حجز ذكية تمنح العملاء مقترحات تعديل وصيانة مخصصة، وتزود شركاءنا ببيانات دقيقة وقابلة للتنفيذ.'
                  : 'Our booking flow uses AI to give customers personalised repair and alteration recommendations, while giving brand partners clear, actionable data on performance and value delivered.'}
              </p>
            </RevealOnScroll>

            {/* Card 3 */}
            <RevealOnScroll className="bg-[#1C202B]/80 border border-white/10 rounded-2xl p-8 space-y-4 hover:border-white/25 hover:-translate-y-1 transition-all" delayMs={240}>
              <div className="w-10 h-10 flex items-center justify-center text-white">
                <svg className="w-8 h-8 stroke-current" fill="none" viewBox="0 0 24 24" strokeWidth="1.75">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-white tracking-tight">
                {isAr ? 'خبرة تشغيلية وحرفية متفوقة' : 'Operational expertise'}
              </h3>
              <p className="text-sm text-zinc-400 leading-relaxed">
                {isAr
                  ? 'بنية تشغيلية مبنية من الصفر — انتقاء أمهر الخيّاطين، تدريب معتمد، والتزام صارم بمواعيد وجودة التسليم.'
                  : "We've built exceptional operations from the ground up — best-in-class talent, training programmes, and the processes to consistently deliver on quality and SLAs."}
              </p>
            </RevealOnScroll>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          6. BOTTOM CALL TO ACTION
         ───────────────────────────────────────────────────────────── */}
      <RevealOnScroll>
        <section className="max-w-4xl mx-auto px-4 text-center space-y-6 pt-6">
          <h2 className="text-3xl sm:text-5xl font-sans font-bold text-[#18181B] tracking-tight">
            {isAr ? 'جاهز لتجربة العناية بملابسك؟' : 'Ready to repair & alter your clothes?'}
          </h2>
          <p className="text-lg text-[#71717A] max-w-lg mx-auto">
            {isAr
              ? 'انضم للآلاف ممن يستمتعون بملابس بمقاس مثالي تدوم لسنوات أطول.'
              : 'Join thousands of customers wearing clothes that fit right and last longer.'}
          </p>
          <div className="pt-2">
            <Link href="/requests">
              <span className="btn-shine inline-flex items-center px-8 py-3.5 rounded-full text-base font-semibold text-white bg-[#18181B] hover:bg-black shadow-lg transition-transform hover:scale-105">
                {isAr ? 'احجز خدمة تعديل الآن ➔' : 'Book an alteration now ➔'}
              </span>
            </Link>
          </div>
        </section>
      </RevealOnScroll>

    </div>
  );
}
