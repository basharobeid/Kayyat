'use client';

import React from 'react';
import { useLocale } from 'next-intl';
import { Link } from '@/i18n/routing';
import { RevealOnScroll } from '@/components/ui/RevealOnScroll';
import { SCENES } from '@/components/booking/catalog';

const T = {
  ar: {
    eyebrow: 'عن خيّاط',
    title: 'نخلي الخياطة والتعديل سهلة متل أي خدمة عند الطلب.',
    problemTitle: 'المشكلة',
    problem: 'تعديل قطعة بسيطة بدمشق بيعني مشوار للمحل، وانتظار، ومشوار تاني للبروفة، وتالت للاستلام. ما في سعر واضح قبل، ولا طريقة تعرف فيها وين صارت قطعتك. وكتير ناس بيأجلوا أو بيكبّوا قطع ممكن تتصلّح.',
    solutionTitle: 'الحل',
    solution: 'منصة حجز وحدة بتجمع أربع خدمات: موعد بالمحل، فان بيستلم وبياخد القياس من البيت، خيّاط بيشتغل عندك بالبيت، وتصليح سريع بسعر ثابت. النظام بيقترح الخدمة المناسبة من وصف الزبون، وبيعطي تتبع مباشر لكل مرحلة ومحادثة مع الفريق.',
    modelTitle: 'نموذج العمل',
    model: [
      ['رسم الزيارة', 'رسم ثابت لكل زيارة فان أو خيّاط منزلي.'],
      ['هامش على الشغل', 'سعر الخدمة بيتحدد بعد القياس، والخيّاطين الشركاء بياخدوا أجرهم عن كل شغلة.'],
      ['التصليح السريع', 'أسعار ثابتة لشغلات صغيرة ومتكررة، فيها هامش واضح وتشغيل بسيط.'],
    ],
    scaleTitle: 'كيف بيكبر',
    scale: 'كل فان بيغطي منطقة، وكل منطقة بتنضم إلها مشاغل شريكة. التوسع بيصير بإضافة فانات ومشاغل منطقة منطقة بدمشق، وبعدها مدن تانية متل حلب وحمص، بنفس النظام ونفس لوحة التشغيل.',
    techTitle: 'التقنية',
    tech: ['اقتراح ذكي للخدمة من وصف الطلب', 'تتبع مباشر بمراحل مختلفة لكل خدمة', 'محادثة مع الفريق مع صور', 'دخول آمن بحساب Google', 'لوحة تشغيل للفريق لإدارة الفانات والطلبات'],
    roadmapTitle: 'الخطة',
    roadmap: [['الآن', 'تجربة بدمشق مع مشاغل شريكة وفان واحد'], ['بعدها', 'تغطية كل مناطق دمشق وريفها'], ['لاحقاً', 'حلب وحمص، تطبيق موبايل، ودفع إلكتروني لما يتوفر']],
    cta: 'جرّب الحجز',
  },
  en: {
    eyebrow: 'About Khayyat',
    title: 'Making professional tailoring as convenient as any on-demand service.',
    problemTitle: 'The problem',
    problem: 'Altering even a simple piece in Damascus means a trip to the shop, a wait, a second trip for the fitting and a third to collect it. There is no clear price up front and no way to know where your piece is. Many people put it off, or throw away clothes that could be repaired.',
    solutionTitle: 'The solution',
    solution: 'One booking platform for four services: a shop appointment, a van that collects the piece and measures you at home, a tailor who works at your home, and quick fixes at fixed prices. The system recommends the right service from the customer’s description, with live tracking at every stage and chat with the team.',
    modelTitle: 'Business model',
    model: [
      ['Visit fee', 'A fixed fee for every van or at-home visit.'],
      ['Margin on the work', 'The job is priced after measuring; partner tailors are paid per job.'],
      ['Quick fixes', 'Fixed prices for small, repeat jobs with a clear margin and simple operations.'],
    ],
    scaleTitle: 'How it scales',
    scale: 'Each van covers a district, and each district brings in partner workshops. Growth means adding vans and workshops district by district across Damascus, then other cities such as Aleppo and Homs, on the same system and the same operations console.',
    techTitle: 'Technology',
    tech: ['Smart service recommendation from the request', 'Live tracking with a pipeline per service', 'Team chat with photos', 'Secure Google sign-in', 'Operations console to run vans and orders'],
    roadmapTitle: 'Roadmap',
    roadmap: [['Now', 'Damascus pilot with partner workshops and one van'], ['Next', 'Cover all of Damascus and Rif Dimashq'], ['Later', 'Aleppo and Homs, a mobile app, and online payment when available']],
    cta: 'Try booking',
  },
};

export default function AboutPage() {
  const isAr = useLocale() === 'ar';
  const t = isAr ? T.ar : T.en;

  return (
    <div className="pt-32 pb-20 px-4">
      <div className="max-w-4xl mx-auto space-y-16">
        <RevealOnScroll className="space-y-4">
          <span className="inline-block px-3.5 py-1 rounded-full bg-[#F4F4F5] text-[0.8125rem] font-medium text-[#18181B] border border-[#E4E4E7]">{t.eyebrow}</span>
          <h1 className="text-3xl sm:text-5xl font-bold text-[#18181B] tracking-tight leading-tight">{t.title}</h1>
        </RevealOnScroll>

        <div className="grid gap-8 md:grid-cols-2">
          <RevealOnScroll className="space-y-3">
            <h2 className="text-xl font-bold text-[#18181B]">{t.problemTitle}</h2>
            <p className="text-[#52525B] leading-relaxed">{t.problem}</p>
          </RevealOnScroll>
          <RevealOnScroll className="space-y-3" delayMs={100}>
            <h2 className="text-xl font-bold text-[#18181B]">{t.solutionTitle}</h2>
            <p className="text-[#52525B] leading-relaxed">{t.solution}</p>
          </RevealOnScroll>
        </div>

        <RevealOnScroll className="overflow-hidden rounded-3xl aspect-[21/9] bg-cream">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={SCENES.measuring} alt="" className="h-full w-full object-cover" />
        </RevealOnScroll>

        <RevealOnScroll className="space-y-5">
          <h2 className="text-2xl font-bold text-[#18181B]">{t.modelTitle}</h2>
          <div className="grid gap-4 sm:grid-cols-3">
            {t.model.map(([k, v]) => (
              <div key={k} className="rounded-2xl border border-line bg-white p-5 space-y-2">
                <p className="font-bold text-[#18181B]">{k}</p>
                <p className="text-sm text-[#52525B] leading-relaxed">{v}</p>
              </div>
            ))}
          </div>
        </RevealOnScroll>

        <div className="grid gap-8 md:grid-cols-2">
          <RevealOnScroll className="space-y-3">
            <h2 className="text-xl font-bold text-[#18181B]">{t.scaleTitle}</h2>
            <p className="text-[#52525B] leading-relaxed">{t.scale}</p>
          </RevealOnScroll>
          <RevealOnScroll className="space-y-3" delayMs={100}>
            <h2 className="text-xl font-bold text-[#18181B]">{t.techTitle}</h2>
            <ul className="space-y-2">
              {t.tech.map((x) => (
                <li key={x} className="flex gap-2 text-[#52525B]"><span className="text-gold-ink">✓</span>{x}</li>
              ))}
            </ul>
          </RevealOnScroll>
        </div>

        <RevealOnScroll className="space-y-5">
          <h2 className="text-2xl font-bold text-[#18181B]">{t.roadmapTitle}</h2>
          <ol className="grid gap-4 sm:grid-cols-3">
            {t.roadmap.map(([when, what], i) => (
              <li key={when} className="rounded-2xl bg-[#14171F] p-5 text-white space-y-2">
                <p className="text-xs font-bold uppercase tracking-widest text-gold">{i + 1} · {when}</p>
                <p className="text-sm text-white/85">{what}</p>
              </li>
            ))}
          </ol>
        </RevealOnScroll>

        <div className="text-center">
          <Link href="/book" className="btn-shine inline-flex rounded-full bg-[#18181B] px-8 py-3.5 text-base font-semibold text-white">{t.cta}</Link>
        </div>
      </div>
    </div>
  );
}
