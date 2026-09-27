import React from 'react';
import { useTranslations } from 'next-intl';
import { Button } from './Button';
import { Link } from '@/i18n/routing';

export interface ComingSoonProps {
  featureName?: string;
}

export const ComingSoon: React.FC<ComingSoonProps> = ({ featureName }) => {
  const t = useTranslations('comingSoon');

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4 py-12">
      <div className="w-20 h-20 bg-gold/10 text-gold-ink rounded-full flex items-center justify-center text-3xl mb-6 shadow-inner">
        🧵
      </div>
      <h1 className="text-h1 font-bold text-ink mb-3">
        {featureName ? `${featureName} — ${t('title')}` : t('title')}
      </h1>
      <p className="text-body-l text-muted max-w-md mb-8">
        {t('subtitle')}
      </p>
      <Link href="/">
        <Button variant="primary" size="md">
          {t('backHome')}
        </Button>
      </Link>
    </div>
  );
};
