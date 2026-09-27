'use client';

import { useLocale } from 'next-intl';
import { ComingSoon } from '@/components/ui/ComingSoon';

export default function TermsPage() {
  const isAr = useLocale() === 'ar';
  return (
    <div className="pt-24">
      <ComingSoon featureName={isAr ? 'شروط الاستخدام' : 'Terms of Service'} />
    </div>
  );
}
