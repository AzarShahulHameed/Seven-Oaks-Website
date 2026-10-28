import { getBootstrap } from '@/lib/api';
import { PreviewClient } from './PreviewClient';

export const dynamic = 'force-dynamic';
export default async function PreviewPage() {
  const b = (await getBootstrap()) ?? { theme: {}, settings: {}, menus: {} };
  return <PreviewClient b={b as any} />;
}
