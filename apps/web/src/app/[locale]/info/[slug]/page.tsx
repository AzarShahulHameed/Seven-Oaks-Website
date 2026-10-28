import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { isLocale } from '@/lib/i18n';
import { EntryRoute, entryMetadata } from '@/components/entry-route';

type Props = { params: { locale: string; slug: string } };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return isLocale(params.locale) ? entryMetadata(params.locale, 'info', params.slug) : {};
}

export default async function InfoRoute({ params }: Props) {
  if (!isLocale(params.locale)) notFound();
  const v = await EntryRoute({ locale: params.locale, folder: 'info', slug: params.slug });
  if (!v) notFound();
  return v;
}
