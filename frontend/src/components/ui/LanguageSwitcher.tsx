'use client';

import React from 'react';
import { useLocale } from 'next-intl';
import { usePathname, useRouter } from '@/i18n/routing';

export const LanguageSwitcher: React.FC = () => {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  const toggleLanguage = () => {
    const nextLocale = locale === 'ar' ? 'en' : 'ar';
    router.replace(pathname, { locale: nextLocale });
  };

  return (
    <button
      onClick={toggleLanguage}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-line text-body-s font-medium text-charcoal bg-surface hover:bg-mist transition-colors"
      title="Switch Language / تغيير اللغة"
    >
      <span className="text-base">🌐</span>
      <span>{locale === 'ar' ? 'English' : 'العربية'}</span>
    </button>
  );
};
