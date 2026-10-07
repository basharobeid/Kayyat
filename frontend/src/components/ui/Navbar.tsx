'use client';

import React, { useEffect, useState } from 'react';
import { useLocale } from 'next-intl';
import { Link, usePathname, useRouter } from '@/i18n/routing';
import { useAuth } from '@/lib/auth-context';
import { notificationsApi } from '@/lib/api';

export const Navbar: React.FC = () => {
  const locale = useLocale();
  const isAr = locale === 'ar';
  const router = useRouter();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const { user, isLoading, logout } = useAuth();
  const isStaff = !!user?.roles.includes('admin');

  useEffect(() => {
    if (!user) return;
    const load = () => notificationsApi.unread().then((r) => setUnread(r.unread)).catch(() => {});
    load();
    const t = setInterval(load, 30000);
    return () => clearInterval(t);
  }, [user, pathname]);

  const handleLogout = async () => {
    await logout();
    setMobileMenuOpen(false);
    router.push('/');
  };

  const toggleLanguage = () => {
    router.replace(pathname, { locale: isAr ? 'en' : 'ar' });
  };

  const links = [
    { href: '/#services', ar: 'الخدمات', en: 'Services' },
    { href: '/book?service=quick_fix', ar: 'تصليح سريع', en: 'Quick fix' },
    { href: '/prices', ar: 'الأسعار', en: 'Prices' },
    { href: '/about', ar: 'عن خيّاط', en: 'About' },
    ...(user ? [{ href: '/account', ar: 'حجوزاتي', en: 'My bookings' }] : []),
    ...(isStaff ? [{ href: '/staff', ar: 'لوحة الفريق', en: 'Staff' }] : []),
  ];

  return (
    <div className="fixed top-5 left-0 right-0 z-50 flex justify-center px-4 pointer-events-none">
      <header className="pointer-events-auto w-full max-w-5xl whitespace-nowrap bg-[#12141A]/90 backdrop-blur-2xl border border-white/[0.15] shadow-[0_12px_40px_rgba(0,0,0,0.35)] rounded-full px-6 py-2.5 flex items-center justify-between gap-4 transition-all duration-300">
        <div className="flex items-center gap-7">
          <Link href="/" className="flex items-center group py-0.5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo-white.png"
              alt="Khayyat"
              className="h-10 sm:h-12 w-auto object-contain transition-transform duration-200 group-hover:scale-105"
            />
          </Link>
          <nav className="hidden lg:flex items-center gap-5 text-[0.875rem] font-medium text-zinc-300">
            {links.map((l) => (
              <Link key={l.href} href={l.href} className="hover:text-white transition-colors">
                {isAr ? l.ar : l.en}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-2.5">
          <button onClick={toggleLanguage} className="px-2 py-1 text-[0.8rem] font-medium text-zinc-400 hover:text-white transition-colors">
            {isAr ? 'English' : 'العربية'}
          </button>

          {user && (
            <Link href="/account?tab=notifications" className="relative p-1.5 text-zinc-300 hover:text-white" aria-label={isAr ? 'الإشعارات' : 'Notifications'}>
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
                <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
              </svg>
              {user && unread > 0 && (
                <span className="absolute -top-0.5 -end-0.5 min-w-[18px] h-[18px] rounded-full bg-gold px-1 text-[10px] font-bold leading-[18px] text-black text-center">
                  {unread > 9 ? '9+' : unread}
                </span>
              )}
            </Link>
          )}

          <Link href="/book">
            <span className="inline-flex items-center justify-center px-4 py-1.5 rounded-full text-[0.8125rem] font-semibold text-black bg-white hover:bg-zinc-200 transition-all shadow-sm">
              {isAr ? 'احجز الآن' : 'Book now'}
            </span>
          </Link>

          {!isLoading && (
            <div className="hidden sm:flex items-center">
              {user ? (
                <button onClick={handleLogout} className="px-2 py-1.5 text-[0.8rem] font-medium text-zinc-300 hover:text-white transition-colors">
                  {isAr ? 'خروج' : 'Log out'}
                </button>
              ) : (
                <Link href="/auth/login" className="px-2 py-1.5 text-[0.8rem] font-medium text-zinc-300 hover:text-white transition-colors">
                  {isAr ? 'تسجيل الدخول' : 'Sign in'}
                </Link>
              )}
            </div>
          )}

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-1.5 text-zinc-300 hover:text-white focus:outline-none"
            aria-label="Toggle menu"
          >
            <span className="text-xl">{mobileMenuOpen ? '✕' : '☰'}</span>
          </button>
        </div>
      </header>

      {mobileMenuOpen && (
        <div className="pointer-events-auto absolute top-20 left-4 right-4 bg-[#12141A]/95 backdrop-blur-2xl border border-white/15 rounded-3xl p-6 shadow-2xl lg:hidden text-white">
          <nav className="flex flex-col gap-3 text-body-m font-medium text-zinc-300">
            <Link href="/" onClick={() => setMobileMenuOpen(false)} className="py-1 hover:text-white font-semibold">
              {isAr ? 'الرئيسية' : 'Home'}
            </Link>
            {links.map((l) => (
              <Link key={l.href} href={l.href} onClick={() => setMobileMenuOpen(false)} className="py-1 hover:text-white">
                {isAr ? l.ar : l.en}
              </Link>
            ))}
            {user ? (
              <button onClick={handleLogout} className="py-1 text-start hover:text-white">
                {isAr ? `تسجيل الخروج (${user.full_name.split(' ')[0]})` : `Sign out (${user.full_name.split(' ')[0]})`}
              </button>
            ) : (
              <Link href="/auth/login" onClick={() => setMobileMenuOpen(false)} className="py-1 hover:text-white">
                {isAr ? 'تسجيل الدخول' : 'Sign in'}
              </Link>
            )}
          </nav>
        </div>
      )}
    </div>
  );
};
