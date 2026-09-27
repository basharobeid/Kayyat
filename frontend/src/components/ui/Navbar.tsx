'use client';

import React, { useState } from 'react';
import { useLocale } from 'next-intl';
import { Link, usePathname, useRouter } from '@/i18n/routing';
import { useAuth } from '@/lib/auth-context';

export const Navbar: React.FC = () => {
  const locale = useLocale();
  const isAr = locale === 'ar';
  const router = useRouter();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, isLoading, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    setMobileMenuOpen(false);
    router.push('/');
  };

  const toggleLanguage = () => {
    const nextLocale = isAr ? 'en' : 'ar';
    router.replace(pathname, { locale: nextLocale });
  };

  return (
    <div className="fixed top-5 left-0 right-0 z-50 flex justify-center px-4 pointer-events-none">
      <header className="pointer-events-auto w-full max-w-4xl bg-[#12141A]/90 backdrop-blur-2xl border border-white/[0.15] shadow-[0_12px_40px_rgba(0,0,0,0.35)] rounded-full px-6 py-2.5 flex items-center justify-between transition-all duration-300">
        
        {/* Brand Logo & Links */}
        <div className="flex items-center gap-7">
          <Link href="/" className="flex items-center group py-0.5">
            {/* Pure White High-Resolution Logo */}
            <img
              src="/logo-white.png"
              alt="Khayyat Logo"
              className="h-10 sm:h-12 w-auto object-contain transition-transform duration-200 group-hover:scale-105 filter drop-shadow-sm"
            />
          </Link>

          <nav className="hidden md:flex items-center gap-5 text-[0.875rem] font-medium text-zinc-300">
            <Link href="/requests" className="hover:text-white transition-colors">
              {isAr ? 'عدّل ملابسك' : 'Alterations'}
            </Link>
            <Link href="/tailors" className="hover:text-white transition-colors">
              {isAr ? 'الخيّاطون المعتمدون' : 'Tailors'}
            </Link>
            <Link href="/fabrics" className="hover:text-white transition-colors">
              {isAr ? 'سوق الأقمشة' : 'Fabrics'}
            </Link>
            <Link href="/prices" className="hover:text-white transition-colors">
              {isAr ? 'الأسعار' : 'Prices'}
            </Link>
            <Link href="/orders" className="hover:text-white transition-colors">
              {isAr ? 'تتبع الطلب' : 'Track Order'}
            </Link>
            {user?.roles.includes('customer') && (
              <Link href="/requests/mine" className="hover:text-white transition-colors">
                {isAr ? 'طلباتي' : 'My Requests'}
              </Link>
            )}
          </nav>
        </div>

        {/* Action Buttons (Fix my clothes + Work with us) */}
        <div className="flex items-center gap-2.5">
          {/* Language Switcher */}
          <button
            onClick={toggleLanguage}
            className="px-2.5 py-1 text-[0.8rem] font-medium text-zinc-400 hover:text-white transition-colors"
          >
            {isAr ? 'English' : 'العربية'}
          </button>

          {/* Fix my clothes Pill */}
          <Link href="/requests" className="hidden sm:inline-block">
            <span className="inline-flex items-center justify-center px-4 py-1.5 rounded-full text-[0.8125rem] font-medium text-white bg-white/10 hover:bg-white/20 border border-white/20 transition-all shadow-xs">
              {isAr ? 'عدّل ملابسك' : 'Fix my clothes'}
            </span>
          </Link>

          {/* Work with us Pill */}
          <Link href="/dashboard/tailor">
            <span className="inline-flex items-center justify-center px-4 py-1.5 rounded-full text-[0.8125rem] font-semibold text-black bg-white hover:bg-zinc-200 transition-all shadow-sm">
              {isAr ? 'انضم كشريك' : 'Work with us'}
            </span>
          </Link>

          {/* Auth state (desktop) */}
          {!isLoading && (
            <div className="hidden sm:flex items-center gap-2">
              {user ? (
                <button
                  onClick={handleLogout}
                  className="px-3 py-1.5 text-[0.8rem] font-medium text-zinc-300 hover:text-white transition-colors"
                >
                  {isAr ? `خروج (${user.full_name.split(' ')[0]})` : `Log out (${user.full_name.split(' ')[0]})`}
                </button>
              ) : (
                <Link
                  href="/auth/login"
                  className="px-3 py-1.5 text-[0.8rem] font-medium text-zinc-300 hover:text-white transition-colors"
                >
                  {isAr ? 'تسجيل الدخول' : 'Sign in'}
                </Link>
              )}
            </div>
          )}

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-1.5 text-zinc-300 hover:text-white focus:outline-none"
            aria-label="Toggle menu"
          >
            <span className="text-xl">{mobileMenuOpen ? '✕' : '☰'}</span>
          </button>
        </div>
      </header>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="pointer-events-auto absolute top-16 left-4 right-4 bg-[#12141A]/95 backdrop-blur-2xl border border-white/15 rounded-3xl p-6 shadow-2xl space-y-4 md:hidden text-white">
          <nav className="flex flex-col gap-3 text-body-m font-medium text-zinc-300">
            <Link
              href="/"
              onClick={() => setMobileMenuOpen(false)}
              className="py-1 hover:text-white font-semibold"
            >
              {isAr ? 'الرئيسية' : 'Home'}
            </Link>
            <Link
              href="/requests"
              onClick={() => setMobileMenuOpen(false)}
              className="py-1 hover:text-white"
            >
              {isAr ? 'عدّل ملابسك (Sojo Flow)' : 'Fix my clothes'}
            </Link>
            <Link
              href="/tailors"
              onClick={() => setMobileMenuOpen(false)}
              className="py-1 hover:text-white"
            >
              {isAr ? 'الخيّاطون المعتمدون' : 'Tailors'}
            </Link>
            <Link
              href="/fabrics"
              onClick={() => setMobileMenuOpen(false)}
              className="py-1 hover:text-white"
            >
              {isAr ? 'سوق الأقمشة' : 'Fabrics'}
            </Link>
            <Link
              href="/prices"
              onClick={() => setMobileMenuOpen(false)}
              className="py-1 hover:text-white"
            >
              {isAr ? 'الأسعار' : 'Prices'}
            </Link>
            <Link
              href="/orders"
              onClick={() => setMobileMenuOpen(false)}
              className="py-1 hover:text-white"
            >
              {isAr ? 'تتبع الطلب' : 'Track Order'}
            </Link>
            {user?.roles.includes('customer') && (
              <Link
                href="/requests/mine"
                onClick={() => setMobileMenuOpen(false)}
                className="py-1 hover:text-white"
              >
                {isAr ? 'طلباتي' : 'My Requests'}
              </Link>
            )}
            {user ? (
              <button onClick={handleLogout} className="py-1 text-start hover:text-white">
                {isAr ? `تسجيل الخروج (${user.full_name.split(' ')[0]})` : `Sign out (${user.full_name.split(' ')[0]})`}
              </button>
            ) : (
              <Link
                href="/auth/login"
                onClick={() => setMobileMenuOpen(false)}
                className="py-1 hover:text-white"
              >
                {isAr ? 'تسجيل الدخول' : 'Sign In'}
              </Link>
            )}
            <Link
              href="/dashboard/tailor"
              onClick={() => setMobileMenuOpen(false)}
              className="py-1 hover:text-white font-bold text-white"
            >
              {isAr ? 'بوابة الشركاء والمشاغل' : 'Work with us'}
            </Link>
          </nav>
        </div>
      )}
    </div>
  );
};
