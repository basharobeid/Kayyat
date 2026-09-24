import { getTranslations, setRequestLocale } from 'next-intl/server';
import type { ComponentType, SVGProps } from 'react';

import { FabricIcon, NeedleIcon, RulerIcon, ScissorsIcon } from '@/components/shared/icons';
import { buttonStyles } from '@/components/ui/button';
import { Link } from '@/i18n/routing';

type ServiceKey = 'alteration' | 'repair' | 'custom' | 'fabric';

const SERVICES: { key: ServiceKey; icon: ComponentType<SVGProps<SVGSVGElement>>; soon?: boolean }[] = [
  { key: 'alteration', icon: ScissorsIcon },
  { key: 'repair', icon: NeedleIcon },
  { key: 'custom', icon: RulerIcon },
  { key: 'fabric', icon: FabricIcon, soon: true },
];

const STEPS = ['one', 'two', 'three'] as const;

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('home');

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="mx-auto max-w-content px-4 pb-20 pt-16 sm:px-6 sm:pt-24">
          <h1 className="max-w-3xl text-h1 sm:text-display">{t('hero.title')}</h1>
          <Stitch className="mt-6 w-48 text-gold" />
          <p className="mt-6 max-w-2xl text-body-l text-charcoal/80">{t('hero.subtitle')}</p>
          <div className="mt-10 flex flex-wrap gap-3">
            <Link href="/requests/new" className={buttonStyles({ size: 'lg' })}>
              {t('hero.primaryCta')}
            </Link>
            <Link href="/tailors" className={buttonStyles({ size: 'lg', variant: 'secondary' })}>
              {t('hero.secondaryCta')}
            </Link>
          </div>
        </div>
      </section>

      {/* Services */}
      <section aria-labelledby="services-title" className="bg-surface py-20">
        <div className="mx-auto max-w-content px-4 sm:px-6">
          <h2 id="services-title" className="text-h2">
            {t('services.title')}
          </h2>
          <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {SERVICES.map(({ key, icon: Icon, soon }) => (
              <li
                key={key}
                className="relative rounded-lg border border-line bg-cream p-6 transition-shadow hover:shadow-md"
              >
                <div className="mb-4 inline-flex rounded-md bg-gold/15 p-3 text-gold-ink">
                  <Icon />
                </div>
                <h3 className="text-h3">{t(`services.${key}.name`)}</h3>
                <p className="mt-2 text-body-s text-muted">{t(`services.${key}.description`)}</p>
                {soon && (
                  <span className="absolute end-4 top-4 rounded-full bg-mist px-2.5 py-0.5 text-caption text-info">
                    {t('services.fabric.badge')}
                  </span>
                )}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" aria-labelledby="steps-title" className="scroll-mt-20 py-20">
        <div className="mx-auto max-w-content px-4 sm:px-6">
          <h2 id="steps-title" className="text-h2">
            {t('steps.title')}
          </h2>
          <ol className="mt-10 grid gap-8 md:grid-cols-3">
            {STEPS.map((step, i) => (
              <li key={step} className="flex gap-4">
                <span
                  aria-hidden="true"
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-dashed border-gold font-display text-body-l font-bold text-ink"
                >
                  {(i + 1).toLocaleString(locale)}
                </span>
                <div>
                  <h3 className="text-h3">{t(`steps.${step}.title`)}</h3>
                  <p className="mt-1 text-body-m text-muted">{t(`steps.${step}.description`)}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* For tailors */}
      <section aria-labelledby="tailors-title" className="px-4 pb-20 sm:px-6">
        <div className="mx-auto flex max-w-content flex-col items-start gap-6 rounded-xl bg-ink p-8 sm:p-12 md:flex-row md:items-center md:justify-between">
          <div className="max-w-xl">
            <h2 id="tailors-title" className="text-h2 text-cream">
              {t('tailors.title')}
            </h2>
            <p className="mt-3 text-body-l text-cream/80">{t('tailors.description')}</p>
          </div>
          <Link href="/join" className={buttonStyles({ size: 'lg', className: 'shrink-0' })}>
            {t('tailors.cta')}
          </Link>
        </div>
      </section>
    </>
  );
}

/** A running stitch: the brand's thread motif, purely decorative. */
function Stitch({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 12" className={className} aria-hidden="true" focusable="false">
      <path
        d="M2 6 C 40 0, 60 12, 100 6 S 160 0, 198 6"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeDasharray="10 7"
      />
    </svg>
  );
}
