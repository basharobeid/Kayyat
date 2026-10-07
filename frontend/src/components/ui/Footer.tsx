import React from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { Link } from '@/i18n/routing';

export const Footer: React.FC = () => {
  const t = useTranslations('footer');
  const locale = useLocale();
  const isAr = locale === 'ar';

  return (
    <footer className="bg-[#12141A] text-zinc-400 border-t border-white/10 pt-16 pb-12">
      <div className="max-w-6xl mx-auto px-4 space-y-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          
          {/* Brand Info */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <img
                src="/logo-white.png"
                alt="Khayyat Logo"
                className="h-10 sm:h-12 w-auto object-contain opacity-95"
              />
            </div>
            <p className="text-sm text-zinc-400 max-w-sm leading-relaxed">
              {isAr
                ? 'المنصة الرقمية المتكاملة لحلول العناية بالملابس، التعديل الاحترافي، والتوصيل لباب بيتك.'
                : 'The modern clothing care and alterations platform. Better fit, longer garment lifespans, zero hassle.'}
            </p>
          </div>

          {/* Customer links */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold text-white uppercase tracking-wider">
              {isAr ? 'الخدمات' : 'Services'}
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/book" className="hover:text-white transition-colors">
                  {isAr ? 'طلب تعديل ملابس' : 'Fix an item'}
                </Link>
              </li>
              <li>
                <Link href="/tailors" className="hover:text-white transition-colors">
                  {isAr ? 'الخيّاطون المعتمدون' : 'Vetted Tailors'}
                </Link>
              </li>
              <li>
                <Link href="/fabrics" className="hover:text-white transition-colors">
                  {isAr ? 'سوق الأقمشة' : 'Fabric stores'}
                </Link>
              </li>
              <li>
                <Link href="/book?service=quick_fix" className="hover:text-white transition-colors">
                  {isAr ? 'تصليح سريع' : 'Quick fix'}
                </Link>
              </li>
              <li>
                <Link href="/account" className="hover:text-white transition-colors">
                  {isAr ? 'تتبع حالة الطلب' : 'Track Order'}
                </Link>
              </li>
            </ul>
          </div>

          {/* Business links */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold text-white uppercase tracking-wider">
              {isAr ? 'الأعمال والشراكات' : 'Business & Partners'}
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/dashboard/tailor" className="hover:text-white transition-colors">
                  {isAr ? 'انضم كمشغل شريك' : 'Tailor Partner Portal'}
                </Link>
              </li>
              <li>
                <Link href="/dashboard/tailor" className="hover:text-white transition-colors">
                  {isAr ? 'حلول متاجر الأزياء (B2B)' : 'Retail Solutions'}
                </Link>
              </li>
              <li>
                <Link href="/about" className="hover:text-white transition-colors">
                  {isAr ? 'عن خيّاط' : 'About Khayyat'}
                </Link>
              </li>
              <li>
                <Link href="/prices" className="hover:text-white transition-colors">
                  {isAr ? 'الأسعار' : 'Prices'}
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-white/10 pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-zinc-500 gap-4">
          <p>© {new Date().getFullYear()} KHAYYAT. {t('rights')}.</p>
          <div className="flex items-center gap-6">
            <Link href="/privacy" className="hover:text-zinc-300 transition-colors">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-zinc-300 transition-colors">Terms of Service</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};
