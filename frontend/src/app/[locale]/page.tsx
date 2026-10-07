'use client';

import React, { useEffect, useState } from 'react';
import { useLocale } from 'next-intl';
import { Link, useRouter } from '@/i18n/routing';
import { RevealOnScroll } from '@/components/ui/RevealOnScroll';
import { bookingsApi, formatPrice, type BookingOptions } from '@/lib/api';
import { QUICK_ITEMS, SCENES, SERVICES, statusLabel } from '@/components/booking/catalog';

const JOURNEY = [
  { ar: 'اختار أو اوصف', en: 'Choose or describe' },
  { ar: 'منقترح الخدمة', en: 'We recommend' },
  { ar: 'المكان والوقت', en: 'Place & time' },
  { ar: 'تأكيد', en: 'Confirm' },
  { ar: 'تتبع مباشر', en: 'Live tracking' },
  { ar: 'تنفيذ', en: 'Service done' },
  { ar: 'دفع كاش', en: 'Pay in cash' },
  { ar: 'تقييم', en: 'Review' },
];

const SAMPLE_PIPELINE = ['submitted', 'confirmed', 'van_assigned', 'pickup_in_progress', 'item_received', 'in_progress', 'quality_check', 'ready', 'completed'];
const SAMPLE_CURRENT = 5;

export default function HomePage() {
  const isAr = useLocale() === 'ar';
  const router = useRouter();
  const [ask, setAsk] = useState('');
  const [options, setOptions] = useState<BookingOptions | null>(null);

  useEffect(() => {
    bookingsApi.options().then(setOptions).catch(() => {});
  }, []);

  const price = (usd: number) => (options ? formatPrice(usd, options.usd_to_syp, isAr) : `$${usd}`);

  return (
    <div className="space-y-24 pb-20">
      {/* HERO */}
      <section className="relative min-h-[88vh] flex items-center justify-center overflow-hidden px-4">
        <div className="absolute inset-0 bg-cover bg-center -z-10 animate-ken-burns" style={{ backgroundImage: `url('${SCENES.hero}')` }} />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/45 to-black/70 -z-10" />

        <div className="max-w-3xl mx-auto pt-28 pb-16 space-y-7 text-center text-white">
          <span className="reveal is-visible inline-flex items-center gap-2 rounded-full bg-white/15 backdrop-blur-md border border-white/25 px-4 py-1 text-[0.8125rem] font-medium">
            {isAr ? 'دمشق · خدمة خياطة عند الطلب' : 'Damascus · on-demand tailoring'}
          </span>
          <h1 className="reveal is-visible text-4xl sm:text-6xl font-bold tracking-tight leading-[1.1]" style={{ animationDelay: '100ms' }}>
            {isAr ? (
              <>الخياطة والتعديل،<br /><span className="text-gold-gradient">بسهولة طلب أي خدمة.</span></>
            ) : (
              <>Tailoring and alterations,<br /><span className="text-gold-gradient">as easy as any on-demand service.</span></>
            )}
          </h1>
          <p className="reveal is-visible text-base sm:text-lg text-white/80 max-w-xl mx-auto" style={{ animationDelay: '200ms' }}>
            {isAr
              ? 'احجز موعد بالمحل، أو خلّي الفان يجي ياخد القياس، أو الخيّاط يشتغل عندك بالبيت. وتابع كل خطوة لحظة بلحظة.'
              : 'Book a shop appointment, have our van come to measure you, or get the tailor to work at your home, then follow every step live.'}
          </p>

          <form
            className="reveal is-visible mx-auto flex max-w-xl flex-col gap-2 rounded-3xl bg-white p-2 shadow-2xl sm:flex-row"
            style={{ animationDelay: '300ms' }}
            onSubmit={(e) => { e.preventDefault(); router.push(`/book?describe=${encodeURIComponent(ask)}`); }}
          >
            <input
              id="hero-ask"
              value={ask}
              onChange={(e) => setAsk(e.target.value)}
              placeholder={isAr ? 'شو بدك تعمل بقطعتك؟ مثلاً: تقصير بنطلون' : 'What does your piece need? e.g. shorten trousers'}
              className="h-12 flex-1 rounded-2xl px-4 text-sm text-[#18181B] placeholder:text-muted focus:outline-none"
            />
            <button type="submit" className="btn-shine h-12 rounded-2xl bg-[#18181B] px-6 text-sm font-bold text-white whitespace-nowrap">
              {isAr ? 'اقترحلي الخدمة' : 'Suggest a service'}
            </button>
          </form>

          <div className="reveal is-visible flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs text-white/75" style={{ animationDelay: '400ms' }}>
            <span>✓ {isAr ? 'الدفع كاش بعد الخدمة' : 'Pay in cash after the service'}</span>
            <span>✓ {isAr ? 'تتبع مباشر للطلب' : 'Live order tracking'}</span>
            <span>✓ {isAr ? 'محادثة مع الخيّاط' : 'Chat with the tailor'}</span>
          </div>
        </div>
      </section>

      {/* SERVICES */}
      <section id="services" className="max-w-6xl mx-auto px-4 space-y-10 scroll-mt-28">
        <RevealOnScroll className="text-center space-y-3 max-w-2xl mx-auto">
          <span className="inline-block px-3.5 py-1 rounded-full bg-[#F4F4F5] text-[0.8125rem] font-medium text-[#18181B] border border-[#E4E4E7]">
            {isAr ? 'خدماتنا' : 'Services'}
          </span>
          <h2 className="text-3xl sm:text-5xl font-bold text-[#18181B] tracking-tight">
            {isAr ? 'أربع طرق، اختار الأنسب إلك' : 'Four ways, pick what suits you'}
          </h2>
          <p className="text-[#71717A]">
            {isAr ? 'ما بتعرف شو بيناسبك؟ احكيلنا شو بدك ونحن منقترح.' : 'Not sure which fits? Tell us what you need and we’ll suggest one.'}
          </p>
        </RevealOnScroll>

        <div className="grid gap-6 sm:grid-cols-2">
          {SERVICES.map((s, i) => {
            const fee = options?.visit_fees_usd[s.type];
            return (
              <RevealOnScroll key={s.type} delayMs={i * 80}>
                <Link href={`/book?service=${s.type}`} className="group flex h-full flex-col overflow-hidden rounded-3xl border border-line/80 bg-white shadow-sm transition-shadow hover:shadow-xl">
                  <div className="aspect-[16/9] overflow-hidden bg-cream">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={s.image} alt={isAr ? s.ar.name : s.en.name} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
                  </div>
                  <div className="flex flex-1 flex-col gap-3 p-6">
                    <h3 className="text-xl font-bold text-[#18181B]">{s.icon} {isAr ? s.ar.name : s.en.name}</h3>
                    <p className="text-sm text-[#52525B] leading-relaxed flex-1">{isAr ? s.ar.long : s.en.long}</p>
                    <p className="text-xs font-medium text-muted">{isAr ? s.ar.steps : s.en.steps}</p>
                    <div className="flex items-center justify-between pt-2 border-t border-line">
                      <span className="text-xs text-muted">
                        {fee === undefined ? '' : fee > 0 ? `${isAr ? 'رسم الزيارة' : 'Visit fee'} ${price(fee)}` : (isAr ? 'بدون رسم زيارة' : 'No visit fee')}
                      </span>
                      <span className="rounded-full bg-[#18181B] px-4 py-2 text-xs font-bold text-white">{isAr ? 'احجز ←' : 'Book →'}</span>
                    </div>
                  </div>
                </Link>
              </RevealOnScroll>
            );
          })}
        </div>
      </section>

      {/* JOURNEY */}
      <section className="max-w-6xl mx-auto px-4 space-y-10">
        <RevealOnScroll className="text-center space-y-3">
          <h2 className="text-3xl sm:text-5xl font-bold text-[#18181B] tracking-tight">{isAr ? 'من الطلب للتسليم' : 'From request to delivery'}</h2>
          <p className="text-[#71717A]">{isAr ? 'نفس الرحلة لكل الخدمات، بدقيقتين بتحجز.' : 'One journey for every service; booking takes about two minutes.'}</p>
        </RevealOnScroll>
        <RevealOnScroll>
          <ol className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
            {JOURNEY.map((j, i) => (
              <li key={j.en} className="rounded-2xl border border-line bg-white p-4 text-center">
                <span className="mx-auto mb-2 flex h-8 w-8 items-center justify-center rounded-full bg-[#18181B] text-xs font-bold text-white">{i + 1}</span>
                <p className="text-sm font-semibold text-[#18181B]">{isAr ? j.ar : j.en}</p>
              </li>
            ))}
          </ol>
        </RevealOnScroll>
      </section>

      {/* TRACKING SHOWCASE */}
      <section className="max-w-6xl mx-auto px-4">
        <div className="grid items-center gap-10 rounded-[2.5rem] bg-[#14171F] p-8 text-white sm:p-14 lg:grid-cols-2">
          <RevealOnScroll className="space-y-5">
            <span className="inline-block rounded-full bg-white/10 px-3.5 py-1 text-[0.8125rem] font-medium text-white/90 border border-white/15">
              {isAr ? 'تتبع مباشر' : 'Live tracking'}
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">{isAr ? 'بتعرف وين قطعتك بكل لحظة' : 'Know where your piece is, at every moment'}</h2>
            <p className="text-zinc-400 leading-relaxed">
              {isAr
                ? 'لما الفان يطلع لعندك، لما نستلم القطعة، لما يبلّش الشغل ولما تخلص. بيوصلك إشعار، وفيك تحكي مع الفريق وتبعت صور بأي وقت.'
                : 'When the van heads out, when we receive your piece, when work starts and when it’s done, you get a notification, and you can message the team and send photos at any time.'}
            </p>
            <Link href="/book" className="inline-flex rounded-full bg-white px-6 py-3 text-sm font-bold text-black">{isAr ? 'جرّب الحجز' : 'Try booking'}</Link>
          </RevealOnScroll>
          <RevealOnScroll delayMs={120}>
            <div className="rounded-3xl bg-white p-6 text-[#18181B] shadow-2xl">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-mono text-muted">KH-EXAMPLE</p>
                  <p className="font-bold">{isAr ? 'استلام بالفان مع القياس' : 'Van pickup & measuring'}</p>
                </div>
                <span className="rounded-full bg-mist px-3 py-1 text-[11px] font-semibold text-muted">{isAr ? 'مثال' : 'Example'}</span>
              </div>
              <ol className="space-y-3">
                {SAMPLE_PIPELINE.map((s, i) => (
                  <li key={s} className="flex items-center gap-3 text-sm">
                    <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${
                      i < SAMPLE_CURRENT ? 'bg-gold text-[#18181B]' : i === SAMPLE_CURRENT ? 'bg-[#18181B] text-white ring-4 ring-gold/30' : 'border border-line text-muted'}`}>
                      {i < SAMPLE_CURRENT ? '✓' : i + 1}
                    </span>
                    <span className={i <= SAMPLE_CURRENT ? 'font-semibold' : 'text-muted'}>{statusLabel(s, 'van_pickup', isAr)}</span>
                  </li>
                ))}
              </ol>
            </div>
          </RevealOnScroll>
        </div>
      </section>

      {/* QUICK FIX PRICES */}
      <section className="max-w-6xl mx-auto px-4">
        <RevealOnScroll className="grid items-center gap-8 lg:grid-cols-[1fr_1.2fr]">
          <div className="overflow-hidden rounded-3xl aspect-[4/3] bg-cream">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={SCENES.workshop} alt="" className="h-full w-full object-cover" />
          </div>
          <div className="space-y-5">
            <h2 className="text-3xl sm:text-4xl font-bold text-[#18181B] tracking-tight">{isAr ? 'تصليح سريع، بسعر واضح' : 'Quick fixes, clear prices'}</h2>
            <p className="text-[#71717A]">{isAr ? 'للشغلات البسيطة يلي ما بدها قياس. بتعرف السعر قبل ما تحجز.' : 'For small jobs that need no measuring. You see the price before you book.'}</p>
            <ul className="grid gap-2 sm:grid-cols-2">
              {QUICK_ITEMS.map((q) => (
                <li key={q.key} className="flex items-center justify-between gap-3 rounded-2xl border border-line bg-white px-4 py-3 text-sm">
                  <span>{q.icon} {isAr ? q.ar : q.en}</span>
                  {options && (
                    <span className="font-semibold tabular-nums whitespace-nowrap">
                      <bdi dir="ltr">${options.quick_items_usd[q.key][0]}–{options.quick_items_usd[q.key][1]}</bdi>
                    </span>
                  )}
                </li>
              ))}
            </ul>
            <Link href="/book?service=quick_fix" className="btn-shine inline-flex rounded-full bg-[#18181B] px-6 py-3 text-sm font-bold text-white">
              {isAr ? 'احجز تصليح سريع' : 'Book a quick fix'}
            </Link>
          </div>
        </RevealOnScroll>
      </section>

      {/* FINAL CTA */}
      <RevealOnScroll>
        <section className="max-w-4xl mx-auto px-4 text-center space-y-6">
          <h2 className="text-3xl sm:text-5xl font-bold text-[#18181B] tracking-tight">{isAr ? 'قطعتك المفضلة بتستاهل تعيش أطول' : 'Your favourite piece deserves a longer life'}</h2>
          <p className="text-lg text-[#71717A] max-w-lg mx-auto">{isAr ? 'احجز بدقيقتين، والباقي علينا.' : 'Book in two minutes, we handle the rest.'}</p>
          <Link href="/book" className="btn-shine inline-flex items-center px-8 py-3.5 rounded-full text-base font-semibold text-white bg-[#18181B] hover:bg-black shadow-lg">
            {isAr ? 'احجز الآن ←' : 'Book now →'}
          </Link>
        </section>
      </RevealOnScroll>
    </div>
  );
}
