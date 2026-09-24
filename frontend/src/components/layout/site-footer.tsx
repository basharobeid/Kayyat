import { useTranslations } from 'next-intl';

export function SiteFooter() {
  const t = useTranslations();

  return (
    <footer className="border-t border-line bg-ink text-cream">
      <div className="mx-auto flex max-w-content flex-col gap-2 px-4 py-10 sm:px-6">
        <p className="font-display text-h3 text-cream">{t('brand.name')}</p>
        <p className="text-body-s text-cream/80">{t('footer.tagline')}</p>
        <p className="mt-4 text-caption text-cream/70">
          {t('footer.rights', { year: new Date().getFullYear() })}
        </p>
      </div>
    </footer>
  );
}
