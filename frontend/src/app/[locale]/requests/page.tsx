'use client';

import React, { useState } from 'react';
import { useLocale } from 'next-intl';
import { BookingWizard } from '@/components/sojo/BookingWizard';

export default function RequestsPage() {
  const locale = useLocale();
  const isAr = locale === 'ar';
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const faqs = [
    {
      qAr: 'كيف أقوم بتحديد المقاس المطلوب بالدبابيس (Pinning)؟',
      qEn: 'How do I pin my garment for the tailor?',
      aAr: 'الأمر في غاية البساطة! ارتدِ القطعة مع الحذاء الذي تنوي ارتداءه معها، ثم اطوِ القماش للداخل حتى الطول أو التضييق المرغوب، وثبّت دبوسين أو ثلاثة بمحاذاة الحاشية. وسيتولى خيّاطنا المتمرس محاكاة المقاس بدقة متناهية.',
      aEn: 'It is very simple! Put on the garment with the shoes you plan to wear, fold the excess fabric inside to your desired length or taper, and insert 2-3 safety pins. Our master tailor will replicate the exact fit seamlessly.'
    },
    {
      qAr: 'ماذا لو لم يكن المقاس مناسباً بنسبة 100%؟',
      qEn: 'What happens if the fit is not 100% perfect?',
      aAr: 'نقدم في خيّاط "ضمان المقاس المثالي" (100% Fit Guarantee). إذا لم تكن راضياً عن التعديل، سنتكفل باستلام القطعة مجاناً وإعادة تعديلها وضبطها دون أي تكلفة إضافية.',
      aEn: 'We offer a strict 100% Fit Guarantee. If the fit is not exactly as requested, we pick up your item free of charge and re-alter it until it fits like a glove.'
    },
    {
      qAr: 'كم يستغرق استلام وتنفيذ الطلب؟',
      qEn: 'How long does collection, tailoring, and delivery take?',
      aAr: 'تستغرق الدورة القياسية ما بين 3 إلى 5 أيام عمل من باب بيتك وإليه. كما نوفر خدمة الخياطة السريعة (Express Service) خلال 48 ساعة فقط في الرياض وجدة.',
      aEn: 'Standard turnaround is 3 to 5 business days door-to-door. We also offer an Express 48-hour service across Riyadh and Jeddah.'
    },
    {
      qAr: 'هل يمكنني إرسال قطعة قديمة كمرجع للمقاس (Clone-a-fit)؟',
      qEn: 'Can I send a favorite garment as a fit sample?',
      aAr: 'نعم بالتأكيد! يمكنك اختيار "إرفاق قطعة للمقاس"، حيث يطابق الخيّاط أبعاد قطعتك الجديدة مع قطعتك المفضلة تماماً ثم يعيدهما معاً بعناية فائقة.',
      aEn: 'Absolutely! You can choose "Match a sample item", where the tailor precisely clones the dimensions of your best-fitting garment and returns both safely.'
    }
  ];

  return (
    <div className="py-8 md:py-14 px-4 max-w-6xl mx-auto space-y-14 pt-28">
      
      {/* Editorial Luxury Header */}
      <div className="relative rounded-3xl overflow-hidden bg-[#12141A] text-white p-8 md:p-12 shadow-2xl border border-white/10">
        <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/70 to-transparent z-10" />
        <img
          src="/AEfoZzbxbn68WvwFvvXQInhOs.jpeg"
          alt="Khayyat Master Atelier"
          className="absolute inset-0 w-full h-full object-cover object-center opacity-40 mix-blend-overlay"
        />

        <div className="relative z-20 max-w-2xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-semibold text-zinc-200">
            <span>✨ {isAr ? 'خدمة الخياطة والتعديل الفاخرة' : 'Bespoke Alteration & Repair'}</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight leading-tight">
            {isAr ? 'عدّل ملابسك بأيدي نخبة الخيّاطين.. دون مغادرة منزلك' : 'Crafted Alterations Delivered To Your Doorstep'}
          </h1>

          <p className="text-sm sm:text-base text-zinc-300 leading-relaxed font-light">
            {isAr
              ? 'اختر نوع القطعة والتعديل المطلوب، وثبّت دبابيسك أو أرفق صورتك، وسيتولى مندوبنا الاستلام والتوصيل بعد إتمام الخياطة الاحترافية بأعلى معايير الإتقان.'
              : 'Book your garment alteration in minutes. Pin your fit, hand it to our courier, and get it back tailored to perfection with our 100% Fit Guarantee.'}
          </p>

          {/* Quick Metrics Bar */}
          <div className="pt-2 flex flex-wrap items-center gap-6 text-xs text-zinc-300">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>{isAr ? 'ضمان المقاس 100%' : '100% Fit Guarantee'}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              <span>{isAr ? 'شحن مأمّن بالكامل' : 'Insured Doorstep Transit'}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-400" />
              <span>{isAr ? 'مشاغل معتمدة ومفحوصة' : 'Vetted Master Tailors'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3 Simple Steps Process */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-3xl p-6 border border-line/80 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="space-y-3">
            <span className="w-10 h-10 rounded-2xl bg-black text-white text-sm font-bold flex items-center justify-center">
              01
            </span>
            <h3 className="text-lg font-bold text-ink">
              {isAr ? 'اختر القطعة والخدمة' : 'Select Garment & Fix'}
            </h3>
            <p className="text-xs text-muted leading-relaxed">
              {isAr
                ? 'حدد نوع الملابس كالبناطيل، الثياب، العبايات، أو الفساتين واختر التعديلات المناسبة بأسعار تقريبية واضحة مسبقاً.'
                : 'Choose trousers, thobes, abayas, or evening dresses with transparent fixed estimate pricing.'}
            </p>
          </div>
          <div className="pt-4 text-xs font-semibold text-charcoal flex items-center gap-1">
            <span>{isAr ? 'أسعار شفافة ومباشرة' : 'Clear upfront estimates'}</span>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-6 border border-line/80 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="space-y-3">
            <span className="w-10 h-10 rounded-2xl bg-black text-white text-sm font-bold flex items-center justify-center">
              02
            </span>
            <h3 className="text-lg font-bold text-ink">
              {isAr ? 'دبّس مقاسك أو أرفق المقاس' : 'Pin It or Match a Fit'}
            </h3>
            <p className="text-xs text-muted leading-relaxed">
              {isAr
                ? 'استخدم دبابيس التثبيت حسب دليلنا المرئي، أو اطلب خياطة عينة تطابق قطعة أخرى مفضلة لديك في خزانتك.'
                : 'Use safety pins following our illustrated guide, or send a clone-sample from your wardrobe.'}
            </p>
          </div>
          <div className="pt-4 text-xs font-semibold text-charcoal flex items-center gap-1">
            <span>{isAr ? 'دليل إرشادي مدعوم بالصور' : 'Illustrated visual guide'}</span>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-6 border border-line/80 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="space-y-3">
            <span className="w-10 h-10 rounded-2xl bg-black text-white text-sm font-bold flex items-center justify-center">
              03
            </span>
            <h3 className="text-lg font-bold text-ink">
              {isAr ? 'استلام وتسليم لباب بيتك' : 'Doorstep Pickup & Return'}
            </h3>
            <p className="text-xs text-muted leading-relaxed">
              {isAr
                ? 'يستلم المندوب القطعة بكيس خيّاط المخصص، ثم يعيدها لك مكوية ومعدلة بأيدي أمهر المشاغل.'
                : 'Our insured courier collects your item in our custom bag and returns it freshly pressed and altered.'}
            </p>
          </div>
          <div className="pt-4 text-xs font-semibold text-charcoal flex items-center gap-1">
            <span>{isAr ? 'تتبع لحظي عبر الخريطة' : 'Live courier tracking'}</span>
          </div>
        </div>
      </div>

      {/* Booking Wizard Interactive Container */}
      <div className="pt-2">
        <BookingWizard />
      </div>

      {/* Visual Pinning Guide Showcase Card */}
      <div className="bg-[#18181B] rounded-3xl p-8 sm:p-12 text-white border border-white/10 shadow-xl overflow-hidden relative">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          <div className="space-y-4">
            <span className="px-3 py-1 rounded-full bg-white/10 text-xs font-semibold tracking-wide text-zinc-300">
              {isAr ? 'دليل القياس الذكي' : 'Measurement Precision'}
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold">
              {isAr ? 'كيف تدبّس قطعتك مثل خبراء الأزياء؟' : 'How To Pin Your Clothes Like a Pro'}
            </h2>
            <p className="text-sm text-zinc-300 leading-relaxed font-light">
              {isAr
                ? 'لا حاجة لزيارة المشغل للقياس! فقط اطوِ القماش وثبته بدبوس أمان واحد أو اثنين. خيّاطونا المعتمدون مدربون على قراءة علاماتك بدقة الملليمتر.'
                : 'Never visit an alteration shop again. Fold the fabric to your preferred fit and insert safety pins. Our master tailors read your markings with millimeter precision.'}
            </p>
            <div className="pt-2">
              <a
                href="#booking"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white text-black font-bold text-xs hover:bg-zinc-200 transition-colors"
              >
                {isAr ? 'ابدأ حجز التعديل الآن ➔' : 'Start Your Booking ➔'}
              </a>
            </div>
          </div>

          <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-white/15 bg-black/40">
            <img
              src="/4ELzdJRzQ5VXQAPbmICpr3joms.png"
              alt="Pinning guide detail"
              className="w-full h-64 sm:h-80 object-cover object-center filter contrast-105"
            />
            <div className="absolute bottom-3 left-3 right-3 bg-black/75 backdrop-blur-md p-3 rounded-xl text-xs text-zinc-200 border border-white/10">
              💡 {isAr ? 'نصيحة: قس بنطالك مع الحذاء الذي ترتديه عادة لضمان طول حاشية مثالي.' : 'Pro tip: Try on with the shoes you plan to wear for a flawless break.'}
            </div>
          </div>
        </div>
      </div>

      {/* Frequently Asked Questions */}
      <div className="space-y-6 pt-6">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold text-ink">
            {isAr ? 'الأسئلة الشائعة حول الخدمة' : 'Frequently Asked Questions'}
          </h2>
          <p className="text-sm text-muted">
            {isAr ? 'كل ما تحتاج معرفته عن تجربة خيّاط الذكية والمضمونة' : 'Everything you need to know about Khayyat alterations'}
          </p>
        </div>

        <div className="max-w-3xl mx-auto space-y-3">
          {faqs.map((faq, index) => {
            const isOpen = openFaq === index;
            return (
              <div
                key={index}
                className="rounded-2xl border border-line bg-white overflow-hidden transition-all shadow-xs"
              >
                <button
                  type="button"
                  onClick={() => setOpenFaq(isOpen ? null : index)}
                  className="w-full p-5 text-start flex items-center justify-between gap-4 font-bold text-ink text-sm sm:text-base hover:bg-mist/30 transition-colors"
                >
                  <span>{isAr ? faq.qAr : faq.qEn}</span>
                  <span className="text-lg text-muted transition-transform duration-200">
                    {isOpen ? '−' : '+'}
                  </span>
                </button>
                {isOpen && (
                  <div className="p-5 pt-0 text-xs sm:text-sm text-muted leading-relaxed border-t border-line/50 bg-mist/10">
                    {isAr ? faq.aAr : faq.aEn}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}
