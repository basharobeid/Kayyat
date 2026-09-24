import { hasLocale } from 'next-intl';
import { createNavigation } from 'next-intl/navigation';
import { defineRouting } from 'next-intl/routing';

export const routing = defineRouting({
  locales: ['ar', 'en'],
  defaultLocale: 'ar',
});

export type Locale = (typeof routing.locales)[number];

export const localeDirection: Record<Locale, 'rtl' | 'ltr'> = {
  ar: 'rtl',
  en: 'ltr',
};

export function isLocale(value: string | undefined): value is Locale {
  return hasLocale(routing.locales, value);
}

// Locale-aware wrappers: <Link href="/tailors"> becomes /ar/tailors or /en/tailors.
export const { Link, redirect, usePathname, useRouter, getPathname } = createNavigation(routing);
