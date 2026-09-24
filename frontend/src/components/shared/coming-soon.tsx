import { useTranslations } from 'next-intl';

import { buttonStyles } from '@/components/ui/button';
import { Link } from '@/i18n/routing';

import { NeedleIcon } from './icons';

/** Honest placeholder for routes that exist in navigation but aren't built yet. */
export function ComingSoon({ title }: { title: string }) {
  const t = useTranslations('comingSoon');

  return (
    <section className="mx-auto flex max-w-content flex-col items-center px-4 py-24 text-center sm:px-6">
      <div className="mb-6 rounded-full bg-gold/15 p-4 text-gold-ink">
        <NeedleIcon width={32} height={32} />
      </div>
      <span className="mb-3 rounded-full bg-gold/15 px-3 py-1 text-caption text-gold-ink">
        {t('badge')}
      </span>
      <h1 className="text-h1">{title}</h1>
      <p className="mt-2 text-body-l text-ink">{t('title')}</p>
      <p className="mt-2 max-w-md text-body-m text-muted">{t('description')}</p>
      <Link href="/" className={buttonStyles({ variant: 'secondary', className: 'mt-8' })}>
        {t('back')}
      </Link>
    </section>
  );
}
