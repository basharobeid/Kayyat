'use client';

import { useLocale, useTranslations } from 'next-intl';

import { buttonStyles } from '@/components/ui/button';
import { Link, usePathname } from '@/i18n/routing';

export function LocaleSwitcher() {
  const t = useTranslations('locale');
  const locale = useLocale();
  const pathname = usePathname();
  const target = locale === 'ar' ? 'en' : 'ar';

  return (
    <Link
      href={pathname}
      locale={target}
      lang={target}
      hrefLang={target}
      aria-label={t('switchLabel')}
      className={buttonStyles({ variant: 'ghost', size: 'sm' })}
    >
      {t('switchTo')}
    </Link>
  );
}
