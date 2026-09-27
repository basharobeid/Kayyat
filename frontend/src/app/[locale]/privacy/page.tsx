'use client';

import { useLocale } from 'next-intl';
import { ComingSoon } from '@/components/ui/ComingSoon';

export default function PrivacyPage() {
  const isAr = useLocale() === 'ar';
  return (
    <div className="pt-24">
      <ComingSoon featureName={isAr ? 'سياسة الخصوصية' : 'Privacy Policy'} />
    </div>
  );
}
