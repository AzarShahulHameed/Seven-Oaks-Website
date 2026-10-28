import '../globals.css';
import { getBootstrap } from '@/lib/api';
import { fontUrls, tokensToCss } from '@/lib/theme';

export const metadata = { title: 'Preview', robots: { index: false, follow: false } };

/** Draft preview shown inside the admin editor. It only displays what the editor sends it; it never reads unpublished data itself. */
export default async function PreviewLayout({ children }: { children: React.ReactNode }) {
  const b = (await getBootstrap()) ?? { theme: {} };
  return (
    <html lang="en" dir="ltr">
      <head>
        {fontUrls(b.theme).map((u) => <link key={u} rel="stylesheet" href={u} />)}
        <style dangerouslySetInnerHTML={{ __html: tokensToCss(b.theme) }} />
      </head>
      <body className="min-h-screen bg-canvas text-ink antialiased">{children}</body>
    </html>
  );
}
