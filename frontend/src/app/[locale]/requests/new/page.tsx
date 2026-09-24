import { getTranslations, setRequestLocale } from 'next-intl/server';

import { ComingSoon } from '@/components/shared/coming-soon';

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'pages' });
  return { title: t('newRequest') };
}

export default async function NewRequestPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('pages');
  return <ComingSoon title={t('newRequest')} />;
}
