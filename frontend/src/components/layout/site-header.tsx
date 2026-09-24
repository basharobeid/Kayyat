import { useTranslations } from 'next-intl';

import { buttonStyles } from '@/components/ui/button';
import { Link } from '@/i18n/routing';

import { LocaleSwitcher } from './locale-switcher';

export function SiteHeader() {
  const t = useTranslations();

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-cream/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-content items-center gap-6 px-4 sm:px-6">
        <Link href="/" className="font-display text-h3 font-bold text-ink">
          {t('brand.name')}
          <span className="text-gold" aria-hidden="true">
            .
          </span>
        </Link>

        <nav aria-label={t('nav.label')} className="hidden md:block">
          <ul className="flex items-center gap-1 text-body-s">
            <li>
              <Link href="/tailors" className={buttonStyles({ variant: 'ghost', size: 'sm' })}>
                {t('nav.tailors')}
              </Link>
            </li>
            <li>
              <Link href="/#how-it-works" className={buttonStyles({ variant: 'ghost', size: 'sm' })}>
                {t('nav.howItWorks')}
              </Link>
            </li>
            <li>
              <Link href="/join" className={buttonStyles({ variant: 'ghost', size: 'sm' })}>
                {t('nav.forTailors')}
              </Link>
            </li>
          </ul>
        </nav>

        <div className="ms-auto flex items-center gap-2">
          <LocaleSwitcher />
          <Link href="/requests/new" className={buttonStyles({ size: 'sm' })}>
            {t('nav.requestService')}
          </Link>
        </div>
      </div>
    </header>
  );
}
